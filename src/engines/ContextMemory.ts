import {
  ScreenContext,
  ContextSnapshot,
  ContextPattern,
  ContextMemoryConfig,
  UserAction,
  ContextOutcome,
  ContextTrigger,
  PatternOutcome,
  EnvironmentType,
  ActivityType
} from '../types/context'

export class ContextMemory {
  private config: ContextMemoryConfig
  private contextHistory: ContextSnapshot[] = []
  private contextPatterns: Map<string, ContextPattern> = new Map()
  private cleanupTimer: number | null = null

  constructor(config: ContextMemoryConfig) {
    this.config = config
    this.initializeCleanupTimer()
  }

  /**
   * Add a new context snapshot to memory
   */
  public addContextSnapshot(
    context: ScreenContext,
    userActions: UserAction[] = [],
    outcomes: ContextOutcome[] = [],
    duration: number = 0
  ): void {
    const snapshot: ContextSnapshot = {
      context,
      userActions,
      outcomes,
      duration
    }

    this.contextHistory.push(snapshot)
    console.log(`[ContextMemory] Added context snapshot: ${context.id}`)

    // Maintain history size limit
    if (this.contextHistory.length > this.config.maxHistorySize) {
      this.contextHistory = this.contextHistory.slice(-this.config.maxHistorySize)
    }

    // Update pattern detection
    this.updatePatterns(snapshot)
  }

