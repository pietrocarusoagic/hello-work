using HelloWork.Api.DTOs;
using HelloWork.Api.Infrastructure;
using HelloWork.Api.Models;
using HelloWork.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HelloWork.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MatchesController(AppDbContext db, MatchingService matching) : ControllerBase
{
    private async Task<User?> GetCurrentUserAsync() =>
        await db.Users.FirstOrDefaultAsync(u =>
            u.AadOid == (User.FindFirstValue("oid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier)));

    private UserDto ToUserDto(User u) => new(
        u.Id, u.DisplayName ?? "", u.Email, u.OfficeLocation, u.AvatarUrl,
        u.Role, u.Department, u.Skills, u.Certifications, u.AiTools, u.AiDescription,
        u.Hobbies, u.Interests, matching.ComputeProfileScore(u));

    [HttpGet]
    public async Task<IActionResult> GetMyMatches()
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var matches = await db.Matches
            .Include(m => m.UserA)
            .Include(m => m.UserB)
            .Where(m => m.UserAId == me.Id || m.UserBId == me.Id)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        var dtos = matches.Select(m =>
        {
            var other = m.UserAId == me.Id ? m.UserB! : m.UserA!;
            return new MatchDto(m.Id, ToUserDto(other), m.MatchScore, m.Status, m.CreatedAt);
        });

        return Ok(dtos);
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions([FromQuery] int limit = 10)
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var swipedIds = await db.WorkMatchSwipes
            .Where(s => s.SwiperId == me.Id)
            .Select(s => s.TargetId)
            .ToListAsync();

        var candidates = await db.Users
            .Where(u => u.Id != me.Id && !swipedIds.Contains(u.Id))
            .Take(100)
            .ToListAsync();

        var suggestions = candidates
            .Select(c => new
            {
                User = c,
                Score = matching.ComputeMatchScore(me, c),
                SharedSkills = matching.GetSharedTags(me.Skills, c.Skills),
                SharedAiTools = matching.GetSharedTags(me.AiTools, c.AiTools),
                SharedInterests = matching.GetSharedTags(
                    me.Hobbies.Concat(me.Interests),
                    c.Hobbies.Concat(c.Interests))
            })
            .OrderByDescending(x => x.Score)
            .Take(limit)
            .Select(x => new
            {
                x.User.Id,
                DisplayName = x.User.DisplayName ?? "",
                x.User.Role,
                x.User.Department,
                x.User.AvatarUrl,
                MatchScore = x.Score,
                SharedSkills = x.SharedSkills,
                SharedAiTools = x.SharedAiTools,
                SharedInterests = x.SharedInterests,
            });

        return Ok(suggestions);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] string status)
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var match = await db.Matches.FindAsync(id);
        if (match is null) return NotFound();
        if (match.UserAId != me.Id && match.UserBId != me.Id) return Forbid();

        match.Status = status;
        await db.SaveChangesAsync();
        return Ok();
    }
}
