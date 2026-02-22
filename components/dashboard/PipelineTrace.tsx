// components/dashboard/PipelineTrace.tsx
// Collapsible view showing how the multi-agent pipeline reasoned through signals

'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Brain, Shield, Target, Eye, CheckCircle, Loader2 } from 'lucide-react';

interface PipelineStage {
  name: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'complete';
  duration_ms?: number;
  summary: string;
  detail?: React.ReactNode;
}

interface PipelineTraceProps {
  trace: any; // The pipeline_trace from the API response
  isGenerating: boolean;
}

export function PipelineTrace({ trace, isGenerating }: PipelineTraceProps) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [currentStage, setCurrentStage] = useState(0);

  // Animate through stages during generation
  useEffect(() => {
    if (isGenerating && currentStage < 5) {
      const timer = setTimeout(() => setCurrentStage(prev => prev + 1), 3000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, currentStage]);

  const stages: PipelineStage[] = [
    {
      name: 'Signal Classification',
      icon: <Brain className="w-4 h-4" />,
      status: currentStage > 0 ? 'complete' : currentStage === 0 && isGenerating ? 'running' : 'pending',
      summary: trace ? `Classified ${trace.classification_summary?.length || 0} signals into strategic categories` : 'Analyzing raw competitive signals...',
      detail: trace?.classification_summary && (
        <div className="space-y-1 text-sm text-gray-400">
          {trace.classification_summary.map((c: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span>{c.signal_id.slice(0, 8)}...</span>
              <span className="px-2 py-0.5 rounded bg-gray-800 text-xs">{c.category}</span>
              <span>Weight: {c.weight}/10</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      name: 'Strategic Analysis',
      icon: <Target className="w-4 h-4" />,
      status: currentStage > 1 ? 'complete' : currentStage === 1 && isGenerating ? 'running' : 'pending',
      summary: 'Generating personalized strategic implications...',
    },
    {
      name: 'Red Team Challenge',
      icon: <Shield className="w-4 h-4" />,
      status: currentStage > 2 ? 'complete' : currentStage === 2 && isGenerating ? 'running' : 'pending',
      summary: trace?.red_team_summary
        ? `Challenged insights: ${trace.red_team_summary.filter((r: any) => r.verdict !== 'upheld').length} revised`
        : 'Challenging assumptions and finding blind spots...',
      detail: trace?.red_team_summary && (
        <div className="space-y-1 text-sm text-gray-400">
          {trace.red_team_summary.map((r: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span>{r.signal_id.slice(0, 8)}...</span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                r.verdict === 'upheld' ? 'bg-green-900 text-green-300' :
                r.verdict === 'partially_challenged' ? 'bg-yellow-900 text-yellow-300' :
                'bg-red-900 text-red-300'
              }`}>{r.verdict}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      name: 'Scenario Prediction',
      icon: <Eye className="w-4 h-4" />,
      status: currentStage > 3 ? 'complete' : currentStage === 3 && isGenerating ? 'running' : 'pending',
      summary: 'Predicting competitor next moves...',
    },
    {
      name: 'Quality Assurance',
      icon: <CheckCircle className="w-4 h-4" />,
      status: currentStage > 4 ? 'complete' : currentStage === 4 && isGenerating ? 'running' : 'pending',
      summary: trace ? `Grade: ${trace.quality_grade || 'A'} — filtered to highest-quality insights only` : 'Scoring and filtering insights...',
    },
  ];

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">Analysis Pipeline</span>
        {trace?.token_usage && (
          <span className="text-xs text-gray-500">
            {Object.values(trace.token_usage as Record<string, number>).reduce((a, b) => a + b, 0).toLocaleString()} tokens used
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-800">
        {stages.map((stage, i) => (
          <div key={i}>
            <button
              onClick={() => setExpandedStage(expandedStage === i ? null : i)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-900/30 transition-colors"
            >
              {/* Status indicator */}
              {stage.status === 'running' ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              ) : stage.status === 'complete' ? (
                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-700" />
              )}

              {/* Icon + Name */}
              <span className={`${stage.status === 'pending' ? 'text-gray-500' : 'text-gray-300'}`}>
                {stage.icon}
              </span>
              <span className={`text-sm flex-1 text-left ${
                stage.status === 'pending' ? 'text-gray-500' : 'text-gray-200'
              }`}>
                {stage.name}
              </span>

              {/* Summary */}
              <span className="text-xs text-gray-500 max-w-[300px] truncate">
                {stage.summary}
              </span>

              {/* Expand arrow */}
              {stage.detail && (
                expandedStage === i ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />
              )}
            </button>

            {/* Expanded detail */}
            {expandedStage === i && stage.detail && (
              <div className="px-4 py-3 bg-gray-900/20 border-t border-gray-800/50">
                {stage.detail}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
