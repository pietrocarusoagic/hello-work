using HelloWork.Api.Models;

namespace HelloWork.Api.Services;

public class MatchingService
{
    private const double WeightProfessional = 0.35;
    private const double WeightAgentic = 0.40;
    private const double WeightHuman = 0.25;

    public double ComputeMatchScore(User userA, User userB)
    {
        static double Jaccard(IEnumerable<string> a, IEnumerable<string> b)
        {
            var setA = a.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var setB = b.ToHashSet(StringComparer.OrdinalIgnoreCase);
            if (setA.Count == 0 && setB.Count == 0) return 0.0;
            int intersection = setA.Count(x => setB.Contains(x));
            int union = setA.Union(setB, StringComparer.OrdinalIgnoreCase).Count();
            return (double)intersection / union;
        }

        double score =
            WeightProfessional * Jaccard(userA.Skills, userB.Skills) +
            WeightAgentic * Jaccard(userA.AiTools, userB.AiTools) +
            WeightHuman * Jaccard(
                userA.Hobbies.Concat(userA.Interests),
                userB.Hobbies.Concat(userB.Interests));

        return Math.Round(score, 4);
    }

    public List<string> GetSharedTags(IEnumerable<string> a, IEnumerable<string> b)
    {
        var setA = a.ToHashSet(StringComparer.OrdinalIgnoreCase);
        return b.Where(setA.Contains).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    public int ComputeProfileScore(User user)
    {
        int score = 0;
        if (!string.IsNullOrEmpty(user.DisplayName)) score += 10;
        if (!string.IsNullOrEmpty(user.Role)) score += 10;
        if (!string.IsNullOrEmpty(user.Department)) score += 10;
        if (user.Skills.Count > 0) score += 20;
        if (user.Certifications.Count > 0) score += 10;
        if (user.AiTools.Count > 0) score += 20;
        if (user.Hobbies.Count > 0) score += 10;
        if (user.Interests.Count > 0) score += 10;
        return Math.Min(score, 100);
    }
}
