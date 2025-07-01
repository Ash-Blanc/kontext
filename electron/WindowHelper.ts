import { BrowserWindow, screen } from "electron"
import { AppState } from "main"
import path from "node:path"

const isDev = process.env.NODE_ENV === "development"

const startUrl = isDev
  ? "http://localhost:5173"
  : `file://${path.join(__dirname, "../dist/index.html")}`

export class WindowHelper {
  private mainWindow: BrowserWindow | null = null
  private isWindowVisible: boolean = false
  private windowPosition: { x: number; y: number } | null = null
  private windowSize: { width: number; height: number } | null = null
  private appState: AppState

  // Initialize with explicit number type and 0 value
  private screenWidth: number = 0
  private screenHeight: number = 0
  private step: number = 0
  private currentX: number = 0
  private currentY: number = 0

  constructor(appState: AppState) {
    this.appState = appState
  }

  public setWindowDimensions(width: number, height: number): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    // Get current window position
    const [currentX, currentY] = this.mainWindow.getPosition()

    // Get screen dimensions
    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workAreaSize

    // Use 75% width if debugging has occurred, otherwise use 60%
    const maxAllowedWidth = Math.floor(
      workArea.width * (this.appState.getHasDebugged() ? 0.75 : 0.5)
    )

    // Ensure width doesn't exceed max allowed width and height is reasonable
    const newWidth = Math.min(width + 32, maxAllowedWidth)
    const newHeight = Math.ceil(height)

    // Center the window horizontally if it would go off screen
    const maxX = workArea.width - newWidth
    const newX = Math.min(Math.max(currentX, 0), maxX)

    // Update window bounds
    this.mainWindow.setBounds({
      x: newX,
      y: currentY,
      width: newWidth,
      height: newHeight
    })

