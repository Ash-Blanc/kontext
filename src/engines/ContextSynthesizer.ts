import {
  ScreenContext,
  ContextSnapshot,
  EngineeredContext,
  DomainContext,
  ContextQualityMetrics,
  SynthesisMetadata,
  Action,
  IntentAnalysis,
  ContextSource,
  ExpertiseLevel,
  Tool,
  Convention,
  DomainPattern,
  Resource
} from '../types/context'

export class ContextSynthesizer {
  private domainKnowledge: Map<string, DomainContext> = new Map()

  constructor() {
    this.initializeDomainKnowledge()
  }

  /**
   * Synthesize comprehensive context from current screen context and history
   */
  public async synthesizeContext(
    currentScreen: ScreenContext,
    history: ContextSnapshot[],
    userIntent?: IntentAnalysis
  ): Promise<EngineeredContext> {
    const startTime = Date.now()
    const contextId = `engineered_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log('[ContextSynthesizer] Synthesizing engineered context...')

    try {
      // Weight context elements based on relevance and importance
      const weightedContext = this.weightContextElements(currentScreen)
      
      // Build domain-specific context
      const domainContext = this.buildDomainContext(currentScreen.environment, currentScreen.activity)
      
      // Generate situational context description
      const situationalContext = this.generateSituationalDescription(currentScreen, weightedContext)
      
      // Filter and rank relevant history
      const relevantHistory = this.selectRelevantHistory(currentScreen, history)
      
      // Generate contextual actions
      const suggestedActions = this.generateContextualActions(currentScreen, domainContext, userIntent)
      
      // Calculate context quality metrics
      const contextQuality = this.assessContextQuality(currentScreen, domainContext, relevantHistory)
      
      // Create synthesis metadata
      const synthesisMetadata = this.createSynthesisMetadata(startTime, currentScreen.contextSources)

      const engineeredContext: EngineeredContext = {
        id: contextId,
        timestamp: Date.now(),
        situationalContext,
        relevantHistory,
        domainSpecificInfo: domainContext,
        suggestedActions,
        contextQuality,
        synthesisMetadata
      }

      console.log(`[ContextSynthesizer] Context synthesis completed in ${Date.now() - startTime}ms`)
      return engineeredContext

    } catch (error) {
      console.error('[ContextSynthesizer] Error synthesizing context:', error)
      throw new Error(`Context synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Weight different context elements based on importance and reliability
   */
  private weightContextElements(context: ScreenContext): any {
    const weights = {
      environment: this.calculateEnvironmentWeight(context),
      activity: this.calculateActivityWeight(context),
      application: this.calculateApplicationWeight(context),
      content: this.calculateContentWeight(context),
      intent: this.calculateIntentWeight(context)
    }

    console.log('[ContextSynthesizer] Context element weights:', weights)
    return weights
  }

  /**
   * Build domain-specific context information
   */
  private buildDomainContext(environment: string, activity: string): DomainContext {
    // Determine primary domain based on environment and activity
    const domain = this.determineDomain(environment, activity)
    
    // Get base domain knowledge
    const baseDomainContext = this.domainKnowledge.get(domain) || this.getDefaultDomainContext(domain)
    
    // Customize for specific environment/activity combination
    const customizedContext = this.customizeDomainContext(baseDomainContext, environment, activity)
    
    return customizedContext
  }

  /**
   * Generate human-readable situational context description
   */
  private generateSituationalDescription(context: ScreenContext, weights: any): string {
    const parts: string[] = []

    // Environment description
    parts.push(`User is working in a ${context.environment} environment`)

    // Activity description
    if (context.activity !== 'idle') {
      parts.push(`currently engaged in ${context.activity}`)
    }

    // Application context
    if (context.applicationDetails.activeApplication !== 'unknown') {
      parts.push(`using ${context.applicationDetails.activeApplication}`)
    }

    // Window/file context
    if (context.applicationDetails.windowTitle) {
      const cleanTitle = context.applicationDetails.windowTitle.substring(0, 50)
      parts.push(`with focus on "${cleanTitle}${cleanTitle.length >= 50 ? '...' : ''}"`)
    }

    // Content context
    if (context.visibleContent.codeSnippets.length > 0) {
      parts.push('with code content visible')
    }

    // Confidence indicator
    const confidenceLevel = context.confidence > 0.8 ? 'high' : context.confidence > 0.5 ? 'moderate' : 'low'
    parts.push(`(${confidenceLevel} confidence)`)

    return parts.join(' ')
  }

  /**
   * Select most relevant historical contexts
   */
  private selectRelevantHistory(
    currentContext: ScreenContext,
    history: ContextSnapshot[],
    maxResults: number = 5
  ): ContextSnapshot[] {
    if (history.length === 0) return []

    // Score historical contexts by relevance
    const scoredHistory = history.map(snapshot => ({
      snapshot,
      relevanceScore: this.calculateHistoricalRelevance(currentContext, snapshot.context)
    }))

    // Sort by relevance and return top results
    return scoredHistory
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)
      .map(item => item.snapshot)
  }

