using Microsoft.AspNetCore.Mvc;

namespace Roblox.Website.Controllers;

[ApiController]
[Route("/")]
public class NotificationsControllerV12 : ControllerBase
{
    [HttpGet("notifications/v1/stream/unread-count")]
    public dynamic GetUnreadCount()
    {
        return new
        {
            unreadNotifications = 0,
            statusMessage = (string?)null,
        };
    }
}
