/**
 * Generate Project Overview
 *
 * MCP Tool: Generates PROJECT OVERVIEW.md from conversation data
 *
 * Created: 2025-10-27
 * Goal: 004 - Build PROJECT OVERVIEW Generation Tool
 */
import { ExtractedInformation } from '../utils/information-extraction';
import { ProjectOverview } from '../types/hierarchical-entities';
export interface GenerateProjectOverviewInput {
    projectPath: string;
    conversationId: string;
    overrideData?: Partial<ExtractedInformation>;
    dryRun?: boolean;
}
export interface GenerateProjectOverviewOutput {
    success: boolean;
    projectOverviewPath?: string;
    previewContent?: string;
    projectOverview?: ProjectOverview;
    confidence: number;
    warnings: string[];
    error?: string;
}
/**
 * Generate PROJECT OVERVIEW.md from conversation data
 */
export declare function generateProjectOverview(input: GenerateProjectOverviewInput): Promise<GenerateProjectOverviewOutput>;
export interface ApproveProjectOverviewInput {
    projectPath: string;
    conversationId: string;
    action: 'approve' | 'refine' | 'manual';
    refinementNotes?: string;
}
export interface ApproveProjectOverviewOutput {
    success: boolean;
    action: string;
    projectOverviewPath?: string;
    nextStep?: string;
    error?: string;
}
/**
 * Handle user approval/refinement of PROJECT OVERVIEW
 */
export declare function approveProjectOverview(input: ApproveProjectOverviewInput): Promise<ApproveProjectOverviewOutput>;
//# sourceMappingURL=generate-project-overview.d.ts.map