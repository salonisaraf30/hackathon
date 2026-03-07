import { loadEnvConfig } from "@next/env";
import * as cheerio from "cheerio";

loadEnvConfig(process.cwd());

// Target pages to scrape per competitor
const TARGET_PATHS = [
  { path: "",           label: "homepage"  },
  { path: "/pricing",   label: "pricing"   },
  { path: "/blog",      label: "blog"      },
  { path: "/changelog", label: "changelog" },
  { path: "/about",     label: "about"     },
  { path: "/careers",   label: "careers"   },
];

const UA = "Mozilla/5.0 (compatible; CompetitorPulse/1.0)";

interface PageResult {
  label: string;
  url: string;
  status: "success" | "failed" | "not-found";
  textLength?: number;
  sections?: {
    header: number;
    nav: number;
    main: number;
    footer: number;
  };
}

async function fetchPageText(url: string): Promise<{ text: string | null; sections: any }> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { text: null, sections: null };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noise
    $("script, style, noscript, iframe, svg").remove();

    // Extract key structural sections
    const headerText = $("header, [role='banner']").text().replace(/\s+/g, " ").trim();
    const navText = $("nav, [role='navigation']").text().replace(/\s+/g, " ").trim();
    const mainText = $("main, [role='main'], #main, #content, .content").text().replace(/\s+/g, " ").trim();
    const footerText = $("footer, [role='contentinfo']").text().replace(/\s+/g, " ").trim();

    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const structured = [headerText, navText, mainText, footerText].filter(Boolean).join(" | ");

    const finalText = (structured.length > 100 ? structured : bodyText).substring(0, 15000);

    return {
      text: finalText,
      sections: {
        header: headerText.length,
        nav: navText.length,
        main: mainText.length,
        footer: footerText.length,
      },
    };
  } catch (err: any) {
    return { text: null, sections: null };
  }
}

async function testWebsiteMonitor() {
  console.log("=== Testing Website Monitor (Multi-Page Scraping) ===\n");

  // Test URL - can be passed as CLI arg
  const testUrl = process.argv[2] || "https://linear.app";
  const baseUrl = testUrl.replace(/\/$/, "");

  console.log(`Target website: ${baseUrl}\n`);
  console.log("Scraping pages in parallel...\n");

  // Build full URLs
  const pageTargets = TARGET_PATHS.map((t) => ({
    label: t.label,
    fullUrl: `${baseUrl}${t.path}`,
  }));

  // Fetch all pages in parallel
  const startTime = Date.now();
  const results = await Promise.allSettled(
    pageTargets.map(async (target) => {
      const { text, sections } = await fetchPageText(target.fullUrl);
      return {
        label: target.label,
        url: target.fullUrl,
        text,
        sections,
      };
    })
  );
  const elapsed = Date.now() - startTime;

  // Process results
  const pageResults: PageResult[] = [];
  let totalTextLength = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      const { label, url, text, sections } = result.value;
      if (text) {
        pageResults.push({
          label,
          url,
          status: "success",
          textLength: text.length,
          sections,
        });
        totalTextLength += text.length;
      } else {
        pageResults.push({ label, url, status: "not-found" });
      }
    } else {
      pageResults.push({
        label: "unknown",
        url: "unknown",
        status: "failed",
      });
    }
  }

  // Display results
  console.log("Page Scraping Results:");
  console.log("-".repeat(80));

  for (const page of pageResults) {
    const statusIcon = page.status === "success" ? "✓" : page.status === "not-found" ? "✗" : "⚠";
    const sizeInfo = page.textLength ? `${(page.textLength / 1024).toFixed(1)}KB` : "N/A";
    console.log(`  ${statusIcon} ${page.label.padEnd(12)} → ${sizeInfo.padEnd(8)} ${page.url}`);

    if (page.sections) {
      console.log(`       Sections: header=${page.sections.header}, nav=${page.sections.nav}, main=${page.sections.main}, footer=${page.sections.footer}`);
    }
  }

  console.log("-".repeat(80));

  const successCount = pageResults.filter((p) => p.status === "success").length;
  const notFoundCount = pageResults.filter((p) => p.status === "not-found").length;

  console.log(`\nSummary:`);
  console.log(`  Pages scraped: ${successCount}/${TARGET_PATHS.length}`);
  console.log(`  Not found: ${notFoundCount}`);
  console.log(`  Total text: ${(totalTextLength / 1024).toFixed(1)}KB`);
  console.log(`  Time: ${elapsed}ms`);

  if (successCount === 0) {
    console.log("\n❌ No pages could be scraped. Check if the URL is correct.");
    return;
  }

  // Show sample of combined content
  console.log("\n--- Sample Combined Content (first 500 chars per page) ---\n");

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.text) {
      const { label, text } = result.value;
      console.log(`=== ${label.toUpperCase()} ===`);
      console.log(text.substring(0, 500).replace(/\n/g, " ") + "...\n");
    }
  }

  console.log("✓ Website monitor is working correctly!");
  console.log("\nIn production, this content would be hashed, stored, and diffed against previous snapshots.");
  console.log("Changes would be sent to Claude for signal extraction.\n");

  console.log("Try testing with other websites:");
  console.log("  npx tsx scripts/test-website-monitor.ts https://stripe.com");
  console.log("  npx tsx scripts/test-website-monitor.ts https://notion.so");
  console.log("  npx tsx scripts/test-website-monitor.ts https://vercel.com");
}

testWebsiteMonitor().catch(console.error);
