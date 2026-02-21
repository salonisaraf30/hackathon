import * as cheerio from "cheerio";
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { indexSignalInNia } from "@/lib/intelligence/nia-client";
import { extractSignalsFromDiff } from "./signal-extractor";

export async function monitorWebsite(
	competitorId: string,
	url: string,
	supabaseClient?: SupabaseClient,
) {
	const supabase = supabaseClient ?? (await createClient());

	let html: string;
	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; CompetitorPulse/1.0)",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		html = await response.text();
	} catch (error) {
		console.error(`Failed to fetch ${url}:`, error);
		return [];
	}

	const $ = cheerio.load(html);
	$("nav, footer, header, script, style, noscript, iframe, svg").remove();
	$("[role='navigation'], [role='banner'], [role='contentinfo']").remove();
	const textContent = $("body").text().replace(/\s+/g, " ").trim();

	const contentHash = crypto.createHash("md5").update(textContent).digest("hex");

	const { data: lastSnapshot, error: snapshotError } = await supabase
		.from("website_snapshots")
		.select("*")
		.eq("competitor_id", competitorId)
		.order("captured_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (snapshotError) {
		console.error("Failed to fetch latest snapshot:", snapshotError);
	}

	const { error: insertSnapshotError } = await supabase.from("website_snapshots").insert({
		competitor_id: competitorId,
		url,
		content_hash: contentHash,
		raw_content: textContent.substring(0, 50000),
	});

	if (insertSnapshotError) {
		console.error("Failed to store website snapshot:", insertSnapshotError);
	}

	if (!lastSnapshot || lastSnapshot.content_hash === contentHash) {
		return [];
	}

	const { data: competitor, error: competitorError } = await supabase
		.from("competitors")
		.select("name")
		.eq("id", competitorId)
		.maybeSingle();

	if (competitorError) {
		console.error("Failed to fetch competitor name:", competitorError);
	}

	const signals = await extractSignalsFromDiff(
		competitor?.name ?? "Unknown",
		lastSnapshot.raw_content ?? "",
		textContent,
	);

	if (signals.length === 0) {
		return [];
	}

	const rows = signals.map((signal) => ({
		competitor_id: competitorId,
		source: "website",
		signal_type: signal.signal_type,
		title: signal.title,
		summary: signal.summary,
		importance_score: signal.importance_score,
		raw_content: textContent.substring(0, 10000),
	}));

	const { data: insertedSignals, error: signalInsertError } = await supabase
		.from("signals")
		.insert(rows)
		.select();

	if (signalInsertError) {
		console.error("Failed to store extracted signals:", signalInsertError);
		return [];
	}

	for (const insertedSignal of insertedSignals ?? []) {
		try {
			await indexSignalInNia({
				id: insertedSignal.id,
				competitor_id: insertedSignal.competitor_id,
				signal_type: insertedSignal.signal_type,
				title: insertedSignal.title,
				summary: insertedSignal.summary,
				detected_at: insertedSignal.detected_at,
				importance_score: insertedSignal.importance_score,
			});

			const { error: markIndexedError } = await supabase
				.from("signals")
				.update({ nia_indexed: true })
				.eq("id", insertedSignal.id);

			if (markIndexedError) {
				console.error("Failed to mark signal as Nia indexed:", markIndexedError);
			}
		} catch (error) {
			console.error("Failed to index in Nia:", error);
		}
	}

	return insertedSignals ?? [];
}
