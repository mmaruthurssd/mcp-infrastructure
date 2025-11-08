#!/usr/bin/env node
/**
 * Project Management MCP Server
 *
 * MCP server for AI-assisted project planning and goal workflow management.
 * Combines project initialization tools with ongoing goal management.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
// Phase 1-2 Tools
import { EvaluateGoalTool } from './tools/evaluate-goal.js';
import { CreatePotentialGoalTool } from './tools/create-potential-goal.js';
import { PromoteToSelectedTool } from './tools/promote-to-selected.js';
// Phase 3 Tools
import { ExtractIdeasTool } from './tools/extract-ideas.js';
import { ViewGoalsDashboardTool } from './tools/view-goals-dashboard.js';
import { ReorderSelectedGoalsTool } from './tools/reorder-selected-goals.js';
import { UpdateGoalProgressTool } from './tools/update-goal-progress.js';
// Phase 4 Tools
import { ArchiveGoalTool } from './tools/archive-goal.js';
import { CheckReviewNeededTool } from './tools/check-review-needed.js';
import { GenerateReviewReportTool } from './tools/generate-review-report.js';
// Phase 5 Tools
import { GenerateGoalsDiagramTool } from './tools/generate-goals-diagram.js';
// Phase 6 Tools (Project Setup)
import { StartProjectSetupTool } from './tools/start-project-setup.js';
import { ContinueProjectSetupTool } from './tools/continue-project-setup.js';
import { ExtractProjectGoalsTool } from './tools/extract-project-goals.js';
import { GenerateProjectConstitutionTool } from './tools/generate-project-constitution.js';
import { GenerateInitialRoadmapTool } from './tools/generate-initial-roadmap.js';
import { IdentifyResourcesAndAssetsTool } from './tools/identify-resources-and-assets.js';
import { IdentifyStakeholdersTool } from './tools/identify-stakeholders.js';
import { FinalizeProjectSetupTool } from './tools/finalize-project-setup.js';
// Phase 7 Tools (Migration)
import { MigrateExistingProjectTool } from './tools/migrate-existing-project.js';
import { ConfirmMigrationTool } from './tools/confirm-migration.js';
// Phase 8 Tools (Validation)
import { ValidateProjectTool } from './tools/validate-project.js';
// Phase 9 Tools (Orchestration)
import { InitializeProjectOrchestrationTool } from './tools/initialize-project-orchestration.js';
import { GetNextStepsTool } from './tools/get-next-steps.js';
import { AdvanceWorkflowPhaseTool } from './tools/advance-workflow-phase.js';
import { GetProjectStatusTool } from './tools/get-project-status.js';
import { ValidateProjectReadinessTool } from './tools/validate-project-readiness.js';
import { GenerateCompletionChecklistTool } from './tools/generate-completion-checklist.js';
import { WrapUpProjectTool } from './tools/wrap-up-project.js';
import { PrepareSpecHandoffTool } from './tools/prepare-spec-handoff.js';
import { PrepareTaskExecutorHandoffTool } from './tools/prepare-task-executor-handoff.js';
// Phase 10 Tools (Component-Driven Framework v3.0)
import { CreateComponentTool } from './tools/create-component.js';
import { UpdateComponentTool } from './tools/update-component.js';
import { MoveComponentTool } from './tools/move-component.js';
import { SplitComponentTool } from './tools/split-component.js';
import { MergeComponentsTool } from './tools/merge-components.js';
import { ComponentToGoalTool } from './tools/component-to-goal.js';
class AIPlanningMCPServer {
    server;
    constructor() {
        this.server = new Server({
            name: 'project-management-mcp-server',
            version: '0.9.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
        // Error handling
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    // Phase 6: Project Setup (8 tools)
                    StartProjectSetupTool.getToolDefinition(),
                    ContinueProjectSetupTool.getToolDefinition(),
                    ExtractProjectGoalsTool.getToolDefinition(),
                    GenerateProjectConstitutionTool.getToolDefinition(),
                    GenerateInitialRoadmapTool.getToolDefinition(),
                    IdentifyResourcesAndAssetsTool.getToolDefinition(),
                    IdentifyStakeholdersTool.getToolDefinition(),
                    FinalizeProjectSetupTool.getToolDefinition(),
                    // Phase 7: Migration (2 tools)
                    MigrateExistingProjectTool.getToolDefinition(),
                    ConfirmMigrationTool.getToolDefinition(),
                    // Phase 1-2: Goal Evaluation & Creation (3 tools)
                    EvaluateGoalTool.getToolDefinition(),
                    CreatePotentialGoalTool.getToolDefinition(),
                    PromoteToSelectedTool.getToolDefinition(),
                    // Phase 3: Goal Management (4 tools)
                    ExtractIdeasTool.getToolDefinition(),
                    ViewGoalsDashboardTool.getToolDefinition(),
                    ReorderSelectedGoalsTool.getToolDefinition(),
                    UpdateGoalProgressTool.getToolDefinition(),
                    // Phase 4: Review & Archive (3 tools)
                    ArchiveGoalTool.getToolDefinition(),
                    CheckReviewNeededTool.getToolDefinition(),
                    GenerateReviewReportTool.getToolDefinition(),
                    // Phase 5: Visualization (1 tool)
                    GenerateGoalsDiagramTool.getToolDefinition(),
                    // Phase 8: Validation (1 tool)
                    ValidateProjectTool.getToolDefinition(),
                    // Phase 9: Orchestration (9 tools)
                    InitializeProjectOrchestrationTool.getToolDefinition(),
                    GetNextStepsTool.getToolDefinition(),
                    AdvanceWorkflowPhaseTool.getToolDefinition(),
                    GetProjectStatusTool.getToolDefinition(),
                    ValidateProjectReadinessTool.getToolDefinition(),
                    GenerateCompletionChecklistTool.getToolDefinition(),
                    WrapUpProjectTool.getToolDefinition(),
                    PrepareSpecHandoffTool.getToolDefinition(),
                    PrepareTaskExecutorHandoffTool.getToolDefinition(),
                    // Phase 10: Component-Driven Framework v3.0 (6 tools)
                    CreateComponentTool.getToolDefinition(),
                    UpdateComponentTool.getToolDefinition(),
                    MoveComponentTool.getToolDefinition(),
                    SplitComponentTool.getToolDefinition(),
                    MergeComponentsTool.getToolDefinition(),
                    ComponentToGoalTool.getToolDefinition(),
                ],
            };
        });
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                let result;
                switch (name) {
                    // Phase 6: Project Setup Tools
                    case 'start_project_setup':
                        result = StartProjectSetupTool.execute(args);
                        break;
                    case 'continue_project_setup':
                        result = ContinueProjectSetupTool.execute(args);
                        break;
                    case 'extract_project_goals':
                        result = ExtractProjectGoalsTool.execute(args);
                        break;
                    case 'generate_project_constitution':
                        result = GenerateProjectConstitutionTool.execute(args);
                        break;
                    case 'generate_initial_roadmap':
                        result = GenerateInitialRoadmapTool.execute(args);
                        break;
                    case 'identify_resources_and_assets':
                        result = IdentifyResourcesAndAssetsTool.execute(args);
                        break;
                    case 'identify_stakeholders':
                        result = IdentifyStakeholdersTool.execute(args);
                        break;
                    case 'finalize_project_setup':
                        result = FinalizeProjectSetupTool.execute(args);
                        break;
                    // Phase 7: Migration Tools
                    case 'migrate_existing_project':
                        result = MigrateExistingProjectTool.execute(args);
                        break;
                    case 'confirm_migration':
                        result = ConfirmMigrationTool.execute(args);
                        break;
                    // Phase 1-2: Goal Evaluation & Creation Tools
                    case 'evaluate_goal':
                        const evaluationResult = await EvaluateGoalTool.execute(args);
                        result = {
                            ...evaluationResult,
                            formatted: EvaluateGoalTool.formatResult(evaluationResult)
                        };
                        break;
                    case 'create_potential_goal':
                        const createResult = CreatePotentialGoalTool.execute(args);
                        result = {
                            ...createResult,
                            formatted: CreatePotentialGoalTool.formatResult(createResult)
                        };
                        break;
                    case 'promote_to_selected':
                        const promoteResult = PromoteToSelectedTool.execute(args);
                        result = {
                            ...promoteResult,
                            formatted: PromoteToSelectedTool.formatResult(promoteResult)
                        };
                        break;
                    case 'extract_ideas':
                        const extractResult = ExtractIdeasTool.execute(args);
                        result = {
                            ...extractResult,
                            formatted: ExtractIdeasTool.formatResult(extractResult)
                        };
                        break;
                    case 'view_goals_dashboard':
                        const dashboardResult = ViewGoalsDashboardTool.execute(args);
                        result = {
                            ...dashboardResult,
                            formatted: ViewGoalsDashboardTool.formatResult(dashboardResult)
                        };
                        break;
                    case 'reorder_selected_goals':
                        const reorderResult = ReorderSelectedGoalsTool.execute(args);
                        result = {
                            ...reorderResult,
                            formatted: ReorderSelectedGoalsTool.formatResult(reorderResult)
                        };
                        break;
                    case 'update_goal_progress':
                        const progressResult = UpdateGoalProgressTool.execute(args);
                        result = {
                            ...progressResult,
                            formatted: UpdateGoalProgressTool.formatResult(progressResult)
                        };
                        break;
                    case 'archive_goal':
                        const archiveResult = ArchiveGoalTool.execute(args);
                        result = {
                            ...archiveResult,
                            formatted: ArchiveGoalTool.formatResult(archiveResult)
                        };
                        break;
                    case 'check_review_needed':
                        const reviewCheckResult = CheckReviewNeededTool.execute(args);
                        result = {
                            ...reviewCheckResult,
                            formatted: CheckReviewNeededTool.formatResult(reviewCheckResult)
                        };
                        break;
                    case 'generate_review_report':
                        const reportResult = GenerateReviewReportTool.execute(args);
                        result = {
                            ...reportResult,
                            formatted: GenerateReviewReportTool.formatResult(reportResult)
                        };
                        break;
                    case 'generate_goals_diagram':
                        const diagramResult = GenerateGoalsDiagramTool.execute(args);
                        result = {
                            ...diagramResult,
                            formatted: GenerateGoalsDiagramTool.formatResult(diagramResult)
                        };
                        break;
                    case 'validate_project':
                        const validateResult = ValidateProjectTool.execute(args);
                        result = {
                            ...validateResult,
                            formatted: ValidateProjectTool.formatResult(validateResult)
                        };
                        break;
                    case 'initialize_project_orchestration':
                        const initOrchResult = InitializeProjectOrchestrationTool.execute(args);
                        result = {
                            ...initOrchResult,
                            formatted: InitializeProjectOrchestrationTool.formatResult(initOrchResult)
                        };
                        break;
                    case 'get_next_steps':
                        const nextStepsResult = GetNextStepsTool.execute(args);
                        result = {
                            ...nextStepsResult,
                            formatted: GetNextStepsTool.formatResult(nextStepsResult)
                        };
                        break;
                    case 'advance_workflow_phase':
                        const advanceResult = AdvanceWorkflowPhaseTool.execute(args);
                        result = {
                            ...advanceResult,
                            formatted: AdvanceWorkflowPhaseTool.formatResult(advanceResult)
                        };
                        break;
                    case 'get_project_status':
                        const statusResult = GetProjectStatusTool.execute(args);
                        result = {
                            ...statusResult,
                            formatted: GetProjectStatusTool.formatResult(statusResult)
                        };
                        break;
                    case 'validate_project_readiness':
                        const readinessResult = ValidateProjectReadinessTool.execute(args);
                        result = {
                            ...readinessResult,
                            formatted: ValidateProjectReadinessTool.formatResult(readinessResult)
                        };
                        break;
                    case 'generate_completion_checklist':
                        const checklistResult = GenerateCompletionChecklistTool.execute(args);
                        result = {
                            ...checklistResult,
                            formatted: GenerateCompletionChecklistTool.formatResult(checklistResult)
                        };
                        break;
                    case 'wrap_up_project':
                        const wrapUpResult = WrapUpProjectTool.execute(args);
                        result = {
                            ...wrapUpResult,
                            formatted: WrapUpProjectTool.formatResult(wrapUpResult)
                        };
                        break;
                    case 'prepare_spec_handoff':
                        const specHandoffResult = PrepareSpecHandoffTool.execute(args);
                        result = {
                            ...specHandoffResult,
                            formatted: PrepareSpecHandoffTool.formatResult(specHandoffResult)
                        };
                        break;
                    case 'prepare_task_executor_handoff':
                        const taskHandoffResult = await PrepareTaskExecutorHandoffTool.execute(args);
                        result = {
                            ...taskHandoffResult,
                            formatted: PrepareTaskExecutorHandoffTool.formatResult(taskHandoffResult)
                        };
                        break;
                    // Phase 10: Component-Driven Framework v3.0 Tools
                    case 'create_component':
                        result = CreateComponentTool.execute(args);
                        break;
                    case 'update_component':
                        result = UpdateComponentTool.execute(args);
                        break;
                    case 'move_component':
                        result = MoveComponentTool.execute(args);
                        break;
                    case 'split_component':
                        result = SplitComponentTool.execute(args);
                        break;
                    case 'merge_components':
                        result = MergeComponentsTool.execute(args);
                        break;
                    case 'component_to_goal':
                        result = ComponentToGoalTool.execute(args);
                        break;
                    default:
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        error: `Unknown tool: ${name}`,
                                    }),
                                },
                            ],
                            isError: true,
                        };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                error: String(error),
                            }),
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Project Management MCP Server running on stdio');
    }
}
const server = new AIPlanningMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=server.js.map