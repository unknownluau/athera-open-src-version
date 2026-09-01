using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using Roblox.Exceptions;
using Roblox.Models.Assets;
using Roblox.Website.Middleware;
using BadRequestException = Roblox.Exceptions.BadRequestException;
using MultiGetEntry = Roblox.Dto.Assets.MultiGetEntry;
using Type = Roblox.Models.Assets.Type;
using MVC = Microsoft.AspNetCore.Mvc;
using Roblox.Services.Exceptions;
using Roblox.Website.WebsiteModels.Asset;
using Roblox.Libraries.RobloxApi;
using Roblox.Libraries.Assets;
using Roblox.Website.Lib;
using System.Diagnostics;

namespace Roblox.Website.Controllers 
{
    [MVC.ApiController]
    [MVC.Route("/")]
    public class Assets : ControllerBase 
    {		
	    [HttpGet("asset/shader")]
        public async Task<MVC.ActionResult> GetShaderAsset(long id)
        {
            var isMaterialOrShader = BypassControllerMetadata.materialAndShaderAssetIds.Contains(id);
            if (!isMaterialOrShader)
            {
                // Would redirect but that could lead to infinite loop.
                // Just throw instead
                throw new RobloxException(400, 0, "Material/Shader");
            }

            var assetId = id;
            try
            {
                var ourId = await services.assets.GetAssetIdFromRobloxAssetId(assetId);
                assetId = ourId;
            }
            catch (RecordNotFoundException)
            {
                // Doesn't exist yet, so create it
                var migrationResult = await MigrateItem.MigrateItemFromRoblox(assetId.ToString(), false, null, default, new ProductDataResponse()
                {
                    Name = "ShaderConversion" + id,
                    AssetTypeId = Type.Special, // Image
                    Created = DateTime.UtcNow,
                    Updated = DateTime.UtcNow,
                    Description = "ShaderConversion1.0",
                });
                assetId = migrationResult.assetId;
            }
            
            var latestVersion = await services.assets.GetLatestAssetVersion(assetId);
            if (latestVersion.contentUrl is null)
            {
                throw new RobloxException(403, 0, "Forbidden"); // ?
            }
            // These files are large, encourage clients to cache them
            HttpContext.Response.Headers.CacheControl = new CacheControlHeaderValue()
            {
                Public = true,
                MaxAge = TimeSpan.FromDays(360),
            }.ToString();
            var assetContent = await services.assets.GetAssetContent(latestVersion.contentUrl);
            return base.File(assetContent, "application/binary");
        }

        private bool IsRcc()
        {
            var rccAccessKey = Request.Headers.ContainsKey("accesskey") ? Request.Headers["accesskey"].ToString() : null;
            var isRcc = rccAccessKey == Configuration.RccAuthorization;
            return isRcc;
        }
				
		[HttpGetBypass("game/players/{userId}")]
		public dynamic GetPlayerChatFilter(long userId)
		{
			return new
			{
				ChatFilter = "whitelist"
			};
		}
		
		[HttpGetBypass("/Game/ChatFilter.ashx")]
        public string RCC_GetChatFilter()
        {
            return "True";
        }
		
		private static bool isheaderbad(string headername)
		{
			var badheaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
			{
				"Transfer-Encoding",
				"Connection",
				"Keep-Alive",
				"Content-Length",
				"Upgrade",
				"Server"
			};
			
			return badheaders.Contains(headername);
		}

        // used to ddos
        public List<long> BlacklistedAssetIds = new List<long>
        {
            72478963, // 163mb place 😭😭
        };

