namespace HelloWork.Api.DTOs;

public record MatchDto(
    Guid Id,
    UserDto OtherUser,
    double MatchScore,
    string Status,
    DateTime CreatedAt
);
