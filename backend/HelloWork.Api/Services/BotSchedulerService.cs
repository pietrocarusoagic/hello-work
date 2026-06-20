using HelloWork.Api.DTOs;
using HelloWork.Api.Hubs;
using HelloWork.Api.Infrastructure;
using HelloWork.Api.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HelloWork.Api.Services;

/// <summary>
/// BackgroundService that runs hourly, looks for groups where the bot is enabled
/// and the last proactive post is older than 24 hours, then posts a new message.
/// </summary>
public class BotSchedulerService(
    IServiceProvider services,
    ILogger<BotSchedulerService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("BotSchedulerService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunScheduledBotsAsync();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "BotSchedulerService: unhandled exception during run.");
            }

            // Check every hour
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task RunScheduledBotsAsync()
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var botService = scope.ServiceProvider.GetRequiredService<IBotService>();
        var newsService = scope.ServiceProvider.GetRequiredService<NewsService>();
        var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<ChatHub>>();

        var cutoff = DateTime.UtcNow.AddHours(-24);

        var schedules = await db.BotSchedules
            .Include(bs => bs.Group)
            .Where(bs => bs.Enabled && (bs.LastRunAt == null || bs.LastRunAt < cutoff))
            .ToListAsync();

        logger.LogInformation("BotSchedulerService: {Count} group(s) due for a proactive post.", schedules.Count);

        foreach (var schedule in schedules)
        {
            var group = schedule.Group;
            var tags = JsonSerializer.Deserialize<List<string>>(group.TagsJson) ?? [];

            // Fetch recent news for the first tag (best-effort enrichment)
            List<NewsItem> news = [];
            if (tags.Count > 0)
                news = await newsService.GetTopNewsAsync(tags[0]);

            var body = await botService.GetProactivePost(group.Id, group.Name, tags);

            var sourceUrls = news.Select(n => n.Url).ToList();

            var message = new GroupMessage
            {
                GroupId = group.Id,
                SenderDisplayName = "HelloWork Bot",
                SenderType = "bot",
                Body = body,
                SourceUrlsJson = JsonSerializer.Serialize(sourceUrls),
                CreatedAt = DateTime.UtcNow
            };

            db.GroupMessages.Add(message);
            schedule.LastRunAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            var dto = ToDto(message, sourceUrls);
            await hubContext.Clients.Group(group.Id.ToString()).SendAsync("ReceiveMessage", dto);

            logger.LogInformation(
                "BotSchedulerService: posted proactive message to group '{GroupName}' (id={GroupId}).",
                group.Name, group.Id);
        }
    }

    private static MessageDto ToDto(GroupMessage m, List<string> sourceUrls) => new(
        m.Id, m.GroupId, m.SenderId, m.SenderDisplayName, m.SenderType,
        m.Body, sourceUrls, m.CreatedAt);
}
