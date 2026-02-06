#!/usr/bin/env node
import { Project, SyntaxKind, type SourceFile, type CallExpression, type Identifier } from 'ts-morph';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * AST-Based Migration Script: node:test → Vitest
 * 
 * ONE-TIME USE: Vitest migration (v0.9.0)
 * 
 * This script was used to migrate 47 test files from node:test to Vitest.
 * It's preserved for documentation purposes and potential future migrations.
 * 
 * DO NOT RUN THIS AGAIN - migration is complete!
 * See: .aiknowsys/sessions/2026-02-06-session.md for results
 * 
 * Handles complex cases like nested function calls that regex cannot parse.
 * Uses TypeScript compiler API via ts-morph for accurate transformations.
 */

// Assertion method mapping: node:test → Vitest
type AssertionMapper = (args: string[]) => string;

const ASSERTION_MAP: Record<string, AssertionMapper> = {
  'strictEqual': (args) => {
    const [actual, expected, ...rest] = args;
    return `expect(${actual}).toBe(${expected})`;
  },
  'deepStrictEqual': (args) => {
    const [actual, expected, ...rest] = args;
    return `expect(${actual}).toStrictEqual(${expected})`;
  },
  'equal': (args) => {
    const [actual, expected, ...rest] = args;
    return `expect(${actual}).toEqual(${expected})`;
  },
  'deepEqual': (args) => {
    const [actual, expected, ...rest] = args;
    return `expect(${actual}).toEqual(${expected})`;
  },
  'ok': (args) => {
    const [value, ...rest] = args;
    return `expect(${value}).toBeTruthy()`;
  },
  'match': (args) => {
    const [string, regex, ...rest] = args;
    return `expect(${string}).toMatch(${regex})`;
  },
  'doesNotMatch': (args) => {
    const [string, regex, ...rest] = args;
    return `expect(${string}).not.toMatch(${regex})`;
  },
  'notStrictEqual': (args) => {
    const [actual, expected, ...rest] = args;
    return `expect(${actual}).not.toBe(${expected})`;
  },
  'notEqual': (args) => {
    const [actual, expected, ...rest] = args;
    return `expect(${actual}).not.toEqual(${expected})`;
  },
  'notDeepStrictEqual': (args) => {
    const [actual, expected, ...rest] = args;
    return `expect(${actual}).not.toStrictEqual(${expected})`;
  },
  'throws': (args) => {
    const [fn, error, ...rest] = args;
    if (error) {
      return `expect(${fn}).toThrow(${error})`;
    }
    return `expect(${fn}).toThrow()`;
  },
  'doesNotThrow': (args) => {
    const [fn, ...rest] = args;
    return `expect(${fn}).not.toThrow()`;
  },
  'rejects': (args) => {
    const [promise, error, ...rest] = args;
    if (error) {
      return `await expect(${promise}).rejects.toThrow(${error})`;
    }
    return `await expect(${promise}).rejects.toThrow()`;
  },
  'doesNotReject': (args) => {
    const [promise, ...rest] = args;
    return `await expect(${promise}).resolves.not.toThrow()`;
  },
  'fail': (args) => {
    const [message, ...rest] = args;
    if (message) {
      return `expect.fail(${message})`;
    }
    return 'expect.fail()';
  }
};

/**
 * Migrate a single test file from node:test to Vitest
 */
