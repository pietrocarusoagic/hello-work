# Group Chat + AI Engagement Bot — Architecture Design

**Issue**: #97  
**Feature**: Group Chat con bot AI proattivo  
**Stato**: Design approvato — pronto per implementazione  
**Autore**: Gilbert (Solution Architect)  
**Data**: 2026-06-20  
**Branch**: `feat/group-chat-design`

---

## 1. Architettura — Diagramma Testuale

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                       │
│                                                                   │
│  Groups.tsx                                                       │
│  └── GroupCard (click → seleziona gruppo)                        │
│       └── Tab "Chat"  ──────────────────────────────────────┐    │
│            └── GroupChat.tsx                                 │    │
│                 ├── MessageFeed (lista messaggi paginata)    │    │
│                 ├── MessageInput (textarea + Send)           │    │
│                 └── BotAskButton ("Chiedi al Bot")           │    │
│                      │                                       │    │
│           useGroupChat(groupId)  hook                        │    │
│                 ├── fetch REST  GET/POST /api/groups/{id}/…  │    │
│                 └── SignalR connection ──────────────────────┘    │
└───────────────────────────┬──────────────────────────────────────┘
                            │  HTTPS + WebSocket (SignalR negotiate)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (ASP.NET Core 10)                      │
│                                                                   │
│  ┌───────────────────┐   ┌──────────────────────────────────┐    │
│  │  GroupsController  │   │         ChatHub (SignalR)         │    │
│  │  POST /messages    │──▶│  JoinGroup(groupId)              │    │
│  │  GET  /messages    │   │  ReceiveMessage(MessageDto)      │    │
│  │  POST /bot-ask     │   └────────────┬─────────────────────┘    │
│  └────────┬──────────┘                │                           │
│           │                           │ broadcast                 │
│           ▼                           ▼                           │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    AppDbContext (EF Core 9)               │    │
│  │   GroupMessages   BotSchedules   Groups   GroupMembers    │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │  Azure SQL (Serverless)             │
│  ┌──────────────────────────┴───────────────────────────────┐    │
│  │             BotService (IGroupChatBotService)             │    │
│  │   ├── OnDemandReply(groupId, userQuestion, history)       │    │
│  │   └── ProactivePost(groupId, newsContext)                 │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │ HTTP                                │
│  ┌──────────────────────────┴───────────────────────────────┐    │
│  │         NewsService (INewsService)  [POC]                 │    │
│  │    Google News RSS  →  parse titolo + url                 │    │
│  └──────────────────────────────────────────────────────────┘    │
│                             │ HTTP                                │
│  ┌──────────────────────────┴───────────────────────────────┐    │
│  │   BackgroundService: BotSchedulerService  [POC]           │    │
│  │    cron daily 09:00 LUN-VEN  →  ProactivePost             │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Azure OpenAI (Sweden Central)                        │
│   gpt-4o        — on-demand replies  (ChatHub / BotAsk)          │
│   gpt-4o-mini   — scheduled proactive posts                      │
└─────────────────────────────────────────────────────────────────┘
```

### Flussi principali

| Flusso | Trigger | Path |
|--------|---------|------|
| Utente invia messaggio | Click Send | Frontend → `POST /messages` → DB → SignalR broadcast |
| Bot on-demand | Click "Chiedi al Bot" | Frontend → `POST /bot-ask` → BotService → GPT-4o → DB → SignalR broadcast |
| Bot proattivo | Cron 09:00 LUN-VEN | BotSchedulerService → NewsService → BotService → GPT-4o-mini → DB → SignalR broadcast |

---

## 2. Schema Database

> **Nota**: `group_id` è `UNIQUEIDENTIFIER` (non `INT`) per coerenza con il modello `Group.Id` già esistente (`Guid`).

```sql
-- Tabella messaggi di gruppo
CREATE TABLE group_messages (
    id            BIGINT PRIMARY KEY IDENTITY,
    group_id      UNIQUEIDENTIFIER NOT NULL,
    sender_id     UNIQUEIDENTIFIER NULL,          -- NULL quando sender_type = 'bot'
    sender_type   NVARCHAR(10) NOT NULL DEFAULT 'user',  -- 'user' | 'bot'
    body          NVARCHAR(4000) NOT NULL,
    source_urls   NVARCHAR(MAX) NULL,             -- JSON array di URL (solo per bot)
    created_at    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    INDEX IX_group_messages_group_created (group_id, created_at DESC)
);

-- Schedula bot per gruppo
CREATE TABLE bot_schedules (
    group_id         UNIQUEIDENTIFIER PRIMARY KEY,
    enabled          BIT NOT NULL DEFAULT 1,
    cron_expression  NVARCHAR(50) NOT NULL DEFAULT '0 9 * * 1-5',
    last_run_at      DATETIME2 NULL,
    last_run_status  NVARCHAR(20) NULL           -- 'ok' | 'error' | 'skipped'
);
```

### Modelli C# da aggiungere in `Models/`

**`Models/GroupMessage.cs`**
```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HelloWork.Api.Models;

public class GroupMessage
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [Required]
    public Guid GroupId { get; set; }

    public Guid? SenderId { get; set; }                        // null se bot

    [Required]
    [MaxLength(10)]
    public string SenderType { get; set; } = "user";          // "user" | "bot"

    [Required]
    [MaxLength(4000)]
    public string Body { get; set; } = string.Empty;

    public string? SourceUrlsJson { get; set; }               // JSON array

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Group Group { get; set; } = null!;
    public User? Sender { get; set; }
}
```

**`Models/BotSchedule.cs`**
```csharp
using System.ComponentModel.DataAnnotations;

namespace HelloWork.Api.Models;

public class BotSchedule
{
    [Key]
    public Guid GroupId { get; set; }

