const MAX_JOB_PAGES_TO_CHECK = 150;

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

function termMatchesText(text, term) {
  return normalise(text).includes(normalise(term));
}

function getPageTitle(html, fallback) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  if (titleMatch && titleMatch[1]) {
    return stripHtml(titleMatch[1]).replace(/\s+/g, " ").trim();
  }

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

  if (h1Match && h1Match[1]) {
    return stripHtml(h1Match[1]).replace(/\s+/g, " ").trim();
  }

  return fallback;
}

function isLikelyJobUrl(url) {
  const normalisedUrl = normalise(url);

  return (
    normalisedUrl.includes("myworkdayjobs com") ||
    normalisedUrl.includes(" greenhouse io") ||
    normalisedUrl.includes(" lever co") ||
    normalisedUrl.includes(" smartrecruiters com") ||
    normalisedUrl.includes(" workable com") ||
    normalisedUrl.includes(" bamboohr com") ||
    normalisedUrl.includes(" ashbyhq com") ||
    normalisedUrl.includes(" recruitee com") ||
    normalisedUrl.includes(" job ") ||
    normalisedUrl.includes(" jobs ") ||
    normalisedUrl.includes(" careers ")
  );
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
    links.push({
      title: "Workday job result",
      url: workdayMatch[0]
    });
  }

  return removeDuplicateLinks(links).slice(0, MAX_JOB_PAGES_TO_CHECK);
}

function removeDuplicateLinks(links) {
  const seen = new Set();

  return links.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
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

export async function POST(request) {
  try {
    const { terms, websites, locations = [] } = await request.json();

    const results = [];

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

      const candidateJobLinks = findCandidateJobLinks(html, websiteUrl);

      for (const candidate of candidateJobLinks) {
        let jobHtml;

        try {
          jobHtml = await fetchHtml(candidate.url);
        } catch {
          continue;
        }

        if (!jobHtml) continue;

        const jobText = stripHtml(jobHtml);
        const pageTitle = getPageTitle(jobHtml, candidate.title);

        for (const term of terms) {
          const termMatches = termMatchesText(jobText, term);
          const locationMatches = locationMatchesText(jobText, locations);

          if (termMatches && locationMatches) {
            results.push({
              term,
              website,
              title: pageTitle || term,
              url: candidate.url,
              foundAt: new Date().toISOString()
            });
          }
        }
      }

      const pageText = stripHtml(html);

      for (const term of terms) {
        const termMatches = termMatchesText(pageText, term);
        const locationMatches = locationMatchesText(pageText, locations);

        if (termMatches && locationMatches) {
          const directLinks = findCandidateJobLinks(html, websiteUrl).filter(
            (link) => termMatchesText(link.title, term)
          );

          for (const link of directLinks) {
            results.push({
              term,
              website,
              title: link.title || term,
              url: link.url,
              foundAt: new Date().toISOString()
            });
          }
        }
      }
    }

    return Response.json({
      results: removeDuplicateLinks(results)
    });
  } catch (error) {
    return Response.json(
      { error: "Search failed", details: error.message },
      { status: 500 }
    );
  }
}