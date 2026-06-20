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
public class ProfilesController(AppDbContext db, MatchingService matching) : ControllerBase
{
    private async Task<User?> GetCurrentUserAsync() =>
        await db.Users.FirstOrDefaultAsync(u =>
            u.AadOid == (User.FindFirstValue("oid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier)));

    private UserDto ToDto(User u) => new(
        u.Id, u.DisplayName ?? "", u.Email, u.OfficeLocation, u.AvatarUrl,
        u.Role, u.Department, u.Skills, u.Certifications, u.AiTools, u.AiDescription,
        u.Hobbies, u.Interests, matching.ComputeProfileScore(u));

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return NotFound();
        return Ok(ToDto(user));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        return Ok(ToDto(user));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest req)
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return NotFound();

        if (req.DisplayName is not null) user.DisplayName = req.DisplayName;
        if (req.OfficeLocation is not null) user.OfficeLocation = req.OfficeLocation;
        if (req.Role is not null) user.Role = req.Role;
        if (req.Department is not null) user.Department = req.Department;
        if (req.Skills is not null) user.Skills = req.Skills;
        if (req.Certifications is not null) user.Certifications = req.Certifications;
        if (req.AiTools is not null) user.AiTools = req.AiTools;
        if (req.AiDescription is not null) user.AiDescription = req.AiDescription;
        if (req.Hobbies is not null) user.Hobbies = req.Hobbies;
        if (req.Interests is not null) user.Interests = req.Interests;
        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(ToDto(user));
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] string? skill, [FromQuery] string? office, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var currentUser = await GetCurrentUserAsync();
        var query = db.Users.AsQueryable();
        if (currentUser is not null) query = query.Where(u => u.Id != currentUser.Id);
        if (!string.IsNullOrEmpty(q))
            query = query.Where(u => (u.DisplayName != null && u.DisplayName.Contains(q)) ||
                                     (u.Role != null && u.Role.Contains(q)) ||
                                     (u.Department != null && u.Department.Contains(q)));
        if (!string.IsNullOrEmpty(office))
            query = query.Where(u => u.OfficeLocation == office);

        var users = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        if (!string.IsNullOrEmpty(skill))
            users = users.Where(u => u.Skills.Contains(skill, StringComparer.OrdinalIgnoreCase)).ToList();

        return Ok(users.Select(ToDto));
    }
}
