/**
 * OpenSpec integration for the init command
 */
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Setup OpenSpec in the target directory
 * @param {string} targetDir - Directory to initialize OpenSpec in
 * @returns {Promise<boolean>} - Whether setup was successful
 */
export async function setupOpenSpec(targetDir) {
  const openSpecSpinner = ora('Setting up OpenSpec...').start();
  
  try {
    // Check if openspec is already installed globally
    let openspecInstalled = false;
    try {
      execSync('openspec --version', { stdio: 'pipe' });
      openspecInstalled = true;
      openSpecSpinner.text = 'OpenSpec already installed, initializing...';
    } catch {
      // Not installed - try to install it
      openSpecSpinner.text = 'Installing OpenSpec globally...';
      try {
        execSync('npm install -g openspec', { stdio: 'inherit' });
        openspecInstalled = true;
        openSpecSpinner.text = 'OpenSpec installed, initializing...';
      } catch (_installError) {
        // Installation failed - show instructions and exit gracefully
        openSpecSpinner.warn('Could not install OpenSpec globally');
        console.log('');
        console.log(chalk.yellow('💡 To install OpenSpec manually:'));
        console.log(chalk.white('   npm install -g openspec'));
        console.log(chalk.white('   openspec init'));
        console.log('');
        console.log(chalk.gray('   Or use npx (no install required):'));
        console.log(chalk.white('   npx openspec init'));
        console.log('');
        return false;
      }
    }
    
    // Initialize OpenSpec in the project directory
    if (openspecInstalled) {
      try {
        execSync('openspec init', { stdio: 'inherit', cwd: targetDir });
        openSpecSpinner.succeed('OpenSpec initialized successfully');
        
        console.log('');
        console.log(chalk.cyan('📖 OpenSpec Tips:'));
        console.log(chalk.white('   • Create specs: openspec create <feature-name>'));
        console.log(chalk.white('   • Get approval before coding to align the team'));
        console.log('');
        return true;
      } catch (_initError) {
        openSpecSpinner.fail('OpenSpec initialization failed');
        console.log('');
        console.log(chalk.yellow('⚠️  You can initialize it later with:'));
        console.log(chalk.white('   cd ' + path.basename(targetDir)));
        console.log(chalk.white('   openspec init'));
        console.log('');
        return false;
      }
    }
  } catch (error) {
    openSpecSpinner.fail('OpenSpec initialization failed');
    console.log('');
    console.log(chalk.yellow('⚠️  OpenSpec setup encountered an issue:'));
    console.log(chalk.gray(`   ${error.message.split('\n')[0]}`));
    console.log('');
    console.log(chalk.white('You can set it up later with:'));
    console.log(chalk.gray('   npm install -g openspec && openspec init'));
    return false;
  }
  
  return false;
}
