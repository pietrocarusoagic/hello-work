using System.Xml;

namespace HelloWork.Api.Services;

public record NewsItem(string Title, string Url);

public class NewsService(IHttpClientFactory httpClientFactory, ILogger<NewsService> logger)
{
    private const string RssTemplate =
        "https://news.google.com/rss/search?q={0}&hl=it&gl=IT&ceid=IT:it";

    /// <summary>
    /// Fetches the top-3 news items from Google News RSS for the given tag.
    /// Returns an empty list on failure (network errors, parse errors, etc.).
    /// </summary>
    public async Task<List<NewsItem>> GetTopNewsAsync(string tag)
    {
        var encodedTag = Uri.EscapeDataString(tag);
        var url = string.Format(RssTemplate, encodedTag);

        try
        {
            var client = httpClientFactory.CreateClient("news");
            var xml = await client.GetStringAsync(url);

            var doc = new XmlDocument();
            doc.LoadXml(xml);

            var items = doc.SelectNodes("//channel/item");
            if (items is null) return [];

            var results = new List<NewsItem>();
            foreach (XmlNode item in items)
            {
                if (results.Count >= 3) break;

                var title = item.SelectSingleNode("title")?.InnerText;
                var link  = item.SelectSingleNode("link")?.InnerText;

                if (!string.IsNullOrWhiteSpace(title) && !string.IsNullOrWhiteSpace(link))
                    results.Add(new NewsItem(title, link));
            }

            return results;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "NewsService: failed to fetch news for tag '{Tag}'.", tag);
            return [];
        }
    }
}
