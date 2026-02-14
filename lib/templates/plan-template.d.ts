/**
 * Plan template generator with YAML frontmatter
 * Phase B Mini - Context Query Completion
 */
export interface PlanMetadata {
    id?: string;
    title: string;
    status?: 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETE' | 'CANCELLED';
    author?: string;
    created?: string;
    topics?: string[];
}
/**
 * Generate plan file content with YAML frontmatter
 */
export declare function generatePlanTemplate(metadata: PlanMetadata): string;
//# sourceMappingURL=plan-template.d.ts.map