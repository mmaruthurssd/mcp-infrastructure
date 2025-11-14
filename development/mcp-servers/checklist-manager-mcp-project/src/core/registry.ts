/**
 * Registry Manager
 * Handles the central checklist registry (JSON file storage)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type {
  Registry,
  Checklist,
  ChecklistType,
  ChecklistStatus,
} from '../types/index.js';

export class RegistryManager {
  private registryPath: string;

  constructor() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const registryDir = path.join(homeDir, '.checklist-manager');
    this.registryPath = path.join(registryDir, 'registry.json');
    this.ensureRegistryExists();
  }

  /**
   * Load registry from disk
   */
  private load(): Registry {
    if (!fs.existsSync(this.registryPath)) {
      return this.createEmpty();
    }

    const content = fs.readFileSync(this.registryPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Save registry to disk
   */
  private save(registry: Registry): void {
    registry.lastUpdated = new Date().toISOString();
    const dir = path.dirname(this.registryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      this.registryPath,
      JSON.stringify(registry, null, 2),
      'utf-8'
    );
  }

  /**
   * Generate unique checklist ID
   */
  private generateId(checklistPath: string): string {
    const timestamp = Date.now();
    const hash = crypto
      .createHash('md5')
      .update(checklistPath + timestamp)
      .digest('hex')
      .substring(0, 8);
    return `checklist-${hash}`;
  }

  /**
   * Add checklist to registry (idempotent)
   */
  add(checklist: Omit<Checklist, 'id' | 'created'>): Checklist {
    const registry = this.load();

    // Check if already registered (by path)
    const existing = registry.checklists.find((c) => c.path === checklist.path);

    if (existing) {
      // Update existing entry
      const index = registry.checklists.indexOf(existing);
      registry.checklists[index] = {
        ...existing,
        ...checklist,
        lastUpdated: new Date().toISOString(),
      };
      this.save(registry);
      return registry.checklists[index];
    }

    // Create new entry
    const newChecklist: Checklist = {
      ...checklist,
      id: this.generateId(checklist.path),
      created: new Date().toISOString(),
    };

    registry.checklists.push(newChecklist);
    this.save(registry);

    return newChecklist;
  }

  /**
   * Get checklist by ID
   */
  getById(id: string): Checklist | null {
    const registry = this.load();
    return registry.checklists.find((c) => c.id === id) || null;
  }

  /**
   * Get checklist by path
   */
  getByPath(checklistPath: string): Checklist | null {
    const registry = this.load();
    return registry.checklists.find((c) => c.path === checklistPath) || null;
  }

  /**
   * Get all checklists (with optional filters)
   */
  getAll(filters?: {
    type?: ChecklistType;
    status?: ChecklistStatus;
  }): Checklist[] {
    const registry = this.load();
    let checklists = registry.checklists;

    if (filters?.type) {
      checklists = checklists.filter((c) => c.type === filters.type);
    }

    if (filters?.status) {
      checklists = checklists.filter((c) => c.status === filters.status);
    }

    return checklists;
  }

  /**
   * Update checklist in registry
   */
  update(id: string, updates: Partial<Checklist>): Checklist {
    const registry = this.load();
    const index = registry.checklists.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error(`Checklist not found: ${id}`);
    }

    registry.checklists[index] = {
      ...registry.checklists[index],
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    this.save(registry);
    return registry.checklists[index];
  }

  /**
   * Remove checklist from registry
   */
  remove(id: string): void {
    const registry = this.load();
    registry.checklists = registry.checklists.filter((c) => c.id !== id);
    this.save(registry);
  }

  /**
   * Ensure registry directory and file exist
   */
  private ensureRegistryExists(): void {
    const dir = path.dirname(this.registryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.registryPath)) {
      this.save(this.createEmpty());
    }
  }

  /**
   * Create empty registry
   */
  private createEmpty(): Registry {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      checklists: [],
    };
  }
}
