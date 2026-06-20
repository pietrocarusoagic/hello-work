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
public class WorkMatchController(AppDbContext db, MatchingService matching) : ControllerBase
{
    private async Task<User?> GetCurrentUserAsync() =>
        await db.Users.FirstOrDefaultAsync(u =>
            u.AadOid == (User.FindFirstValue("oid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier)));

    [HttpGet("cards")]
    public async Task<IActionResult> GetCards()
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var swipedIds = await db.WorkMatchSwipes
            .Where(s => s.SwiperId == me.Id)
            .Select(s => s.TargetId)
            .ToListAsync();

        var candidates = await db.Users
            .Where(u => u.Id != me.Id && !swipedIds.Contains(u.Id))
            .Take(20)
            .ToListAsync();

        var cards = candidates
            .Select(c => new WorkMatchCardDto(
                c.Id, c.DisplayName ?? "", c.Role, c.Department, c.AvatarUrl,
                matching.ComputeMatchScore(me, c),
                matching.GetSharedTags(me.Skills, c.Skills),
                matching.GetSharedTags(me.AiTools, c.AiTools),
                matching.GetSharedTags(me.Hobbies.Concat(me.Interests), c.Hobbies.Concat(c.Interests))))
            .OrderByDescending(c => c.MatchScore)
            .ToList();

        return Ok(cards);
    }

    [HttpPost("swipe")]
    public async Task<IActionResult> Swipe([FromBody] SwipeRequest req)
    {
        var me = await GetCurrentUserAsync();
        if (me is null) return Unauthorized();

        var existing = await db.WorkMatchSwipes.FirstOrDefaultAsync(s =>
            s.SwiperId == me.Id && s.TargetId == req.TargetId);

        if (existing is not null)
            return BadRequest("Already swiped this user");

        var swipe = new WorkMatchSwipe
        {
            SwiperId = me.Id,
            TargetId = req.TargetId,
            Direction = req.Direction,
        };
        db.WorkMatchSwipes.Add(swipe);

        Match? match = null;
        if (req.Direction == "like")
        {
            var reverseSwipe = await db.WorkMatchSwipes.FirstOrDefaultAsync(s =>
                s.SwiperId == req.TargetId && s.TargetId == me.Id && s.Direction == "like");

            if (reverseSwipe is not null)
            {
                var target = await db.Users.FindAsync(req.TargetId);
                if (target is not null)
                {
                    match = new Match
                    {
                        UserAId = me.Id,
                        UserBId = req.TargetId,
                        MatchScore = matching.ComputeMatchScore(me, target),
                    };
                    db.Matches.Add(match);
                }
            }
        }

        await db.SaveChangesAsync();
        return Ok(new SwipeResult(match is not null, match?.Id));
    }
}
