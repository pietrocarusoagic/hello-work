using System.ComponentModel.DataAnnotations;

namespace HelloWork.Api.Models;

public class Group
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
    public string TagsJson { get; set; } = "[]";

    public Guid CreatedBy { get; set; }
    public bool IsSystemSuggested { get; set; }
    public int MemberCount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<GroupMember> Members { get; set; } = [];
}
