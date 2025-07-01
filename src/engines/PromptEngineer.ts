import {
  EngineeredPrompt,
  PromptObjective,
  PromptTemplate,
  PromptMetadata,
  PromptOptimization,
  PromptEngineeringConfig,
  PromptComplexity,
  PromptStyle,
  PromptLength
} from '../types/prompts'
import { EngineeredContext, ScreenContext } from '../types/context'

export class PromptEngineer {
  private config: PromptEngineeringConfig
  private templates: Map<string, PromptTemplate> = new Map()

  constructor(config: PromptEngineeringConfig) {
    this.config = config
    this.initializeDefaultTemplates()
  }

  /**
   * Generate a context-aware prompt based on engineered context and user query
   */
  public async generateContextualPrompt(
    engineeredContext: EngineeredContext,
    userQuery: string,
    objective: PromptObjective = this.config.defaultObjective
  ): Promise<EngineeredPrompt> {
    const startTime = Date.now()
    const promptId = this.generatePromptId()

    console.log('[PromptEngineer] Generating contextual prompt...')

    try {
      // Select the most appropriate template
      const template = this.selectOptimalTemplate(engineeredContext, objective)
      
      // Adapt template to context
      const adaptedPrompt = this.adaptPromptToContext(template, engineeredContext, userQuery)
      
      // Optimize the prompt
      const optimization = this.optimizePrompt(adaptedPrompt, template)
      
      // Generate fallback prompts
      const fallbackPrompts = this.generateFallbackPrompts(template, engineeredContext, userQuery)
      
      // Calculate confidence score
      const confidenceScore = this.calculatePromptConfidence(engineeredContext, template, optimization)

      const engineeredPrompt: EngineeredPrompt = {
        id: promptId,
        timestamp: Date.now(),
        prompt: optimization.optimizedPrompt,
        contextSummary: this.generateContextSummary(engineeredContext),
        objective,
        expectedOutcome: this.generateExpectedOutcome(objective, engineeredContext),
        confidenceScore,
        fallbackPrompts,
        metadata: {
          templateUsed: template.id,
          contextElementsUsed: this.extractUsedContextElements(engineeredContext),
          processingTime: Date.now() - startTime,
          modelTarget: 'claude', // Default target
          complexity: 'moderate' as PromptComplexity,
          style: this.config.defaultStyle,
          length: this.config.defaultLength,
          tokens: this.estimateTokenCount(optimization.optimizedPrompt),
          version: '1.0'
        },
        optimization
      }

      console.log(`[PromptEngineer] Generated prompt in ${Date.now() - startTime}ms`)
      return engineeredPrompt

    } catch (error) {
      console.error('[PromptEngineer] Error generating prompt:', error)
      throw new Error(`Prompt generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Select the most appropriate template for the context and objective
   */
  private selectOptimalTemplate(
    engineeredContext: EngineeredContext,
    objective: PromptObjective
  ): PromptTemplate {
    // Find templates matching the objective
    const candidateTemplates = Array.from(this.templates.values())
      .filter(template => template.objective === objective)

    if (candidateTemplates.length === 0) {
      // Fallback to general template
      return this.getGeneralTemplate(objective)
    }

    // Score templates based on context compatibility
    const scoredTemplates = candidateTemplates.map(template => ({
      template,
      score: this.scoreTemplateCompatibility(template, engineeredContext)
    }))

    // Return the highest scoring template
    scoredTemplates.sort((a, b) => b.score - a.score)
    return scoredTemplates[0].template
  }

  /**
   * Adapt a template to the specific context
   */
  private adaptPromptToContext(
    template: PromptTemplate,
    engineeredContext: EngineeredContext,
    userQuery: string
  ): string {
    let adaptedPrompt = template.template

    // Replace template variables with context data
    const variables = {
      USER_QUERY: userQuery,
      CONTEXT: engineeredContext.situationalContext,
      DOMAIN: engineeredContext.domainSpecificInfo.domain,
      ENVIRONMENT: engineeredContext.situationalContext.includes('ide') ? 'development' : 'general',
      EXPERTISE_LEVEL: engineeredContext.domainSpecificInfo.expertise,
      SUGGESTED_ACTIONS: engineeredContext.suggestedActions.map(a => a.description).join(', '),
      HISTORICAL_CONTEXT: this.summarizeHistoricalContext(engineeredContext.relevantHistory),
      TOOLS: engineeredContext.domainSpecificInfo.tools.map(t => t.name).join(', ')
    }

    // Replace placeholders
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      adaptedPrompt = adaptedPrompt.replace(new RegExp(placeholder, 'g'), String(value))
    })

    return adaptedPrompt
  }

  /**
   * Optimize prompt for clarity, specificity, and length
   */
  private optimizePrompt(
    prompt: string,
    template: PromptTemplate
  ): PromptOptimization & { optimizedPrompt: string } {
    const originalLength = prompt.length
    let optimizedPrompt = prompt

    // Remove redundant phrases
    optimizedPrompt = this.removeRedundancy(optimizedPrompt)
    
    // Enhance clarity
    optimizedPrompt = this.enhanceClarity(optimizedPrompt)
    
    // Improve specificity
    optimizedPrompt = this.improveSpecificity(optimizedPrompt)
    
    // Apply length constraints
    optimizedPrompt = this.applyLengthConstraints(optimizedPrompt, template)

    const optimization: PromptOptimization & { optimizedPrompt: string } = {
      originalLength,
      optimizedLength: optimizedPrompt.length,
      clarityScore: this.calculateClarityScore(optimizedPrompt),
      specificityScore: this.calculateSpecificityScore(optimizedPrompt),
      actionabilityScore: this.calculateActionabilityScore(optimizedPrompt),
      optimizationStrategy: this.getOptimizationStrategies(prompt, optimizedPrompt),
      optimizedPrompt
    }

    return optimization
  }

  /**
   * Generate fallback prompts in case the main prompt fails
   */
  private generateFallbackPrompts(
    template: PromptTemplate,
    engineeredContext: EngineeredContext,
    userQuery: string
  ): string[] {
    const fallbacks: string[] = []

    // Simplified version
    const simplifiedPrompt = this.generateSimplifiedPrompt(userQuery, engineeredContext)
    fallbacks.push(simplifiedPrompt)

    // Direct question version
    const directPrompt = this.generateDirectPrompt(userQuery)
    fallbacks.push(directPrompt)

    // Context-free version
    const contextFreePrompt = this.generateContextFreePrompt(userQuery, template.objective)
    fallbacks.push(contextFreePrompt)

    return fallbacks
  }

  /**
   * Calculate confidence in the generated prompt
   */
  private calculatePromptConfidence(
    engineeredContext: EngineeredContext,
    template: PromptTemplate,
    optimization: PromptOptimization
  ): number {
    let confidence = 0

    // Context quality factor (40%)
    confidence += engineeredContext.contextQuality.overallScore * 0.4

    // Template match factor (30%)
    confidence += (template.metadata.successRate || 0.7) * 0.3

    // Optimization quality factor (30%)
    const optimizationScore = (
      optimization.clarityScore + 
      optimization.specificityScore + 
      optimization.actionabilityScore
    ) / 3
    confidence += optimizationScore * 0.3

    return Math.min(1, confidence)
  }

  /**
   * Initialize default prompt templates
   */
  private initializeDefaultTemplates(): void {
    // Code analysis template
    const codeAnalysisTemplate: PromptTemplate = {
      id: 'code-analysis',
      name: 'Code Analysis Template',
      description: 'Analyzes code and provides suggestions',
      objective: 'analysis',
      domain: 'development',
      template: `You are an expert code analyst. Analyze the following context:

Context: {{CONTEXT}}
User Query: {{USER_QUERY}}
Environment: {{ENVIRONMENT}}
Available Tools: {{TOOLS}}

Please provide:
1. A clear analysis of the situation
2. Specific recommendations
3. Implementation steps
4. Potential issues to consider

Focus on practical, actionable advice.`,
      variables: [
        { name: 'CONTEXT', type: 'string', required: true, description: 'Current context' },
        { name: 'USER_QUERY', type: 'string', required: true, description: 'User question' },
        { name: 'ENVIRONMENT', type: 'string', required: false, description: 'Development environment' },
        { name: 'TOOLS', type: 'string', required: false, description: 'Available tools' }
      ],
      examples: [],
      constraints: [
        { type: 'length', constraint: 'moderate', priority: 1 },
        { type: 'style', constraint: 'technical', priority: 2 }
      ],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0',
        author: 'system',
        usageCount: 0,
        successRate: 0.8,
        averageRating: 4.2
      }
    }

    // Problem solving template
    const problemSolvingTemplate: PromptTemplate = {
      id: 'problem-solving',
      name: 'General Problem Solving',
      description: 'Helps solve various types of problems',
      objective: 'problem-solving',
      domain: 'general',
      template: `You are a helpful problem-solving assistant. Here's the situation:

Context: {{CONTEXT}}
Problem: {{USER_QUERY}}
Domain: {{DOMAIN}}
Expertise Level: {{EXPERTISE_LEVEL}}

Historical Context: {{HISTORICAL_CONTEXT}}
Suggested Actions: {{SUGGESTED_ACTIONS}}

Please provide:
1. Problem analysis
2. Step-by-step solution
3. Alternative approaches
4. Expected outcomes

Tailor your response to the user's expertise level.`,
      variables: [
        { name: 'CONTEXT', type: 'string', required: true, description: 'Situational context' },
        { name: 'USER_QUERY', type: 'string', required: true, description: 'Problem to solve' },
        { name: 'DOMAIN', type: 'string', required: false, description: 'Problem domain' },
        { name: 'EXPERTISE_LEVEL', type: 'string', required: false, description: 'User expertise' }
      ],
      examples: [],
      constraints: [
        { type: 'length', constraint: 'detailed', priority: 1 },
        { type: 'style', constraint: 'conversational', priority: 2 }
      ],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0',
        author: 'system',
        usageCount: 0,
        successRate: 0.75,
        averageRating: 4.0
      }
    }

    this.templates.set(codeAnalysisTemplate.id, codeAnalysisTemplate)
    this.templates.set(problemSolvingTemplate.id, problemSolvingTemplate)
  }

