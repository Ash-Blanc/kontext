import { EngineeredContext, ContextQualityMetrics } from './context'

// Core Prompt Engineering Types
export type PromptObjective = 
  | 'code-generation' 
  | 'problem-solving' 
  | 'analysis' 
  | 'explanation' 
  | 'optimization' 
  | 'debugging' 
  | 'research' 
  | 'creative' 
  | 'planning'

export type PromptComplexity = 'simple' | 'moderate' | 'complex' | 'multi-step'
export type PromptStyle = 'direct' | 'conversational' | 'formal' | 'creative' | 'technical'
export type PromptLength = 'concise' | 'moderate' | 'detailed' | 'comprehensive'

// Engineered Prompt Interface
export interface EngineeredPrompt {
  id: string
  timestamp: number
  prompt: string
  contextSummary: string
  objective: PromptObjective
  expectedOutcome: string
  confidenceScore: number
  fallbackPrompts: string[]
  metadata: PromptMetadata
  optimization: PromptOptimization
}

// Prompt Metadata
export interface PromptMetadata {
  templateUsed?: string
  contextElementsUsed: string[]
  processingTime: number
  modelTarget: string
  complexity: PromptComplexity
  style: PromptStyle
  length: PromptLength
  tokens: number
  version: string
}

// Prompt Optimization
export interface PromptOptimization {
  originalLength: number
  optimizedLength: number
  clarityScore: number
  specificityScore: number
  actionabilityScore: number
  optimizationStrategy: string[]
}

// Prompt Template System
export interface PromptTemplate {
  id: string
  name: string
  description: string
  objective: PromptObjective
  domain: string
  template: string
  variables: PromptVariable[]
  examples: PromptExample[]
  constraints: PromptConstraint[]
  metadata: TemplateMetadata
}

export interface PromptVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  description: string
  defaultValue?: any
  validation?: VariableValidation
}

export interface VariableValidation {
  minLength?: number
  maxLength?: number
  pattern?: string
  allowedValues?: any[]
  customValidator?: string
}

export interface PromptExample {
  title: string
  input: Record<string, any>
  expectedOutput: string
  notes?: string
}

export interface PromptConstraint {
  type: 'length' | 'style' | 'content' | 'format'
  constraint: string
  priority: number
}

export interface TemplateMetadata {
  createdAt: number
  updatedAt: number
  version: string
  author: string
  usageCount: number
  successRate: number
  averageRating: number
}

// Prompt Chain Management
export interface PromptChain {
  id: string
  name: string
  description: string
  steps: PromptStep[]
  flowControl: FlowControl
  metadata: ChainMetadata
}

export interface PromptStep {
  id: string
  name: string
  promptTemplate: string
  contextDependencies: string[]
  outputProcessing: OutputProcessing
  successCriteria: SuccessCriteria
  fallbackBehavior: FallbackBehavior
}

export interface FlowControl {
  type: 'sequential' | 'conditional' | 'parallel' | 'loop'
  conditions?: Condition[]
  maxIterations?: number
  timeoutMs?: number
}

export interface Condition {
  variable: string
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists'
  value: any
  nextStep?: string
}

export interface OutputProcessing {
  parser: 'json' | 'text' | 'code' | 'custom'
  validation: ValidationRule[]
  transformation: TransformationRule[]
}

export interface ValidationRule {
  type: string
  condition: string
  errorMessage: string
}

export interface TransformationRule {
  type: string
  operation: string
  parameters: Record<string, any>
}

export interface SuccessCriteria {
  requiredFields: string[]
  qualityThreshold: number
  timeoutMs: number
  retryCount: number
}

export interface FallbackBehavior {
  strategy: 'retry' | 'simplify' | 'alternative' | 'manual'
  fallbackPrompt?: string
  maxAttempts: number
}

export interface ChainMetadata {
  domain: string
  complexity: PromptComplexity
  averageExecutionTime: number
  successRate: number
  lastUsed: number
}

// Prompt Effectiveness Tracking
export interface PromptExecution {
  id: string
  promptId: string
  context: EngineeredContext
  input: PromptInput
  output: PromptOutput
  metrics: ExecutionMetrics
  feedback: UserFeedback
  timestamp: number
}

export interface PromptInput {
  userQuery: string
  contextData: Record<string, any>
  parameters: Record<string, any>
  modelUsed: string
}

export interface PromptOutput {
  result: string
  confidence: number
  processingTime: number
  tokensUsed: number
  modelResponse: any
}

export interface ExecutionMetrics {
  responseTime: number
  accuracyScore: number
  relevanceScore: number
  completenessScore: number
  usabilityScore: number
  overallScore: number
}

export interface UserFeedback {
  rating: number
  comments: string
  helpful: boolean
  improvements: string[]
  timestamp: number
}

// Prompt Analytics
export interface PromptAnalytics {
  templateId: string
  totalExecutions: number
  successRate: number
  averageRating: number
  averageResponseTime: number
  contextTypes: Record<string, number>
  performanceTrends: PerformanceTrend[]
  improvements: Improvement[]
}

export interface PerformanceTrend {
  metric: string
  timeframe: string
  trend: 'improving' | 'declining' | 'stable'
  values: Array<{ timestamp: number; value: number }>
}

export interface Improvement {
  type: string
  suggestion: string
  impact: number
  effort: number
  priority: number
}

// Context-Prompt Mapping
export interface ContextPromptMapping {
  contextPattern: string
  recommendedTemplates: string[]
  confidence: number
  reasoning: string
  examples: MappingExample[]
}

export interface MappingExample {
  context: string
  prompt: string
  outcome: string
  success: boolean
}

// Prompt Engineering Configuration
export interface PromptEngineeringConfig {
  defaultObjective: PromptObjective
  defaultStyle: PromptStyle
  defaultLength: PromptLength
  maxTokens: number
  contextWindowSize: number
  optimizationEnabled: boolean
  chainExecutionEnabled: boolean
  analyticsEnabled: boolean
  cacheEnabled: boolean
  cacheTtl: number
}

// Prompt Library Management
export interface PromptLibrary {
  templates: PromptTemplate[]
  chains: PromptChain[]
  mappings: ContextPromptMapping[]
  analytics: Record<string, PromptAnalytics>
  config: PromptEngineeringConfig
  metadata: LibraryMetadata
}

export interface LibraryMetadata {
  version: string
  lastUpdated: number
  totalTemplates: number
  totalExecutions: number
  averageSuccessRate: number
}