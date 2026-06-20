using System.ComponentModel.DataAnnotations;

namespace HelloWork.Api.Models;

/// <summary>
/// One row per group — controls whether the proactive bot is enabled
/// and when it last ran.
/// </summary>
public class BotSchedule
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid GroupId { get; set; }

    public bool Enabled { get; set; } = true;

    /// <summary>UTC timestamp of the last successful proactive post. Null if never run.</summary>
    public DateTime? LastRunAt { get; set; }

    // Navigation
    public Group Group { get; set; } = null!;
}
