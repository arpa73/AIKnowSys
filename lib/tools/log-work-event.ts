// lib/tools/log-work-event.ts
import { SqliteStorage } from '../context/sqlite-storage.js';
import { DatabaseLocator } from '../context/database-locator.js';
import { EventFactory } from '../events/event-factory.js';
import { EventType } from '../events/types.js';
import type { KnowledgeEvent } from '../events/types.js';
import path from 'path';

export interface LogWorkEventParams {
  type: string;
  data: Record<string, unknown>;
  projectId: string;
  planId?: string;
  sessionId?: string;
  projectPath?: string;
}

/**
 * Runtime guard for EventType values.
 */
function isEventType(value: string): value is EventType {
  return Object.values(EventType).includes(value as EventType);
}

/**
 * Read a required string field from event data.
 */
function getRequiredStringField(data: Record<string, unknown>, fieldName: string): string {
  const value = data[fieldName];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Field '${fieldName}' is required and must be a non-empty string.`);
  }

  return value;
}

/**
 * Read an optional string field from event data.
 */
function getOptionalStringField(data: Record<string, unknown>, fieldName: string): string | undefined {
  const value = data[fieldName];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`Field '${fieldName}' must be a string when provided.`);
  }

  return value;
}

/**
 * Build a validated KnowledgeEvent from tool parameters.
 */
function buildEvent(params: LogWorkEventParams, eventType: EventType): KnowledgeEvent {
  const baseOptions = {
    projectId: params.projectId,
    planId: params.planId,
    sessionId: params.sessionId
  };

  switch (eventType) {
    case EventType.VALIDATION_PASSED:
      return EventFactory.validationPassed({
        ...baseOptions,
        result: getRequiredStringField(params.data, 'result'),
        validationType: getOptionalStringField(params.data, 'validationType'),
        command: getOptionalStringField(params.data, 'command')
      });

    case EventType.TASK_COMPLETED:
      return EventFactory.taskCompleted({
        ...baseOptions,
        description: getRequiredStringField(params.data, 'description'),
        outcome: getRequiredStringField(params.data, 'outcome') as 'success' | 'partial' | 'failed',
        taskId: getOptionalStringField(params.data, 'taskId')
      });

    case EventType.DECISION_MADE:
      return EventFactory.decisionMade({
        ...baseOptions,
        decision: getRequiredStringField(params.data, 'decision'),
        rationale: getRequiredStringField(params.data, 'rationale')
      });

    case EventType.PATTERN_DISCOVERED:
      return EventFactory.patternDiscovered({
        ...baseOptions,
        pattern: getRequiredStringField(params.data, 'pattern'),
        solution: getRequiredStringField(params.data, 'solution'),
        category: getRequiredStringField(params.data, 'category') as 'error_resolution' | 'best_practice' | 'workaround' | 'optimization' | 'project_specific',
        reusable: Boolean(params.data.reusable)
      });

    case EventType.BUG_ENCOUNTERED:
      return EventFactory.bugEncountered({
        ...baseOptions,
        description: getRequiredStringField(params.data, 'description'),
        severity: getRequiredStringField(params.data, 'severity') as 'critical' | 'high' | 'medium' | 'low'
      });

    case EventType.BUG_RESOLVED:
      return EventFactory.bugResolved({
        ...baseOptions,
        bugDescription: getRequiredStringField(params.data, 'bugDescription'),
        rootCause: getRequiredStringField(params.data, 'rootCause'),
        fixDescription: getRequiredStringField(params.data, 'fixDescription')
      });

    case EventType.LEARNING_CAPTURED:
      return EventFactory.learningCaptured({
        ...baseOptions,
        learning: getRequiredStringField(params.data, 'learning'),
        applicability: getRequiredStringField(params.data, 'applicability') as 'project_specific' | 'language_specific' | 'universal',
        confidence: getRequiredStringField(params.data, 'confidence') as 'low' | 'medium' | 'high'
      });

    case EventType.SESSION_STARTED:
      return EventFactory.sessionStarted({
        ...baseOptions,
        title: getRequiredStringField(params.data, 'title'),
        topics: Array.isArray(params.data.topics)
          ? params.data.topics.filter((topic): topic is string => typeof topic === 'string')
          : []
      });

    case EventType.GOAL_DEFINED:
      return EventFactory.goalDefined({
        ...baseOptions,
        goal: getRequiredStringField(params.data, 'goal')
      });

    default:
      throw new Error(
        `Unsupported event type for log_work_event: ${eventType}. `
        + 'Supported types: validation_passed, task_completed, decision_made, pattern_discovered, '
        + 'bug_encountered, bug_resolved, learning_captured, session_started, goal_defined.'
      );
  }
}

/**
 * Log a structured work event to the database
 * This is the primary mechanism for "Event Sourcing" the project history.
 */
export async function logWorkEvent(params: LogWorkEventParams): Promise<string> {
  // Validate Event Type
  if (!isEventType(params.type)) {
    throw new Error(
      `Invalid event type: ${params.type}. Supported types: ${Object.values(EventType).join(', ')}`
    );
  }

  // initialize storage
  const storage = new SqliteStorage();
  // Ensure consistent DB path resolution between production and tests.
  // DatabaseLocator respects .aiknowsys.config and global DB settings.
  const locator = new DatabaseLocator();
  const projectPath = params.projectPath ? path.resolve(params.projectPath) : process.cwd();
  const config = await locator.getDatabaseConfig(projectPath);
  await storage.init(config.dbPath);

  const event = buildEvent(params, params.type);

  await storage.insertEvent(event);
  
  return `Event logged: ${event.eventId} (${event.eventType})`;
}
