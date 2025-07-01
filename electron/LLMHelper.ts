import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"
import fs from "fs"
import sharp from "sharp"

export type GeminiModel = 
  | "gemini-2.0-flash-exp" 
  | "gemini-1.5-pro-latest"
  | "gemini-1.5-flash-latest"
  | "gemini-1.5-flash"
  | "gemini-1.5-pro"
  | "gemini-1.0-pro"

export class LLMHelper {
  private client: GoogleGenerativeAI
  private currentModel: GeminiModel = "gemini-1.5-flash-latest"
  private readonly systemPrompt = `You are Wingman AI, a helpful assistant. For any input, provide a clear problem analysis and concise actionable suggestions. Be direct and efficient.`

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey)
  }

  public setModel(model: GeminiModel): void {
    this.currentModel = model
    console.log(`[LLMHelper] Switched to model: ${model}`)
  }

  public getCurrentModel(): GeminiModel {
    return this.currentModel
  }

  public getModelDisplayName(model?: GeminiModel): string {
    const modelToCheck = model || this.currentModel
    switch (modelToCheck) {
      case "gemini-2.0-flash-exp":
        return "Gemini 2.0 Flash Experimental"
      case "gemini-1.5-pro-latest":
        return "Gemini 1.5 Pro"
      case "gemini-1.5-flash-latest":
        return "Gemini 1.5 Flash"
      case "gemini-1.5-flash":
        return "Gemini 1.5 Flash"
      case "gemini-1.5-pro":
        return "Gemini 1.5 Pro"
      case "gemini-1.0-pro":
        return "Gemini 1.0 Pro"
      default:
        return "Gemini 1.5 Flash"
    }
  }

  private detectImageMimeType(imageData: Buffer): string {
    // Check for common image signatures
    if (imageData.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
      return "image/png"
    }
    if (imageData.subarray(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]))) {
      return "image/jpeg"
    }
    if (imageData.subarray(0, 6).equals(Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61])) ||
        imageData.subarray(0, 6).equals(Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))) {
      return "image/gif"
    }
    if (imageData.subarray(0, 12).includes(Buffer.from([0x57, 0x45, 0x42, 0x50]))) {
      return "image/webp"
    }
    
    // Default to jpeg as that's what the screenshots actually are
    return "image/jpeg"
  }

  private cleanJsonResponse(text: string): string {
    // Remove markdown code block syntax if present
    text = text.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    // Remove any leading/trailing whitespace
    text = text.trim();
    return text;
  }

  private async compressImage(imageData: Buffer): Promise<Buffer> {
    try {
      // Compress image to reduce payload size and processing time
      return await sharp(imageData)
        .resize(1200, 1200, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 75, 
          progressive: true 
        })
        .toBuffer()
    } catch (error) {
      console.log(`[LLMHelper] Image compression failed, using original:`, error)
      return imageData
    }
  }

  private getOptimalTokenLimit(model: GeminiModel): number {
    // Use smaller token limits for faster responses
    if (model.includes('flash')) return 2048
    if (model.includes('1.5')) return 3072
    return 4096
  }

  private getOptimalModel(): GeminiModel {
    // Auto-select fastest model for better performance
    return "gemini-1.5-flash-latest"
  }

  public async extractProblemFromImages(imagePaths: string[]) {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.currentModel,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          }
        ],
        generationConfig: {
          maxOutputTokens: this.getOptimalTokenLimit(this.currentModel),
          temperature: 0.1,
        }
      })

      const imageContents = await Promise.all(imagePaths.map(async (path) => {
        const originalImageData = await fs.promises.readFile(path)
        const compressedImageData = await this.compressImage(originalImageData)
        const mimeType = this.detectImageMimeType(compressedImageData)
        console.log(`[LLMHelper] Compressed image ${path}: ${originalImageData.length} -> ${compressedImageData.length} bytes`)
        return {
          inlineData: {
            data: compressedImageData.toString("base64"),
            mimeType: mimeType
          }
        }
      }))
      
      // Simplified, faster prompt
      const prompt = `Analyze these images and respond in JSON format:
{
  "problem_statement": "What problem/situation is shown?",
  "context": "Key details from the images",
  "suggested_responses": ["Action 1", "Action 2", "Action 3"],
  "reasoning": "Why these suggestions?"
}
Return ONLY the JSON object.`

      const result = await model.generateContent([
        prompt,
        ...imageContents
      ])
      const response = await result.response
      const text = response.text()

      const cleanedText = this.cleanJsonResponse(text)
      return JSON.parse(cleanedText)
    } catch (error) {
      console.error("Error extracting problem from images:", error)
      throw error
    }
  }

  public async generateSolution(problemInfo: any) {
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
Return ONLY the JSON.`

    console.log("[LLMHelper] Calling Gemini LLM for solution...");
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.currentModel,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          }
        ],
        generationConfig: {
          maxOutputTokens: this.getOptimalTokenLimit(this.currentModel),
          temperature: 0.1,
        }
      })

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      console.log("[LLMHelper] Gemini LLM returned result.");
      const cleanedText = this.cleanJsonResponse(text)
      const parsed = JSON.parse(cleanedText)
      console.log("[LLMHelper] Parsed LLM response:", parsed)
      return parsed
    } catch (error) {
      console.error("[LLMHelper] Error in generateSolution:", error);
      throw error;
    }
  }

  public setSpeedMode(enabled: boolean): void {
    // When speed mode is enabled, use fastest model and smallest tokens
    if (enabled) {
      console.log("[LLMHelper] Speed mode enabled - using optimized settings")
    }
  }

  public async debugSolutionWithImages(problemInfo: any, currentCode: string, debugImagePaths: string[]) {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.currentModel,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          }
        ],
        generationConfig: {
          maxOutputTokens: this.getOptimalTokenLimit(this.currentModel),
          temperature: 0.1,
        }
      })

      const imageContents = await Promise.all(debugImagePaths.map(async (path) => {
        const originalImageData = await fs.promises.readFile(path)
        const compressedImageData = await this.compressImage(originalImageData)
        console.log(`[LLMHelper] Compressed debug image ${path}: ${originalImageData.length} -> ${compressedImageData.length} bytes`)
        return {
          inlineData: {
            data: compressedImageData.toString('base64'),
            mimeType: this.detectImageMimeType(compressedImageData)
          }
        }
      }))

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

Important: Return ONLY the JSON object, without any markdown formatting or code blocks.`

      console.log("[LLMHelper] Calling Gemini LLM for debug analysis...")
      const result = await model.generateContent([
        prompt,
        ...imageContents
      ])
      const response = await result.response
      const text = response.text()

      const cleanedText = this.cleanJsonResponse(text)
      const parsed = JSON.parse(cleanedText)
      console.log("[LLMHelper] Parsed debug LLM response:", parsed)
      return parsed
    } catch (error) {
      console.error("Error debugging solution with images:", error)
      throw error
    }
  }

  public async analyzeErrorText(problemInfo: any, currentCode: string, errorText: string) {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.currentModel,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          }
        ],
        generationConfig: {
          maxOutputTokens: this.getOptimalTokenLimit(this.currentModel),
          temperature: 0.1,
        }
      })

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

