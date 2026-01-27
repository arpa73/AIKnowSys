import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import { createLogger } from '../logger.js';
import { getPackageDir, copyTemplate, copyDirectory } from '../utils.js';

export async function update(options) {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.blank();
  log.header('Update Knowledge System', '🔄');
  log.blank();
  
  // Check if this is an aiknowsys project
  const essentialsPath = path.join(targetDir, 'CODEBASE_ESSENTIALS.md');
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  
  if (!fs.existsSync(essentialsPath) && !fs.existsSync(agentsPath)) {
    log.error('No knowledge system found in this directory.');
    log.blank();
    log.log('\x1b[33m💡 Run `aiknowsys init` first to set up the knowledge system.\x1b[0m');
    throw new Error('No knowledge system found');
  }
  
  // Get current and latest versions
  const currentVersion = getCurrentVersion(targetDir);
  const latestVersion = getLatestVersion();
  
  log.white(`   Current version: ${currentVersion || 'Unknown'}`);
  log.white(`   Latest version:  ${latestVersion}`);
  log.blank();
  
  if (currentVersion === latestVersion && !options.force) {
    log.success('Already up to date!');
    log.blank();
    log.dim('💡 To force update: aiknowsys update --force');
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
      log.log('\x1b[33mNo updates selected. Exiting.\x1b[0m');
      return { updated: 0, choices: [] };
    }
    
    updateChoices = choices;
  } else {
    // --yes flag: update everything
    updateChoices = ['agents', 'skills', 'agents-md'];
    log.dim('Updating all components (--yes flag)');
    log.blank();
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
      log.error(`Error: ${error.message}`);
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
      log.error(`Error: ${error.message}`);
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
      log.error(`Error: ${error.message}`);
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
      log.error(`Error: ${error.message}`);
    }
  }
  
  // Update version tracking
  saveCurrentVersion(targetDir, latestVersion);
  
  // Success summary
  log.blank();
  log.log(`\x1b[32m\x1b[1m✅ Updated ${updatedCount} component${updatedCount !== 1 ? 's' : ''}!\x1b[0m`);
  log.blank();
  
  if (updatedCount > 0) {
    log.white('📁 Backups created:');
    if (updateChoices.includes('agents')) {
      log.dim('   • .github/agents.backup/');
    }
    if (updateChoices.includes('skills')) {
      log.dim('   • .github/skills.backup/');
    }
    if (updateChoices.includes('agents-md')) {
      log.dim('   • AGENTS.md.backup');
    }
    if (updateChoices.includes('essentials-md')) {
      log.dim('   • CODEBASE_ESSENTIALS.md.backup');
    }
    log.blank();
      
      // If AGENTS.md had customizations, show AI restoration prompt
      if (agentsMdHadCustomizations) {
      log.header('AI-Assisted Restoration', '🤖');
      log.blank();
      log.log('\x1b[33m⚠️  AGENTS.md was updated with new workflow improvements.\x1b[0m');
      log.white('   Your customizations (validation matrix, skill mappings) are in AGENTS.md.backup');
      log.blank();
      log.cyan('👉 COPY THIS PROMPT TO YOUR AI ASSISTANT:');
      log.dim('   (GitHub Copilot, Claude, ChatGPT, etc.)');
      log.blank();
      log.white('   "I just updated AGENTS.md and need to restore my customizations.');
      log.white('   ');
      log.white('   Please:');
      log.white('   1. Read AGENTS.md.backup');
      log.white('   2. Find the {{VALIDATION_MATRIX}} and {{SKILL_MAPPING}} sections');
      log.white('   3. Copy those filled-in sections from the backup');
      log.white('   4. Replace the placeholders in the new AGENTS.md with my customizations');
      log.white('   ');
      log.white('   Preserve all other new content in AGENTS.md (workflow improvements)."');
      log.blank();
      log.dim('   💡 This takes ~10 seconds with AI assistance');
      log.blank();
    }
      
    // If CODEBASE_ESSENTIALS.md had customizations, show AI restoration prompt
    if (essentialsMdHadCustomizations) {
      log.header('AI-Assisted Restoration (CODEBASE_ESSENTIALS.md)', '🤖');
      log.blank();
      log.log('\x1b[31m\x1b[1m⚠️  IMPORTANT: CODEBASE_ESSENTIALS.md was replaced with template!\x1b[0m');
      log.white('   Your project-specific patterns are in CODEBASE_ESSENTIALS.md.backup');
      log.blank();
      log.cyan('👉 COPY THIS PROMPT TO YOUR AI ASSISTANT:');
      log.dim('   (GitHub Copilot, Claude, ChatGPT, etc.)');
      log.blank();
      log.white('   "I updated CODEBASE_ESSENTIALS.md template and need to restore my customizations.');
      log.white('   ');
      log.white('   Please:');
      log.white('   1. Read CODEBASE_ESSENTIALS.md.backup (my old customized version)');
      log.white('   2. Read CODEBASE_ESSENTIALS.md (new template version)');
      log.white('   3. Merge my project-specific content from backup into new template');
      log.white('   4. Keep new template structure/sections, but restore my:');
      log.white('      - Technology Snapshot (my actual stack)');
      log.white('      - Validation Matrix (my test commands)');
      log.white('      - Core Patterns (my code conventions)');
      log.white('      - Critical Invariants (my project rules)');
      log.white('   ');
      log.white('   Preserve any NEW sections from the template."');
      log.blank();
      log.dim('   💡 This may take 30-60 seconds for complex projects');
      log.blank();
    }
      
    log.cyan('💡 What\'s new:');
    log.white('   • Check the changelog: https://github.com/arpa73/aiknowsys/blob/main/CODEBASE_CHANGELOG.md');
    log.white('   • Review updated files for new features and improvements');
    log.blank();
    log.log('\x1b[33m⚠️  Important:\x1b[0m');
    if (!updateChoices.includes('essentials-md')) {
      log.white('   • CODEBASE_ESSENTIALS.md is NOT updated (contains your project-specific patterns)');
    }
    if (!agentsMdHadCustomizations && updateChoices.includes('agents-md')) {
      log.white('   • Fill in AGENTS.md placeholders ({{VALIDATION_MATRIX}}, {{SKILL_MAPPING}}');
    }
    if (!essentialsMdHadCustomizations && updateChoices.includes('essentials-md')) {
      log.white('   • Fill in CODEBASE_ESSENTIALS.md placeholders (TODO sections)');
    }
    log.blank();
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