  // Helper methods
  private generatePromptId(): string {
    return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateContextSummary(engineeredContext: EngineeredContext): string {
    return `${engineeredContext.domainSpecificInfo.domain} context with ${engineeredContext.relevantHistory.length} historical references`
  }

  private generateExpectedOutcome(objective: PromptObjective, context: EngineeredContext): string {
    const outcomeMap: Record<PromptObjective, string> = {
      'code-generation': 'Well-structured, functional code with explanations',
      'problem-solving': 'Step-by-step solution with alternatives',
      'analysis': 'Detailed analysis with insights and recommendations',
      'explanation': 'Clear, comprehensive explanation',
      'optimization': 'Improved solution with performance benefits',
      'debugging': 'Identified issues with fixes',
      'research': 'Comprehensive research findings',
      'creative': 'Creative solutions and ideas',
      'planning': 'Structured plan with actionable steps'
    }
    return outcomeMap[objective] || 'Helpful and relevant response'
  }

  private extractUsedContextElements(context: EngineeredContext): string[] {
    const elements = ['situational-context']
    if (context.domainSpecificInfo.domain) elements.push('domain-info')
    if (context.relevantHistory.length > 0) elements.push('historical-context')
    if (context.suggestedActions.length > 0) elements.push('suggested-actions')
    return elements
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token per 4 characters
    return Math.ceil(text.length / 4)
  }

  private scoreTemplateCompatibility(template: PromptTemplate, context: EngineeredContext): number {
    let score = 0
    
    // Domain match
    if (template.domain === context.domainSpecificInfo.domain) score += 0.5
    
    // Success rate
    score += (template.metadata.successRate || 0.5) * 0.3
    
    // Usage count (popularity)
    score += Math.min(0.2, template.metadata.usageCount / 100)
    
    return score
  }

  private getGeneralTemplate(objective: PromptObjective): PromptTemplate {
    // Return a basic template for the objective
    return this.templates.get('problem-solving') || this.createFallbackTemplate(objective)
  }

  private createFallbackTemplate(objective: PromptObjective): PromptTemplate {
    return {
      id: 'fallback',
      name: 'Fallback Template',
      description: 'Basic template for any objective',
      objective,
      domain: 'general',
      template: 'Please help with: {{USER_QUERY}}\n\nContext: {{CONTEXT}}',
      variables: [],
      examples: [],
      constraints: [],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0',
        author: 'system',
        usageCount: 0,
        successRate: 0.6,
        averageRating: 3.0
      }
    }
  }

