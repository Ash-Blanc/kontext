# Free Cluely

A desktop application to help you cheat on everything. 

![Cluely Screenshot](image.png)

## 🚀 Quick Start Guide

### Prerequisites
- Make sure you have Node.js installed on your computer
- Git installed on your computer
- A Claude API key (get it from [Anthropic Console](https://console.anthropic.com/))

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
   - Add your Claude API key:
   ```
   CLAUDE_API_KEY=your_api_key_here
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
   * `Cmd/Ctrl + Enter`: Get solution from Claude
   * `Cmd/Ctrl + B`: Toggle app visibility (hide/show)
   * `Cmd/Ctrl + Arrow Keys`: Move window around screen
   * `Cmd/Ctrl + Q`: Quit the application
   
   **Model Selection:**
   * `Cmd/Ctrl + 5`: Switch to Claude 3.5 Sonnet (balanced performance)
   * `Cmd/Ctrl + 7`: Switch to Claude 3.7 Sonnet (advanced reasoning)
   * `Cmd/Ctrl + 4`: Switch to Claude Sonnet 4 (latest high-performance)
   * `Cmd/Ctrl + 4 + 4`: Switch to Claude Opus 4 (double-press - most powerful)
   * `Cmd/Ctrl + 3`: Switch to Claude 3 Opus (legacy powerful)
   * `Cmd/Ctrl + Shift + H`: Switch to Claude 3.5 Haiku (fastest)
   
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

This version uses Claude API which doesn't support direct audio analysis. Audio features will provide general guidance about audio analysis limitations and suggest alternative approaches.

## ⚡ Performance Optimizations

The app includes several optimizations to reduce response times:

### 🚀 Speed Mode
Press `Cmd/Ctrl + Shift + S` to toggle **Speed Mode**:
- **Enabled**: Automatically uses Claude 3.5 Haiku (fastest model) with optimized settings
- **Disabled**: Uses your selected model with standard settings

### 📸 Image Optimization
- Screenshots are automatically compressed before sending to the API
- Reduces image size by ~60-80% while maintaining quality
- Uses JPEG compression at 75% quality for optimal speed/quality balance

### 🎯 Smart Token Limits
- **Haiku models**: 1024 tokens (fastest)
- **Sonnet 3.5**: 2048 tokens (balanced)
- **Other models**: 3072 tokens (detailed)

### 💡 Quick Tips for Better Performance
1. **Use Speed Mode** (`Cmd+Shift+S`) for faster responses
2. **Choose the right model**:
   - Haiku: Fast, good for simple questions
   - Sonnet: Balanced speed and quality
   - Opus: Slow but most accurate
3. **Take smaller screenshots** when possible
4. **Use concise prompts** for faster processing

## Contribution

If you have any feature requests or bugs, feel free to create PRs and Issues.
