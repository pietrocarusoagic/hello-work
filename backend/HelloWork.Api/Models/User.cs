using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HelloWork.Api.Models;

public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string AadOid { get; set; } = string.Empty;

    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string? OfficeLocation { get; set; }
    public string? AvatarUrl { get; set; }

    public string? Role { get; set; }
    public string? Department { get; set; }
    public string SkillsJson { get; set; } = "[]";
    public string CertificationsJson { get; set; } = "[]";

    public string AiToolsJson { get; set; } = "[]";
    public string? AiDescription { get; set; }

    public string HobbiesJson { get; set; } = "[]";
    public string InterestsJson { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [NotMapped]
    public List<string> Skills
    {
        get => System.Text.Json.JsonSerializer.Deserialize<List<string>>(SkillsJson) ?? [];
        set => SkillsJson = System.Text.Json.JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public List<string> Certifications
    {
        get => System.Text.Json.JsonSerializer.Deserialize<List<string>>(CertificationsJson) ?? [];
        set => CertificationsJson = System.Text.Json.JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public List<string> AiTools
    {
        get => System.Text.Json.JsonSerializer.Deserialize<List<string>>(AiToolsJson) ?? [];
        set => AiToolsJson = System.Text.Json.JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public List<string> Hobbies
    {
        get => System.Text.Json.JsonSerializer.Deserialize<List<string>>(HobbiesJson) ?? [];
        set => HobbiesJson = System.Text.Json.JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public List<string> Interests
    {
        get => System.Text.Json.JsonSerializer.Deserialize<List<string>>(InterestsJson) ?? [];
        set => InterestsJson = System.Text.Json.JsonSerializer.Serialize(value);
    }
}
