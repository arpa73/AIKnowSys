import { z } from 'zod';
import { handleZodError, MCPErrorResponse } from './utils/error-helpers.js';
import { MCP_AGENT_USER_ID, withStorage } from './utils/storage-helpers.js';
import { randomUUID } from 'crypto';

// ============================================================================
// REVIEW MUTATION TOOLS
// ============================================================================

export const createReviewSchema = z.object({
    targetId: z.string().describe('ID of the plan or session to review (e.g., PLAN_alpha_feature)'),
    author: z.string().describe('Role or name of the reviewer (e.g., architect)'),
    status: z.enum(['PENDING', 'ACTIVE', 'ADDRESSED']).describe('Status of the review'),
    content: z.string().describe('The markdown content of the review explaining thoughts or feedback')
});

export async function createReview(params: unknown) {
    try {
        const validated = createReviewSchema.parse(params);

        await withStorage(async (storage) => {
            // Create a unique ID for the review
            const reviewId = `rev-${randomUUID()}`;

            // Determine project_id if it's a plan we are reviewing
            let projectId: string | undefined = undefined;
            if (validated.targetId.startsWith('PLAN_')) {
                const plan = await storage.getPlanById(validated.targetId);
                if (plan) {
                    projectId = plan.project_id;
                }
            } else {
                const session = await storage.getSessionById(validated.targetId);
                if (session) {
                    projectId = session.project_id;
                }
            }

            await storage.insertReview({
                id: reviewId,
                project_id: projectId ?? undefined,
                target_id: validated.targetId,
                author: validated.author,
                status: validated.status,
                content: validated.content,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }, 'createReview storage operation');

        return {
            content: [{
                type: 'text' as const,
                text: `✅ Review created successfully for ${validated.targetId} with status: ${validated.status}`
            }]
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return handleZodError(error, 'creating a review', {
                targetId: {
                    suggestion: 'Provide the ID of the plan or session',
                    examples: ['{ "targetId": "PLAN_alpha_feature" }']
                }
            });
        }

        return {
            content: [{
                type: 'text' as const,
                text: `Error creating review: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
        };
    }
}

// ============================================================================
// LINK MUTATION TOOLS
// ============================================================================

export const createLinkSchema = z.object({
    sourceId: z.string().describe('Source ID (e.g., a session ID)'),
    targetId: z.string().describe('Target ID (e.g., a plan ID)'),
    type: z.string().describe('Relationship type (e.g., "implements", "blocks", "relates_to")'),
    metadata: z.record(z.unknown()).optional().describe('Optional JSON metadata for the link')
});

export async function createLink(params: unknown) {
    try {
        const validated = createLinkSchema.parse(params);

        await withStorage(async (storage) => {
            await storage.insertLink({
                source_id: validated.sourceId,
                target_id: validated.targetId,
                type: validated.type,
                metadata: validated.metadata,
                created_at: new Date().toISOString()
            });
        }, 'createLink storage operation');

        return {
            content: [{
                type: 'text' as const,
                text: `✅ Link created successfully: ${validated.sourceId} -[${validated.type}]-> ${validated.targetId}`
            }]
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return handleZodError(error, 'creating a link', {
                sourceId: {
                    suggestion: 'Provide the source ID',
                    examples: ['{ "sourceId": "sess-2026-02-15-001" }']
                }
            });
        }

        return {
            content: [{
                type: 'text' as const,
                text: `Error creating link: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
        };
    }
}
