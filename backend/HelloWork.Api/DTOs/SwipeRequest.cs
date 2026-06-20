namespace HelloWork.Api.DTOs;

public record SwipeRequest(Guid TargetId, string Direction);

public record SwipeResult(bool Matched, Guid? MatchId);

public record WorkMatchCardDto(
    Guid Id,
    string DisplayName,
    string? Role,
    string? Department,
    string? AvatarUrl,
    double MatchScore,
    List<string> SharedSkills,
    List<string> SharedAiTools,
    List<string> SharedInterests
);
