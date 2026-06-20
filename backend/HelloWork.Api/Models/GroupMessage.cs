using System.ComponentModel.DataAnnotations;

namespace HelloWork.Api.Models;

public class GroupMessage
{
    public long Id { get; set; }

    [Required]
    public Guid GroupId { get; set; }

    /// <summary>Null when the sender is the bot.</summary>
    public Guid? SenderId { get; set; }

    [Required]
    public string SenderDisplayName { get; set; } = string.Empty;

    /// <summary>"user" | "bot"</summary>
    [Required]
    public string SenderType { get; set; } = "user";

    [Required]
    public string Body { get; set; } = string.Empty;

    /// <summary>JSON array of URLs surfaced by the bot (empty for user messages).</summary>
    public string SourceUrlsJson { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Group Group { get; set; } = null!;
    public User? Sender { get; set; }
}
