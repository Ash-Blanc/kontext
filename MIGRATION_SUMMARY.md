# Migration from Anthropic AI SDK to Google Generative AI SDK

## Overview
This document summarizes the complete migration from Anthropic AI SDK (@anthropic-ai/sdk) to Google Generative AI SDK (@google/generative-ai) while maintaining all existing functionality.

## Dependencies Changes

### Removed Dependencies
- `@anthropic-ai/sdk`: ^0.54.0
- `@google/genai`: ^0.12.0 (old Google package)

### Updated Dependencies
- `@google/generative-ai`: ^0.21.0 (latest stable version)

## Environment Variables Changes

### Before (Anthropic)
```env
CLAUDE_API_KEY=your-anthropic-api-key-here
```

### After (Google Generative AI)
```env
GEMINI_API_KEY=your-google-generative-ai-api-key-here
# Alternative: GOOGLE_API_KEY=your-google-generative-ai-api-key-here
```

## Code Changes

### 1. LLMHelper.ts - Complete Rewrite

#### Model Types
- **Before**: `ClaudeModel` with Claude-specific model names
- **After**: `GeminiModel` with Google Gemini model names

#### Model Mappings
| Old Claude Model | New Gemini Model | Purpose |
|------------------|------------------|---------|
| claude-3-5-sonnet-20241022 | gemini-1.5-pro-latest | Balanced performance |
| claude-3-5-haiku-20241022 | gemini-1.5-flash-latest | Fast responses |
| claude-3-opus-20240229 | gemini-1.5-pro | High quality |
| claude-3-sonnet-20240229 | gemini-1.5-flash | General purpose |
| claude-3-haiku-20240307 | gemini-1.5-flash | Speed optimized |
| claude-3-7-sonnet-20250219 | gemini-2.0-flash-exp | Latest experimental |
| claude-sonnet-4-20250514 | gemini-1.0-pro | Stable baseline |
| claude-opus-4-20250514 | gemini-1.5-pro | Premium quality |

#### API Integration Changes

**Anthropic SDK Pattern:**
```typescript
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: apiKey })
const message = await client.messages.create({
  model: model,
  max_tokens: tokenLimit,
  messages: [{ role: "user", content: [...] }]
})
```

**Google Generative AI Pattern:**
```typescript
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"

const client = new GoogleGenerativeAI(apiKey)
const model = client.getGenerativeModel({ 
  model: modelName,
  safetySettings: [...],
  generationConfig: { maxOutputTokens: tokenLimit }
})
const result = await model.generateContent([...])
```

#### Image Handling Changes

**Before (Anthropic format):**
```typescript
{
  type: "image",
  source: {
    type: "base64",
    media_type: "image/jpeg",
    data: base64String
  }
}
```

**After (Google format):**
```typescript
{
  inlineData: {
    data: base64String,
    mimeType: "image/jpeg"
  }
}
```

### 2. ProcessingHelper.ts Updates

- Changed import from `ClaudeModel` to `GeminiModel`
- Updated environment variable check from `CLAUDE_API_KEY` to `GEMINI_API_KEY || GOOGLE_API_KEY`
- Updated speed mode models:
  - Speed mode: `claude-3-5-haiku-20241022` → `gemini-1.5-flash-latest`
  - Normal mode: `claude-3-5-sonnet-20241022` → `gemini-1.5-pro-latest`

### 3. Shortcuts.ts Updates

Updated all keyboard shortcuts to use new Gemini models:

#### Legacy Shortcuts (CommandOrControl + Number)
- `Ctrl+5`: Claude 3.5 Sonnet → Gemini 1.5 Pro Latest
- `Ctrl+7`: Claude 3.7 Sonnet → Gemini 2.0 Flash Experimental
- `Ctrl+4`: Claude Sonnet 4 → Gemini 1.0 Pro (single press)
- `Ctrl+4+4`: Claude Opus 4 → Gemini 1.5 Pro (double press)
- `Ctrl+3`: Claude 3 Opus → Gemini 1.5 Flash Latest
- `Ctrl+Shift+H`: Claude 3.5 Haiku → Gemini 1.5 Flash

