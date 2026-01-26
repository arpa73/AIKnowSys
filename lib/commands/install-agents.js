import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { getPackageDir, copyTemplate } from '../utils.js';

export async function installAgents(options) {
  const targetDir = path.resolve(options.dir);
  const essentialsFile = options.essentials || 'CODEBASE_ESSENTIALS.md';
  const silent = options._silent || false;
  const skipPrompts = options.yes || false;
  
  if (!silent) {
    console.log('');
    console.log(chalk.cyan.bold('🤖 Installing Custom Agents (Developer + Architect Workflow)'));
    console.log('');
  }
  
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
      
      console.log('');
      console.log(chalk.green.bold('✅ Custom agents installed successfully!'));
      console.log('');
      console.log(chalk.white('📍 Location: .github/agents/'));
      console.log(chalk.gray('   • developer.agent.md    (Primary implementer)'));
      console.log(chalk.gray('   • architect.agent.md    (Code reviewer)'));
      console.log(chalk.gray('   • USAGE.txt             (Usage guide)'));
      console.log('');
      console.log(chalk.cyan.bold('🚀 Usage in VS Code:'));
      console.log(chalk.white('   @Developer <your request>     → Implements and auto-reviews'));
      console.log(chalk.white('   @SeniorArchitect <file>       → Direct review request'));
      console.log('');
      console.log(chalk.yellow.bold('⚠️  Important: Reload VS Code to activate agents'));
      console.log(chalk.gray('   Command Palette → "Developer: Reload Window"'));
      console.log('');
    }
    
  } catch (error) {
    if (spinner) spinner.fail('Failed to install agents');
    console.error(chalk.red(error.message));
    throw error;
  }
}
