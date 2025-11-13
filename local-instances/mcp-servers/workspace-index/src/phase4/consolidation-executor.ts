import * as path from 'path';
import { ConfigurableWorkspaceAdapter } from '../adapters/workspace-adapter.js';
import { BackupManager, BackupResult } from './backup-manager.js';
import {
  HierarchicalStrategy,
  SplitByAudienceStrategy,
  MergeAndRedirectStrategy,
  IConsolidationStrategy,
  ConsolidationStrategyType,
  ConsolidationPlan,
  ConsolidationResult
} from './consolidation-strategies/index.js';
import { OperationResult, OperationChange, OperationValidation } from './types.js';

/**
 * Execution options for consolidation
 */
export interface ConsolidationExecutionOptions {
  /** Run in dry-run mode (no actual changes) */
  dryRun?: boolean;

  /** Create backup before execution */
  createBackup?: boolean;

  /** Strategy to use */
  strategy: ConsolidationStrategyType;

  /** Files to consolidate */
  files: string[];

  /** Overlap analysis data */
  overlaps?: any[];

  /** Reason for consolidation (for audit trail) */
  reason?: string;
}

/**
 * Consolidation execution result with full audit trail
 */
export interface ConsolidationExecutionResult extends OperationResult {
  backupPath?: string;
  consolidationResult?: ConsolidationResult;
  plan?: ConsolidationPlan;
}

/**
 * ConsolidationExecutor - Orchestrates the entire consolidation workflow
 *
 * Workflow:
 * 1. Create backup (if enabled)
 * 2. Select and initialize strategy
 * 3. Generate consolidation plan
 * 4. Execute strategy (with dry-run support)
 * 5. Validate results
 * 6. Create audit trail
 * 7. Support rollback if needed
 */
export class ConsolidationExecutor {
  private adapter: ConfigurableWorkspaceAdapter;
  private backupManager: BackupManager;
  private strategies: Map<ConsolidationStrategyType, IConsolidationStrategy>;

  constructor(adapter: ConfigurableWorkspaceAdapter) {
    this.adapter = adapter;
    this.backupManager = new BackupManager(adapter);

    // Initialize all available strategies
    this.strategies = new Map<ConsolidationStrategyType, IConsolidationStrategy>([
      ['hierarchical', new HierarchicalStrategy(adapter)],
      ['split-by-audience', new SplitByAudienceStrategy(adapter)],
      ['merge-and-redirect', new MergeAndRedirectStrategy(adapter)]
    ] as Array<[ConsolidationStrategyType, IConsolidationStrategy]>);
  }