    public bool Enabled { get; set; } = true;

    [Required]
    [MaxLength(50)]
    public string CronExpression { get; set; } = "0 9 * * 1-5";

    public DateTime? LastRunAt { get; set; }

    [MaxLength(20)]
    public string? LastRunStatus { get; set; }               // "ok" | "error" | "skipped"

    // Navigation
    public Group Group { get; set; } = null!;
}
```

### Aggiornamenti `AppDbContext.cs`

Aggiungere i DbSet e la configurazione Fluent API:

```csharp
// DbSets da aggiungere
public DbSet<GroupMessage> GroupMessages => Set<GroupMessage>();
public DbSet<BotSchedule> BotSchedules => Set<BotSchedule>();

// In OnModelCreating — aggiungere in fondo al metodo:
modelBuilder.Entity<GroupMessage>()
    .HasOne(m => m.Group)
    .WithMany()
    .HasForeignKey(m => m.GroupId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<GroupMessage>()
    .HasOne(m => m.Sender)
    .WithMany()
    .HasForeignKey(m => m.SenderId)
    .OnDelete(DeleteBehavior.SetNull);

modelBuilder.Entity<BotSchedule>()
    .HasOne(s => s.Group)
    .WithOne()
    .HasForeignKey<BotSchedule>(s => s.GroupId)
    .OnDelete(DeleteBehavior.Cascade);
```

---

## 3. DTOs

File: `DTOs/ChatDtos.cs`

```csharp
namespace HelloWork.Api.DTOs;

/// <summary>
/// Messaggio restituito nelle API GET e in broadcast SignalR.
/// </summary>
public record MessageDto(
    long Id,
    Guid GroupId,
    Guid? SenderId,
    string SenderType,          // "user" | "bot"
    string SenderDisplayName,   // "Giulia Rossi" | "HW Bot"
    string? SenderAvatarUrl,
    string Body,
    List<string> SourceUrls,    // sempre lista, vuota se non presenti
    DateTime CreatedAt
);

/// <summary>
/// Payload POST /api/groups/{id}/messages
/// </summary>
public record SendMessageRequest(
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.MaxLength(4000)]
    string Body
);

/// <summary>
/// Payload POST /api/groups/{id}/bot-ask
/// </summary>
public record BotAskRequest(
    [System.ComponentModel.DataAnnotations.MaxLength(500)]
    string? Question    // opzionale: se null il bot genera un post generico sul gruppo
);
```

---

## 4. Backend API

### 4.1 Nuovi Pacchetti NuGet da aggiungere

```xml
<!-- HelloWork.Api.csproj -->
<PackageReference Include="Microsoft.AspNetCore.SignalR" Version="1.1.0" />
<PackageReference Include="Azure.AI.OpenAI" Version="2.1.0" />
<PackageReference Include="Cronos" Version="0.9.0" />
```

> `Microsoft.AspNetCore.SignalR` è incluso nel framework ASP.NET Core 10, non serve aggiunta esplicita — basta `AddSignalR()` in `Program.cs`.  
> `Azure.AI.OpenAI` è il client ufficiale Azure OpenAI SDK v2.  
> `Cronos` è la libreria per parsing cron expression (MIT license).

**Pacchetti effettivi da aggiungere al .csproj:**
```xml
<PackageReference Include="Azure.AI.OpenAI" Version="2.1.0" />
<PackageReference Include="Cronos" Version="0.9.0" />
```

### 4.2 Aggiornamenti `Program.cs`

```csharp
// Dopo builder.Services.AddCors(...)

// SignalR
builder.Services.AddSignalR();

// Azure OpenAI
builder.Services.AddSingleton(sp =>
{
    var endpoint = new Uri(builder.Configuration["AzureOpenAI:Endpoint"]!);
    var credential = new Azure.AzureKeyCredential(builder.Configuration["AzureOpenAI:ApiKey"]!);
    return new Azure.AI.OpenAI.AzureOpenAIClient(endpoint, credential);
});

// Chat services
builder.Services.AddScoped<IBotService, BotService>();
builder.Services.AddScoped<INewsService, GoogleNewsRssService>();
builder.Services.AddHostedService<BotSchedulerService>();

// CORS — AGGIORNARE la policy esistente aggiungendo AllowCredentials()
// (richiesto da SignalR per WebSocket con autenticazione)
options.AddDefaultPolicy(policy =>
    policy.WithOrigins(allowedOrigins)
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials());   // ← AGGIUNGERE questa riga
```

```csharp
// Dopo app.MapControllers()

// SignalR Hub
app.MapHub<ChatHub>("/hubs/chat");
```

### 4.3 `appsettings.json` — Nuove sezioni

```json
{
  "AzureOpenAI": {
    "Endpoint": "__AZURE_OPENAI_ENDPOINT__",
    "ApiKey": "__AZURE_OPENAI_API_KEY__",
    "DeploymentGpt4o": "gpt-4o",
    "DeploymentGpt4oMini": "gpt-4o-mini"
  }
}
```

### 4.4 SignalR Hub

File: `Hubs/ChatHub.cs`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HelloWork.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    /// <summary>
    /// Il client chiama JoinGroup dopo aver aperto la connessione.
    /// Aggiunge la connessione al gruppo SignalR corrispondente.
    /// </summary>
    public async Task JoinGroup(string groupId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupKey(groupId));
    }

    /// <summary>
    /// Il client chiama LeaveGroup quando esce dalla schermata chat.
    /// Opzionale ma utile per cleanup.
    /// </summary>
    public async Task LeaveGroup(string groupId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupKey(groupId));
    }

    // Helper: chiave gruppo SignalR (prefisso per evitare collisioni)
    private static string GroupKey(string groupId) => $"group:{groupId}";
}
```

