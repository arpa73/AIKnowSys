/**
 * Markdown Generator - Phase 2.1
 * Generates human-readable markdown from structured events
 */

import type { KnowledgeEvent, TaskCompletedData, ValidationPassedData, LearningCapturedData, FileChangedData, DecisionMadeData, SessionStartedData, GoalDefinedData } from './types.js';
import { formatSessionDate } from '../utils/date-formatter.js';

export interface MarkdownSection {
  goal?: string;
  changes: string[];
  validation: string[];
  learning: string[];
  decisions: string[];
}

export class MarkdownGenerator {
  /**
   * Generate human-readable markdown from structured events
   * 
   * @param events - Array of knowledge events (chronologically ordered)
   * @param title - Optional session title (defaults to extracting from session_started event)
   * @returns Formatted markdown matching existing session template structure
   * 
   * @example
   * const generator = new MarkdownGenerator();
   * const markdown = generator.generateSessionMarkdown(events, 'Implement Feature X');
   * // Returns: "## Session: Implement Feature X (Feb 15, 2026)\n\n**Goal:** ..."
   */
  generateSessionMarkdown(events: KnowledgeEvent[], title?: string): string {
    const sections = this.extractSections(events);
    const timestamp = events[0]?.timestamp || new Date().toISOString();
    return this.renderSessionTemplate(sections, title || this.extractTitle(events), timestamp);
  }

  /**
   * Extract sections from events by parsing event types
   * 
   * @param events - Array of knowledge events to extract sections from
   * @returns MarkdownSection object with categorized content
   * 
   * @remarks
   * Processes 7 event types:
   * - session_started/goal_defined → sections.goal
   * - task_completed → sections.changes (with outcome and files)
   * - file_changed → sections.changes (with file links)
   * - validation_passed → sections.validation
   * - learning_captured → sections.learning
   * - decision_made → sections.decisions
   */
  private extractSections(events: KnowledgeEvent[]): MarkdownSection {
    const sections: MarkdownSection = {
      changes: [],
      validation: [],
      learning: [],
      decisions: []
    };

    for (const event of events) {
      switch (event.eventType) {
        case 'session_started':
          sections.goal = (event.data as SessionStartedData).title;
          break;

        case 'goal_defined':
          sections.goal = (event.data as GoalDefinedData).goal;
          break;

        case 'task_completed': {
          const data = event.data as TaskCompletedData;
          let change = `- ${data.description}`;
          if (data.outcome) {
            change += ` (${data.outcome})`;
          }
          if (data.filesChanged && data.filesChanged.length > 0) {
            change += `\n  - Files: ${data.filesChanged.join(', ')}`;
          }
          sections.changes.push(change);
          break;
        }

        case 'file_changed': {
          const data = event.data as FileChangedData;
          sections.changes.push(`- [${data.filePath}](${data.filePath}): ${data.changeType}`);
          break;
        }

        case 'validation_passed': {
          const data = event.data as ValidationPassedData;
          sections.validation.push(`- ✅ ${data.validationType}: ${data.result}`);
          break;
        }

        case 'learning_captured': {
          const data = event.data as LearningCapturedData;
          sections.learning.push(`**Pattern:** ${data.learning}\n${data.evidence ? `**Evidence:** ${data.evidence}` : ''}`);
          break;
        }

        case 'decision_made': {
          const data = event.data as DecisionMadeData;
          sections.decisions.push(`**Decision:** ${data.decision}\n**Rationale:** ${data.rationale}`);
          break;
        }
      }
    }

    return sections;
  }

  /**
   * Extract title from session_started event
   * 
   * @param events - Array of events to search
   * @returns Session title or default 'Session' if not found
   */
  private extractTitle(events: KnowledgeEvent[]): string {
    const sessionStart = events.find(e => e.eventType === 'session_started');
    if (sessionStart) {
      return (sessionStart.data as SessionStartedData).title || 'Session';
    }
    return 'Session';
  }

  /**
   * Render session template with formatted sections
   * 
   * @param sections - Extracted sections from events
   * @param title - Session title
   * @param timestamp - ISO 8601 timestamp for the session
   * @returns Formatted markdown string
   */
  private renderSessionTemplate(sections: MarkdownSection, title: string, timestamp: string): string {
    const lines: string[] = [];
    const date = formatSessionDate(timestamp);

    // Header
    lines.push(`## Session: ${title} (${date})`);
    lines.push('');

    // Goal
    if (sections.goal) {
      lines.push(`**Goal:** ${sections.goal}`);
      lines.push('');
    }

    // Decisions (if any)
    if (sections.decisions.length > 0) {
      lines.push('## Decisions');
      lines.push('');
      sections.decisions.forEach(decision => {
        lines.push(decision);
        lines.push('');
      });
    }

    // Changes
    if (sections.changes.length > 0) {
      lines.push('## Changes');
      lines.push('');
      sections.changes.forEach(change => lines.push(change));
      lines.push('');
    }

    // Validation
    if (sections.validation.length > 0) {
      lines.push('## Validation');
      lines.push('');
      sections.validation.forEach(val => lines.push(val));
      lines.push('');
    }

    // Key Learning
    if (sections.learning.length > 0) {
      lines.push('## Key Learning');
      lines.push('');
      sections.learning.forEach(learning => {
        lines.push(learning);
        lines.push('');
      });
    }

    return lines.join('\n');
  }

  /**
   * Generate plan markdown from events
   * 
   * @param events - Array of knowledge events for the plan
   * @param title - Plan title
   * @returns Formatted markdown matching plan template structure
   */
  generatePlanMarkdown(events: KnowledgeEvent[], title: string): string {
    // Similar structure for plans
    const sections = this.extractSections(events);
    return this.renderPlanTemplate(sections, title);
  }

  /**
   * Render plan template
   * 
   * @param sections - Extracted sections from events
   * @param title - Plan title
   * @returns Formatted markdown string
   */
  private renderPlanTemplate(sections: MarkdownSection, title: string): string {
    const lines: string[] = [];

    lines.push(`# PLAN: ${title}`);
    lines.push('');

    if (sections.goal) {
      lines.push(`**Goal:** ${sections.goal}`);
      lines.push('');
    }

    // Rest similar to session template
    if (sections.changes.length > 0) {
      lines.push('## Progress');
      lines.push('');
      sections.changes.forEach(change => lines.push(change));
      lines.push('');
    }

    return lines.join('\n');
  }
}
