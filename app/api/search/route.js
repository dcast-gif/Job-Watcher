const MAX_JOB_PAGES_TO_CHECK = 50;

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function makeAbsoluteUrl(href, baseUrl) {
  try {
    return new URL(decodeHtml(href), baseUrl).toString();
  } catch {
    return null;
  }
}

function getOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

function normalise(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function locationMatchesText(text, locations) {
  if (!locations || locations.length === 0) return true;

  const normalisedText = normalise(text);

  return locations.some((location) => {
    const normalisedLocation = normalise(location);
    return normalisedLocation && normalisedText.includes(normalisedLocation);
  });
}

function termMatchesTitleOrUrl(term, title, url) {
  const normalisedTerm = normalise(term);
  const searchableText = `${normalise(title)} ${normalise(url)}`;

  return searchableText.includes(normalisedTerm);
}

function getPageTitle(html, fallback) {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

  if (h1Match && h1Match[1]) {
    return stripHtml(h1Match[1]).replace(/\s+/g, " ").trim();
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  if (titleMatch && titleMatch[1]) {
    return stripHtml(titleMatch[1]).replace(/\s+/g, " ").trim();
  }

  return fallback;
}

function isRejectedUrl(url) {
  const normalisedUrl = normalise(url);

  const rejectedWords = [
    "submit job",
    "submit brief",
    "job brief",
    "support your job search",
    "job search advice",
    "how we can support",
    "candidate",
    "candidates",
    "employer",
    "employers",
    "contact",
    "about",
    "privacy",
    "terms",
    "login",
    "register",
    "newsletter",
    "blog",
    "news"
  ];

  return rejectedWords.some((word) => normalisedUrl.includes(word));
}

function isLikelyJobUrl(url) {
  if (isRejectedUrl(url)) return false;

  const normalisedUrl = normalise(url);

  if (normalisedUrl.includes("myworkdayjobs com")) return true;
  if (normalisedUrl.includes("greenhouse io")) return true;
  if (normalisedUrl.includes("lever co")) return true;
  if (normalisedUrl.includes("smartrecruiters com")) return true;
  if (normalisedUrl.includes("workable com")) return true;
  if (normalisedUrl.includes("bamboohr com")) return true;
  if (normalisedUrl.includes("ashbyhq com")) return true;
  if (normalisedUrl.includes("recruitee com")) return true;

  return normalisedUrl.includes(" job ") || normalisedUrl.includes(" jobs ");
}

function findCandidateJobLinks(html, baseUrl) {
  const links = [];
  const decodedHtml = decodeHtml(html).replace(/\\\//g, "/");

  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let anchorMatch;

  while ((anchorMatch = anchorRegex.exec(decodedHtml)) !== null) {
    const href = anchorMatch[1];
    const anchorText = stripHtml(anchorMatch[2]);
    const absoluteUrl = makeAbsoluteUrl(href, baseUrl);

    if (absoluteUrl && isLikelyJobUrl(absoluteUrl)) {
      links.push({
        title: anchorText || "Job result",
        url: absoluteUrl
      });
    }
  }

  const workdayUrlRegex =
    /https?:\/\/[^"'\s<>\\]*myworkdayjobs\.com[^"'\s<>\\]*/gi;

  let workdayMatch;

  while ((workdayMatch = workdayUrlRegex.exec(decodedHtml)) !== null) {
    const url = workdayMatch[0];

    if (!isRejectedUrl(url)) {
      links.push({
        title: "Workday job result",
        url
      });
    }
  }

  return removeDuplicateLinks(links);
}

function findUrlsInXml(xml, baseUrl) {
  const urls = [];
  const locRegex = /<loc>([\s\S]*?)<\/loc>/gi;
  let match;

  while ((match = locRegex.exec(xml)) !== null) {
    const url = makeAbsoluteUrl(stripHtml(match[1]), baseUrl);

    if (url && isLikelyJobUrl(url)) {
      urls.push({
        title: "Job result",
        url
      });
    }
  }

  return removeDuplicateLinks(urls);
}
async function discoverHarmonicJobLinks(baseUrl) {
  const origin = getOrigin(baseUrl);

  if (!origin.includes("harmonicfinance.com")) {
    return [];
  }

  const probeUrls = [
  `${origin}/job.php`,
  `${origin}/jobs.php`,
  `${origin}/wp-admin/admin-ajax.php`,
  `${origin}/src/script/site.js`
];

  const discovered = [];

  for (const probeUrl of probeUrls) {
    let text;

    try {
      text = await fetchText(probeUrl);
    } catch {
      continue;
    }

    if (!text) continue;

const decodedText = decodeHtml(text).replace(/\\\//g, "/");

// Harmonic probe preview disabled
    const urlRegex =
      /https?:\/\/[^"'\s<>\\]+|\/job\/[^"'\s<>\\]+|\/jobs\/[^"'\s<>\\]+/gi;

    let match;

    while ((match = urlRegex.exec(decodedText)) !== null) {
      const url = makeAbsoluteUrl(match[0], origin);

      if (url && isLikelyJobUrl(url)) {
        discovered.push({
          title: "Harmonic job result",
          url
        });
      }
    }
  }

  return removeDuplicateLinks(discovered);
}
async function discoverSitemapJobLinks(baseUrl) {
  const origin = getOrigin(baseUrl);

  const sitemapUrls = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/job-sitemap.xml`,
    `${origin}/jobs-sitemap.xml`,
    `${origin}/post-sitemap.xml`,
    `${origin}/page-sitemap.xml`
  ];

  const discovered = [];

  for (const sitemapUrl of sitemapUrls) {
    let xml;

    try {
      xml = await fetchText(sitemapUrl);
    } catch {
      continue;
    }

    if (!xml) continue;

    const nestedSitemaps = [];
    const locRegex = /<loc>([\s\S]*?)<\/loc>/gi;
    let locMatch;

    while ((locMatch = locRegex.exec(xml)) !== null) {
      const url = makeAbsoluteUrl(stripHtml(locMatch[1]), sitemapUrl);

      if (!url) continue;

      if (url.includes("sitemap")) {
        nestedSitemaps.push(url);
      } else if (isLikelyJobUrl(url)) {
        discovered.push({
          title: "Job result",
          url
        });
      }
    }

    for (const nestedSitemapUrl of nestedSitemaps.slice(0, 10)) {
      let nestedXml;

      try {
        nestedXml = await fetchText(nestedSitemapUrl);
      } catch {
        continue;
      }

      if (!nestedXml) continue;

      discovered.push(...findUrlsInXml(nestedXml, nestedSitemapUrl));
    }
  }

  return removeDuplicateLinks(discovered);
}

function removeDuplicateLinks(links) {
  const seen = new Set();

  return links.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "JobWatcherBot/1.0"
    }
  });

  if (!response.ok) return null;

  return response.text();
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "JobWatcherBot/1.0"
    }
  });

  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) return null;

  return response.text();
}
function detectPlatform(html, possibleUrls) {
  const combinedText = normalise(`${html} ${possibleUrls.join(" ")}`);

  const platforms = [];

  if (combinedText.includes("myworkdayjobs")) platforms.push("Workday");
  if (combinedText.includes("greenhouse")) platforms.push("Greenhouse");
  if (combinedText.includes("jobadder")) platforms.push("JobAdder");
  if (combinedText.includes("wp job manager")) platforms.push("WP Job Manager");
  if (combinedText.includes("lever co")) platforms.push("Lever");
  if (combinedText.includes("smartrecruiters")) platforms.push("SmartRecruiters");
  if (combinedText.includes("workable")) platforms.push("Workable");

  return platforms.length > 0 ? platforms.join(", ") : "Unknown";
}
function inspectSite(html, baseUrl) {
  const decodedHtml = decodeHtml(html).replace(/\\\//g, "/");
  const findings = [];

  const patterns = [
    "wp-json",
    "/api/",
    "graphql",
    "jobs",
    "vacancies",
    "recruit",
    "ajax",
    "greenhouse",
    "lever",
    "workable",
    "jobadder",
    "bullhorn",
    "workday"
  ];

  for (const pattern of patterns) {
    const count = decodedHtml.toLowerCase().split(pattern.toLowerCase()).length - 1;

    if (count > 0) {
      findings.push(`${pattern}: ${count}`);
    }
  }

  const urlRegex = /https?:\/\/[^"'\s<>\\]+|\/[^"'\s<>\\]+/gi;
  const possibleUrls = [];
  let match;

  while ((match = urlRegex.exec(decodedHtml)) !== null) {
    const rawUrl = match[0];

    if (
      rawUrl.toLowerCase().includes("job") ||
      rawUrl.toLowerCase().includes("api") ||
      rawUrl.toLowerCase().includes("vacanc") ||
      rawUrl.toLowerCase().includes("recruit") ||
      rawUrl.toLowerCase().includes("wp-json")
    ) {
      const absoluteUrl = makeAbsoluteUrl(rawUrl, baseUrl);

      if (absoluteUrl) {
        possibleUrls.push(absoluteUrl);
      }
    }
  }

  return {
    findings,
    possibleUrls: [...new Set(possibleUrls)].slice(0, 10)
  };
}
async function discoverGreenhouseJobLinks(html, baseUrl) {
  const decodedHtml = decodeHtml(html).replace(/\\\//g, "/");
  const discovered = [];

  const boardRegex =
  /https?:\/\/boards\.greenhouse\.io\/embed\/job_board(?:\/js)?\?for=([a-zA-Z0-9_-]+)/gi;
  let boardMatch;

  while ((boardMatch = boardRegex.exec(decodedHtml)) !== null) {
    const companyToken = boardMatch[1];
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${companyToken}/jobs?content=true`;

    let data;

    try {
      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "JobWatcherBot/1.0"
        }
      });

      if (!response.ok) continue;

      data = await response.json();
    } catch {
      continue;
    }

    const jobs = data.jobs || [];

    for (const job of jobs) {
      discovered.push({
        title: job.title || "Greenhouse job result",
        url: job.absolute_url || `https://boards.greenhouse.io/${companyToken}/jobs/${job.id}`,
        rawText: `${job.title || ""} ${job.location?.name || ""} ${job.content || ""}`
      });
    }
  }

  return removeDuplicateLinks(discovered);
}
function titleFromUrl(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1] || "";

    if (!lastPart) return "";

    return lastPart
      .replace(/-\d+$/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    return "";
  }
}
function extractJobLocation(html) {
  const text = decodeHtml(html || "");

  const jsonLocationMatch = text.match(/"jobLocation"[\s\S]*?"addressLocality"\s*:\s*"([^"]+)"/i);
  if (jsonLocationMatch) return jsonLocationMatch[1];

  const localityMatch = text.match(/itemprop=["']addressLocality["'][^>]*>([\s\S]*?)<\/[^>]+>/i);
  if (localityMatch) return stripHtml(localityMatch[1]);

  const locationLabelMatch = text.match(/Location[\s\S]{0,200}?<\/[^>]+>\s*<[^>]+>([\s\S]*?)<\/[^>]+>/i);
  if (locationLabelMatch) return stripHtml(locationLabelMatch[1]);

  return "";
}
function cleanResultTitle(title, term, url = "") {
  if (url.includes("absolute-recruit.com/job/")) {
    const urlTitle = titleFromUrl(url);
    if (urlTitle) return urlTitle;
  }

  let cleaned = stripHtml(title || "")
    .replace(/&8211;/g, "–")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&8217;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.toLowerCase() === "job result") {
    return term;
  }

  const splitPoints = [
    "Reporting to",
    "reporting to",
    "you will",
    "You will",
    "We're",
    "We’re",
    "Join a",
    "An excellent opportunity",
    "Commercially focused",
    "View details",
    "Apply now"
  ];

  for (const splitPoint of splitPoints) {
    const index = cleaned.indexOf(splitPoint);
    if (index > 0) cleaned = cleaned.slice(0, index).trim();
  }

  if (cleaned.length > 90) {
    cleaned = `${cleaned.slice(0, 90).trim()}...`;
  }

  return cleaned;
}
export async function POST(request) {
  try {
    const { terms, websites, locations = [] } = await request.json();

    const results = [];
const debug = [];

    for (const website of websites) {
      const websiteUrl = website.startsWith("http")
        ? website
        : `https://${website}`;

      let html;

      try {
        html = await fetchHtml(websiteUrl);
      } catch {
        continue;
      }

      if (!html) continue;

      const pageLinks = findCandidateJobLinks(html, websiteUrl);
const sitemapLinks = await discoverSitemapJobLinks(websiteUrl);
const harmonicLinks = await discoverHarmonicJobLinks(websiteUrl);
const greenhouseLinks = await discoverGreenhouseJobLinks(
  html,
  websiteUrl
);
      const candidateJobLinks = removeDuplicateLinks([
  ...greenhouseLinks,
  ...pageLinks,
  ...sitemapLinks,
  ...harmonicLinks
]).slice(0, MAX_JOB_PAGES_TO_CHECK);
const inspection = inspectSite(html, websiteUrl);

debug.push({
  website,
  platform: detectPlatform(html, inspection.possibleUrls),
  pageLinks: pageLinks.length,
  sitemapLinks: sitemapLinks.length,
  harmonicLinks: harmonicLinks.length,
  greenhouseLinks: greenhouseLinks.length,
  totalCandidateLinks: candidateJobLinks.length,
  findings: inspection.findings,
  possibleUrls: inspection.possibleUrls,
});
      const BATCH_SIZE = 10;

for (let i = 0; i < candidateJobLinks.length; i += BATCH_SIZE) {
  const batch = candidateJobLinks.slice(i, i + BATCH_SIZE);

  const fetchedJobs = await Promise.all(
    batch.map(async (candidate) => {
      try {
        const jobHtml = await fetchHtml(candidate.url);

        return {
          candidate,
          jobHtml
        };
      } catch {
        return {
          candidate,
          jobHtml: null
        };
      }
    })
  );

  for (const item of fetchedJobs) {
    if (!item.jobHtml) continue;

    const jobText = item.candidate.rawText || stripHtml(item.jobHtml);
const pageTitle =
  item.candidate.title || getPageTitle(item.jobHtml, item.candidate.title);
    if (!locationMatchesText(jobText, locations)) continue;

    for (const term of terms) {
  if (termMatchesTitleOrUrl(term, pageTitle, item.candidate.url)) {
    results.push({
      term,
      website,
      title: cleanResultTitle(
        pageTitle || item.candidate.title,
        term,
        item.candidate.url
      ),
      url: item.candidate.url,
      foundAt: new Date().toISOString()
    });
  }
}
  }
}
    }

    return Response.json({
  results: removeDuplicateLinks(results),
  debug
});
  } catch (error) {
  console.error(error);

  return Response.json(
    {
      error: error.message || "Search failed",
      stack: error.stack
    },
    { status: 500 }
  );
}
}