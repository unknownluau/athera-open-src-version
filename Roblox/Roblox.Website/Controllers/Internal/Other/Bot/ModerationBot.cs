using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Npgsql;
using Roblox.Dto;
using Roblox.Dto.Admin;
using Roblox.Dto.Assets;
using Roblox.Exceptions;
using Roblox.Logging;
using Roblox.Models.Assets;
using Roblox.Models.Economy;
using Roblox.Models.Users;
using Roblox.Services;
using Roblox.Services.Exceptions;
using Roblox.Website.WebsiteModels.Asset;
using Type = Roblox.Models.Assets.Type;

namespace Roblox.Website.Controllers 
{
    [ApiController]
    [Route("/")]
    public class ModerationBot : ControllerBase
    {
        private NpgsqlConnection db => services.assets.db;

        private void ValidateBotAuth()
        {
            if (Request.Headers["ATHERA-botAPIkey"].ToString() != Roblox.Configuration.BotAuthorization)
            {
                throw new Exception("Internal");
            }
        }

        [HttpGetBypass("botapi/assets/pending-assets")]
        public async Task<IEnumerable<dynamic>> BotGetPendingAssets()
        {
            ValidateBotAuth();
            var offset = 0;
            var result = new List<PendingAssetEntry>();

            while (result.Count < 10)
            {
                var query = new SqlBuilder();
                var t = query.AddTemplate(
                    @"SELECT asset.id, asset.name, asset_thumbnail.content_url, asset.asset_type as assetType
                      FROM asset
                      LEFT JOIN asset_thumbnail ON asset_thumbnail.asset_id = asset.id
                      /**where**/
                      ORDER BY asset.id LIMIT 10 OFFSET :offset");

                query.OrWhereMulti("(asset.moderation_status = :status AND asset.asset_type = $1)", new []
                {
                    Type.Image,
                    Type.Decal,
                    Type.Audio,
                    Type.Face,
                    Type.Mesh,
                    Type.Lua,
                    Type.Model,
                    Type.Package,
                    Type.Place,
                    Type.Plugin,
                    Type.MeshPart,
                    Type.Mesh,
                    Type.SolidModel,
                });

                query.AddParameters(new
                {
                    status = ModerationStatus.AwaitingApproval,
                    offset = offset,
                });

                var firstPass = (await db.QueryAsync<PendingAssetEntry>(
                    t.RawSql,
                    t.Parameters)).ToList();

                if (firstPass.Count == 0) return result; // all done!
                offset += firstPass.Count;

                foreach (var item in firstPass)
                {
                    var latest = await services.assets.GetLatestAssetVersion(item.id);
                    item.creatorId = latest.creatorId;
                    var userInfo = await services.users.GetUserById(latest.creatorId);
                    item.creatorName = userInfo.username;

                    if (item.content_url == null && latest.contentUrl != null)
                    {
                        item.content_url = latest.contentUrl;
                    }

                    if (item.content_url != null)
                    {
                        if (item.assetType == Type.Mesh)
                        {
                            item.content_url = $"/admin-api/api/assets/pending-assets/mesh/{latest.contentUrl}.obj";
                        }
                        else
                        {
                            item.content_url = $"/admin-api/api/assets/pending-assets/image/{item.content_url}";
                        }
                    }

                    result.Add(item);
                }
            }

            return result;
        }

        [HttpGetBypass("botapi/icons/pending-assets")]
        public async Task<dynamic> BotGetPendingAssetIcons()
        {
            ValidateBotAuth();
            
            var firstPass = (await db.QueryAsync(
                "SELECT asset_icon.id, asset.name, asset_icon.content_url, asset_icon.asset_id as asset_id FROM asset_icon INNER JOIN asset ON asset.id = asset_icon.asset_id WHERE asset_icon.moderation_status = :status ORDER BY asset.id LIMIT 10",
                new { status = ModerationStatus.AwaitingApproval })).ToList();
            if (firstPass.Count == 0) return new List<dynamic>();

            foreach (var item in firstPass)
            {
                try
                {
                    var latest = await services.assets.GetLatestAssetVersion((long)item.asset_id);
                    item.creatorId = (object)latest.creatorId;
                    var userInfo = await services.users.GetUserById(latest.creatorId);
                    item.creatorName = (object)userInfo.username;
                    item.content_url = Configuration.CdnBaseUrl + "/images/thumbnails/" + item.content_url + ".png";
                }
                catch (Exception)
                {
                    item.creatorId = (object)1;
                    item.creatorName = (object)"ROBLOX";
                }
            }

            return firstPass;
        }

        [HttpPostBypass("botapi/asset/moderate")]
        public async Task BotModerateAsset([Required, FromBody] ModerateAssetRequest request)
        {
            ValidateBotAuth();
            
            long moderatorUserId = 1;
            if (!string.IsNullOrEmpty(request.discordUserId))
            {
                try
                {
                    var userInfo = await services.users.GetUserDataByDiscordId(request.discordUserId);
                    moderatorUserId = userInfo.userId;
                }
                catch {}
            }
            
            var details = await db.QuerySingleOrDefaultAsync<AssetModerationStatus>(
                "SELECT moderation_status as moderationStatus, roblox_asset_id as robloxAssetId FROM asset WHERE asset.id = :id", new { id = request.assetId });
            var currentStatus = details.moderationStatus;
            if (currentStatus == ModerationStatus.ReviewApproved && !request.isApproved)
            {
                // Rate limit for staff to moderate already approved items
                if (!await services.cooldown.TryIncrementBucketCooldown("ModerateApprovedItem_Hour", 60, TimeSpan.FromHours(1)))
                    throw new StaffException("Moderation of already approved item rate limit exceeded (hour). Contact an administrator.");
                if (!await services.cooldown.TryIncrementBucketCooldown("ModerateApprovedItem_Day", 100, TimeSpan.FromDays(1)))
                    throw new StaffException("Moderation of already approved item rate limit exceeded (day). Contact an administrator.");
            }
            if (details.canEarnRobuxFromApproval)
                await AwardCommissionForModeration(moderatorUserId);

            var newStatus = request.isApproved ? ModerationStatus.ReviewApproved : ModerationStatus.Declined;

            await db.ExecuteAsync("UPDATE asset SET moderation_status = :status, is_18_plus = :is_18_plus WHERE id = :id", new
            {
                is_18_plus = request.is18Plus,
                status = newStatus,
                id = request.assetId,
            });
            await services.assets.InsertAssetModerationLog(request.assetId, moderatorUserId, newStatus);
            
            // send message to asset creator if declined
            if (!request.isApproved)
            {
                try 
                {
                    var assetInfo = await services.assets.GetAssetCatalogInfo(request.assetId);
                    var latestVersion = await services.assets.GetLatestAssetVersion(request.assetId);
                    
                    await services.privateMessages.CreateMessage(latestVersion.creatorId, 1, "Asset Declined",
                        $"Hello,\n" +
                        $"Your asset, {assetInfo.name} (ID: {request.assetId}) was declined due to it being inappropriate or violating our policies. Please do not upload assets that violate our rules.\n\n" +
                        $"Thank you, The Roblox Team");
                }
                catch (Exception ex)
                {
                    Writer.Info(LogGroup.AdminApi, "Failed to send decline message for asset {0}: {1}", request.assetId, ex);
                }
            }

            var children = (await db.QueryAsync<AssetVersionWithIdEntry>("SELECT DISTINCT asset_id as assetId FROM asset_version WHERE content_id = :id", new
            {
                id = request.assetId,
            })).ToArray();
            // update children
            foreach (var item in children)
            {
                await db.ExecuteAsync("UPDATE asset SET moderation_status = :status, is_18_plus = :is_18_plus WHERE id = :id", new
                {
                    is_18_plus = request.is18Plus,
                    status = newStatus,
                    id = item.assetId,
                });
                await services.assets.InsertAssetModerationLog(item.assetId, moderatorUserId, newStatus);
            }

            if (details.robloxAssetId != null && details.robloxAssetId != 0)
            {
                var duplicates = await db.QueryAsync<AssetVersionWithIdEntry>(
                    "SELECT id as assetId FROM asset WHERE roblox_asset_id = :id", new
                    {
                        id = details.robloxAssetId.Value,
                    });
                foreach (var dupe in duplicates)
                {
                    await db.ExecuteAsync("UPDATE asset SET moderation_status = :status, is_18_plus = :is_18_plus WHERE id = :id", new
                    {
                        is_18_plus = request.is18Plus,
                        status = newStatus,
                        id = dupe.assetId,
                    });
                    await services.assets.InsertAssetModerationLog(dupe.assetId, moderatorUserId, newStatus);
                }
            }

            // re-render the next asset if the approved asset is an image and the next asset is a teeshirt, pants, or shirt
            // update badge/gamepass thumbnail to the image's thumb if the next asset is either badge or gamepass
            if (request.isApproved && newStatus == ModerationStatus.ReviewApproved)
            {
                var assetdetails = await services.assets.GetAssetCatalogInfo(request.assetId);
                if (assetdetails.assetType == Type.Image)
                {
                    Console.WriteLine($"image {request.assetId} ({assetdetails.name}) was approved, but skipping render");

                    _ = Task.Run(async () => 
                    {
                        await Task.Delay(TimeSpan.FromSeconds(2));
                        
                        var nextid = request.assetId + 1;
                        var nextdetails = await services.assets.GetAssetCatalogInfo(nextid);
                        if (nextdetails != null)
                        {
                            if (nextdetails.assetType == Type.TeeShirt || nextdetails.assetType == Type.Pants || nextdetails.assetType == Type.Shirt)
                            {
                                services.assets.RenderAsset(nextid, nextdetails.assetType);
                            }
                            else if (nextdetails.assetType == Type.Badge || nextdetails.assetType == Type.GamePass)
                            {
                                var ContentUrl = await db.QuerySingleOrDefaultAsync<string>(
                                    "SELECT content_url FROM asset_version WHERE asset_id = :id ORDER BY id DESC LIMIT 1",
                                    new { id = request.assetId });

                                if (!string.IsNullOrEmpty(ContentUrl))
                                {
                                    await db.ExecuteAsync(
                                        @"INSERT INTO asset_thumbnail (asset_id, asset_version_id, content_url, moderation_status)
                                          VALUES (:assetId, :assetVersionId, :contentUrl, :moderationStatus)",
                                        new
                                        {
                                            assetId = nextid,
                                            assetVersionId = nextid,
                                            contentUrl = ContentUrl,
                                            moderationStatus = newStatus
                                        });

                                    Console.WriteLine($"Set badge/gamepass {nextid}'s cont url to image {request.assetId}'s content URL");
                                }
                                else
                                {
                                    Console.WriteLine($"no content URL found for image {request.assetId}");
                                }
                            }
                        }
                        else
                        {
                            Console.WriteLine($"asset {nextid} not found");
                        }
                    });
                }
            }
        }

        [HttpPostBypass("botapi/icon/moderate")]
        public async Task BotModerateIcon([Required, FromBody] ModerateIconRequest request)
        {
            ValidateBotAuth();
            
            long moderatorUserId = 1;
            if (!string.IsNullOrEmpty(request.discordUserId))
            {
                try
                {
                    var userInfo = await services.users.GetUserDataByDiscordId(request.discordUserId);
                    moderatorUserId = userInfo.userId;
                }
                catch {}
            }
            
            var details = await db.QuerySingleOrDefaultAsync(
                "SELECT moderation_status, content_url, asset_id FROM asset_icon WHERE asset_icon.id = :id", new { id = request.iconId });
            if (details == null) throw new StaffException("Asset ID is invalid");
            if ((ModerationStatus)details.moderation_status != ModerationStatus.AwaitingApproval)
            {
                throw new StaffException(
                    "You can only moderate items in a pending state. This item was already approved or declined.");
            }
            
            await AwardCommissionForModeration(moderatorUserId);

            if (request.isApproved)
            {
                await db.ExecuteAsync("UPDATE asset_icon SET moderation_status = :status WHERE id = :id", new
                {
                    id = request.iconId,
                    status = ModerationStatus.ReviewApproved,
                });
                
                if (request.is18Plus)
                {
                    // update asset
                    await db.ExecuteAsync("UPDATE asset SET is_18_plus = true WHERE id = :id", new
                    {
                        id = (long)details.asset_id,
                    });
                }
            }
            else
            {
                // delete it
                await db.ExecuteAsync("UPDATE asset_icon SET moderation_status = :status WHERE id = :id", new
                {
                    status = ModerationStatus.Declined,
                    id = request.iconId,
                });
                await services.assets.DeleteAssetContent((string)details.content_url, Configuration.ThumbnailsDirectory);
            }
        }

        private async Task AwardCommissionForModeration(long moderatorUserId)
        {
            var robuxAmount = 1;

            // give commission
            await services.economy.IncrementCurrency(CreatorType.User, moderatorUserId, CurrencyType.Robux, robuxAmount);
            await services.users.InsertAsync("user_transaction", new
            {
                type = PurchaseType.Commission,
                currency_type = CurrencyType.Robux,
                amount = robuxAmount,
                // details
                sub_type = TransactionSubType.StaffAssetModeration,
                // user data
                user_id_one = moderatorUserId,
                user_id_two = 1,
            });
        }
    }
}
