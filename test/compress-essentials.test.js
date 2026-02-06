import { describe, test, afterEach, expect, vi } from 'vitest';
import path from 'path';

/**
 * Test compress-essentials command
 * Phase 3.7: Comprehensive testing for ESSENTIALS compression
 * 
 * Using Vitest mocking (vi.mock) for filesystem operations
 */

// Mock the fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn()
}));

// Import after mocking
const { compressEssentials } = await import('../dist/lib/commands/compress-essentials.js');
const fs = await import('node:fs');

describe('compress-essentials command', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  
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
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(mockContent);
      
      const result = await compressEssentials({
        dir: mockDir,
        analyze: true,
        _silent: true
      });
      
      // Should have parsed 3 sections
      expect(result.sections).toBeTruthy();
      expect(result.sections.length).toEqual(3);
      expect(result.sections[0].name).toEqual('Architecture Patterns');
      expect(result.sections[1].name).toEqual('API Calls');
      expect(result.sections[2].name).toEqual('Validation Matrix');
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
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(mockContent);
      
      const result = await compressEssentials({
        dir: mockDir,
        analyze: true,
        _silent: true
      });
      
      // Should identify 1 compression opportunity
      expect(result.opportunities).toBeTruthy();
      expect(result.opportunities.length).toEqual(1);
      expect(result.opportunities[0].section).toEqual('Verbose Section with Examples');
      expect(result.opportunities[0].currentLines > 150).toBeTruthy();
      expect(result.opportunities[0].estimatedSavings > 0).toBeTruthy();
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
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(mockContent);
      
      const result = await compressEssentials({
        dir: mockDir,
        analyze: true,
        _silent: true
      });
      
      // Should recommend extraction
      expect(result.opportunities.length > 0).toBeTruthy();
      const opp = result.opportunities[0];
      expect(opp.recommendedAction.includes('Extract to docs/patterns/')).toBeTruthy();
      expect(opp.estimatedSavings > 50).toBeTruthy();
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
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(mockContent);
      
      const result = await compressEssentials({
        dir: mockDir,
        analyze: true,
        _silent: true
      });
      
      // Should have no compression opportunities
      expect(result.opportunities.length).toEqual(0);
      expect(result.potentialSavings).toEqual(0);
    });
    
    test('should throw error if ESSENTIALS not found', async () => {
      const mockDir = '/tmp/test-compress';
      
      fs.existsSync.mockReturnValue(false);
      
      await expect(async () => {
        await compressEssentials({
          dir: mockDir,
          analyze: true,
          _silent: true
        });
      }).rejects.toThrow(/CODEBASE_ESSENTIALS\.md not found/);
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
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(mockContent);
      
      const result = await compressEssentials({
        dir: mockDir,
        analyze: true,
        _silent: true
      });
      
      // Should find 2 opportunities
      expect(result.opportunities.length).toEqual(2);
      
      // Total savings should be sum of both
      const expectedSavings = result.opportunities[0].estimatedSavings + 
                             result.opportunities[1].estimatedSavings;
      expect(result.potentialSavings).toEqual(expectedSavings);
      
      // Should calculate projected size
      const projectedSize = result.totalLines - result.potentialSavings;
      expect(projectedSize > 0).toBeTruthy();
      expect(projectedSize < result.totalLines).toBeTruthy();
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
      
      const verboseSection = `## API Examples\n\n${'Line\n'.repeat(160)}\`\`\`js\ncode\n\`\`\`\n`;
      const mockContent = `# Project\n\n${verboseSection}\n\n## Small Section\n\nBrief.`;
      
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('CODEBASE_ESSENTIALS.md')) return true;
        if (p.includes('docs/patterns')) return false;  // Directory doesn't exist yet
        return false;
      });
      
      fs.readFileSync.mockReturnValue(mockContent);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});
      
      await compressEssentials({
        dir: mockDir,
        auto: true,  // Auto mode for extraction
        _silent: true
      });
      
      // Should have created directory with recursive flag
      expect(fs.mkdirSync).toHaveBeenCalled();
      const mkdirCall = fs.mkdirSync.mock.calls.find(call => call[0].includes('patterns'));
      expect(mkdirCall).toBeTruthy();
      expect(mkdirCall[1]).toEqual({ recursive: true });
    });
    
    test('should extract verbose section to separate file', async () => {
      const mockDir = '/tmp/test-extract';
      const sectionContent = 'Line 1\nLine 2\nLine 3\n```javascript\nconst example = \'code\';\n```\nMore content';
      const verboseSection = `## API Examples\n\n${sectionContent}${'Line\n'.repeat(150)}`;
      const mockContent = `# Project\n\n${verboseSection}\n\n## Small Section\n\nBrief.`;
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(mockContent);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});
      
      await compressEssentials({
        dir: mockDir,
        auto: true,
        _silent: true
      });
      
      // Should write extracted content to docs/patterns/
      expect(fs.writeFileSync.mock.calls.length >= 2).toBeTruthy();
      
      const extractedFileCall = fs.writeFileSync.mock.calls.find(call => 
        call[0].includes('docs/patterns/api-examples.md')
      );
      expect(extractedFileCall).toBeTruthy();
      
      // Extracted file should contain section content
      const extractedContent = extractedFileCall[1];
      expect(extractedContent.includes('API Examples')).toBeTruthy();
      expect(extractedContent.includes('const example')).toBeTruthy();
    });
    
    test('should replace verbose section with summary and link', async () => {
      const mockDir = '/tmp/test-extract';
      const verboseSection = `## API Examples\n\nVerbose content...\n${'Line\n'.repeat(160)}\`\`\`js\ncode\n\`\`\`\n`;
      const mockContent = `# Project\n\n${verboseSection}\n\n## Small Section\n\nBrief.`;
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(mockContent);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});
      
      await compressEssentials({
        dir: mockDir,
        auto: true,
        _silent: true
      });
      
      // Should write updated ESSENTIALS
      const essentialsCall = fs.writeFileSync.mock.calls.find(call => 
        call[0].includes('CODEBASE_ESSENTIALS.md')
      );
      expect(essentialsCall).toBeTruthy();
      
      const updatedContent = essentialsCall[1];
      
      // Should have summary
      expect(updatedContent.includes('API Examples')).toBeTruthy();
      expect(!updatedContent.includes('Line\nLine\nLine')).toBeTruthy();
      
      // Should have link to extracted file
      expect(updatedContent.includes('docs/patterns/api-examples.md') || 
                updatedContent.includes('[details](docs/patterns/api-examples.md)') ||
                updatedContent.includes('[See details]')).toBeTruthy();
      
      // Should still have other sections
      expect(updatedContent.includes('Small Section')).toBeTruthy();
    });
    
    test('should preserve all content (nothing deleted)', async () => {
      const mockDir = '/tmp/test-extract';
      const uniqueMarker = 'UNIQUE_CONTENT_MARKER_12345';
      const verboseSection = `## API Examples\n\n${uniqueMarker}\n${'Line\n'.repeat(160)}\`\`\`js\ncode\n\`\`\`\n`;
      const mockContent = `# Project\n\n${verboseSection}\n\n## Small Section\n\nBrief.`;
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(mockContent);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});
      
      await compressEssentials({
        dir: mockDir,
        auto: true,
        _silent: true
      });
      
      // Find extracted file content
      const extractedFileCall = fs.writeFileSync.mock.calls.find(call => 
        call[0].includes('docs/patterns/')
      );
      
      expect(extractedFileCall).toBeTruthy();
      
      // Unique marker should be in extracted file (not lost)
      const extractedContent = extractedFileCall[1];
      expect(extractedContent.includes(uniqueMarker)).toBeTruthy();
    });
    
    test('should handle multiple sections extraction', async () => {
      const mockDir = '/tmp/test-extract';
      const section1 = `## API Examples\n\n${'Line\n'.repeat(160)}\`\`\`js\napi\n\`\`\`\n`;
      const section2 = `## Testing Patterns\n\n${'Line\n'.repeat(180)}\`\`\`js\ntest\n\`\`\`\n`;
      const mockContent = `# Project\n\n${section1}\n\n${section2}\n\n## Small\n\nBrief.`;
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(mockContent);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});
      
      await compressEssentials({
        dir: mockDir,
        auto: true,
        _silent: true
      });
      
      // Should extract both sections
      const apiCall = fs.writeFileSync.mock.calls.find(call => call[0].includes('api-examples.md'));
      const testCall = fs.writeFileSync.mock.calls.find(call => call[0].includes('testing-patterns.md'));
      
      expect(apiCall).toBeTruthy();
      expect(testCall).toBeTruthy();
      
      // Verify updated ESSENTIALS contains both summaries
      const essentialsCall = fs.writeFileSync.mock.calls.find(call => 
        call[0].includes('CODEBASE_ESSENTIALS.md')
      );
      expect(essentialsCall).toBeTruthy();
      
      const updatedContent = essentialsCall[1];
      
      // Both sections should have links
      expect(updatedContent.includes('docs/patterns/api-examples.md')).toBeTruthy();
      expect(updatedContent.includes('docs/patterns/testing-patterns.md')).toBeTruthy();
      
      // Verbose content should be removed from both sections
      const lineCount = (updatedContent.match(/Line\n/g) || []).length;
      expect(lineCount < 10).toBeTruthy();
      
      // Both should be separate files
      expect(apiCall[0]).not.toEqual(testCall[0]);
    });
    
    test('should not extract well-sized sections', async () => {
      const mockDir = '/tmp/test-extract';
      const mockContent = '# Project\n\n## Small Section 1\n\nJust a bit.\n\n## Small Section 2\n\nAlso brief.';
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(mockContent);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});
      
      await compressEssentials({
        dir: mockDir,
        auto: true,
        _silent: true
      });
      
      // Should not extract anything (no docs/patterns/ writes)
      const extractCalls = fs.writeFileSync.mock.calls.filter(call => 
        call[0].includes('docs/patterns/')
      );
      expect(extractCalls.length).toEqual(0);
    });
  });
});

