using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace HelloWork.Api.Infrastructure;

/// <summary>
/// Dev-only auth handler. Bypasses JWT validation when ASPNETCORE_ENVIRONMENT=Development
/// and AzureAd:TenantId is set to "dev-bypass".
///
/// Legge l'header X-Dev-User per scegliere l'identità fittizia:
///   "new"      → demo-new-1  (nuovo utente, primo accesso)
///   "existing" → demo-user-1 (utente censito con match attivi)  ← default
///
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
        var devUser = Context.Request.Headers["X-Dev-User"].FirstOrDefault() ?? "existing";

        var (oid, name, email) = devUser == "new"
            ? ("demo-new-1", "Luca Ferrari", "luca.ferrari@hellowork.local")
            : ("demo-user-1", "Giulia Rossi", "giulia.rossi@example.com");

        var claims = new[]
        {
            new Claim("oid", oid),
            new Claim(ClaimTypes.NameIdentifier, oid),
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.Email, email),
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
