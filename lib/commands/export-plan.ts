/**
 * Export plan command - Export plan with linked sessions/reviews as markdown
 * Phase 3: Markdown Exports
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { SqliteStorage } from '../context/sqlite-storage.js';
import { AIFriendlyErrorBuilder } from '../utils/error-builder.js';
import { VALID_EXPORT_FORMATS } from '../types/index.js';
import type { ExportPlanOptions, ExportPlanResult } from '../types/index.js';
type PlanSessions = Awaited<ReturnType<SqliteStorage['queryFullSessions']>>['sessions'];
type PlanReviews = Awaited<ReturnType<SqliteStorage['queryReviews']>>['reviews'];

type PlanExportData = {
  plan: NonNullable<Awaited<ReturnType<SqliteStorage['getPlanById']>>>;
  sessions: PlanSessions;
  reviews: PlanReviews;
  topics: string[];
  description: string;
};

/**
 * Build a user-facing error message from AI-friendly structured errors.
 */
function formatStructuredError(
  structured: ReturnType<typeof AIFriendlyErrorBuilder.missingRequired>
): string {
  const suggestion = structured.error.suggestion
    ? ` Suggestion: ${structured.error.suggestion}`
    : '';
  return `${structured.error.message}.${suggestion}`.trim();
}

/**
 * Parse plan topics JSON safely.
 */
function parseTopics(topicsJson?: string | null): string[] {
  if (!topicsJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(topicsJson);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((topic): topic is string => typeof topic === 'string');
  } catch {
    return [];
  }
}

/**
 * Format ISO date string to YYYY-MM-DD.
 *
 * @param dateIso - ISO date string.
 * @returns Formatted date, original string for invalid dates, or 'unknown' when missing.
 */
function formatDate(dateIso?: string | null): string {
  if (!dateIso) return 'unknown';
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toISOString().split('T')[0];
}

function formatSessionLines(sessions: PlanSessions): string[] {
  return sessions.length > 0
    ? sessions.map((session) => `- ${session.id} (${session.date}) - ${session.topic} [${session.status}]`)
    : ['- No linked sessions'];
}

function formatReviewLines(reviews: PlanReviews): string[] {
  return reviews.length > 0
    ? reviews.map((review) => `- ${review.id} - ${review.status} by ${review.author} (${formatDate(review.createdAt)})`)
    : ['- No reviews'];
}

/** Render plan as a narrative markdown document with metadata and full content. */
function generateNarrativeMarkdown(data: PlanExportData): string {
  const { plan, sessions, reviews, topics, description } = data;

  const sessionLines = formatSessionLines(sessions);
  const reviewLines = formatReviewLines(reviews);

  return [
    `# Plan: ${plan.title}`,
    '',
    `- **Plan ID:** ${plan.id}`,
    `- **Status:** ${plan.status}`,
    `- **Author:** ${plan.author || 'unknown'}`,
    `- **Priority:** ${plan.priority || 'unspecified'}`,
    `- **Type:** ${plan.type || 'unspecified'}`,
    `- **Created:** ${formatDate(plan.created_at)}`,
    `- **Updated:** ${formatDate(plan.updated_at)}`,
    topics.length > 0 ? `- **Topics:** ${topics.join(', ')}` : '- **Topics:** none',
    '',
    '## Goal',
    description,
    '',
    '## Linked Sessions',
    ...sessionLines,
    '',
    '## Reviews',
    ...reviewLines,
    '',
    '## Content',
    plan.content || '_No plan content found._',
    ''
  ].join('\n');
}

/** Render plan as a chronological timeline of creation, sessions, and reviews. */
function generateTimelineMarkdown(data: PlanExportData): string {
  const { plan, sessions, reviews } = data;

  const timelineItems: Array<{ timestamp: string; label: string }> = [
    {
      timestamp: plan.created_at || '',
      label: `Plan created — ${plan.id} (${plan.status})`
    }
  ];

  for (const session of sessions) {
    timelineItems.push({
      timestamp: session.created_at,
      label: `Session linked — ${session.id} (${session.topic})`
    });
  }

  for (const review of reviews) {
    timelineItems.push({
      timestamp: review.createdAt,
      label: `Review added — ${review.id} (${review.status}) by ${review.author}`
    });
  }

  const sorted = timelineItems.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const lines = sorted.map((entry) => `- ${entry.timestamp || 'unknown'} — ${entry.label}`);

  return [
    `# Plan: ${plan.title}`,
    '',
    `- **Plan ID:** ${plan.id}`,
    `- **Status:** ${plan.status}`,
    '',
    '## Timeline',
    ...lines,
    ''
  ].join('\n');
}

