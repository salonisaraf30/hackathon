// scripts/run-agent-audit-parallel.ts
// Runs agents 1-2 sequentially, then agents 3-6 in parallel, then agent 7

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

interface AgentOutput {
  agent_name: string;
  run_at: string;
  duration_ms: number;
  tokens_used: number;
  raw_output: unknown;
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

async function runAllAgentsParallel() {
  console.log("=== Agent Audit Runner (Parallel Mode) ===\n");

  const fixtures = await loadFixtures();
  const { signals, user_product } = fixtures;
  
  console.log(`Loaded ${signals.length} signals from fixtures`);
  console.log(`User product: ${user_product.name}\n`);

  const allOutputs: Record<string, AgentOutput> = {};

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Sequential (Agents 1-2) - Required dependencies for parallel phase
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log("─── PHASE 1: Sequential (Agents 1-2) ───\n");

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

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: Parallel (Agents 3-6) - Can run simultaneously
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log("─── PHASE 2: Parallel (Agents 3-6) ───\n");
  console.log("Starting agents 3, 4, 5, 6 in parallel...\n");

  const parallelStart = Date.now();

  // Define parallel agent tasks
  const agent3Task = async () => {
    console.log("[3/7] Running Red Team...");
    const start = Date.now();
    const challenges = await redTeamInsights(insights, user_product);
    const duration = Date.now() - start;
    console.log(`  [3/7] Red Team done: ${challenges.length} challenges, ${duration}ms`);
    return { name: "red-team", output: challenges, duration };
  };

  const agent4Task = async () => {
    console.log("[4/7] Running Scenario Predictor...");
    const start = Date.now();
    const scenarios = await predictScenarios(classifiedSignals, JSON.stringify(insights), user_product);
    const duration = Date.now() - start;
    console.log(`  [4/7] Scenario Predictor done: ${scenarios.scenarios?.length || 0} scenarios, ${duration}ms`);
    return { name: "scenario-predictor", output: scenarios, duration };
  };

  const agent5Task = async () => {
    console.log("[5/7] Running Signal Verifier...");
    const start = Date.now();
    const verifications = await verifyInsights(insights, classifiedSignals);
    const duration = Date.now() - start;
    console.log(`  [5/7] Signal Verifier done: ${verifications.length} verifications, ${duration}ms`);
    return { name: "signal-verifier", output: verifications, duration };
  };

  const agent6Task = async () => {
    console.log("[6/7] Running Contradiction Detector...");
    const start = Date.now();
    const contradictions = await detectInsightContradictions(insights);
    const duration = Date.now() - start;
    console.log(`  [6/7] Contradiction Detector done: ${contradictions.length} contradictions, ${duration}ms`);
    return { name: "contradiction-detector", output: contradictions, duration };
  };

  // Run all 4 agents in parallel
  const [agent3Result, agent4Result, agent5Result, agent6Result] = await Promise.all([
    agent3Task(),
    agent4Task(),
    agent5Task(),
    agent6Task(),
  ]);

  const parallelDuration = Date.now() - parallelStart;
  console.log(`\n  Parallel phase completed in ${parallelDuration}ms (vs sequential: ${agent3Result.duration + agent4Result.duration + agent5Result.duration + agent6Result.duration}ms)\n`);

  // Get token usage (note: token tracking may not be accurate in parallel mode)
  const sessionUsage = getSessionUsage();

  // Save Agent 3 output
  allOutputs["red-team"] = {
    agent_name: "red-team",
    run_at: new Date().toISOString(),
    duration_ms: agent3Result.duration,
    tokens_used: sessionUsage["red-team"] || 0,
    raw_output: agent3Result.output,
  };
  await saveOutput("red-team", allOutputs["red-team"]);

  // Save Agent 4 output
  allOutputs["scenario-predictor"] = {
    agent_name: "scenario-predictor",
    run_at: new Date().toISOString(),
    duration_ms: agent4Result.duration,
    tokens_used: sessionUsage["scenario-predictor"] || 0,
    raw_output: agent4Result.output,
  };
  await saveOutput("scenario-predictor", allOutputs["scenario-predictor"]);

  // Save Agent 5 output
  allOutputs["signal-verifier"] = {
    agent_name: "signal-verifier",
    run_at: new Date().toISOString(),
    duration_ms: agent5Result.duration,
    tokens_used: sessionUsage["signal-verifier"] || 0,
    raw_output: agent5Result.output,
  };
  await saveOutput("signal-verifier", allOutputs["signal-verifier"]);

  // Save Agent 6 output
  allOutputs["contradiction-detector"] = {
    agent_name: "contradiction-detector",
    run_at: new Date().toISOString(),
    duration_ms: agent6Result.duration,
    tokens_used: sessionUsage["contradiction-detector"] || 0,
    raw_output: agent6Result.output,
  };
  await saveOutput("contradiction-detector", allOutputs["contradiction-detector"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: Sequential (Agent 7) - Requires outputs from agents 3 & 4
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log("─── PHASE 3: Sequential (Agent 7) ───\n");

  // ─── Agent 7: Quality Judge ───
  console.log("[7/7] Running Quality Judge...");
  resetSessionUsage();
  const judgeStart = Date.now();
  const qualityReport = await judgeQuality(
    insights, 
    agent3Result.output,  // challenges from Red Team
    agent5Result.output,  // verifications from Signal Verifier
    agent4Result.output,  // scenarios from Scenario Predictor
    user_product
  );
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log("\n=== Audit Run Complete (Parallel Mode) ===");
  console.log("Outputs saved to: __tests__/fixtures/baseline-outputs/");
  
  const totalTokens = Object.values(allOutputs).reduce((sum, o) => sum + o.tokens_used, 0);
  const sequentialDuration = classifierDuration + strategistDuration + judgeDuration;
  const totalWallClock = sequentialDuration + parallelDuration;
  const totalSequentialEquivalent = Object.values(allOutputs).reduce((sum, o) => sum + o.duration_ms, 0);
  
  console.log(`\n--- Performance Summary ---`);
  console.log(`  Total wall-clock time: ${(totalWallClock / 1000).toFixed(1)}s`);
  console.log(`  Sequential equivalent: ${(totalSequentialEquivalent / 1000).toFixed(1)}s`);
  console.log(`  Time saved: ${((totalSequentialEquivalent - totalWallClock) / 1000).toFixed(1)}s`);
  console.log(`  Speedup: ${(totalSequentialEquivalent / totalWallClock).toFixed(2)}x`);
  
  console.log(`\n--- Token Usage by Agent ---`);
  console.log(`  Total tokens: ${totalTokens}`);
  for (const [name, output] of Object.entries(allOutputs)) {
    console.log(`  ${name}: ${output.tokens_used} tokens (${output.duration_ms}ms)`);
  }

  console.log(`\n--- Phase Breakdown ---`);
  console.log(`  Phase 1 (Agents 1-2): ${((classifierDuration + strategistDuration) / 1000).toFixed(1)}s`);
  console.log(`  Phase 2 (Agents 3-6 parallel): ${(parallelDuration / 1000).toFixed(1)}s`);
  console.log(`  Phase 3 (Agent 7): ${(judgeDuration / 1000).toFixed(1)}s`);
}

runAllAgentsParallel().catch((error) => {
  console.error("Audit run failed:", error);
  process.exit(1);
});
