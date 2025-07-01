"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMHelper = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
class LLMHelper {
    client;
    currentModel = "claude-3-5-sonnet-20241022";
    systemPrompt = `You are Wingman AI, a helpful assistant. For any input, provide a clear problem analysis and concise actionable suggestions. Be direct and efficient.`;
    constructor(apiKey) {
        this.client = new sdk_1.default({
            apiKey: apiKey,
        });
    }
    setModel(model) {
        this.currentModel = model;
        console.log(`[LLMHelper] Switched to model: ${model}`);
    }
    getCurrentModel() {
        return this.currentModel;
    }
    getModelDisplayName(model) {
        const modelToCheck = model || this.currentModel;
        switch (modelToCheck) {
            case "claude-3-5-sonnet-20241022":
                return "Claude 3.5 Sonnet";
            case "claude-3-5-haiku-20241022":
                return "Claude 3.5 Haiku";
            case "claude-3-opus-20240229":
                return "Claude 3 Opus";
            case "claude-3-sonnet-20240229":
                return "Claude 3 Sonnet";
            case "claude-3-haiku-20240307":
                return "Claude 3 Haiku";
            case "claude-3-7-sonnet-20250219":
                return "Claude 3.7 Sonnet";
            case "claude-sonnet-4-20250514":
                return "Claude Sonnet 4";
            case "claude-opus-4-20250514":
                return "Claude Opus 4";
            default:
                return "Claude 3.5 Sonnet";
        }
    }
    detectImageMimeType(imageData) {
        // Check for common image signatures
        if (imageData.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
            return "image/png";
        }
        if (imageData.subarray(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]))) {
            return "image/jpeg";
        }
        if (imageData.subarray(0, 6).equals(Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61])) ||
            imageData.subarray(0, 6).equals(Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))) {
            return "image/gif";
        }
        if (imageData.subarray(0, 12).includes(Buffer.from([0x57, 0x45, 0x42, 0x50]))) {
            return "image/webp";
        }
        // Default to jpeg as that's what the screenshots actually are
        return "image/jpeg";
    }
    cleanJsonResponse(text) {
        // Remove markdown code block syntax if present
        text = text.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
        // Remove any leading/trailing whitespace
        text = text.trim();
        return text;
    }
    async compressImage(imageData) {
        try {
            // Compress image to reduce payload size and processing time
            return await (0, sharp_1.default)(imageData)
                .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
                .jpeg({
                quality: 75,
                progressive: true
            })
                .toBuffer();
        }
        catch (error) {
            console.log(`[LLMHelper] Image compression failed, using original:`, error);
            return imageData;
        }
    }
    getOptimalTokenLimit(model) {
        // Use smaller token limits for faster responses
        if (model.includes('haiku'))
            return 1024;
        if (model.includes('3.5'))
            return 2048;
        return 3072;
    }
    getOptimalModel() {
        // Auto-select fastest model for better performance
        return "claude-3-5-haiku-20241022";
    }
    async extractProblemFromImages(imagePaths) {
        try {
            const imageContents = await Promise.all(imagePaths.map(async (path) => {
                const originalImageData = await fs_1.default.promises.readFile(path);
                const compressedImageData = await this.compressImage(originalImageData);
                const mimeType = this.detectImageMimeType(compressedImageData);
                console.log(`[LLMHelper] Compressed image ${path}: ${originalImageData.length} -> ${compressedImageData.length} bytes`);
                return {
                    type: "image",
                    source: {
                        type: "base64",
                        media_type: "image/jpeg", // Always JPEG after compression
                        data: compressedImageData.toString("base64")
                    }
                };
            }));
            // Simplified, faster prompt
            const prompt = `Analyze these images and respond in JSON format:
{
  "problem_statement": "What problem/situation is shown?",
  "context": "Key details from the images",
  "suggested_responses": ["Action 1", "Action 2", "Action 3"],
  "reasoning": "Why these suggestions?"
}
Return ONLY the JSON object.`;
            const optimalModel = this.currentModel.includes('haiku') ? this.currentModel : this.getOptimalModel();
            const tokenLimit = this.getOptimalTokenLimit(optimalModel);
            const message = await this.client.messages.create({
                model: optimalModel,
                max_tokens: tokenLimit,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            ...imageContents
                        ]
                    }
                ]
            });
            const text = this.cleanJsonResponse(message.content[0].type === 'text' ? message.content[0].text : '');
            return JSON.parse(text);
        }
        catch (error) {
            console.error("Error extracting problem from images:", error);
            throw error;
        }
    }
    async generateSolution(problemInfo) {
        // Simplified, faster prompt
        const prompt = `Problem: ${problemInfo.problem_statement}
Context: ${problemInfo.context}

Provide solution in JSON:
{
  "solution": {
    "code": "Direct solution/answer",
    "problem_statement": "Brief problem restatement",
    "context": "Key context",
    "suggested_responses": ["Solution 1", "Solution 2", "Solution 3"],
    "reasoning": "Why this approach works"
  }
}
Return ONLY the JSON.`;
        console.log("[LLMHelper] Calling Claude LLM for solution...");
        try {
            const tokenLimit = this.getOptimalTokenLimit(this.currentModel);
            const message = await this.client.messages.create({
                model: this.currentModel,
                max_tokens: tokenLimit,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });
            console.log("[LLMHelper] Claude LLM returned result.");
            const text = this.cleanJsonResponse(message.content[0].type === 'text' ? message.content[0].text : '');
            const parsed = JSON.parse(text);
            console.log("[LLMHelper] Parsed LLM response:", parsed);
            return parsed;
        }
        catch (error) {
            console.error("[LLMHelper] Error in generateSolution:", error);
            throw error;
        }
    }
    setSpeedMode(enabled) {
        // When speed mode is enabled, use fastest model and smallest tokens
        if (enabled) {
            console.log("[LLMHelper] Speed mode enabled - using optimized settings");
        }
    }
    async debugSolutionWithImages(problemInfo, currentCode, debugImagePaths) {
        try {
            const imageContents = await Promise.all(debugImagePaths.map(async (path) => {
                const originalImageData = await fs_1.default.promises.readFile(path);
                const compressedImageData = await this.compressImage(originalImageData);
                console.log(`[LLMHelper] Compressed debug image ${path}: ${originalImageData.length} -> ${compressedImageData.length} bytes`);
                return {
                    type: "image",
                    source: {
                        type: "base64",
                        media_type: this.detectImageMimeType(compressedImageData),
                        data: compressedImageData.toString('base64')
                    }
                };
            }));
            const prompt = `${this.systemPrompt}

Given this problem context:
${JSON.stringify(problemInfo, null, 2)}

Current code solution:
\`\`\`
${currentCode}
\`\`\`

Please analyze the debug images and provide an improved solution in the following JSON format:
{
  "solution": {
    "code": "The improved/corrected code here.",
    "problem_statement": "Restate the problem or situation.",
    "context": "What issues were identified from the debug images.",
    "suggested_responses": ["First improvement", "Second improvement", "..."],
    "reasoning": "Explanation of the improvements made."
  }
}

Important: Return ONLY the JSON object, without any markdown formatting or code blocks.`;
            console.log("[LLMHelper] Calling Claude LLM for debug analysis...");
            const message = await this.client.messages.create({
                model: this.currentModel,
                max_tokens: this.getOptimalTokenLimit(this.currentModel),
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            ...imageContents
                        ]
                    }
                ]
            });
            const text = message.content[0].type === 'text' ? message.content[0].text : '';
            const parsed = JSON.parse(text);
            console.log("[LLMHelper] Parsed debug LLM response:", parsed);
            return parsed;
        }
        catch (error) {
            console.error("Error debugging solution with images:", error);
            throw error;
        }
    }
    async analyzeErrorText(problemInfo, currentCode, errorText) {
        try {
            const prompt = `${this.systemPrompt}

Given this problem context:
${JSON.stringify(problemInfo, null, 2)}

Current code solution:
\`\`\`
${currentCode}
\`\`\`

Error message encountered:
\`\`\`
${errorText}
\`\`\`

Please analyze the error and provide a corrected solution in the following JSON format:
{
  "solution": {
    "code": "The corrected code that fixes the error.",
    "problem_statement": "Restate the problem.",
    "context": "Analysis of what caused the error.",
    "suggested_responses": ["First fix explanation", "Second improvement", "..."],
    "reasoning": "Detailed explanation of the error cause and how the fix addresses it."
  }
}

Focus on:
1. Identifying the root cause of the error
2. Providing a working solution that compiles/runs correctly
3. Explaining what was wrong and why the fix works
4. Suggesting best practices to avoid similar errors

Important: Return ONLY the JSON object, without any markdown formatting or code blocks.`;
            console.log("[LLMHelper] Calling Claude LLM for error analysis...");
            const message = await this.client.messages.create({
                model: this.currentModel,
                max_tokens: this.getOptimalTokenLimit(this.currentModel),
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });
            const text = message.content[0].type === 'text' ? message.content[0].text : '';
            const parsed = JSON.parse(text);
            console.log("[LLMHelper] Parsed error analysis response:", parsed);
            return parsed;
        }
        catch (error) {
            console.error("Error analyzing error text:", error);
            throw error;
        }
    }
    async analyzeAudioFile(audioPath) {
        try {
            // Note: Claude doesn't support audio directly, so we'll need to handle this differently
            // For now, we'll return a placeholder response
            const prompt = `${this.systemPrompt}\n\nI need to analyze an audio file, but Claude doesn't support audio input directly. Please provide a general response about audio analysis limitations and suggest alternative approaches.`;
            const message = await this.client.messages.create({
                model: this.currentModel,
                max_tokens: 1024,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });
            const text = message.content[0].type === 'text' ? message.content[0].text : 'Unable to analyze audio file.';
            return { text, timestamp: Date.now() };
        }
        catch (error) {
            console.error("Error analyzing audio file:", error);
            throw error;
        }
    }
    async analyzeAudioFromBase64(data, mimeType) {
        try {
            // Note: Claude doesn't support audio directly, so we'll need to handle this differently
            const prompt = `${this.systemPrompt}\n\nI need to analyze audio data, but Claude doesn't support audio input directly. Please provide a general response about audio analysis limitations and suggest alternative approaches.`;
            const message = await this.client.messages.create({
                model: this.currentModel,
                max_tokens: 1024,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });
            const text = message.content[0].type === 'text' ? message.content[0].text : 'Unable to analyze audio data.';
            return { text, timestamp: Date.now() };
        }
        catch (error) {
            console.error("Error analyzing audio from base64:", error);
            throw error;
        }
    }
    async analyzeImageFile(imagePath) {
        try {
            const imageData = await fs_1.default.promises.readFile(imagePath);
            const mimeType = this.detectImageMimeType(imageData);
            console.log(`[LLMHelper] Detected mime type for ${imagePath}: ${mimeType}`);
            const prompt = `${this.systemPrompt}\n\nDescribe the content of this image in a short, concise answer. In addition to your main answer, suggest several possible actions or responses the user could take next based on the image. Do not return a structured JSON object, just answer naturally as you would to a user. Be concise and brief.`;
            const message = await this.client.messages.create({
                model: this.currentModel,
                max_tokens: 1024,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            {
                                type: "image",
                                source: {
                                    type: "base64",
                                    media_type: mimeType,
                                    data: imageData.toString("base64")
                                }
                            }
                        ]
                    }
                ]
            });
            const text = message.content[0].type === 'text' ? message.content[0].text : 'Unable to analyze image.';
            return { text, timestamp: Date.now() };
        }
        catch (error) {
            console.error("Error analyzing image file:", error);
            throw error;
        }
    }
}
exports.LLMHelper = LLMHelper;
//# sourceMappingURL=LLMHelper.js.map