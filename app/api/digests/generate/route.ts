// app/api/digests/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDigest } from '@/lib/intelligence/digest-generator';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { digestId, trace } = await generateDigest(user.id);

    return NextResponse.json({
      success: true,
      digest_id: digestId,
      quality_grade: trace.final_digest.quality_grade,
      insights_count: trace.final_digest.insights.length,
      scenarios_count: trace.final_digest.scenarios.scenarios.length,
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
