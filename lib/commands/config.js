/**
 * Config command - Manage feature configuration
 * 
 * Subcommands:
 * - enable <feature> - Enable and install a feature
 * - disable <feature> - Disable a feature
 * - uninstall - Remove AIKnowSys completely
 */
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import { createLogger } from '../logger.js';
import { loadConfig, saveConfig, getDefaultConfig } from '../config.js';

// Derive valid features from default config to maintain DRY
const VALID_FEATURES = Object.keys(getDefaultConfig().features);

/**
 * Enable a feature
 */
export async function enableFeature(feature, options) {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  // Validate feature name
  if (!VALID_FEATURES.includes(feature)) {
    log.blank();
    log.error(`Unknown feature: "${feature}"`);
    log.blank();
    log.yellow('💡 Valid features:');
    VALID_FEATURES.forEach(f => log.cyan(`   - ${f}`));
    log.blank();
    throw new Error(`Invalid feature: ${feature}`);
  }
  
  // Load current config
  const config = await loadConfig(targetDir);
  
  // Ensure features object exists
  if (!config.features) {
    config.features = {};
  }
  
  // Check if already enabled
  if (config.features[feature]) {
    log.blank();
    log.yellow(`⚠️  Feature "${feature}" is already enabled`);
    log.blank();
    return { success: true, alreadyEnabled: true };
  }
  
  // Enable in config first
  config.features[feature] = true;
  await saveConfig(targetDir, config);
  
  log.blank();
  log.header(`Enabling ${feature}`, '🎯');
  
  // Feature-specific installation logic
  const spinner = silent ? null : ora(`Installing ${feature}...`).start();
  
  try {
    switch (feature) {
      case 'agents': {
        const { installAgents } = await import('./install-agents.js');
        await installAgents({ 
          dir: targetDir, 
          essentials: options.essentials || 'CODEBASE_ESSENTIALS.md',
          _silent: true 
        });
        break;
      }
      
      case 'skills': {
        const { installSkills } = await import('./install-skills.js');
        await installSkills({ dir: targetDir, _silent: true });
        
        // Update AGENTS.md with skill mapping
        const agentsPath = path.join(targetDir, 'AGENTS.md');
        if (fs.existsSync(agentsPath)) {
          const { buildSkillMapping } = await import('../skill-mapping.js');
          const skillMapping = await buildSkillMapping(targetDir);
          let agentsContent = await fs.promises.readFile(agentsPath, 'utf-8');
          
          // Replace or append skill mapping
          if (agentsContent.includes('{{SKILL_MAPPING}}')) {
            agentsContent = agentsContent.replace('{{SKILL_MAPPING}}', skillMapping);
          } else if (agentsContent.includes('## 📚 Skills Workflow')) {
            // Append after skills section
            agentsContent = agentsContent.replace(
              /## 📚 Skills Workflow\n/,
              `## 📚 Skills Workflow\n\n${skillMapping}\n`
            );
          }
          
          await fs.promises.writeFile(agentsPath, agentsContent, 'utf-8');
        }
        break;
      }
      
      case 'vscodeHooks': {
        const { setupHooks } = await import('./init/templates.js');
        await setupHooks(targetDir, true);
        break;
      }
      
      case 'sessionPersistence': {
        const { setupSessionPersistence } = await import('./init/templates.js');
        await setupSessionPersistence(targetDir, true);
        break;
      }
      
      case 'tddEnforcement': {
        const { setupTDDEnforcement } = await import('./init/templates.js');
        await setupTDDEnforcement(targetDir, true);
        break;
      }
      
      case 'openspec': {
        const { setupOpenSpec } = await import('./init/openspec.js');
        await setupOpenSpec(targetDir, true);
        break;
      }
    }
    
    if (spinner) spinner.succeed(`${feature} enabled`);
    
    log.blank();
    log.green(`✅ Feature "${feature}" enabled successfully`);
    log.blank();
    
    // Show next steps
    if (feature === 'vscodeHooks') {
      log.yellow('⚠️  Reload VS Code to activate hooks');
      log.dim('   Command Palette → "Developer: Reload Window"');
      log.blank();
    }
    
    if (feature === 'tddEnforcement') {
      log.cyan('📖 Next: Install git hooks');
      log.dim('   cd .github/hooks && node install-git-hooks.cjs');
      log.blank();
    }
    
    return { success: true, installed: true };
    
  } catch (error) {
    if (spinner) spinner.fail(`Failed to enable ${feature}`);
    log.error(`Error: ${error.message}`);
    
    // Rollback config change
    config.features[feature] = false;
    await saveConfig(targetDir, config);
    
    throw error;
  }
}

/**
 * Disable a feature
 */
