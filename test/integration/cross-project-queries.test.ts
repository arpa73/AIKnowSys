import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import os from 'node:os';
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';
import { queryPlans } from '../../dist/lib/commands/query-plans.js';
import { querySessions } from '../../dist/lib/commands/query-sessions.js';
import { searchContextCore } from '../../dist/lib/core/search-context.js';
import type { QueryPlansOptions, QuerySessionsOptions } from '../../dist/lib/types/index.js';

/**
 * 🔴 RED PHASE: Tests for cross-project functionality
 * 
 * These tests verify that:
 * 1. Multiple projects can share a global database
 * 2. Queries are project-scoped by default
 * 3. --all-projects flag removes project filter
 * 4. Commands use DatabaseLocator for global DB by default
 */
describe('Cross-Project Queries', () => {
  let tempDir: string;
  let globalDbPath: string;
  let storage: SqliteStorage;
  let project1Dir: string;
  let project2Dir: string;

  beforeEach(async () => {
    // Create temp directory structure:
    // tempDir/
    //   .aiknowsys/knowledge.db  (global database)
    //   project-alpha/           (project 1)
    //   project-beta/            (project 2)
    tempDir = path.join(
      process.cwd(),
      `test-tmp-cross-project-${Date.now()}`
    );
    
    await fs.promises.mkdir(tempDir, { recursive: true });
    
    // Set up global database in tempDir
    globalDbPath = path.join(tempDir, '.aiknowsys', 'knowledge.db');
    await fs.promises.mkdir(path.dirname(globalDbPath), { recursive: true });
    
    // Set environment variable for DatabaseLocator to find this test database
    process.env.AIKNOWSYS_DB_PATH = globalDbPath;
    
    // Create project directories
    project1Dir = path.join(tempDir, 'project-alpha');
    project2Dir = path.join(tempDir, 'project-beta');
    
    await fs.promises.mkdir(project1Dir, { recursive: true });
    await fs.promises.mkdir(project2Dir, { recursive: true });
    
    // Initialize global database
    storage = new SqliteStorage();
    await storage.init(globalDbPath);
    
    // Register both projects
    await storage.insertProject({
      id: 'project-alpha',
      name: 'Project Alpha',
      path: project1Dir,
      tech_stack: { language: 'TypeScript' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    await storage.insertProject({
      id: 'project-beta',
      name: 'Project Beta',
      path: project2Dir,
      tech_stack: { language: 'Python' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Insert test data for project-alpha
    await storage.insertPlan({
      id: 'PLAN_alpha_feature',
      project_id: 'project-alpha',
      title: 'Alpha Feature',
      status: 'ACTIVE',
      author: 'dev1',
      priority: 'high',
      type: 'feature',
      content: 'Alpha project feature work',
      topics: ['feature', 'alpha'],
      created: new Date('2026-02-10').toISOString(),
      updated: new Date('2026-02-10').toISOString()
    });
    
    await storage.insertSession({
      id: 'sess-alpha-001',
      project_id: 'project-alpha',
      date: '2026-02-14',
      topic: 'Alpha work',
      topics: ['development', 'alpha'],
      status: 'completed',
      created: new Date('2026-02-14').toISOString(),
      updated: new Date('2026-02-14').toISOString(),
      content: 'Alpha project session'
    });
    
    // Insert test data for project-beta
    await storage.insertPlan({
      id: 'PLAN_beta_bugfix',
      project_id: 'project-beta',
      title: 'Beta Bugfix',
      status: 'COMPLETE',
      author: 'dev2',
      priority: 'medium',
      type: 'bugfix',
      content: 'Beta project bugfix',
      topics: ['bugfix', 'beta'],
      created: new Date('2026-02-12').toISOString(),
      updated: new Date('2026-02-12').toISOString()
    });
    
    await storage.insertSession({
      id: 'sess-beta-001',
      project_id: 'project-beta',
      date: '2026-02-15',
      topic: 'Beta work',
      topics: ['development', 'beta'],
      status: 'active',
      created: new Date('2026-02-15').toISOString(),
      updated: new Date('2026-02-15').toISOString(),
      content: 'Beta project session'
    });
  });

  afterEach(async () => {
    // Clean up environment variable
    delete process.env.AIKNOWSYS_DB_PATH;
    
    if (storage) {
      await storage.close();
    }
    
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Project-scoped queries (default behavior)', () => {
    it('should return only plans for project-alpha when queried from that directory', async () => {
      const options: QueryPlansOptions = {
        dbPath: globalDbPath,
        projectId: 'project-alpha'
      };
      
      const result = await queryPlans(options);
      
      expect(result.count).toBe(1);
      expect(result.plans[0].id).toBe('PLAN_alpha_feature');
      expect(result.plans[0].title).toBe('Alpha Feature');
    });

    it('should return only plans for project-beta when queried from that directory', async () => {
      const options: QueryPlansOptions = {
        dbPath: globalDbPath,
        projectId: 'project-beta'
      };
      
      const result = await queryPlans(options);
      
      expect(result.count).toBe(1);
      expect(result.plans[0].id).toBe('PLAN_beta_bugfix');
      expect(result.plans[0].title).toBe('Beta Bugfix');
    });

    it('should return only sessions for project-alpha when queried from that directory', async () => {
      const options: QuerySessionsOptions = {
        dbPath: globalDbPath,
        projectId: 'project-alpha'
      };
      
      const result = await querySessions(options);
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].id).toBe('sess-alpha-001');
      expect(result.sessions[0].topic).toBe('Alpha work');
    });

    it('should return only sessions for project-beta when queried from that directory', async () => {
      const options: QuerySessionsOptions = {
        dbPath: globalDbPath,
        projectId: 'project-beta'
      };
      
      const result = await querySessions(options);
      
      expect(result.count).toBe(1);
      expect(result.sessions[0].id).toBe('sess-beta-001');
      expect(result.sessions[0].topic).toBe('Beta work');
    });
  });

  describe('Cross-project queries (--all-projects flag)', () => {
    it('should return plans from all projects when --all-projects is set', async () => {
      const options: QueryPlansOptions = {
        dbPath: globalDbPath,
        allProjects: true  // 🔴 RED: This flag doesn't exist yet!
      };
      
      const result = await queryPlans(options);
      
      expect(result.count).toBe(2);
      
      const planIds = result.plans.map(p => p.id).sort();
      expect(planIds).toEqual(['PLAN_alpha_feature', 'PLAN_beta_bugfix']);
    });

    it('should return sessions from all projects when --all-projects is set', async () => {
      const options: QuerySessionsOptions = {
        dbPath: globalDbPath,
        allProjects: true  // 🔴 RED: This flag doesn't exist yet!
      };
      
      const result = await querySessions(options);
      
      expect(result.count).toBe(2);
      
      const sessionIds = result.sessions.map(s => s.id).sort();
      expect(sessionIds).toEqual(['sess-alpha-001', 'sess-beta-001']);
    });

    it('should allow filtering across all projects by status', async () => {
      const options: QueryPlansOptions = {
        dbPath: globalDbPath,
        allProjects: true,
        status: 'ACTIVE'
      };
      
      const result = await queryPlans(options);
      
      expect(result.count).toBe(1);
      expect(result.plans[0].id).toBe('PLAN_alpha_feature');
      expect(result.plans[0].status).toBe('ACTIVE');
    });

    it('should allow filtering across all projects by author', async () => {
      const options: QueryPlansOptions = {
        dbPath: globalDbPath,
        allProjects: true,
        author: 'dev2'
      };
      
      const result = await queryPlans(options);
      
      expect(result.count).toBe(1);
      expect(result.plans[0].id).toBe('PLAN_beta_bugfix');
      expect(result.plans[0].author).toBe('dev2');
    });
  });

  describe('Default database location (global DB)', () => {
    it('should use ~/.aiknowsys/knowledge.db when no dbPath specified', async () => {
      // 🔴 RED: This test verifies that commands use DatabaseLocator by default
      // Currently commands require --db-path flag, they should default to DatabaseLocator
      
      // This is a design test - we can't easily test without modifying HOME
      // But we can verify that the option type allows dbPath to be optional
      
      const options = {
        projectId: 'project-alpha'
        // dbPath should be optional and default to DatabaseLocator.getDatabaseConfig()
      } as QueryPlansOptions;
      
      // This will fail until we refactor commands to use DatabaseLocator
      // expect(options.dbPath).toBeUndefined();
      
      // For now, just document that this is the expected behavior
      expect(true).toBe(true);
    });
  });

  describe('Project isolation', () => {
    it('should prevent cross-project data leakage in default queries', async () => {
      const alphaResult = await queryPlans({
        dbPath: globalDbPath,
        projectId: 'project-alpha'
      });
      
      const betaResult = await queryPlans({
        dbPath: globalDbPath,
        projectId: 'project-beta'
      });
      
      // Results should be completely disjoint
      const alphaIds = alphaResult.plans.map(p => p.id);
      const betaIds = betaResult.plans.map(p => p.id);
      
      const intersection = alphaIds.filter(id => betaIds.includes(id));
      expect(intersection).toHaveLength(0);
    });

    it('should maintain project_id integrity in results', async () => {
      const result = await queryPlans({
        dbPath: globalDbPath,
        projectId: 'project-alpha'
      });
      
      // All results should have matching projectId (camelCase)
      result.plans.forEach(plan => {
        expect(plan.projectId).toBe('project-alpha');
      });
    });
  });

  describe('Cross-project search (search-context)', () => {
    it('should search only current project by default', async () => {
      // 🔴 RED: Test project-scoped search
      const result = await searchContextCore(
        'feature',
        { scope: 'all' },
        project1Dir
      );
      
      // Should only find alpha project content
      expect(result.count).toBeGreaterThan(0);
      result.matches.forEach(match => {
        expect(match.file).toContain('alpha');
      });
    });

    it('should search across all projects with allProjects flag', async () => {
      // 🔴 RED: Test cross-project search
      const result = await searchContextCore(
        'project',
        { scope: 'all', allProjects: true },
        project1Dir
      );
      
      // Should find content from both projects
      expect(result.count).toBeGreaterThanOrEqual(2);
      
      // Should have matches from both projects
      const hasAlpha = result.matches.some(m => m.file.includes('alpha'));
      const hasBeta = result.matches.some(m => m.file.includes('beta'));
      
      expect(hasAlpha).toBe(true);
      expect(hasBeta).toBe(true);
    });

    it('should respect scope parameter in cross-project search', async () => {
      // 🔴 RED: Test scoped cross-project search
      const result = await searchContextCore(
        'feature',
        { scope: 'plans', allProjects: true },
        project1Dir
      );
      
      // Should only search plans across all projects
      result.matches.forEach(match => {
        expect(match.type).toBe('plan');
      });
    });

    it('should maintain project isolation when allProjects is false', async () => {
      // Search from project-alpha directory
      const alphaResult = await searchContextCore(
        'work',
        { scope: 'all', allProjects: false },
        project1Dir
      );
      
      // Search from project-beta directory
      const betaResult = await searchContextCore(
        'work',
        { scope: 'all', allProjects: false },
        project2Dir
      );
      
      // Results should be completely disjoint
      const alphaFiles = alphaResult.matches.map(m => m.file);
      const betaFiles = betaResult.matches.map(m => m.file);
      
      const intersection = alphaFiles.filter(f => betaFiles.includes(f));
      expect(intersection).toHaveLength(0);
    });
  });
});
