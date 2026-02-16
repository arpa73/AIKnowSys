/**
 * lib/events/event-factory.ts
 * 
 * TDD Step 2 (GREEN): Event factory functions with validation
 * 
 * Provides type-safe event creation with runtime validation.
 * Each factory function ensures data integrity before creating events.
 */

import { randomUUID } from 'crypto';
import {
  KnowledgeEvent,
  EventType,
  TaskCompletedData,
  DecisionMadeData,
  PatternDiscoveredData,
  ValidationPassedData,
  BugEncounteredData,
  BugResolvedData,
  LearningCapturedData,
  SessionStartedData,
  GoalDefinedData
} from './types.js';

/**
 * Base options for creating any event
 */
interface BaseEventOptions {
  projectId: string;
  sessionId?: string;
  planId?: string;
}

/**
 * Options for task_completed events
 */
interface TaskCompletedOptions extends BaseEventOptions {
  taskId?: string;
  description: string;
  outcome: 'success' | 'partial' | 'failed';
  duration?: number;
  filesChanged?: string[];
  testsPassing?: number;
  testsTotal?: number;
  validationCommands?: string[];
}

/**
 * Options for decision_made events
 */
interface DecisionMadeOptions extends BaseEventOptions {
  decision: string;
  rationale: string;
  alternatives?: string[];
  alternativesConsidered?: string[];
  impact?: Record<string, string | number>;
  tradeOffs?: {
    pros: string[];
    cons: string[];
  };
}

/**
 * Options for pattern_discovered events
 */
interface PatternDiscoveredOptions extends BaseEventOptions {
  pattern: string;
  category: 'error_resolution' | 'best_practice' | 'workaround' | 'optimization' | 'project_specific';
  trigger?: string;
  solution: string;
  reusable: boolean;
  applicability?: string;
}

/**
 * Options for validation_passed events
 */
interface ValidationPassedOptions extends BaseEventOptions {
  validationType?: string;
  command?: string;
  result: string;
  durationMs?: number;
  coverage?: {
    lines: number;
    branches: number;
  };
}

/**
 * Options for bug_encountered events
 */
interface BugEncounteredOptions extends BaseEventOptions {
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  stackTrace?: string;
  affectedFiles?: string[];
}

/**
 * Options for bug_resolved events
 */
interface BugResolvedOptions extends BaseEventOptions {
  bugDescription: string;
  rootCause: string;
  fixDescription: string;
  prevention?: string;
  filesChanged?: string[];
}

/**
 * Options for learning_captured events
 */
interface LearningCapturedOptions extends BaseEventOptions {
  learning: string;
  evidence?: string;
  applicability: 'project_specific' | 'language_specific' | 'universal';
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Options for session_started events
 */
interface SessionStartedOptions extends BaseEventOptions {
  title: string;
  topics: string[];
  goal?: string;
}

/**
 * Options for goal_defined events
 */
interface GoalDefinedOptions extends BaseEventOptions {
  goal: string;
  successCriteria?: string[];
}

/**
 * Event factory for creating validated knowledge events
 */
export class EventFactory {
  /**
   * Create a task_completed event
   */
  static taskCompleted(options: TaskCompletedOptions): KnowledgeEvent {
    // Validate required fields
    if (!options.description || options.description.trim() === '') {
      throw new Error('description is required and cannot be empty');
    }

    // Validate outcome enum
    const validOutcomes = ['success', 'partial', 'failed'];
    if (!validOutcomes.includes(options.outcome)) {
      throw new Error(`Invalid outcome: ${options.outcome}. Must be one of: ${validOutcomes.join(', ')}`);
    }

    const data: TaskCompletedData = {
      taskId: options.taskId,
      description: options.description,
      outcome: options.outcome,
      duration: options.duration,
      filesChanged: options.filesChanged,
      testsPassing: options.testsPassing,
      testsTotal: options.testsTotal,
      validationCommands: options.validationCommands
    };

    return this.createEvent(options, EventType.TASK_COMPLETED, data);
  }

  /**
   * Create a decision_made event
   */
  static decisionMade(options: DecisionMadeOptions): KnowledgeEvent {
    // Validate required fields
    if (!options.decision || options.decision.trim() === '') {
      throw new Error('decision cannot be empty');
    }
    if (!options.rationale || options.rationale.trim() === '') {
      throw new Error('rationale is required');
    }

    const data: DecisionMadeData = {
      decision: options.decision,
      rationale: options.rationale,
      alternatives: options.alternatives,
      alternativesConsidered: options.alternativesConsidered,
      impact: options.impact,
      tradeOffs: options.tradeOffs
    };

    return this.createEvent(options, EventType.DECISION_MADE, data);
  }

