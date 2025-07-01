// Context Analysis Types
export type EnvironmentType = 'ide' | 'browser' | 'design' | 'document' | 'terminal' | 'mixed' | 'unknown'
export type ActivityType = 'coding' | 'writing' | 'research' | 'design' | 'communication' | 'learning' | 'debugging' | 'idle'
export type ContextSource = 'screenshot' | 'clipboard' | 'window-title' | 'application-state' | 'user-input' | 'temporal'

// Core Screen Context Interface
export interface ScreenContext {
  id: string
  timestamp: number
  environment: EnvironmentType
  activity: ActivityType
  confidence: number
  applicationDetails: ApplicationContext
  visibleContent: ContentAnalysis
  userIntent: IntentAnalysis
  contextSources: ContextSource[]
}

// Application Context
export interface ApplicationContext {
  activeApplication: string
  windowTitle: string
  applicationVersion?: string
  workspace?: string
  currentFile?: string
  cursorPosition?: Position
  selectedText?: string
  openTabs?: string[]
  recentActions?: UserAction[]
}

// Content Analysis
export interface ContentAnalysis {
  textContent: ExtractedText[]
  codeSnippets: CodeSnippet[]
  uiElements: UIElement[]
  mediaElements: MediaElement[]
  structuralElements: StructuralElement[]
  semanticTags: SemanticTag[]
}

// Intent Analysis
export interface IntentAnalysis {
  primaryIntent: string
  secondaryIntents: string[]
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent'
  complexityLevel: 'simple' | 'moderate' | 'complex' | 'expert'
  suggestedActions: SuggestedAction[]
  contextDependencies: string[]
}

// Context Memory and History
export interface ContextSnapshot {
  context: ScreenContext
  userActions: UserAction[]
  outcomes: ContextOutcome[]
  duration: number
}

export interface ContextPattern {
  id: string
  name: string
  frequency: number
  contexts: ScreenContext[]
  triggers: ContextTrigger[]
  outcomes: PatternOutcome[]
  confidence: number
}

// Context Synthesis
export interface EngineeredContext {
  id: string
  timestamp: number
  situationalContext: string
  relevantHistory: ContextSnapshot[]
  domainSpecificInfo: DomainContext
  suggestedActions: Action[]
  contextQuality: ContextQualityMetrics
  synthesisMetadata: SynthesisMetadata
}

export interface DomainContext {
  domain: string
  expertise: ExpertiseLevel
  tools: Tool[]
  conventions: Convention[]
  patterns: DomainPattern[]
  resources: Resource[]
}

// Quality and Metrics
export interface ContextQualityMetrics {
  accuracy: number
  completeness: number
  relevance: number
  timeliness: number
  actionability: number
  overallScore: number
}

export interface SynthesisMetadata {
  processingTime: number
  sourcesUsed: ContextSource[]
  modelsInvolved: string[]
  confidenceFactors: ConfidenceFactor[]
}

// Supporting Types
export interface Position {
  line?: number
  column?: number
  x?: number
  y?: number
}

export interface UserAction {
  type: string
  timestamp: number
  details: any
  context: string
}

export interface ExtractedText {
  content: string
  position: Position
  formatting: TextFormatting
  semanticType: string
}

export interface CodeSnippet {
  language: string
  content: string
  context: string
  complexity: number
  purpose: string
}

export interface UIElement {
  type: string
  content: string
  state: string
  position: Position
  interactive: boolean
}

export interface MediaElement {
  type: 'image' | 'video' | 'audio' | 'chart' | 'diagram'
  description: string
  context: string
  relevance: number
}

export interface StructuralElement {
  type: string
  hierarchy: number
  content: string
  relationships: string[]
}

export interface SemanticTag {
  tag: string
  confidence: number
  context: string
}

export interface SuggestedAction {
  action: string
  priority: number
  reasoning: string
  prerequisites: string[]
  expectedOutcome: string
}

export interface ContextTrigger {
  type: string
  condition: string
  weight: number
}

export interface ContextOutcome {
  success: boolean
  metric: string
  value: number
  feedback: string
}

export interface PatternOutcome {
  pattern: string
  frequency: number
  successRate: number
  averageValue: number
}

export interface Action {
  id: string
  type: string
  description: string
  priority: number
  dependencies: string[]
  estimatedImpact: number
}

export interface Tool {
  name: string
  version: string
  capabilities: string[]
  integrations: string[]
}

export interface Convention {
  type: string
  description: string
  importance: number
  examples: string[]
}

export interface DomainPattern {
  name: string
  description: string
  frequency: number
  examples: string[]
}

export interface Resource {
  name: string
  type: string
  url?: string
  description: string
  relevance: number
}

export interface ConfidenceFactor {
  factor: string
  weight: number
  value: number
  reasoning: string
}

export interface TextFormatting {
  bold: boolean
  italic: boolean
  underline: boolean
  fontSize: number
  color: string
  fontFamily: string
}

export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

// Context Memory Management
export interface ContextMemoryConfig {
  maxHistorySize: number
  patternDetectionThreshold: number
  contextRetentionPeriod: number
  compressionStrategy: 'none' | 'summarize' | 'aggregate'
}

// Context Analysis Configuration
export interface ContextAnalysisConfig {
  enabledSources: ContextSource[]
  analysisDepth: 'surface' | 'moderate' | 'deep'
  realTimeEnabled: boolean
  batchSize: number
  confidenceThreshold: number
}