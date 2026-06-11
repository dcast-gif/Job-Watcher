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

        const matchingLinks = findMatchingLinks(html, websiteUrl, term);

        if (matchingLinks.length > 0) {
          for (const link of matchingLinks) {
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