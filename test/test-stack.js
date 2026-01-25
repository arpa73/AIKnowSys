#!/usr/bin/env node

// Simple manual test for stack templates
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testStackTemplate() {
  const testDir = '/tmp/test-stack-' + Date.now();
  
  try {
    console.log(chalk.blue('Testing stack template initialization...'));
    console.log(chalk.gray(`Test directory: ${testDir}\n`));
    
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    
    // Read stack template
    const stackPath = path.join(__dirname, '..', 'templates', 'stacks', 'nextjs', 'CODEBASE_ESSENTIALS.md');
    console.log(chalk.blue('Reading stack template...'));
    const content = await fs.readFile(stackPath, 'utf-8');
    
    // Check content
    if (!content || content.length < 100) {
      throw new Error('Stack template content is empty or too short');
    }
    
    console.log(chalk.green(`✓ Stack template read successfully (${content.length} bytes)`));
    
    // Replace placeholders
    const replacements = {
      PROJECT_NAME: 'test-app',
      PROJECT_DESCRIPTION: 'Test application',
      DATE: '2025-01-25',
      YEAR: '2025'
    };
    
    let processedContent = content;
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, value);
    }
    
    console.log(chalk.green('✓ Placeholders replaced'));
    
    // Write to test directory
    const targetPath = path.join(testDir, 'CODEBASE_ESSENTIALS.md');
    await fs.writeFile(targetPath, processedContent, 'utf-8');
    
    console.log(chalk.green(`✓ File written to ${targetPath}`));
    
    // Verify file
    const writtenContent = await fs.readFile(targetPath, 'utf-8');
    
    if (writtenContent !== processedContent) {
      throw new Error('Written content does not match processed content');
    }
    
    console.log(chalk.green('✓ File verification passed'));
    
    // Check for remaining placeholders
    const remainingPlaceholders = writtenContent.match(/{{[^}]+}}/g);
    if (remainingPlaceholders && remainingPlaceholders.length > 0) {
      console.log(chalk.yellow(`⚠ Found ${remainingPlaceholders.length} unreplaced placeholders: ${remainingPlaceholders.join(', ')}`));
    } else {
      console.log(chalk.green('✓ No unreplaced placeholders'));
    }
    
    // Show preview
    console.log(chalk.blue('\nPreview (first 500 chars):'));
    console.log(chalk.gray(writtenContent.substring(0, 500) + '...'));
    
    console.log(chalk.green.bold('\n✅ Stack template test passed!'));
    console.log(chalk.gray(`Test files in: ${testDir}\n`));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Test failed: ${error.message}\n`));
    console.error(error.stack);
    process.exit(1);
  }
}

testStackTemplate();
