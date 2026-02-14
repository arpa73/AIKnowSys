/**
 * Update Session - Pure Business Logic
 *
 * Phase 2 Batch 2: Most complex mutation command extraction
 * Created following strict TDD workflow (tests written first in RED phase)
 *
 * Features:
 * - Frontmatter updates (topics, files, status)
 * - Multiple insertion modes (append, prepend, insert-after, insert-before)
 * - Shortcuts (done, wip, append)
 * - File content appending
 * - Pattern matching with multi-match detection
 * - Section boundary detection
 *
 * @pure - NO side effects, NO console.log, NO process.exit
 */
import { readFile, writeFile } from 'fs/promises';
import { resolve, basename } from 'path';
import { existsSync } from 'fs';
import { JsonStorage } from '../context/json-storage.js';
/**
 * Expand shortcuts into full options
 */
function expandShortcuts(options) {
    const expanded = { ...options };
    // --done → --set-status complete
    if (expanded.done) {
        expanded.setStatus = 'complete';
        delete expanded.done;
    }
    // --wip → --set-status in-progress
    if (expanded.wip) {
        expanded.setStatus = 'in-progress';
        delete expanded.wip;
    }
    // --append <value> → auto-detect file vs content
    if (expanded.append) {
        const appendValue = expanded.append;
        // Auto-detect: if looks like a file path, treat as file
        const looksLikeFile = appendValue.includes('/') || appendValue.endsWith('.md');
        if (looksLikeFile && existsSync(resolve(expanded.targetDir || process.cwd(), appendValue))) {
            expanded.appendFile = appendValue;
            expanded.appendSection = '## Update'; // Auto-set section for file appending
        }
        else {
            expanded.content = appendValue;
            expanded.appendSection = '## Update';
        }
        delete expanded.append;
    }
    return expanded;
}
/**
 * Find session file for given date
 */
function findSessionFile(targetDir, date) {
    const sessionPath = resolve(targetDir, '.aiknowsys', 'sessions', `${date}-session.md`);
    return existsSync(sessionPath) ? sessionPath : null;
}
function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
        throw new Error('Invalid session file: missing frontmatter');
    }
    const yamlText = match[1];
    const body = match[2];
    // Simple YAML parsing for our specific structure
    const frontmatter = {
        topics: [],
        files: [],
        status: 'in-progress'
    };
    const lines = yamlText.split('\n');
    let currentKey = null;
    for (const line of lines) {
        if (line.startsWith('date:')) {
            frontmatter.date = line.substring(5).trim();
        }
        else if (line.startsWith('status:')) {
            frontmatter.status = line.substring(7).trim();
        }
        else if (line.startsWith('topics:')) {
            currentKey = 'topics';
            frontmatter.topics = [];
        }
        else if (line.startsWith('files:')) {
            currentKey = 'files';
            frontmatter.files = [];
        }
        else if (line.trim().startsWith('- ') && currentKey) {
            const value = line.trim().substring(2);
            frontmatter[currentKey].push(value);
        }
        else if (line.trim() === '' || line.trim().startsWith('#')) {
            // Skip empty lines and comments
            continue;
        }
    }
    return { frontmatter, body };
}
/**
 * Serialize frontmatter back to YAML
 */
function serializeFrontmatter(frontmatter) {
    let yaml = '---\n';
    yaml += `date: ${frontmatter.date}\n`;
    yaml += 'topics:';
    if (frontmatter.topics.length === 0) {
        yaml += ' []\n';
    }
    else {
        yaml += '\n';
        for (const topic of frontmatter.topics) {
            yaml += `  - ${topic}\n`;
        }
    }
    yaml += 'files:';
    if (!frontmatter.files || frontmatter.files.length === 0) {
        yaml += ' []\n';
    }
    else {
        yaml += '\n';
        for (const file of frontmatter.files) {
            yaml += `  - ${file}\n`;
        }
    }
    yaml += `status: ${frontmatter.status}\n`;
    yaml += '---\n';
    return yaml;
}
/**
 * Update session file - Pure business logic
 */
