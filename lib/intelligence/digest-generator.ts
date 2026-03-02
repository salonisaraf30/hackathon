// lib/intelligence/digest-generator.ts
// This replaces your old single-prompt digest generator

import { createClient } from '@/lib/supabase/server';
import { Json } from '@/lib/supabase/types';
import { runPipeline, PipelineTrace } from './pipeline';
import { RawSignal } from './agents/signal-classifier';
import { UserProduct } from './agents/competitive-strategist';
import { ApiError } from '@/lib/utils/api-error';

export async function generateDigest(userId: string): Promise<{
  digestId: string;
  trace: PipelineTrace;
  fromCache?: boolean;
}> {
  const supabase = await createClient();

  // 1. Fetch user's product info — needed to give the pipeline context
  //    about what the user builds and who they're competing against
  const { data: product } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!product) throw new Error('No product found for user');

  const userProduct: UserProduct = {
    name: product.name,
    positioning: product.positioning || '',
    target_market: product.target_market || '',
    key_features: product.key_features || [],
    description: product.description || '',
  };

  // 2. Fetch recent signals (last 7 days)
  //    Only signals from the user's tracked competitors are included
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: competitorRows } = await supabase
    .from('competitors')
    .select('id')
    .eq('user_id', userId);

  const competitorIds = (competitorRows ?? []).map((c: { id: string }) => c.id);

  const { data: signals } = await supabase
    .from('signals')
    .select(`
      id,
      competitor_id,
      source,
      signal_type,
      title,
      summary,
      raw_content,
      detected_at,
      competitors!inner(name)
    `)
    .gte('detected_at', oneWeekAgo)
    .in('competitor_id', competitorIds);

  if (!signals || signals.length === 0) {
    throw new Error('No signals found in the last 7 days');
  }

  // 3. Transform to RawSignal format expected by the pipeline agents
  const typedSignals = (signals ?? []) as Array<{
    id: string;
    competitor_id: string;
    source: string;
    signal_type: string;
    title: string;
    summary: string | null;
    raw_content: string | null;
    detected_at: string;
    competitors?: { name?: string } | { name?: string }[] | null;
  }>;

  const rawSignals: RawSignal[] = typedSignals.map((s) => ({
    id: s.id,
    competitor_id: s.competitor_id,
    competitor_name: (s as any).competitors?.name || 'Unknown',
    source: s.source,
    signal_type: s.signal_type,
    title: s.title,
    summary: s.summary || '',
    raw_content: s.raw_content || undefined,
    detected_at: s.detected_at,
  }));

  // 4. Run the multi-agent pipeline
  //    If Nemotron fails, fall back to the most recent cached digest rather
  //    than throwing — this keeps the weekly email cron alive even during
  //    LLM outages. A 503 is only thrown if there is no cached digest at all.
  let trace: PipelineTrace;
  try {
    trace = await runPipeline(rawSignals, userProduct);
  } catch (pipelineError) {
    console.error('Pipeline failed, returning cached digest', pipelineError);

    // Fetch the most recent digest this user has ever generated
    const { data: cached } = await supabase
      .from('digests')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    // Return the cached digest if available — caller receives fromCache: true
    // so it can show a "Using last available digest" notice to the user
    if (cached) return { digestId: cached.id, trace: {} as PipelineTrace, fromCache: true };

    // No cache available — nothing we can show the user
    throw new ApiError('Pipeline unavailable and no cached digest found', 503);
  }

  // 5. Shape the pipeline output into the strategic_insights JSONB payload
  //    This is the structure the frontend digest view reads from
  const strategicInsightsPayload: Json = {
    user_context: {
      product_name: userProduct.name,
      positioning: userProduct.positioning,
      target_market: userProduct.target_market,
      key_features: userProduct.key_features,
      description: userProduct.description || '',
    },
    insights: trace.final_digest.insights.map((insight) => ({
      signal_id: insight.signal_id,
      competitor_name: insight.competitor_name,
      what_happened: insight.what_happened,
      strategic_implication: insight.strategic_implication,
      impact_on_user: insight.impact_on_user,
      recommended_action: insight.recommended_action,
      urgency: insight.urgency,
      opportunity_or_threat: insight.opportunity_or_threat,
      time_horizon: insight.time_horizon,
      red_team_note: insight.red_team_note,
      verification_note: insight.verification_note,
      consistency_note: insight.consistency_note,
      quality_score: insight.quality_score,
    })),
    scenarios: {
      market_direction: trace.final_digest.scenarios.market_direction,
      scenarios: trace.final_digest.scenarios.scenarios.map((scenario) => ({
        competitor_name: scenario.competitor_name,
        prediction: scenario.prediction,
        confidence: scenario.confidence,
        evidence: scenario.evidence,
        timeframe: scenario.timeframe,
        impact_if_true: scenario.impact_if_true,
        preemptive_action: scenario.preemptive_action,
        counter_scenario: scenario.counter_scenario,
      })),
      wildcards: trace.final_digest.scenarios.wildcards,
    },
    quality_grade: trace.final_digest.quality_grade,
    // Pipeline trace is stored for debugging and prompt improvement — not shown to users
    pipeline_trace: {
      timestamps: trace.timestamps,
      token_usage: trace.token_usage,
      classification_summary: trace.stages.classification.map((s) => ({
        signal_id: s.id,
        category: s.classification.category,
        weight: s.classification.strategic_weight,
      })),
      red_team_summary: trace.stages.red_team.map((r) => ({
        signal_id: r.signal_id,
        verdict: r.verdict,
      })),
      verification_summary: trace.stages.verification.map((v) => ({
        signal_id: v.signal_id,
        verified: v.verified,
        evidence_strength: v.evidence_strength,
      })),
      contradiction_summary: trace.stages.contradictions.map((c) => ({
        signal_id: c.signal_id,
        conflicts_with_signal_id: c.conflicts_with_signal_id,
        severity: c.severity,
      })),
    },
  };

  // 6. Store the completed digest in Supabase
  const { data: digest } = await supabase
    .from('digests')
    .insert({
      user_id: userId,
      title: `Weekly Brief — ${new Date().toLocaleDateString()}`,
      executive_summary: trace.final_digest.executive_summary,
      strategic_insights: strategicInsightsPayload,
      period_start: oneWeekAgo,
      period_end: new Date().toISOString(),
    })
    .select()
    .single();

  // 7. Link each signal to the digest via the join table
  //    This powers the "signals used in this digest" view on the frontend
  if (digest) {
    const digestSignals = rawSignals.map(s => ({
      digest_id: digest.id,
      signal_id: s.id,
    }));

    await supabase.from('digest_signals').insert(digestSignals);
  }

  return {
    digestId: digest?.id || '',
    trace,
  };
}