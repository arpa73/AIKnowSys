import fs from 'fs';
import path from 'path';
import { createLogger } from '../logger.js';
import { ErrorTemplates } from '../error-helpers.js';
import { parseEssentialsSections, COMPRESSION_THRESHOLDS } from '../parse-essentials.js';

/**
 * Compress ESSENTIALS command - Reduces bloat by extracting verbose content
 * Extracts detailed examples to docs/patterns/ while keeping core patterns in ESSENTIALS
 */
export async function compressEssentials(options) {
  const targetDir = path.resolve(options.dir);
  const essentialsFile = options.essentials || 'CODEBASE_ESSENTIALS.md';
  const silent = options._silent || false;
  const log = createLogger(silent);
  
  const essentialsPath = path.join(targetDir, essentialsFile);
  
  log.blank();
  log.header('ESSENTIALS Compression Tool', '🗜️');
  log.blank();
  
  // Check if ESSENTIALS exists
  if (!fs.existsSync(essentialsPath)) {
    log.error(`${essentialsFile} not found in ${targetDir}`);
    throw ErrorTemplates.fileNotFound(essentialsFile);
  }
  
  // Read and parse ESSENTIALS
  const content = fs.readFileSync(essentialsPath, 'utf-8');
  const lines = content.split('\n');
  const totalLines = lines.length;
  
  log.white(`📊 Analyzing ${essentialsFile} (${totalLines} lines)...`);
  log.blank();
  
  // Parse sections
  const sections = parseEssentialsSections(content);
  
  // Analyze mode - just report findings
  if (options.analyze) {
    const result = analyzeForCompression(sections, totalLines, log, silent);
    // Include sections in result for testing
    return { ...result, sections };
  }
  
  // Auto mode - extract automatically
  if (options.auto) {
    return await performExtraction(sections, content, essentialsPath, targetDir, log, silent, true);
  }
  
  // Interactive mode would go here (Phase 3.4)
  log.warn('Interactive mode coming in Phase 3.4');
  log.blank();
  
  return { sections, totalLines };
}

/**
 * Analyze ESSENTIALS and report compression opportunities
 * This is the --analyze mode (dry-run)
 */
