"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortcutsHelper = void 0;
const electron_1 = require("electron");
class ShortcutsHelper {
    appState;
    lastCmd4Time = 0;
    cmd4TimerThreshold = 500; // 500ms window for double press
    constructor(appState) {
        this.appState = appState;
    }
    registerGlobalShortcuts() {
        electron_1.globalShortcut.register("CommandOrControl+H", async () => {
            const mainWindow = this.appState.getMainWindow();
            if (mainWindow) {
                console.log("Taking screenshot...");
                try {
                    const screenshotPath = await this.appState.takeScreenshot();
                    const preview = await this.appState.getImagePreview(screenshotPath);
                    mainWindow.webContents.send("screenshot-taken", {
                        path: screenshotPath,
                        preview
                    });
                }
                catch (error) {
                    console.error("Error capturing screenshot:", error);
                }
            }
        });
        electron_1.globalShortcut.register("CommandOrControl+Enter", async () => {
            await this.appState.processingHelper.processScreenshots();
        });
        electron_1.globalShortcut.register("CommandOrControl+R", () => {
            console.log("Command + R pressed. Canceling requests and resetting queues...");
            // Cancel ongoing API requests
            this.appState.processingHelper.cancelOngoingRequests();
            // Clear both screenshot queues
            this.appState.clearQueues();
            console.log("Cleared queues.");
            // Update the view state to 'queue'
            this.appState.setView("queue");
            // Notify renderer process to switch view to 'queue'
            const mainWindow = this.appState.getMainWindow();
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("reset-view");
            }
        });
        // New shortcuts for moving the window
        electron_1.globalShortcut.register("CommandOrControl+Left", () => {
            console.log("Command/Ctrl + Left pressed. Moving window left.");
            this.appState.moveWindowLeft();
        });
        electron_1.globalShortcut.register("CommandOrControl+Right", () => {
            console.log("Command/Ctrl + Right pressed. Moving window right.");
            this.appState.moveWindowRight();
        });
        electron_1.globalShortcut.register("CommandOrControl+Down", () => {
            console.log("Command/Ctrl + down pressed. Moving window down.");
            this.appState.moveWindowDown();
        });
        electron_1.globalShortcut.register("CommandOrControl+Up", () => {
            console.log("Command/Ctrl + Up pressed. Moving window Up.");
            this.appState.moveWindowUp();
        });
        electron_1.globalShortcut.register("CommandOrControl+B", () => {
            this.appState.toggleMainWindow();
            // If window exists and we're showing it, bring it to front
            const mainWindow = this.appState.getMainWindow();
            if (mainWindow && !this.appState.isVisible()) {
                // Force the window to the front on macOS
                if (process.platform === "darwin") {
                    mainWindow.setAlwaysOnTop(true, "normal");
                    // Reset alwaysOnTop after a brief delay
                    setTimeout(() => {
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.setAlwaysOnTop(true, "floating");
                        }
                    }, 100);
                }
            }
        });
        // Model Selection Shortcuts
        electron_1.globalShortcut.register("CommandOrControl+5", () => {
            console.log("Switching to Claude 3.5 Sonnet...");
            this.appState.processingHelper.setModel("claude-3-5-sonnet-20241022");
        });
        electron_1.globalShortcut.register("CommandOrControl+7", () => {
            console.log("Switching to Claude 3.7 Sonnet...");
            this.appState.processingHelper.setModel("claude-3-7-sonnet-20250219");
        });
        electron_1.globalShortcut.register("CommandOrControl+4", () => {
            const currentTime = Date.now();
            if (currentTime - this.lastCmd4Time < this.cmd4TimerThreshold) {
                // Double press detected - switch to Opus 4
                console.log("Switching to Claude Opus 4...");
                this.appState.processingHelper.setModel("claude-opus-4-20250514");
                this.lastCmd4Time = 0; // Reset to prevent triple press
            }
            else {
                // Single press - wait for potential double press, then switch to Sonnet 4
                this.lastCmd4Time = currentTime;
                setTimeout(() => {
                    if (Date.now() - this.lastCmd4Time >= this.cmd4TimerThreshold) {
                        console.log("Switching to Claude Sonnet 4...");
                        this.appState.processingHelper.setModel("claude-sonnet-4-20250514");
                    }
                }, this.cmd4TimerThreshold);
            }
        });
        electron_1.globalShortcut.register("CommandOrControl+3", () => {
            console.log("Switching to Claude 3 Opus...");
            this.appState.processingHelper.setModel("claude-3-opus-20240229");
        });
        electron_1.globalShortcut.register("CommandOrControl+Shift+H", () => {
            console.log("Switching to Claude 3.5 Haiku...");
            this.appState.processingHelper.setModel("claude-3-5-haiku-20241022");
        });
        // Speed Mode Toggle
        electron_1.globalShortcut.register("CommandOrControl+Shift+S", () => {
            console.log("Toggling speed mode...");
            this.appState.processingHelper.toggleSpeedMode();
        });
        // Navigation shortcuts for solutions
        electron_1.globalShortcut.register("Shift+Up", () => {
            const mainWindow = this.appState.getMainWindow();
            if (mainWindow) {
                mainWindow.webContents.send("scroll-solution", "up");
            }
        });
        electron_1.globalShortcut.register("Shift+Down", () => {
            const mainWindow = this.appState.getMainWindow();
            if (mainWindow) {
                mainWindow.webContents.send("scroll-solution", "down");
            }
        });
        // Window resizing shortcuts
        electron_1.globalShortcut.register("CommandOrControl+Shift+Up", () => {
            console.log("Command/Ctrl + Shift + Up pressed. Increasing window size...");
            this.appState.increaseWindowSize();
        });
        electron_1.globalShortcut.register("CommandOrControl+Shift+Down", () => {
            console.log("Command/Ctrl + Shift + Down pressed. Decreasing window size...");
            this.appState.decreaseWindowSize();
        });
        // Unregister shortcuts when quitting
        electron_1.app.on("will-quit", () => {
            electron_1.globalShortcut.unregisterAll();
        });
    }
}
exports.ShortcutsHelper = ShortcutsHelper;
//# sourceMappingURL=shortcuts.js.map