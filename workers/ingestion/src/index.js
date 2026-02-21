import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function main() {
  const res = await fetch("https://example.com");
  const html = await res.text();

  const $ = cheerio.load(html);
  console.log("Title:", $("title").text());
}

main().catch(console.error);