  /**
   * Generate contextually appropriate actions
   */
  private generateContextualActions(
    context: ScreenContext,
    domainContext: DomainContext,
    userIntent?: IntentAnalysis
  ): Action[] {
    const actions: Action[] = []

    // Base actions from user intent
    if (userIntent?.suggestedActions) {
      userIntent.suggestedActions.forEach((suggestion, index) => {
        actions.push({
          id: `intent_action_${index}`,
          type: 'user-intent',
          description: suggestion.action,
          priority: suggestion.priority,
          dependencies: suggestion.prerequisites,
          estimatedImpact: 0.7
        })
      })
    }

    // Domain-specific actions
    const domainActions = this.generateDomainActions(context, domainContext)
    actions.push(...domainActions)

    // Environment-specific actions
    const environmentActions = this.generateEnvironmentActions(context)
    actions.push(...environmentActions)

    // Sort by priority and impact
    return actions.sort((a, b) => (b.priority * b.estimatedImpact) - (a.priority * a.estimatedImpact))
  }

  /**
   * Assess the quality of the synthesized context
   */
  private assessContextQuality(
    context: ScreenContext,
    domainContext: DomainContext,
    relevantHistory: ContextSnapshot[]
  ): ContextQualityMetrics {
    // Accuracy based on confidence and source reliability
    const accuracy = context.confidence * 0.8 + (context.contextSources.length / 5) * 0.2

    // Completeness based on available information
    const completeness = this.calculateCompleteness(context, domainContext)

    // Relevance based on domain match and historical context
    const relevance = this.calculateRelevance(context, domainContext, relevantHistory)

    // Timeliness based on how recent the context is
    const timeliness = this.calculateTimeliness(context)

    // Actionability based on available actions and clarity
    const actionability = this.calculateActionability(context, domainContext)

    // Overall score as weighted average
    const overallScore = (
      accuracy * 0.25 +
      completeness * 0.2 +
      relevance * 0.2 +
      timeliness * 0.15 +
      actionability * 0.2
    )

    return {
      accuracy: Math.min(1, accuracy),
      completeness: Math.min(1, completeness),
      relevance: Math.min(1, relevance),
      timeliness: Math.min(1, timeliness),
      actionability: Math.min(1, actionability),
      overallScore: Math.min(1, overallScore)
    }
  }

  /**
   * Create metadata about the synthesis process
   */
  private createSynthesisMetadata(startTime: number, contextSources: ContextSource[]): SynthesisMetadata {
    return {
      processingTime: Date.now() - startTime,
      sourcesUsed: contextSources,
      modelsInvolved: ['context-analyzer', 'domain-synthesizer'],
      confidenceFactors: [
        { factor: 'source-diversity', weight: 0.3, value: contextSources.length / 5, reasoning: 'Multiple sources increase reliability' },
        { factor: 'domain-match', weight: 0.4, value: 0.8, reasoning: 'Strong domain knowledge available' },
        { factor: 'historical-context', weight: 0.3, value: 0.6, reasoning: 'Some relevant history available' }
      ]
    }
  }

