/**
 * lib/events/event-validators.ts
 * 
 * Runtime validation for event data schemas
 * Ensures data integrity before storage
 */

import { EventType } from './types.js';

type EventDataRecord = Record<string, unknown>;

interface EventLike {
  eventId?: unknown;
  projectId?: unknown;
  timestamp?: unknown;
  eventType?: unknown;
  data?: unknown;
}

function readString(data: EventDataRecord, key: string): string | undefined {
  const value = data[key];
  return typeof value === 'string' ? value : undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Validate event data against its schema
 */
export function validateEventData(eventType: EventType, data: EventDataRecord): ValidationResult {
  const errors: string[] = [];

  switch (eventType) {
    case EventType.TASK_COMPLETED:
      if (!isNonEmptyString(readString(data, 'description'))) {
        errors.push('description is required');
      }
      if (!['success', 'partial', 'failed'].includes(String(data.outcome))) {
        errors.push('Invalid outcome');
      }
      break;

    case EventType.DECISION_MADE:
      if (!isNonEmptyString(readString(data, 'decision'))) {
        errors.push('decision is required');
      }
      if (!isNonEmptyString(readString(data, 'rationale'))) {
        errors.push('rationale is required');
      }
      break;

    case EventType.PATTERN_DISCOVERED: {
      if (!isNonEmptyString(readString(data, 'pattern'))) {
        errors.push('pattern is required');
      }
      if (!isNonEmptyString(readString(data, 'solution'))) {
        errors.push('solution is required');
      }
      const validCategories = ['error_resolution', 'best_practice', 'workaround', 'optimization', 'project_specific'];
      if (!validCategories.includes(String(data.category))) {
        errors.push('Invalid category');
      }
      if (typeof data.reusable !== 'boolean') {
        errors.push('reusable must be a boolean');
      }
      break;
    }

    case EventType.VALIDATION_PASSED:
      if (!isNonEmptyString(readString(data, 'result'))) {
        errors.push('result is required');
      }
      break;

    case EventType.BUG_ENCOUNTERED:
      if (!isNonEmptyString(readString(data, 'description'))) {
        errors.push('description is required');
      }
      if (!['critical', 'high', 'medium', 'low'].includes(String(data.severity))) {
        errors.push('Invalid severity');
      }
      break;

    case EventType.BUG_RESOLVED:
      if (!isNonEmptyString(readString(data, 'bugDescription'))) {
        errors.push('bugDescription is required');
      }
      if (!isNonEmptyString(readString(data, 'rootCause'))) {
        errors.push('rootCause is required');
      }
      if (!isNonEmptyString(readString(data, 'fixDescription'))) {
        errors.push('fixDescription is required');
      }
      break;

    case EventType.LEARNING_CAPTURED: {
      if (!isNonEmptyString(readString(data, 'learning'))) {
        errors.push('learning is required');
      }
      const validApplicability = ['project_specific', 'language_specific', 'universal'];
      if (!validApplicability.includes(String(data.applicability))) {
        errors.push('Invalid applicability');
      }
      const validConfidence = ['low', 'medium', 'high'];
      if (!validConfidence.includes(String(data.confidence))) {
        errors.push('Invalid confidence');
      }
      break;
    }

    case EventType.SESSION_STARTED:
      if (!isNonEmptyString(readString(data, 'title'))) {
        errors.push('title is required');
      }
      if (!Array.isArray(data.topics)) {
        errors.push('topics must be an array');
      }
      break;

    case EventType.GOAL_DEFINED:
      if (!isNonEmptyString(readString(data, 'goal'))) {
        errors.push('goal is required');
      }
      break;

    default:
      errors.push(`Unknown event type: ${eventType}`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate complete event object
 */
export function validateEvent(event: EventLike): ValidationResult {
  const errors: string[] = [];

  // Validate base fields
  if (!isNonEmptyString(event.eventId) || !event.eventId.match(/^evt-[a-f0-9-]{36}$/)) {
    errors.push('Invalid eventId format (expected evt-<uuid>)');
  }
  if (!isNonEmptyString(event.projectId)) {
    errors.push('projectId is required');
  }
  if (!isNonEmptyString(event.timestamp) || !isValidISO8601(event.timestamp)) {
    errors.push('Invalid timestamp format (expected ISO 8601)');
  }
  if (!isNonEmptyString(event.eventType) || !Object.values(EventType).includes(event.eventType as EventType)) {
    errors.push('Invalid eventType');
  }

  // Validate event data
  if (isNonEmptyString(event.eventType) && event.data && typeof event.data === 'object') {
    const dataValidation = validateEventData(event.eventType as EventType, event.data as EventDataRecord);
    if (!dataValidation.valid) {
      errors.push(...(dataValidation.errors || []));
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Check if string is valid ISO 8601 timestamp
 */
function isValidISO8601(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.toISOString() === timestamp;
}