**Metodo broadcast da chiamare dal controller/service:**
```csharp
// Injettare IHubContext<ChatHub> nel controller e nel BotService
await _hubContext.Clients.Group($"group:{groupId}").SendAsync("ReceiveMessage", messageDto);
```

### 4.5 `Controllers/GroupChatController.cs`

```csharp
using HelloWork.Api.DTOs;
using HelloWork.Api.Hubs;
using HelloWork.Api.Infrastructure;
using HelloWork.Api.Models;
using HelloWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace HelloWork.Api.Controllers;

[ApiController]
[Route("api/groups/{groupId:guid}/")]
[Authorize]
public class GroupChatController(
    AppDbContext db,
    IHubContext<ChatHub> hub,
    IBotService botService) : ControllerBase
{
    private async Task<User?> GetCurrentUserAsync() =>
        await db.Users.FirstOrDefaultAsync(u =>
            u.AadOid == (User.FindFirstValue("oid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier)));

    // ─────────────────────────────────────────────
    // GET /api/groups/{groupId}/messages?page=1&pageSize=20
    // ─────────────────────────────────────────────
    [HttpGet("messages")]
    public async Task<IActionResult> GetMessages(
        Guid groupId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (pageSize > 100) pageSize = 100;

        var messages = await db.GroupMessages
            .Where(m => m.GroupId == groupId)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(m => m.Sender)
            .ToListAsync();

        // Restituisce in ordine cronologico (più vecchio prima)
        var dtos = messages
            .OrderBy(m => m.CreatedAt)
            .Select(m => ToDto(m))
            .ToList();

        return Ok(dtos);
    }

    // ─────────────────────────────────────────────
    // POST /api/groups/{groupId}/messages
    // ─────────────────────────────────────────────
    [HttpPost("messages")]
    public async Task<IActionResult> SendMessage(
        Guid groupId,
        [FromBody] SendMessageRequest req)
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        // Verifica membership
        var isMember = await db.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == me.Id);
        if (!isMember) return Forbid();

        var message = new GroupMessage
        {
            GroupId = groupId,
            SenderId = me.Id,
            SenderType = "user",
            Body = req.Body.Trim(),
        };

        db.GroupMessages.Add(message);
        await db.SaveChangesAsync();

        // Ricarica con navigation property Sender
        await db.Entry(message).Reference(m => m.Sender).LoadAsync();

        var dto = ToDto(message);

        // Broadcast a tutti i client nel gruppo SignalR
        await hub.Clients.Group($"group:{groupId}").SendAsync("ReceiveMessage", dto);

        return Created($"/api/groups/{groupId}/messages/{message.Id}", dto);
    }

    // ─────────────────────────────────────────────
    // POST /api/groups/{groupId}/bot-ask
    // ─────────────────────────────────────────────
    [HttpPost("bot-ask")]
    public async Task<IActionResult> BotAsk(
        Guid groupId,
        [FromBody] BotAskRequest req)
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        // Verifica membership
        var isMember = await db.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == me.Id);
        if (!isMember) return Forbid();

        var group = await db.Groups.FindAsync(groupId);
        if (group is null) return NotFound();

        // Recupera gli ultimi 10 messaggi come history per il bot
        var history = await db.GroupMessages
            .Where(m => m.GroupId == groupId)
            .OrderByDescending(m => m.CreatedAt)
            .Take(10)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new { m.SenderType, m.Body })
            .ToListAsync();

        var historyText = string.Join("\n", history.Select(h =>
            $"[{(h.SenderType == "bot" ? "BOT" : "USER")}]: {h.Body}"));

        // Chiama il bot service (gpt-4o)
        var botReply = await botService.OnDemandReplyAsync(
            groupId, group.Name,
            JsonSerializer.Deserialize<List<string>>(group.TagsJson) ?? [],
            historyText,
            req.Question);

        var message = new GroupMessage
        {
            GroupId = groupId,
            SenderId = null,
            SenderType = "bot",
            Body = botReply.Body,
            SourceUrlsJson = botReply.SourceUrls.Count > 0
                ? JsonSerializer.Serialize(botReply.SourceUrls)
                : null,
        };

        db.GroupMessages.Add(message);
        await db.SaveChangesAsync();

        var dto = ToDto(message);
        await hub.Clients.Group($"group:{groupId}").SendAsync("ReceiveMessage", dto);

        return Ok(dto);
    }

    // ─────────────────────────────────────────────
    // Helper: GroupMessage → MessageDto
    // ─────────────────────────────────────────────
    private static MessageDto ToDto(GroupMessage m) => new(
        m.Id,
        m.GroupId,
        m.SenderId,
        m.SenderType,
        m.SenderType == "bot" ? "HW Bot 🤖" : (m.Sender?.DisplayName ?? "Utente"),
        m.SenderType == "bot" ? null : m.Sender?.AvatarUrl,
        m.Body,
        m.SourceUrlsJson != null
            ? JsonSerializer.Deserialize<List<string>>(m.SourceUrlsJson) ?? []
            : [],
        m.CreatedAt
    );
}
```

### 4.6 `Services/IBotService.cs` + `BotService.cs`

**Interface:**
```csharp
namespace HelloWork.Api.Services;

public record BotReply(string Body, List<string> SourceUrls);

public interface IBotService
{
    Task<BotReply> OnDemandReplyAsync(
        Guid groupId,
        string groupName,
        List<string> groupTags,
        string historyText,
        string? userQuestion);

    Task<BotReply> ProactivePostAsync(
        Guid groupId,
        string groupName,
        List<string> groupTags,
        string newsContext);
}
```

