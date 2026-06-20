using Microsoft.Graph;
using Azure.Identity;

namespace HelloWork.Api.Services;

public class AadGraphService(IConfiguration config, ILogger<AadGraphService> logger)
{
    private GraphServiceClient CreateClient()
    {
        var credential = new ClientSecretCredential(
            config["AzureAd:TenantId"],
            config["AzureAd:ClientId"],
            config["AzureAd:ClientSecret"]
        );
        return new GraphServiceClient(credential);
    }

    public async Task<(string? displayName, string? mail, string? jobTitle, string? department, string? officeLocation)>
        GetUserInfoAsync(string oid)
    {
        try
        {
            var client = CreateClient();
            var user = await client.Users[oid].GetAsync(req =>
            {
                req.QueryParameters.Select = ["displayName", "mail", "jobTitle", "department", "officeLocation"];
            });
            return (user?.DisplayName, user?.Mail, user?.JobTitle, user?.Department, user?.OfficeLocation);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to fetch user {Oid} from Graph", oid);
            return (null, null, null, null, null);
        }
    }
}
