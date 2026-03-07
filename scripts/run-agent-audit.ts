// scripts/run-agent-audit.ts
// Runs each agent in isolation against real signals and saves outputs for audit

import { loadEnvConfig } from "@next/env";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { classifySignals, RawSignal } from "@/lib/intelligence/agents/signal-classifier";
import { generateStrategicInsights, UserProduct } from "@/lib/intelligence/agents/competitive-strategist";
import { redTeamInsights } from "@/lib/intelligence/agents/red-team";
import { predictScenarios } from "@/lib/intelligence/agents/scenario-predictor";
import { verifyInsights } from "@/lib/intelligence/agents/signal-verifier";
import { detectInsightContradictions } from "@/lib/intelligence/agents/contradiction-detector";
import { judgeQuality } from "@/lib/intelligence/agents/quality-judge";
import { getSessionUsage, resetSessionUsage } from "@/lib/intelligence/nemotron-client";

loadEnvConfig(process.cwd());

interface FixtureData {
  metadata: {
    created_at: string;
    competitors: string[];
    signal_count: number;
    sources: { scraped: number; manual: number };
  };
  user_product: UserProduct;
  signals: RawSignal[];
}

interface AuditScore {
  signal_id: string;
  specificity: number;       // 1-5
  actionability: number;     // 1-5
  genericness_penalty: number; // 1-5 (lower is better)
  notes: string;
}

interface AgentOutput {
  agent_name: string;
  run_at: string;
  duration_ms: number;
  tokens_used: number;
  raw_output: unknown;
  audit_scores?: AuditScore[];
}

async function loadFixtures(): Promise<FixtureData> {
  const fixturePath = path.join(process.cwd(), "__tests__/fixtures/real-signals.json");
  const content = await readFile(fixturePath, "utf-8");
  return JSON.parse(content);
}

