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
      assert.ok(result !== undefined, 'Hook should execute successfully');
    });

    it('should exit successfully when plans directory is empty', () => {
      fs.mkdirSync(path.join(testDir, '.aiknowsys', 'plans'), { recursive: true });
      
      const result = execSync(`node "${hookPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, GIT_AUTHOR_NAME: 'Test User' }
      });
      assert.ok(result !== undefined, 'Hook should execute successfully');
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
      assert.strictEqual(result, '', 'Should skip when only own plan exists');
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
      assert.match(result, /Team Plans Reminder/, 'Should show reminder header');
      assert.match(result, /alice-smith/, 'Should show teammate name');
      assert.match(result, /Login System/, 'Should show teammate\'s current work');
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
      assert.match(result, /alice-smith/, 'Should show first teammate');
      assert.match(result, /Login System/, 'Should show first teammate\'s work');
      assert.match(result, /bob-jones/, 'Should show second teammate');
      assert.match(result, /Payment API/, 'Should show second teammate\'s work');
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
      assert.match(result, /📋 Team Plans Reminder/, 'Should have header with icon');
      assert.match(result, /─+/, 'Should have separator line');
      assert.match(result, /Your teammates are currently working on:/, 'Should have description');
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
      assert.match(result, /npx aiknowsys/, 'Should mention CLI command');
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
      assert.match(result, /alice-smith/, 'Should show other user');
      assert.doesNotMatch(result, /john-doe/, 'Should not show normalized own username');
    });
  });
});
