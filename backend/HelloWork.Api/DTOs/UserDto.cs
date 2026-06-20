namespace HelloWork.Api.DTOs;

public record UserDto(
    Guid Id,
    string DisplayName,
    string? Email,
    string? OfficeLocation,
    string? AvatarUrl,
    string? Role,
    string? Department,
    List<string> Skills,
    List<string> Certifications,
    List<string> AiTools,
    string? AiDescription,
    List<string> Hobbies,
    List<string> Interests,
    int ProfileScore
);

public record UpdateProfileRequest(
    string? DisplayName,
    string? OfficeLocation,
    string? Role,
    string? Department,
    List<string>? Skills,
    List<string>? Certifications,
    List<string>? AiTools,
    string? AiDescription,
    List<string>? Hobbies,
    List<string>? Interests
);