        [HttpGetBypass("v2/asset")]
        [HttpGetBypass("v1/asset")]
        [HttpGetBypass("asset")]
        [HttpPostBypass("v1/asset")]
        [HttpPostBypass("asset")]
		public async Task<MVC.ActionResult> GetAssetById(long id, [MVC.FromQuery] string? apiKey = null, [MVC.FromQuery(Name = "assetversionid")] long? assetVersionId = null)
        {
            if(id == 507766388)
            {
                return PhysicalFile(@"C:\Users\Administrator\Downloads\Revival\athera\Roblox\FixJitter\507766388.rbxm", "application/octet-stream");
            }
            else if(id == 507766666)
            {
                return PhysicalFile(@"C:\Users\Administrator\Downloads\Revival\athera\Roblox\FixJitter\507766666.rbxm", "application/octet-stream");
            } 
            else if (BlacklistedAssetIds.Contains(id))
            {
                throw new RobloxException(400, 0, "Asset is invalid or does not exist");
            }

            var ipHash = GetIP(GetRequesterIpRaw(HttpContext));
            var rateLimitKey = $"RateLimit:GetAssetById:{ipHash}";
            
            if (!await services.cooldown.TryIncrementBucketCooldown(rateLimitKey, 60, TimeSpan.FromMinutes(1)))
            {
                Console.WriteLine($"[ratelimit] rate limit exceeded for IP {ipHash}");
                throw new RobloxException(429, 0, "Too many requests");
            }

			var CachedRobloxAsset = await GetCachedAsset(id);
			if (CachedRobloxAsset != null)
			{
				Console.WriteLine($"[cache] returning cached asset {id} from cache");
				return CachedRobloxAsset;
			}
			
			if (assetVersionId.HasValue)
			{
				id = assetVersionId.Value;
			}
			
			if (apiKey == Configuration.RccAuthorization || apiKey == Configuration.RenderAuthorization)
			{
				var latestVersionSecret = await services.assets.GetLatestAssetVersion(id);
				if (latestVersionSecret?.contentUrl == null)
					throw new RobloxException(400, 0, "Content URL is null");

				var assetContentSecret = await services.assets.GetAssetContent(latestVersionSecret.contentUrl);
				return base.File(assetContentSecret, "application/binary");
			}
			
            // TODO: This endpoint needs to be updated to return a URL to the asset, not the asset itself.
            // The reason for this is so that cloudflare can cache assets without caching the Response of this endpoint, which might be different depending on the client making the request (e.g. under 18 user, over 18 user, rcc, etc).
            var is18OrOver = false;
            if (userSession != null)
            {
                is18OrOver = await services.users.Is18Plus(userSession.userId);
            }

            // TEMPORARY UNTIL AUTH WORKS ON STUDIO! REMEMBER TO REMOVE
            if (HttpContext.Request.Headers.ContainsKey("RbxTempBypassFor18PlusAssets"))
            {
                is18OrOver = true;
            }
            
            var assetId = id;
            var invalidIdKey = "InvalidAssetIdForConversionV1:" + assetId;
            // Opt
            if (Services.Cache.distributed.StringGetMemory(invalidIdKey) != null)
                throw new RobloxException(400, 0, "Asset is invalid or does not exist");
            
            var isBotRequest = Request.Headers["bot-auth"].ToString() == Roblox.Configuration.BotAuthorization;
            var isLoggedIn = userSession != null;
            var encryptionEnabled = !isBotRequest; // bots can't handle encryption :(

            var isMaterialOrShader = BypassControllerMetadata.materialAndShaderAssetIds.Contains(assetId);
            if (isMaterialOrShader)
            {
                return new MVC.RedirectResult("/asset/shader?id=" + assetId);
            }

            var isRcc = IsRcc();
            if (isRcc)
                encryptionEnabled = false;
#if DEBUG
            encryptionEnabled = false;
#endif
            MultiGetEntry details;
			try
			{
				details = await services.assets.GetAssetCatalogInfo(assetId);
			}
			catch (RecordNotFoundException)
			{
				try
				{
					var ourId = await services.assets.GetAssetIdFromRobloxAssetId(assetId);
					assetId = ourId;
				}
				catch (RecordNotFoundException)
				{		
					// i HATE HTTP HEADERS AND PROXIES!!!!!!
					var pxyurl = $"https://assetdelivery.roblox.com/v1/asset?id={assetId}";
                    Console.WriteLine($"[proxy] Fetching asset from {assetId} via {pxyurl}");

					using var httpClient = new HttpClient();
					httpClient.Timeout = TimeSpan.FromSeconds(10);
					httpClient.DefaultRequestHeaders.Add("Cookie", ".ROBLOSECURITY=_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_CAEaAhADIhwKBGR1aWQSFDEwODUxNTc1MzExNTAzMjI1Mzg5KAM.8KP5eDLc3RT4orbZBnSoNs-0efKVvy41h9k5mkARxl5odR4rle0YmN1OA05gS8TSGoiJ37-oDnpMzxIomE-tCnh2m2ozbWHQgzLSrUN6QUt-FNSLjPjiG0CiI_JTI55ViqgtTb1Mg9WNVTZcnAh7DgthIwXPfMv9vnlKOQtszEc5D5v5C_1iMmBTrHZwzZ-XShLWV0DOW4dexwXlx3yMxS2OiF_s4YbvRs1rZw1icpvhOHrub-rYxPbyszCo7Mr5MbM403Vgdk_LSKyLiLCjONgTN71hzBBu5XhLxFKhKqCFpbv7acIU2BG1PDDJs-MRNhXzAQAFHv809c-O0KdcTe7qzqD3kuPVAik_4eEPKM0kZr2sPWUAuIiIqxlLUVYnfvfNEZCYp6H3L244m88QjIdB4YRnVLJhuvQPp6aBjT0u0Sj-GcK2sWWl5Ezflm7N4QHCw7R2FLL0nsjN_d52zWZyF-ST5PaRLx3_bbF9JT-pW2U87LYETf49qZVSVJ7wsK2m0O2UIoM9RaH8f3bo8tolKx65dCzppjTkMAG5B5gvlrPm40LslWhKi6T8BOwq8kyXqJMJjPLyxslACHwIoKLQz_r1bTTBUqK4N7OeOqEitjNgKckTaPc6Cr_4J5D5Dv7KAHFtk0yTqyWIjWEj5wK4i_bsFPat79MLQL73wJ5AXp07J9iDhVLBvvuZcstKE6br6TWZGzZCix07xvTP1D8sN5ddLCSV18UzHVm9rEp5ZGfWJYgvCX9dLzuj0AFgYedRjou9viEnm1rNcq2Xqh5R3SHPq1LgyqJEcfjrZBfahcp878O__1PWLt4-pdvlejoCLkJQbZoBaxfc3j5qcKc3S-kfzvcn7HuaHp8bZp37l9bnXSHjg2g-xiFfAmGUGBqej0S6qR1VOKgLKtWOdzbSR8kGGmJ2WBtlA3TLXmZfgfsN");
                    // PLS DO COOKIE ASSETS UNKNOWNLUAU OR COPYRIGHTTXT
					try
					{
						var stopwatch = Stopwatch.StartNew();
						
						var response = await httpClient.GetAsync(pxyurl, HttpCompletionOption.ResponseHeadersRead);
						stopwatch.Stop();
						
						if (response.IsSuccessStatusCode)
						{
							var content = await response.Content.ReadAsByteArrayAsync();
							var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";

							Response.Headers.Clear();

							// is it necessary to copy all headers except bad ones?
							foreach (var header in response.Headers)
							{
								if (!isheaderbad(header.Key))
								{
									Response.Headers[header.Key] = header.Value.ToArray();
								}
							}

							Response.Headers["Content-Type"] = contentType;
							
							// Sorry whoever's hosting this 😂
							await CacheAsset(assetId, content, contentType);
							return base.File(content, contentType);
						}
						else
						{
							throw new RobloxException(400, 0, $"{response.StatusCode}");
						}
					}
					catch (Exception ex)
					{				
						Console.WriteLine($"[proxy] Error fetching asset {assetId}: {ex.GetType().Name} - {ex.Message}");
                        Console.WriteLine(ex.StackTrace);

                        if (ex is TaskCanceledException && !ex.Message.Contains("canceled"))
						{
							throw new RobloxException(400, 0, "Timeout");
						}
						
						throw new RobloxException(400, 0, $"{ex.Message}");
					}
				}
				details = await services.assets.GetAssetCatalogInfo(assetId);
			}
			if (details.is18Plus && !isRcc && !isBotRequest && !is18OrOver)
				throw new RobloxException(400, 0, "AssetTemporarilyUnavailable");
			if (details.moderationStatus != ModerationStatus.ReviewApproved && !isRcc && !isBotRequest)
				throw new RobloxException(403, 0, "Asset is not approved");
            
            var latestVersion = await services.assets.GetLatestAssetVersion(assetId);
            Stream? assetContent = null;
			Console.WriteLine($"[debug] assetId={assetId}, assetType={details.assetType}, moderation={details.moderationStatus}, isRcc={isRcc}, isBot={isBotRequest}, is18={is18OrOver}");
            switch (details.assetType)
            {
				// Special types
				case Roblox.Models.Assets.Type.TeeShirt:
					var teeShirtData = ContentFormatters.GetTeeShirt(latestVersion.contentId);
					var teeShirtBytes = Encoding.UTF8.GetBytes(teeShirtData);
					return new MVC.FileContentResult(teeShirtBytes, "application/binary");

				case Models.Assets.Type.Shirt:
					var shirtData = ContentFormatters.GetShirt(latestVersion.contentId);
					var shirtBytes = Encoding.UTF8.GetBytes(shirtData);
					return new MVC.FileContentResult(shirtBytes, "application/binary");

				case Models.Assets.Type.Pants:
					var pantsData = ContentFormatters.GetPants(latestVersion.contentId);
					var pantsBytes = Encoding.UTF8.GetBytes(pantsData);
					return new MVC.FileContentResult(pantsBytes, "application/binary");
                // Types that require no authentication and aren't encrypted
                case Models.Assets.Type.Image:
                case Models.Assets.Type.Special:
                    if (latestVersion.contentUrl != null)
                        assetContent = await services.assets.GetAssetContent(latestVersion.contentUrl);
                    // encryptionEnabled = false;
                    break;
                // Types that require no authentication
                case Models.Assets.Type.Audio:
                case Models.Assets.Type.Mesh:
                case Models.Assets.Type.Hat:
                case Models.Assets.Type.Model:
                case Models.Assets.Type.Decal:
                case Models.Assets.Type.Head:
                case Models.Assets.Type.Face:
                case Models.Assets.Type.Gear:
                case Models.Assets.Type.Badge:
                case Models.Assets.Type.Animation:
                case Models.Assets.Type.Torso:
                case Models.Assets.Type.RightArm:
                case Models.Assets.Type.LeftArm:
                case Models.Assets.Type.RightLeg:
                case Models.Assets.Type.LeftLeg:
                case Models.Assets.Type.Package:
                case Models.Assets.Type.GamePass:
                case Models.Assets.Type.Plugin: // TODO: do plugins need auth?
                case Models.Assets.Type.MeshPart:
                case Models.Assets.Type.HairAccessory:
                case Models.Assets.Type.FaceAccessory:
                case Models.Assets.Type.NeckAccessory:
                case Models.Assets.Type.ShoulderAccessory:
                case Models.Assets.Type.FrontAccessory:
                case Models.Assets.Type.BackAccessory:
                case Models.Assets.Type.WaistAccessory:
                case Models.Assets.Type.ClimbAnimation:
                case Models.Assets.Type.DeathAnimation:
                case Models.Assets.Type.FallAnimation:
                case Models.Assets.Type.IdleAnimation:
                case Models.Assets.Type.JumpAnimation:
                case Models.Assets.Type.RunAnimation:
                case Models.Assets.Type.SwimAnimation:
                case Models.Assets.Type.WalkAnimation:
                case Models.Assets.Type.PoseAnimation:
				case Models.Assets.Type.EmoteAnimation:
                case Models.Assets.Type.SolidModel:
                    if (latestVersion.contentUrl is null)
                        throw new RobloxException(400, 0, "Content URL is null"); // todo: should we log this?
						//Console.WriteLine($"[debug] no content URL for assetId: {assetId}, assetType: {details.assetType}, moderationStatus: {details.moderationStatus}");
                    if (details.assetType == Models.Assets.Type.Audio)
                    {
                        var (audioStream, audioMime) = await services.assets.GetAudioContent(assetId, latestVersion.contentUrl);
                        return base.File(audioStream, audioMime);
                    }
                    else
                    {
                        assetContent = await services.assets.GetAssetContent(latestVersion.contentUrl);
                    }
                    break;
                case Models.Assets.Type.Video:
                    break;
                default:
                    // anything else requires auth
                    var ok = false;
                    if (isRcc)
                    {
                        encryptionEnabled = false;
						ok = true;
                        var placeIdHeader = Request.Headers["roblox-place-id"].ToString();
                        long placeId = 0;
                        if (!string.IsNullOrEmpty(placeIdHeader))
                        {
                            try
                            {
                                placeId = long.Parse(Request.Headers["roblox-place-id"].ToString());
                            }
                            catch (FormatException)
                            {
                                // Ignore
                            }
                        }
                        // if rcc is trying to access current place, allow through
                        ok = (placeId == assetId);
                        // If game server is trying to load a new place (current placeId is empty), then allow it
                        if (!ok && details.assetType == Models.Assets.Type.Place && placeId == 0)
                        {
                            // Game server is trying to load, so allow it
                            ok = true;
                        }
                        // If rcc is making the request, but it's not for a place, validate the request:
                        if (!ok)
                        {
                            // Check permissions
                            var placeDetails = await services.assets.GetAssetCatalogInfo(placeId);
                            if (placeDetails.creatorType == details.creatorType &&
                                placeDetails.creatorTargetId == details.creatorTargetId)
                            {
                                // We are authorized
                                ok = true;
                            }
                        }
						Console.WriteLine($"[debug] default branch, ok={ok}, creatorType={details.creatorType}, creatorTargetId={details.creatorTargetId}");
                    }
                    else
                    {
                        // It's not RCC making the request. are we authorized?
                        if (userSession != null)
                        {
                            // Use current user as access check
                            ok = await services.assets.CanUserModifyItem(assetId, userSession.userId);
                            if (!ok)
                            {
                                // Note that all users have access to "Roblox"'s content for legacy reasons
                                ok = (details.creatorType == CreatorType.User && details.creatorTargetId == 1);
                            }
#if DEBUG
                            // If staff, allow access in debug builds
                            if (await services.users.IsUserStaff(userSession.userId))
                            {
                                ok = true;
                            }
#endif
                            // Don't encrypt assets being sent to authorized users - they could be trying to download their own place to give to a friend or something
                            if (ok)
                            {
                                encryptionEnabled = false;
                            }
                        }
                    }

                    if (ok && latestVersion.contentUrl != null)
                    {
                        assetContent = await services.assets.GetAssetContent(latestVersion.contentUrl);
                    }

                    break;
            }

            if (assetContent != null)
            {
                return base.File(assetContent, "application/binary");
            }

            Console.WriteLine("[info] got BadRequest on /asset/ endpoint");
            throw new BadRequestException();
        }
		
