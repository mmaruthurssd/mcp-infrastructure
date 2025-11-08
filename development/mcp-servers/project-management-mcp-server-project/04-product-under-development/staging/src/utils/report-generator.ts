// Report generator stubs
export interface ReviewReport {
  summary: string;
}
export function generateReviewReport(data: any): ReviewReport { return { summary: '' }; }
export function formatReviewReport(report: ReviewReport): string { return report.summary; }