Important: Return ONLY the JSON object, without any markdown formatting or code blocks.`

      console.log("[LLMHelper] Calling Gemini LLM for error analysis...")
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const cleanedText = this.cleanJsonResponse(text)
      const parsed = JSON.parse(cleanedText)
      console.log("[LLMHelper] Parsed error analysis response:", parsed)
      return parsed
    } catch (error) {
      console.error("Error analyzing error text:", error)
      throw error
    }
  }

  public async analyzeAudioFile(audioPath: string) {
    try {
      // Note: Gemini doesn't support audio directly, so we'll need to handle this differently
      // For now, we'll return a placeholder response
      const model = this.client.getGenerativeModel({ 
        model: this.currentModel,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.1,
        }
      })

      const prompt = `${this.systemPrompt}\n\nI need to analyze an audio file, but Gemini doesn't support audio input directly. Please provide a general response about audio analysis limitations and suggest alternative approaches.`;
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("Error analyzing audio file:", error);
      throw error;
    }
  }

  public async analyzeAudioFromBase64(data: string, mimeType: string) {
    try {
      // Note: Gemini doesn't support audio directly, so we'll need to handle this differently
      const model = this.client.getGenerativeModel({ 
        model: this.currentModel,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.1,
        }
      })

      const prompt = `${this.systemPrompt}\n\nI need to analyze audio data, but Gemini doesn't support audio input directly. Please provide a general response about audio analysis limitations and suggest alternative approaches.`;
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("Error analyzing audio from base64:", error);
      throw error;
    }
  }

  public async analyzeImageFile(imagePath: string) {
    try {
      const imageData = await fs.promises.readFile(imagePath);
      const mimeType = this.detectImageMimeType(imageData)
      console.log(`[LLMHelper] Detected mime type for ${imagePath}: ${mimeType}`)
      
      const model = this.client.getGenerativeModel({ 
        model: this.currentModel,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          }
        ],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.1,
        }
      })

      const prompt = `${this.systemPrompt}\n\nDescribe the content of this image in a short, concise answer. In addition to your main answer, suggest several possible actions or responses the user could take next based on the image. Do not return a structured JSON object, just answer naturally as you would to a user. Be concise and brief.`;
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData.toString("base64"),
            mimeType: mimeType
          }
        }
      ])
      const response = await result.response
      const text = response.text()

      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("Error analyzing image file:", error);
      throw error;
    }
  }
} 