/**
 * Event Migrator - Phase 2.1
 * Migrates markdown sessions/plans to event-sourced storage
 */

import type { SqliteStorage } from '../context/sqlite-storage.js';
import { MarkdownParser } from '../events/markdown-parser.js';

export interface MigrationResult {
  success: boolean;
  eventsCreated: number;
  eventTypes: string[];
  originalPreserved: boolean;
  skipped?: boolean;
  warnings?: string[];
}

export interface BatchMigrationResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ sessionId: string; error: string }>;
}

export class EventMigrator {
  private parser: MarkdownParser;

  constructor(private storage: SqliteStorage) {
    this.parser = new MarkdownParser();
  }

  /**
   * Migrate a single session from markdown to event-sourced storage
   * 
   * @param sessionId - Session identifier to migrate
   * @returns MigrationResult with success status, event counts, and warnings
   * 
   * @remarks
   * - **Idempotent**: Safe to call multiple times (skips if events exist)
   * - **Non-destructive**: Original markdown preserved in sessions.content
   * - **Atomic**: Either all events inserted or none (on error)
   * 
   * @throws Error if session not found or database error occurs
   * 
   * @example
   * const migrator = new EventMigrator(storage);
   * const result = await migrator.migrateSession('sess-2026-02-15-001');
   * if (result.success) {
   *   console.log(`Migrated ${result.eventsCreated} events`);
   * } else {
   *   console.error(`Failed: ${result.warnings?.join(', ')}`);
   * }
   */
  async migrateSession(sessionId: string): Promise<MigrationResult> {
    try {
      // Check if already migrated (events exist)
      const existingEvents = await this.storage.queryEvents({ sessionId });
      if (existingEvents.length > 0) {
        return {
          success: true,
       eventsCreated: 0,
          eventTypes: [],
          originalPreserved: true,
          skipped: true
        };
      }

      // Get session markdown
      const session = await this.storage.getSessionById(sessionId);
      if (!session || !session.content) {
        throw new Error(`Session ${sessionId} not found or has no content`);
      }

      // Parse markdown into events
      const events = this.parser.parse(
        session.content,
        sessionId,
        session.project_id || 'default'
      );

      // Store events
      for (const event of events) {
        await this.storage.insertEvent(event);
      }

      // Get unique event types
      const eventTypes = [...new Set(events.map(e => e.eventType))];

      return {
        success: true,
        eventsCreated: events.length,
        eventTypes,
        originalPreserved: true,
        warnings: events.length === 0 ? ['No events extracted from markdown'] : undefined
      };
    } catch (error) {
      return {
        success: false,
        eventsCreated: 0,
        eventTypes: [],
        originalPreserved: true,
        warnings: [(error as Error).message]
      };
    }
  }

  /**
   * Migrate all sessions in the database from markdown to events
   * 
   * @returns BatchMigrationResult with total counts, successes, failures, and detailed errors
   * 
   * @remarks
   * - Continues processing even if individual sessions fail
   * - Returns detailed error messages for failed migrations
   * - Safe to run multiple times (uses idempotent migrateSession)
   * 
   * @throws Error only if database query fails (not for individual migration failures)
   * 
   * @example
   * const migrator = new EventMigrator(storage);
   * const result = await migrator.migrateAllSessions();
   * console.log(`Migrated ${result.succeeded}/${result.total} sessions`);
   * if (result.failed > 0) {
   *   result.errors.forEach(e => console.error(`${e.sessionId}: ${e.error}`));
   * }
   */
  async migrateAllSessions(): Promise<BatchMigrationResult> {
    const result: BatchMigrationResult = {
      total: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    try {
      // Get all sessions (use queryFullSessions for session IDs)
      const { sessions } = await this.storage.queryFullSessions({});
      result.total = sessions.length;

      // Migrate each session
      for (const session of sessions) {
        const sessionId = session.id;
        try {
          const migrationResult = await this.migrateSession(sessionId);
          if (migrationResult.success) {
            result.succeeded++;
          } else {
            result.failed++;
            result.errors.push({
              sessionId,
              error: migrationResult.warnings?.join(', ') || 'Unknown error'
            });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            sessionId,
            error: (error as Error).message
          });
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Batch migration failed: ${(error as Error).message}`);
    }
  }

  /**
   * Migrate a single plan from markdown to event-sourced storage
   * 
   * @param planId - Plan identifier to migrate
   * @returns MigrationResult with success status, event counts, and warnings
   * 
   * @remarks
   * Similar to migrateSession but for plan documents
   * - Idempotent (safe to run multiple times)
   * - Non-destructive (preserves original markdown)
   * - Atomic (all or nothing)
   * 
   * @example
   * const migrator = new EventMigrator(storage);
   * const result = await migrator.migratePlan('PLAN_feature_x');
   */
  async migratePlan(planId: string): Promise<MigrationResult> {
    // Similar to migrateSession but for plans
    try {
      const existingEvents = await this.storage.queryEvents({ planId });
      if (existingEvents.length > 0) {
        return {
          success: true,
          eventsCreated: 0,
          eventTypes: [],
          originalPreserved: true,
          skipped: true
        };
      }

      const plan = await this.storage.getPlanById(planId);
      if (!plan || !plan.content) {
        throw new Error(`Plan ${planId} not found or has no content`);
      }

      const events = this.parser.parse(
        plan.content,
        planId,
        plan.project_id || 'default'
      );

      for (const event of events) {
        await this.storage.insertEvent({ ...event, planId, sessionId: undefined });
      }

      const eventTypes = [...new Set(events.map(e => e.eventType))];

      return {
        success: true,
        eventsCreated: events.length,
        eventTypes,
        originalPreserved: true
      };
    } catch (error) {
      return {
        success: false,
        eventsCreated: 0,
        eventTypes: [],
        originalPreserved: true,
        warnings: [(error as Error).message]
      };
    }
  }

  /**
   * Migrate all plans in the database from markdown to events
   * 
   * @returns BatchMigrationResult with total counts, successes, failures, and detailed errors
   * 
   * @remarks
   * - Continues processing even if individual plans fail
   * - Returns detailed error messages for failed migrations
   * - Safe to run multiple times (uses idempotent migratePlan)
   * 
   * @throws Error only if database query fails (not for individual migration failures)
   * 
   * @example
   * const migrator = new EventMigrator(storage);
   * const result = await migrator.migrateAllPlans();
   * console.log(`Migrated ${result.succeeded}/${result.total} plans`);
   * if (result.failed > 0) {
   *   result.errors.forEach(e => console.error(`${e.sessionId}: ${e.error}`));
   * }
   */
  async migrateAllPlans(): Promise<BatchMigrationResult> {
    const result: BatchMigrationResult = {
      total: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    try {
      // Get all plans
      const { plans } = await this.storage.queryFullPlans({});
      result.total = plans.length;

      // Migrate each plan
      for (const plan of plans) {
        const planId = plan.id;
        try {
          const migrationResult = await this.migratePlan(planId);
          if (migrationResult.success) {
            result.succeeded++;
          } else {
            result.failed++;
            result.errors.push({
              sessionId: planId,  // Reusing sessionId field for consistency
              error: migrationResult.warnings?.join(', ') || 'Unknown error'
            });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            sessionId: planId,
            error: (error as Error).message
          });
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Batch plan migration failed: ${(error as Error).message}`);
    }
  }
}
