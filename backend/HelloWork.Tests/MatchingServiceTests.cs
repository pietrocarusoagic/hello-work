using HelloWork.Api.Models;
using HelloWork.Api.Services;

namespace HelloWork.Tests;

/// <summary>
/// TDD tests for MatchingService — behavior-focused, no mocks.
/// Tests use the public interface only and describe WHAT the service does.
///
/// Skill: engineering/tdd
/// </summary>
public class MatchingServiceTests
{
    private readonly MatchingService _sut = new();

    // ─── ComputeMatchScore ────────────────────────────────────────────────────

    [Fact]
    public void MatchScore_is_zero_when_both_users_have_no_tags()
    {
        var alice = BuildUser();
        var bob = BuildUser();

        var score = _sut.ComputeMatchScore(alice, bob);

        Assert.Equal(0.0, score);
    }

    [Fact]
    public void MatchScore_is_one_when_users_share_all_tags_in_all_pillars()
    {
        var alice = BuildUser(
            skills: ["TypeScript", "Azure"],
            aiTools: ["Claude", "Copilot"],
            hobbies: ["Running"],
            interests: ["Photography"]
        );
        var bob = BuildUser(
            skills: ["TypeScript", "Azure"],
            aiTools: ["Claude", "Copilot"],
            hobbies: ["Running"],
            interests: ["Photography"]
        );

        var score = _sut.ComputeMatchScore(alice, bob);

        Assert.Equal(1.0, score);
    }

    [Fact]
    public void MatchScore_reflects_agentic_pillar_weight_when_only_ai_tools_match()
    {
        // Agentic weight = 0.40 — only shared AI tools
        var alice = BuildUser(aiTools: ["Claude", "Copilot"]);
        var bob = BuildUser(aiTools: ["Claude", "Copilot"]);

        var score = _sut.ComputeMatchScore(alice, bob);

        Assert.Equal(0.4, score);
    }

    [Fact]
    public void MatchScore_reflects_professional_pillar_weight_when_only_skills_match()
    {
        // Professional weight = 0.35 — only shared skills
        var alice = BuildUser(skills: ["C#", "Azure"]);
        var bob = BuildUser(skills: ["C#", "Azure"]);

        var score = _sut.ComputeMatchScore(alice, bob);

        Assert.Equal(0.35, score);
    }

    [Fact]
    public void MatchScore_reflects_human_pillar_weight_when_only_hobbies_match()
    {
        // Human weight = 0.25 — only shared hobbies
        var alice = BuildUser(hobbies: ["Running", "Jazz"]);
        var bob = BuildUser(hobbies: ["Running", "Jazz"]);

        var score = _sut.ComputeMatchScore(alice, bob);

        Assert.Equal(0.25, score);
    }

    [Fact]
    public void MatchScore_is_case_insensitive_across_all_pillars()
    {
        var alice = BuildUser(
            skills: ["typescript"],
            aiTools: ["claude"],
            hobbies: ["RUNNING"]
        );
        var bob = BuildUser(
            skills: ["TypeScript"],
            aiTools: ["Claude"],
            hobbies: ["running"]
        );

        var score = _sut.ComputeMatchScore(alice, bob);

        Assert.Equal(1.0, score);
    }

    [Fact]
    public void MatchScore_is_between_zero_and_one_for_partial_overlap()
    {
        var alice = BuildUser(skills: ["C#", "Azure", "Docker"]);
        var bob = BuildUser(skills: ["C#", "Python", "Docker"]);

        var score = _sut.ComputeMatchScore(alice, bob);

        Assert.InRange(score, 0.0, 1.0);
    }

    [Fact]
    public void MatchScore_is_symmetric_regardless_of_argument_order()
    {
        var alice = BuildUser(skills: ["C#", "Azure"], aiTools: ["Claude"]);
        var bob = BuildUser(skills: ["Azure", "Python"], aiTools: ["Claude", "Copilot"]);

        var scoreAB = _sut.ComputeMatchScore(alice, bob);
        var scoreBA = _sut.ComputeMatchScore(bob, alice);

        Assert.Equal(scoreAB, scoreBA);
    }

    [Fact]
    public void MatchScore_returns_zero_when_no_tags_overlap_at_all()
    {
        var alice = BuildUser(skills: ["C#"], aiTools: ["Claude"], hobbies: ["Running"]);
        var bob = BuildUser(skills: ["Python"], aiTools: ["ChatGPT"], hobbies: ["Cooking"]);

        var score = _sut.ComputeMatchScore(alice, bob);

        Assert.Equal(0.0, score);
    }

