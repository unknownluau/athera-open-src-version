using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Roblox.Services;
using System.Net.Http;
using System.IO;
using Roblox.Website.Filters;
using Roblox.Models.Staff;

namespace Roblox.Website.Controllers
{
    [ApiController]
    [Route("/apisite/request-item/v1")]
    [IgnoreAntiforgeryToken]
    public class RequestItemController : ControllerBase
    {
        public class SubmitRequest
        {
            [Required] public string type { get; set; }
            [Required] public string name { get; set; }
            public string description { get; set; }
            public int robuxPrice { get; set; }
            public int tixPrice { get; set; }
            public bool isLimited { get; set; }
            public int stock { get; set; }
            public string? assetUrl { get; set; }
        }

        [HttpPost("submit")]
        public async Task<IActionResult> Submit([FromForm] SubmitRequest request, IFormFile? rbxmFile, IFormFile? objFile)
        {
            try
            {
                await services.requestItem.Initialize();

                string? rbxmPath = null;
                string? objPath = null;
                
                var logPath = Path.Combine(Directory.GetCurrentDirectory(), "ugc_debug.log");
                System.IO.File.AppendAllText(logPath, $"[{DateTime.Now}] Submit started. PublicDirectory: '{Roblox.Configuration.PublicDirectory}'\n");
                var uploadDir = Path.Combine(Roblox.Configuration.PublicDirectory, "Data", "v1", "uploads", "requests");
                System.IO.File.AppendAllText(logPath, $"[{DateTime.Now}] uploadDir: '{uploadDir}'\n");
                
                if (!Directory.Exists(uploadDir))
                {
                    System.IO.File.AppendAllText(logPath, $"[{DateTime.Now}] Creating directory: '{uploadDir}'\n");
                    Directory.CreateDirectory(uploadDir);
                }

                if (rbxmFile != null)
                {
                    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(rbxmFile.FileName)}";
                    var distinctPath = Path.Combine(uploadDir, fileName);
                    using (var stream = new FileStream(distinctPath, FileMode.Create))
                    {
                        await rbxmFile.CopyToAsync(stream);
                    }
                    rbxmPath = $"/v1/uploads/requests/{fileName}";
                }

                if (objFile != null)
                {
                    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(objFile.FileName)}";
                    var distinctPath = Path.Combine(uploadDir, fileName);
                    using (var stream = new FileStream(distinctPath, FileMode.Create))
                    {
                        await objFile.CopyToAsync(stream);
                    }
                    objPath = $"/v1/uploads/requests/{fileName}";
                }

                if (request.type != "Roblox")
                {
                    long fee = 200;
                    var userBalance = await services.economy.GetBalance(Roblox.Models.Assets.CreatorType.User, safeUserSession.userId);
                    if (userBalance.robux < fee)
                    {
                        return BadRequest(new { message = $"Insufficient funds. You need {fee} Robux to upload a UGC item." });
                    }
                    
                    await services.economy.DecrementCurrency(
                        Roblox.Models.Assets.CreatorType.User,
                        safeUserSession.userId, 
                        Roblox.Models.Economy.CurrencyType.Robux, 
                        fee
                    );
                }

