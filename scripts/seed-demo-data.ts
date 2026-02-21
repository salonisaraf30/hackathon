import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type CompetitorSeed = {
	user_id: string;
	name: string;
	website_url: string;
	twitter_handle: string;
	description: string;
	logo_url: string | null;
};

async function upsertCompetitor(competitor: CompetitorSeed) {
	const { data: existing } = await supabase
		.from("competitors")
		.select("id")
		.eq("user_id", competitor.user_id)
		.eq("name", competitor.name)
		.limit(1)
		.maybeSingle();

	if (existing?.id) {
		const { data, error } = await supabase
			.from("competitors")
			.update(competitor)
			.eq("id", existing.id)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update competitor ${competitor.name}: ${error.message}`);
		}

		return data;
	}

	const { data, error } = await supabase
		.from("competitors")
		.insert(competitor)
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to insert competitor ${competitor.name}: ${error.message}`);
	}

	return data;
}

async function seed(userId: string) {
	await supabase.from("user_products").upsert({
		user_id: userId,
		name: "FlowBoard",
		description: "A visual project management tool for remote teams",
		positioning: "We are Trello meets Miro for distributed engineering teams",
		target_market: "Remote-first engineering teams (10-100 people)",
		key_features: [
			"Visual boards",
			"Real-time collaboration",
			"Sprint planning",
			"Async standups",
		],
	});

	const competitors = [
		{
			user_id: userId,
			name: "Notion",
			website_url: "https://notion.so",
			twitter_handle: "@NotionHQ",
			description: "All-in-one workspace for notes, docs, and project management",
			logo_url: null,
		},
		{
			user_id: userId,
			name: "Linear",
			website_url: "https://linear.app",
			twitter_handle: "@linear",
			description: "Issue tracking and project management for software teams",
			logo_url: null,
		},
		{
			user_id: userId,
			name: "Coda",
			website_url: "https://coda.io",
			twitter_handle: "@caborhq",
			description: "Doc-powered workspace that blends docs and apps",
			logo_url: null,
		},
	] satisfies CompetitorSeed[];

	const insertedCompetitors = [];
	for (const competitor of competitors) {
		insertedCompetitors.push(await upsertCompetitor(competitor));
	}

	if (!insertedCompetitors || insertedCompetitors.length < 3) {
		throw new Error("Failed to seed competitors");
	}

	const now = new Date();
	const daysAgo = (days: number) =>
		new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
	const hoursAgo = (hours: number) =>
		new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

	const [notion, linear, coda] = insertedCompetitors;

	const signals = [
		{
			competitor_id: notion.id,
			source: "website",
			signal_type: "pricing_change",
			title: "Notion increases Plus plan from $8 to $12/user/month",
			summary:
				"Notion has updated their pricing page. The Plus plan (formerly $8/user/month) is now $12/user/month, a 50% increase. The Free tier remains unchanged. They added new AI features as justification for the price increase.",
			importance_score: 9,
			detected_at: hoursAgo(6),
		},
		{
			competitor_id: notion.id,
			source: "twitter",
			signal_type: "hiring",
			title: 'Notion hiring 3 ML engineers for "AI workspace" team',
			summary:
				'Notion posted 3 new ML engineer positions on their careers page, all for a new "AI Workspace Intelligence" team. The job descriptions mention real-time collaboration features and predictive project management.',
			importance_score: 7,
			detected_at: daysAgo(2),
		},
		{
			competitor_id: notion.id,
			source: "website",
			signal_type: "content_published",
			title: "Notion publishes case study on enterprise remote team adoption",
			summary:
				'New blog post titled "How GitLab Manages 2,000 Engineers in Notion." Focuses on remote-first workflows, async decision-making, and sprint planning — directly relevant to your target market.',
			importance_score: 6,
			detected_at: daysAgo(4),
		},
		{
			competitor_id: linear.id,
			source: "website",
			signal_type: "feature_update",
			title: "Linear ships visual boards and real-time cursor presence",
			summary:
				"Linear launched \"Linear Canvas\" — a visual board view for issues with drag-and-drop, color coding, and real-time cursor presence showing who is looking at what. This directly competes with your core visual boards feature.",
			importance_score: 10,
			detected_at: hoursAgo(3),
		},
		{
			competitor_id: linear.id,
			source: "product_hunt",
			signal_type: "product_launch",
			title: "Linear Canvas featured on Product Hunt — #1 Product of the Day",
			summary:
				"Linear Canvas hit #1 on Product Hunt with 1,200+ upvotes. Comments highlight the real-time collaboration and visual sprint planning. Several commenters compare it to Trello and Miro.",
			importance_score: 9,
			detected_at: hoursAgo(12),
		},
		{
			competitor_id: coda.id,
			source: "twitter",
			signal_type: "funding",
			title: "Coda raises $150M Series E at $1.4B valuation",
			summary:
				'Coda announced a $150M Series E round led by Greylock. CEO states the funding will go toward "AI-powered project management for distributed teams" — a direct overlap with your positioning.',
			importance_score: 8,
			detected_at: daysAgo(1),
		},
		{
			competitor_id: coda.id,
			source: "website",
			signal_type: "partnership",
			title: "Coda announces Slack + Zoom deep integration",
			summary:
				"Coda launched native integrations with Slack and Zoom, enabling async standup summaries and automated meeting notes. Press release specifically targets \"remote engineering teams who live in Slack.\"",
			importance_score: 7,
			detected_at: daysAgo(3),
		},
		{
			competitor_id: coda.id,
			source: "website",
			signal_type: "content_published",
			title: 'Coda publishes "State of Remote Work 2025" report',
			summary:
				"Comprehensive report with survey data from 5,000 remote teams. Key finding: 67% want visual project management tools. Coda positions itself as the solution. Your target market is literally the audience for this report.",
			importance_score: 5,
			detected_at: daysAgo(5),
		},
	];

	await supabase.from("signals").insert(signals);

	console.log(`Seeded: 1 product, ${competitors.length} competitors, ${signals.length} signals`);
	console.log("Ready for demo!");
}

const userId = process.argv[2];
if (!userId) {
	console.error("Usage: npm run seed:demo -- <user-uuid>");
	process.exit(1);
}

seed(userId).catch((error) => {
	console.error("Seed failed:", error);
	process.exit(1);
});
