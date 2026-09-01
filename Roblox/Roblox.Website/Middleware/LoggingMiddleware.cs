using System.Diagnostics;
using Microsoft.AspNetCore.Http.Extensions;
using Roblox.Website.Lib;

namespace Roblox.Website.Middleware;

public class RobloxLoggingMiddleware
{
    private RequestDelegate _next;
    private static readonly string LogsDirectory = Path.Combine(Directory.GetCurrentDirectory(), "logs");
    private static readonly string LogFilePath = Path.Combine(LogsDirectory, "requests.log");
    private static readonly Timer _rotationTimer;
    private static readonly object _lock = new();
    private static DateTime _lastRotation = DateTime.UtcNow;

    static RobloxLoggingMiddleware()
    {
        if (!Directory.Exists(LogsDirectory))
            Directory.CreateDirectory(LogsDirectory);

        RotateIfNeeded();
        _rotationTimer = new Timer(_ => RotateIfNeeded(), null, TimeSpan.FromHours(1), TimeSpan.FromHours(1));
    }

    private static void RotateIfNeeded()
    {
        lock (_lock)
        {
            if (!File.Exists(LogFilePath))
            {
                _lastRotation = DateTime.UtcNow;
                return;
            }

            var lastWrite = File.GetLastWriteTimeUtc(LogFilePath);
            if (DateTime.UtcNow - lastWrite >= TimeSpan.FromHours(24))
            {
                try { File.Delete(LogFilePath); } catch { }
                _lastRotation = DateTime.UtcNow;
            }
        }
    }

    public RobloxLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }
    
    public async Task InvokeAsync(HttpContext ctx)
    {
        var watch = new Stopwatch();
        watch.Start();
        await _next(ctx);
        watch.Stop();

        var path = ctx.Request.Path.Value ?? "";
        var query = ctx.Request.QueryString.Value ?? "";
        var now = DateTime.Now;
        var timeStr = now.ToString("h:mm tt dd/M/yy").ToLower();
        
        var logStr = $"[{ctx.Request.Method.ToUpper()}] {path}{query} - Status: {ctx.Response.StatusCode} - {watch.ElapsedMilliseconds}ms - Time: {timeStr}";
        Console.WriteLine(logStr);

        lock (_lock)
        {
            try { File.AppendAllText(LogFilePath, logStr + Environment.NewLine); } catch { }
        }
    }
}

public static class RobloxLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRobloxLoggingMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RobloxLoggingMiddleware>();
    }
}