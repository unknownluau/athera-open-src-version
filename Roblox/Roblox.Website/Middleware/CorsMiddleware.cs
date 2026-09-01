using Microsoft.AspNetCore.Http.Extensions;

namespace Roblox.Website.Middleware;

public class RobloxPlayerCorsMiddleware
{
    private RequestDelegate _next;
    public RobloxPlayerCorsMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    private string GenerateCspHeader(bool isAuthenticated)
    {
        var connectSrc = "'self' https://discord.com https://*.athera.sbs https://athera.sbs https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css.map wss://*.localhost:90 https://hcaptcha.com https://*.hcaptcha.com https://*.cdn.com";
#if DEBUG
        connectSrc += " ws://localhost:*";
#endif

        var imgSrc = "'self' data: https://images.rbxcdn.com";
        if (isAuthenticated)
        {
            imgSrc += " https://*.cdn.athera.sbs";
        }
        
        var scriptSrc = "'unsafe-eval' 'self' https://hcaptcha.com https://*.hcaptcha.com https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js http://localhost:5000";
        
        return "default-src 'self'; img-src https://athera.sbs http://athera.sbs https://*.athera.sbs "+imgSrc+"; child-src 'self'; script-src https://esm.sh "+scriptSrc+"; frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com https://*.athera.sbs https://athera.sbs; style-src 'unsafe-inline' 'self' https://fonts.googleapis.com https://hcaptcha.com https://*.hcaptcha.com https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css https://css.rbxcdn.com; font-src 'self' fonts.gstatic.com https://css.rbxcdn.com; connect-src "+connectSrc+"; worker-src 'self';";
    }
    // we dont need shitty ass comments that are useless :skull:
    public async Task InvokeAsync(HttpContext ctx)
    {
        var isAuthenticated = ctx.Items.ContainsKey(".ROBLOSECURITY");
        ctx.Response.Headers["Cross-Origin-Opener-Policy"] = "same-origin";
        ctx.Response.Headers["Cross-Origin-Resource-Policy"] = "cross-origin";
        ctx.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
        ctx.Response.Headers["X-XSS-Protection"] = "1; mode=block";
        ctx.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
        ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
        ctx.Response.Headers["Content-Security-Policy"] = GenerateCspHeader(isAuthenticated);
        await _next(ctx);
    }
}

public static class RobloxPlayerCorsMiddlewareExtensions
{
    public static IApplicationBuilder UseRobloxPlayerCorsMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RobloxPlayerCorsMiddleware>();
    }
}