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
    public async Task<IActionResult> GetClusters()
    {
        var data = await db.Users
            .Where(u => u.OfficeLocation != null)
            .GroupBy(u => u.OfficeLocation!)
            .Select(g => new { OfficeLocation = g.Key, UserCount = g.Count() })
            .ToListAsync();

        var result = data.Select(d =>
        {
            var coords = OfficeCoordinates.TryGetValue(d.OfficeLocation, out var c) ? c : [0.0, 0.0];
            return new
            {
                OfficeLocation = d.OfficeLocation,
                Coordinates = coords,
                UserCount = d.UserCount,
            };
        });

        return Ok(result);
    }
}
