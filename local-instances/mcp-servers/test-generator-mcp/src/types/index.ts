// Core type definitions for test-generator-mcp

export interface GenerateUnitTestsParams {
  sourceFile: string;
  targetFile?: string;
  framework?: 'jest' | 'mocha' | 'vitest';
  coverage?: 'basic' | 'comprehensive' | 'edge-cases';
  functions?: string[];
}

export interface GenerateUnitTestsResult {
  success: boolean;
  testFilePath: string;
  testsGenerated: number;
  functionsAnalyzed: string[];
  coverageEstimate: number;
  generatedCode: string;
  warnings?: string[];
  error?: string;
}

export interface GenerateIntegrationTestsParams {
  targetModule: string;
  apiSpec?: string;
  framework?: 'jest' | 'supertest';
  scenarios?: TestScenario[];
  includeSetup?: boolean;
}

export interface TestScenario {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  expectedStatus: number;
  body?: any;
}

export interface GenerateIntegrationTestsResult {
  success: boolean;
  testFilePath: string;
  testsGenerated: number;
  scenariosCovered: string[];
  setupIncluded: boolean;
  generatedCode: string;
  warnings?: string[];
  error?: string;
}

export interface AnalyzeCoverageGapsParams {
  projectPath: string;
  coverageFile?: string;
  threshold?: number;
  reportFormat?: 'summary' | 'detailed' | 'file-by-file';
  excludePatterns?: string[];
}

export interface CoverageMetrics {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export interface UncoveredFile {
  path: string;
  coverage: number;
  priority: 'high' | 'medium' | 'low';
  uncoveredLines: number[];
  uncoveredFunctions: string[];
}

export interface CoverageRecommendation {
  file: string;
  reason: string;
  estimatedTests: number;
}

export interface AnalyzeCoverageGapsResult {
  success: boolean;
  overallCoverage: CoverageMetrics;
  uncoveredFiles: UncoveredFile[];
  recommendations: CoverageRecommendation[];
  meetsThreshold: boolean;
  error?: string;
}

export interface SuggestTestScenariosParams {
  sourceFile: string;
  context?: string;
  scenarioTypes?: ScenarioType[];
  maxSuggestions?: number;
}

export type ScenarioType = 'happy-path' | 'edge-cases' | 'error-handling' | 'boundary-conditions' | 'security';

export interface TestSuggestion {
  type: ScenarioType;
  description: string;
  functionName: string;
  inputs: any[];
  expectedOutput: any;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface SuggestTestScenariosResult {
  success: boolean;
  scenarios: TestSuggestion[];
  totalSuggestions: number;
  error?: string;
}

// AST Analysis types
export interface FunctionInfo {
  name: string;
  params: ParameterInfo[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
  docComment?: string;
}

export interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: any;
}

export interface ClassInfo {
  name: string;
  methods: FunctionInfo[];
  properties: PropertyInfo[];
  isExported: boolean;
}

export interface PropertyInfo {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'protected';
}

// Template types
export interface TestCase {
  description: string;
  arrange: string[];
  inputs: string;
  assertion: string;
}

export interface UnitTestTemplate {
  functionName: string;
  sourcePath: string;
  testCases: TestCase[];
}

export interface IntegrationTestTemplate {
  apiName: string;
  appPath: string;
  setupCode: string;
  teardownCode: string;
  endpoints: EndpointTest[];
}

export interface EndpointTest {
  method: string;
  path: string;
  expectedBehavior: string;
  status: number;
  body?: any;
  assertions: string;
}
