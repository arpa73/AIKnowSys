/**
 * Migration Check Hook
 * 
 * Detects version mismatches between installed aiknowsys and project initialization version.
 * Runs at sessionStart to alert about needed migrations.
 * 
 * @param {Object} data - Session data from VSCode
 */

const fs = require('fs');
const path = require('path');

const MIGRATION_WARNING_THRESHOLD = 'minor'; // Warn on minor+ version differences

module.exports = async function migrationCheck(data) {
  try {
    const workspaceRoot = process.cwd();

    // 1. Get installed aiknowsys version
    const installedVersion = getInstalledVersion(workspaceRoot);
    if (!installedVersion) {
      return; // No aiknowsys installed or not in package.json
    }

    // 2. Get project initialization version (from CODEBASE_ESSENTIALS.md if exists)
    const projectVersion = getProjectInitVersion(workspaceRoot);
    if (!projectVersion) {
      return; // No project version recorded
    }

    // 3. Compare versions
    if (installedVersion !== projectVersion) {
      const diff = getVersionDiff(installedVersion, projectVersion);
      
      // Warn if version difference is significant
      if (diff === 'major' || diff === 'minor') {
        console.error('[Hook] 🔄 Migration Check');
        console.error(`[Hook] AIKnowSys ${installedVersion} installed`);
        console.error(`[Hook] Project initialized with ${projectVersion}`);
        console.error(`[Hook] Version difference: ${diff}`);
        
        if (diff === 'major') {
          console.error('[Hook] ⚠️  Major version change - breaking changes likely');
        }
        
        console.error('[Hook] Run: node bin/cli.js migrate --from ' + projectVersion);
      }
    }

  } catch (error) {
    // Fail silently - don't interrupt session workflow
    // Only log in debug mode
  }
};

/**
 * Get installed aiknowsys version from package.json
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {string|null} Version string or null
 */
function getInstalledVersion(workspaceRoot) {
  try {
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check dependencies and devDependencies
    const version = 
      packageJson.dependencies?.aiknowsys ||
      packageJson.devDependencies?.aiknowsys;
    
    if (version) {
      // Remove semver prefixes (^, ~, >=, etc.)
      return version.replace(/^[\^~>=<]+/, '');
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Get project initialization version from CODEBASE_ESSENTIALS.md
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {string|null} Version string or null
 */
function getProjectInitVersion(workspaceRoot) {
  try {
    const essentialsPath = path.join(workspaceRoot, 'CODEBASE_ESSENTIALS.md');
    const content = fs.readFileSync(essentialsPath, 'utf8');
    
    // Look for version in ESSENTIALS (usually in header or metadata)
    // Pattern: "AIKnowSys v0.8.0" or "Version: 0.8.0"
    const versionMatch = content.match(/(?:AIKnowSys|Version:?)\s+v?(\d+\.\d+\.\d+)/i);
    
    if (versionMatch) {
      return versionMatch[1];
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Determine version difference type
 * @param {string} v1 - Version 1
 * @param {string} v2 - Version 2
 * @returns {string} 'major', 'minor', 'patch', or 'none'
 */
function getVersionDiff(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  if (parts1[0] !== parts2[0]) return 'major';
  if (parts1[1] !== parts2[1]) return 'minor';
  if (parts1[2] !== parts2[2]) return 'patch';
  
  return 'none';
}