                await services.requestItem.InsertRequest(new RequestItemService.ItemRequestEntry
                {
                    type = request.type,
                    name = request.name,
                    description = request.description,
                    robux_price = request.robuxPrice,
                    tix_price = request.tixPrice,
                    is_limited = request.isLimited,
                    stock = request.stock,
                    asset_url = request.assetUrl,
                    rbxm_path = rbxmPath,
                    obj_path = objPath,
                    status = 0,
                    submitter_id = safeUserSession.userId
                });

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = ex.ToString() });
            }
        }

        [HttpGet("list"), StaffFilter(Access.GetRequestedItems)]
        public async Task<IActionResult> List()
        {
            var requests = await services.requestItem.GetPendingRequests();
            return Ok(requests);
        }

        public class BuildRequest
        {
            public long id { get; set; }
            public string action { get; set; }
            public string? name { get; set; }
            public int? robuxPrice { get; set; }
            public int? tixPrice { get; set; }
            public string? itemLimitedType { get; set; }
            public int? stock { get; set; }
            public long? creatorId { get; set; }
            public bool? forSale { get; set; }
            public bool? visible { get; set; }
        }

        [HttpPost("approve"), StaffFilter(Access.SetRequestedItems)]
        public async Task<IActionResult> Approve([FromBody] BuildRequest req)
        {
            if (req.action == "approve")
            {
                var request = await services.requestItem.GetRequestById(req.id);
                if (request == null) return NotFound(new { message = "Request not found in database" });

                string finalName = !string.IsNullOrEmpty(req.name) ? req.name : request.name;
                int finalRobux = req.robuxPrice ?? request.robux_price;
                int finalTix = req.tixPrice ?? request.tix_price;
                
                bool finalLimited = request.is_limited;
                bool finalLimitedUnique = request.stock > 0;
                if (!string.IsNullOrEmpty(req.itemLimitedType))
                {
                    finalLimited = req.itemLimitedType != "Normal";
                    finalLimitedUnique = req.itemLimitedType == "LimitedUnique";
                }

                int finalStock = req.stock ?? request.stock;
                bool finalForSale = req.forSale ?? true;
                bool finalVisible = req.visible ?? true;
                
                long finalCreatorId = req.creatorId ?? request.submitter_id;
                if (request.type == "Roblox")
                {
                    finalCreatorId = 1;
                }

                Roblox.Models.Assets.Type assetType;
                switch (request.type)
                {
                    case "Shirt": assetType = Roblox.Models.Assets.Type.Shirt; break;
                    case "Pants": assetType = Roblox.Models.Assets.Type.Pants; break;
                    case "T-Shirt": assetType = Roblox.Models.Assets.Type.TeeShirt; break; 
                    case "Face": assetType = Roblox.Models.Assets.Type.Face; break;
                    case "Gear": assetType = Roblox.Models.Assets.Type.Gear; break;
                    default: assetType = Roblox.Models.Assets.Type.Hat; break;
                }

                var uploadRoot = Path.Combine(Roblox.Configuration.PublicDirectory, "Data");

                string filePath = null;
                Stream stream = null;
                long? robloxAssetId = null;

                if (!string.IsNullOrEmpty(request.rbxm_path))
                {
                    filePath = Path.Combine(uploadRoot, request.rbxm_path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                }
                else if (!string.IsNullOrEmpty(request.obj_path))
                {
                    filePath = Path.Combine(uploadRoot, request.obj_path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                }

                if (filePath != null)
                {
                    if (!System.IO.File.Exists(filePath))
                    {
                        Console.WriteLine($"[Error] Asset file not found: {filePath}");
                        return BadRequest(new { message = "Asset file not found on disk", path = filePath });
                    }
                    Console.WriteLine($"[Info] Processing approval for file: {filePath}");
                    stream = System.IO.File.OpenRead(filePath);
                }
                else if (request.type == "Roblox" && !string.IsNullOrEmpty(request.asset_url))
                {
                     Console.WriteLine($"[Info] Attempting to copy Roblox Asset from URL: {request.asset_url}");
                     try 
                     {
                        var match = System.Text.RegularExpressions.Regex.Match(request.asset_url, @"(?:catalog|library)/(\d+)");
                        long id = match.Success ? long.Parse(match.Groups[1].Value) : 0;
                        if (id == 0) return BadRequest(new { message = "Invalid or unsupported Roblox Asset URL. Make sure it contains /catalog/ or /library/ and an ID." });
                        
                        robloxAssetId = id;
                        var details = await services.robloxApi.GetProductInfo(id, true);
                        if (details.AssetTypeId == null) return BadRequest(new { message = "Invalid Roblox Asset" });
                        assetType = details.AssetTypeId.Value;
                        
                        stream = await services.robloxApi.GetAssetContent(id);
                        var isOk = await services.assets.ValidateAssetFile(stream, assetType);
                        if (!isOk) return BadRequest(new { message = "The asset file doesn't look correct. Please try again." });
                        stream.Position = 0;
                     }
                     catch (Exception ex)
                     {
                         Console.WriteLine($"[Error] Failed to copy Roblox asset: {ex.Message}");
                         return BadRequest(new { message = $"Failed to copy Roblox asset from URL: {request.asset_url}. Error: {ex.Message}" });
                     }
                }
                else 
                {
                     return BadRequest(new { message = "Database entry has no file paths AND no valid asset_url. This request cannot be processed." });
                }

                using (stream)
                {
                    var result = await services.assets.CreateAsset(
                        finalName,
                        request.description,
                        finalCreatorId,
                        Roblox.Models.Assets.CreatorType.User,
                        finalCreatorId,
                        stream,
                        assetType,
                        Roblox.Models.Assets.Genre.All,
                        Roblox.Models.Assets.ModerationStatus.ReviewApproved,
                        DateTime.UtcNow,
                        DateTime.UtcNow,
                        robloxAssetId
                    );

                    await services.assets.SetItemPrice(result.assetId, finalRobux, finalTix);
                    
                    await services.assets.UpdateAssetMarketInfo(
                        result.assetId,
                        finalForSale, 
                        finalLimited,
                        finalLimitedUnique,
                        finalLimitedUnique && finalStock > 0 ? finalStock : null,
                        null
                    );
                    
                    await services.assets.UpdateAssetVisibility(result.assetId, finalVisible);

                    await services.requestItem.UpdateRequestStatus(req.id, 1);
                    
                    try
                    {
                        using var httpClient = new HttpClient();
                        var webhookcont = new
                        {
                            content = "New item approved and created via Item Requests!",
                            embeds = new[]
                            {
                                new
                                {
                                    title = $"Item Created: {finalName}",
                                    description = $"Asset ID: {result.assetId}\nCreator ID: {finalCreatorId}\nType: {assetType}\nPrice: R$ {finalRobux} / Tix {finalTix}\nFor Sale: {finalForSale} | Visible: {finalVisible}",
                                    color = 65280
                                }
                            }
                        };
                        var contentParams = new StringContent(System.Text.Json.JsonSerializer.Serialize(webhookcont), System.Text.Encoding.UTF8, "application/json");

                        if (!string.IsNullOrEmpty(Roblox.Configuration.Webhook))
                        {
                            await httpClient.PostAsync(Roblox.Configuration.Webhook, contentParams);
                        }

                        var assetLoggerCont = new
                        {
                            embeds = new[]
                            {
                                new
                                {
                                    title = "✅ Asset Renderer Success",
                                    color = 3066993,
                                    fields = new[]
                                    {
                                        new { name = "Asset ID", value = result.assetId.ToString() }
                                    },
                                    timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
                                }
                            }
                        };
                        var assetLoggerParams = new StringContent(System.Text.Json.JsonSerializer.Serialize(assetLoggerCont), System.Text.Encoding.UTF8, "application/json");
                        
                        if (!string.IsNullOrEmpty(Roblox.Configuration.AssetLoggerWebhook))
                        {
                            await httpClient.PostAsync(Roblox.Configuration.AssetLoggerWebhook, assetLoggerParams);
                        }


                        var itemTypeStr = finalLimitedUnique ? "Limited U" : (finalLimited ? "Limited" : "Normal");
                        var itemDropCont = new
                        {
                            content = finalLimited ? "<@&1447721895977029732>" : "",
                            embeds = new[]
                            {
                                new
                                {
                                    title = finalName,
                                    url = $"https://athera.sbs/catalog/{result.assetId}/--",
                                    description = request.description ?? "",
                                    color = finalLimited ? 16766720 : 5814783,
                                    thumbnail = new { url = $"https://athera.sbs/Thumbs/Asset.ashx?assetId={result.assetId}&width=420&height=420" },
                                    fields = new[]
                                    {
                                        new { name = "🏷️ Type", value = itemTypeStr, inline = true },
                                        new { name = "<:Robux:1440045662484824274> Price", value = finalRobux.ToString(), inline = true },
                                        new { name = "<:TIX:1455003248195797185> TIX", value = finalTix.ToString(), inline = true },
                                        new { name = "📊 Stock", value = finalLimitedUnique && finalStock > 0 ? finalStock.ToString() : "N/A", inline = true },
                                        new { name = "🕒 Dropped At", value = $"<t:{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}:t>", inline = true },
                                        new { name = "🖼️ Render", value = "Success", inline = true }
                                    },
                                    footer = new { text = "Asset ID: " + result.assetId },
                                    timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
                                }
                            }
                        };
                        var itemDropParams = new StringContent(System.Text.Json.JsonSerializer.Serialize(itemDropCont), System.Text.Encoding.UTF8, "application/json");

                        if (finalLimited)
                        {
                            if (!string.IsNullOrEmpty(Roblox.Configuration.LimitedDropWebhook))
                            {
                                await httpClient.PostAsync(Roblox.Configuration.LimitedDropWebhook, itemDropParams);
                            }
                        }
                        else
                        {
                            if (!string.IsNullOrEmpty(Roblox.Configuration.ItemDropWebhook))
                            {
                                await httpClient.PostAsync(Roblox.Configuration.ItemDropWebhook, itemDropParams);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Webhook Error] Failed to send webhook notifications for Item Approval: {ex.Message}");
                    }
                }
            } 
            else if (req.action == "decline")
            {
                await services.requestItem.UpdateRequestStatus(req.id, 2);
            }
            else
            {
                return BadRequest(new { message = "Invalid action" });
            }

            return Ok(new { success = true });
        }
    }
}