/** Render plan with metadata, sessions, and reviews in distinct labelled groups. */
function generateGroupedMarkdown(data: PlanExportData): string {
  const { plan, sessions, reviews, topics, description } = data;

  const sessionLines = formatSessionLines(sessions);
  const reviewLines = formatReviewLines(reviews);

  return [
    `# Plan: ${plan.title}`,
    '',
    '## Grouped View',
    '',
    '### Plan Metadata',
    `- ID: ${plan.id}`,
    `- Status: ${plan.status}`,
    `- Author: ${plan.author || 'unknown'}`,
    `- Priority: ${plan.priority || 'unspecified'}`,
    `- Type: ${plan.type || 'unspecified'}`,
    `- Topics: ${topics.length > 0 ? topics.join(', ') : 'none'}`,
    '',
    '### Goal',
    description,
    '',
    '### Sessions',
    ...sessionLines,
    '',
    '### Reviews',
    ...reviewLines,
    '',
    '### Content',
    plan.content || '_No plan content found._',
    ''
  ].join('\n');
}

/**
 * Custom format scaffold for near-term extensibility.
 *
 * This currently wraps narrative output with a clear custom-format header,
 * so callers can adopt `--format custom` now while distinct rendering evolves.
 */
function generateCustomMarkdown(data: PlanExportData): string {
  const narrative = generateNarrativeMarkdown(data);
  const [titleLine, ...narrativeBody] = narrative.split('\n');

  return [
    titleLine,
    '',
    '> **Format:** custom (scaffold — equivalent to narrative until custom rendering is implemented).',
    '',
    ...narrativeBody
  ].join('\n');
}

/**
 * Export a single plan as markdown with linked sessions and reviews.
 *
 * @param options - Export options containing plan ID, database path, and optional output path.
 * @returns Export result with markdown content, metadata, and optional output path.
 */
export async function exportPlan(
  options: ExportPlanOptions
): Promise<ExportPlanResult> {
  const {
    planId,
    dbPath,
    output,
    verbose,
    format = 'narrative'
  } = options;
  const resolvedDbPath = path.resolve(dbPath);

  try {
    if (!planId || planId.trim().length === 0) {
      const error = AIFriendlyErrorBuilder.missingRequired(
        'planId',
        'export-plan PLAN_feature_name --db-path ./knowledge.db'
      );
      return {
        success: false,
        error: formatStructuredError(error)
      };
    }

    if (!(VALID_EXPORT_FORMATS as readonly string[]).includes(format)) {
      return {
        success: false,
        error: `Invalid format '${format}'. Use one of: ${VALID_EXPORT_FORMATS.join(', ')}`
      };
    }

    const storage = new SqliteStorage();

    try {
      await storage.init(resolvedDbPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const structuredError = AIFriendlyErrorBuilder.databaseError(
        `Failed to connect to database at ${resolvedDbPath}: ${message}`,
        'Verify the database path and run migration if needed'
      );
      return {
        success: false,
        error: formatStructuredError(structuredError)
      };
    }

    try {
      const plan = await storage.getPlanById(planId);

      if (!plan) {
        const error = AIFriendlyErrorBuilder.validationFailed(
          'planId',
          `Plan ${planId} not found`,
          'Use query-plans to list available plans'
        );
        return {
          success: false,
          error: formatStructuredError(error)
        };
      }

      const sessionsResult = await storage.queryFullSessions({ plan: planId });
      const reviewsResult = await storage.queryReviews({ targetId: planId });

      const sessions = sessionsResult.sessions;
      const reviews = reviewsResult.reviews;

      const topics = parseTopics(plan.topics);
      const description = plan.description || 'No description provided';

      const planExportData: PlanExportData = {
        plan,
        sessions,
        reviews,
        topics,
        description
      };

      let markdown: string;
      switch (format) {
        case 'timeline':
          markdown = generateTimelineMarkdown(planExportData);
          break;
        case 'grouped':
          markdown = generateGroupedMarkdown(planExportData);
          break;
        case 'custom':
          markdown = generateCustomMarkdown(planExportData);
          break;
        case 'narrative':
        default:
          markdown = generateNarrativeMarkdown(planExportData);
          break;
      }

      if (output) {
        try {
          const resolvedOutput = path.resolve(output);
          const dir = path.dirname(resolvedOutput);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          fs.writeFileSync(resolvedOutput, markdown, 'utf-8');

          return {
            success: true,
            markdown,
            planId: plan.id,
            sessionCount: sessions.length,
            reviewCount: reviews.length,
            outputPath: resolvedOutput,
            verbose
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const structuredError = AIFriendlyErrorBuilder.fileSystemError(
            output,
            message,
            'Check write permissions and parent directory'
          );
          return {
            success: false,
            error: formatStructuredError(structuredError)
          };
        }
      }

      return {
        success: true,
        markdown,
        planId: plan.id,
        sessionCount: sessions.length,
        reviewCount: reviews.length,
        verbose
      };
    } finally {
      await storage.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Export failed: ${message}`
    };
  }
}
