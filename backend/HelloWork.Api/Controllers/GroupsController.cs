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
[Route("api/[controller]")]
[Authorize]
public class GroupsController(
    AppDbContext db,
    MatchingService matching,
    IBotService botService,
    IHubContext<ChatHub> hubContext) : ControllerBase
{
    private async Task<User?> GetCurrentUserAsync() =>
        await db.Users.FirstOrDefaultAsync(u =>
            u.AadOid == (User.FindFirstValue("oid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier)));

    private static GroupDto ToDto(Group g, Guid userId) => new(
        g.Id, g.Name, g.Description,
        JsonSerializer.Deserialize<List<string>>(g.TagsJson) ?? [],
        g.MemberCount, g.IsSystemSuggested,
        g.Members.Any(m => m.UserId == userId));

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var groups = await db.Groups
            .Include(g => g.Members)
            .OrderByDescending(g => g.IsSystemSuggested)
            .ThenByDescending(g => g.MemberCount)
            .ToListAsync();

        return Ok(groups.Select(g => ToDto(g, me.Id)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGroupRequest req)
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var group = new Group
        {
            Name = req.Name,
            Description = req.Description,
            TagsJson = JsonSerializer.Serialize(req.Tags),
            CreatedBy = me.Id,
            MemberCount = 1,
        };
        db.Groups.Add(group);
        db.GroupMembers.Add(new GroupMember { GroupId = group.Id, UserId = me.Id });
        await db.SaveChangesAsync();

        await db.Entry(group).Collection(g => g.Members).LoadAsync();
        return Created($"/api/groups/{group.Id}", ToDto(group, me.Id));
    }

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> Join(Guid id)
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var group = await db.Groups.FindAsync(id);
        if (group is null) return NotFound();

        var exists = await db.GroupMembers.AnyAsync(gm => gm.GroupId == id && gm.UserId == me.Id);
        if (exists) return BadRequest("Already a member");

        db.GroupMembers.Add(new GroupMember { GroupId = id, UserId = me.Id });
        group.MemberCount++;
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id:guid}/members/me")]
    public async Task<IActionResult> Leave(Guid id)
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var membership = await db.GroupMembers.FindAsync(id, me.Id);
        if (membership is null) return NotFound();

        db.GroupMembers.Remove(membership);
        var group = await db.Groups.FindAsync(id);
        if (group is not null) group.MemberCount = Math.Max(0, group.MemberCount - 1);
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestionsForMe()
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var joinedGroupIds = await db.GroupMembers
            .Where(gm => gm.UserId == me.Id)
            .Select(gm => gm.GroupId)
            .ToListAsync();

        var allGroups = await db.Groups
            .Include(g => g.Members)
            .Where(g => !joinedGroupIds.Contains(g.Id))
            .ToListAsync();

        var myTags = me.Skills.Concat(me.AiTools).Concat(me.Hobbies).Concat(me.Interests).ToList();

        var scored = allGroups
            .Select(g =>
            {
                var groupTags = JsonSerializer.Deserialize<List<string>>(g.TagsJson) ?? [];
                var overlap = matching.GetSharedTags(myTags, groupTags).Count;
                return (Group: g, Score: overlap);
            })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .Take(5)
            .Select(x => ToDto(x.Group, me.Id));

        return Ok(scored);
    }

    // ── Chat endpoints ───────────────────────────────────────────────────────

    private static MessageDto ToMessageDto(GroupMessage m) => new(
        m.Id, m.GroupId, m.SenderId, m.SenderDisplayName, m.SenderType,
        m.Body, JsonSerializer.Deserialize<List<string>>(m.SourceUrlsJson) ?? [], m.CreatedAt);

    /// <summary>GET /api/groups/{id}/messages?page=1&amp;pageSize=20</summary>
    [HttpGet("{id:guid}/messages")]
    public async Task<IActionResult> GetMessages(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var groupExists = await db.Groups.AnyAsync(g => g.Id == id);
        if (!groupExists) return NotFound();

        var messages = await db.GroupMessages
            .Where(m => m.GroupId == id)
            .OrderBy(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(messages.Select(ToMessageDto));
    }

    /// <summary>POST /api/groups/{id}/messages</summary>
    [HttpPost("{id:guid}/messages")]
    public async Task<IActionResult> SendMessage(Guid id, [FromBody] SendMessageRequest req)
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var group = await db.Groups.FindAsync(id);
        if (group is null) return NotFound();

        if (string.IsNullOrWhiteSpace(req.Body))
            return BadRequest("Body cannot be empty.");

        var message = new GroupMessage
        {
            GroupId = id,
            SenderId = me.Id,
            SenderDisplayName = me.DisplayName ?? me.AadOid,
            SenderType = "user",
            Body = req.Body.Trim(),
            SourceUrlsJson = "[]",
            CreatedAt = DateTime.UtcNow
        };

        db.GroupMessages.Add(message);
        await db.SaveChangesAsync();

        var dto = ToMessageDto(message);
        await hubContext.Clients.Group(id.ToString()).SendAsync("ReceiveMessage", dto);

        return Created($"/api/groups/{id}/messages/{message.Id}", dto);
    }

    /// <summary>POST /api/groups/{id}/bot-ask</summary>
    [HttpPost("{id:guid}/bot-ask")]
    public async Task<IActionResult> BotAsk(Guid id, [FromBody] BotAskRequest req)
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var group = await db.Groups.FindAsync(id);
        if (group is null) return NotFound();

        var tags = JsonSerializer.Deserialize<List<string>>(group.TagsJson) ?? [];

        // Fetch recent history (last 10 messages)
        var history = await db.GroupMessages
            .Where(m => m.GroupId == id)
            .OrderByDescending(m => m.CreatedAt)
            .Take(10)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        var prompt = string.IsNullOrWhiteSpace(req.Prompt)
            ? "Stimola la conversazione del gruppo con un messaggio coinvolgente."
            : req.Prompt;

        var botReply = await botService.GetOnDemandReply(
            id, group.Name, prompt, tags, history);

        var message = new GroupMessage
        {
            GroupId = id,
            SenderDisplayName = "HelloWork Bot",
            SenderType = "bot",
            Body = botReply,
            SourceUrlsJson = "[]",
            CreatedAt = DateTime.UtcNow
        };

        db.GroupMessages.Add(message);
        await db.SaveChangesAsync();

        var dto = ToMessageDto(message);
        await hubContext.Clients.Group(id.ToString()).SendAsync("ReceiveMessage", dto);

        return Ok(dto);
    }
}
