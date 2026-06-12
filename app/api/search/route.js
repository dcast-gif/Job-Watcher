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

function findMatchingLinks(html, baseUrl, term) {
  const matches = [];
  const lowerTerm = term.toLowerCase();

  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let anchorMatch;

  while ((anchorMatch = anchorRegex.exec(html)) !== null) {
    const href = anchorMatch[1];
    const anchorText = stripHtml(anchorMatch[2]);
    const lowerAnchorText = anchorText.toLowerCase();

    if (lowerAnchorText.includes(lowerTerm)) {
      const absoluteUrl = makeAbsoluteUrl(href, baseUrl);

      if (absoluteUrl) {
        matches.push({
          title: anchorText || term,
          url: absoluteUrl
        });
      }
    }
  }

  return matches;
}

function findWorkdayLinks(html, term) {
  const matches = [];
  const decodedHtml = decodeHtml(html).replace(/\\\//g, "/");
  const normalisedTerm = normalise(term);
  const slugTerm = normalisedTerm.replace(/\s+/g, "-");

  const workdayUrlRegex =
    /https?:\/\/[^"'\s<>\\]*myworkdayjobs\.com[^"'\s<>\\]*/gi;

  let match;

  while ((match = workdayUrlRegex.exec(decodedHtml)) !== null) {
    const url = match[0];
    const start = Math.max(0, match.index - 1500);
    const end = Math.min(decodedHtml.length, match.index + 1500);
    const nearbyText = stripHtml(decodedHtml.slice(start, end));
    const normalisedNearbyText = normalise(nearbyText);
    const normalisedUrl = normalise(url);

    const termIsNearby = normalisedNearbyText.includes(normalisedTerm);
    const termIsInUrl = normalisedUrl.includes(slugTerm.replace(/-/g, " "));

    if (termIsNearby || termIsInUrl) {
      matches.push({
        title: term,
        url
      });
    }
  }

  return matches;
}

function removeDuplicateLinks(links) {
  const seen = new Set();

  return links.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
}

export async function POST(request) {
  try {
    const { terms, websites } = await request.json();

    const results = [];

    for (const website of websites) {
      const websiteUrl = website.startsWith("http")
        ? website
        : `https://${website}`;

      let response;

      try {
        response = await fetch(websiteUrl, {
          headers: {
            "User-Agent": "JobWatcherBot/1.0"
          }
        });
      } catch {
        continue;
      }

      if (!response.ok) continue;

      const html = await response.text();
      const lowerHtml = html.toLowerCase();

      for (const term of terms) {
        const lowerTerm = term.toLowerCase();

        if (!lowerHtml.includes(lowerTerm)) continue;

        const workdayLinks = findWorkdayLinks(html, term);
        const matchingLinks = findMatchingLinks(html, websiteUrl, term);

        const linksToUse = removeDuplicateLinks([
          ...workdayLinks,
          ...matchingLinks
        ]);

        if (linksToUse.length > 0) {
          for (const link of linksToUse) {
            results.push({
              term,
              website,
              title: link.title,
              url: link.url,
              foundAt: new Date().toISOString()
            });
          }
        } else {
          results.push({
            term,
            website,
            title: term,
            url: websiteUrl,
            foundAt: new Date().toISOString()
          });
        }
      }
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json(
      { error: "Search failed", details: error.message },
      { status: 500 }
    );
  }
}