  /**
   * Get relevant context based on current context
   */
  public getRelevantContext(
    currentContext: ScreenContext,
    maxResults: number = 5
  ): ContextSnapshot[] {
    const startTime = Date.now()
    
    // Score and rank historical contexts by relevance
    const scoredContexts = this.contextHistory
      .filter(snapshot => snapshot.context.id !== currentContext.id)
      .map(snapshot => ({
        snapshot,
        relevanceScore: this.calculateRelevanceScore(currentContext, snapshot.context)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)
      .map(item => item.snapshot)

    console.log(`[ContextMemory] Retrieved ${scoredContexts.length} relevant contexts in ${Date.now() - startTime}ms`)
    return scoredContexts
  }

  /**
   * Identify patterns in context usage
   */
  public identifyPatterns(): ContextPattern[] {
    const patterns: ContextPattern[] = []

    // Environment-based patterns
    const environmentPatterns = this.identifyEnvironmentPatterns()
    patterns.push(...environmentPatterns)

    // Activity-based patterns
    const activityPatterns = this.identifyActivityPatterns()
    patterns.push(...activityPatterns)

    // Temporal patterns
    const temporalPatterns = this.identifyTemporalPatterns()
    patterns.push(...temporalPatterns)

    // Update pattern storage
    patterns.forEach(pattern => {
      this.contextPatterns.set(pattern.id, pattern)
    })

    console.log(`[ContextMemory] Identified ${patterns.length} context patterns`)
    return patterns
  }

  /**
   * Get stored patterns
   */
  public getPatterns(): ContextPattern[] {
    return Array.from(this.contextPatterns.values())
  }

  /**
   * Get pattern by ID
   */
  public getPattern(id: string): ContextPattern | undefined {
    return this.contextPatterns.get(id)
  }

  /**
   * Get context history
   */
  public getContextHistory(limit?: number): ContextSnapshot[] {
    if (limit) {
      return this.contextHistory.slice(-limit)
    }
    return [...this.contextHistory]
  }

  /**
   * Clear old contexts based on retention period
   */
  public cleanup(): void {
    const cutoffTime = Date.now() - this.config.contextRetentionPeriod
    const originalLength = this.contextHistory.length

    this.contextHistory = this.contextHistory.filter(
      snapshot => snapshot.context.timestamp > cutoffTime
    )

    const removedCount = originalLength - this.contextHistory.length
    if (removedCount > 0) {
      console.log(`[ContextMemory] Cleaned up ${removedCount} old context snapshots`)
    }
  }

  /**
   * Calculate relevance score between two contexts
   */
  private calculateRelevanceScore(current: ScreenContext, historical: ScreenContext): number {
    let score = 0

    // Environment similarity (30% weight)
    if (current.environment === historical.environment) {
      score += 0.3
    }

    // Activity similarity (25% weight)
    if (current.activity === historical.activity) {
      score += 0.25
    }

    // Application similarity (20% weight)
    if (current.applicationDetails.activeApplication === historical.applicationDetails.activeApplication) {
      score += 0.2
    }

    // Time recency (15% weight)
    const timeDiff = current.timestamp - historical.timestamp
    const maxTime = 24 * 60 * 60 * 1000 // 24 hours
    const timeScore = Math.max(0, 1 - (timeDiff / maxTime))
    score += timeScore * 0.15

    // Confidence factor (10% weight)
    score += (historical.confidence * 0.1)

    return Math.min(1, score)
  }

  /**
   * Update pattern detection with new snapshot
   */
  private updatePatterns(snapshot: ContextSnapshot): void {
    // Simple pattern detection - can be enhanced with ML
    const context = snapshot.context
    const patternKey = `${context.environment}-${context.activity}`

    if (!this.contextPatterns.has(patternKey)) {
      const pattern: ContextPattern = {
        id: patternKey,
        name: `${context.environment} ${context.activity} pattern`,
        frequency: 1,
        contexts: [context],
        triggers: this.identifyTriggers(snapshot),
        outcomes: [],
        confidence: 0.1
      }
      this.contextPatterns.set(patternKey, pattern)
    } else {
      const existingPattern = this.contextPatterns.get(patternKey)!
      existingPattern.frequency += 1
      existingPattern.contexts.push(context)
      existingPattern.confidence = Math.min(1, existingPattern.frequency / 10)
    }
  }

  /**
   * Identify environment-based patterns
   */
  private identifyEnvironmentPatterns(): ContextPattern[] {
    const environmentGroups = new Map<EnvironmentType, ContextSnapshot[]>()

    // Group contexts by environment
    this.contextHistory.forEach(snapshot => {
      const env = snapshot.context.environment
      if (!environmentGroups.has(env)) {
        environmentGroups.set(env, [])
      }
      environmentGroups.get(env)!.push(snapshot)
    })

    const patterns: ContextPattern[] = []
    environmentGroups.forEach((snapshots, environment) => {
      if (snapshots.length >= this.config.patternDetectionThreshold) {
        const pattern: ContextPattern = {
          id: `env-${environment}`,
          name: `${environment} environment pattern`,
          frequency: snapshots.length,
          contexts: snapshots.map(s => s.context),
          triggers: this.extractCommonTriggers(snapshots),
          outcomes: this.extractCommonOutcomes(snapshots),
          confidence: Math.min(1, snapshots.length / 20)
        }
        patterns.push(pattern)
      }
    })

    return patterns
  }

  /**
   * Identify activity-based patterns
   */
  private identifyActivityPatterns(): ContextPattern[] {
    const activityGroups = new Map<ActivityType, ContextSnapshot[]>()

    // Group contexts by activity
    this.contextHistory.forEach(snapshot => {
      const activity = snapshot.context.activity
      if (!activityGroups.has(activity)) {
        activityGroups.set(activity, [])
      }
      activityGroups.get(activity)!.push(snapshot)
    })

    const patterns: ContextPattern[] = []
    activityGroups.forEach((snapshots, activity) => {
      if (snapshots.length >= this.config.patternDetectionThreshold) {
        const pattern: ContextPattern = {
          id: `activity-${activity}`,
          name: `${activity} activity pattern`,
          frequency: snapshots.length,
          contexts: snapshots.map(s => s.context),
          triggers: this.extractCommonTriggers(snapshots),
          outcomes: this.extractCommonOutcomes(snapshots),
          confidence: Math.min(1, snapshots.length / 15)
        }
        patterns.push(pattern)
      }
    })

    return patterns
  }

  /**
   * Identify temporal patterns (e.g., time of day, day of week)
   */
  private identifyTemporalPatterns(): ContextPattern[] {
    const patterns: ContextPattern[] = []
    
    // Group by hour of day
    const hourlyGroups = new Map<number, ContextSnapshot[]>()
    this.contextHistory.forEach(snapshot => {
      const hour = new Date(snapshot.context.timestamp).getHours()
      if (!hourlyGroups.has(hour)) {
        hourlyGroups.set(hour, [])
      }
      hourlyGroups.get(hour)!.push(snapshot)
    })

    hourlyGroups.forEach((snapshots, hour) => {
      if (snapshots.length >= this.config.patternDetectionThreshold) {
        const pattern: ContextPattern = {
          id: `time-${hour}`,
          name: `${hour}:00 temporal pattern`,
          frequency: snapshots.length,
          contexts: snapshots.map(s => s.context),
          triggers: [{ type: 'temporal', condition: `hour=${hour}`, weight: 1 }],
          outcomes: this.extractCommonOutcomes(snapshots),
          confidence: Math.min(1, snapshots.length / 10)
        }
        patterns.push(pattern)
      }
    })

    return patterns
  }

  /**
   * Extract common triggers from snapshots
   */
  private extractCommonTriggers(snapshots: ContextSnapshot[]): ContextTrigger[] {
    // Simple trigger extraction - can be enhanced
    const triggers: ContextTrigger[] = []

    if (snapshots.length > 0) {
      const firstContext = snapshots[0].context
      triggers.push({
        type: 'environment',
        condition: `environment=${firstContext.environment}`,
        weight: 0.7
      })
    }

    return triggers
  }

  /**
   * Extract common outcomes from snapshots
   */
  private extractCommonOutcomes(snapshots: ContextSnapshot[]): PatternOutcome[] {
    // Aggregate outcomes from snapshots
    const outcomeMap = new Map<string, { count: number; successes: number; totalValue: number }>()

    snapshots.forEach(snapshot => {
      snapshot.outcomes.forEach(outcome => {
        if (!outcomeMap.has(outcome.metric)) {
          outcomeMap.set(outcome.metric, { count: 0, successes: 0, totalValue: 0 })
        }
        const stats = outcomeMap.get(outcome.metric)!
        stats.count += 1
        stats.totalValue += outcome.value
        if (outcome.success) stats.successes += 1
      })
    })

    const outcomes: PatternOutcome[] = []
    outcomeMap.forEach((stats, metric) => {
      outcomes.push({
        pattern: metric,
        frequency: stats.count,
        successRate: stats.successes / stats.count,
        averageValue: stats.totalValue / stats.count
      })
    })

    return outcomes
  }

  /**
   * Identify triggers for a single snapshot
   */
  private identifyTriggers(snapshot: ContextSnapshot): ContextTrigger[] {
    const triggers: ContextTrigger[] = []
    const context = snapshot.context

    // Application trigger
    if (context.applicationDetails.activeApplication) {
      triggers.push({
        type: 'application',
        condition: `app=${context.applicationDetails.activeApplication}`,
        weight: 0.8
      })
    }

    // Environment trigger
    triggers.push({
      type: 'environment',
      condition: `env=${context.environment}`,
      weight: 0.6
    })

    return triggers
  }

  /**
   * Initialize cleanup timer
   */
  private initializeCleanupTimer(): void {
    // Clean up every hour
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, 60 * 60 * 1000)
  }

  /**
   * Destroy the context memory instance
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}