using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Roblox.Services;
using Roblox.Services.Exceptions;

namespace Roblox.Website.Controllers
{
    [ApiController]
    [Route("/")]
    public class LimitedBot : ControllerBase
    {
        private void ValidateBotAuth()
        {
            if (Request.Headers["ATHERA-botAPIkey"].ToString() != Roblox.Configuration.BotAuthorization)
            {
                throw new Exception("Unauthorized bot access.");
            }
        }

        [HttpGetBypass("botapi/discord/get-limiteds")]
        public async Task<dynamic> GetUserLimiteds([FromQuery] string ID)
        {
            ValidateBotAuth();

            try
            {
                var userId = await services.users.GetUserIdUniversal(ID);
                var (items, totalRap) = await services.inventory.GetCollectibleInventoryGrouped(userId, null, "desc", 100, 0);

                return new
                {
                    success = true,
                    userId = userId,
                    totalRap = totalRap,
                    limiteds = items.Select(x => new
                    {
                        uaid = x.userAssetId,
                        assetId = x.assetId,
                        name = x.name,
                        serial = x.serialNumber
                    })
                };
            }
            catch (RecordNotFoundException)
            {
                throw new RobloxException(400, 0, "User not found");
            }
        }

        [HttpGetBypass("botapi/discord/check-item")]
        public async Task<dynamic> CheckItem([FromQuery] string ID, [FromQuery] long assetId)
        {
            ValidateBotAuth();
            try
            {
                var userId = await services.users.GetUserIdUniversal(ID);
                var isOwned = await services.assets.DoesUserOwnAsset(userId, assetId);
                return new { success = true, isOwned = isOwned };
            }
            catch (Exception ex)
            {
                return new { success = false, error = ex.Message };
            }
        }

        [HttpGetBypass("botapi/discord/give-item")]
        public async Task<dynamic> GiveItem([FromQuery] string ID, [FromQuery] long assetId)
        {
            ValidateBotAuth();
            try
            {
                var userId = await services.users.GetUserIdUniversal(ID);
                await services.assets.GrantAsset(userId, assetId);
                return new { success = true, msg = "Item granted successfully." };
            }
            catch (Exception ex)
            {
                return new { success = false, error = ex.Message };
            }
        }

        [HttpGetBypass("botapi/discord/remove-item")]
        public async Task<dynamic> RemoveItem([FromQuery] string ID, [FromQuery] long assetId, [FromQuery] int amount = 1)
        {
            ValidateBotAuth();
            try
            {
                var userId = await services.users.GetUserIdUniversal(ID);
                await services.assets.RemoveAsset(userId, assetId, amount);
                return new { success = true, msg = $"Successfully removed {amount} item(s)." };
            }
            catch (Exception ex)
            {
                return new { success = false, error = ex.Message };
            }
        }

        [HttpPostBypass("botapi/discord/transfer-limiteds")]
        public async Task<dynamic> TransferLimiteds([FromBody] TransferRequest req)
        {
            ValidateBotAuth();

            try
            {
                var fromId = await services.users.GetUserIdUniversal(req.sender);
                var toId = await services.users.GetUserIdUniversal(req.target);

                if (fromId == toId) throw new Exception("Can't send stuff to yourself lol");

                await services.users.TransferLimiteds(fromId, toId, req.userAssetIds);

                return new
                {
                    success = true,
                    msg = "transfer done."
                };
            }
            catch (Exception ex)
            {
                return new
                {
                    success = false,
                    error = ex.Message
                };
            }
        }

        public class TransferRequest
        {
            public string sender { get; set; }
            public string target { get; set; }
            public List<long> userAssetIds { get; set; }
        }
    }
}
