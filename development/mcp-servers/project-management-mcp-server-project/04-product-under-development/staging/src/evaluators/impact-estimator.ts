/**
 * Impact Estimator
 *
 * Estimates the impact of a goal based on various factors.
 */

export interface ImpactEstimate {
  level: 'High' | 'Medium' | 'Low';
  score: number; // 0-100 impact score
  confidence: 'High' | 'Medium' | 'Low';
  factors: {
    people_affected: number;
    problem_severity: 'High' | 'Medium' | 'Low';
    business_value: 'High' | 'Medium' | 'Low';
    strategic_value: 'High' | 'Medium' | 'Low';
  };
  reasoning: string;
}

export class ImpactEstimator {
  /**
   * Estimate impact of a goal
   */
  static estimate(
    goalDescription: string,
    context?: string,
    projectType?: string
  ): ImpactEstimate {
    const description = goalDescription.toLowerCase();
    const contextStr = (context || '').toLowerCase();

    // Analyze keywords for impact signals
    const highImpactKeywords = ['critical', 'urgent', 'patient', 'security', 'data loss', 'compliance', 'hipaa'];
    const mediumImpactKeywords = ['improve', 'optimize', 'enhance', 'streamline', 'automate'];
    const lowImpactKeywords = ['nice to have', 'cosmetic', 'minor', 'optional'];

    const hasHighImpact = highImpactKeywords.some(kw => description.includes(kw) || contextStr.includes(kw));
    const hasMediumImpact = mediumImpactKeywords.some(kw => description.includes(kw) || contextStr.includes(kw));
    const hasLowImpact = lowImpactKeywords.some(kw => description.includes(kw) || contextStr.includes(kw));

    // Estimate people affected
    let peopleAffected = 5; // default
    if (description.includes('all') || description.includes('everyone')) {
      peopleAffected = 50;
    } else if (description.includes('team') || description.includes('staff')) {
      peopleAffected = 10;
    } else if (description.includes('one') || description.includes('single')) {
      peopleAffected = 1;
    }

    // Determine impact level
    let level: 'High' | 'Medium' | 'Low';
    let problemSeverity: 'High' | 'Medium' | 'Low';
    let businessValue: 'High' | 'Medium' | 'Low';
    let strategicValue: 'High' | 'Medium' | 'Low';
    let score: number;

    if (hasHighImpact || peopleAffected > 20) {
      level = 'High';
      problemSeverity = 'High';
      businessValue = 'High';
      strategicValue = 'High';
      score = 80 + (peopleAffected > 50 ? 20 : Math.floor(peopleAffected / 3));
    } else if (hasLowImpact || peopleAffected < 3) {
      level = 'Low';
      problemSeverity = 'Low';
      businessValue = 'Low';
      strategicValue = 'Low';
      score = 20 + Math.floor(peopleAffected * 5);
    } else {
      level = 'Medium';
      problemSeverity = 'Medium';
      businessValue = 'Medium';
      strategicValue = 'Medium';
      score = 40 + Math.floor(peopleAffected * 2);
    }

    // Cap score at 100
    score = Math.min(score, 100);

    // Determine confidence
    const hasDetailedContext = (goalDescription.length + (context?.length || 0)) > 100;
    const confidence: 'High' | 'Medium' | 'Low' = hasDetailedContext ? 'Medium' : 'Low';

    const reasoning = `Impact estimated as ${level} (score: ${score}) based on: ${peopleAffected} people affected, ` +
      `${problemSeverity} problem severity, ${businessValue} business value.`;

    return {
      level,
      score,
      confidence,
      factors: {
        people_affected: peopleAffected,
        problem_severity: problemSeverity,
        business_value: businessValue,
        strategic_value: strategicValue
      },
      reasoning
    };
  }
}