    [Fact]
    public void MatchScore_includes_interests_in_human_pillar()
    {
        // Interests contribute to the human pillar alongside hobbies
        var alice = BuildUser(interests: ["Photography"]);
        var bob = BuildUser(interests: ["Photography"]);

        var score = _sut.ComputeMatchScore(alice, bob);

        Assert.Equal(0.25, score);
    }

    // ─── GetSharedTags ────────────────────────────────────────────────────────

    [Fact]
    public void SharedTags_returns_tags_present_in_both_lists()
    {
        var a = new[] { "C#", "Azure", "Docker" };
        var b = new[] { "Azure", "Python", "Docker" };

        var shared = _sut.GetSharedTags(a, b);

        Assert.Contains("Azure", shared);
        Assert.Contains("Docker", shared);
        Assert.Equal(2, shared.Count);
    }

    [Fact]
    public void SharedTags_returns_empty_when_no_overlap()
    {
        var a = new[] { "C#", "Azure" };
        var b = new[] { "Python", "Go" };

        var shared = _sut.GetSharedTags(a, b);

        Assert.Empty(shared);
    }

    [Fact]
    public void SharedTags_is_case_insensitive()
    {
        var a = new[] { "typescript", "azure" };
        var b = new[] { "TypeScript", "AZURE" };

        var shared = _sut.GetSharedTags(a, b);

        Assert.Equal(2, shared.Count);
    }

    [Fact]
    public void SharedTags_does_not_return_duplicates()
    {
        var a = new[] { "Azure", "azure" };
        var b = new[] { "Azure", "AZURE" };

        var shared = _sut.GetSharedTags(a, b);

        Assert.Single(shared);
    }

    // ─── ComputeProfileScore ─────────────────────────────────────────────────

    [Fact]
    public void ProfileScore_is_zero_for_an_empty_profile()
    {
        var user = BuildUser();

        var score = _sut.ComputeProfileScore(user);

        Assert.Equal(0, score);
    }

    [Fact]
    public void ProfileScore_increases_when_display_name_is_set()
    {
        var withoutName = BuildUser();
        var withName = BuildUser(displayName: "Lorenzo Catarcia");

        Assert.True(_sut.ComputeProfileScore(withName) > _sut.ComputeProfileScore(withoutName));
    }

    [Fact]
    public void ProfileScore_increases_when_skills_are_added()
    {
        var withoutSkills = BuildUser(displayName: "Alice");
        var withSkills = BuildUser(displayName: "Alice", skills: ["C#", "Azure"]);

        Assert.True(_sut.ComputeProfileScore(withSkills) > _sut.ComputeProfileScore(withoutSkills));
    }

    [Fact]
    public void ProfileScore_increases_when_ai_tools_are_added()
    {
        var withoutAi = BuildUser(displayName: "Alice", skills: ["C#"]);
        var withAi = BuildUser(displayName: "Alice", skills: ["C#"], aiTools: ["Claude"]);

        Assert.True(_sut.ComputeProfileScore(withAi) > _sut.ComputeProfileScore(withoutAi));
    }

    [Fact]
    public void ProfileScore_is_capped_at_100_for_a_fully_filled_profile()
    {
        var full = BuildUser(
            displayName: "Alice",
            role: "Engineer",
            department: "Tech",
            skills: ["C#"],
            certifications: ["AZ-900"],
            aiTools: ["Claude"],
            hobbies: ["Running"],
            interests: ["Photography"]
        );

        var score = _sut.ComputeProfileScore(full);

        Assert.Equal(100, score);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static User BuildUser(
        string? displayName = null,
        string? role = null,
        string? department = null,
        IEnumerable<string>? skills = null,
        IEnumerable<string>? certifications = null,
        IEnumerable<string>? aiTools = null,
        IEnumerable<string>? hobbies = null,
        IEnumerable<string>? interests = null)
    {
        var user = new User { DisplayName = displayName, Role = role, Department = department };
        if (skills is not null) user.Skills = skills.ToList();
        if (certifications is not null) user.Certifications = certifications.ToList();
        if (aiTools is not null) user.AiTools = aiTools.ToList();
        if (hobbies is not null) user.Hobbies = hobbies.ToList();
        if (interests is not null) user.Interests = interests.ToList();
        return user;
    }
}