function migrateFile(sourceFile: SourceFile): boolean {
  let modified = false;

  // Step 1: Update imports
  const importDeclarations = sourceFile.getImportDeclarations();
  
  for (const importDecl of importDeclarations) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    
    // Replace node:test imports
    if (moduleSpecifier === 'node:test') {
      const namedImports = importDecl.getNamedImports().map(ni => ni.getName());
      
      // Map before/after to beforeAll/afterAll (Vitest naming)
      const mappedImports = namedImports.map(name => {
        if (name === 'before') return 'beforeAll';
        if (name === 'after') return 'afterAll';
        return name;
      });
      
      // Add expect (vi is optional, we'll add it only if needed)
      const newImports = [...new Set([...mappedImports, 'expect'])];
      
      importDecl.setModuleSpecifier('vitest');
      importDecl.removeNamedImports();
      
      for (const name of newImports) {
        importDecl.addNamedImport(name);
      }
      
      modified = true;
      console.log('  ✓ Updated import from \'node:test\' to \'vitest\'');
    }
    
    // Remove all node:assert imports (including /strict variant and *)
    if (moduleSpecifier === 'node:assert' || 
        moduleSpecifier === 'node:assert/strict' || 
        moduleSpecifier === 'assert') {
      importDecl.remove();
      modified = true;
      console.log('  ✓ Removed \'node:assert\' import');
    }
  }

  // Step 2: Transform assert.* calls to expect()
  // Collect all replacements first to avoid node invalidation issues
  const replacements: Array<{ node: CallExpression; code: string; property: string }> = [];
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  for (const callExpr of callExpressions) {
    const expression = callExpr.getExpression();
    
    // Check if this is an assert.method() call
    if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expression;
      const object = propAccess.getExpression();
      const property = propAccess.getName();
      
      // Check if object is 'assert' or 'assert.strict'
      const objectText = object.getText();
      if (objectText === 'assert' || objectText === 'assert.strict') {
        const mapper = ASSERTION_MAP[property];
        
        if (mapper) {
          // Get argument expressions as text (preserves nested calls)
          const args = callExpr.getArguments().map(arg => arg.getText());
          
          try {
            const newCode = mapper(args);
            
            // Handle await for rejects
            let finalCode = newCode;
            if (property === 'rejects') {
              // Check if already awaited
              const parent = callExpr.getParent();
              if (parent && parent.getKind() === SyntaxKind.AwaitExpression) {
                // Already awaited, just replace the call
                finalCode = newCode.replace(/^await /, '');
              }
            }
            
            replacements.push({
              node: callExpr,
              code: finalCode,
              property
            });
          } catch (error) {
            console.error(`  ✗ Failed to convert assert.${property}():`, error.message);
          }
        } else {
          console.warn(`  ⚠ Unknown assert method: assert.${property}()`);
        }
      }
    }
  }
  
  // Apply replacements in reverse order (deepest first to avoid invalidation)
  replacements.reverse();
  for (const { node, code, property } of replacements) {
    try {
      node.replaceWithText(code);
      modified = true;
      console.log(`  ✓ Converted assert.${property}() to Vitest expect()`);
    } catch (error) {
      console.error(`  ✗ Failed to replace assert.${property}():`, error.message);
    }
  }

  // Step 3: Rename before/after function calls to beforeAll/afterAll
  const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
  for (const identifier of identifiers) {
    const name = identifier.getText();
    const parent = identifier.getParent();
    
    // Check if this is a CallExpression with 'before' or 'after'
    if (parent && parent.getKind() === SyntaxKind.CallExpression) {
      const callExpr = parent;
      if (callExpr.getExpression() === identifier) {
        if (name === 'before') {
          identifier.replaceWithText('beforeAll');
          modified = true;
          console.log('  ✓ Renamed before() to beforeAll()');
        } else if (name === 'after')        {
          identifier.replaceWithText('afterAll');
          modified = true;
          console.log('  ✓ Renamed after() to afterAll()');
        }
      }
    }
  }

  return modified;
}

/**
 * Find all test files recursively
 */
async function findTestFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively search subdirectories
      files.push(...await findTestFiles(fullPath));
    } else if (entry.isFile() && /\.test\.(ts|js|cjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Main migration function
 */
async function main() {
  const testDir = join(__dirname, '..', 'test');
  
  console.log('🔍 Finding test files...\n');
  const testFiles = await findTestFiles(testDir);
  
  console.log(`Found ${testFiles.length} test files\n`);
  
  // Initialize ts-morph project
  const project = new Project({
    tsConfigFilePath: join(__dirname, '..', 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true
  });

  let totalModified = 0;
  const errors: Array<{ file: string; error: string }> = [];

  for (const filePath of testFiles) {
    console.log(`\n📝 Processing: ${filePath.replace(testDir + '/', '')}`);
    
    try {
      const sourceFile = project.addSourceFileAtPath(filePath);
      const wasModified = migrateFile(sourceFile);
      
      if (wasModified) {
        await sourceFile.save();
        totalModified++;
        console.log('  ✅ Migrated successfully');
      } else {
        console.log('  ⏭️  No changes needed');
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errors.push({ file: filePath, error: error.message });
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('\n✨ Migration Complete!');
  console.log(`   Total files: ${testFiles.length}`);
  console.log(`   Modified: ${totalModified}`);
  console.log(`   Errors: ${errors.length}\n`);

  if (errors.length > 0) {
    console.log('⚠️  Errors encountered:');
    for (const { file, error } of errors) {
      console.log(`   - ${file}: ${error}`);
    }
    console.log();
  }

  console.log('Next steps:');
  console.log('   1. Run: npm test');
  console.log('   2. Review any test failures');
  console.log('   3. Manually fix edge cases if needed\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
