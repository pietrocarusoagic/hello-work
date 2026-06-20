namespace HelloWork.Api.Infrastructure;

public class JwtValidationMiddleware(RequestDelegate next, ILogger<JwtValidationMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/api") &&
            context.User.Identity?.IsAuthenticated == false &&
            !context.Request.Path.StartsWithSegments("/swagger"))
        {
            logger.LogDebug("Unauthenticated request for {Path}", context.Request.Path);
        }

        await next(context);
    }
}
