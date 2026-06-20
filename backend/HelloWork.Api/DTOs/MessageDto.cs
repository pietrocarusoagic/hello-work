namespace HelloWork.Api.DTOs;

public record MessageDto(
    long Id,
    Guid GroupId,
    Guid? SenderId,
    string SenderDisplayName,
    string SenderType,
    string Body,
    List<string> SourceUrls,
    DateTime CreatedAt
);

public record SendMessageRequest(string Body);

/// <param name="Prompt">Optional user prompt; if null the bot selects the topic autonomously.</param>
public record BotAskRequest(string? Prompt);
