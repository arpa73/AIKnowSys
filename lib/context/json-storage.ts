/**
 * JSON file-based storage adapter implementation
 * Stores context index in .aiknowsys/context-index.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import { StorageAdapter } from './storage-adapter.js';
import type {
  PlanMetadata,
  SessionMetadata,
  SearchResult,
  PlanFilters,
  SessionFilters,
  SearchScope
} from './types.js';

/**
 * Internal index structure for JSON storage
 * Persisted to .aiknowsys/context-index.json
 */
interface ContextIndex {
  version: number;
  updated: string;
  plans: PlanMetadata[];
  sessions: SessionMetadata[];
  learned: any[]; // TODO: Define LearnedMetadata interface when implementing learned patterns (Phase 2)
}

export class JsonStorage extends StorageAdapter {
  private targetDir: string = '';
  private index: ContextIndex = {
    version: 1,
    updated: new Date().toISOString(),
    plans: [],
    sessions: [],
    learned: []
  };

  async init(targetDir: string): Promise<void> {
    this.targetDir = targetDir;
    const indexPath = this.getIndexPath();
    
    // Create .aiknowsys directory if it doesn't exist
    const aiknowsysDir = path.join(targetDir, '.aiknowsys');
    await fs.mkdir(aiknowsysDir, { recursive: true });
    
    // Load existing index or create new one
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      this.index = JSON.parse(indexContent);
    } catch (error) {
      // Index doesn't exist, create empty one
      await this.saveIndex();
    }
  }

  async queryPlans(filters?: PlanFilters): Promise<{ count: number; plans: PlanMetadata[] }> {
    let plans = [...this.index.plans];

    if (filters) {
      if (filters.status) {
        plans = plans.filter(p => p.status === filters.status);
      }
      
      if (filters.author) {
        plans = plans.filter(p => p.author === filters.author);
      }
      
      if (filters.topic) {
        plans = plans.filter(p =>
          p.title.toLowerCase().includes(filters.topic!.toLowerCase()) ||
          p.topics?.some(t => t.toLowerCase().includes(filters.topic!.toLowerCase()))
        );
      }
      
      if (filters.updatedAfter) {
        plans = plans.filter(p => p.updated > filters.updatedAfter!);
      }
      
      if (filters.updatedBefore) {
        plans = plans.filter(p => p.updated < filters.updatedBefore!);
      }
    }

    return {
      count: plans.length,
      plans
    };
  }

  async querySessions(filters?: SessionFilters): Promise<{ count: number; sessions: SessionMetadata[] }> {
    let sessions = [...this.index.sessions];

    if (filters) {
      if (filters.date) {
        sessions = sessions.filter(s => s.date === filters.date);
      }
      
      if (filters.dateAfter) {
        sessions = sessions.filter(s => s.date > filters.dateAfter!);
      }
      
      if (filters.dateBefore) {
        sessions = sessions.filter(s => s.date < filters.dateBefore!);
      }
      
      if (filters.topic) {
        sessions = sessions.filter(s =>
          s.topic.toLowerCase().includes(filters.topic!.toLowerCase())
        );
      }
      
      if (filters.plan) {
        sessions = sessions.filter(s => s.plan === filters.plan);
      }
    }

    return {
      count: sessions.length,
      sessions
    };
  }

  async search(query: string, scope: SearchScope): Promise<{ query: string; count: number; results: SearchResult[] }> {
    const results: SearchResult[] = [];
    const searchPattern = new RegExp(query, 'gi');
    
    // Determine which directories to search based on scope
    const searchDirs: { dir: string; type: SearchResult['type'] }[] = [];
    
    if (scope === 'all' || scope === 'plans') {
      searchDirs.push({ dir: '.aiknowsys', type: 'plan' });
    }
    if (scope === 'all' || scope === 'sessions') {
      searchDirs.push({ dir: path.join('.aiknowsys', 'sessions'), type: 'session' });
    }
    if (scope === 'all' || scope === 'learned') {
      searchDirs.push({ dir: path.join('.aiknowsys', 'learned'), type: 'learned' });
    }
    if (scope === 'all' || scope === 'essentials') {
      searchDirs.push({ dir: '.', type: 'essentials' });
    }
    
    // Search through files
    for (const { dir, type } of searchDirs) {
      const fullDir = path.join(this.targetDir, dir);
      
      try {
        const files = await fs.readdir(fullDir, { recursive: false });
        
        for (const file of files) {
          const filePath = path.join(fullDir, file as string);
          
          // Skip directories and non-markdown files
          const stats = await fs.stat(filePath).catch(() => null);
          if (!stats || stats.isDirectory() || !file.toString().endsWith('.md')) {
            continue;
          }
          
          // Filter by type
          if (type === 'plan' && !file.toString().startsWith('PLAN_')) continue;
          if (type === 'essentials' && file.toString() !== 'CODEBASE_ESSENTIALS.md') continue;
          
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            const matches = line.match(searchPattern);
            if (matches) {
              results.push({
                file: path.relative(this.targetDir, filePath),
                line: index + 1,
                context: line.trim(),
                relevance: matches.length * 10, // Simple relevance scoring
                type
              });
            }
          });
        }
      } catch (error) {
        // Directory doesn't exist or can't be read, skip it
        continue;
      }
    }
    
    // Sort by relevance (highest first)
    results.sort((a, b) => b.relevance - a.relevance);
    
    return {
      query,
      count: results.length,
      results
    };
  }

  async rebuildIndex(): Promise<void> {
    const newIndex: ContextIndex = {
      version: 1,
      updated: new Date().toISOString(),
      plans: [],
      sessions: [],
      learned: []
    };

    // Parse plan files
    const plansDir = path.join(this.targetDir, '.aiknowsys', 'plans');
    try {
      const planFiles = await fs.readdir(plansDir);
      
      for (const file of planFiles) {
        if (file.startsWith('active-') && file.endsWith('.md')) {
          const content = await fs.readFile(path.join(plansDir, file), 'utf-8');
          const plan = this.parsePlanPointer(content, file);
          if (plan) {
            newIndex.plans.push(plan);
          }
        }
      }
    } catch (error) {
      // Plans directory doesn't exist yet
    }

    // Parse PLAN_*.md files
    const aiknowsysDir = path.join(this.targetDir, '.aiknowsys');
    try {
      const files = await fs.readdir(aiknowsysDir);
      
      for (const file of files) {
        if (file.startsWith('PLAN_') && file.endsWith('.md')) {
          const content = await fs.readFile(path.join(aiknowsysDir, file), 'utf-8');
          const plan = this.parsePlanFile(content, file);
          if (plan) {
            // Check if we already have this plan from active-*.md
            const existing = newIndex.plans.find(p => p.file === file);
            if (!existing) {
              newIndex.plans.push(plan);
            }
          }
        }
      }
    } catch (error) {
      // .aiknowsys directory doesn't exist yet
    }

    // Parse session files
    const sessionsDir = path.join(this.targetDir, '.aiknowsys', 'sessions');
    try {
      const sessionFiles = await fs.readdir(sessionsDir);
      
      for (const file of sessionFiles) {
        if (file.match(/^\d{4}-\d{2}-\d{2}.*\.md$/)) {
          const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8');
          const session = this.parseSessionFile(content, file);
          if (session) {
            newIndex.sessions.push(session);
          }
        }
      }
    } catch (error) {
      // Sessions directory doesn't exist yet
    }

    this.index = newIndex;
    await this.saveIndex();
  }

  async close(): Promise<void> {
    // No resources to cleanup for JSON storage
  }

  private getIndexPath(): string {
    return path.join(this.targetDir, '.aiknowsys', 'context-index.json');
  }

  private async saveIndex(): Promise<void> {
    const indexPath = this.getIndexPath();
    await fs.writeFile(indexPath, JSON.stringify(this.index, null, 2));
  }

  private parsePlanPointer(content: string, filename: string): PlanMetadata | null {
    // Extract author from filename (active-<username>.md)
    const authorMatch = filename.match(/^active-(.+)\.md$/);
    if (!authorMatch) return null;
    
    const author = authorMatch[1];
    
    // Extract plan reference and status
    const planMatch = content.match(/\*\*Plan:\*\*\s+\[([^\]]+)\]\(([^)]+)\)/m) ||
                     content.match(/\*\*Currently Working On:\*\*\s+\[([^\]]+)\]\(([^)]+)\)/m);
    
    const statusMatch = content.match(/\*\*Status:\*\*\s+🎯\s+(\w+)/m);
    
    if (!planMatch) return null;
    
    return {
      id: authorMatch[1] + '-plan',
      title: planMatch[1],
      status: (statusMatch ? statusMatch[1] as any : 'ACTIVE'),
      author,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      file: planMatch[2].replace('../', '')
    };
  }

  private parsePlanFile(content: string, filename: string): PlanMetadata | null {
    // Extract title from first # heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (!titleMatch) return null;
    
    // Extract status
    const statusMatch = content.match(/\*\*Status:\*\*\s+[🎯📋✅❌🔄]\s+(\w+)/m);
    
    // Extract dates
    const createdMatch = content.match(/\*\*Created:\*\*\s+(\d{4}-\d{2}-\d{2})/m);
    const updatedMatch = content.match(/\*\*Updated:\*\*\s+(\d{4}-\d{2}-\d{2})/m);
    
    return {
      id: filename.replace('PLAN_', '').replace('.md', ''),
      title: titleMatch[1],
      status: (statusMatch ? statusMatch[1] as any : 'PLANNED'),
      author: 'unknown',
      created: createdMatch ? new Date(createdMatch[1]).toISOString() : new Date().toISOString(),
      updated: updatedMatch ? new Date(updatedMatch[1]).toISOString() : new Date().toISOString(),
      file: filename
    };
  }

  private parseSessionFile(content: string, filename: string): SessionMetadata | null {
    // Extract date from filename (YYYY-MM-DD-session.md)
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) return null;
    
    // Extract title from first # heading
    const titleMatch = content.match(/^#\s+Session:\s+(.+?)\s+\(/m) ||
                      content.match(/^#\s+(.+)$/m);
    
    // Extract plan reference
    const planMatch = content.match(/\*\*Plan:\*\*\s+(.+)/m) ||
                     content.match(/\*\*Topic:\*\*\s+(.+)/m);
    
    return {
      date: dateMatch[1],
      topic: titleMatch ? titleMatch[1] : 'Session',
      plan: planMatch ? planMatch[1] : undefined,
      file: `sessions/${filename}`,
      created: new Date(dateMatch[1]).toISOString(),
      updated: new Date().toISOString()
    };
  }
}
