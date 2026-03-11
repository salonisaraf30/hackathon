// app/api/digests/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { generateDigest } from '@/lib/intelligence/digest-generator';
import { withTraceContext } from '@/lib/intelligence/trace-context';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requestId = req.headers.get('x-request-id') || randomUUID();
    const { digestId, trace } = await withTraceContext(
      { requestId, userId: user.id, route: '/api/digests/generate' },
      () => generateDigest(user.id)
    );

    // Handle case where pipeline failed and returned cached/incomplete result
    if (!trace.final_digest) {
      return NextResponse.json({
        success: false,
        request_id: requestId,
        digest_id: digestId,
        error: 'Pipeline failed to generate digest',
        pipeline_trace: {
          timestamps: trace.timestamps,
          stages_completed: trace.stages_completed ?? 0,
          token_usage: trace.token_usage,
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      request_id: requestId,
      digest_id: digestId,
      quality_grade: trace.final_digest.quality_grade,
      insights_count: trace.final_digest.insights?.length ?? 0,
      scenarios_count: trace.final_digest.scenarios?.scenarios?.length ?? 0,
      // Send the pipeline trace for the UI to animate
      pipeline_trace: {
        timestamps: trace.timestamps,
        stages_completed: 5,
        token_usage: trace.token_usage,
      }
    });
  } catch (error) {
    console.error('[Digest Generation Error]', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
