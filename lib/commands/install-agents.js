import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import { createLogger } from '../logger.js';
import { getPackageDir, copyTemplate } from '../utils.js';

export async function installAgents(options) {
  const targetDir = path.resolve(options.dir);
  const essentialsFile = options.essentials || 'CODEBASE_ESSENTIALS.md';
  const silent = options._silent || false;
  const skipPrompts = options.yes || false;
  const log = createLogger(silent);
  
  log.blank();
  log.header('Installing Custom Agents (Developer + Architect Workflow)', '🤖');
  log.blank();
  
  const packageDir = getPackageDir();
  const agentsDir = path.join(targetDir, '.github', 'agents');
  
  // Create agents directory
  if (!fs.existsSync(agentsDir)) {
    fs.mkdirSync(agentsDir, { recursive: true });
  }
  
  const spinner = silent ? null : ora('Copying agent templates...').start();
  
  try {
    // Copy agent templates
    copyTemplate(
      path.join(packageDir, 'templates', 'agents', 'developer.agent.template.md'),
      path.join(agentsDir, 'developer.agent.md'),
      {
        '{{ESSENTIALS_FILE}}': essentialsFile,
        '{{PROJECT_GUIDELINES}}': 'None specified'
      }
    );
    
    copyTemplate(
      path.join(packageDir, 'templates', 'agents', 'architect.agent.template.md'),
      path.join(agentsDir, 'architect.agent.md'),
      {
        '{{ESSENTIALS_FILE}}': essentialsFile
      }
    );
    
    // Copy usage guide (as .txt to prevent VS Code from treating it as an agent)
    copyTemplate(
      path.join(packageDir, 'templates', 'agents', 'USAGE.txt'),
      path.join(agentsDir, 'USAGE.txt')
    );
    
    if (spinner) spinner.succeed('Agent templates installed');
    
    // Ask for project-specific guidelines (only in interactive mode)
    if (!silent && !skipPrompts) {
      const { addGuidelines } = await inquirer.prompt([{
        type: 'confirm',
        name: 'addGuidelines',
        message: 'Do you want to add project-specific guidelines for the Developer agent?',
        default: false
      }]);
      
      if (addGuidelines) {
        const { guidelines } = await inquirer.prompt([{
          type: 'input',
          name: 'guidelines',
          message: 'Enter guidelines:'
        }]);
        
        if (guidelines) {
          const devAgentPath = path.join(agentsDir, 'developer.agent.md');
          let content = fs.readFileSync(devAgentPath, 'utf-8');
          content = content.replace('None specified', guidelines);
          fs.writeFileSync(devAgentPath, content);
        }
      }
      
      log.blank();
      log.log('\x1b[32m\x1b[1m✅ Custom agents installed successfully!\x1b[0m');
      log.blank();
      log.white('📁 Location: .github/agents/');
      log.dim('   • developer.agent.md    (Primary implementer)');
      log.dim('   • architect.agent.md    (Code reviewer)');
      log.dim('   • USAGE.txt             (Usage guide)');
      log.blank();
      log.header('Usage in VS Code', '🚀');
      log.white('   @Developer <your request>     → Implements and auto-reviews');
      log.white('   @SeniorArchitect <file>       → Direct review request');
      log.blank();
      log.log('\x1b[33m\x1b[1m⚠️  Important: Reload VS Code to activate agents\x1b[0m');
      log.dim('   Command Palette → "Developer: Reload Window"');
      log.blank();
    }
    
  } catch (error) {
    if (spinner) spinner.fail('Failed to install agents');
    log.error(error.message);
    throw error;
  }
}
