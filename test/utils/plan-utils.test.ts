/**
 * Tests for plan utility functions
 * Addresses architect feedback: Extract duplicated generatePlanId logic
 */

import { describe, it, expect } from 'vitest';
import { normalizePlanId, generatePlanId } from '../../lib/utils/plan-utils.js';

describe('plan-utils', () => {
  describe('normalizePlanId', () => {
    it('converts title to lowercase with underscores', () => {
      expect(normalizePlanId('Bug Fix Session')).toBe('bug_fix_session');
    });

    it('handles special characters', () => {
      expect(normalizePlanId('Feature: API Integration')).toBe('feature_api_integration');
    });

    it('handles multiple spaces', () => {
      expect(normalizePlanId('Test   Multiple   Spaces')).toBe('test_multiple_spaces');
    });

    it('removes leading/trailing underscores', () => {
      expect(normalizePlanId('  Leading and Trailing  ')).toBe('leading_and_trailing');
    });

    it('handles hyphens and special chars', () => {
      expect(normalizePlanId('Bug-Fix: Performance Issue!')).toBe('bug_fix_performance_issue');
    });

    it('handles numbers correctly', () => {
      expect(normalizePlanId('Phase 2: Implementation')).toBe('phase_2_implementation');
    });

    it('handles single word titles', () => {
      expect(normalizePlanId('Refactor')).toBe('refactor');
    });

    it('handles empty strings gracefully', () => {
      expect(normalizePlanId('')).toBe('');
    });

    it('handles only special characters', () => {
      expect(normalizePlanId('!!!')).toBe('');
    });

    it('preserves consecutive numbers', () => {
      expect(normalizePlanId('Sprint 2024 Q1')).toBe('sprint_2024_q1');
    });
  });

  describe('generatePlanId', () => {
    it('adds PLAN_ prefix to normalized title', () => {
      expect(generatePlanId('Bug Fix Session')).toBe('PLAN_bug_fix_session');
    });

    it('handles complex titles', () => {
      expect(generatePlanId('Feature: API Integration')).toBe('PLAN_feature_api_integration');
    });

    it('matches create-plan.ts behavior', () => {
      // This is the example from the tests
      expect(generatePlanId('Test Feature Implementation')).toBe('PLAN_test_feature_implementation');
    });

    it('matches plan-template.ts behavior with prefix', () => {
      // plan-template uses normalizePlanId, command uses generatePlanId
      const title = 'Index Test';
      const normalized = normalizePlanId(title);
      const withPrefix = generatePlanId(title);
      
      expect(normalized).toBe('index_test');
      expect(withPrefix).toBe('PLAN_index_test');
    });

    it('handles empty string', () => {
      expect(generatePlanId('')).toBe('PLAN_');
    });
  });
});
