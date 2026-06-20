using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace HelloWork.Api.Infrastructure;

/// <summary>
/// Dev-only auth handler. Bypasses JWT validation when ASPNETCORE_ENVIRONMENT=Development
/// and AzureAd:TenantId is set to "dev-bypass".
/// Auto-authenticates as the first seed user (OID: demo-user-1).
/// NEVER use in production.
/// </summary>
public class DevBypassAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "DevBypass";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim("oid", "demo-user-1"),
            new Claim(ClaimTypes.NameIdentifier, "demo-user-1"),
            new Claim(ClaimTypes.Name, "Demo User"),
            new Claim(ClaimTypes.Email, "demo@hellowork.local"),
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