**Implementazione (`Services/BotService.cs`):**
```csharp
using Azure.AI.OpenAI;
using OpenAI.Chat;

namespace HelloWork.Api.Services;

public class BotService(AzureOpenAIClient openAiClient, IConfiguration config) : IBotService
{
    private readonly string _deploymentGpt4o     = config["AzureOpenAI:DeploymentGpt4o"]     ?? "gpt-4o";
    private readonly string _deploymentGpt4oMini = config["AzureOpenAI:DeploymentGpt4oMini"] ?? "gpt-4o-mini";

    public async Task<BotReply> OnDemandReplyAsync(
        Guid groupId,
        string groupName,
        List<string> groupTags,
        string historyText,
        string? userQuestion)
    {
        var systemPrompt = BuildSystemPrompt(groupName, groupTags, historyText);
        var userMessage  = userQuestion ?? "Condividi qualcosa di interessante per questo gruppo.";

        var chatClient = openAiClient.GetChatClient(_deploymentGpt4o);
        var response = await chatClient.CompleteChatAsync(
        [
            new SystemChatMessage(systemPrompt),
            new UserChatMessage(userMessage),
        ]);

        return new BotReply(response.Value.Content[0].Text, []);
    }

    public async Task<BotReply> ProactivePostAsync(
        Guid groupId,
        string groupName,
        List<string> groupTags,
        string newsContext)
    {
        var systemPrompt = BuildSystemPrompt(groupName, groupTags, historyText: "");
        var userMessage  =
            $"""
            Basandoti sulle seguenti notizie recenti, scrivi un post di aggiornamento
            per il gruppo "{groupName}". Sii conciso (max 250 parole), coinvolgente,
            e invita i membri a commentare.

            NOTIZIE:
            {newsContext}
            """;

        var chatClient = openAiClient.GetChatClient(_deploymentGpt4oMini);
        var response = await chatClient.CompleteChatAsync(
        [
            new SystemChatMessage(systemPrompt),
            new UserChatMessage(userMessage),
        ]);

        return new BotReply(response.Value.Content[0].Text, []);
    }

    private static string BuildSystemPrompt(
        string groupName,
        List<string> groupTags,
        string historyText) =>
        $"""
        Sei HW Bot, l'assistente AI del gruppo "{groupName}" su Hello Work,
        la piattaforma interna per la community professionale di AGIC.

        CONTESTO GRUPPO:
        - Nome: {groupName}
        - Tag / aree di interesse: {string.Join(", ", groupTags)}

        STORIA RECENTE DELLA CHAT:
        {(string.IsNullOrWhiteSpace(historyText) ? "(nessun messaggio precedente)" : historyText)}

        REGOLE DI COMPORTAMENTO:
        1. Rispondi sempre in italiano.
        2. Sii conciso e professionale. Non superare 300 parole.
        3. Focalizzati sui temi del gruppo (tag sopra).
        4. Quando citi fonti esterne, indica chiaramente il titolo e l'URL.
        5. Non inventare fatti. Se non hai informazioni pertinenti, dillo.
        6. Usa un tono caldo e inclusivo, da collega esperto — non da chatbot generico.
        7. Termina i post proattivi con una domanda aperta per stimolare la discussione.
        """;
}
```

### 4.7 `Services/INewsService.cs` + `GoogleNewsRssService.cs`

**Interface:**
```csharp
namespace HelloWork.Api.Services;

public record NewsItem(string Title, string Url, DateTime PublishedAt);

public interface INewsService
{
    Task<List<NewsItem>> GetLatestNewsAsync(List<string> tags, int maxItems = 5);
}
```

**Implementazione POC (`Services/GoogleNewsRssService.cs`):**
```csharp
using System.ServiceModel.Syndication;
using System.Xml;

namespace HelloWork.Api.Services;

public class GoogleNewsRssService(IHttpClientFactory httpClientFactory, ILogger<GoogleNewsRssService> logger) : INewsService
{
    public async Task<List<NewsItem>> GetLatestNewsAsync(List<string> tags, int maxItems = 5)
    {
        var query = Uri.EscapeDataString(string.Join(" OR ", tags));
        var url   = $"https://news.google.com/rss/search?q={query}&hl=it&gl=IT&ceid=IT:it";

        try
        {
            var client = httpClientFactory.CreateClient();
            var stream = await client.GetStreamAsync(url);

            using var reader = XmlReader.Create(stream);
            var feed = SyndicationFeed.Load(reader);

            return feed.Items
                .Take(maxItems)
                .Select(i => new NewsItem(
                    i.Title.Text,
                    i.Links.FirstOrDefault()?.Uri.ToString() ?? "",
                    i.PublishDate.UtcDateTime))
                .ToList();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "GoogleNewsRss fetch failed for tags: {Tags}", string.Join(",", tags));
            return [];
        }
    }
}
```

> **Nota POC**: `SyndicationFeed` è in `System.ServiceModel.Syndication` — aggiungere NuGet `System.ServiceModel.Http` se non già presente, oppure usare un parser XML semplice. In alternativa: parse manuale con `XDocument`. Verifica compatibilità .NET 10.

> **Produzione**: sostituire con `BingSearchNewsService` che usa `Bing Search API v7` — stesso interface, swap DI in `Program.cs`.

### 4.8 `Services/BotSchedulerService.cs`

