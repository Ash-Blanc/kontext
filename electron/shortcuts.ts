import { globalShortcut, app } from "electron"
import { AppState } from "./main" // Adjust the import path if necessary
import { GeminiModel } from "./LLMHelper"

export class ShortcutManager {
  private appState: AppState
  private lastCmd4Time: number = 0
  private cmd4TimerThreshold: number = 500 // 500ms window for double press

  constructor(appState: AppState) {
    this.appState = appState
  }

  public registerShortcuts(): void {
    // F1 - Toggle visibility
    globalShortcut.register("F1", () => {
      this.appState.toggleMainWindow()
    })

    // F2 - Take screenshot and process
    globalShortcut.register("F2", () => {
      console.log("F2 pressed - taking screenshot")
      this.appState.takeScreenshot()
    })

    // F3 - Process queue
    globalShortcut.register("F3", () => {
      console.log("F3 pressed - processing queue")
      this.appState.processingHelper.processScreenshots()
    })

    // F4 - Clear queue
    globalShortcut.register("F4", () => {
      console.log("F4 pressed - clearing queue")
      this.appState.clearQueues()
    })

    // F5 - Toggle processing view
    globalShortcut.register("F5", () => {
      console.log("F5 pressed - toggling view")
      const currentView = this.appState.getView()
      this.appState.setView(currentView === "queue" ? "solutions" : "queue")
    })

    // F6 - Clear solutions
    globalShortcut.register("F6", () => {
      console.log("F6 pressed - clearing solutions")
      this.appState.clearQueues()
    })

    // F7 - Debug mode (take extra screenshot)
    globalShortcut.register("F7", () => {
      console.log("F7 pressed - debug mode screenshot")
      this.appState.takeScreenshot()
    })

    // F8 - Cancel ongoing processing
    globalShortcut.register("F8", () => {
      console.log("F8 pressed - canceling processing")
      this.appState.processingHelper.cancelOngoingRequests()
    })

    // F9 - Toggle speed mode
    globalShortcut.register("F9", () => {
      console.log("F9 pressed - toggling speed mode")
      this.appState.processingHelper.toggleSpeedMode()
    })

    // F10 - Restart app
    globalShortcut.register("F10", () => {
      console.log("F10 pressed - restarting app")
      app.relaunch()
      app.exit()
    })

    // Ctrl+1 - Switch to Gemini 1.5 Pro
    globalShortcut.register("Control+1", () => {
      console.log("Ctrl+1 pressed - switching to Gemini 1.5 Pro")
      this.appState.processingHelper.setModel("gemini-1.5-pro-latest")
    })

    // Ctrl+2 - Switch to Gemini 2.0 Flash Experimental  
    globalShortcut.register("Control+2", () => {
      console.log("Ctrl+2 pressed - switching to Gemini 2.0 Flash Experimental")
      this.appState.processingHelper.setModel("gemini-2.0-flash-exp")
    })

    // Ctrl+3 - Switch to Gemini 1.5 Flash
    globalShortcut.register("Control+3", () => {
      console.log("Ctrl+3 pressed - switching to Gemini 1.5 Flash")
      this.appState.processingHelper.setModel("gemini-1.5-flash-latest")
    })

    // Ctrl+4 - Switch to Gemini 1.5 Pro (base)
    globalShortcut.register("Control+4", () => {
      console.log("Ctrl+4 pressed - switching to Gemini 1.5 Pro base")
      this.appState.processingHelper.setModel("gemini-1.5-pro")
    })

    // Ctrl+5 - Switch to Gemini 1.0 Pro
    globalShortcut.register("Control+5", () => {
      console.log("Ctrl+5 pressed - switching to Gemini 1.0 Pro")
      this.appState.processingHelper.setModel("gemini-1.0-pro")
    })

    // Ctrl+6 - Switch to Gemini 1.5 Flash (base)
    globalShortcut.register("Control+6", () => {
      console.log("Ctrl+6 pressed - switching to Gemini 1.5 Flash base")
      this.appState.processingHelper.setModel("gemini-1.5-flash")
    })

    // Model Selection Shortcuts (legacy CommandOrControl shortcuts)
    globalShortcut.register("CommandOrControl+5", () => {
      console.log("Switching to Gemini 1.5 Pro...")
      this.appState.processingHelper.setModel("gemini-1.5-pro-latest")
    })

    globalShortcut.register("CommandOrControl+7", () => {
      console.log("Switching to Gemini 2.0 Flash Experimental...")
      this.appState.processingHelper.setModel("gemini-2.0-flash-exp")
    })

    globalShortcut.register("CommandOrControl+4", () => {
      const currentTime = Date.now()
      if (currentTime - this.lastCmd4Time < this.cmd4TimerThreshold) {
        // Double press detected - switch to Gemini 1.5 Pro base
        console.log("Switching to Gemini 1.5 Pro base...")
        this.appState.processingHelper.setModel("gemini-1.5-pro")
        this.lastCmd4Time = 0 // Reset to prevent triple press
      } else {
        // Single press - wait for potential double press, then switch to Gemini 1.0 Pro
        this.lastCmd4Time = currentTime
        setTimeout(() => {
          if (Date.now() - this.lastCmd4Time >= this.cmd4TimerThreshold) {
            console.log("Switching to Gemini 1.0 Pro...")
            this.appState.processingHelper.setModel("gemini-1.0-pro")
          }
        }, this.cmd4TimerThreshold)
      }
    })

    globalShortcut.register("CommandOrControl+3", () => {
      console.log("Switching to Gemini 1.5 Flash Latest...")
      this.appState.processingHelper.setModel("gemini-1.5-flash-latest")
    })

    globalShortcut.register("CommandOrControl+Shift+H", () => {
      console.log("Switching to Gemini 1.5 Flash...")
      this.appState.processingHelper.setModel("gemini-1.5-flash")
    })

    // Speed Mode Toggle
    globalShortcut.register("CommandOrControl+Shift+S", () => {
      console.log("Toggling speed mode...")
      this.appState.processingHelper.toggleSpeedMode()
    })

    // Navigation shortcuts for solutions
    globalShortcut.register("Shift+Up", () => {
      const mainWindow = this.appState.getMainWindow()
      if (mainWindow) {
        mainWindow.webContents.send("scroll-solution", "up")
      }
    })

    globalShortcut.register("Shift+Down", () => {
      const mainWindow = this.appState.getMainWindow()
      if (mainWindow) {
        mainWindow.webContents.send("scroll-solution", "down")
      }
    })

    // Window resizing shortcuts
    globalShortcut.register("CommandOrControl+Shift+Up", () => {
      console.log("Command/Ctrl + Shift + Up pressed. Increasing window size...")
      this.appState.increaseWindowSize()
    })

    globalShortcut.register("CommandOrControl+Shift+Down", () => {
      console.log("Command/Ctrl + Shift + Down pressed. Decreasing window size...")
      this.appState.decreaseWindowSize()
    })

    // New shortcuts for moving the window
    globalShortcut.register("CommandOrControl+Left", () => {
      console.log("Command/Ctrl + Left pressed. Moving window left.")
      this.appState.moveWindowLeft()
    })

    globalShortcut.register("CommandOrControl+Right", () => {
      console.log("Command/Ctrl + Right pressed. Moving window right.")
      this.appState.moveWindowRight()
    })
    globalShortcut.register("CommandOrControl+Down", () => {
      console.log("Command/Ctrl + down pressed. Moving window down.")
      this.appState.moveWindowDown()
    })
    globalShortcut.register("CommandOrControl+Up", () => {
      console.log("Command/Ctrl + Up pressed. Moving window Up.")
      this.appState.moveWindowUp()
    })

    globalShortcut.register("CommandOrControl+B", () => {
      this.appState.toggleMainWindow()
      // If window exists and we're showing it, bring it to front
      const mainWindow = this.appState.getMainWindow()
      if (mainWindow && !this.appState.isVisible()) {
        // Force the window to the front on macOS
        if (process.platform === "darwin") {
          mainWindow.setAlwaysOnTop(true, "normal")
          // Reset alwaysOnTop after a brief delay
          setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.setAlwaysOnTop(true, "floating")
            }
          }, 100)
        }
      }
    })
  }

  public unregisterShortcuts(): void {
    globalShortcut.unregisterAll()
  }
}
