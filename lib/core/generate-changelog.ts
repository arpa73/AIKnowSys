import * as fs from 'node:fs/promises';
import path from 'node:path';
import { DatabaseLocator } from '../context/database-locator.js';
import { SqliteStorage, type PlanRow, type SessionRow } from '../context/sqlite-storage.js';
import type { KnowledgeEvent } from '../events/types.js';

export type MilestoneType = 'release' | 'breaking' | 'architecture' | 'security';
export type MilestoneSourceType = 'plan' | 'session' | 'event';

export interface MilestoneCandidate {
  sourceType: MilestoneSourceType;
  sourceId: string;
  title: string;
  content: string;
  timestamp: string;
}

export interface MilestoneEntry {
  sourceType: MilestoneSourceType;
  sourceId: string;
  type: MilestoneType;
  title: string;
  summary: string;
  timestamp: string;
}

export interface GenerateMilestoneChangelogOptions {
  dbPath?: string;
  dir?: string;
  projectId?: string;
  allProjects?: boolean;
  from?: string;
  to?: string;
  limit?: number;
}

export interface GenerateMilestoneChangelogResult {
  dbPath: string;
  milestoneCount: number;
  entries: MilestoneEntry[];
  markdown: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isWithinRange(timestamp: string, from?: string, to?: string): boolean {
  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) {
    return false;
  }

  if (from) {
    const fromTs = new Date(`${from}T00:00:00.000Z`).getTime();
    if (value < fromTs) return false;
  }

  if (to) {
    const toTs = new Date(`${to}T23:59:59.999Z`).getTime();
    if (value > toTs) return false;
  }

  return true;
}

function assertDateInput(value: string | undefined, field: 'from' | 'to'): void {
  if (!value) return;
  if (!DATE_RE.test(value)) {
    throw new Error(`Invalid ${field} date "${value}". Expected YYYY-MM-DD.`);
  }
}

function normalizeLine(input: string, maxLength = 180): string {
  const oneLine = input.replace(/\s+/g, ' ').trim();
  return oneLine.length <= maxLength ? oneLine : `${oneLine.slice(0, maxLength - 3)}...`;
}

function buildEventSummary(event: KnowledgeEvent): string {
  const payload = JSON.stringify(event.data);
  return normalizeLine(`${event.eventType}: ${payload}`);
}

function pickMilestoneType(text: string): MilestoneType | null {
  const hasSecurity = /\b(critical security|security fix|cve-\d{4}-\d+|vulnerability)\b/i.test(text);
  if (hasSecurity) return 'security';

  const hasBreaking = /\bbreaking(\s+change)?\b/i.test(text);
  if (hasBreaking) return 'breaking';

  const hasRelease = /\bv\d+\.\d+\.\d+(?:-[a-z0-9.]+)?\b/i.test(text) || /\brelease\b/i.test(text);
  if (hasRelease) return 'release';

  const hasArchitecture = /\b(major architecture|architecture change|architectural|system redesign|storage layer)\b/i.test(text);
  if (hasArchitecture) return 'architecture';

  return null;
}

function isRoutineWork(text: string): boolean {
  return /\b(daily|routine|wip|bugfix|chore|small fix|minor refactor|housekeeping)\b/i.test(text);
}

export function classifyMilestone(candidate: MilestoneCandidate): MilestoneEntry | null {
  const corpus = `${candidate.title}\n${candidate.content}`;
  const type = pickMilestoneType(corpus);
  if (!type) {
    return null;
  }

  if (isRoutineWork(corpus) && type !== 'security' && type !== 'breaking' && type !== 'release') {
    return null;
  }

  return {
    sourceType: candidate.sourceType,
    sourceId: candidate.sourceId,
    type,
    title: normalizeLine(candidate.title || `${candidate.sourceType}:${candidate.sourceId}`, 120),
    summary: normalizeLine(candidate.content || candidate.title || '(no summary)'),
    timestamp: candidate.timestamp,
  };
}

