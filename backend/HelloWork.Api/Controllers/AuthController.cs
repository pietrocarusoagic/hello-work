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
public class AuthController(AppDbContext db, AadGraphService graphService) : ControllerBase
{
    [HttpPost("me")]
    public async Task<IActionResult> UpsertMe()
    {
        var oid = User.FindFirstValue("oid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (oid is null) return Unauthorized();

        var user = await db.Users.FirstOrDefaultAsync(u => u.AadOid == oid);
        if (user is null)
        {
            var (displayName, mail, jobTitle, department, officeLocation) = await graphService.GetUserInfoAsync(oid);
            user = new User
            {
                AadOid = oid,
                DisplayName = displayName ?? User.FindFirstValue("name"),
                Email = mail ?? User.FindFirstValue(ClaimTypes.Email),
                Role = jobTitle,
                Department = department,
                OfficeLocation = officeLocation,
            };
            db.Users.Add(user);
        }
        else
        {
            user.DisplayName ??= User.FindFirstValue("name");
            user.Email ??= User.FindFirstValue(ClaimTypes.Email);
            user.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return Ok(new { user.Id, user.DisplayName, isNew = user.CreatedAt == user.UpdatedAt });
    }
}