  /**
   * Create a pattern_discovered event
   */
  static patternDiscovered(options: PatternDiscoveredOptions): KnowledgeEvent {
    // Validate required fields
    if (!options.pattern || options.pattern.trim() === '') {
      throw new Error('pattern is required');
    }
    if (!options.solution || options.solution.trim() === '') {
      throw new Error('solution is required');
    }

    // Validate category enum
    const validCategories = ['error_resolution', 'best_practice', 'workaround', 'optimization', 'project_specific'];
    if (!validCategories.includes(options.category)) {
      throw new Error(`Invalid category: ${options.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    const data: PatternDiscoveredData = {
      pattern: options.pattern,
      category: options.category,
      trigger: options.trigger,
      solution: options.solution,
      reusable: options.reusable,
      applicability: options.applicability
    };

    return this.createEvent(options, EventType.PATTERN_DISCOVERED, data);
  }

  /**
   * Create a validation_passed event
   */
  static validationPassed(options: ValidationPassedOptions): KnowledgeEvent {
    // Validate required fields
    if (!options.result || options.result.trim() === '') {
      throw new Error('result is required');
    }

    const data: ValidationPassedData = {
      validationType: options.validationType,
      command: options.command,
      result: options.result,
      durationMs: options.durationMs,
      coverage: options.coverage
    };

    return this.createEvent(options, EventType.VALIDATION_PASSED, data);
  }

  /**
   * Create a bug_encountered event
   */
  static bugEncountered(options: BugEncounteredOptions): KnowledgeEvent {
    // Validate required fields
    if (!options.description || options.description.trim() === '') {
      throw new Error('description is required');
    }

    // Validate severity enum
    const validSeverities = ['critical', 'high', 'medium', 'low'];
    if (!validSeverities.includes(options.severity)) {
      throw new Error(`Invalid severity: ${options.severity}. Must be one of: ${validSeverities.join(', ')}`);
    }

    const data: BugEncounteredData = {
      description: options.description,
      severity: options.severity,
      stackTrace: options.stackTrace,
      affectedFiles: options.affectedFiles
    };

    return this.createEvent(options, EventType.BUG_ENCOUNTERED, data);
  }

  /**
   * Create a bug_resolved event
   */
  static bugResolved(options: BugResolvedOptions): KnowledgeEvent {
    // Validate required fields
    if (!options.bugDescription || options.bugDescription.trim() === '') {
      throw new Error('bugDescription is required');
    }
    if (!options.rootCause || options.rootCause.trim() === '') {
      throw new Error('rootCause is required');
    }
    if (!options.fixDescription || options.fixDescription.trim() === '') {
      throw new Error('fixDescription is required');
    }

    const data: BugResolvedData = {
      bugDescription: options.bugDescription,
      rootCause: options.rootCause,
      fixDescription: options.fixDescription,
      prevention: options.prevention,
      filesChanged: options.filesChanged
    };

    return this.createEvent(options, EventType.BUG_RESOLVED, data);
  }

  /**
   * Create a learning_captured event
   */
  static learningCaptured(options: LearningCapturedOptions): KnowledgeEvent {
    // Validate required fields
    if (!options.learning || options.learning.trim() === '') {
      throw new Error('learning is required');
    }

    // Validate applicability enum
    const validApplicability = ['project_specific', 'language_specific', 'universal'];
    if (!validApplicability.includes(options.applicability)) {
      throw new Error(`Invalid applicability: ${options.applicability}. Must be one of: ${validApplicability.join(', ')}`);
    }

    // Validate confidence enum
    const validConfidence = ['low', 'medium', 'high'];
    if (!validConfidence.includes(options.confidence)) {
      throw new Error(`Invalid confidence: ${options.confidence}. Must be one of: ${validConfidence.join(', ')}`);
    }

    const data: LearningCapturedData = {
      learning: options.learning,
      evidence: options.evidence,
      applicability: options.applicability,
      confidence: options.confidence
    };

    return this.createEvent(options, EventType.LEARNING_CAPTURED, data);
  }

  /**
   * Create a session_started event
   */
  static sessionStarted(options: SessionStartedOptions): KnowledgeEvent {
    if (!options.title || options.title.trim() === '') {
      throw new Error('title is required');
    }

    const data: SessionStartedData = {
      title: options.title,
      topics: options.topics || [],
      goal: options.goal
    };

    return this.createEvent(options, EventType.SESSION_STARTED, data);
  }

  /**
   * Create a goal_defined event
   */
  static goalDefined(options: GoalDefinedOptions): KnowledgeEvent {
    if (!options.goal || options.goal.trim() === '') {
      throw new Error('goal is required');
    }

    const data: GoalDefinedData = {
      goal: options.goal,
      successCriteria: options.successCriteria
    };

    return this.createEvent(options, EventType.GOAL_DEFINED, data);
  }

  /**
   * Internal: Create base event structure
   */
  private static createEvent(
    options: BaseEventOptions,
    eventType: EventType,
    data: any
  ): KnowledgeEvent {
    return {
      eventId: `evt-${randomUUID()}`,
      projectId: options.projectId,
      sessionId: options.sessionId,
      planId: options.planId,
      timestamp: new Date().toISOString(),
      eventType,
      data
    };
  }
}
