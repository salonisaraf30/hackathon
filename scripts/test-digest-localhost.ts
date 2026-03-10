#!/usr/bin/env npx tsx
/**
 * test-digest-localhost.ts
 * 
 * Generates a digest from test fixtures and serves it on localhost.
 * 
 * Usage:
 *   npx tsx scripts/test-digest-localhost.ts           # Use cached baseline outputs
 *   npx tsx scripts/test-digest-localhost.ts --live    # Run full pipeline (slower, uses API)
 *   npx tsx scripts/test-digest-localhost.ts --console # Output to console instead of server
 */

import { loadEnvConfig } from '@next/env';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

loadEnvConfig(process.cwd());

// Types from pipeline and agents
interface ClassifiedSignal {
  id: string;
  classification: {
    category: string;
    strategic_weight: number;
  };
  [key: string]: unknown;
}

interface StrategicInsight {
  signal_id: string;
  insight: string;
  urgency: string;
  recommended_action: string;
  affected_feature?: string;
  [key: string]: unknown;
}

interface RedTeamChallenge {
  signal_id: string;
  verdict: 'upheld' | 'partially_challenged' | 'overturned';
  challenge: string;
  risk_of_acting: string;
  [key: string]: unknown;
}

interface ScenarioPrediction {
  market_direction: string;
  scenarios: Array<{
    competitor_name: string;
    prediction: string;
    confidence: number;
    timeframe: string;
    impact_if_true: string;
    preemptive_action: string;
    counter_scenario: string;
    wildcard?: string;
    [key: string]: unknown;
  }>;
  wildcards?: Array<{ scenario: string; conditions: string }>;
}

interface VerificationResult {
  signal_id: string;
  verified: boolean;
  evidence_strength: number;
  evidence_note: string;
  [key: string]: unknown;
}

interface InsightContradiction {
  signal_id: string;
  conflicts_with_signal_id: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
}

interface QualityReport {
  scores: Array<{
    signal_id: string;
    overall_score: number;
    include_in_digest: boolean;
    revision_note: string;
    specificity_score: number;
    actionability_score: number;
    evidence_score: number;
  }>;
  executive_summary_draft: string;
  digest_quality_grade: string;
  improvement_notes: string;
}

interface BaselineOutput<T> {
  agent_name: string;
  run_at: string;
  duration_ms: number;
  tokens_used: number;
  raw_output: T;
}

interface DigestData {
  executive_summary: string;
  quality_grade: string;
  insights: Array<StrategicInsight & {
    red_team_note?: string;
    verification_note?: string;
    consistency_note?: string;
    quality_score: number;
  }>;
  scenarios: ScenarioPrediction;
  metadata: {
    generated_at: string;
    mode: 'cached' | 'live';
    total_tokens: number;
    total_duration_ms: number;
    signals_processed: number;
    insights_included: number;
  };
}

const FIXTURES_DIR = path.join(process.cwd(), '__tests__', 'fixtures');
const BASELINE_DIR = path.join(FIXTURES_DIR, 'baseline-outputs');