  private summarizeHistoricalContext(history: any[]): string {
    if (history.length === 0) return 'No relevant history available'
    return `Based on ${history.length} previous similar contexts`
  }

  // Optimization helper methods
  private removeRedundancy(prompt: string): string {
    // Simple redundancy removal
    return prompt.replace(/\b(\w+)\s+\1\b/gi, '$1')
  }

  private enhanceClarity(prompt: string): string {
    // Basic clarity improvements
    return prompt.replace(/\s+/g, ' ').trim()
  }

  private improveSpecificity(prompt: string): string {
    // Add specificity improvements
    return prompt
  }

  private applyLengthConstraints(prompt: string, template: PromptTemplate): string {
    const lengthConstraint = template.constraints.find(c => c.type === 'length')?.constraint
    
    if (lengthConstraint === 'concise' && prompt.length > 500) {
      return prompt.substring(0, 500) + '...'
    }
    
    return prompt
  }

  private calculateClarityScore(prompt: string): number {
    // Basic clarity scoring
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = prompt.length / sentences.length
    return Math.max(0, Math.min(1, 1 - (avgSentenceLength - 20) / 100))
  }

  private calculateSpecificityScore(prompt: string): number {
    // Count specific terms and keywords
    const specificTerms = ['specific', 'detailed', 'step-by-step', 'example', 'precisely']
    const matches = specificTerms.filter(term => prompt.toLowerCase().includes(term))
    return Math.min(1, matches.length / 3)
  }

  private calculateActionabilityScore(prompt: string): number {
    // Count action-oriented words
    const actionWords = ['provide', 'analyze', 'create', 'implement', 'solve', 'explain']
    const matches = actionWords.filter(word => prompt.toLowerCase().includes(word))
    return Math.min(1, matches.length / 3)
  }

  private getOptimizationStrategies(original: string, optimized: string): string[] {
    const strategies: string[] = []
    
    if (optimized.length < original.length) strategies.push('length-reduction')
    if (optimized !== original) strategies.push('clarity-enhancement')
    
    return strategies
  }

  private generateSimplifiedPrompt(userQuery: string, context: EngineeredContext): string {
    return `Help with: ${userQuery}`
  }

  private generateDirectPrompt(userQuery: string): string {
    return userQuery
  }

  private generateContextFreePrompt(userQuery: string, objective: PromptObjective): string {
    return `As an expert assistant, please ${objective === 'analysis' ? 'analyze' : 'help with'}: ${userQuery}`
  }
}