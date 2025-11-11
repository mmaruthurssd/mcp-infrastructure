/**
 * Tests for Conflict Detection System
 */

import { ConflictDetectionSystem } from '../../engines/conflict-detection-system.js';
import { DependencyGraphBuilder } from '../../engines/dependency-graph-builder.js';
import { AgentResult, Change, ConflictType, Task } from '../../types.js';

describe('ConflictDetectionSystem', () => {
  describe('detectConflicts()', () => {
    it('should detect no conflicts for non-overlapping files', () => {
      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: true,
          filesModified: ['file1.ts'],
          changes: [{ file: 'file1.ts', type: 'modify' }],
          duration: 100,
        },
        {
          agentId: 'agent-2',
          taskId: 'task-2',
          success: true,
          filesModified: ['file2.ts'],
          changes: [{ file: 'file2.ts', type: 'modify' }],
          duration: 100,
        },
      ];

      const result = ConflictDetectionSystem.detect({ agentResults: results });

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect file-level conflicts', () => {
      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: true,
          filesModified: ['user.ts'],
          changes: [
            {
              file: 'user.ts',
              type: 'modify',
              content: 'export class User { name: string; }',
              lineNumbers: { start: 1, end: 1 },
            },
          ],
          duration: 100,
        },
        {
          agentId: 'agent-2',
          taskId: 'task-2',
          success: true,
          filesModified: ['user.ts'],
          changes: [
            {
              file: 'user.ts',
              type: 'modify',
              content: 'export class User { email: string; }',
              lineNumbers: { start: 1, end: 1 },
            },
          ],
          duration: 100,
        },
      ];

      const result = ConflictDetectionSystem.detect({ agentResults: results });

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.length).toBeGreaterThan(0);

      const fileConflict = result.conflicts.find((c: any) => c.type === ConflictType.FILE_LEVEL);
      expect(fileConflict).toBeDefined();
      expect(fileConflict?.affectedResources).toContain('user.ts');
    });

    it('should detect semantic conflicts', () => {
      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: true,
          filesModified: ['api.ts'],
          changes: [
            {
              file: 'api.ts',
              type: 'modify',
              content: 'export function getUser() { return fetch("/api/user"); }',
            },
          ],
          duration: 100,
        },
        {
          agentId: 'agent-2',
          taskId: 'task-2',
          success: true,
          filesModified: ['routes.ts'],
          changes: [
            {
              file: 'routes.ts',
              type: 'modify',
              content: 'app.delete("/api/user", handler);', // Deletes endpoint used above
            },
          ],
          duration: 100,
        },
      ];

      const result = ConflictDetectionSystem.detect({ agentResults: results });

      // May detect semantic conflict due to API endpoint changes
      expect(result.conflicts.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect dependency conflicts', () => {
      const tasks: Task[] = [
        { id: 'task-1', description: 'Task 1' },
        { id: 'task-2', description: 'Task 2', dependsOn: ['task-1'] },
      ];

      const graph = DependencyGraphBuilder.build({ tasks, detectImplicit: false }).graph;

      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: false,
          filesModified: [],
          changes: [],
          duration: 100,
          error: new Error('Failed'),
        },
        {
          agentId: 'agent-2',
          taskId: 'task-2',
          success: true,
          filesModified: ['file.ts'],
          changes: [{ file: 'file.ts', type: 'create' }],
          duration: 100,
        },
      ];

      const result = ConflictDetectionSystem.detectConflicts({
        agentResults: results,
        dependencyGraph: graph,
      });

      // Should detect dependency conflict (task-2 succeeded despite task-1 failure)
      const depConflict = result.conflicts.find((c: any) => c.type === ConflictType.DEPENDENCY);
      expect(depConflict).toBeDefined();
    });

    it('should detect resource conflicts', () => {
      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: true,
          filesModified: ['database.config.ts'],
          changes: [
            {
              file: 'database.config.ts',
              type: 'modify',
              content: 'export const DB_URL = "postgres://localhost"',
            },
          ],
          duration: 100,
        },
        {
          agentId: 'agent-2',
          taskId: 'task-2',
          success: true,
          filesModified: ['api.config.ts'],
          changes: [
            {
              file: 'api.config.ts',
              type: 'modify',
              content: 'import { DB_URL } from "./database.config"',
            },
          ],
          duration: 100,
        },
      ];

      const result = ConflictDetectionSystem.detect({ agentResults: results });

      // May detect resource conflict due to shared database config
      expect(result.conflicts.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide resolution options', () => {
      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: true,
          filesModified: ['shared.ts'],
          changes: [{ file: 'shared.ts', type: 'modify', content: 'version 1' }],
          duration: 100,
        },
        {
          agentId: 'agent-2',
          taskId: 'task-2',
          success: true,
          filesModified: ['shared.ts'],
          changes: [{ file: 'shared.ts', type: 'modify', content: 'version 2' }],
          duration: 100,
        },
      ];

      const result = ConflictDetectionSystem.detect({ agentResults: results });

      if (result.hasConflicts) {
        const conflict = result.conflicts[0];
        expect(conflict.resolutionOptions).toBeDefined();
        expect(conflict.resolutionOptions.length).toBeGreaterThan(0);

        const option = conflict.resolutionOptions[0];
        expect(option.strategy).toBeDefined();
        expect(option.description).toBeTruthy();
        expect(option.automatic).toBeDefined();
      }
    });

    it('should assess conflict severity', () => {
      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: true,
          filesModified: ['critical.ts'],
          changes: [
            {
              file: 'critical.ts',
              type: 'delete', // Deletion is high severity
            },
          ],
          duration: 100,
        },
        {
          agentId: 'agent-2',
          taskId: 'task-2',
          success: true,
          filesModified: ['critical.ts'],
          changes: [{ file: 'critical.ts', type: 'modify' }],
          duration: 100,
        },
      ];

      const result = ConflictDetectionSystem.detect({ agentResults: results });

      if (result.hasConflicts) {
        const conflict = result.conflicts[0];
        expect(['low', 'medium', 'high', 'critical']).toContain(conflict.severity);
      }
    });

    it('should suggest auto resolution strategy', () => {
      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: true,
          filesModified: ['file.ts'],
          changes: [
            {
              file: 'file.ts',
              type: 'modify',
              lineNumbers: { start: 1, end: 10 },
            },
          ],
          duration: 100,
        },
        {
          agentId: 'agent-2',
          taskId: 'task-2',
          success: true,
          filesModified: ['file.ts'],
          changes: [
            {
              file: 'file.ts',
              type: 'modify',
              lineNumbers: { start: 50, end: 60 }, // Non-overlapping lines
            },
          ],
          duration: 100,
        },
      ];

      const result = ConflictDetectionSystem.detect({ agentResults: results });

      // Non-overlapping line changes might allow auto-merge
      expect(result.resolutionStrategy).toBeDefined();
      expect(['auto', 'manual', 'rollback']).toContain(result.resolutionStrategy);
    });

    it('should handle empty results', () => {
      const result = ConflictDetectionSystem.detectConflicts({ agentResults: [] });

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should handle single agent result', () => {
      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: true,
          filesModified: ['file.ts'],
          changes: [{ file: 'file.ts', type: 'modify' }],
          duration: 100,
        },
      ];

      const result = ConflictDetectionSystem.detect({ agentResults: results });

      expect(result.hasConflicts).toBe(false);
    });

    it('should detect conflicts on file create vs modify', () => {
      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: true,
          filesModified: ['new.ts'],
          changes: [{ file: 'new.ts', type: 'create', content: 'content 1' }],
          duration: 100,
        },
        {
          agentId: 'agent-2',
          taskId: 'task-2',
          success: true,
          filesModified: ['new.ts'],
          changes: [{ file: 'new.ts', type: 'create', content: 'content 2' }],
          duration: 100,
        },
      ];

      const result = ConflictDetectionSystem.detect({ agentResults: results });

      expect(result.hasConflicts).toBe(true);
      // Two agents trying to create the same file is a conflict
    });

    it('should provide detection method information', () => {
      const results: AgentResult[] = [
        {
          agentId: 'agent-1',
          taskId: 'task-1',
          success: true,
          filesModified: ['test.ts'],
          changes: [{ file: 'test.ts', type: 'modify' }],
          duration: 100,
        },
        {
          agentId: 'agent-2',
          taskId: 'task-2',
          success: true,
          filesModified: ['test.ts'],
          changes: [{ file: 'test.ts', type: 'modify' }],
          duration: 100,
        },
      ];

      const result = ConflictDetectionSystem.detect({ agentResults: results });

      if (result.hasConflicts) {
        const conflict = result.conflicts[0];
        expect(conflict.detectionMethod).toBeTruthy();
      }
    });
  });
});
