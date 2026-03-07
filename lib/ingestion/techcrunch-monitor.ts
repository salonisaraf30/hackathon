// lib/ingestion/techcrunch-monitor.ts
// No additional installs needed — cheerio is already in package.json

import * as cheerio from 'cheerio'
import type { SupabaseClient } from "@supabase/supabase-js";

import { extractSignalsFromText } from './signal-extractor'
import type { RawSignal, Competitor } from "./types";

// TechCrunch RSS feeds — general feed + focused category feeds
const TC_FEEDS = [
  'https://techcrunch.com/feed/',                        // All articles
  'https://techcrunch.com/category/startups/feed/',      // Startup coverage
  'https://techcrunch.com/category/venture/feed/',       // Funding rounds
  'https://techcrunch.com/category/artificial-intelligence/feed/', // AI moves
]

interface TechCrunchArticle {
  title: string
  description: string
  link: string
  pubDate: string
  categories: string[]
}

/**
 * Fetches and parses a single TechCrunch RSS feed URL.
 * Returns an array of structured articles.
 */
async function fetchFeed(feedUrl: string): Promise<TechCrunchArticle[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'CompetitorPulse/1.0 (RSS reader)' },
    })

    if (!res.ok) {
      console.warn(`[TechCrunch] Feed fetch failed: ${feedUrl} → ${res.status}`)
      return []
    }

    const xml = await res.text()
    const $ = cheerio.load(xml, { xmlMode: true })
    const articles: TechCrunchArticle[] = []

    $('item').each((_, el) => {
      const title = $(el).find('title').text().trim()
      const description = $(el).find('description').text().trim()
      const link = $(el).find('link').text().trim() || $(el).find('guid').text().trim()
      const pubDate = $(el).find('pubDate').text().trim()

      const categories: string[] = []
      $(el).find('category').each((_, cat) => {
        categories.push($(cat).text().trim())
      })

      if (title) {
        articles.push({ title, description, link, pubDate, categories })
      }
    })

    return articles
  } catch (err) {
    console.error(`[TechCrunch] Error fetching feed ${feedUrl}:`, err)
    return []
  }
}

/**
 * Returns true if an article is relevant to the given competitor.
 * Matches against: competitor name, domain (e.g. "stripe.com" → "stripe"),
 * and any aliases stored on the competitor record.
 */
function isRelevant(article: TechCrunchArticle, competitor: Competitor): boolean {
  const competitorName = competitor.name?.toLowerCase() ?? ''

  // Derive a short domain keyword from website_url, e.g. "https://stripe.com" → "stripe"
  const domainKeyword = competitor.website_url
    ? competitor.website_url
        .replace(/https?:\/\//, '')
        .split('/')[0]
        .replace(/^www\./, '')
        .split('.')[0]
        .toLowerCase()
    : ''

  const searchTerms = [competitorName, domainKeyword].filter(Boolean)

  const haystack = [
    article.title,
    article.description,
    ...article.categories,
  ]
    .join(' ')
    .toLowerCase()

  return searchTerms.some((term) => haystack.includes(term))
}

/**
 * Main monitor function — drop-in replacement for monitorNews().
 * Scans TechCrunch RSS feeds for articles mentioning `competitor`,
 * then runs Claude signal extraction on the top matches.
 */
export async function monitorTechCrunch(
  competitor: Competitor,
  _supabaseClient?: SupabaseClient
): Promise<RawSignal[]> {
  // Fetch all feeds in parallel; deduplicate by article link
  const feedResults = await Promise.allSettled(TC_FEEDS.map(fetchFeed))

  const seen = new Set<string>()
  const allArticles: TechCrunchArticle[] = []

  for (const result of feedResults) {
    if (result.status === 'fulfilled') {
      for (const article of result.value) {
        if (!seen.has(article.link)) {
          seen.add(article.link)
          allArticles.push(article)
        }
      }
    }
  }

  if (!allArticles.length) {
    console.log(`[TechCrunch] No articles fetched for ${competitor.name}`)
    return []
  }

  // Filter to articles published within the last 48 hours
  const cutoff = Date.now() - 48 * 60 * 60 * 1000
  const recent = allArticles.filter((a) => {
    const ts = a.pubDate ? new Date(a.pubDate).getTime() : 0
    return ts >= cutoff
  })

  // Filter to articles that actually mention this competitor
  const relevant = recent.filter((a) => isRelevant(a, competitor))

  if (!relevant.length) {
    console.log(`[TechCrunch] No relevant articles for ${competitor.name}`)
    return []
  }

  console.log(
    `[TechCrunch] Found ${relevant.length} relevant article(s) for ${competitor.name}`
  )

  // Build a clean text block for Claude — include source URLs for traceability
  const textBlock = relevant
    .slice(0, 5) // cap at 5 articles per run to control token usage
    .map(
      (a) =>
        `TITLE: ${a.title}\nSOURCE: ${a.link}\nDATE: ${a.pubDate}\nSUMMARY: ${a.description}`
    )
    .join('\n\n---\n\n')

  // Reuse the existing signal extractor — 'news' source context is correct for TC articles
  const signals = await extractSignalsFromText(textBlock, competitor.name, 'news')

  // Attach source_url to each signal from the first matching article
  // (best-effort; extractor may produce multiple signals from one text block)
  return signals.map((signal, i) => ({
    competitor_id: competitor.id,
    source: 'techcrunch',
    signal_type: signal.signal_type,
    title: signal.title,
    summary: signal.summary,
    importance_score: signal.importance_score,
    raw_content: textBlock.substring(0, 10000),
  }))
}

