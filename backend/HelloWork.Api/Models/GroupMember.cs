namespace HelloWork.Api.Models;

public class GroupMember
{
    public Guid GroupId { get; set; }
    public Group? Group { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
