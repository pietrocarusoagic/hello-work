using System.ComponentModel.DataAnnotations;

namespace HelloWork.Api.Models;

public class WorkMatchSwipe
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SwiperId { get; set; }
    public User? Swiper { get; set; }

    public Guid TargetId { get; set; }
    public User? Target { get; set; }

    [Required]
    public string Direction { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
