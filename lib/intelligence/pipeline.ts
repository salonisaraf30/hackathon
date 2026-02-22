// lib/intelligence/pipeline.ts

import { classifySignals, RawSignal, ClassifiedSignal } from './agents/signal-classifier';
import { generateStrategicInsights, StrategicInsight, UserProduct } from './agents/competitive-strategist';
import { redTeamInsights, RedTeamChallenge } from './agents/red-team';
import { predictScenarios, ScenarioPrediction } from './agents/scenario-predictor';
import { judgeQuality, QualityReport } from './agents/quality-judge';
import { getSessionUsage, resetSessionUsage } from './nemotron-client';

// The full pipeline trace — this is what you display in the UI
export interface PipelineTrace {
  // Timestamps for each stage (for UI animation)
  timestamps: {
    started: string;
    classified: string;
    strategized: string;
    red_teamed: string;
    scenarios_generated: string;
    quality_judged: string;
    completed: string;
  };

  // Results from each agent (for the "Analysis Trace" UI)
  stages: {
    classification: ClassifiedSignal[];
    strategy: StrategicInsight[];
    red_team: RedTeamChallenge[];
    scenarios: ScenarioPrediction;
    quality: QualityReport;
  };

  // Final, filtered output
  final_digest: {
    executive_summary: string;
    insights: Array<StrategicInsight & {
      red_team_note?: string;
      quality_score: number;
    }>;
    scenarios: ScenarioPrediction;
    quality_grade: string;
  };

  // Token usage per agent
  token_usage: Record<string, number>;
}

export async function runPipeline(
  rawSignals: RawSignal[],
  userProduct: UserProduct
): Promise<PipelineTrace> {

  resetSessionUsage();
  const timestamps: PipelineTrace['timestamps'] = {} as any;

  timestamps.started = new Date().toISOString();

  // ─── Stage 1: Classify Signals ───
  console.log('[Pipeline] Stage 1: Classifying signals...');
  const classifiedSignals = await classifySignals(rawSignals);
  timestamps.classified = new Date().toISOString();

  // ─── Stage 2: Generate Strategic Insights ───
  console.log('[Pipeline] Stage 2: Generating strategic insights...');
  const insights = await generateStrategicInsights(classifiedSignals, userProduct);
  timestamps.strategized = new Date().toISOString();

  // ─── Stage 3: Red Team Challenge ───
  console.log('[Pipeline] Stage 3: Red teaming insights...');
  const challenges = await redTeamInsights(insights, userProduct);
  timestamps.red_teamed = new Date().toISOString();

  // ─── Stage 4: Scenario Prediction ───
  console.log('[Pipeline] Stage 4: Predicting scenarios...');
  const scenarios = await predictScenarios(classifiedSignals, userProduct);
  timestamps.scenarios_generated = new Date().toISOString();

  // ─── Stage 5: Quality Judge ───
  console.log('[Pipeline] Stage 5: Judging quality...');
  const quality = await judgeQuality(insights, challenges, scenarios, userProduct);
  const qualityScores = Array.isArray(quality?.scores) ? quality.scores : [];
  const digestQualityGrade = quality?.digest_quality_grade ?? 'C';
  const executiveSummaryDraft = quality?.executive_summary_draft ?? 'No executive summary generated.';
  timestamps.quality_judged = new Date().toISOString();

  // ─── Assemble Final Digest ───
  // Only include insights that passed quality gate
  const approvedInsights = insights
    .map(insight => {
      const score = qualityScores.find(s => s.signal_id === insight.signal_id);
      const challenge = challenges.find(c => c.signal_id === insight.signal_id);

      if (!score || !score.include_in_digest) return null;

      return {
        ...insight,
        red_team_note: challenge?.verdict !== 'upheld' ? challenge?.challenge : undefined,
        quality_score: score.overall_score,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.quality_score - a!.quality_score) as Array<StrategicInsight & {
      red_team_note?: string;
      quality_score: number;
    }>;

  timestamps.completed = new Date().toISOString();

  return {
    timestamps,
    stages: {
      classification: classifiedSignals,
      strategy: insights,
      red_team: challenges,
      scenarios,
      quality,
    },
    final_digest: {
      executive_summary: executiveSummaryDraft,
      insights: approvedInsights,
      scenarios,
      quality_grade: digestQualityGrade,
    },
    token_usage: getSessionUsage(),
  };
}