function analyzeForCompression(sections, totalLines, log, _silent) {
  const opportunities = [];
  
  // Find verbose sections using configured threshold
  sections.forEach(section => {
    if (section.lines > COMPRESSION_THRESHOLDS.SECTION_VERBOSE) {
      // Detect if it has code blocks
      const codeBlockCount = (section.content.match(/```/g) || []).length / 2;
      const hasVerboseExamples = codeBlockCount > 0 && section.lines > COMPRESSION_THRESHOLDS.SECTION_CODE_BLOCK;
      
      const opportunity = {
        type: 'verbose_section',
        section: section.name,
        startLine: section.startLine,
        endLine: section.endLine,
        currentLines: section.lines,
        recommendedAction: hasVerboseExamples 
          ? `Extract to docs/patterns/${section.name.toLowerCase().replace(/\s+/g, '-')}.md`
          : 'Consider breaking into subsections',
        estimatedSavings: hasVerboseExamples 
          ? Math.floor(section.lines * COMPRESSION_THRESHOLDS.VERBOSE_SAVINGS_PCT) 
          : Math.floor(section.lines * COMPRESSION_THRESHOLDS.DEFAULT_SAVINGS_PCT)
      };
      
      opportunities.push(opportunity);
    }
  });
  
  // Display findings
  if (opportunities.length === 0) {
    log.success('✓ No compression needed - ESSENTIALS is well-sized');
    log.blank();
    return { opportunities: [], totalLines, potentialSavings: 0 };
  }
  
  log.white(`Found ${opportunities.length} compression opportunit${opportunities.length === 1 ? 'y' : 'ies'}:`);
  log.blank();
  
  let totalSavings = 0;
  opportunities.forEach((opp, index) => {
    log.white(`${index + 1}. Section "${opp.section}" (line ${opp.startLine}-${opp.endLine})`);
    log.dim(`   - ${opp.currentLines} lines`);
    log.dim(`   - Recommend: ${opp.recommendedAction}`);
    log.dim(`   - Savings: ~${opp.estimatedSavings} lines`);
    log.blank();
    totalSavings += opp.estimatedSavings;
  });
  
  const projectedLines = totalLines - totalSavings;
  log.cyan(`💡 Total potential reduction: ${totalSavings} lines (${totalLines} → ${projectedLines})`);
  log.blank();
  log.white('Run with --interactive to compress, or --auto for automatic compression.');
  log.blank();
  
  return { opportunities, totalLines, potentialSavings: totalSavings };
}

/**
 * Perform extraction of verbose sections
 * @param {Array} sections - Parsed sections from ESSENTIALS
 * @param {string} originalContent - Full ESSENTIALS content
 * @param {string} essentialsPath - Path to ESSENTIALS file
 * @param {string} targetDir - Target directory
 * @param {Object} log - Logger instance
 * @param {boolean} silent - Silent mode flag
 * @param {boolean} autoMode - Whether in auto mode (no prompts)
 * @returns {Object} Extraction results
 */
async function performExtraction(sections, originalContent, essentialsPath, targetDir, log, silent, _autoMode) {
  const patternsDir = path.join(targetDir, 'docs', 'patterns');
  const extracted = [];
  
  // Create docs/patterns directory if it doesn't exist
  if (!fs.existsSync(patternsDir)) {
    fs.mkdirSync(patternsDir, { recursive: true });
    if (!silent) log.success(`Created ${patternsDir}`);
  }
  
  // Find sections to extract (verbose sections with code blocks)
  const sectionsToExtract = findVerboseSections(sections);
  
  if (sectionsToExtract.length === 0) {
    if (!silent) {
      log.success('✓ No sections need extraction');
      log.blank();
    }
    return { extracted: [], totalLines: originalContent.split('\n').length };
  }
  
  // Extract each verbose section using position-based replacement
  const lines = originalContent.split('\n');
  const replacements = [];
  
  for (const section of sectionsToExtract) {
    const fileName = createFileName(section.name);
    const filePath = path.join(patternsDir, fileName);
    const relativePath = `docs/patterns/${fileName}`;
    
    // Create extracted file with full section content
    const extractedContent = `# ${section.name}\n\n${section.content.replace(/^##\s+.*\n\n/, '')}`;
    fs.writeFileSync(filePath, extractedContent, 'utf-8');
    
    // Create summary replacement
    const summary = createSummary(section, relativePath);
    
    // Store replacement for position-based processing
    replacements.push({
      startLine: section.startLine,
      endLine: section.endLine,
      summary: summary
    });
    
    extracted.push({
      section: section.name,
      file: relativePath,
      originalLines: section.lines,
      extractedLines: extractedContent.split('\n').length
    });
    
    if (!silent) {
      log.success(`✓ Extracted "${section.name}" to ${relativePath}`);
    }
  }
  
  // Apply all replacements using position-based approach (most robust)
  // Process in reverse order to maintain line number accuracy
  replacements.sort((a, b) => b.startLine - a.startLine);
  let updatedContent = lines;
  
  for (const replacement of replacements) {
    const before = updatedContent.slice(0, replacement.startLine);
    const after = updatedContent.slice(replacement.endLine + 1);
    const summaryLines = replacement.summary.split('\n');
    updatedContent = [...before, ...summaryLines, ...after];
  }
  
  updatedContent = updatedContent.join('\n');
  
  // Write updated ESSENTIALS
  fs.writeFileSync(essentialsPath, updatedContent, 'utf-8');
  
  // Calculate and report results
  const newTotalLines = updatedContent.split('\n').length;
  const savedLines = originalContent.split('\n').length - newTotalLines;
  
  if (!silent) {
    log.blank();
    log.cyan('📦 Extraction complete:');
    log.white(`   - Extracted ${extracted.length} section${extracted.length === 1 ? '' : 's'}`);
    log.white(`   - Saved ${savedLines} lines`);
    log.white(`   - ESSENTIALS: ${originalContent.split('\n').length} → ${newTotalLines} lines`);
    log.blank();
  }
  
  return { extracted, extractedCount: extracted.length, savedLines, totalLines: newTotalLines };
}

/**
 * Find sections that are verbose enough to warrant extraction
 * @param {Array} sections - Parsed sections
 * @returns {Array} Sections to extract
 */
function findVerboseSections(sections) {
  return sections.filter(section => {
    if (section.lines <= COMPRESSION_THRESHOLDS.SECTION_VERBOSE) return false;
    
    // Check if it has code blocks (verbose examples worth extracting)
    const codeBlockCount = (section.content.match(/```/g) || []).length / 2;
    return codeBlockCount > 0 && section.lines > COMPRESSION_THRESHOLDS.SECTION_CODE_BLOCK;
  });
}

/**
 * Create a filename from a section name
 * @param {string} sectionName - Name of the section
 * @returns {string} Lowercase kebab-case filename
 */
function createFileName(sectionName) {
  return sectionName.toLowerCase().replace(/\s+/g, '-') + '.md';
}

/**
 * Create a brief summary to replace extracted section
 * @param {Object} section - Section object
 * @param {string} relativePath - Relative path to extracted file
 * @returns {string} Summary replacement text
 */
function createSummary(section, relativePath) {
  // Keep the section header
  const header = `## ${section.name}`;
  
  // Extract first paragraph (before first code block) as natural summary
  const contentBeforeCode = section.content.split('```')[0]; // Content before first code block
  const paragraphLines = contentBeforeCode
    .split('\n')
    .slice(1) // Skip the header line
    .filter(line => line.trim()) // Remove empty lines
    .slice(0, 3); // Take first 3 non-empty lines
  
  const firstParagraph = paragraphLines.join(' ').trim();
  
  // Use extracted paragraph or fallback to generic
  const summary = firstParagraph || `Brief overview of ${section.name.toLowerCase()} patterns.`;
  
  // Add link to detailed documentation
  const link = `\n\n**[See detailed ${section.name.toLowerCase()} documentation →](${relativePath})**`;
  
  return `${header}\n\n${summary}${link}\n`;
}
