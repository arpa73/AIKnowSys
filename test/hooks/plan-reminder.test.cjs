const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('plan-reminder hook', () => {
  let testDir;
  let hookPath;
  const projectRoot = path.join(__dirname, '..', '..');

  beforeEach(() => {
    testDir = path.join(__dirname, 'tmp', `plan-reminder-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
    hookPath = path.join(projectRoot, 'templates', 'hooks', 'plan-reminder.cjs');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Non-blocking behavior', () => {
    it('should exit successfully when no plans directory exists', () => {
      const result = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
      });
      expect(result !== undefined).toBeTruthy();
    });

    it('should exit successfully when plans directory is empty', () => {
      fs.mkdirSync(path.join(testDir, '.aiknowsys', 'plans'), { recursive: true });
      
      const result = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
      });
      expect(result !== undefined).toBeTruthy();
    });

    it('should exit successfully when only user\'s own plan exists', () => {
      const plansDir = path.join(testDir, '.aiknowsys', 'plans');
      fs.mkdirSync(plansDir, { recursive: true });
      
      // Create user's own active plan
      fs.writeFileSync(
        path.join(plansDir, 'active-test-user.md'),
        '**Currently Working On:** My Feature\n**Goal:** Test\n'
      );
      
      const result = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
      });
      expect(result).toBe('');
    });
  });

  describe('Plan detection', () => {
    it('should detect and display teammate active plans', () => {
      const plansDir = path.join(testDir, '.aiknowsys', 'plans');
      fs.mkdirSync(plansDir, { recursive: true });
      
      // Create teammate's active plan
      fs.writeFileSync(
        path.join(plansDir, 'active-alice-smith.md'),
        '**Currently Working On:** Login System\n**Goal:** Add OAuth\n'
      );
      
      const result = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
      });
      expect(result).toMatch(/Team Plans Reminder/);
      expect(result).toMatch(/alice-smith/);
      expect(result).toMatch(/Login System/);
    });

    it('should detect multiple teammate plans', () => {
      const plansDir = path.join(testDir, '.aiknowsys', 'plans');
      fs.mkdirSync(plansDir, { recursive: true });
      
      // Create multiple teammate plans
      fs.writeFileSync(
        path.join(plansDir, 'active-alice-smith.md'),
        '**Currently Working On:** Login System\n**Goal:** Add OAuth\n'
      );
      fs.writeFileSync(
        path.join(plansDir, 'active-bob-jones.md'),
        '**Currently Working On:** Payment API\n**Goal:** Stripe integration\n'
      );
      
      const result = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
      });
      expect(result).toMatch(/alice-smith/);
      expect(result).toMatch(/Login System/);
      expect(result).toMatch(/bob-jones/);
      expect(result).toMatch(/Payment API/);
    });
  });

  describe('Output formatting', () => {
    it('should format output with clear sections', () => {
      const plansDir = path.join(testDir, '.aiknowsys', 'plans');
      fs.mkdirSync(plansDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(plansDir, 'active-alice-smith.md'),
        '**Currently Working On:** Feature X\n**Goal:** Test\n'
      );
      
      const result = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
      });
      expect(result).toMatch(/📋 Team Plans Reminder/);
      expect(result).toMatch(/─+/);
      expect(result).toMatch(/Your teammates are currently working on:/);
    });

    it('should provide helpful commands', () => {
      const plansDir = path.join(testDir, '.aiknowsys', 'plans');
      fs.mkdirSync(plansDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(plansDir, 'active-alice-smith.md'),
        '**Currently Working On:** Feature X\n**Goal:** Test\n'
      );
      
      const result = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
      });
      expect(result).toMatch(/npx aiknowsys/);
    });
  });

  describe('Username normalization', () => {
    it('should handle usernames with spaces and special characters', () => {
      const plansDir = path.join(testDir, '.aiknowsys', 'plans');
      fs.mkdirSync(plansDir, { recursive: true });
      
      // Create plans for other users
      fs.writeFileSync(
        path.join(plansDir, 'active-alice-smith.md'),
        '**Currently Working On:** Feature\n'
      );
      
      // User "John Doe" normalizes to "john-doe"
      // Should see alice-smith but not own plan
      const result = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, GIT_AUTHOR_NAME: 'John Doe' }
      });
      expect(result).toMatch(/alice-smith/);
      expect(result).not.toMatch(/john-doe/);
    });
  });
});
