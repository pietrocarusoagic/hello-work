using HelloWork.Api.Models;

namespace HelloWork.Api.Services;

public interface IBotService
{
    /// <summary>
    /// Generates an on-demand reply in the context of the given group.
    /// </summary>
    /// <param name="groupId">Target group.</param>
    /// <param name="groupName">Human-readable group name (for system prompt).</param>
    /// <param name="userPrompt">The question/message from the user.</param>
    /// <param name="groupTags">Tags that describe the group focus.</param>
    /// <param name="recentHistory">Last N messages for context.</param>
    Task<string> GetOnDemandReply(
        Guid groupId,
        string groupName,
        string userPrompt,
        List<string> groupTags,
        List<GroupMessage> recentHistory);

    /// <summary>
    /// Generates a proactive, unsolicited post to stimulate group engagement.
    /// </summary>
    /// <param name="groupId">Target group.</param>
    /// <param name="groupName">Human-readable group name.</param>
    /// <param name="groupTags">Tags that describe the group focus.</param>
    Task<string> GetProactivePost(Guid groupId, string groupName, List<string> groupTags);
}

public class BotService(IConfiguration config, ILogger<BotService> logger) : IBotService
{
    private static readonly string MockReply =
        "Ciao! Sono il bot di questo gruppo. Cosa vorreste discutere oggi? 🤖";

    public async Task<string> GetOnDemandReply(
        Guid groupId,
        string groupName,
        string userPrompt,
        List<string> groupTags,
        List<GroupMessage> recentHistory)
    {
        var endpoint = config["AzureOpenAI:Endpoint"];
        var apiKey = config["AzureOpenAI:ApiKey"];

        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(apiKey))
        {
            logger.LogWarning("AzureOpenAI not configured — returning mock reply (DEV_BYPASS mode).");
            return MockReply;
        }

        var historyText = FormatHistory(recentHistory);
        var tagsText = string.Join(", ", groupTags);

        var systemPrompt =
            $"""
            You are the engagement assistant for the "{groupName}" group on Hello Work, an internal AGIC corporate networking platform.
            Group focus: {tagsText}.
            Your role: answer questions, surface relevant content, and stimulate professional dialogue.
            Always respond in Italian. Be concise (max 3-4 sentences). Never fabricate facts.

            Recent conversation:
            {historyText}
            """;

        return await CallAzureOpenAI(endpoint, apiKey, systemPrompt, userPrompt);
    }

    public async Task<string> GetProactivePost(Guid groupId, string groupName, List<string> groupTags)
    {
        var endpoint = config["AzureOpenAI:Endpoint"];
        var apiKey = config["AzureOpenAI:ApiKey"];

        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(apiKey))
        {
            logger.LogWarning("AzureOpenAI not configured — returning mock proactive post.");
            return "Buongiorno a tutti! Cosa state esplorando di nuovo questa settimana? 🤖";
        }

        var tagsText = string.Join(", ", groupTags);

        var systemPrompt =
            $"""
            You are the engagement assistant for the "{groupName}" group on Hello Work.
            Group focus: {tagsText}.
            Your role: post a brief, engaging message to stimulate professional dialogue.
            Choose one of: share a relevant insight, ask an open question, propose a group activity.
            Always in Italian. Max 3 sentences. Make it feel human and relevant.
            """;

        return await CallAzureOpenAI(endpoint, apiKey, systemPrompt,
            "Generate a proactive engagement post for this group.");
    }

    // ── internals ────────────────────────────────────────────────────────────

    private static string FormatHistory(List<GroupMessage> messages) =>
        messages.Count == 0
            ? "(nessun messaggio recente)"
            : string.Join("\n", messages.Select(m => $"{m.SenderDisplayName}: {m.Body}"));

    private async Task<string> CallAzureOpenAI(
        string endpoint, string apiKey, string systemPrompt, string userMessage)
    {
        // Derive chat completions URL from the base endpoint.
        // Expects endpoint like: https://<resource>.openai.azure.com/openai/deployments/<deployment>
        var url = endpoint.TrimEnd('/') + "/chat/completions?api-version=2024-02-01";

        var payload = new
        {
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user",   content = userMessage  }
            },
            max_tokens = 300,
            temperature = 0.7
        };

        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("api-key", apiKey);

        var json = System.Text.Json.JsonSerializer.Serialize(payload);
        using var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        var response = await client.PostAsync(url, content);
        response.EnsureSuccessStatusCode();

        var responseText = await response.Content.ReadAsStringAsync();
        using var doc = System.Text.Json.JsonDocument.Parse(responseText);

        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? string.Empty;
    }
}