#### New Shortcuts (Control + Number)
- `Ctrl+1`: Gemini 1.5 Pro Latest
- `Ctrl+2`: Gemini 2.0 Flash Experimental
- `Ctrl+3`: Gemini 1.5 Flash Latest
- `Ctrl+4`: Gemini 1.5 Pro base
- `Ctrl+5`: Gemini 1.0 Pro
- `Ctrl+6`: Gemini 1.5 Flash base

## Functional Equivalents

### Safety Settings
- **Anthropic**: Built-in content filtering
- **Google**: Configurable safety settings using `HarmCategory` and `HarmBlockThreshold`

### Token Limits
- **Flash models**: 2048 tokens (fastest)
- **Gemini 1.5 models**: 3072 tokens (balanced)
- **Other models**: 4096 tokens (detailed)

### Response Format
Both SDKs maintain the same JSON response structure for the application's use cases.

## Performance Optimizations

### Speed Mode
- **Before**: Switches to Claude 3.5 Haiku
- **After**: Switches to Gemini 1.5 Flash Latest

### Image Compression
- Maintained the same Sharp.js compression logic
- Still compresses to JPEG at 75% quality
- Still resizes to max 1200x1200 pixels

### Error Handling
- Maintained existing try-catch patterns
- Updated error messages to reference Gemini instead of Claude

## Testing Considerations

### What to Test
1. **Model switching**: Verify all keyboard shortcuts work
2. **Image analysis**: Test screenshot processing with various image types
3. **Error handling**: Test with invalid API keys and network issues
4. **JSON parsing**: Ensure response parsing still works correctly
5. **Speed mode**: Verify performance optimizations work
6. **Debug functionality**: Test debug image analysis
7. **Audio limitations**: Confirm audio analysis provides appropriate limitations message

### API Key Setup
1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set in `.env` file as `GEMINI_API_KEY=your-key-here`
3. Alternative: Use `GOOGLE_API_KEY=your-key-here`

## Known Limitations

### Audio Analysis
- **Anthropic**: Didn't support audio
- **Google**: Doesn't support audio
- **Solution**: Both return informational messages about audio limitations

### Model Capabilities
- Google Generative AI models have different strengths than Claude models
- Gemini 1.5 Pro is closest equivalent to Claude 3.5 Sonnet
- Gemini 1.5 Flash is closest equivalent to Claude 3.5 Haiku

## Migration Verification Checklist

- [x] Remove Anthropic SDK dependency
- [x] Add Google Generative AI SDK dependency
- [x] Update LLMHelper class implementation
- [x] Update ProcessingHelper environment variable handling
- [x] Update all keyboard shortcuts
- [x] Update README documentation
- [x] Map all Claude models to equivalent Gemini models
- [x] Maintain existing JSON response format
- [x] Preserve image compression logic
- [x] Update error messages and logging
- [x] Test speed mode functionality
- [x] Verify safety settings configuration

## API Cost Considerations

### Google Generative AI Pricing (as of migration)
- Gemini 1.5 Flash: Lower cost, faster responses
- Gemini 1.5 Pro: Moderate cost, balanced performance
- Gemini 2.0 Flash Experimental: Preview pricing
- All models support image inputs

Users should monitor their API usage and costs as pricing structures may differ from Anthropic's Claude API.

## Rollback Plan

If needed, rollback involves:
1. Restore `@anthropic-ai/sdk` dependency
2. Revert LLMHelper.ts to original Anthropic implementation
3. Restore `CLAUDE_API_KEY` environment variable
4. Revert shortcuts to Claude model names
5. Update README back to Claude instructions

The original files should be backed up before migration for easy rollback if needed.