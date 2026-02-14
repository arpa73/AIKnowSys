#!/usr/bin/env node
/**
 * Workspace Health Check Hook (sessionStart event)
 * 
 * Detects workspace maintenance opportunities:
 * - Old sessions that could be archived
 * - Completed plans ready for archiving
 * - Temp files accumulating
 * 
 * Provides actionable reminders without blocking workflow.
 * 
 * Non-blocking: Always exits with code 0
 * Timeout: Must complete within 2 seconds
 */

const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const targetDir = process.cwd();
    const sessionsDir = path.join(targetDir, '.aiknowsys', 'sessions');
    const currentPlanPath = path.join(targetDir, '.aiknowsys', 'CURRENT_PLAN.md');
    
    let hasCleanupOpportunities = false;
    
    // Check for old sessions (>30 days)
    if (fs.existsSync(sessionsDir)) {
      const files = fs.readdirSync(sessionsDir);
      const sessionFiles = files.filter(f => /^\d{4}-\d{2}-\d{2}-session\.md$/.test(f));
      
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 30);
      
      let oldSessions = 0;
      
      for (const file of sessionFiles) {
        const filePath = path.join(sessionsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < threshold) {
          oldSessions++;
        }
      }
      
      if (oldSessions > 0) {
        console.error('[Workspace] 📦 Old sessions detected');
        console.error('[Workspace]   Found: ' + oldSessions + ' sessions (>30 days)');
        console.error('[Workspace]   Action: aiknowsys archive-sessions --dry-run');
        hasCleanupOpportunities = true;
      }
    }
    
    // Check for completed plans (>7 days)
    if (fs.existsSync(currentPlanPath)) {
      const content = fs.readFileSync(currentPlanPath, 'utf-8');
      const planRegex = /\| \[([^\]]+)\]\(([^)]+)\) \| (✅ COMPLETE)/g;
      const plans = [];
      let match;
      
      while ((match = planRegex.exec(content)) !== null) {
        plans.push({
          name: match[1],
          file: match[2]
        });
      }
      
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 7);
      
      let oldPlans = 0;
      
      for (const plan of plans) {
        const planPath = path.join(targetDir, '.aiknowsys', plan.file);
        
        if (fs.existsSync(planPath)) {
          const stats = fs.statSync(planPath);
          
          if (stats.mtime < threshold) {
            oldPlans++;
          }
        }
      }
      
      if (oldPlans > 0) {
        console.error('[Workspace] 📦 Completed plans detected');
        console.error('[Workspace]   Found: ' + oldPlans + ' completed plans (>7 days)');
        console.error('[Workspace]   Action: aiknowsys archive-plans --dry-run');
        hasCleanupOpportunities = true;
      }
    }
    
    // Check for temp files
    const tempPatterns = [
      /^test-.*\.(js|json|txt|md)$/,
      /^debug-.*\.(js|json|txt|log)$/,
      /^temp-.*$/,
      /.*\.tmp$/
    ];
    
    const files = fs.readdirSync(targetDir);
    const tempFiles = files.filter(f => tempPatterns.some(p => p.test(f)));
    
    if (tempFiles.length > 0) {
      console.error('[Workspace] 🗑️  Temporary files detected');
      console.error('[Workspace]   Found: ' + tempFiles.length + ' temporary files');
      console.error('[Workspace]   Action: aiknowsys clean --dry-run');
      hasCleanupOpportunities = true;
    }
    
    // Show cleanup suggestion if opportunities found
    if (hasCleanupOpportunities) {
      console.error('[Workspace] 💡 Keep workspace clean for better performance');
      console.error('');
    }
    
    process.exit(0);
  } catch (err) {
    // Fail silently - hook should never block workflow
    process.exit(0);
  }
}

main();
