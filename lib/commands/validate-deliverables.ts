/**
 * Validate deliverable files (templates, schemas, patterns)
 * Phase 2 Batch 3: REFACTOR
 * 
 * CLI wrapper - calls core logic and formats output with logger.
 */

import { createLogger } from '../logger.js';
import { validateDeliverablesCore } from '../core/validate-deliverables.js';
import type { 
  DeliverableValidationOptions,
  DeliverableValidationResult
} from '../types/index.js';

/**
 * Validate all deliverable files (templates)
 * Formats results for CLI output using logger
 */
export async function validateDeliverables(
  options: DeliverableValidationOptions = {}
): Promise<DeliverableValidationResult> {
  const log = createLogger(options._silent);
  
  // Show header
  log.header('🔍 Deliverables Validation', '🔍');
  log.blank();

  // Call core function (pure business logic)
  const result = await validateDeliverablesCore(options);

  // Format and display results with logger
  if (!options._silent) {
    // Show each check result
    result.checks.forEach(check => {
      if (check.passed) {
        log.white(`  ✓ ${check.name}`);
      } else {
        log.error(`  ✗ ${check.name}`);
        check.issues.forEach(issue => {
          log.dim(`    - ${issue}`);
        });
      }
    });

    // Show summary
    log.blank();
    if (result.passed) {
      log.success(`✅ ${result.summary}`);
    } else {
      log.error(`❌ ${result.summary}`);
      
      // Show failures
      const failures = result.checks.filter(c => !c.passed);
      failures.forEach(check => {
        log.blank();
        log.error(`${check.name}:`);
        check.issues.forEach(issue => {
          log.dim(`  - ${issue}`);
        });
      });
    }

    // Show auto-fix results if any
    if (result.fixed && result.fixed.length > 0) {
      log.blank();
      log.success(`🔧 Auto-fixed ${result.fixed.length} pattern(s)`);
      result.fixed.forEach(fix => {
        log.dim(`  - ${fix}`);
      });
    }

    // Show fix suggestion if validation failed
    if (!result.passed && result.fix) {
      log.blank();
      log.white(result.fix);
    }

    // Show metrics if present
    if (result.metrics) {
      log.blank();
      log.dim(`⏱️  Duration: ${result.metrics.duration}ms`);
      log.dim(`📋 Templates checked: ${result.metrics.templatesChecked}`);
      log.dim(`🔍 Patterns validated: ${result.metrics.patternsValidated}`);
    }
  }

  return result;
}
