import * as fs from 'node:fs/promises';
import path from 'node:path';
import { createLogger } from '../logger.js';
import {
  generateMilestoneChangelogCore,
  type GenerateMilestoneChangelogOptions,
} from '../core/generate-changelog.js';

export interface GenerateChangelogOptions extends GenerateMilestoneChangelogOptions {
  output?: string;
  dryRun?: boolean;
  _silent?: boolean;
}

export interface GenerateChangelogResult {
  success: boolean;
  markdown?: string;
  outputPath?: string;
  milestoneCount?: number;
  dbPath?: string;
  error?: string;
}

export async function generateChangelog(
  options: GenerateChangelogOptions = {}
): Promise<GenerateChangelogResult> {
  const log = createLogger(options._silent);

  try {
    const result = await generateMilestoneChangelogCore(options);
    const resolvedOutput = options.output ? path.resolve(options.output) : undefined;

    if (resolvedOutput && !options.dryRun) {
      await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
      await fs.writeFile(resolvedOutput, result.markdown, 'utf-8');
      log.success(`Generated changelog at ${resolvedOutput}`);
    } else if (options.dryRun) {
      log.info('Dry run: changelog generated but not written to disk.');
    }

    return {
      success: true,
      markdown: result.markdown,
      outputPath: resolvedOutput,
      milestoneCount: result.milestoneCount,
      dbPath: result.dbPath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to generate changelog: ${message}`,
    };
  }
}
