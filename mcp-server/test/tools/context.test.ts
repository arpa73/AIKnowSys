import { describe, it, expect } from 'vitest';
import { getCriticalInvariants, getValidationMatrix } from '../../src/tools/context.js';

describe('getCriticalInvariants', () => {
  it('should return exactly 8 invariants', async () => {
    const result = await getCriticalInvariants();
    const data = JSON.parse(result.content[0].text);
    
    expect(data.count).toBe(8);
    expect(data.invariants).toHaveLength(8);
  });

  it('should include all required invariant properties', async () => {
    const result = await getCriticalInvariants();
    const data = JSON.parse(result.content[0].text);
    
    data.invariants.forEach((invariant: any) => {
      expect(invariant).toHaveProperty('number');
      expect(invariant).toHaveProperty('name');
      expect(invariant).toHaveProperty('rule');
      expect(invariant).toHaveProperty('details');
      expect(Array.isArray(invariant.details)).toBe(true);
    });
  });

  it('should include TDD invariant (#7)', async () => {
    const result = await getCriticalInvariants();
    const data = JSON.parse(result.content[0].text);
    
    const tddInvariant = data.invariants.find((i: any) => i.number === 7);
    expect(tddInvariant).toBeDefined();
    expect(tddInvariant.name).toContain('TDD');
    expect(tddInvariant.rule).toContain('RED');
  });

  it('should include ES Modules invariant (#1)', async () => {
    const result = await getCriticalInvariants();
    const data = JSON.parse(result.content[0].text);
    
    const esModulesInvariant = data.invariants.find((i: any) => i.number === 1);
    expect(esModulesInvariant).toBeDefined();
    expect(esModulesInvariant.name).toContain('ES Modules');
    expect(esModulesInvariant.rule).toContain('import/export');
  });

  it('should include Absolute Paths invariant (#2)', async () => {
    const result = await getCriticalInvariants();
    const data = JSON.parse(result.content[0].text);
    
    const pathsInvariant = data.invariants.find((i: any) => i.number === 2);
    expect(pathsInvariant).toBeDefined();
    expect(pathsInvariant.name).toContain('Absolute Paths');
    expect(pathsInvariant.rule).toContain('path.resolve');
  });

  it('should include warning about mandatory enforcement', async () => {
    const result = await getCriticalInvariants();
    const data = JSON.parse(result.content[0].text);
    
    expect(data.warning).toBeDefined();
    expect(data.warning).toContain('MANDATORY');
  });

  it('should return MCP-compliant response format', async () => {
    const result = await getCriticalInvariants();
    
    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
  });
});

describe('getValidationMatrix', () => {
  it('should return validation matrix with categories', async () => {
    const result = await getValidationMatrix();
    const data = JSON.parse(result.content[0].text);
    
    expect(data).toHaveProperty('categories');
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.categories.length).toBeGreaterThan(0);
  });

  it('should include "Required on Every Change" category', async () => {
    const result = await getValidationMatrix();
    const data = JSON.parse(result.content[0].text);
    
    const requiredCategory = data.categories.find(
      (c: any) => c.name === 'Required on Every Change'
    );
    expect(requiredCategory).toBeDefined();
    expect(requiredCategory.commands).toBeDefined();
    expect(requiredCategory.commands.length).toBeGreaterThan(0);
  });

  it('should include npm test command', async () => {
    const result = await getValidationMatrix();
    const data = JSON.parse(result.content[0].text);
    
    const allCommands = data.categories.flatMap((c: any) => c.commands);
    const npmTest = allCommands.find((cmd: any) => cmd.command === 'npm test');
    
    expect(npmTest).toBeDefined();
    expect(npmTest.purpose).toBeDefined();
    expect(npmTest.expected).toBeDefined();
  });

  it('should include template validation commands', async () => {
    const result = await getValidationMatrix();
    const data = JSON.parse(result.content[0].text);
    
    const templateCategory = data.categories.find(
      (c: any) => c.name === 'Template Changes'
    );
    expect(templateCategory).toBeDefined();
    
    const validateCmd = templateCategory.commands.find(
      (cmd: any) => cmd.command === 'npx aiknowsys validate-deliverables'
    );
    expect(validateCmd).toBeDefined();
  });

  it('should include critical rule reminder', async () => {
    const result = await getValidationMatrix();
    const data = JSON.parse(result.content[0].text);
    
    expect(data.criticalRule).toBeDefined();
    expect(data.criticalRule).toContain('complete');
    expect(data.criticalRule).toContain('validation');
  });

  it('should include technology snapshot', async () => {
    const result = await getValidationMatrix();
    const data = JSON.parse(result.content[0].text);
    
    expect(data.technologySnapshot).toBeDefined();
    expect(data.technologySnapshot.runtime).toBeDefined();
    expect(data.technologySnapshot.language).toBeDefined();
    expect(data.technologySnapshot.testFramework).toBeDefined();
  });

  it('should return MCP-compliant response format', async () => {
    const result = await getValidationMatrix();
    
    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
  });
});
