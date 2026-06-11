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

        if (lowerHtml.includes(lowerTerm)) {
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