    // Update internal state
    this.windowPosition = { x: newX, y: currentY }
    this.windowSize = { width: newWidth, height: newHeight }
    this.currentX = newX
  }

  public createWindow(): void {
    if (this.mainWindow !== null) return

    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workAreaSize
    this.screenWidth = workArea.width
    this.screenHeight = workArea.height

    this.step = Math.floor(this.screenWidth / 10) // 10 steps
    this.currentX = Math.floor(this.screenWidth * 0.2) // Center horizontally
    this.currentY = 0 // Always at the top

    const windowSettings: Electron.BrowserWindowConstructorOptions = {
      width: Math.floor(this.screenWidth * 0.6), // 60% of screen width
      height: 80, // Slim horizontal bar
      minWidth: 400,
      maxWidth: undefined,
      x: Math.floor(this.screenWidth * 0.2), // Center horizontally
      y: 0, // Always at the top
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js")
      },
      show: true,
      alwaysOnTop: true,
      frame: false,
      transparent: true,
      fullscreenable: false,
      hasShadow: false,
      backgroundColor: "#00000000",
      focusable: true
    }

    this.mainWindow = new BrowserWindow(windowSettings)
    // this.mainWindow.webContents.openDevTools()
    this.mainWindow.setContentProtection(true)

    if (process.platform === "darwin") {
      this.mainWindow.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true
      })
      this.mainWindow.setHiddenInMissionControl(true)
      this.mainWindow.setAlwaysOnTop(true, "floating")
    }
    if (process.platform === "linux") {
      // Linux-specific optimizations for stealth overlays
      if (this.mainWindow.setHasShadow) {
        this.mainWindow.setHasShadow(false)
      }
      this.mainWindow.setFocusable(false)
    } 
    this.mainWindow.setSkipTaskbar(true)
    this.mainWindow.setAlwaysOnTop(true)

    this.mainWindow.loadURL(startUrl).catch((err) => {
      console.error("Failed to load URL:", err)
    })

    const bounds = this.mainWindow.getBounds()
    this.windowPosition = { x: bounds.x, y: bounds.y }
    this.windowSize = { width: bounds.width, height: bounds.height }
    this.currentX = bounds.x
    this.currentY = bounds.y

    this.setupWindowListeners()
    this.isWindowVisible = true
  }

  private setupWindowListeners(): void {
    if (!this.mainWindow) return

    this.mainWindow.on("move", () => {
      if (this.mainWindow) {
        const bounds = this.mainWindow.getBounds()
        this.windowPosition = { x: bounds.x, y: bounds.y }
        this.currentX = bounds.x
        this.currentY = bounds.y
      }
    })

    this.mainWindow.on("resize", () => {
      if (this.mainWindow) {
        const bounds = this.mainWindow.getBounds()
        this.windowSize = { width: bounds.width, height: bounds.height }
      }
    })

    this.mainWindow.on("closed", () => {
      this.mainWindow = null
      this.isWindowVisible = false
      this.windowPosition = null
      this.windowSize = null
    })
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  public isVisible(): boolean {
    return this.isWindowVisible
  }

  public hideMainWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      console.warn("Main window does not exist or is destroyed.")
      return
    }

    const bounds = this.mainWindow.getBounds()
    this.windowPosition = { x: bounds.x, y: bounds.y }
    this.windowSize = { width: bounds.width, height: bounds.height }
    this.mainWindow.hide()
    this.isWindowVisible = false
  }

  public showMainWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      console.warn("Main window does not exist or is destroyed.")
      return
    }

    if (this.windowPosition && this.windowSize) {
      this.mainWindow.setBounds({
        x: this.windowPosition.x,
        y: this.windowPosition.y,
        width: this.windowSize.width,
        height: this.windowSize.height
      })
    }

    this.mainWindow.showInactive()

    this.isWindowVisible = true
  }

  public toggleMainWindow(): void {
    if (this.isWindowVisible) {
      this.hideMainWindow()
    } else {
      this.showMainWindow()
    }
  }

  // New methods for window movement
  public moveWindowRight(): void {
    if (!this.mainWindow) return

    const windowWidth = this.windowSize?.width || 0
    const halfWidth = windowWidth / 2

    // Ensure currentX and currentY are numbers
    this.currentX = Number(this.currentX) || 0
    this.currentY = Number(this.currentY) || 0

    this.currentX = Math.min(
      this.screenWidth - halfWidth,
      this.currentX + this.step
    )
    this.mainWindow.setPosition(
      Math.round(this.currentX),
      Math.round(this.currentY)
    )
  }

  public moveWindowLeft(): void {
    if (!this.mainWindow) return

    const windowWidth = this.windowSize?.width || 0
    const halfWidth = windowWidth / 2

    // Ensure currentX and currentY are numbers
    this.currentX = Number(this.currentX) || 0
    this.currentY = Number(this.currentY) || 0

    this.currentX = Math.max(-halfWidth, this.currentX - this.step)
    this.mainWindow.setPosition(
      Math.round(this.currentX),
      Math.round(this.currentY)
    )
  }

  public moveWindowDown(): void {
    if (!this.mainWindow) return

    const windowHeight = this.windowSize?.height || 0
    const halfHeight = windowHeight / 2

    // Ensure currentX and currentY are numbers
    this.currentX = Number(this.currentX) || 0
    this.currentY = Number(this.currentY) || 0

    this.currentY = Math.min(
      this.screenHeight - halfHeight,
      this.currentY + this.step
    )
    this.mainWindow.setPosition(
      Math.round(this.currentX),
      Math.round(this.currentY)
    )
  }

  public moveWindowUp(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const bounds = this.mainWindow.getBounds()
      const newY = Math.max(0, bounds.y - 50)
      this.mainWindow.setPosition(bounds.x, newY)
      this.currentY = newY
    }
  }

  // Window resizing methods
  public increaseWindowSize(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    const bounds = this.mainWindow.getBounds()
    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workAreaSize

    // Increase both width and height by 10%
    const newWidth = Math.min(bounds.width * 1.1, workArea.width * 0.9)
    const newHeight = Math.min(bounds.height * 1.1, workArea.height * 0.9)

    // Keep window centered when resizing
    const newX = Math.max(0, bounds.x - (newWidth - bounds.width) / 2)
    const newY = Math.max(0, bounds.y - (newHeight - bounds.height) / 2)

    this.mainWindow.setBounds({
      x: Math.floor(newX),
      y: Math.floor(newY),
      width: Math.floor(newWidth),
      height: Math.floor(newHeight)
    })

    // Update internal state
    this.windowPosition = { x: Math.floor(newX), y: Math.floor(newY) }
    this.windowSize = { width: Math.floor(newWidth), height: Math.floor(newHeight) }
    this.currentX = Math.floor(newX)
    this.currentY = Math.floor(newY)

    console.log(`Window size increased to: ${Math.floor(newWidth)}x${Math.floor(newHeight)}`)
  }

  public decreaseWindowSize(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    const bounds = this.mainWindow.getBounds()

    // Decrease both width and height by 10%, with minimum sizes
    const minWidth = 300
    const minHeight = 200
    const newWidth = Math.max(bounds.width * 0.9, minWidth)
    const newHeight = Math.max(bounds.height * 0.9, minHeight)

    // Keep window centered when resizing
    const newX = bounds.x + (bounds.width - newWidth) / 2
    const newY = bounds.y + (bounds.height - newHeight) / 2

    this.mainWindow.setBounds({
      x: Math.floor(newX),
      y: Math.floor(newY),
      width: Math.floor(newWidth),
      height: Math.floor(newHeight)
    })

    // Update internal state
    this.windowPosition = { x: Math.floor(newX), y: Math.floor(newY) }
    this.windowSize = { width: Math.floor(newWidth), height: Math.floor(newHeight) }
    this.currentX = Math.floor(newX)
    this.currentY = Math.floor(newY)

    console.log(`Window size decreased to: ${Math.floor(newWidth)}x${Math.floor(newHeight)}`)
  }
}