function renderMilestoneMarkdown(entries: MilestoneEntry[], options: GenerateMilestoneChangelogOptions): string {
  const header = [
    '# Generated Milestone Changelog',
    '',
    `Generated: ${new Date().toISOString()}`,
    options.from ? `From: ${options.from}` : null,
    options.to ? `To: ${options.to}` : null,
  ].filter(Boolean).join('\n');

  if (entries.length === 0) {
    return `${header}\n\n## Empty State\nNo milestone entries found for the selected range.`;
  }

  const lines: string[] = [header, ''];
  let currentYear = '';

  for (const entry of entries) {
    const date = entry.timestamp.slice(0, 10);
    const year = date.slice(0, 4);
    if (year !== currentYear) {
      lines.push(`## ${year}`);
      lines.push('');
      currentYear = year;
    }

    lines.push(`### ${date} [${entry.type.toUpperCase()}] ${entry.title}`);
    lines.push(`- Source: \`${entry.sourceType}:${entry.sourceId}\``);
    lines.push(`- Summary: ${entry.summary}`);
    lines.push('');
  }

  return lines.join('\n').trim();
}

async function resolveDbPath(options: GenerateMilestoneChangelogOptions): Promise<string> {
  if (options.dbPath) {
    return path.resolve(options.dbPath);
  }

  const targetDir = path.resolve(options.dir || process.cwd());
  const locator = new DatabaseLocator();
  const config = await locator.getDatabaseConfig(targetDir);
  return config.dbPath;
}

async function resolveProjectScope(
  options: GenerateMilestoneChangelogOptions
): Promise<{ projectId?: string; allProjects: boolean }> {
  if (options.allProjects) {
    return { allProjects: true };
  }

  if (options.projectId) {
    return { projectId: options.projectId, allProjects: false };
  }

  // If caller explicitly targets a database path without providing project scope,
  // preserve backward behavior and avoid implicit cwd-based filtering.
  if (options.dbPath && !options.dir) {
    return { allProjects: true };
  }

  const locator = new DatabaseLocator();
  const targetDir = path.resolve(options.dir || process.cwd());
  const projectId = await locator.getProjectId(targetDir);
  return { projectId, allProjects: false };
}

function toEventCandidate(event: KnowledgeEvent): MilestoneCandidate {
  return {
    sourceType: 'event',
    sourceId: event.eventId,
    title: event.eventType,
    content: buildEventSummary(event),
    timestamp: event.timestamp,
  };
}

function toPlanCandidate(plan: PlanRow): MilestoneCandidate {
  return {
    sourceType: 'plan',
    sourceId: plan.id,
    title: plan.title,
    content: [plan.description, plan.content].filter(Boolean).join('\n'),
    timestamp: plan.updated_at,
  };
}

function toSessionCandidate(session: SessionRow): MilestoneCandidate {
  return {
    sourceType: 'session',
    sourceId: session.id,
    title: session.topic,
    content: session.content || session.topic,
    timestamp: `${session.date}T00:00:00.000Z`,
  };
}

export async function generateMilestoneChangelogCore(
  options: GenerateMilestoneChangelogOptions = {}
): Promise<GenerateMilestoneChangelogResult> {
  assertDateInput(options.from, 'from');
  assertDateInput(options.to, 'to');

  const dbPath = await resolveDbPath(options);
  const scope = await resolveProjectScope(options);
  try {
    await fs.access(dbPath);
  } catch {
    throw new Error(`Knowledge database not found at ${dbPath}. Run migration/init first.`);
  }

  const storage = new SqliteStorage();
  await storage.init(dbPath);

  try {
    const [plans, sessions, events] = await Promise.all([
      storage.queryFullPlans({
        projectId: scope.projectId,
        allProjects: scope.allProjects,
      }),
      storage.queryFullSessions({
        projectId: scope.projectId,
        allProjects: scope.allProjects,
      }),
      storage.queryEvents({
        projectId: scope.projectId,
      }),
    ]);

    const candidates: MilestoneCandidate[] = [
      ...plans.plans.map(toPlanCandidate),
      ...sessions.sessions.map(toSessionCandidate),
      ...events.map(toEventCandidate),
    ];

    const entries = candidates
      .filter((candidate) => isWithinRange(candidate.timestamp, options.from, options.to))
      .map(classifyMilestone)
      .filter((entry): entry is MilestoneEntry => entry !== null)
      .sort((a, b) => {
        const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        if (timeDiff !== 0) return timeDiff;
        if (a.sourceType !== b.sourceType) return a.sourceType.localeCompare(b.sourceType);
        return a.sourceId.localeCompare(b.sourceId);
      });

    const limited = typeof options.limit === 'number' && options.limit > 0
      ? entries.slice(0, options.limit)
      : entries;

    return {
      dbPath,
      milestoneCount: limited.length,
      entries: limited,
      markdown: renderMilestoneMarkdown(limited, options),
    };
  } finally {
    await storage.close();
  }
}
