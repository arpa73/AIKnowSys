/**
 * lib/events/event-validators.ts
 * 
 * Runtime validation for event data schemas
 * Ensures data integrity before storage
 */

import { EventType } from './types.js';

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
export function validateEventData(eventType: EventType, data: any): ValidationResult {
  const errors: string[] = [];

  switch (eventType) {
    case EventType.TASK_COMPLETED:
      if (!data.description || data.description.trim() === '') {
        errors.push('description is required');
      }
      if (!['success', 'partial', 'failed'].includes(data.outcome)) {
        errors.push('Invalid outcome');
      }
      break;

    case EventType.DECISION_MADE:
      if (!data.decision || data.decision.trim() === '') {
        errors.push('decision is required');
      }
      if (!data.rationale || data.rationale.trim() === '') {
        errors.push('rationale is required');
      }
      break;

    case EventType.PATTERN_DISCOVERED:
      if (!data.pattern || data.pattern.trim() === '') {
        errors.push('pattern is required');
      }
      if (!data.solution || data.solution.trim() === '') {
        errors.push('solution is required');
      }
      const validCategories = ['error_resolution', 'best_practice', 'workaround', 'optimization', 'project_specific'];
      if (!validCategories.includes(data.category)) {
        errors.push('Invalid category');
      }
      if (typeof data.reusable !== 'boolean') {
        errors.push('reusable must be a boolean');
      }
      break;

    case EventType.VALIDATION_PASSED:
      if (!data.result || data.result.trim() === '') {
        errors.push('result is required');
      }
      break;

    case EventType.BUG_ENCOUNTERED:
      if (!data.description || data.description.trim() === '') {
        errors.push('description is required');
      }
      if (!['critical', 'high', 'medium', 'low'].includes(data.severity)) {
        errors.push('Invalid severity');
      }
      break;

    case EventType.BUG_RESOLVED:
      if (!data.bugDescription || data.bugDescription.trim() === '') {
        errors.push('bugDescription is required');
      }
      if (!data.rootCause || data.rootCause.trim() === '') {
        errors.push('rootCause is required');
      }
      if (!data.fixDescription || data.fixDescription.trim() === '') {
        errors.push('fixDescription is required');
      }
      break;

    case EventType.LEARNING_CAPTURED:
      if (!data.learning || data.learning.trim() === '') {
        errors.push('learning is required');
      }
      const validApplicability = ['project_specific', 'language_specific', 'universal'];
      if (!validApplicability.includes(data.applicability)) {
        errors.push('Invalid applicability');
      }
      const validConfidence = ['low', 'medium', 'high'];
      if (!validConfidence.includes(data.confidence)) {
        errors.push('Invalid confidence');
      }
      break;

    case EventType.SESSION_STARTED:
      if (!data.title || data.title.trim() === '') {
        errors.push('title is required');
      }
      if (!Array.isArray(data.topics)) {
        errors.push('topics must be an array');
      }
      break;

    case EventType.GOAL_DEFINED:
      if (!data.goal || data.goal.trim() === '') {
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
export function validateEvent(event: any): ValidationResult {
  const errors: string[] = [];

  // Validate base fields
  if (!event.eventId || !event.eventId.match(/^evt-[a-f0-9-]{36}$/)) {
    errors.push('Invalid eventId format (expected evt-<uuid>)');
  }
  if (!event.projectId || event.projectId.trim() === '') {
    errors.push('projectId is required');
  }
  if (!event.timestamp || !isValidISO8601(event.timestamp)) {
    errors.push('Invalid timestamp format (expected ISO 8601)');
  }
  if (!event.eventType || !Object.values(EventType).includes(event.eventType)) {
    errors.push('Invalid eventType');
  }

  // Validate event data
  if (event.eventType && event.data) {
    const dataValidation = validateEventData(event.eventType, event.data);
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
