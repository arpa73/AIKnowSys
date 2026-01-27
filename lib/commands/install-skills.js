import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { createLogger } from '../logger.js';
import { getPackageDir, copyDirectory } from '../utils.js';

const AVAILABLE_SKILLS = [
  'code-refactoring',
  'dependency-updates',
  'documentation-management',
  'skill-creator',
  'tdd-workflow'
];

export async function installSkills(options) {
  const targetDir = path.resolve(options.dir);
  const selectedSkills = options.skills || AVAILABLE_SKILLS;
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.blank();
  log.header('Installing Universal Skills', '📚');
  log.blank();
  
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
        log.log('\x1b[33m   ⚠️  Skill not found: ' + skill + '\x1b[0m');
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
    
    log.blank();
    log.white('📁 Location: .github/skills/');
    
    for (const skill of AVAILABLE_SKILLS) {
      const destPath = path.join(skillsDir, skill);
      if (fs.existsSync(destPath)) {
        log.dim(`   ✅ ${skill}`);
      }
    }
    
    log.blank();
    log.cyan('💡 Skills provide domain-specific guidance for AI assistants');
    log.dim('   Use by asking about the topic, e.g., "How do I update dependencies?"');
    log.blank();
    
  } catch (error) {
    if (spinner) spinner.fail('Failed to install skills');
    log.error(error.message);
    throw error;
  }
}
