export interface WikipediaSummary {
  title: string;
  extract: string;
  wikipediaUrl?: string;
  thumbnailUrl?: string;
}

export async function fetchWikipediaCheeseSummary(
  wikiTitle: string
): Promise<WikipediaSummary | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      wikiTitle.trim().replace(/\s+/g, "_")
    )}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "CheeseboxdApp/1.0 (contact: info@cheeseboxd.local)",
      },
    });

    if (!res.ok) {
      console.warn(`Wikipedia summary not found for: ${wikiTitle} (Status: ${res.status})`);
      return null;
    }

    const data: any = await res.json();
    return {
      title: data.title || wikiTitle,
      extract: data.extract || "",
      wikipediaUrl: data.content_urls?.desktop?.page,
      thumbnailUrl: data.thumbnail?.source,
    };
  } catch (error) {
    console.error(`Failed to fetch Wikipedia summary for ${wikiTitle}:`, error);
    return null;
  }
}
