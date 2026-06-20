using HelloWork.Api.Models;
using HelloWork.Api.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace HelloWork.Tests;

/// <summary>
/// TDD tests for BotService.
///
/// Design note: BotService creates HttpClient internally via `new HttpClient()`,
/// which makes the live Azure OpenAI path impossible to test without refactoring
/// to inject IHttpClientFactory.  These tests therefore cover the observable
/// contract of the mock/fallback path triggered when credentials are absent.
/// </summary>
public class BotServiceTests
{
    // ─── Helper ───────────────────────────────────────────────────────────────

    /// <summary>Builds a BotService with optional AzureOpenAI credentials.</summary>
    private static BotService BuildSut(string? endpoint = null, string? apiKey = null)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AzureOpenAI:Endpoint"] = endpoint,
                ["AzureOpenAI:ApiKey"]   = apiKey,
            })
            .Build();

        return new BotService(config, NullLogger<BotService>.Instance);
    }

    // ─── GetOnDemandReply ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetOnDemandReply_returns_mock_reply_when_credentials_not_configured()
    {
        // Arrange: empty configuration → triggers mock-reply branch
        var sut = BuildSut();

        // Act
        var result = await sut.GetOnDemandReply(
            groupId:        Guid.NewGuid(),
            groupName:      "Tech Group",
            userPrompt:     "Cosa state usando in AI?",
            groupTags:      ["AI", "Tech"],
            recentHistory:  []);

        // Assert: constant mock string returned, no exception
        Assert.Equal(
            "Ciao! Sono il bot di questo gruppo. Cosa vorreste discutere oggi? 🤖",
            result);
    }

    [Fact]
    public async Task GetOnDemandReply_handles_empty_history_without_exception()
    {
        // Arrange: no credentials + empty history → FormatHistory returns placeholder
        var sut = BuildSut();
        var emptyHistory = new List<GroupMessage>();

        // Act
        var result = await sut.GetOnDemandReply(
            groupId:        Guid.NewGuid(),
            groupName:      "Innovation Hub",
            userPrompt:     "Qualcuno ha notizie sull'AI?",
            groupTags:      ["Innovation", "AI"],
            recentHistory:  emptyHistory);

        // Assert: valid non-empty reply returned with no exception
        Assert.NotNull(result);
        Assert.NotEmpty(result);
    }

    // ─── GetProactivePost ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetProactivePost_returns_mock_post_when_credentials_not_configured()
    {
        var sut = BuildSut();

        var result = await sut.GetProactivePost(
            groupId:   Guid.NewGuid(),
            groupName: "AI Champions",
            groupTags: ["AI", "Agile"]);

        Assert.Equal(
            "Buongiorno a tutti! Cosa state esplorando di nuovo questa settimana? 🤖",
            result);
    }

    [Fact]
    public async Task GetProactivePost_handles_empty_tags_list_without_exception()
    {
        // Arrange: string.Join(", ", []) = "" — must not throw
        var sut = BuildSut();

        var result = await sut.GetProactivePost(
            groupId:   Guid.NewGuid(),
            groupName: "Empty Tags Group",
            groupTags: []);

        Assert.NotNull(result);
        Assert.NotEmpty(result);
    }
}
