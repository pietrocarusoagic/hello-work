namespace HelloWork.Api.DTOs;

public record GroupDto(
    Guid Id,
    string Name,
    string? Description,
    List<string> Tags,
    int MemberCount,
    bool IsSystemSuggested,
    bool IsMember
);

public record CreateGroupRequest(string Name, string? Description, List<string> Tags);
