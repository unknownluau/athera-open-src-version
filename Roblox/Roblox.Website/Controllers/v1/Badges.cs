using Microsoft.AspNetCore.Mvc;

namespace Roblox.Website.Controllers;

[ApiController]
[Route("/apisite/badges/v1")]
public class BadgesControllerV1 : ControllerBase
{
    [HttpGet("users/{userId:long}/badges")]
    public async Task<dynamic> GetBadges(long userId, [FromQuery] string? badgeIds = null)
    {
        var badges = await services.users.GetUserBadges(userId);
        
        if (!string.IsNullOrEmpty(badgeIds))
        {
            var requestedIds = badgeIds.Split(',').Select(long.Parse).ToList();
            badges = badges.Where(b => requestedIds.Contains(b.id));
        }
        
        return new
        {
            nextPageCursor = (string?) null,
            previousPageCursor = (string?) null,
            data = badges,
        };
    }
    
    [HttpGet("universes/{universeId:long}/badges")]
    public async Task<dynamic> GetUniverseBadges(long universeId)
    {
        var badges = await services.assets.GetBadgesForPlace(universeId);
        
        return new
        {
            nextPageCursor = (string?) null,
            previousPageCursor = (string?) null,
            data = badges,
        };
    }
}