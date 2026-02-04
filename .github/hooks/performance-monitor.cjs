/**
 * Performance Monitor Hook
 * 
 * Tracks test/build performance over time and detects regressions.
 * Runs at sessionEnd to record performance data.
 * 
 * @param {Object} data - Session data from VSCode
 */

const fs = require('fs');
const path = require('path');

const PERF_HISTORY_FILE = '.aiknowsys/performance-history.json';
const MAX_HISTORY_ENTRIES = 100;
const REGRESSION_THRESHOLD = 1.2; // 20% slower = regression
const LOOKBACK_DAYS = 7;

module.exports = async function performanceMonitor(data) {
  try {
    const workspaceRoot = process.cwd();
    const perfHistoryPath = path.join(workspaceRoot, PERF_HISTORY_FILE);

    // 1. Load existing performance history
    let perfHistory = {
      testRuns: [],
      buildTimes: [],
      slowestTests: []
    };

    try {
      const existingData = fs.readFileSync(perfHistoryPath, 'utf8');
      perfHistory = JSON.parse(existingData);
    } catch {
      // File doesn't exist yet, use defaults
      ensureDirectory(path.dirname(perfHistoryPath));
    }

    // 2. Extract performance data from session
    const currentRun = extractPerformanceData(data);
    
    if (!currentRun) {
      return; // No performance data available
    }

    // 3. Record current run
    perfHistory.testRuns.unshift(currentRun);
    
    // Keep only last MAX_HISTORY_ENTRIES
    if (perfHistory.testRuns.length > MAX_HISTORY_ENTRIES) {
      perfHistory.testRuns = perfHistory.testRuns.slice(0, MAX_HISTORY_ENTRIES);
    }

    // 4. Check for performance regressions
    const recentRuns = getRecentRuns(perfHistory.testRuns, LOOKBACK_DAYS);
    
    if (recentRuns.length > 3) { // Need at least 3 runs for meaningful average
      const avgDuration = calculateAverage(recentRuns);
      
      if (currentRun.duration > avgDuration * REGRESSION_THRESHOLD) {
        const percentSlower = Math.round(((currentRun.duration / avgDuration) - 1) * 100);
        
        console.error('[Hook] ⏱️  Performance Warning');
        console.error(`[Hook] Tests took ${currentRun.duration}ms (avg: ${Math.round(avgDuration)}ms, +${percentSlower}%)`);
        console.error('[Hook] Consider investigating what changed.');
      }
    }

    // 5. Save updated history
    fs.writeFileSync(
      perfHistoryPath,
      JSON.stringify(perfHistory, null, 2),
      'utf8'
    );

  } catch (error) {
    // Fail silently - don't interrupt session workflow
    console.error('[Hook] Performance monitor error:', error.message);
  }
};

/**
 * Extract performance data from session data
 * @param {Object} data - Session data
 * @returns {Object|null} Performance metrics or null
 */
function extractPerformanceData(data) {
  // Try to extract test duration from data
  // This is a placeholder - actual implementation depends on VSCode data structure
  
  // Check if data contains test results
  if (data && data.testResults) {
    return {
      date: new Date().toISOString(),
      duration: data.testResults.duration || 0,
      tests: data.testResults.total || 0,
      passed: data.testResults.passed || 0,
      failed: data.testResults.failed || 0
    };
  }

  // Try to parse from stdout/stderr if available
  if (data && (data.stdout || data.stderr)) {
    const output = data.stdout || data.stderr;
    const durationMatch = output.match(/(\d+)ms/);
    const testsMatch = output.match(/tests (\d+)/);
    
    if (durationMatch || testsMatch) {
      return {
        date: new Date().toISOString(),
        duration: durationMatch ? parseInt(durationMatch[1]) : 0,
        tests: testsMatch ? parseInt(testsMatch[1]) : 0,
        passed: 0,
        failed: 0
      };
    }
  }

  return null;
}

/**
 * Get runs from the last N days
 * @param {Array} runs - All test runs
 * @param {number} days - Number of days to look back
 * @returns {Array} Recent runs
 */
function getRecentRuns(runs, days) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return runs.filter(run => {
    const runDate = new Date(run.date);
    return runDate >= cutoffDate;
  });
}

/**
 * Calculate average duration from runs
 * @param {Array} runs - Test runs
 * @returns {number} Average duration
 */
function calculateAverage(runs) {
  if (runs.length === 0) return 0;
  
  const total = runs.reduce((sum, run) => sum + (run.duration || 0), 0);
  return total / runs.length;
}

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