function loadBaseline<T>(agentName: string): BaselineOutput<T> {
  const filePath = path.join(BASELINE_DIR, `${agentName}.json`);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function assembleDigestFromBaselines(): DigestData {
  // Load all baseline outputs
  const classifier = loadBaseline<ClassifiedSignal[]>('signal-classifier');
  const strategist = loadBaseline<StrategicInsight[]>('competitive-strategist');
  const redTeam = loadBaseline<RedTeamChallenge[]>('red-team');
  const scenarios = loadBaseline<ScenarioPrediction>('scenario-predictor');
  const verifier = loadBaseline<VerificationResult[]>('signal-verifier');
  const contradictions = loadBaseline<InsightContradiction[]>('contradiction-detector');
  const quality = loadBaseline<QualityReport>('quality-judge');

  const insights = strategist.raw_output;
  const qualityScores = quality.raw_output.scores;
  const challenges = redTeam.raw_output;
  const verificationResults = verifier.raw_output;
  const contradictionResults = contradictions.raw_output;

  // Apply the same filtering logic as pipeline.ts
  const approvedInsights = insights
    .map(insight => {
      const score = qualityScores.find(s => s.signal_id === insight.signal_id);
      const challenge = challenges.find(c => c.signal_id === insight.signal_id);
      const verificationResult = verificationResults.find(v => v.signal_id === insight.signal_id);
      const relatedContradictions = contradictionResults.filter(
        item => item.signal_id === insight.signal_id || item.conflicts_with_signal_id === insight.signal_id
      );

      if (!score || !score.include_in_digest) return null;
      if (verificationResult && !verificationResult.verified && verificationResult.evidence_strength < 0.4) return null;

      const contradictionPenalty = relatedContradictions.some(item => item.severity === 'high') ? 1 : 0;

      return {
        ...insight,
        red_team_note: challenge?.verdict !== 'upheld' ? challenge?.challenge : undefined,
        verification_note: verificationResult?.verified ? undefined : verificationResult?.evidence_note,
        consistency_note: relatedContradictions[0]?.explanation,
        quality_score: Math.max(1, score.overall_score - contradictionPenalty),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.quality_score - a!.quality_score) as DigestData['insights'];

  // Calculate totals
  const totalTokens = [classifier, strategist, redTeam, scenarios, verifier, contradictions, quality]
    .reduce((sum, b) => sum + b.tokens_used, 0);
  const totalDuration = [classifier, strategist, redTeam, scenarios, verifier, contradictions, quality]
    .reduce((sum, b) => sum + b.duration_ms, 0);

  return {
    executive_summary: quality.raw_output.executive_summary_draft,
    quality_grade: quality.raw_output.digest_quality_grade,
    insights: approvedInsights,
    scenarios: scenarios.raw_output,
    metadata: {
      generated_at: new Date().toISOString(),
      mode: 'cached',
      total_tokens: totalTokens,
      total_duration_ms: totalDuration,
      signals_processed: classifier.raw_output.length,
      insights_included: approvedInsights.length,
    },
  };
}

async function generateLiveDigest(): Promise<DigestData> {
  // Dynamically import to avoid loading when using cached mode
  const { runPipeline } = await import('../lib/intelligence/pipeline');
  
  const signalsPath = path.join(FIXTURES_DIR, 'real-signals.json');
  const fixtureData = JSON.parse(fs.readFileSync(signalsPath, 'utf-8'));
  const rawSignals = fixtureData.signals;

  const userProduct = {
    name: 'TaskFlow',
    positioning: 'AI-powered project management for engineering teams',
    description: 'TaskFlow helps engineering teams ship faster with AI-driven sprint planning and automated standups',
    key_features: ['Sprint Planning AI', 'Automated Standup Reports', 'Predictive Roadmaps'],
    target_market: 'Series A-C tech startups',
  };

  console.log('[Live Mode] Running full pipeline against test fixtures...');
  console.log(`[Live Mode] Processing ${rawSignals.length} signals...`);
  console.log('[Live Mode] This may take 2-3 minutes...\n');

  const startTime = Date.now();
  const trace = await runPipeline(rawSignals, userProduct);
  const duration = Date.now() - startTime;

  const totalTokens = Object.values(trace.token_usage).reduce((a, b) => a + b, 0);

  // Cast to DigestData types (the actual shapes are compatible)
  return {
    executive_summary: trace.final_digest.executive_summary,
    quality_grade: trace.final_digest.quality_grade,
    insights: trace.final_digest.insights as unknown as DigestData['insights'],
    scenarios: trace.final_digest.scenarios as unknown as DigestData['scenarios'],
    metadata: {
      generated_at: new Date().toISOString(),
      mode: 'live',
      total_tokens: totalTokens,
      total_duration_ms: duration,
      signals_processed: trace.stages.classification.length,
      insights_included: trace.final_digest.insights.length,
    },
  };
}

function generateHTML(digest: DigestData): string {
  const urgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const gradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#22c55e';
      case 'B': return '#84cc16';
      case 'C': return '#f59e0b';
      case 'D': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const insightsHTML = digest.insights.map(insight => `
    <div class="insight-card">
      <div class="insight-header">
        <span class="signal-id">${insight.signal_id}</span>
        <span class="urgency" style="background: ${urgencyColor(insight.urgency)}">${insight.urgency} urgency</span>
        <span class="score">Score: ${insight.quality_score.toFixed(1)}</span>
      </div>
      <p class="insight-text">${insight.insight}</p>
      <div class="action">
        <strong>Recommended Action:</strong> ${insight.recommended_action}
      </div>
      ${insight.affected_feature ? `<div class="affected"><strong>Affects:</strong> ${insight.affected_feature}</div>` : ''}
      ${insight.red_team_note ? `<div class="red-team-note"><strong>⚠️ Red Team Challenge:</strong> ${insight.red_team_note}</div>` : ''}
      ${insight.verification_note ? `<div class="verification-note"><strong>📋 Verification Note:</strong> ${insight.verification_note}</div>` : ''}
      ${insight.consistency_note ? `<div class="consistency-note"><strong>⚡ Consistency Note:</strong> ${insight.consistency_note}</div>` : ''}
    </div>
  `).join('\n');

  const scenariosHTML = digest.scenarios.scenarios.map(scenario => `
    <div class="scenario-card">
      <div class="scenario-header">
        <span class="competitor">${scenario.competitor_name}</span>
        <span class="confidence">Confidence: ${(scenario.confidence * 100).toFixed(0)}%</span>
        <span class="timeframe">${scenario.timeframe}</span>
      </div>
      <p class="prediction"><strong>Prediction:</strong> ${scenario.prediction}</p>
      <p class="impact"><strong>Impact if True:</strong> ${scenario.impact_if_true}</p>
      <p class="action"><strong>Preemptive Action:</strong> ${scenario.preemptive_action}</p>
      <p class="counter"><strong>Counter-scenario:</strong> ${scenario.counter_scenario}</p>
      ${scenario.wildcard ? `<p class="wildcard"><strong>🃏 Wildcard:</strong> ${scenario.wildcard}</p>` : ''}
    </div>
  `).join('\n');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Competitive Intelligence Digest</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #334155;
    }
    h1 {
      font-size: 2.5rem;
      background: linear-gradient(90deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .subtitle { color: #94a3b8; font-size: 1.1rem; }
    .meta-bar {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1.5rem;
      flex-wrap: wrap;
    }
    .meta-item {
      background: #1e293b;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: 1px solid #334155;
    }
    .meta-label { color: #64748b; font-size: 0.8rem; text-transform: uppercase; }
    .meta-value { font-size: 1.25rem; font-weight: 600; }
    .grade { font-size: 2rem; }
    
    .executive-summary {
      background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%);
      border: 1px solid #3b82f6;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 3rem;
    }
    .executive-summary h2 {
      color: #60a5fa;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    .executive-summary p {
      line-height: 1.8;
      font-size: 1.1rem;
    }
    
    section { margin-bottom: 3rem; }
    section h2 {
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .insight-card, .scenario-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      transition: transform 0.2s, border-color 0.2s;
    }
    .insight-card:hover, .scenario-card:hover {
      transform: translateY(-2px);
      border-color: #60a5fa;
    }
    
    .insight-header, .scenario-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .signal-id {
      background: #3b82f6;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.9rem;
    }
    .urgency, .confidence, .timeframe {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
      color: white;
    }
    .confidence { background: #8b5cf6; }
    .timeframe { background: #0ea5e9; }
    .competitor {
      background: #10b981;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .score {
      background: #334155;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    
    .insight-text, .prediction { 
      font-size: 1.05rem; 
      line-height: 1.6; 
      margin-bottom: 1rem;
    }
    .action, .impact, .counter, .affected { 
      color: #94a3b8; 
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }
    .wildcard { color: #fbbf24; margin-top: 0.5rem; }
    
    .red-team-note, .verification-note, .consistency-note {
      background: #292524;
      border-left: 3px solid #f59e0b;
      padding: 0.75rem 1rem;
      margin-top: 1rem;
      font-size: 0.9rem;
      border-radius: 0 8px 8px 0;
    }
    .verification-note { border-left-color: #3b82f6; }
    .consistency-note { border-left-color: #8b5cf6; }
    
    .market-direction {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      font-style: italic;
      line-height: 1.7;
    }
    
    footer {
      text-align: center;
      color: #64748b;
      padding-top: 2rem;
      border-top: 1px solid #334155;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎯 Competitive Intelligence Digest</h1>
      <p class="subtitle">TaskFlow — AI-Powered Project Management</p>
      <div class="meta-bar">
        <div class="meta-item">
          <div class="meta-label">Quality Grade</div>
          <div class="meta-value grade" style="color: ${gradeColor(digest.quality_grade)}">${digest.quality_grade}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Signals Processed</div>
          <div class="meta-value">${digest.metadata.signals_processed}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Insights Included</div>
          <div class="meta-value">${digest.metadata.insights_included}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Tokens Used</div>
          <div class="meta-value">${digest.metadata.total_tokens.toLocaleString()}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Mode</div>
          <div class="meta-value">${digest.metadata.mode === 'cached' ? '📁 Cached' : '🔴 Live'}</div>
        </div>
      </div>
    </header>
    
    <div class="executive-summary">
      <h2>📋 Executive Summary</h2>
      <p>${digest.executive_summary}</p>
    </div>
    
    <section>
      <h2>💡 Strategic Insights (${digest.insights.length})</h2>
      ${insightsHTML}
    </section>
    
    <section>
      <h2>🔮 Scenario Predictions</h2>
      <div class="market-direction">
        <strong>Market Direction:</strong> ${digest.scenarios.market_direction}
      </div>
      ${scenariosHTML}
    </section>
    
    <footer>
      <p>Generated at ${new Date(digest.metadata.generated_at).toLocaleString()}</p>
      <p>Pipeline duration: ${(digest.metadata.total_duration_ms / 1000).toFixed(1)}s</p>
    </footer>
  </div>
</body>
</html>
  `;
}

function printConsoleDigest(digest: DigestData): void {
  console.log('\n' + '═'.repeat(80));
  console.log('  🎯 COMPETITIVE INTELLIGENCE DIGEST');
  console.log('═'.repeat(80));
  
  console.log(`\n📊 Quality Grade: ${digest.quality_grade}`);
  console.log(`📈 Signals Processed: ${digest.metadata.signals_processed}`);
  console.log(`✅ Insights Included: ${digest.metadata.insights_included}`);
  console.log(`🔢 Tokens Used: ${digest.metadata.total_tokens.toLocaleString()}`);
  console.log(`⏱️  Duration: ${(digest.metadata.total_duration_ms / 1000).toFixed(1)}s`);
  console.log(`📁 Mode: ${digest.metadata.mode}`);
  
  console.log('\n' + '─'.repeat(80));
  console.log('  📋 EXECUTIVE SUMMARY');
  console.log('─'.repeat(80));
  console.log('\n' + digest.executive_summary + '\n');
  
  console.log('─'.repeat(80));
  console.log(`  💡 STRATEGIC INSIGHTS (${digest.insights.length})`);
  console.log('─'.repeat(80));
  
  digest.insights.forEach((insight, i) => {
    console.log(`\n[${i + 1}] ${insight.signal_id} — ${insight.urgency.toUpperCase()} URGENCY (Score: ${insight.quality_score.toFixed(1)})`);
    console.log(`    ${insight.insight}`);
    console.log(`    → Action: ${insight.recommended_action}`);
    if (insight.red_team_note) {
      console.log(`    ⚠️  Red Team: ${insight.red_team_note}`);
    }
  });
  
  console.log('\n' + '─'.repeat(80));
  console.log('  🔮 SCENARIO PREDICTIONS');
  console.log('─'.repeat(80));
  console.log(`\nMarket Direction: ${digest.scenarios.market_direction}\n`);
  
  digest.scenarios.scenarios.forEach((scenario, i) => {
    console.log(`[${i + 1}] ${scenario.competitor_name} (${(scenario.confidence * 100).toFixed(0)}% confidence, ${scenario.timeframe})`);
    console.log(`    Prediction: ${scenario.prediction}`);
    console.log(`    Impact: ${scenario.impact_if_true}`);
    console.log('');
  });
  
  console.log('═'.repeat(80));
  console.log(`  Generated: ${new Date(digest.metadata.generated_at).toLocaleString()}`);
  console.log('═'.repeat(80) + '\n');
}

async function startServer(digest: DigestData, port: number = 3333): Promise<void> {
  const html = generateHTML(digest);
  
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/digest') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else if (req.url === '/api/digest') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(digest, null, 2));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(port, () => {
    console.log('\n' + '═'.repeat(60));
    console.log('  🚀 Digest Server Running');
    console.log('═'.repeat(60));
    console.log(`\n  📊 View digest:     http://localhost:${port}/`);
    console.log(`  📦 JSON endpoint:   http://localhost:${port}/api/digest`);
    console.log(`\n  Press Ctrl+C to stop\n`);
    console.log('═'.repeat(60) + '\n');
  });
}

async function main() {
  const args = process.argv.slice(2);
  const isLive = args.includes('--live');
  const isConsole = args.includes('--console');
  const portArg = args.find(a => a.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3333;

  console.log('\n🎯 Competitive Intelligence Digest Generator\n');

  let digest: DigestData;

  if (isLive) {
    console.log('Mode: 🔴 LIVE (running full pipeline)');
    digest = await generateLiveDigest();
  } else {
    console.log('Mode: 📁 CACHED (using baseline outputs)');
    try {
      digest = assembleDigestFromBaselines();
      console.log('✅ Loaded baseline outputs from __tests__/fixtures/baseline-outputs/');
    } catch (error) {
      console.error('❌ Failed to load baseline outputs. Run the agent audit first:');
      console.error('   npm run test:audit-agent');
      process.exit(1);
    }
  }

  if (isConsole) {
    printConsoleDigest(digest);
  } else {
    await startServer(digest, port);
  }
}

main().catch(console.error);