		private async Task CacheAsset(long assetId, byte[] content, string contentType)
		{
			try
			{
				var CacheDIR = Path.Combine(Directory.GetCurrentDirectory(), "AssetCache");
				if (!Directory.Exists(CacheDIR))
				{
					Directory.CreateDirectory(CacheDIR);
				}
				
				var Cache = Path.Combine(CacheDIR, $"{assetId}.cache");
				var Meta = Path.Combine(CacheDIR, $"{assetId}.meta");
				
				await System.IO.File.WriteAllBytesAsync(Cache, content);
				
				var MetaData = new
				{
					ContentType = contentType,
					CachedAt = DateTime.UtcNow,
					AssetId = assetId
				};
				await System.IO.File.WriteAllTextAsync(Meta, System.Text.Json.JsonSerializer.Serialize(MetaData));
				
				Console.WriteLine($"[cache] cached asset {assetId}");
			}
			catch (Exception ex)
			{
				Console.WriteLine($"[cache] failed to cache asset {assetId}: {ex.Message}");
			}
		}
		
		private async Task<MVC.FileContentResult?> GetCachedAsset(long assetId)
		{
			try
			{
				var CacheDIR = Path.Combine(Directory.GetCurrentDirectory(), "AssetCache");
				var Cache = Path.Combine(CacheDIR, $"{assetId}.cache");
				var Meta = Path.Combine(CacheDIR, $"{assetId}.meta");
				
				if (System.IO.File.Exists(Cache) && System.IO.File.Exists(Meta))
				{
					var MetaJSON = await System.IO.File.ReadAllTextAsync(Meta);
					var MetaData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(MetaJSON);
					string contentType = MetaData.TryGetProperty("ContentType", out var ct)
						? ct.GetString() ?? "application/octet-stream"
						: "application/octet-stream";

					var content = await System.IO.File.ReadAllBytesAsync(Cache);
					
					return new MVC.FileContentResult(content, contentType);
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine($"[cache] error getting cached asset {assetId}: {ex.Message}");
			}
			
			return null;
		}
				
		public class BatchAssetRequest
		{
			public long assetId { get; set; }
			public string assetType { get; set; }
			public string requestId { get; set; }
		}
		
		[HttpPostBypass("asset/batch")]
        [HttpPostBypass("v1/assets/batch")]
        public async Task<MVC.IActionResult> AssetBatch()
        {
            List<BatchAssetRequest> requestData;
            bool isGzip = Request.Headers["Content-Encoding"].ToString() == "gzip";
            
            if (isGzip)
            {
                using (var decompressedStream = new MemoryStream())
                {
                    using (var requestStream = Request.Body)
                    {
                        using (var gzipStream = new GZipStream(requestStream, CompressionMode.Decompress))
                        {
                            await gzipStream.CopyToAsync(decompressedStream);
                        }
                    }
                    decompressedStream.Seek(0, SeekOrigin.Begin);

                    using (var reader = new StreamReader(decompressedStream, Encoding.UTF8))
                    {
                        var json = await reader.ReadToEndAsync();
                        Console.WriteLine(json);
                        requestData = Newtonsoft.Json.JsonConvert.DeserializeObject<List<BatchAssetRequest>>(json);
                    }
                }
            }
            else
            {
                using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
                {
                    var json = await reader.ReadToEndAsync();
                    Console.WriteLine(json);
                    requestData = Newtonsoft.Json.JsonConvert.DeserializeObject<List<BatchAssetRequest>>(json);
                }
            }
            if (requestData == null)
            {
                throw new BadRequestException();
            }
            var assetReturnInfo = new List<object>();
            foreach (var request in requestData)
            {
                Console.WriteLine(request.assetId);
                assetReturnInfo.Add(new
                {
                    Location = $"{Configuration.BaseUrl}/v1/asset?id={request.assetId}",
                    RequestId = request.requestId,
                    IsHashDynamic = true,
                    IsCopyrightProtected = true, 
                    IsArchived = false,
                });
            }

            return Content(Newtonsoft.Json.JsonConvert.SerializeObject(assetReturnInfo), "application/json");
        }
	}
}	