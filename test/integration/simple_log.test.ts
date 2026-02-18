import { describe, it } from 'vitest';
import { logWorkEvent } from '../../lib/tools/log-work-event.js';
import { checkConstraints } from '../../lib/core/constraints.js';

describe('Simple Log Test', () => {
  it('imports successfully', () => {
    console.log(logWorkEvent);
    console.log(checkConstraints);
  });
});