  /**
   * Execute consolidation with full workflow
   */
  async execute(options: ConsolidationExecutionOptions): Promise<ConsolidationExecutionResult> {
    const startTime = Date.now();
    const changes: OperationChange[] = [];
    let backupPath: string | undefined;

    try {
      console.error(`[ConsolidationExecutor] Starting ${options.strategy} consolidation...`);
      console.error(`[ConsolidationExecutor]   Files: ${options.files.length}`);
      console.error(`[ConsolidationExecutor]   Dry run: ${options.dryRun || false}`);
      console.error(`[ConsolidationExecutor]   Create backup: ${options.createBackup !== false}`);

      // Step 1: Create backup (unless explicitly disabled or dry-run)
      if (options.createBackup !== false && !options.dryRun) {
        console.error(`[ConsolidationExecutor] Creating backup...`);
        const backupResult = await this.backupManager.createBackup(
          options.files,
          `consolidation-${options.strategy}`,
          options.reason || 'Documentation consolidation'
        );

        if (!backupResult.success) {
          throw new Error(`Backup failed: ${backupResult.error}`);
        }

        backupPath = backupResult.backupPath;
        console.error(`[ConsolidationExecutor] Backup created: ${backupPath}`);
      }

      // Step 2: Get strategy instance
      const strategy = this.strategies.get(options.strategy);
      if (!strategy) {
        throw new Error(`Unknown strategy: ${options.strategy}`);
      }

      // Step 3: Generate consolidation plan
      console.error(`[ConsolidationExecutor] Analyzing files and generating plan...`);
      const plan = await strategy.analyze(options.files, options.overlaps || []);

      console.error(`[ConsolidationExecutor] Plan generated:`);
      console.error(`[ConsolidationExecutor]   Primary: ${plan.primaryFile}`);
      console.error(`[ConsolidationExecutor]   Modifications: ${plan.filesToModify.length}`);
      console.error(`[ConsolidationExecutor]   Est. line reduction: ${plan.estimatedLineReduction}`);

      if (plan.warnings.length > 0) {
        console.error(`[ConsolidationExecutor] Warnings:`);
        plan.warnings.forEach(w => console.error(`[ConsolidationExecutor]   ⚠️  ${w}`));
      }

      // Step 4: Execute strategy
      console.error(`[ConsolidationExecutor] Executing consolidation...`);
      const consolidationResult = await strategy.execute(plan, options.dryRun || false);

      if (!consolidationResult.success) {
        throw new Error(`Consolidation failed: ${consolidationResult.error}`);
      }

      console.error(`[ConsolidationExecutor] Consolidation complete:`);
      console.error(`[ConsolidationExecutor]   Files changed: ${consolidationResult.changedFiles.length}`);
      console.error(`[ConsolidationExecutor]   Lines removed: ${consolidationResult.linesRemoved}`);

      // Step 5: Build changes list for result
      for (const changedFile of consolidationResult.changedFiles) {
        changes.push({
          type: 'modified',
          path: changedFile,
          preview: `Modified by ${options.strategy} strategy`
        });
      }

      // Step 6: Validate results (unless dry-run)
      let validation: OperationValidation;
      if (options.dryRun) {
        validation = {
          syntaxValid: true,
          linksValid: true,
          errors: [],
          warnings: ['Dry run - validation skipped']
        };
      } else {
        console.error(`[ConsolidationExecutor] Validating results...`);
        validation = await this.validateConsolidation(consolidationResult.changedFiles);

        if (!validation.syntaxValid || !validation.linksValid) {
          console.error(`[ConsolidationExecutor] Validation issues detected:`);
          validation.errors.forEach(e => console.error(`[ConsolidationExecutor]   ❌ ${e}`));
          validation.warnings.forEach(w => console.error(`[ConsolidationExecutor]   ⚠️  ${w}`));
        }
      }

      // Step 7: Build final result
      const duration = Date.now() - startTime;
      console.error(`[ConsolidationExecutor] Completed in ${duration}ms`);

      return {
        executed: !options.dryRun,
        dryRun: options.dryRun || false,
        approved: true, // Always approved if we got here
        operation: 'consolidate',
        changes,
        backupPath,
        validation,
        consolidationResult,
        plan,
        auditTrail: {
          timestamp: new Date().toISOString(),
          confidence: 0.85, // Default confidence for manual execution
          approvedBy: 'user',
          outcome: 'success',
          context: {
            strategy: options.strategy,
            filesProcessed: options.files.length,
            linesRemoved: consolidationResult.linesRemoved,
            durationMs: duration
          }
        }
      };
    } catch (error) {
      console.error(`[ConsolidationExecutor] Execution failed:`, error);

      // If we created a backup and execution failed, offer to restore
      if (backupPath && !options.dryRun) {
        console.error(`[ConsolidationExecutor] Backup available for rollback: ${backupPath}`);
      }

      return {
        executed: false,
        dryRun: options.dryRun || false,
        approved: true,
        operation: 'consolidate',
        changes,
        backupPath,
        validation: {
          syntaxValid: false,
          linksValid: false,
          errors: [error instanceof Error ? error.message : String(error)],
          warnings: []
        },
        auditTrail: {
          timestamp: new Date().toISOString(),
          confidence: 0.0,
          approvedBy: 'user',
          outcome: 'failed',
          context: {
            strategy: options.strategy,
            error: error instanceof Error ? error.message : String(error)
          }
        },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Rollback consolidation using backup
   */
  async rollback(backupPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.error(`[ConsolidationExecutor] Rolling back consolidation...`);
      console.error(`[ConsolidationExecutor]   Backup: ${backupPath}`);

      const restoreResult = await this.backupManager.restoreBackup(backupPath);

      if (!restoreResult.success) {
        throw new Error(`Restore failed: ${restoreResult.error}`);
      }

      console.error(`[ConsolidationExecutor] Rollback complete: ${restoreResult.filesRestored} files restored`);

      return { success: true };
    } catch (error) {
      console.error(`[ConsolidationExecutor] Rollback failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Preview consolidation without executing
   */
  async preview(
    strategy: ConsolidationStrategyType,
    files: string[],
    overlaps?: any[]
  ): Promise<ConsolidationPlan> {
    const strategyInstance = this.strategies.get(strategy);
    if (!strategyInstance) {
      throw new Error(`Unknown strategy: ${strategy}`);
    }

    return await strategyInstance.analyze(files, overlaps || []);
  }

  /**
   * Validate consolidation results
   */
  private async validateConsolidation(changedFiles: string[]): Promise<OperationValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let syntaxValid = true;
    let linksValid = true;

    // Basic validation - check files exist and are valid markdown
    for (const file of changedFiles) {
      const absolutePath = path.join(this.adapter.getWorkspaceRoot(), file);

      try {
        const fs = await import('fs/promises');
        await fs.access(absolutePath);

        // Basic syntax check - file should be readable
        const content = await fs.readFile(absolutePath, 'utf-8');

        // Check for common markdown syntax issues
        if (content.includes('](]') || content.includes('[](')) {
          errors.push(`${file}: Invalid markdown link syntax detected`);
          syntaxValid = false;
        }

        // Check for broken internal links (basic check)
        const linkMatches = content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
        for (const match of linkMatches) {
          const linkPath = match[2];
          if (linkPath.startsWith('#')) {
            // Section link - basic check for header existence
            const header = linkPath.substring(1);
            const normalizedHeader = header.toLowerCase().replace(/[-_]/g, '');
            const contentLower = content.toLowerCase();

            if (!contentLower.includes(normalizedHeader.substring(0, 20))) {
              warnings.push(`${file}: Potential broken section link: ${linkPath}`);
            }
          }
        }
      } catch (error) {
        errors.push(`${file}: File validation failed - ${error}`);
        syntaxValid = false;
      }
    }

    return {
      syntaxValid,
      linksValid,
      errors,
      warnings
    };
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<Array<{ path: string; metadata: any }>> {
    return await this.backupManager.listBackups();
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies(): ConsolidationStrategyType[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get strategy description
   */
  getStrategyDescription(strategy: ConsolidationStrategyType): string {
    const instance = this.strategies.get(strategy);
    return instance ? instance.getDescription() : 'Unknown strategy';
  }
}
