import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { getPackageDir, copyDirectory } from '../utils.js';

const AVAILABLE_SKILLS = [
  'code-refactoring',
  'dependency-updates',
  'documentation-management',
  'skill-creator'
];

export async function installSkills(options) {
  const targetDir = path.resolve(options.dir);
  const selectedSkills = options.skills || AVAILABLE_SKILLS;
  const silent = options._silent || false;
  
  if (!silent) {
    console.log('');
    console.log(chalk.cyan.bold('📚 Installing Universal Skills'));
    console.log('');
  }
  
  const packageDir = getPackageDir();
  const skillsDir = path.join(targetDir, '.github', 'skills');
  
  // Create skills directory
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }
  
  const spinner = silent ? null : ora('Installing skills...').start();
  
  let installed = 0;
  let skipped = 0;
  
  try {
    for (const skill of selectedSkills) {
      const sourcePath = path.join(packageDir, 'templates', 'skills', skill);
      const destPath = path.join(skillsDir, skill);
      
      if (!fs.existsSync(sourcePath)) {
        if (!silent) {
          console.log(chalk.yellow(`   ⚠️  Skill not found: ${skill}`));
        }
        continue;
      }
      
      if (fs.existsSync(destPath)) {
        skipped++;
        continue;
      }
      
      copyDirectory(sourcePath, destPath);
      installed++;
    }
    
    if (spinner) {
      if (installed > 0) {
        spinner.succeed(`Installed ${installed} skill${installed > 1 ? 's' : ''}`);
      } else if (skipped > 0) {
        spinner.succeed('All skills already installed');
      } else {
        spinner.warn('No skills found to install');
      }
    }
    
    if (!silent) {
      console.log('');
      console.log(chalk.white('📍 Location: .github/skills/'));
      
      for (const skill of AVAILABLE_SKILLS) {
        const destPath = path.join(skillsDir, skill);
        if (fs.existsSync(destPath)) {
          console.log(chalk.gray(`   ✅ ${skill}`));
        }
      }
      
      console.log('');
      console.log(chalk.cyan('💡 Skills provide domain-specific guidance for AI assistants'));
      console.log(chalk.gray('   Use by asking about the topic, e.g., "How do I update dependencies?"'));
      console.log('');
    }
    
  } catch (error) {
    if (spinner) spinner.fail('Failed to install skills');
    console.error(chalk.red(error.message));
    if (!silent) process.exit(1);
    throw error;
  }
}
