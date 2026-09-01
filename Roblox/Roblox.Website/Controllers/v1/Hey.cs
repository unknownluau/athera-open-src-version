using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Roblox.Dto.Users;
using Roblox.Website.WebsiteModels.Users;

namespace Roblox.Website.Controllers;

[ApiController]
[Route("/")]
public class PresenceController : ControllerBase
{


    [HttpPost("presence/users")]
    [HttpPostBypass("v1/presence/users")]
    [HttpPostBypass("v2/presence/users")]
    public async Task<GetPresenceResponse> MultiGetOnlineStatus([Required,FromBody] PresenceRequest req)
    {
        var result = await services.users.MultiGetPresence(req.userIds);
        return new()
        {
            userPresences = result,
        };
    }
}