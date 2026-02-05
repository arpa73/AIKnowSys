import { describe, test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { compressEssentials } from '../dist/lib/commands/compress-essentials.js';
import fs from 'fs';
import path from 'path';

/**
 * Test compress-essentials command
 * Phase 3.7: Comprehensive testing for ESSENTIALS compression
 */

describe('compress-essentials command', () => {
  describe('Analysis Mode (--analyze)', () => {
    test('should parse ESSENTIALS into sections correctly', async () => {
      const mockContent = `# Project Knowledge System

## Architecture Patterns

This section describes our patterns.

Some content here.

## API Calls

This section has our API examples.

Code examples go here.

## Validation Matrix

When you change X, run Y.
`;
      
      const mockDir = '/tmp/test-compress';
      const mockEssentials = path.join(mockDir, 'CODEBASE_ESSENTIALS.md');
      
      // Mock fs.existsSync
      const existsSync = mock.method(fs, 'existsSync', () => true);
      
      // Mock fs.readFileSync
      const readFileSync = mock.method(fs, 'readFileSync', () => mockContent);
      
      const result = await compressEssentials({
        dir: mockDir,
        analyze: true,
        _silent: true
      });
      
      // Should have parsed 3 sections
      assert.ok(result.sections, 'Should return sections');
      assert.equal(result.sections.length, 3, 'Should parse 3 sections');
      assert.equal(result.sections[0].name, 'Architecture Patterns');
      assert.equal(result.sections[1].name, 'API Calls');
      assert.equal(result.sections[2].name, 'Validation Matrix');
      
      existsSync.mock.restore();
      readFileSync.mock.restore();
    });
    
    test('should identify verbose sections (>150 lines)', async () => {
      // Create a mock with one verbose section (200 lines)
      const verboseSection = `## Verbose Section with Examples

${'Line of content\n'.repeat(180)}

\`\`\`javascript
// Example code block
const example = 'verbose';
\`\`\`

${'More content\n'.repeat(20)}
`;
      
      const mockContent = `# Project Knowledge System

${verboseSection}

## Small Section

Just a few lines here.
`;
      
      const mockDir = '/tmp/test-compress';
      
      const existsSync = mock.method(fs, 'existsSync', () => true);
      const readFileSync = mock.method(fs, 'readFileSync', () => mockContent);
      
      const result = await compressEssentials({
        dir: mockDir,
        analyze: true,
        _silent: true
      });
      
      // Should identify 1 compression opportunity
      assert.ok(result.opportunities, 'Should return opportunities');
      assert.equal(result.opportunities.length, 1, 'Should find 1 verbose section');
      assert.equal(result.opportunities[0].section, 'Verbose Section with Examples');
      assert.ok(result.opportunities[0].currentLines > 150, 'Should be >150 lines');
      assert.ok(result.opportunities[0].estimatedSavings > 0, 'Should estimate savings');
      
      existsSync.mock.restore();
      readFileSync.mock.restore();
    });
    
    test('should report compression recommendations', async () => {
      const verboseSection = `## API Examples

${'Line of content\n'.repeat(160)}

\`\`\`javascript
// Verbose code example
const api = 'example';
\`\`\`

${'More content\n'.repeat(30)}
`;
      
      const mockContent = `# Project

${verboseSection}
`;
      
      const mockDir = '/tmp/test-compress';
      
      const existsSync = mock.method(fs, 'existsSync', () => true);
      const readFileSync = mock.method(fs, 'readFileSync', () => mockContent);
      
      const result = await compressEssentials({
        dir: mockDir,
        analyze: true,
        _silent: true
      });
      
      // Should recommend extraction
      assert.ok(result.opportunities.length > 0, 'Should find opportunities');
      const opp = result.opportunities[0];
      assert.ok(opp.recommendedAction.includes('Extract to docs/patterns/'), 
        'Should recommend extraction to docs/patterns/');
      assert.ok(opp.estimatedSavings > 50, 'Should estimate significant savings');
      
      existsSync.mock.restore();
      readFileSync.mock.restore();
    });
    
    test('should handle well-sized ESSENTIALS without recommendations', async () => {
      const mockContent = `# Project Knowledge System

## Architecture Patterns

Some patterns here (50 lines total).

${'Content line\n'.repeat(45)}

## API Calls

Some API info (40 lines).

${'Content line\n'.repeat(35)}
`;
      
      const mockDir = '/tmp/test-compress';
      
      const existsSync = mock.method(fs, 'existsSync', () => true);
      const readFileSync = mock.method(fs, 'readFileSync', () => mockContent);
      
      const result = await compressEssentials({
        dir: mockDir,
        analyze: true,
        _silent: true
      });
      
      // Should have no compression opportunities
      assert.equal(result.opportunities.length, 0, 'Should find no opportunities');
      assert.equal(result.potentialSavings, 0, 'Should have zero savings');
      
      existsSync.mock.restore();
      readFileSync.mock.restore();
    });
    
    test('should throw error if ESSENTIALS not found', async () => {
      const mockDir = '/tmp/test-compress';
      
      const existsSync = mock.method(fs, 'existsSync', () => false);
      
      await assert.rejects(
        async () => {
          await compressEssentials({
            dir: mockDir,
            analyze: true,
            _silent: true
          });
        },
        {
          name: 'AIKnowSysError',
          message: 'CODEBASE_ESSENTIALS.md not found'
        }
      );
      
      existsSync.mock.restore();
    });
    
    test('should calculate total potential savings correctly', async () => {
      // Create mock with 2 verbose sections
      const section1 = `## Verbose Section 1

${'Line\n'.repeat(160)}

\`\`\`javascript
const code = 'example';
\`\`\`
`;
      
      const section2 = `## Verbose Section 2

${'Line\n'.repeat(180)}

\`\`\`python
code = 'example'
\`\`\`
`;
      
      const mockContent = `# Project

${section1}

${section2}

## Small Section

Just a bit.
`;
      
      const mockDir = '/tmp/test-compress';
      
      const existsSync = mock.method(fs, 'existsSync', () => true);
      const readFileSync = mock.method(fs, 'readFileSync', () => mockContent);
      
      const result = await compressEssentials({
        dir: mockDir,
        analyze: true,
        _silent: true
      });
      
      // Should find 2 opportunities
      assert.equal(result.opportunities.length, 2, 'Should find 2 verbose sections');
      
      // Total savings should be sum of both
      const expectedSavings = result.opportunities[0].estimatedSavings + 
                             result.opportunities[1].estimatedSavings;
      assert.equal(result.potentialSavings, expectedSavings, 'Should sum savings correctly');
      
      // Should calculate projected size
      const projectedSize = result.totalLines - result.potentialSavings;
      assert.ok(projectedSize > 0, 'Projected size should be positive');
      assert.ok(projectedSize < result.totalLines, 'Projected size should be smaller');
      
      existsSync.mock.restore();
      readFileSync.mock.restore();
    });
  });
  
  // Phase 3.4-3.5: Interactive and Auto modes (coming next)
  describe('Interactive Mode (--interactive)', () => {
    test.skip('should prompt for each extraction', () => {
      // Coming in Phase 3.4
    });
  });
  
  describe('Auto Mode (--auto)', () => {
    test.skip('should extract automatically without prompts', () => {
      // Coming in Phase 3.5
    });
  });
  
  describe('Extraction Logic (Phase 3.3)', () => {
    test('should create docs/patterns directory if not exists', async () => {
      const mockDir = '/tmp/test-extract';
      const patternsDir = path.join(mockDir, 'docs', 'patterns');
      
      const verboseSection = `## API Examples\n\n${'Line\n'.repeat(160)}\`\`\`js\ncode\n\`\`\`\n`;
      const mockContent = `# Project\n\n${verboseSection}\n\n## Small Section\n\nBrief.`;
      
      const existsSync = mock.method(fs, 'existsSync', (p) => {
        if (p.includes('CODEBASE_ESSENTIALS.md')) return true;
        if (p.includes('docs/patterns')) return false;  // Directory doesn't exist yet
        return false;
      });
      
      const readFileSync = mock.method(fs, 'readFileSync', () => mockContent);
      const mkdirSync = mock.method(fs, 'mkdirSync', () => {});
      const writeFileSync = mock.method(fs, 'writeFileSync', () => {});
      
      await compressEssentials({
        dir: mockDir,
        auto: true,  // Auto mode for extraction
        _silent: true
      });
      
      // Should have created directory with recursive flag
      assert.ok(mkdirSync.mock.calls.length > 0, 'Should call mkdirSync');
      const mkdirCall = mkdirSync.mock.calls.find(call => call.arguments[0].includes('patterns'));
      assert.ok(mkdirCall, 'Should create patterns directory');
      assert.deepEqual(mkdirCall.arguments[1], { recursive: true }, 'Should use recursive option');
      
      existsSync.mock.restore();
      readFileSync.mock.restore();
      mkdirSync.mock.restore();
      writeFileSync.mock.restore();
    });
    
    test('should extract verbose section to separate file', async () => {
      const mockDir = '/tmp/test-extract';
      const sectionContent = 'Line 1\nLine 2\nLine 3\n```javascript\nconst example = \'code\';\n```\nMore content';
      const verboseSection = `## API Examples\n\n${sectionContent}${'Line\n'.repeat(150)}`;
      const mockContent = `# Project\n\n${verboseSection}\n\n## Small Section\n\nBrief.`;
      
      const existsSync = mock.method(fs, 'existsSync', () => true);
      const readFileSync = mock.method(fs, 'readFileSync', () => mockContent);
      const mkdirSync = mock.method(fs, 'mkdirSync', () => {});
      const writeFileSync = mock.method(fs, 'writeFileSync', () => {});
      
      await compressEssentials({
        dir: mockDir,
        auto: true,
        _silent: true
      });
      
      // Should write extracted content to docs/patterns/
      assert.ok(writeFileSync.mock.calls.length >= 2, 'Should write at least 2 files (extracted + updated ESSENTIALS)');
      
      const extractedFileCall = writeFileSync.mock.calls.find(call => 
        call.arguments[0].includes('docs/patterns/api-examples.md')
      );
      assert.ok(extractedFileCall, 'Should write to docs/patterns/api-examples.md');
      
      // Extracted file should contain section content
      const extractedContent = extractedFileCall.arguments[1];
      assert.ok(extractedContent.includes('API Examples'), 'Should include section name as header');
      assert.ok(extractedContent.includes('const example'), 'Should preserve code blocks');
      
      existsSync.mock.restore();
      readFileSync.mock.restore();
      mkdirSync.mock.restore();
      writeFileSync.mock.restore();
    });
    
    test('should replace verbose section with summary and link', async () => {
      const mockDir = '/tmp/test-extract';
      const verboseSection = `## API Examples\n\nVerbose content...\n${'Line\n'.repeat(160)}\`\`\`js\ncode\n\`\`\`\n`;
      const mockContent = `# Project\n\n${verboseSection}\n\n## Small Section\n\nBrief.`;
      
      const existsSync = mock.method(fs, 'existsSync', () => true);
      const readFileSync = mock.method(fs, 'readFileSync', () => mockContent);
      const mkdirSync = mock.method(fs, 'mkdirSync', () => {});
      const writeFileSync = mock.method(fs, 'writeFileSync', () => {});
      
      await compressEssentials({
        dir: mockDir,
        auto: true,
        _silent: true
      });
      
      // Should write updated ESSENTIALS
      const essentialsCall = writeFileSync.mock.calls.find(call => 
        call.arguments[0].includes('CODEBASE_ESSENTIALS.md')
      );
      assert.ok(essentialsCall, 'Should update ESSENTIALS file');
      
      const updatedContent = essentialsCall.arguments[1];
      
      // Should have summary
      assert.ok(updatedContent.includes('API Examples'), 'Should keep section header');
      assert.ok(!updatedContent.includes('Line\nLine\nLine'), 'Should remove verbose content');
      
      // Should have link to extracted file
      assert.ok(
        updatedContent.includes('docs/patterns/api-examples.md') || 
        updatedContent.includes('[details](docs/patterns/api-examples.md)') ||
        updatedContent.includes('[See details]'),
        'Should link to extracted file'
      );
      
      // Should still have other sections
      assert.ok(updatedContent.includes('Small Section'), 'Should preserve other sections');
      
      existsSync.mock.restore();
      readFileSync.mock.restore();
      mkdirSync.mock.restore();
      writeFileSync.mock.restore();
    });
    
    test('should preserve all content (nothing deleted)', async () => {
      const mockDir = '/tmp/test-extract';
      const uniqueMarker = 'UNIQUE_CONTENT_MARKER_12345';
      const verboseSection = `## API Examples\n\n${uniqueMarker}\n${'Line\n'.repeat(160)}\`\`\`js\ncode\n\`\`\`\n`;
      const mockContent = `# Project\n\n${verboseSection}\n\n## Small Section\n\nBrief.`;
      
      const existsSync = mock.method(fs, 'existsSync', () => true);
      const readFileSync = mock.method(fs, 'readFileSync', () => mockContent);
      const mkdirSync = mock.method(fs, 'mkdirSync', () => {});
      const writeFileSync = mock.method(fs, 'writeFileSync', () => {});
      
      await compressEssentials({
        dir: mockDir,
        auto: true,
        _silent: true
      });
      
      // Find extracted file content
      const extractedFileCall = writeFileSync.mock.calls.find(call => 
        call.arguments[0].includes('docs/patterns/')
      );
      
      assert.ok(extractedFileCall, 'Should extract content');
      
      // Unique marker should be in extracted file (not lost)
      const extractedContent = extractedFileCall.arguments[1];
      assert.ok(extractedContent.includes(uniqueMarker), 'Should preserve all original content in extracted file');
      
      existsSync.mock.restore();
      readFileSync.mock.restore();
      mkdirSync.mock.restore();
      writeFileSync.mock.restore();
    });
    
    test('should handle multiple sections extraction', async () => {
      const mockDir = '/tmp/test-extract';
      const section1 = `## API Examples\n\n${'Line\n'.repeat(160)}\`\`\`js\napi\n\`\`\`\n`;
      const section2 = `## Testing Patterns\n\n${'Line\n'.repeat(180)}\`\`\`js\ntest\n\`\`\`\n`;
      const mockContent = `# Project\n\n${section1}\n\n${section2}\n\n## Small\n\nBrief.`;
      
      const existsSync = mock.method(fs, 'existsSync', () => true);
      const readFileSync = mock.method(fs, 'readFileSync', () => mockContent);
      const mkdirSync = mock.method(fs, 'mkdirSync', () => {});
      const writeFileSync = mock.method(fs, 'writeFileSync', () => {});
      
      await compressEssentials({
        dir: mockDir,
        auto: true,
        _silent: true
      });
      
      // Should extract both sections
      const apiCall = writeFileSync.mock.calls.find(call => call.arguments[0].includes('api-examples.md'));
      const testCall = writeFileSync.mock.calls.find(call => call.arguments[0].includes('testing-patterns.md'));
      
      assert.ok(apiCall, 'Should extract API examples');
      assert.ok(testCall, 'Should extract Testing patterns');
      
      // Verify updated ESSENTIALS contains both summaries
      const essentialsCall = writeFileSync.mock.calls.find(call => 
        call.arguments[0].includes('CODEBASE_ESSENTIALS.md')
      );
      assert.ok(essentialsCall, 'Should update ESSENTIALS file');
      
      const updatedContent = essentialsCall.arguments[1];
      
      // Both sections should have links
      assert.ok(updatedContent.includes('docs/patterns/api-examples.md'), 
        'Should link to API examples');
      assert.ok(updatedContent.includes('docs/patterns/testing-patterns.md'), 
        'Should link to Testing patterns');
      
      // Verbose content should be removed from both sections
      const lineCount = (updatedContent.match(/Line\n/g) || []).length;
      assert.ok(lineCount < 10, 'Should remove verbose content from both sections');
      
      // Both should be separate files
      assert.notEqual(apiCall.arguments[0], testCall.arguments[0], 'Should create separate files');
      
      existsSync.mock.restore();
      readFileSync.mock.restore();
      mkdirSync.mock.restore();
      writeFileSync.mock.restore();
    });
    
    test('should not extract well-sized sections', async () => {
      const mockDir = '/tmp/test-extract';
      const mockContent = '# Project\n\n## Small Section 1\n\nJust a bit.\n\n## Small Section 2\n\nAlso brief.';
      
      const existsSync = mock.method(fs, 'existsSync', () => true);
      const readFileSync = mock.method(fs, 'readFileSync', () => mockContent);
      const mkdirSync = mock.method(fs, 'mkdirSync', () => {});
      const writeFileSync = mock.method(fs, 'writeFileSync', () => {});
      
      await compressEssentials({
        dir: mockDir,
        auto: true,
        _silent: true
      });
      
      // Should not extract anything (no docs/patterns/ writes)
      const extractCalls = writeFileSync.mock.calls.filter(call => 
        call.arguments[0].includes('docs/patterns/')
      );
      assert.equal(extractCalls.length, 0, 'Should not extract well-sized sections');
      
      existsSync.mock.restore();
      readFileSync.mock.restore();
      mkdirSync.mock.restore();
      writeFileSync.mock.restore();
    });
  });
});
