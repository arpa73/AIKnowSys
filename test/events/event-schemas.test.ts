/**
 * test/events/event-schemas.test.ts
 * 
 * TDD Step 1 (RED): Comprehensive tests for event type validation and creation
 * 
 * Test coverage:
 * - Event factory creates valid events
 * - Schema validation catches invalid data
 * - Type safety enforced at runtime
 * - All required fields present
 * - Optional fields work correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventType } from '../../lib/events/types.js';
import { EventFactory } from '../../lib/events/event-factory.js';
import { validateEventData } from '../../lib/events/event-validators.js';

type TaskCompletedInput = Parameters<typeof EventFactory.taskCompleted>[0];
type DecisionMadeInput = Parameters<typeof EventFactory.decisionMade>[0];
type PatternDiscoveredInput = Parameters<typeof EventFactory.patternDiscovered>[0];
type ValidationPassedInput = Parameters<typeof EventFactory.validationPassed>[0];
type BugEncounteredInput = Parameters<typeof EventFactory.bugEncountered>[0];
type BugResolvedInput = Parameters<typeof EventFactory.bugResolved>[0];
type LearningCapturedInput = Parameters<typeof EventFactory.learningCaptured>[0];

describe('Event Factory - Task Completed Events', () => {
  it('should create valid task_completed event with all fields', () => {
    const event = EventFactory.taskCompleted({
      projectId: 'test-project',
      sessionId: 'session-123',
      description: 'Implement user authentication',
      outcome: 'success',
      filesChanged: ['lib/auth.ts', 'test/auth.test.ts'],
      testsPassing: 42,
      testsTotal: 42,
      validationCommands: ['npm test', 'npm run lint']
    });

    expect(event.eventType).toBe(EventType.TASK_COMPLETED);
    expect(event.projectId).toBe('test-project');
    expect(event.sessionId).toBe('session-123');
    expect(event.eventId).toMatch(/^evt-[a-f0-9-]{36}$/);
    expect(event.timestamp).toBeDefined();
    expect((event.data as TaskCompletedInput).description).toBe('Implement user authentication');
    expect((event.data as TaskCompletedInput).outcome).toBe('success');
    expect((event.data as BugResolvedInput).filesChanged).toHaveLength(2);
  });

  it('should create minimal task_completed event', () => {
    const event = EventFactory.taskCompleted({
      projectId: 'test-project',
      description: 'Fix bug',
      outcome: 'success'
    });

    expect((event.data as TaskCompletedInput).description).toBe('Fix bug');
    expect((event.data as TaskCompletedInput).filesChanged).toBeUndefined();
    expect((event.data as TaskCompletedInput).testsPassing).toBeUndefined();
  });

  it('should reject invalid outcome values', () => {
    expect(() => {
      EventFactory.taskCompleted({
        projectId: 'test-project',
        description: 'Task',
        outcome: 'invalid' as unknown as TaskCompletedInput['outcome']
      });
    }).toThrow(/Invalid outcome/);
  });

  it('should reject missing required fields', () => {
    expect(() => {
      EventFactory.taskCompleted({
        projectId: 'test-project',
        outcome: 'success'
      } as unknown as TaskCompletedInput);
    }).toThrow(/description is required/);
  });
});

describe('Event Factory - Decision Made Events', () => {
  it('should create decision_made event with trade-offs', () => {
    const event = EventFactory.decisionMade({
      projectId: 'test-project',
      decision: 'Use JWT for authentication',
      rationale: 'Stateless auth enables horizontal scaling',
      alternativesConsidered: ['Session cookies', 'OAuth only'],
      tradeOffs: {
        pros: ['Scalable', 'Portable', 'No server state'],
        cons: ['Token size', 'Revocation complexity']
      }
    });

    expect(event.eventType).toBe(EventType.DECISION_MADE);
    expect((event.data as DecisionMadeInput).decision).toBe('Use JWT for authentication');
    expect((event.data as DecisionMadeInput).tradeOffs?.pros).toHaveLength(3);
    expect((event.data as DecisionMadeInput).tradeOffs?.cons).toHaveLength(2);
  });

  it('should create minimal decision_made event', () => {
    const event = EventFactory.decisionMade({
      projectId: 'test-project',
      decision: 'Use TypeScript',
      rationale: 'Type safety reduces bugs'
    });

    expect((event.data as DecisionMadeInput).decision).toBe('Use TypeScript');
    expect((event.data as DecisionMadeInput).alternativesConsidered).toBeUndefined();
    expect((event.data as DecisionMadeInput).tradeOffs).toBeUndefined();
  });

  it('should reject empty decision', () => {
    expect(() => {
      EventFactory.decisionMade({
        projectId: 'test-project',
        decision: '',
        rationale: 'None'
      });
    }).toThrow(/decision cannot be empty/);
  });
});

describe('Event Factory - Pattern Discovered Events', () => {
  it('should create pattern_discovered event', () => {
    const event = EventFactory.patternDiscovered({
      projectId: 'test-project',
      sessionId: 'session-123',
      pattern: 'Always validate env vars at startup',
      category: 'best_practice',
      trigger: 'Production crash from missing DB_URL',
      solution: 'Use joi schema validation in config.ts',
      reusable: true,
      applicability: 'All Node.js projects'
    });

    expect(event.eventType).toBe(EventType.PATTERN_DISCOVERED);
    expect((event.data as PatternDiscoveredInput).category).toBe('best_practice');
    expect((event.data as PatternDiscoveredInput).reusable).toBe(true);
  });

  it('should validate pattern category', () => {
    expect(() => {
      EventFactory.patternDiscovered({
        projectId: 'test-project',
        pattern: 'Test pattern',
        category: 'invalid_category' as unknown as PatternDiscoveredInput['category'],
        solution: 'Test solution',
        reusable: true
      });
    }).toThrow(/Invalid category/);
  });

  it('should require solution field', () => {
    expect(() => {
      EventFactory.patternDiscovered({
        projectId: 'test-project',
        pattern: 'Test pattern',
        category: 'best_practice',
        reusable: true
      } as unknown as PatternDiscoveredInput);
    }).toThrow(/solution is required/);
  });
});

describe('Event Factory - Validation Passed Events', () => {
  it('should create validation_passed event with coverage', () => {
    const event = EventFactory.validationPassed({
      projectId: 'test-project',
      command: 'npm test',
      result: '164/164 tests passing',
      durationMs: 3200,
      coverage: {
        lines: 95,
        branches: 88
      }
    });

    expect(event.eventType).toBe(EventType.VALIDATION_PASSED);
    expect((event.data as ValidationPassedInput).command).toBe('npm test');
    expect((event.data as ValidationPassedInput).coverage?.lines).toBe(95);
  });

  it('should create minimal validation_passed event', () => {
    const event = EventFactory.validationPassed({
      projectId: 'test-project',
      result: 'Build successful'
    });

    expect((event.data as ValidationPassedInput).result).toBe('Build successful');
    expect((event.data as ValidationPassedInput).command).toBeUndefined();
  });
});

describe('Event Factory - Bug Encountered Events', () => {
  it('should create bug_encountered event', () => {
    const event = EventFactory.bugEncountered({
      projectId: 'test-project',
      description: 'Race condition in async init',
      severity: 'high',
      stackTrace: 'Error: Cannot read property...',
      affectedFiles: ['lib/init.ts']
    });

    expect(event.eventType).toBe(EventType.BUG_ENCOUNTERED);
    expect((event.data as BugEncounteredInput).severity).toBe('high');
    expect((event.data as BugEncounteredInput).affectedFiles).toHaveLength(1);
  });

  it('should validate severity levels', () => {
    expect(() => {
      EventFactory.bugEncountered({
        projectId: 'test-project',
        description: 'Bug',
        severity: 'super-critical' as unknown as BugEncounteredInput['severity']
      });
    }).toThrow(/Invalid severity/);
  });

  it('should require description', () => {
    expect(() => {
      EventFactory.bugEncountered({
        projectId: 'test-project',
        severity: 'low'
      } as unknown as BugEncounteredInput);
    }).toThrow(/description is required/);
  });
});

describe('Event Factory - Bug Resolved Events', () => {
  it('should create bug_resolved event', () => {
    const event = EventFactory.bugResolved({
      projectId: 'test-project',
      bugDescription: 'Race condition in async init',
      rootCause: 'Missing await in promise chain',
      fixDescription: 'Added await to database.init() call',
      prevention: 'ESLint rule: no-floating-promises',
      filesChanged: ['lib/init.ts', '.eslintrc.json']
    });

    expect(event.eventType).toBe(EventType.BUG_RESOLVED);
    expect((event.data as BugResolvedInput).rootCause).toBe('Missing await in promise chain');
    expect((event.data as BugResolvedInput).filesChanged).toHaveLength(2);
  });

  it('should require all mandatory fields', () => {
    expect(() => {
      EventFactory.bugResolved({
        projectId: 'test-project',
        bugDescription: 'Bug',
        rootCause: 'Cause'
      } as unknown as BugResolvedInput);
    }).toThrow(/fixDescription is required/);
  });
});

describe('Event Factory - Learning Captured Events', () => {
  it('should create learning_captured event', () => {
    const event = EventFactory.learningCaptured({
      projectId: 'test-project',
      learning: 'TypeScript strict mode catches 80% of bugs before runtime',
      evidence: '3 bugs caught during compilation, 0 in production',
      applicability: 'universal',
      confidence: 'high'
    });

    expect(event.eventType).toBe(EventType.LEARNING_CAPTURED);
    expect((event.data as LearningCapturedInput).applicability).toBe('universal');
    expect((event.data as LearningCapturedInput).confidence).toBe('high');
  });

  it('should validate applicability values', () => {
    expect(() => {
      EventFactory.learningCaptured({
        projectId: 'test-project',
        learning: 'Test learning',
        applicability: 'sometimes' as unknown as LearningCapturedInput['applicability'],
        confidence: 'high'
      });
    }).toThrow(/Invalid applicability/);
  });

  it('should validate confidence levels', () => {
    expect(() => {
      EventFactory.learningCaptured({
        projectId: 'test-project',
        learning: 'Test learning',
        applicability: 'universal',
        confidence: 'maybe' as unknown as LearningCapturedInput['confidence']
      });
    }).toThrow(/Invalid confidence/);
  });
});

describe('Event Validators', () => {
  it('should validate task_completed data', () => {
    const data = {
      description: 'Test task',
      outcome: 'success' as const,
      filesChanged: ['file.ts']
    };

    const result = validateEventData(EventType.TASK_COMPLETED, data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should reject invalid task_completed data', () => {
    const data = {
      // Missing description
      outcome: 'success' as const
    };

    const result = validateEventData(EventType.TASK_COMPLETED, data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('description is required');
  });

  it('should validate decision_made data', () => {
    const data = {
      decision: 'Use JWT',
      rationale: 'Scalability'
    };

    const result = validateEventData(EventType.DECISION_MADE, data);
    expect(result.valid).toBe(true);
  });

  it('should validate pattern_discovered category enum', () => {
    const data = {
      pattern: 'Test pattern',
      category: 'invalid_category',
      solution: 'Test',
      reusable: true
    };

    const result = validateEventData(EventType.PATTERN_DISCOVERED, data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid category');
  });
});
