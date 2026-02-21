import { runIngestion } from "@/lib/ingestion/run-ingestion";

export async function POST(_request: Request) {
  // Auth check (cron secret verification handled separately)
  const results = await runIngestion();
  return Response.json({ success: true, results });
}