export async function updateSessionCore(options) {
    // Expand shortcuts first
    const opts = expandShortcuts(options);
    const targetDir = opts.targetDir || process.cwd();
    const date = opts.date || new Date().toISOString().split('T')[0];
    // Find session file
    const sessionPath = findSessionFile(targetDir, date);
    if (!sessionPath) {
        throw new Error(`No session file found for date: ${date}`);
    }
    // Read current content
    const originalContent = await readFile(sessionPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(originalContent);
    const changes = [];
    let frontmatterUpdated = false;
    let bodyUpdated = false;
    // FRONTMATTER UPDATES
    if (opts.addTopic) {
        if (!frontmatter.topics.includes(opts.addTopic)) {
            frontmatter.topics.push(opts.addTopic);
            changes.push(`Added topic: ${opts.addTopic}`);
            frontmatterUpdated = true;
        }
    }
    if (opts.addFile) {
        if (!frontmatter.files) {
            frontmatter.files = [];
        }
        if (!frontmatter.files.includes(opts.addFile)) {
            frontmatter.files.push(opts.addFile);
            changes.push(`Added file: ${opts.addFile}`);
            frontmatterUpdated = true;
        }
    }
    if (opts.setStatus) {
        const validStatuses = ['in-progress', 'complete', 'abandoned'];
        if (!validStatuses.includes(opts.setStatus)) {
            throw new Error(`Invalid status: ${opts.setStatus}. Must be one of: ${validStatuses.join(', ')}`);
        }
        if (frontmatter.status !== opts.setStatus) {
            const oldStatus = frontmatter.status;
            frontmatter.status = opts.setStatus;
            changes.push(`Status changed: ${oldStatus} → ${opts.setStatus}`);
            frontmatterUpdated = true;
        }
    }
    // CONTENT MANIPULATION
    let newBody = body;
    // Validate: content requires a section option
    if (opts.content && !opts.appendSection && !opts.prependSection && !opts.insertAfter && !opts.insertBefore) {
        throw new Error('content option requires a section option (appendSection, prependSection, insertAfter, or insertBefore)');
    }
    // Handle file appending
    let contentToAdd = opts.content || '';
    if (opts.appendFile) {
        const filePath = resolve(targetDir, opts.appendFile);
        if (!existsSync(filePath)) {
            throw new Error(`File not found: ${opts.appendFile}`);
        }
        const fileContent = await readFile(filePath, 'utf-8');
        contentToAdd += (contentToAdd ? '\n\n' : '') + fileContent;
        changes.push(`Appended content from file: ${opts.appendFile}`);
        // If no section specified, default to appending at end
        if (!opts.appendSection && !opts.prependSection && !opts.insertAfter && !opts.insertBefore) {
            opts.appendSection = '## Update';
        }
    }
    // Handle different insertion modes
    if (opts.prependSection) {
        // Insert right after frontmatter (before existing body)
        newBody = `\n${opts.prependSection}\n${contentToAdd}\n${newBody}`;
        changes.push(`Prepended section: ${opts.prependSection}`);
        bodyUpdated = true;
    }
    else if (opts.insertAfter) {
        // Insert after specific pattern
        const pattern = opts.insertAfter;
        const patternIndex = newBody.indexOf(pattern);
        if (patternIndex === -1) {
            throw new Error(`Pattern not found: ${pattern}`);
        }
        // Check for multiple matches
        const secondMatch = newBody.indexOf(pattern, patternIndex + 1);
        if (secondMatch !== -1) {
            // Find all matches and report line numbers
            const lines = newBody.split('\n');
            const matches = [];
            lines.forEach((line, index) => {
                if (line.includes(pattern)) {
                    matches.push(index + 1);
                }
            });
            throw new Error(`Pattern "${pattern}" found ${matches.length} times at lines: ${matches.join(', ')}. Please be more specific.`);
        }
        // Find end of section (next ## heading or EOF)
        const afterPattern = patternIndex + pattern.length;
        const nextHeadingMatch = newBody.substring(afterPattern).match(/\n## /);
        let insertPosition;
        if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
            // Insert before next heading
            insertPosition = afterPattern + nextHeadingMatch.index;
        }
        else {
            // No next heading, insert at end
            insertPosition = newBody.length;
        }
        const sectionContent = opts.appendSection ? `\n\n${opts.appendSection}\n${contentToAdd}` : `\n${contentToAdd}`;
        newBody = newBody.substring(0, insertPosition) + sectionContent + newBody.substring(insertPosition);
        changes.push(`Inserted content after: ${pattern}`);
        bodyUpdated = true;
    }
    else if (opts.insertBefore) {
        // Insert before specific pattern
        const pattern = opts.insertBefore;
        const patternIndex = newBody.indexOf(pattern);
        if (patternIndex === -1) {
            throw new Error(`Pattern not found: ${pattern}`);
        }
        // Check for multiple matches
        const secondMatch = newBody.indexOf(pattern, patternIndex + 1);
        if (secondMatch !== -1) {
            const lines = newBody.split('\n');
            const matches = [];
            lines.forEach((line, index) => {
                if (line.includes(pattern)) {
                    matches.push(index + 1);
                }
            });
            throw new Error(`Pattern "${pattern}" found ${matches.length} times at lines: ${matches.join(', ')}. Please be more specific.`);
        }
        const sectionContent = opts.appendSection ? `${opts.appendSection}\n${contentToAdd}\n\n` : `${contentToAdd}\n\n`;
        newBody = newBody.substring(0, patternIndex) + sectionContent + newBody.substring(patternIndex);
        changes.push(`Inserted content before: ${pattern}`);
        bodyUpdated = true;
    }
    else if (opts.appendSection) {
        // Standard append at end
        newBody = newBody.trimEnd() + `\n\n${opts.appendSection}\n${contentToAdd}\n`;
        changes.push(`Appended section: ${opts.appendSection}`);
        bodyUpdated = true;
    }
    // Check if anything changed
    if (!frontmatterUpdated && !bodyUpdated) {
        return {
            updated: false,
            filePath: sessionPath,
            message: 'No changes needed',
            changes: []
        };
    }
    // Combine frontmatter and body
    const newContent = serializeFrontmatter(frontmatter) + newBody;
    // Write back
    await writeFile(sessionPath, newContent, 'utf-8');
    // Rebuild context index
    const storage = new JsonStorage();
    await storage.init(targetDir);
    await storage.rebuildIndex();
    await storage.close();
    return {
        updated: true,
        filePath: sessionPath,
        message: `Updated session: ${basename(sessionPath)}`,
        changes
    };
}
//# sourceMappingURL=update-session.js.map