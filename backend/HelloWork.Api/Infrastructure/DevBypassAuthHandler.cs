using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace HelloWork.Api.Infrastructure;

/// <summary>
/// Dev-only auth handler. Bypasses JWT validation when ASPNETCORE_ENVIRONMENT=Development
/// and AzureAd:TenantId is set to "dev-bypass".
/// Reads the X-Debug-User header to select which mock identity to use:
///   "demo-user-1"   → Giulia Rossi, utente censito con match attivi (default)
///   "demo-user-new" → Luca Verdi, nuovo utente al primo accesso (onboarding)
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
        var debugUser = Request.Headers["X-Debug-User"].FirstOrDefault() ?? "demo-user-1";

        var (oid, name, email) = debugUser switch
        {
            "demo-user-new" => ("demo-user-new", "Luca Verdi (Demo)", "luca.verdi@hellowork.local"),
            _ => ("demo-user-1", "Giulia Rossi (Demo)", "giulia.rossi@hellowork.local"),
        };

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
