# Free Cluely

A desktop application to help you cheat on everything. 

![Cluely Screenshot](image.png)

## 🚀 Quick Start Guide

### Prerequisites
- Make sure you have Node.js installed on your computer
- Git installed on your computer
- A Google Generative AI API key (get it from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation Steps

1. Clone the repository:
```bash
git clone [repository-url]
cd free-cluely
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a file named `.env` in the root folder
   - Add your Google Generative AI API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   # Alternative: GOOGLE_API_KEY=your_api_key_here
   ```
   - Save the file

### Running the App

#### Method 1: Development Mode (Recommended for first run)
1. Open a terminal and run:
```bash
npm run dev -- --port 5180
```

2. Open another terminal in the same folder and run:
```bash
NODE_ENV=development npm run electron:dev
```

#### Method 2: Production Mode
```bash
npm run build
```
The built app will be in the `release` folder.

### ⚠️ Important Notes

1. **Closing the App**: 
   - Press `Cmd + Q` (Mac) or `Ctrl + Q` (Windows/Linux) to quit
   - Or use Activity Monitor/Task Manager to close `Interview Coder`
   - The X button currently doesn't work (known issue)

2. **If the app doesn't start**:
   - Make sure no other app is using port 5180
   - Try killing existing processes:
     ```bash
     # Find processes using port 5180
     lsof -i :5180
     # Kill them (replace [PID] with the process ID)
     kill [PID]
     ```

3. **Keyboard Shortcuts**:
   * `Cmd/Ctrl + H`: Take screenshot
   * `Cmd/Ctrl + Enter`: Get solution from Gemini
   * `Cmd/Ctrl + B`: Toggle app visibility (hide/show)
   * `Cmd/Ctrl + Arrow Keys`: Move window around screen
   * `Cmd/Ctrl + Q`: Quit the application
   
   **Model Selection:**
   * `Cmd/Ctrl + 5`: Switch to Gemini 1.5 Pro (balanced performance)
   * `Cmd/Ctrl + 7`: Switch to Gemini 2.0 Flash Experimental (advanced reasoning)
   * `Cmd/Ctrl + 4`: Switch to Gemini 1.0 Pro (single press)
   * `Cmd/Ctrl + 4 + 4`: Switch to Gemini 1.5 Pro base (double-press)
   * `Cmd/Ctrl + 3`: Switch to Gemini 1.5 Flash Latest (fast performance)
   * `Cmd/Ctrl + Shift + H`: Switch to Gemini 1.5 Flash (fastest)
   
   **New Quick Model Selection:**
   * `Ctrl + 1`: Switch to Gemini 1.5 Pro Latest
   * `Ctrl + 2`: Switch to Gemini 2.0 Flash Experimental
   * `Ctrl + 3`: Switch to Gemini 1.5 Flash Latest
   * `Ctrl + 4`: Switch to Gemini 1.5 Pro base
   * `Ctrl + 5`: Switch to Gemini 1.0 Pro
   * `Ctrl + 6`: Switch to Gemini 1.5 Flash base
   
   **Performance:**
   * `Cmd/Ctrl + Shift + S`: Toggle Speed Mode (auto-switch to fastest model)
   
   **Window Management:**
   * `Cmd/Ctrl + Shift + Up`: Increase window size
   * `Cmd/Ctrl + Shift + Down`: Decrease window size
   
   **Solution Navigation:**
   * `Shift + Up/Down`: Scroll through solution content

### Troubleshooting

If you see errors:
1. Delete the `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again
4. Try running the app again using Method 1

### Audio Analysis Note

This version uses Google Generative AI API which doesn't support direct audio analysis. Audio features will provide general guidance about audio analysis limitations and suggest alternative approaches.

## ⚡ Performance Optimizations

The app includes several optimizations to reduce response times:

### 🚀 Speed Mode
Press `Cmd/Ctrl + Shift + S` to toggle **Speed Mode**:
- **Enabled**: Automatically uses Gemini 1.5 Flash (fastest model) with optimized settings
- **Disabled**: Uses your selected model with standard settings

### 📸 Image Optimization
- Screenshots are automatically compressed before sending to the API
- Reduces image size by ~60-80% while maintaining quality
- Uses JPEG compression at 75% quality for optimal speed/quality balance

### 🎯 Smart Token Limits
- **Flash models**: 2048 tokens (fastest)
- **Gemini 1.5 models**: 3072 tokens (balanced)
- **Other models**: 4096 tokens (detailed)

### 💡 Quick Tips for Better Performance
1. **Use Speed Mode** (`Cmd+Shift+S`) for faster responses
2. **Choose the right model**:
   - Flash models: Fast, good for simple questions
   - Gemini 1.5 Pro: Balanced speed and quality
   - Gemini 2.0 Flash Experimental: Latest features with good speed
   - Gemini 1.0 Pro: Stable but slower
3. **Take smaller screenshots** when possible
4. **Use concise prompts** for faster processing

## Contribution

If you have any feature requests or bugs, feel free to create PRs and Issues.