```csharp
using Cronos;
using HelloWork.Api.Infrastructure;
using HelloWork.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HelloWork.Api.Services;

public class BotSchedulerService(
    IServiceScopeFactory scopeFactory,
    ILogger<BotSchedulerService> logger) : BackgroundService
{
    // Intervallo di polling: ogni 60 secondi controlla se ci sono task da eseguire
    private readonly TimeSpan _pollInterval = TimeSpan.FromSeconds(60);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("BotSchedulerService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessSchedulesAsync(stoppingToken);
            await Task.Delay(_pollInterval, stoppingToken);
        }
    }

    private async Task ProcessSchedulesAsync(CancellationToken ct)
    {
        await using var scope   = scopeFactory.CreateAsyncScope();
        var db                  = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var botService          = scope.ServiceProvider.GetRequiredService<IBotService>();
        var newsService         = scope.ServiceProvider.GetRequiredService<INewsService>();
        var hubContext          = scope.ServiceProvider.GetRequiredService<
                                      Microsoft.AspNetCore.SignalR.IHubContext<Hubs.ChatHub>>();

        var now = DateTime.UtcNow;

        var schedules = await db.BotSchedules
            .Where(s => s.Enabled)
            .Include(s => s.Group)
            .ToListAsync(ct);

        foreach (var schedule in schedules)
        {
            try
            {
                var cron      = CronExpression.Parse(schedule.CronExpression);
                var nextAfter = schedule.LastRunAt ?? now.AddDays(-1);
                var next      = cron.GetNextOccurrence(nextAfter, TimeZoneInfo.Utc);

                if (next is null || next > now) continue;

                logger.LogInformation("Running proactive post for group {GroupId}", schedule.GroupId);

                var group = schedule.Group;
                var tags  = System.Text.Json.JsonSerializer
                               .Deserialize<List<string>>(group.TagsJson) ?? [];

                var news = await newsService.GetLatestNewsAsync(tags);
                var newsContext = string.Join("\n\n", news.Select(n =>
                    $"- {n.Title}\n  {n.Url}"));

                var reply = await botService.ProactivePostAsync(
                    schedule.GroupId, group.Name, tags, newsContext);

                var message = new GroupMessage
                {
                    GroupId     = schedule.GroupId,
                    SenderId    = null,
                    SenderType  = "bot",
                    Body        = reply.Body,
                    SourceUrlsJson = news.Count > 0
                        ? System.Text.Json.JsonSerializer.Serialize(news.Select(n => n.Url).ToList())
                        : null,
                };

                db.GroupMessages.Add(message);
                schedule.LastRunAt     = now;
                schedule.LastRunStatus = "ok";
                await db.SaveChangesAsync(ct);

                var dto = new DTOs.MessageDto(
                    message.Id, message.GroupId, null, "bot",
                    "HW Bot 🤖", null, message.Body,
                    news.Select(n => n.Url).ToList(),
                    message.CreatedAt);

                await hubContext.Clients
                    .Group($"group:{schedule.GroupId}")
                    .SendAsync("ReceiveMessage", dto, ct);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Proactive post failed for group {GroupId}", schedule.GroupId);
                schedule.LastRunStatus = "error";
                await db.SaveChangesAsync(ct);
            }
        }
    }
}
```

---

## 5. Frontend Components

### 5.1 Dipendenza npm

```bash
npm install @microsoft/signalr
```

### 5.2 Aggiornamento `lib/api.ts`

Aggiungere le interfacce:

```typescript
// da aggiungere a lib/api.ts

export interface MessageDto {
  id: number
  groupId: string
  senderId: string | null
  senderType: 'user' | 'bot'
  senderDisplayName: string
  senderAvatarUrl: string | null
  body: string
  sourceUrls: string[]
  createdAt: string  // ISO 8601
}

export interface SendMessageRequest {
  body: string
}

export interface BotAskRequest {
  question?: string
}
```

### 5.3 Hook `useGroupChat.ts`

File: `src/hooks/useGroupChat.ts`

```typescript
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr'
import { api, MessageDto, SendMessageRequest, BotAskRequest } from '../lib/api'
import { DEV_BYPASS } from '../devBypass'
import { msalInstance } from '../main'
import { loginRequest } from './msalConfig'

export function useGroupChat(groupId: string) {
  const [messages, setMessages]   = useState<MessageDto[]>([])
  const [loading, setLoading]     = useState(true)
  const [connected, setConnected] = useState(false)
  const [botLoading, setBotLoading] = useState(false)
  const connectionRef = useRef<HubConnection | null>(null)

  // Carica i messaggi storici (paginazione base: prima pagina)
  const loadHistory = useCallback(async () => {
    try {
      const msgs = await api.get<MessageDto[]>(
        `/groups/${groupId}/messages?page=1&pageSize=50`
      )
      setMessages(msgs)
    } catch (err) {
      console.error('Failed to load chat history', err)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  // Connessione SignalR
  useEffect(() => {
    let cancelled = false

    const buildConnection = async () => {
      const token = DEV_BYPASS
        ? 'dev-bypass-token'
        : await (async () => {
            const account = msalInstance.getActiveAccount()
            if (!account) throw new Error('Not authenticated')
            const r = await msalInstance.acquireTokenSilent({ ...loginRequest, account })
            return r.accessToken
          })()

      const connection = new HubConnectionBuilder()
        .withUrl('/hubs/chat', {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build()

      connection.on('ReceiveMessage', (msg: MessageDto) => {
        setMessages(prev => {
          // Evita duplicati (il sender li riceve già via API response)
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      })

      await connection.start()
      if (cancelled) { await connection.stop(); return }

      await connection.invoke('JoinGroup', groupId)
      connectionRef.current = connection
      setConnected(true)
    }

    loadHistory()
    buildConnection().catch(err => console.error('SignalR connection failed', err))

    return () => {
      cancelled = true
      connectionRef.current?.invoke('LeaveGroup', groupId).catch(() => {})
      connectionRef.current?.stop().catch(() => {})
      connectionRef.current = null
      setConnected(false)
    }
  }, [groupId, loadHistory])

  // Invia messaggio utente
  const sendMessage = useCallback(async (body: string) => {
    const payload: SendMessageRequest = { body }
    const msg = await api.post<MessageDto>(
      `/groups/${groupId}/messages`,
      payload
    )
    // Il messaggio arriva via SignalR broadcast — ma se l'utente è l'unico
    // nel gruppo il broadcast non riporterebbe a sé stesso senza join.
    // Il server fa già broadcast al gruppo, quindi l'utente riceve via SignalR
    // purchè abbia fatto JoinGroup. Non serve aggiunta manuale.
    return msg
  }, [groupId])

  // Trigger bot on-demand
  const askBot = useCallback(async (question?: string) => {
    setBotLoading(true)
    try {
      const payload: BotAskRequest = { question }
      await api.post<MessageDto>(`/groups/${groupId}/bot-ask`, payload)
      // Il messaggio arriva via SignalR — non serve aggiungere manualmente
    } catch (err) {
      console.error('BotAsk failed', err)
    } finally {
      setBotLoading(false)
    }
  }, [groupId])

  return {
    messages,
    loading,
    connected,
    botLoading,
    sendMessage,
    askBot,
  }
}
```

