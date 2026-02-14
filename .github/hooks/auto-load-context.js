#!/usr/bin/env node

/**
 * VSCode Hook: sessionStart (auto-injection version)
 * 
 * ⚠️ STATUS: Infrastructure ready, runtime blocked
 * - VSCode Copilot doesn't execute hooks yet (as of Feb 2026)
 * - This file works when tested manually: `node .github/hooks/auto-load-context.js`
 * - When VSCode enables hooks, this will auto-inject context
 * - Until then, use MCP tools explicitly (see AGENTS.md)
 * 
 * Auto-loads recent sessions and active plans into conversation context.
 * Makes context loading autonomous instead of relying on agent discipline.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../..');
const sessionsDir = path.join(projectRoot, '.aiknowsys', 'sessions');
const plansDir = path.join(projectRoot, '.aiknowsys', 'plans');

try {
  const contextParts = [];
  
  // 1. Load active plan
  const username = process.env.USER || process.env.USERNAME || 'developer';
  const activePlanFile = path.join(plansDir, `active-${username}.md`);
  
  if (fs.existsSync(activePlanFile)) {
    const planContent = fs.readFileSync(activePlanFile, 'utf-8');
    const planMatch = planContent.match(/\*\*Plan:\*\*\s+\[([^\]]+)\]\(([^)]+)\)/);
    
    if (planMatch) {
      const planPath = path.join(projectRoot, '.aiknowsys', planMatch[2]);
      if (fs.existsSync(planPath)) {
        const fullPlan = fs.readFileSync(planPath, 'utf-8');
        contextParts.push('## Active Plan Context\n\n' + fullPlan);
      }
    }
  }
  
  // 2. Load most recent session
  if (fs.existsSync(sessionsDir)) {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const files = fs.readdirSync(sessionsDir);
    
    const recentSessions = files
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const filePath = path.join(sessionsDir, file);
        const stats = fs.statSync(filePath);
        return { file, path: filePath, mtime: stats.mtimeMs };
      })
      .filter(({ mtime }) => mtime > sevenDaysAgo)
      .sort((a, b) => b.mtime - a.mtime);
    
    if (recentSessions.length > 0) {
      const mostRecent = recentSessions[0];
      const sessionContent = fs.readFileSync(mostRecent.path, 'utf-8');
      contextParts.push('## Recent Session Context\n\n' + sessionContent);
    }
  }
  
  // 3. Output context for AI to consume
  if (contextParts.length > 0) {
    console.log('\n---\n');
    console.log('# Auto-Loaded Context (Session Start)\n');
    console.log(contextParts.join('\n\n---\n\n'));
    console.log('\n---\n');
    console.log('**Instructions:** Review the context above before proceeding with user request.');
  } else {
    console.error('[SessionStart] No recent context found. Starting fresh.');
  }
  
  process.exit(0);
} catch (error) {
  console.error(`[SessionStart] Warning: ${error.message}`);
  process.exit(0);
}
