using System.ComponentModel.DataAnnotations;

namespace HelloWork.Api.Models;

public class Match
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserAId { get; set; }
    public User? UserA { get; set; }

    public Guid UserBId { get; set; }
    public User? UserB { get; set; }

    public double MatchScore { get; set; }
    public string Status { get; set; } = "pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