async function saveOutput(agentName: string, output: AgentOutput): Promise<void> {
  const outputDir = path.join(process.cwd(), "__tests__/fixtures/baseline-outputs");
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${agentName}.json`);
  await writeFile(outputPath, JSON.stringify(output, null, 2));
  console.log(`  Saved to ${outputPath}`);
}

async function runAllAgents() {
  console.log("=== Agent Audit Runner ===\n");

  const fixtures = await loadFixtures();
  const { signals, user_product } = fixtures;
  
  console.log(`Loaded ${signals.length} signals from fixtures`);
  console.log(`User product: ${user_product.name}\n`);

  const allOutputs: Record<string, AgentOutput> = {};

  // ─── Agent 1: Signal Classifier ───
  console.log("[1/7] Running Signal Classifier...");
  resetSessionUsage();
  const classifierStart = Date.now();
  const classifiedSignals = await classifySignals(signals);
  const classifierDuration = Date.now() - classifierStart;
  const classifierTokens = getSessionUsage()["signal-classifier"] || 0;
  
  allOutputs["signal-classifier"] = {
    agent_name: "signal-classifier",
    run_at: new Date().toISOString(),
    duration_ms: classifierDuration,
    tokens_used: classifierTokens,
    raw_output: classifiedSignals,
  };
  await saveOutput("signal-classifier", allOutputs["signal-classifier"]);
  console.log(`  Done: ${classifiedSignals.length} signals classified, ${classifierTokens} tokens, ${classifierDuration}ms\n`);

  // ─── Agent 2: Competitive Strategist ───
  console.log("[2/7] Running Competitive Strategist...");
  resetSessionUsage();
  const strategistStart = Date.now();
  const insights = await generateStrategicInsights(classifiedSignals, user_product);
  const strategistDuration = Date.now() - strategistStart;
  const strategistTokens = getSessionUsage()["competitive-strategist"] || 0;
  
  allOutputs["competitive-strategist"] = {
    agent_name: "competitive-strategist",
    run_at: new Date().toISOString(),
    duration_ms: strategistDuration,
    tokens_used: strategistTokens,
    raw_output: insights,
  };
  await saveOutput("competitive-strategist", allOutputs["competitive-strategist"]);
  console.log(`  Done: ${insights.length} insights generated, ${strategistTokens} tokens, ${strategistDuration}ms\n`);

  // ─── Agent 3: Red Team ───
  console.log("[3/7] Running Red Team...");
  resetSessionUsage();
  const redTeamStart = Date.now();
  const challenges = await redTeamInsights(insights, user_product);
  const redTeamDuration = Date.now() - redTeamStart;
  const redTeamTokens = getSessionUsage()["red-team"] || 0;
  
  allOutputs["red-team"] = {
    agent_name: "red-team",
    run_at: new Date().toISOString(),
    duration_ms: redTeamDuration,
    tokens_used: redTeamTokens,
    raw_output: challenges,
  };
  await saveOutput("red-team", allOutputs["red-team"]);
  console.log(`  Done: ${challenges.length} challenges generated, ${redTeamTokens} tokens, ${redTeamDuration}ms\n`);

  // ─── Agent 4: Scenario Predictor ───
  console.log("[4/7] Running Scenario Predictor...");
  resetSessionUsage();
  const scenarioStart = Date.now();
  const scenarios = await predictScenarios(classifiedSignals, user_product);
  const scenarioDuration = Date.now() - scenarioStart;
  const scenarioTokens = getSessionUsage()["scenario-predictor"] || 0;
  
  allOutputs["scenario-predictor"] = {
    agent_name: "scenario-predictor",
    run_at: new Date().toISOString(),
    duration_ms: scenarioDuration,
    tokens_used: scenarioTokens,
    raw_output: scenarios,
  };
  await saveOutput("scenario-predictor", allOutputs["scenario-predictor"]);
  console.log(`  Done: ${scenarios.scenarios?.length || 0} scenarios generated, ${scenarioTokens} tokens, ${scenarioDuration}ms\n`);

  // ─── Agent 5: Signal Verifier ───
  console.log("[5/7] Running Signal Verifier...");
  resetSessionUsage();
  const verifierStart = Date.now();
  const verifications = await verifyInsights(insights, classifiedSignals);
  const verifierDuration = Date.now() - verifierStart;
  const verifierTokens = getSessionUsage()["signal-verifier"] || 0;
  
  allOutputs["signal-verifier"] = {
    agent_name: "signal-verifier",
    run_at: new Date().toISOString(),
    duration_ms: verifierDuration,
    tokens_used: verifierTokens,
    raw_output: verifications,
  };
  await saveOutput("signal-verifier", allOutputs["signal-verifier"]);
  console.log(`  Done: ${verifications.length} verifications, ${verifierTokens} tokens, ${verifierDuration}ms\n`);

  // ─── Agent 6: Contradiction Detector ───
  console.log("[6/7] Running Contradiction Detector...");
  resetSessionUsage();
  const contradictionStart = Date.now();
  const contradictions = await detectInsightContradictions(insights);
  const contradictionDuration = Date.now() - contradictionStart;
  const contradictionTokens = getSessionUsage()["contradiction-detector"] || 0;
  
  allOutputs["contradiction-detector"] = {
    agent_name: "contradiction-detector",
    run_at: new Date().toISOString(),
    duration_ms: contradictionDuration,
    tokens_used: contradictionTokens,
    raw_output: contradictions,
  };
  await saveOutput("contradiction-detector", allOutputs["contradiction-detector"]);
  console.log(`  Done: ${contradictions.length} contradictions found, ${contradictionTokens} tokens, ${contradictionDuration}ms\n`);

  // ─── Agent 7: Quality Judge ───
  console.log("[7/7] Running Quality Judge...");
  resetSessionUsage();
  const judgeStart = Date.now();
  const qualityReport = await judgeQuality(insights, challenges, scenarios, user_product);
  const judgeDuration = Date.now() - judgeStart;
  const judgeTokens = getSessionUsage()["quality-judge"] || 0;
  
  allOutputs["quality-judge"] = {
    agent_name: "quality-judge",
    run_at: new Date().toISOString(),
    duration_ms: judgeDuration,
    tokens_used: judgeTokens,
    raw_output: qualityReport,
  };
  await saveOutput("quality-judge", allOutputs["quality-judge"]);
  console.log(`  Done: Grade ${qualityReport.digest_quality_grade}, ${judgeTokens} tokens, ${judgeDuration}ms\n`);

  // ─── Summary ───
  console.log("\n=== Audit Run Complete ===");
  console.log("Outputs saved to: __tests__/fixtures/baseline-outputs/");
  
  const totalTokens = Object.values(allOutputs).reduce((sum, o) => sum + o.tokens_used, 0);
  const totalDuration = Object.values(allOutputs).reduce((sum, o) => sum + o.duration_ms, 0);
  
  console.log(`\nTotal tokens: ${totalTokens}`);
  console.log(`Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
  
  console.log("\n--- Token Usage by Agent ---");
  for (const [name, output] of Object.entries(allOutputs)) {
    console.log(`  ${name}: ${output.tokens_used} tokens (${output.duration_ms}ms)`);
  }
}

runAllAgents().catch((error) => {
  console.error("Audit run failed:", error);
  process.exit(1);
});
