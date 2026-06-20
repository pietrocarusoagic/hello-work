using HelloWork.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HelloWork.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MapController(AppDbContext db) : ControllerBase
{
    private static readonly Dictionary<string, double[]> OfficeCoordinates = new()
    {
        ["Milano"] = [9.1900, 45.4654],
        ["Roma"] = [12.4964, 41.9028],
        ["Torino"] = [7.6869, 45.0703],
        ["Tirana"] = [19.8189, 41.3275],
        ["Bari"] = [16.8719, 41.1171],
    };

    [HttpGet("clusters")]
    public async Task<IActionResult> GetClusters([FromQuery] string? interest = null)
    {
        var users = await db.Users
            .Where(u => u.OfficeLocation != null)
            .ToListAsync();

        // Filter in-memory: [NotMapped] Hobbies and Interests cannot be translated to SQL
        if (!string.IsNullOrWhiteSpace(interest))
        {
            users = users
                .Where(u =>
                    u.Hobbies.Any(h => h.Equals(interest, StringComparison.OrdinalIgnoreCase)) ||
                    u.Interests.Any(i => i.Equals(interest, StringComparison.OrdinalIgnoreCase)))
                .ToList();
        }

        var result = users
            .GroupBy(u => u.OfficeLocation!)
            .Select(g =>
            {
                var coords = OfficeCoordinates.TryGetValue(g.Key, out var c) ? c : [0.0, 0.0];
                return new
                {
                    OfficeLocation = g.Key,
                    Coordinates = coords,
                    UserCount = g.Count(),
                };
            });

        return Ok(result);
    }

    [HttpGet("interests")]
    public async Task<IActionResult> GetInterests()
    {
        var users = await db.Users.ToListAsync();

        var all = users
            .SelectMany(u => u.Hobbies.Concat(u.Interests))
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(s => s)
            .ToList();

        return Ok(all);
    }
}
