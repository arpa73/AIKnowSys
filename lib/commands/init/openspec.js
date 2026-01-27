/**
 * OpenSpec integration for the init command
 */
import path from 'path';
import { execSync } from 'child_process';
import ora from 'ora';
import { createLogger } from '../../logger.js';

/**
 * Setup OpenSpec in the target directory
 * @param {string} targetDir - Directory to initialize OpenSpec in
 * @param {boolean} silent - Whether to suppress spinner output
 * @returns {Promise<boolean>} - Whether setup was successful
 */
export async function setupOpenSpec(targetDir, silent = false) {
  const openSpecSpinner = silent ? null : ora('Setting up OpenSpec...').start();
  
  try {
    // Check if openspec is already installed globally
    let openspecInstalled = false;
    try {
      execSync('openspec --version', { stdio: 'pipe' });
      openspecInstalled = true;
      if (openSpecSpinner) openSpecSpinner.text = 'OpenSpec already installed, initializing...';
    } catch {
      // Not installed - try to install it
      if (openSpecSpinner) openSpecSpinner.text = 'Installing OpenSpec globally...';
      try {
        execSync('npm install -g openspec', { stdio: 'inherit' });
        openspecInstalled = true;
        if (openSpecSpinner) openSpecSpinner.text = 'OpenSpec installed, initializing...';
      } catch (_installError) {
        // Installation failed - show instructions and exit gracefully
        const log = createLogger(silent);
        if (openSpecSpinner) openSpecSpinner.warn('Could not install OpenSpec globally');
        log.blank();
        log.log('\x1b[33m💡 To install OpenSpec manually:\x1b[0m');
        log.white('   npm install -g openspec');
        log.white('   openspec init');
        log.blank();
        log.dim('   Or use npx (no install required):');
        log.white('   npx openspec init');
        log.blank();
        return false;
      }
    }
    
    // Initialize OpenSpec in the project directory
    if (openspecInstalled) {
      try {
        const log = createLogger(silent);
        execSync('openspec init', { stdio: 'inherit', cwd: targetDir });
        if (openSpecSpinner) openSpecSpinner.succeed('OpenSpec initialized successfully');
        
        log.blank();
        log.cyan('📖 OpenSpec Tips:');
        log.white('   • Create specs: openspec create <feature-name>');
        log.white('   • Get approval before coding to align the team');
        log.blank();
        return true;
      } catch (_initError) {
        const log = createLogger(silent);
        if (openSpecSpinner) openSpecSpinner.fail('OpenSpec initialization failed');
        log.blank();
        log.log('\x1b[33m⚠️  You can initialize it later with:\x1b[0m');
        log.white('   cd ' + path.basename(targetDir));
        log.white('   openspec init');
        log.blank();
        return false;
      }
    }
  } catch (error) {
    const log = createLogger(silent);
    if (openSpecSpinner) openSpecSpinner.fail('OpenSpec initialization failed');
    log.blank();
    log.log('\x1b[33m⚠️  OpenSpec setup encountered an issue:\x1b[0m');
    log.dim(`   ${error.message.split('\n')[0]}`);
    log.blank();
    log.white('You can set it up later with:');
    log.dim('   npm install -g openspec && openspec init');
    return false;
  }
  
  return false;
}
