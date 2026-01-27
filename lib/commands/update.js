import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { getPackageDir, copyTemplate, copyDirectory } from '../utils.js';

export async function update(options) {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  
  if (!silent) {
    console.log('');
    console.log(chalk.cyan.bold('🔄 Update Knowledge System'));
    console.log('');
  }
  
  // Check if this is an aiknowsys project
  const essentialsPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.md');
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  
  if (!fs.existsSync(essentialsPath) && !fs.existsSync(agentsPath)) {
    if (!silent) {
      console.log(chalk.red('❌ No knowledge system found in this directory.'));
      console.log('');
      console.log(chalk.yellow('💡 Run `aiknowsys init` first to set up the knowledge system.'));
    }
    throw new Error('No knowledge system found');
  }
  
  // Get current and latest versions
  const currentVersion = getCurrentVersion(targetDir);
  const latestVersion = getLatestVersion();
  
  if (!silent) {
    console.log(chalk.white(`   Current version: ${currentVersion || 'Unknown'}`));
    console.log(chalk.white(`   Latest version:  ${latestVersion}`));
    console.log('');
  }
  
  if (currentVersion === latestVersion && !options.force) {
    if (!silent) {
      console.log(chalk.green('✅ Already up to date!'));
      console.log('');
      console.log(chalk.gray('💡 To force update: aiknowsys update --force'));
    }
    return { alreadyUpToDate: true, currentVersion, latestVersion };
  }
  
  // Ask what to update (unless --yes flag or silent)
  let updateChoices;
  
  if (!options.yes && !silent) {
    const { choices } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'choices',
      message: '📦 What would you like to update?',
      choices: [
        { 
          name: '🤖 Custom Agents (Developer + Architect)', 
          value: 'agents',
          checked: true
        },
        { 
          name: '🎓 Universal Skills (latest best practices)', 
          value: 'skills',
          checked: true
        },
        {
          name: '📋 AGENTS.md workflow (session protocol, examples)',
          value: 'agents-md',
          checked: true
        },
        {
          name: '⚠️  CODEBASE_ESSENTIALS.md template (Advanced - may need restoration)',
          value: 'essentials-md',
          checked: false
        }
      ]
    }]);
    
    if (choices.length === 0) {
      if (!silent) {
        console.log(chalk.yellow('No updates selected. Exiting.'));
      }
      return { updated: 0, choices: [] };
    }
    
    updateChoices = choices;
  } else {
    // --yes flag: update everything
    updateChoices = ['agents', 'skills', 'agents-md'];
    if (!silent) {
      console.log(chalk.gray('Updating all components (--yes flag)'));
      console.log('');
    }
  }
  
  // Perform updates
  const packageDir = getPackageDir();
  let updatedCount = 0;
  
  // Update custom agents
  if (updateChoices.includes('agents')) {
    const agentSpinner = silent ? null : ora('Updating custom agents...').start();
    
    try {
      const agentsDir = path.join(targetDir, '.github', 'agents');
      
      // Backup existing agents
      if (fs.existsSync(agentsDir)) {
        const backupDir = path.join(targetDir, '.github', 'agents.backup');
        if (fs.existsSync(backupDir)) {
          fs.rmSync(backupDir, { recursive: true, force: true });
        }
        fs.cpSync(agentsDir, backupDir, { recursive: true });
        if (agentSpinner) agentSpinner.text = 'Updating custom agents (backup created)...';
      }
      
      // Copy new agent templates
      if (!fs.existsSync(agentsDir)) {
        fs.mkdirSync(agentsDir, { recursive: true });
      }
      
      copyDirectory(
        path.join(packageDir, 'templates', 'agents'),
        agentsDir
      );
      
      if (agentSpinner) agentSpinner.succeed('Custom agents updated');
      updatedCount++;
    } catch (error) {
      if (agentSpinner) agentSpinner.fail('Failed to update agents');
      if (!silent) console.log(chalk.red(`   Error: ${error.message}`));
    }
  }
  
  // Update skills
  if (updateChoices.includes('skills')) {
    const skillsSpinner = silent ? null : ora('Updating universal skills...').start();
    
    try {
      const skillsDir = path.join(targetDir, '.github', 'skills');
      
      // Backup existing skills
      if (fs.existsSync(skillsDir)) {
        const backupDir = path.join(targetDir, '.github', 'skills.backup');
        if (fs.existsSync(backupDir)) {
          fs.rmSync(backupDir, { recursive: true, force: true });
        }
        fs.cpSync(skillsDir, backupDir, { recursive: true });
        if (skillsSpinner) skillsSpinner.text = 'Updating universal skills (backup created)...';
      }
      
      // Copy new skills
      if (!fs.existsSync(skillsDir)) {
        fs.mkdirSync(skillsDir, { recursive: true });
      }
      
      copyDirectory(
        path.join(packageDir, 'templates', 'skills'),
        skillsDir
      );
      
      if (skillsSpinner) skillsSpinner.succeed('Universal skills updated');
      updatedCount++;
    } catch (error) {
      if (skillsSpinner) skillsSpinner.fail('Failed to update skills');
      if (!silent) console.log(chalk.red(`   Error: ${error.message}`));
    }
  }
  
  // Update AGENTS.md
  let agentsMdHadCustomizations = false;
  if (updateChoices.includes('agents-md')) {
    const agentsMdSpinner = silent ? null : ora('Updating AGENTS.md...').start();
    
    try {
      const agentsMdPath = path.join(targetDir, 'AGENTS.md');
      
      // Check if current AGENTS.md has customizations (no placeholders)
      if (fs.existsSync(agentsMdPath)) {
        const currentContent = fs.readFileSync(agentsMdPath, 'utf-8');
        agentsMdHadCustomizations = !currentContent.includes('{{VALIDATION_MATRIX}}') && !currentContent.includes('{{SKILL_MAPPING}}');
        
        // Backup existing AGENTS.md
        const backupPath = path.join(targetDir, 'AGENTS.md.backup');
        fs.copyFileSync(agentsMdPath, backupPath);
        if (agentsMdSpinner) agentsMdSpinner.text = 'Updating AGENTS.md (backup created)...';
      }
      
      // Copy new AGENTS.md template
      copyTemplate(
        path.join(packageDir, 'templates', 'AGENTS.template.md'),
        agentsMdPath
      );
      
      if (agentsMdSpinner) agentsMdSpinner.succeed('AGENTS.md updated');
      updatedCount++;
    } catch (error) {
      if (agentsMdSpinner) agentsMdSpinner.fail('Failed to update AGENTS.md');
      if (!silent) console.log(chalk.red(`   Error: ${error.message}`));
    }
  }
  
  // Update CODEBASE_ESSENTIALS.md (opt-in only, unchecked by default)
  let essentialsMdHadCustomizations = false;
  if (updateChoices.includes('essentials-md')) {
    const essentialsMdSpinner = silent ? null : ora('Updating CODEBASE_ESSENTIALS.md...').start();
    
    try {
      const essentialsMdPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.md');
      
      // Check if current CODEBASE_ESSENTIALS.md has customizations (no TODO markers)
      if (fs.existsSync(essentialsMdPath)) {
        const currentContent = fs.readFileSync(essentialsMdPath, 'utf-8');
        essentialsMdHadCustomizations = !currentContent.includes('TODO:') && !currentContent.includes('{{');
        
        // Backup existing CODEBASE_ESSENTIALS.md
        const backupPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.md.backup');
        fs.copyFileSync(essentialsMdPath, backupPath);
        if (essentialsMdSpinner) essentialsMdSpinner.text = 'Updating CODEBASE_ESSENTIALS.md (backup created)...';
      }
      
      // Copy new CODEBASE_ESSENTIALS.md template
      copyTemplate(
        path.join(packageDir, 'templates', 'CODEBASE_ESSENTIALS.template.md'),
        essentialsMdPath
      );
      
      if (essentialsMdSpinner) essentialsMdSpinner.succeed('CODEBASE_ESSENTIALS.md updated');
      updatedCount++;
    } catch (error) {
      if (essentialsMdSpinner) essentialsMdSpinner.fail('Failed to update CODEBASE_ESSENTIALS.md');
      if (!silent) console.log(chalk.red(`   Error: ${error.message}`));
    }
  }
  
  // Update version tracking
  saveCurrentVersion(targetDir, latestVersion);
  
  // Success summary
  if (!silent) {
    console.log('');
    console.log(chalk.green.bold(`✅ Updated ${updatedCount} component${updatedCount !== 1 ? 's' : ''}!`));
    console.log('');
    
    if (updatedCount > 0) {
      console.log(chalk.white('📁 Backups created:'));
      if (updateChoices.includes('agents')) {
        console.log(chalk.gray('   • .github/agents.backup/'));
      }
      if (updateChoices.includes('skills')) {
        console.log(chalk.gray('   • .github/skills.backup/'));
      }
      if (updateChoices.includes('agents-md')) {
        console.log(chalk.gray('   • AGENTS.md.backup'));
      }
      if (updateChoices.includes('essentials-md')) {
        console.log(chalk.gray('   • CODEBASE_ESSENTIALS.md.backup'));
      }
      console.log('');
      
      // If AGENTS.md had customizations, show AI restoration prompt
      if (agentsMdHadCustomizations) {
        console.log(chalk.cyan.bold('🤖 AI-Assisted Restoration'));
        console.log('');
        console.log(chalk.yellow('⚠️  AGENTS.md was updated with new workflow improvements.'));
        console.log(chalk.white('   Your customizations (validation matrix, skill mappings) are in AGENTS.md.backup'));
        console.log('');
        console.log(chalk.cyan('👉 COPY THIS PROMPT TO YOUR AI ASSISTANT:'));
        console.log(chalk.gray('   (GitHub Copilot, Claude, ChatGPT, etc.)'));
        console.log('');
        console.log(chalk.white('   "I just updated AGENTS.md and need to restore my customizations.'));
        console.log(chalk.white('   '));
        console.log(chalk.white('   Please:'));
        console.log(chalk.white('   1. Read AGENTS.md.backup'));
        console.log(chalk.white('   2. Find the {{VALIDATION_MATRIX}} and {{SKILL_MAPPING}} sections'));
        console.log(chalk.white('   3. Copy those filled-in sections from the backup'));
        console.log(chalk.white('   4. Replace the placeholders in the new AGENTS.md with my customizations'));
        console.log(chalk.white('   '));
        console.log(chalk.white('   Preserve all other new content in AGENTS.md (workflow improvements)."'));
        console.log('');
        console.log(chalk.gray('   💡 This takes ~10 seconds with AI assistance'));
        console.log('');
      }
      
      // If CODEBASE_ESSENTIALS.md had customizations, show AI restoration prompt
      if (essentialsMdHadCustomizations) {
        console.log(chalk.cyan.bold('🤖 AI-Assisted Restoration (CODEBASE_ESSENTIALS.md)'));
        console.log('');
        console.log(chalk.red.bold('⚠️  IMPORTANT: CODEBASE_ESSENTIALS.md was replaced with template!'));
        console.log(chalk.white('   Your project-specific patterns are in CODEBASE_ESSENTIALS.md.backup'));
        console.log('');
        console.log(chalk.cyan('👉 COPY THIS PROMPT TO YOUR AI ASSISTANT:'));
        console.log(chalk.gray('   (GitHub Copilot, Claude, ChatGPT, etc.)'));
        console.log('');
        console.log(chalk.white('   "I updated CODEBASE_ESSENTIALS.md template and need to restore my customizations.'));
        console.log(chalk.white('   '));
        console.log(chalk.white('   Please:'));
        console.log(chalk.white('   1. Read CODEBASE_ESSENTIALS.md.backup (my old customized version)'));
        console.log(chalk.white('   2. Read CODEBASE_ESSENTIALS.md (new template version)'));
        console.log(chalk.white('   3. Merge my project-specific content from backup into new template'));
        console.log(chalk.white('   4. Keep new template structure/sections, but restore my:'));
        console.log(chalk.white('      - Technology Snapshot (my actual stack)'));
        console.log(chalk.white('      - Validation Matrix (my test commands)'));
        console.log(chalk.white('      - Core Patterns (my code conventions)'));
        console.log(chalk.white('      - Critical Invariants (my project rules)'));
        console.log(chalk.white('   '));
        console.log(chalk.white('   Preserve any NEW sections from the template."'));
        console.log('');
        console.log(chalk.gray('   💡 This may take 30-60 seconds for complex projects'));
        console.log('');
      }
      
      console.log(chalk.cyan('💡 What\'s new:'));
      console.log(chalk.white('   • Check the changelog: https://github.com/arpa73/aiknowsys/blob/main/CODEBASE_CHANGELOG.md'));
      console.log(chalk.white('   • Review updated files for new features and improvements'));
      console.log('');
      console.log(chalk.yellow('⚠️  Important:'));
      if (!updateChoices.includes('essentials-md')) {
        console.log(chalk.white('   • CODEBASE_ESSENTIALS.md is NOT updated (contains your project-specific patterns)'));
      }
      if (!agentsMdHadCustomizations && updateChoices.includes('agents-md')) {
        console.log(chalk.white('   • Fill in AGENTS.md placeholders ({{VALIDATION_MATRIX}}, {{SKILL_MAPPING}}'));
      }
      if (!essentialsMdHadCustomizations && updateChoices.includes('essentials-md')) {
        console.log(chalk.white('   • Fill in CODEBASE_ESSENTIALS.md placeholders (TODO sections)'));
      }
      console.log('');
    }
  }
  
  // Return data for tests
  return {
    updated: updatedCount,
    components: updateChoices,
    currentVersion,
    latestVersion,
    agentsMdHadCustomizations,
    essentialsMdHadCustomizations
  };
}

function getCurrentVersion(targetDir) {
  const versionFile = path.join(targetDir, '.aiknowsys-version');
  
  if (fs.existsSync(versionFile)) {
    return fs.readFileSync(versionFile, 'utf-8').trim();
  }
  
  return null;
}

function getLatestVersion() {
  const packageDir = getPackageDir();
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(packageDir, 'package.json'), 'utf-8')
  );
  return packageJson.version;
}

function saveCurrentVersion(targetDir, version) {
  const versionFile = path.join(targetDir, '.aiknowsys-version');
  fs.writeFileSync(versionFile, version, 'utf-8');
}
