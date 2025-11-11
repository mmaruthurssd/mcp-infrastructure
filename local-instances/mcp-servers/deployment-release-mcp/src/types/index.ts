/**
 * Deployment & Release MCP - Type Definitions
 */

export type Environment = 'dev' | 'staging' | 'production';

export type DeploymentStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'rolled-back';

export interface DeploymentConfig {
  environment: Environment;
  buildCommand?: string;
  deployCommand?: string;
  healthCheckUrl?: string;
  healthCheckTimeout?: number;
  preDeployTests?: boolean;
  rollbackOnFailure?: boolean;
}

export interface DeploymentResult {
  success: boolean;
  environment: Environment;
  version: string;
  timestamp: string;
  duration?: number;
  artifacts?: string[];
  healthCheck?: HealthCheckResult;
  error?: string;
}

export interface RollbackResult {
  success: boolean;
  environment: Environment;
  fromVersion: string;
  toVersion: string;
  timestamp: string;
  stateRestored: boolean;
  error?: string;
}

export interface HealthCheckResult {
  healthy: boolean;
  responseTime?: number;
  statusCode?: number;
  checks: {
    name: string;
    passed: boolean;
    message?: string;
  }[];
}

export interface ReleaseNotes {
  version: string;
  date: string;
  changes: {
    type: 'feature' | 'fix' | 'breaking' | 'docs' | 'refactor';
    description: string;
    commit?: string;
  }[];
  contributors?: string[];
}

export interface DeploymentVersion {
  version: string;
  timestamp: string;
  environment: Environment;
  commit?: string;
  artifacts: string[];
  stateSnapshot?: string;
}

export interface ValidationResult {
  passed: boolean;
  checks: {
    name: string;
    passed: boolean;
    severity: 'error' | 'warning' | 'info';
    message: string;
  }[];
}