  // Domain knowledge and context helpers
  private determineDomain(environment: string, activity: string): string {
    if (environment === 'ide' || activity === 'coding') return 'development'
    if (environment === 'browser' && activity === 'research') return 'research'
    if (environment === 'design') return 'design'
    if (environment === 'document' || activity === 'writing') return 'writing'
    if (environment === 'terminal') return 'system-administration'
    return 'general'
  }

  private customizeDomainContext(base: DomainContext, environment: string, activity: string): DomainContext {
    const customized = { ...base }

    // Add environment-specific tools
    if (environment === 'ide') {
      customized.tools.push(
        { name: 'IDE', version: 'unknown', capabilities: ['editing', 'debugging'], integrations: [] }
      )
    }

    // Add activity-specific patterns
    if (activity === 'debugging') {
      customized.patterns.push({
        name: 'debugging-workflow',
        description: 'Common debugging patterns and practices',
        frequency: 0.8,
        examples: ['breakpoint debugging', 'log analysis', 'step-through execution']
      })
    }

    return customized
  }

  private getDefaultDomainContext(domain: string): DomainContext {
    return {
      domain,
      expertise: 'intermediate' as ExpertiseLevel,
      tools: [],
      conventions: [],
      patterns: [],
      resources: []
    }
  }

  // Weight calculation methods
  private calculateEnvironmentWeight(context: ScreenContext): number {
    // Higher weight for well-known environments
    const environmentWeights: Record<string, number> = {
      'ide': 0.9,
      'browser': 0.8,
      'terminal': 0.9,
      'design': 0.8,
      'document': 0.7,
      'unknown': 0.3
    }
    return environmentWeights[context.environment] || 0.5
  }

  private calculateActivityWeight(context: ScreenContext): number {
    // Higher weight for specific activities
    const activityWeights: Record<string, number> = {
      'coding': 0.9,
      'debugging': 0.9,
      'writing': 0.8,
      'research': 0.7,
      'design': 0.8,
      'idle': 0.2
    }
    return activityWeights[context.activity] || 0.5
  }

  private calculateApplicationWeight(context: ScreenContext): number {
    // Weight based on how much application info we have
    let weight = 0.5
    if (context.applicationDetails.activeApplication !== 'unknown') weight += 0.2
    if (context.applicationDetails.windowTitle) weight += 0.2
    if (context.applicationDetails.selectedText) weight += 0.1
    return Math.min(1, weight)
  }

  private calculateContentWeight(context: ScreenContext): number {
    // Weight based on content richness
    const content = context.visibleContent
    let weight = 0.3
    weight += content.textContent.length * 0.02
    weight += content.codeSnippets.length * 0.1
    weight += content.uiElements.length * 0.01
    return Math.min(1, weight)
  }

  private calculateIntentWeight(context: ScreenContext): number {
    // Weight based on intent clarity
    const intent = context.userIntent
    let weight = 0.4
    if (intent.primaryIntent !== 'unknown') weight += 0.3
    weight += intent.suggestedActions.length * 0.1
    return Math.min(1, weight)
  }

  private calculateHistoricalRelevance(current: ScreenContext, historical: ScreenContext): number {
    let relevance = 0

    // Environment match
    if (current.environment === historical.environment) relevance += 0.3

    // Activity match
    if (current.activity === historical.activity) relevance += 0.25

    // Application match
    if (current.applicationDetails.activeApplication === historical.applicationDetails.activeApplication) {
      relevance += 0.2
    }

    // Time recency
    const timeDiff = current.timestamp - historical.timestamp
    const timeWeight = Math.max(0, 1 - timeDiff / (24 * 60 * 60 * 1000)) // 24 hour decay
    relevance += timeWeight * 0.25

    return relevance
  }

