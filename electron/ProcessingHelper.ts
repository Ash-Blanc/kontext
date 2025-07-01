// ProcessingHelper.ts

import { AppState } from "./main"
import { LLMHelper, ClaudeModel } from "./LLMHelper"
import dotenv from "dotenv"

dotenv.config()

const isDev = process.env.NODE_ENV === "development"
const isDevTest = process.env.IS_DEV_TEST === "true"
const MOCK_API_WAIT_TIME = Number(process.env.MOCK_API_WAIT_TIME) || 500

export class ProcessingHelper {
  private appState: AppState
  private llmHelper: LLMHelper
  private currentProcessingAbortController: AbortController | null = null
  private currentExtraProcessingAbortController: AbortController | null = null

  constructor(appState: AppState) {
    this.appState = appState
    const apiKey = process.env.CLAUDE_API_KEY
    if (!apiKey) {
      throw new Error("CLAUDE_API_KEY not found in environment variables")
    }
    this.llmHelper = new LLMHelper(apiKey)
  }

  public async processScreenshots(): Promise<void> {
    const mainWindow = this.appState.getMainWindow()
    if (!mainWindow) return

    const view = this.appState.getView()

    if (view === "queue") {
      const screenshotQueue = this.appState.getScreenshotHelper().getScreenshotQueue()
      if (screenshotQueue.length === 0) {
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.NO_SCREENSHOTS)
        return
      }

      // Check if last screenshot is an audio file
      const allPaths = this.appState.getScreenshotHelper().getScreenshotQueue();
      const lastPath = allPaths[allPaths.length - 1];
      if (lastPath.endsWith('.mp3') || lastPath.endsWith('.wav')) {
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.INITIAL_START);
        this.appState.setView('solutions');
        try {
          const audioResult = await this.llmHelper.analyzeAudioFile(lastPath);
          mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.PROBLEM_EXTRACTED, audioResult);
          this.appState.setProblemInfo({ problem_statement: audioResult.text, input_format: {}, output_format: {}, constraints: [], test_cases: [] });
          return;
        } catch (err: any) {
          console.error('Audio processing error:', err);
          mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, err.message);
          return;
        }
      }

      // Process screenshots with Claude API
      console.log("[ProcessingHelper] Starting screenshot processing with Claude...");
      mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.INITIAL_START)
      this.appState.setView("solutions")
      this.currentProcessingAbortController = new AbortController()
      
      try {
        // Step 1: Extract problem from images
        console.log("[ProcessingHelper] Extracting problem from screenshots...");
        const problemInfo = await this.llmHelper.extractProblemFromImages(allPaths);
        console.log("[ProcessingHelper] Problem extracted:", problemInfo);
        
        // Send problem extracted event
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.PROBLEM_EXTRACTED, problemInfo);
        this.appState.setProblemInfo(problemInfo);
        
        // Step 2: Generate solution based on the extracted problem
        console.log("[ProcessingHelper] Generating solution...");
        const solutionResult = await this.llmHelper.generateSolution(problemInfo);
        console.log("[ProcessingHelper] Solution generated:", solutionResult);
        
        // Send solution success event
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.SOLUTION_SUCCESS, solutionResult);
        
      } catch (error: any) {
        console.error("[ProcessingHelper] Error processing screenshots:", error)
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, error.message)
      } finally {
        this.currentProcessingAbortController = null
      }
      return;
    } else {
      // Debug mode
      const extraScreenshotQueue = this.appState.getScreenshotHelper().getExtraScreenshotQueue()
      if (extraScreenshotQueue.length === 0) {
        console.log("No extra screenshots to process")
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.NO_SCREENSHOTS)
        return
      }

      mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.DEBUG_START)
      this.currentExtraProcessingAbortController = new AbortController()

      try {
        // Get problem info and current solution
        const problemInfo = this.appState.getProblemInfo()
        if (!problemInfo) {
          throw new Error("No problem info available")
        }

        // Try to get current solution from cache first, then generate if needed
        let currentCode = "No previous solution available"
        try {
          // Get the last solution from the main window cache
          const cachedSolution = await new Promise((resolve) => {
            mainWindow.webContents.executeJavaScript(`
              window.queryClient?.getQueryData(["solution"])
            `).then(resolve).catch(() => resolve(null))
          })
          
          if (cachedSolution && typeof cachedSolution === 'object' && 'code' in cachedSolution) {
            currentCode = (cachedSolution as any).code
            console.log("[ProcessingHelper] Using cached solution for debug")
          } else {
            console.log("[ProcessingHelper] No cached solution, generating new one for debug")
            const currentSolution = await this.llmHelper.generateSolution(problemInfo)
            currentCode = currentSolution.solution.code
          }
        } catch (error) {
          console.log("[ProcessingHelper] Error getting cached solution, generating new one:", error)
          const currentSolution = await this.llmHelper.generateSolution(problemInfo)
          currentCode = currentSolution.solution.code
        }

        // Debug the solution using vision model
        const debugResult = await this.llmHelper.debugSolutionWithImages(
          problemInfo,
          currentCode,
          extraScreenshotQueue
        )

        this.appState.setHasDebugged(true)
        
        // Send both debug success and solution success events for consistent UI
        mainWindow.webContents.send(
          this.appState.PROCESSING_EVENTS.DEBUG_SUCCESS,
          debugResult
        )
        
        // Also send as regular solution for consistent display
        if (debugResult && debugResult.solution) {
          mainWindow.webContents.send(
            this.appState.PROCESSING_EVENTS.SOLUTION_SUCCESS,
            debugResult
          )
        }

      } catch (error: any) {
        console.error("Debug processing error:", error)
        mainWindow.webContents.send(
          this.appState.PROCESSING_EVENTS.DEBUG_ERROR,
          error.message
        )
      } finally {
        this.currentExtraProcessingAbortController = null
      }
    }
  }

  public cancelOngoingRequests(): void {
    if (this.currentProcessingAbortController) {
      this.currentProcessingAbortController.abort()
      this.currentProcessingAbortController = null
    }

    if (this.currentExtraProcessingAbortController) {
      this.currentExtraProcessingAbortController.abort()
      this.currentExtraProcessingAbortController = null
    }

    this.appState.setHasDebugged(false)
  }

  public async processAudioBase64(data: string, mimeType: string) {
    // Directly use LLMHelper to analyze inline base64 audio
    return this.llmHelper.analyzeAudioFromBase64(data, mimeType);
  }

  // Add audio file processing method
  public async processAudioFile(filePath: string) {
    return this.llmHelper.analyzeAudioFile(filePath);
  }

  public getLLMHelper() {
    return this.llmHelper;
  }

  public setModel(model: ClaudeModel): void {
    this.llmHelper.setModel(model)
    const mainWindow = this.appState.getMainWindow()
    if (mainWindow) {
      mainWindow.webContents.send("model-changed", {
        model: model,
        displayName: this.llmHelper.getModelDisplayName(model)
      })
    }
  }

  public enableSpeedMode(): void {
    console.log("[ProcessingHelper] Enabling speed mode - switching to Claude 3.5 Haiku")
    this.setModel("claude-3-5-haiku-20241022")
    this.llmHelper.setSpeedMode(true)
  }

  public disableSpeedMode(): void {
    console.log("[ProcessingHelper] Disabling speed mode - switching to Claude 3.5 Sonnet")
    this.setModel("claude-3-5-sonnet-20241022")
    this.llmHelper.setSpeedMode(false)
  }

  public toggleSpeedMode(): void {
    const currentModel = this.getCurrentModel()
    if (currentModel.includes('haiku')) {
      this.disableSpeedMode()
    } else {
      this.enableSpeedMode()
    }
  }

  public getCurrentModel(): ClaudeModel {
    return this.llmHelper.getCurrentModel()
  }

  public getModelDisplayName(): string {
    return this.llmHelper.getModelDisplayName()
  }
}