### 5.4 Component `GroupChat.tsx`

File: `src/components/GroupChat.tsx`

```tsx
import { useRef, useEffect, useState } from 'react'
import { MessageDto } from '../lib/api'
import { useGroupChat } from '../hooks/useGroupChat'

interface Props {
  groupId: string
  groupName: string
}

export default function GroupChat({ groupId, groupName }: Props) {
  const { messages, loading, connected, botLoading, sendMessage, askBot } =
    useGroupChat(groupId)

  const [inputValue, setInputValue] = useState('')
  const [sending, setSending]       = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll all'ultimo messaggio
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || sending) return
    setSending(true)
    try {
      await sendMessage(text)
      setInputValue('')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-white/40 text-sm">
        Caricamento chat…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[480px]">
      {/* Header stato connessione */}
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-xs text-white/30">
          {connected ? (
            <span className="text-green-400">● live</span>
          ) : (
            <span className="text-yellow-400">● riconnessione…</span>
          )}
        </span>
        <button
          onClick={() => askBot()}
          disabled={botLoading}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-agic-secondary/20
                     text-agic-secondary border border-agic-secondary/30
                     hover:bg-agic-secondary/30 disabled:opacity-40 transition-all"
        >
          {botLoading ? 'Bot sta pensando…' : '🤖 Chiedi al Bot'}
        </button>
      </div>

      {/* Feed messaggi */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <p className="text-center text-white/30 text-xs pt-8">
            Nessun messaggio ancora. Inizia la conversazione!
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio… (Enter per inviare)"
          rows={2}
          maxLength={4000}
          className="flex-1 bg-agic-dark border border-agic-border rounded-lg
                     px-3 py-2 text-sm text-white placeholder-white/30
                     focus:outline-none focus:ring-2 focus:ring-agic-primary/40 resize-none"
        />
        <button
          onClick={handleSend}
          disabled={sending || !inputValue.trim()}
          className="px-4 py-2 bg-gradient-agic text-white rounded-lg text-sm
                     font-medium hover:opacity-90 disabled:opacity-40 transition-all
                     self-end"
        >
          {sending ? '…' : 'Invia'}
        </button>
      </div>
    </div>
  )
}

// ─── Bubble singolo messaggio ────────────────────────────────────
function MessageBubble({ message }: { message: MessageDto }) {
  const isBot  = message.senderType === 'bot'
  const timeStr = new Date(message.createdAt).toLocaleTimeString('it-IT', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className={`flex gap-2 ${isBot ? 'items-start' : 'items-start'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0
          ${isBot
            ? 'bg-agic-secondary/20 border border-agic-secondary/30 text-agic-secondary'
            : 'bg-agic-primary/20 border border-agic-primary/30 text-agic-primary'
          }`}
      >
        {isBot ? '🤖' : message.senderDisplayName?.[0]?.toUpperCase() ?? '?'}
      </div>

      {/* Contenuto */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={`text-xs font-semibold ${isBot ? 'text-agic-secondary' : 'text-white'}`}>
            {message.senderDisplayName}
          </span>
          <span className="text-xs text-white/20">{timeStr}</span>
        </div>

        <div
          className={`text-sm rounded-lg px-3 py-2 whitespace-pre-wrap
            ${isBot
              ? 'bg-agic-secondary/10 border border-agic-secondary/20 text-white/90'
              : 'bg-agic-card border border-agic-border text-white/90'
            }`}
        >
          {message.body}
        </div>

        {/* Source URLs (solo bot) */}
        {isBot && message.sourceUrls.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {message.sourceUrls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-agic-secondary/70 hover:text-agic-secondary truncate"
              >
                🔗 {url}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 5.5 Aggiornamento `Groups.tsx`

Modificare `GroupCard` e aggiungere la tab "Chat" quando il gruppo è selezionato:

```tsx
// Aggiungere import in cima a Groups.tsx
import { useState as useTabState } from 'react'
import GroupChat from '../components/GroupChat'

// In Groups.tsx — sostituire la funzione GroupCard con questa versione espandibile:
function GroupCard({ group, onToggle }: { group: Group; onToggle: (id: string, isMember: boolean) => void }) {
  const [activeTab, setActiveTab] = useTabState<'info' | 'chat'>('info')
  const [expanded, setExpanded]   = useTabState(false)

  return (
    <div className="bg-agic-card rounded-xl border border-agic-border overflow-hidden">
      {/* Header card — invariato rispetto a prima */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm">{group.name}</h3>
              {group.isSystemSuggested && (
                <span className="text-xs px-1.5 py-0.5 bg-agic-secondary/20 text-agic-secondary rounded-full border border-agic-secondary/30">
                  AI
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 mt-0.5">{group.description}</p>
            <p className="text-xs text-white/30 mt-1">👥 {group.memberCount} membri</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {group.tags.slice(0, 3).map((t) => (
                <span key={t} className="px-1.5 py-0.5 bg-white/5 text-white/50 rounded-full text-xs border border-agic-border">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 ml-3">
            <button
              onClick={() => onToggle(group.id, group.isMember)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                group.isMember
                  ? 'bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-400 border border-agic-border'
                  : 'bg-gradient-agic text-white hover:opacity-90'
              }`}
            >
              {group.isMember ? 'Esci' : 'Unisciti'}
            </button>

            {/* Pulsante per aprire/chiudere chat (solo se membro) */}
            {group.isMember && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                {expanded ? '▲ Chiudi' : '💬 Chat'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Panel espandibile con tab Info / Chat */}
      {expanded && group.isMember && (
        <div className="border-t border-agic-border">
          {/* Tab bar */}
          <div className="flex border-b border-agic-border">
            {(['info', 'chat'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-agic-primary border-b-2 border-agic-primary'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {tab === 'info' ? '📋 Info' : '💬 Chat'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'info' && (
              <p className="text-xs text-white/50">
                Uniti al gruppo il … — {group.memberCount} membri attivi.
              </p>
            )}
            {activeTab === 'chat' && (
              <GroupChat groupId={group.id} groupName={group.name} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 6. System Prompt del Bot (Template)

Questo è il template usato in `BotService.BuildSystemPrompt()` — incluso qui per riferimento e per eventuali affinamenti:

```
Sei HW Bot, l'assistente AI del gruppo "{GROUP_NAME}" su Hello Work,
la piattaforma interna per la community professionale di AGIC.

CONTESTO GRUPPO:
- Nome: {GROUP_NAME}
- Tag / aree di interesse: {GROUP_TAGS}

STORIA RECENTE DELLA CHAT:
{CHAT_HISTORY}

REGOLE DI COMPORTAMENTO:
1. Rispondi sempre in italiano.
2. Sii conciso e professionale. Non superare 300 parole.
3. Focalizzati sui temi del gruppo (tag sopra).
4. Quando citi fonti esterne, indica chiaramente il titolo e l'URL.
5. Non inventare fatti. Se non hai informazioni pertinenti, dillo.
6. Usa un tono caldo e inclusivo, da collega esperto — non da chatbot generico.
7. Termina i post proattivi con una domanda aperta per stimolare la discussione.
```

**Placeholder**:
| Placeholder | Valore a runtime |
|-------------|-----------------|
| `{GROUP_NAME}` | `group.Name` |
| `{GROUP_TAGS}` | `string.Join(", ", tags)` |
| `{CHAT_HISTORY}` | Ultimi 10 messaggi formattati come `[USER]: testo` / `[BOT]: testo` |

---

## 7. Sequence Diagrams

### 7.a — Utente invia messaggio

```
Frontend          GroupChatController     AppDbContext       ChatHub (SignalR)
   │                      │                    │                    │
   │  POST /messages       │                    │                    │
   │─────────────────────►│                    │                    │
   │                      │ GetCurrentUser()   │                    │
   │                      │───────────────────►│                    │
   │                      │◄───────────────────│                    │
   │                      │ CheckMembership()  │                    │
   │                      │───────────────────►│                    │
   │                      │◄───────────────────│                    │
   │                      │ INSERT GroupMessage│                    │
   │                      │───────────────────►│                    │
   │                      │◄───────────────────│                    │
   │                      │   hub.Clients.Group("group:{id}")       │
   │                      │   .SendAsync("ReceiveMessage", dto)     │
   │                      │───────────────────────────────────────►│
   │                      │                    │    broadcast all   │
   │   201 Created + dto  │                    │   connected clients│
   │◄─────────────────────│                    │                    │
   │                      │                    │                    │
   │  onReceiveMessage()  │                    │                    │
   │◄══════════════════════════════════════════════════════════════│
   │  (messaggio appare   │                    │                    │
   │   nella chat)        │                    │                    │
```

### 7.b — Bot risponde on-demand

```
Frontend       GroupChatController     BotService        AzureOpenAI      ChatHub
   │                  │                    │                   │              │
   │  POST /bot-ask   │                    │                   │              │
   │─────────────────►│                    │                   │              │
   │                  │  load history (10) │                   │              │
   │                  │  from DB           │                   │              │
   │                  │  OnDemandReplyAsync│                   │              │
   │                  │───────────────────►│                   │              │
   │                  │                    │  ChatCompletion   │              │
   │                  │                    │  gpt-4o           │              │
   │                  │                    │──────────────────►│              │
   │                  │                    │◄──────────────────│              │
   │                  │◄───────────────────│                   │              │
   │                  │  INSERT GroupMessage (bot)             │              │
   │                  │  broadcast ReceiveMessage              │              │
   │                  │───────────────────────────────────────────────────►│
   │  200 OK + dto    │                    │                   │              │
   │◄─────────────────│                    │                   │              │
   │  onReceiveMessage│                    │                   │              │
   │◄═════════════════════════════════════════════════════════════════════│
```

### 7.c — Bot proactive post (schedulato)

```
BotSchedulerService    NewsService       BotService        AzureOpenAI      ChatHub
        │                   │                │                   │              │
        │ poll ogni 60s     │                │                   │              │
        │ check cron        │                │                   │              │
        │ → due ora         │                │                   │              │
        │  GetLatestNews()  │                │                   │              │
        │──────────────────►│                │                   │              │
        │◄──────────────────│                │                   │              │
        │  ProactivePostAsync│               │                   │              │
        │───────────────────────────────────►│                   │              │
        │                   │                │  ChatCompletion   │              │
        │                   │                │  gpt-4o-mini      │              │
        │                   │                │──────────────────►│              │
        │                   │                │◄──────────────────│              │
        │◄───────────────────────────────────│                   │              │
        │  INSERT GroupMessage               │                   │              │
        │  UPDATE bot_schedules.last_run_at  │                   │              │
        │  broadcast ReceiveMessage          │                   │              │
        │──────────────────────────────────────────────────────────────────►│
        │                   │                │                   │    broadcast │
```

---

## 8. Scope: POC vs Produzione

### ✅ POC — Da implementare in questa iterazione

| Area | Scelta POC | Motivo |
|------|-----------|--------|
| Real-time | SignalR in-process | Zero infra aggiuntiva |
| Scheduler | `BackgroundService` in-process | Semplicità, restart ACA gestisce il processo |
| News source | Google News RSS | Gratis, zero API key |
| LLM on-demand | GPT-4o | Qualità massima per interazioni dirette |
| LLM proattivo | GPT-4o-mini | Cost-effective per post automatici |
| Auth SignalR | Token JWT / DEV_BYPASS | Coerente con auth esistente |
| Paginazione | Page + PageSize semplice | Sufficiente per POC |
| DB | 2 nuove tabelle EF Core, `EnsureCreated` | Consistente con approccio esistente |

### 🗺️ Roadmap Produzione (Non implementare ora)

| Area | Scelta Produzione | Motivo della transizione |
|------|------------------|--------------------------|
| Scheduler | **Azure Container Apps Jobs** | Evita lock di memoria in-process, retry policy nativa, monitoring ACA |
| News source | **Bing Search API v7** | Notizie più rilevanti e controllate, supporto filtri categoria |
| Real-time scale-out | **Azure SignalR Service** | Se ACA scala a più istanze, il SignalR in-process non sincronizza le connessioni tra pod |
| Paginazione | **Cursor-based** (keyset pagination su `id DESC`) | Performance su tabelle grandi |
| Moderazione contenuti | **Azure AI Content Safety** | Policy compliance aziendale |
| Bot configurabile | Admin UI per cron, enable/disable per gruppo | Self-service per group admin |
| Notification push | **Web Push API** | Alert fuori app per post proattivi |
| Archivio messaggi | Retention policy + soft delete | GDPR compliance |
| Test | Unit test `BotService` con mock `AzureOpenAIClient` | Coverage qualità |

### Trigger di migrazione suggeriti

- **SignalR Service**: quando ACA viene scalato a ≥2 repliche
- **ACA Jobs**: alla prima richiesta di monitoraggio/alerting schedulazione
- **Bing Search**: quando il newsbot deve essere dimostrabile a un cliente

---

## 9. Configurazione locale (sviluppatore)

Aggiungere a `appsettings.Development.json`:

```json
{
  "AzureOpenAI": {
    "Endpoint": "https://<nome-risorsa>.openai.azure.com/",
    "ApiKey": "<api-key-locale-o-da-keyvault>",
    "DeploymentGpt4o": "gpt-4o",
    "DeploymentGpt4oMini": "gpt-4o-mini"
  }
}
```

Aggiungere a `frontend/.env.development` (già esistente):
```
# SignalR si connette tramite il proxy Vite esistente — nessuna config aggiuntiva
# purchè vite.config.ts abbia il proxy per /hubs → backend
```

Verificare `vite.config.ts` che il proxy includa `/hubs`:
```typescript
// vite.config.ts — aggiungere se non presente
proxy: {
  '/api': 'http://localhost:5000',
  '/hubs': {
    target: 'http://localhost:5000',
    ws: true,    // ← WebSocket per SignalR
  }
}
```

---

## 10. Checklist implementazione (per Caino)

- [ ] **Backend**
  - [ ] Aggiungere `Azure.AI.OpenAI` + `Cronos` al `.csproj`
  - [ ] Creare `Models/GroupMessage.cs` e `Models/BotSchedule.cs`
  - [ ] Aggiornare `AppDbContext.cs` (DbSet + Fluent API)
  - [ ] Creare `DTOs/ChatDtos.cs`
  - [ ] Creare `Hubs/ChatHub.cs`
  - [ ] Creare `Services/IBotService.cs` + `BotService.cs`
  - [ ] Creare `Services/INewsService.cs` + `GoogleNewsRssService.cs`
  - [ ] Creare `Services/BotSchedulerService.cs`
  - [ ] Creare `Controllers/GroupChatController.cs`
  - [ ] Aggiornare `Program.cs` (AddSignalR, AddSingleton OpenAI, CORS AllowCredentials, MapHub)
  - [ ] Aggiornare `appsettings.json` con sezione `AzureOpenAI`
  - [ ] Aggiungere seed `BotSchedule` per i gruppi di esempio in `Program.cs`

- [ ] **Frontend**
  - [ ] `npm install @microsoft/signalr`
  - [ ] Aggiungere tipi `MessageDto`, `SendMessageRequest`, `BotAskRequest` a `lib/api.ts`
  - [ ] Creare `src/hooks/useGroupChat.ts`
  - [ ] Creare `src/components/GroupChat.tsx`
  - [ ] Aggiornare `src/pages/Groups.tsx` (GroupCard espandibile + tab Chat)
  - [ ] Aggiornare `vite.config.ts` (proxy WebSocket per `/hubs`)

- [ ] **Test smoke**
  - [ ] Dev bypass: aprire chat, inviare messaggio, verificare broadcast in due tab
  - [ ] Trigger bot-ask manuale, verificare risposta GPT-4o in chat
  - [ ] Verificare che `BotSchedulerService` loggi correttamente all'avvio
