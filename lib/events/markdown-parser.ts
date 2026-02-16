/**
 * Markdown Parser - Phase 2.1
 * Parses markdown sessions into structured events for migration
 */

import type { KnowledgeEvent, EventType, SessionStartedData, TaskCompletedData, ValidationPassedData, LearningCapturedData, FileChangedData, GoalDefinedData } from './types.js';

export interface ParsedMarkdown {
  title?: string;
  goal?: string;
  changes: string[];
  validation: string[];
  learning: string[];
  frontmatter?: Record<string, any>;
}

export class MarkdownParser {
  /**
   * Parse markdown session document into structured events for migration
   * 
   * @param markdown - Raw markdown content (with YAML frontmatter)
   * @param sessionId - Session identifier (format: sess-YYYY-MM-DD-*)
   * @param projectId - Project this session belongs to
   * @returns Array of KnowledgeEvent objects extracted from standard sections
   * 
   * @remarks
   * Extracts 6 event types from markdown:
   * - session_started (from title/goal)
   * - goal_defined (from **Goal:** pattern)
   * - file_changed (from [filepath] links in Changes)
   * - task_completed (from bullet points in Changes)
   * - validation_passed (from ✓ patterns in Validation)
   * - learning_captured (from Key Learning section)
   * 
   * @example
   * const parser = new MarkdownParser();
   * const events = parser.parse(sessionMarkdown, 'sess-001', 'proj-001');
   * console.log(`Extracted ${events.length} events`);
   */
  parse(markdown: string, sessionId: string, projectId: string): KnowledgeEvent[] {
    const parsed = this.parseMarkdown(markdown);
    const events: KnowledgeEvent[] = [];
    const baseTimestamp = new Date().toISOString();

    // Session started event
    if (parsed.title || parsed.goal) {
      events.push({
        eventId: `evt-${sessionId}-start`,
        projectId,
        sessionId,
        timestamp: baseTimestamp,
        eventType: 'session_started' as EventType,
        data: {
          title: parsed.title || parsed.goal || 'Untitled Session',
          topics: parsed.frontmatter?.topics || []
        } as SessionStartedData
      });
    }

    // Goal defined event
    if (parsed.goal && parsed.goal !== parsed.title) {
      events.push({
        eventId: `evt-${sessionId}-goal`,
        projectId,
        sessionId,
        timestamp: baseTimestamp,
        eventType: 'goal_defined' as EventType,
        data: {
          goal: parsed.goal
        } as GoalDefinedData
      });
    }

    // File changed events from Changes section
    parsed.changes.forEach((change, index) => {
      const fileMatch = change.match(/\[([\w/.-]+)\]/);
      if (fileMatch) {
        const filePath = fileMatch[1];

        events.push({
          eventId: `evt-${sessionId}-change-${index}`,
          projectId,
          sessionId,
          timestamp: baseTimestamp,
          eventType: 'file_changed' as EventType,
          data: {
            filePath,
            changeType: 'modified' as const,
            linesAdded: 0,
            linesDeleted: 0
          } as FileChangedData
        });
      } else {
        // Generic task completed
        events.push({
          eventId: `evt-${sessionId}-task-${index}`,
          projectId,
          sessionId,
          timestamp: baseTimestamp,
          eventType: 'task_completed' as EventType,
          data: {
            description: change.replace(/^-\s*/, '').trim(),
            outcome: 'success' as const
          } as TaskCompletedData
        });
      }
    });

    // Validation events
    parsed.validation.forEach((val, index) => {
      const cleanVal = val.replace(/^-\s*✅\s*/, '').trim();
      const [validationType, ...resultParts] = cleanVal.split(':');

      events.push({
        eventId: `evt-${sessionId}-val-${index}`,
        projectId,
        sessionId,
        timestamp: baseTimestamp,
        eventType: 'validation_passed' as EventType,
        data: {
          validationType: validationType.trim(),
          result: resultParts.join(':').trim()
        } as ValidationPassedData
      });
    });

    // Learning events
    parsed.learning.forEach((learning, index) => {
      events.push({
        eventId: `evt-${sessionId}-learn-${index}`,
        projectId,
        sessionId,
        timestamp: baseTimestamp,
        eventType: 'learning_captured' as EventType,
        data: {
          learning
        } as LearningCapturedData
      });
    });

    return events;
  }

  /**
   * Parse markdown into sections
   */
  private parseMarkdown(markdown: string): ParsedMarkdown {
    const result: ParsedMarkdown = {
      changes: [],
      validation: [],
      learning: []
    };

    // Parse frontmatter
    const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      result.frontmatter = this.parseFrontmatter(frontmatterMatch[1]);
    }

    // Extract title from "## Session: Title" pattern
    const titleMatch = markdown.match(/##\s*Session:\s*([^\n(]+)/);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }

    // Extract goal
    const goalMatch = markdown.match(/\*\*Goal:\*\*\s*([^\n]+)/);
    if (goalMatch) {
      result.goal = goalMatch[1].trim();
    }

    // Extract Changes section
    const changesText = this.extractSection(markdown, 'Changes');
    if (changesText) {
      result.changes = changesText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim());
    }

    // Extract Validation section
    const validationText = this.extractSection(markdown, 'Validation');
    if (validationText) {
      result.validation = validationText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim());
    }

    // Extract Key Learning section
    const learningText = this.extractSection(markdown, 'Key Learning');
    if (learningText) {
      const trimmed = learningText.trim();
      if (trimmed) {
        result.learning.push(trimmed);
      }
    }

    return result;
  }

  /**
   * Extract section content from markdown by section name
   * DRY helper to avoid repeating regex patterns
   */
  private extractSection(markdown: string, sectionName: string): string | null {
    const regex = new RegExp(`##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|\\n---|\\n\\*\\*|$)`);
    const match = markdown.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Parse YAML frontmatter
   */
  private parseFrontmatter(yaml: string): Record<string, any> {
    const result: Record<string, any> = {};
    
    const lines = yaml.split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        
        // Handle arrays [item1, item2]
        if (value.startsWith('[') && value.endsWith(']')) {
          result[key] = value
            .slice(1, -1)
            .split(',')
            .map(v => v.trim().replace(/^["']|["']$/g, ''));
        }
        // Handle quoted strings
        else if ((value.startsWith('"') && value.endsWith('"')) || 
                 (value.startsWith("'") && value.endsWith("'"))) {
          result[key] = value.slice(1, -1);
        }
        // Handle plain values
        else {
          result[key] = value;
        }
      }
    }
    
    return result;
  }
}