export async function disableFeature(feature, options) {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  // Validate feature name
  if (!VALID_FEATURES.includes(feature)) {
    log.blank();
    log.error(`Unknown feature: "${feature}"`);
    log.blank();
    log.yellow('💡 Valid features:');
    VALID_FEATURES.forEach(f => log.cyan(`   - ${f}`));
    log.blank();
    throw new Error(`Invalid feature: ${feature}`);
  }
  
  // Load current config
  const config = await loadConfig(targetDir);
  
  // Ensure features object exists
  if (!config.features) {
    config.features = {};
  }
  
  // Check if already disabled
  if (!config.features[feature]) {
    log.blank();
    log.yellow(`⚠️  Feature "${feature}" is already disabled`);
    log.blank();
    return { success: true, alreadyDisabled: true };
  }
  
  log.blank();
  log.header(`Disabling ${feature}`, '🔧');
  
  // Ask about file removal (optional)
  let removeFiles = false;
  if (!silent && !options.keepFiles) {
    const { remove } = await inquirer.prompt([{
      type: 'confirm',
      name: 'remove',
      message: `Remove ${feature} files from project?`,
      default: false
    }]);
    removeFiles = remove;
  }
  
  // Disable in config
  config.features[feature] = false;
  await saveConfig(targetDir, config);
  
  log.green(`✅ Feature "${feature}" disabled in config`);
  
  // Optionally remove files
  if (removeFiles) {
    const spinner = silent ? null : ora(`Removing ${feature} files...`).start();
    
    try {
      switch (feature) {
        case 'agents':
          await removeDirectory(path.join(targetDir, '.github', 'agents'));
          break;
          
        case 'skills':
          await removeDirectory(path.join(targetDir, '.github', 'skills'));
          break;
          
        case 'vscodeHooks':
          await removeDirectory(path.join(targetDir, '.github', 'hooks'));
          break;
          
        case 'sessionPersistence':
          await removeDirectory(path.join(targetDir, '.aiknowsys', 'sessions'));
          await removeDirectory(path.join(targetDir, '.aiknowsys', 'learned'));
          break;
          
        case 'tddEnforcement':
          await removeDirectory(path.join(targetDir, '.git-hooks'));
          await removeFile(path.join(targetDir, 'scripts', 'install-git-hooks.sh'));
          await removeFile(path.join(targetDir, '.github', 'workflows', 'tdd-compliance.yml'));
          break;
      }
      
      if (spinner) spinner.succeed('Files removed');
      log.green('✅ Files removed successfully');
      
    } catch (error) {
      if (spinner) spinner.fail('Failed to remove files');
      log.yellow('⚠️  Some files could not be removed');
      log.dim(`   ${error.message}`);
    }
  } else {
    log.dim('   Files kept (use --remove-files to delete)');
  }
  
  log.blank();
  return { success: true, filesRemoved: removeFiles };
}

/**
 * Uninstall AIKnowSys completely
 */
export async function uninstall(options) {
  const targetDir = path.resolve(options.dir);
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  log.blank();
  log.header('Uninstall AIKnowSys', '🗑️');
  log.blank();
  
  // Safety warning
  log.error('⚠️  WARNING: This will remove all AIKnowSys files from your project');
  log.blank();
  log.yellow('Files to be removed:');
  log.dim('   • CODEBASE_ESSENTIALS.md, AGENTS.md, CODEBASE_CHANGELOG.md');
  log.dim('   • .github/agents/, .github/skills/, .github/hooks/');
  log.dim('   • .github/workflows/tdd-compliance.yml');
  log.dim('   • .git-hooks/, scripts/install-git-hooks.sh');
  log.dim('   • .aiknowsys.config.json');
  log.blank();
  
  // Ask about keeping user data
  if (!silent && !options.yes) {
    const { confirmProjectName: _confirmProjectName } = await inquirer.prompt([{
      type: 'input',
      name: 'confirmProjectName',
      message: 'Type the project name to confirm deletion:',
      validate: (input) => {
        const expected = path.basename(targetDir);
        return input === expected || `Must match "${expected}"`;
      }
    }]);
    
    const { keepData } = await inquirer.prompt([{
      type: 'confirm',
      name: 'keepData',
      message: 'Keep user data (.aiknowsys/sessions/, .aiknowsys/learned/)?',
      default: true
    }]);
    
    options._keepData = keepData;
  }
  
  const spinner = silent ? null : ora('Removing AIKnowSys files...').start();
  
  try {
    const removedFiles = [];
    
    // Remove core files
    const coreFiles = [
      'CODEBASE_ESSENTIALS.md',
      'AGENTS.md',
      'CODEBASE_CHANGELOG.md',
      '.aiknowsys.config.json'
    ];
    
    for (const file of coreFiles) {
      const filePath = path.join(targetDir, file);
      if (await removeFile(filePath)) {
        removedFiles.push(file);
      }
    }
    
    // Remove directories
    const dirs = [
      '.github/agents',
      '.github/skills',
      '.github/hooks',
      '.git-hooks',
      'scripts'
    ];
    
    for (const dir of dirs) {
      const dirPath = path.join(targetDir, dir);
      if (await removeDirectory(dirPath)) {
        removedFiles.push(dir + '/');
      }
    }
    
    // Remove workflow file
    const workflowPath = path.join(targetDir, '.github', 'workflows', 'tdd-compliance.yml');
    if (await removeFile(workflowPath)) {
      removedFiles.push('.github/workflows/tdd-compliance.yml');
    }
    
    // Optionally remove user data
    if (!options._keepData) {
      await removeDirectory(path.join(targetDir, '.aiknowsys'));
      removedFiles.push('.aiknowsys/');
    }
    
    if (spinner) spinner.succeed('AIKnowSys uninstalled');
    
    log.blank();
    log.green('✅ AIKnowSys removed successfully');
    log.blank();
    log.cyan('📋 Removed files:');
    removedFiles.forEach(f => log.dim(`   • ${f}`));
    log.blank();
    
    if (options._keepData) {
      log.yellow('💾 User data preserved:');
      log.dim('   • .aiknowsys/sessions/');
      log.dim('   • .aiknowsys/learned/');
      log.blank();
    }
    
    log.cyan('📖 To reinstall:');
    log.white('   npx aiknowsys init');
    log.blank();
    
    return { success: true, filesRemoved: removedFiles.length };
    
  } catch (error) {
    if (spinner) spinner.fail('Uninstall failed');
    log.error(`Error: ${error.message}`);
    throw error;
  }
}

/**
 * Helper: Remove a file if it exists
 */
async function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (_error) {
    return false;
  }
}

/**
 * Helper: Remove a directory if it exists
 */
async function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      await fs.promises.rm(dirPath, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (_error) {
    return false;
  }
}
