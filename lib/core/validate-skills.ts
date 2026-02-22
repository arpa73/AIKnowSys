import fs from 'node:fs/promises';
import path from 'node:path';

export interface SkillValidationResult {
    passed: boolean;
    summary: string;
    skillsChecked: number;
    issues: string[];
}

export async function validateSkillsCore(projectRoot: string): Promise<SkillValidationResult> {
    const issues: string[] = [];
    let skillsChecked = 0;

    const skillsDir = path.join(projectRoot, '.github', 'skills');

    try {
        const entries = await fs.readdir(skillsDir, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            const skillName = entry.name;
            const skillPath = path.join(skillsDir, skillName, 'SKILL.md');

            try {
                const content = await fs.readFile(skillPath, 'utf-8');
                skillsChecked++;

                // Basic Frontmatter Check
                if (!content.startsWith('---')) {
                    issues.push(`${skillName}: Missing YAML frontmatter`);
                } else {
                    // Naive frontmatter check for 'name' or 'description' or 'trigger_words'
                    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
                    if (!frontmatterMatch) {
                        issues.push(`${skillName}: Malformed YAML frontmatter`);
                    } else {
                        const frontmatter = frontmatterMatch[1];
                        if (!frontmatter.includes('name:') && !frontmatter.includes('description:')) {
                            issues.push(`${skillName}: Frontmatter missing basic metadata (name or description)`);
                        }
                    }
                }
            } catch (err: unknown) {
                issues.push(`${skillName}: Missing SKILL.md file`);
            }
        }
    } catch (error) {
        // If .github/skills doesn't exist, we consider it a validation failure
        // as an AIKnowSys project should always have a skills directory
        return {
            passed: false,
            summary: 'Missing .github/skills directory',
            skillsChecked: 0,
            issues: ['.github/skills directory not found - project misconfigured']
        };
    }

    const passed = issues.length === 0;

    return {
        passed,
        summary: passed ? `All ${skillsChecked} skills valid` : `Validation failed with ${issues.length} issues`,
        skillsChecked,
        issues
    };
}