  // Quality assessment helpers
  private calculateCompleteness(context: ScreenContext, domainContext: DomainContext): number {
    let completeness = 0.4 // Base completeness

    if (context.environment !== 'unknown') completeness += 0.15
    if (context.activity !== 'idle') completeness += 0.15
    if (context.applicationDetails.activeApplication !== 'unknown') completeness += 0.1
    if (context.applicationDetails.windowTitle) completeness += 0.1
    if (domainContext.tools.length > 0) completeness += 0.1

    return completeness
  }

  private calculateRelevance(
    context: ScreenContext,
    domainContext: DomainContext,
    history: ContextSnapshot[]
  ): number {
    let relevance = 0.5 // Base relevance

    // Domain relevance
    if (domainContext.domain !== 'general') relevance += 0.2

    // Historical relevance
    if (history.length > 0) relevance += Math.min(0.2, history.length * 0.05)

    // Context confidence
    relevance += context.confidence * 0.1

    return relevance
  }

  private calculateTimeliness(context: ScreenContext): number {
    const age = Date.now() - context.timestamp
    const maxAge = 5 * 60 * 1000 // 5 minutes

    return Math.max(0, 1 - age / maxAge)
  }

  private calculateActionability(context: ScreenContext, domainContext: DomainContext): number {
    let actionability = 0.3 // Base actionability

    // Intent-based actions
    actionability += context.userIntent.suggestedActions.length * 0.1

    // Domain tools availability
    actionability += domainContext.tools.length * 0.05

    // Environment specificity
    if (context.environment !== 'unknown') actionability += 0.2

    return Math.min(1, actionability)
  }

  // Action generation helpers
  private generateDomainActions(context: ScreenContext, domainContext: DomainContext): Action[] {
    const actions: Action[] = []

    // Development domain actions
    if (domainContext.domain === 'development') {
      if (context.activity === 'coding') {
        actions.push({
          id: 'code_review',
          type: 'development',
          description: 'Review and optimize current code',
          priority: 2,
          dependencies: [],
          estimatedImpact: 0.8
        })
      }
    }

    return actions
  }

  private generateEnvironmentActions(context: ScreenContext): Action[] {
    const actions: Action[] = []

    if (context.environment === 'ide') {
      actions.push({
        id: 'analyze_code_context',
        type: 'environment',
        description: 'Analyze visible code for suggestions',
        priority: 1,
        dependencies: [],
        estimatedImpact: 0.7
      })
    }

    return actions
  }

  /**
   * Initialize domain-specific knowledge base
   */
  private initializeDomainKnowledge(): void {
    // Development domain
    const developmentDomain: DomainContext = {
      domain: 'development',
      expertise: 'intermediate',
      tools: [
        { name: 'Git', version: '2.0', capabilities: ['version-control'], integrations: ['github', 'gitlab'] },
        { name: 'NPM', version: '8.0', capabilities: ['package-management'], integrations: ['nodejs'] }
      ],
      conventions: [
        { type: 'naming', description: 'Use camelCase for variables', importance: 0.8, examples: ['userName', 'isActive'] },
        { type: 'structure', description: 'Organize code in modules', importance: 0.9, examples: ['src/', 'lib/', 'components/'] }
      ],
      patterns: [
        { name: 'MVC', description: 'Model-View-Controller pattern', frequency: 0.7, examples: ['express.js', 'rails'] },
        { name: 'Component-based', description: 'Reusable component architecture', frequency: 0.8, examples: ['React', 'Vue'] }
      ],
      resources: [
        { name: 'MDN', type: 'documentation', url: 'https://developer.mozilla.org', description: 'Web development docs', relevance: 0.9 },
        { name: 'Stack Overflow', type: 'community', url: 'https://stackoverflow.com', description: 'Programming Q&A', relevance: 0.8 }
      ]
    }

    this.domainKnowledge.set('development', developmentDomain)

    // Add other domains as needed...
  }
}