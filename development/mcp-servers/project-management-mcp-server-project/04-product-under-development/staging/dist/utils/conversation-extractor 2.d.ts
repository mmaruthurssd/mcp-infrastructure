/**
 * Information extraction from conversation responses
 *
 * Uses pattern matching and NLP techniques to extract structured data
 * from natural language user responses
 */
import { ExtractedProjectData } from '../tools/create-project-overview.js';
/**
 * Extract information from user response based on question context
 */
export declare function extractFromResponse(questionId: string, userResponse: string, currentData: Partial<ExtractedProjectData>): Partial<ExtractedProjectData>;
/**
 * Generate summary of extracted data for confirmation
 */
export declare function generateExtractionSummary(data: Partial<ExtractedProjectData>): string;
//# sourceMappingURL=conversation-extractor%202.d.ts.map