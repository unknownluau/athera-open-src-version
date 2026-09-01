using System.ComponentModel.DataAnnotations;
using System.Dynamic;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Xml.Linq;
using System.IO.Compression;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using System.Collections.Concurrent;
using System.Diagnostics;
using Roblox.Dto.Games;
using Roblox.Dto.Persistence;
using Roblox.Dto.Users;
using Roblox.Dto.Friends;
using Microsoft.AspNetCore.Mvc;
using MVC = Microsoft.AspNetCore.Mvc;
using Roblox.Libraries.Assets;
using Roblox.Models.Games;
using Roblox.Libraries.FastFlag;
using Roblox.Libraries.RobloxApi;
using Roblox.Logging;
using Roblox.Services.Exceptions;
using BadRequestException = Roblox.Exceptions.BadRequestException;
using Roblox.Models;
using Roblox.Models.Assets;
using Roblox.Models.GameServer;
using Roblox.Models.Users;
using Roblox.Services;
using Roblox.Services.App.FeatureFlags;
using Roblox.Website.Filters;
using Roblox.Website.Middleware;
using Roblox.Website.WebsiteModels.Asset;
using Roblox.Website.WebsiteModels.Games;
using Roblox.Website.WebsiteModels.Promocodes;
using Roblox.Website.WebsiteModels.Donate;
using Roblox.Website.WebsiteModels.Discord;
using HttpGet = Roblox.Website.Controllers.HttpGetBypassAttribute;
using JsonSerializer = System.Text.Json.JsonSerializer;
using MultiGetEntry = Roblox.Dto.Assets.MultiGetEntry;
using SameSiteMode = Microsoft.AspNetCore.Http.SameSiteMode;
using ServiceProvider = Roblox.Services.ServiceProvider;
using Type = Roblox.Models.Assets.Type;
using System.Data;
using Npgsql;
using Dapper;

namespace Roblox.Website.Controllers
{
    [MVC.ApiController]
    [MVC.Route("/")]
    public class BypassController : ControllerBase
    {	
		[Microsoft.AspNetCore.Mvc.HttpGet("logout")]
        public MVC.IActionResult Logout()
        {
            foreach (var cookie in Request.Cookies.Keys)
            {
                Response.Cookies.Delete(cookie);
            }
            return Redirect("/");
        }

		[HttpPostBypass("my/friendsonline")]
        [HttpGetBypass("my/friendsonline")]
        public async Task<dynamic> GetFriendsOnline()
        {
            var result = await services.friends.GetFriends(safeUserSession.userId);
            List<dynamic> onlineFriends = new List<dynamic>();
            foreach (FriendEntry friend in result)
            {
                if (!friend.isOnline)
                    continue;
                var onlineStatus = (await services.users.MultiGetPresence(new[] { friend.id })).First();
                onlineFriends.Add(new
                {
                    VisitorId = friend.id,
                    GameId = onlineStatus.gameId,
                    IsOnline = friend.isOnline,
                    LastOnline = onlineStatus.lastOnline,
                    LastLocation = onlineStatus.lastLocation,
                    LocationType = (int)onlineStatus.userPresenceType,
                    PlaceId = onlineStatus.placeId,
                    UserName = friend.name,
                });
            }
            return onlineFriends;
        }

        [HttpGetBypass("abusereport/UserProfile"), HttpGetBypass("abusereport/asset"), HttpGetBypass("abusereport/user"), HttpGetBypass("abusereport/users")]
        public MVC.IActionResult ReportAbuseRedirect()
        {
            return new MVC.RedirectResult("/internal/report-abuse");
        }
		
        [Microsoft.AspNetCore.Mvc.HttpGet("internal/release-metadata")]
        public dynamic GetReleaseMetaData([Required] string requester)
        {
            throw new RobloxException(RobloxException.BadRequest, 0, "BadRequest");
        }
		
		[HttpPostBypass("/v1.0/SequenceStatistics/AddToSequence")]
        [HttpPostBypass("/v1.1/Counters/Increment")]
        [HttpPostBypass("/v1.0/SequenceStatistics/BatchAddToSequencesV2")]
        [HttpPostBypass("v1.0/MultiIncrement")]
        [HttpPostBypass("/game/report-stats")]
        [HttpGetBypass("usercheck/show-tos")]
        [HttpGetBypass("/v1.1/Counters/Increment")]
        [HttpGetBypass("notifications/signalr/negotiate")]
        [HttpGetBypass("notifications/negotiate")]
        [HttpPostBypass("v1.1/Counters/BatchIncrement")]
        [HttpGetBypass("v1.1/Counters/BatchIncrement")]
        public MVC.OkResult TelemetryFunctions()
        {
            return Ok();
        }
		
        private void ValidateBotAuthorization()
        {
#if DEBUG == false
	        if (Request.Headers["bot-auth"].ToString() != Roblox.Configuration.BotAuthorization)
	        {
		        throw new Exception("Internal");
	        }
#endif
        }

        [HttpGetBypass("botapi/migrate-alltypes")]
        public async Task<dynamic> MigrateAllItemsBot([Required, MVC.FromQuery] string url)
        {
            ValidateBotAuthorization();
            return await MigrateItem.MigrateItemFromRoblox(url, false, null, new List<Type>()
            {
                Type.Image,
                Type.Audio,
                Type.Mesh,
                Type.Lua,
                Type.Model,
                Type.Decal,
                Type.Animation,
                Type.SolidModel,
                Type.MeshPart,
                Type.ClimbAnimation,
                Type.DeathAnimation,
                Type.FallAnimation,
                Type.IdleAnimation,
                Type.JumpAnimation,
                Type.RunAnimation,
                Type.SwimAnimation,
                Type.WalkAnimation,
                Type.PoseAnimation,
            }, default, false);
        }

        [HttpGetBypass("botapi/migrate-clothing")]
        public async Task<dynamic> MigrateClothingBot([Required] string assetId)
        {
            ValidateBotAuthorization();
            return await MigrateItem.MigrateItemFromRoblox(assetId, true, 5, new List<Models.Assets.Type>() { Models.Assets.Type.TeeShirt, Models.Assets.Type.Shirt, Models.Assets.Type.Pants });
        }
        
        [HttpPostBypass("v1/join-game")]
        public async Task<PlaceLaunchResponse> JoinGameMobile([FromBody] JoinGame request)
        {
            var yearInt = await services.games.GetPlaceYear(request.placeId);
            long year = yearInt ?? 0;
            if (year != 2020)
            {
                return new PlaceLaunchResponse()
                {
                    status = (int)JoinStatus.Error,
                    message = "An error occured while starting the game."
                };
            }
            
            var launchResult = await services.gameServer.GetServerForPlace(request.placeId, year.ToString());
            
            if (launchResult.status == JoinStatus.Joining)
            {
                var port = await services.gameServer.GetServerPortFromDatabase(launchResult.job);
                var ticket = ROBLOSECURITY;
                var script = await services.gameJoin.GenerateJoinScript(safeUserSession.userId, request.placeId, launchResult.job, port, ticket, year.ToString());
                
                return new PlaceLaunchResponse()
                {
                    jobId = Guid.Parse(launchResult.job),
                    status = (int)JoinStatus.Joining,
                    joinScript = script,
                    authenticationUrl = Configuration.BaseUrl + "/Login/Negotiate.ashx",
                    authenticationTicket = ticket
                };
            }
            
            return new PlaceLaunchResponse()
            {
                status = (int)launchResult.status,
                jobId = launchResult.job != null ? Guid.Parse(launchResult.job) : null,
                message = "Waiting for server"
            };
        }
        [HttpGetBypass("BuildersClub/Upgrade.ashx")]
        public MVC.IActionResult UpgradeNow()
        {
            return new MVC.RedirectResult("/buildersclub");
        }
            
        // [HttpGetBypass("v1/search/items")]
        // public async Task<SearchResponse> SearchItems(string? category, string? subcategory, string? sortType, string? keyword, string? cursor, int limit = 10, CreatorType? creatorType = null, long? creatorTargetId = null, bool includeNotForSale = false, string? _genreFilterCsv = null)
        // {
        //     var include18Plus = userSession != null && await services.users.Is18Plus(userSession.userId);
        //     var request = new CatalogSearchRequest()
        //     {
        //         category = category,
        //         keyword = keyword,
        //         subcategory = subcategory,
        //         sortType = sortType,
        //         cursor = cursor,
        //         limit = limit,
        //         creatorType = creatorType,
        //         creatorTargetId = creatorTargetId,
        //         includeNotForSale = includeNotForSale,
        //         genres = _genreFilterCsv?.Split(",").Select(Enum.Parse<Genre>),
        //         include18Plus = include18Plus,
        //     };
        //     if (request.limit is > 100 or < 1) request.limit = 10;
        //     return await services.assets.SearchCatalog(request);
        // }

		[HttpPostBypass("buildersclub/membership")]
		public async Task<dynamic> UpdateMembership([Required, MVC.FromForm] string membershipType)
		{
			if (userSession == null)
				throw new RobloxException(401, 0, "Not authenticated");

			if (!Enum.TryParse<MembershipType>(membershipType, out var MembershipTypeParsed) || 
				!Enum.IsDefined(MembershipTypeParsed))
			{
				throw new RobloxException(400, 0, "Invalid membership type");
			}

			await services.users.InsertOrUpdateMembership(userSession.userId, MembershipTypeParsed);
			var metadata = MembershipMetadata.GetMetadata(MembershipTypeParsed);
			switch (MembershipTypeParsed)
			{
				case MembershipType.OutrageousBuildersClub:
					await services.users.GiveUserBadge(userSession.userId, 16); // OBC badge
					break;
				case MembershipType.TurboBuildersClub:
					await services.users.GiveUserBadge(userSession.userId, 15); // TBC badge
					break;
				case MembershipType.BuildersClub:
					await services.users.GiveUserBadge(userSession.userId, 11); // BC badge
					break;
			}
			
			await services.users.GiveUserBadge(userSession.userId, 18);
    
			return new
			{
				success = true,
				message = $"Membership updated to {metadata.displayName}. You will now receive {metadata.dailyRobux} Robux each day.",
			};
		}
	
		private static string FormatTimeSpan(TimeSpan span)
		{
			if (span.TotalDays >= 1)
				return $"{(int)span.TotalDays} day{(span.TotalDays >= 2 ? "s" : "")}";
			if (span.TotalHours >= 1)
				return $"{(int)span.TotalHours} hour{(span.TotalHours >= 2 ? "s" : "")}";
			if (span.TotalMinutes >= 1)
				return $"{(int)span.TotalMinutes} minute{(span.TotalMinutes >= 2 ? "s" : "")}";
			return $"{(int)span.TotalSeconds} second{(span.TotalSeconds >= 2 ? "s" : "")}";
		}

		[HttpGetBypass("my/settings/json")]
        public async Task<dynamic> SettingsJsonA()
        {
            var userInfo = await services.users.GetUserById(safeUserSession.userId);
            bool isAdmin = await StaffFilter.IsStaff(safeUserSession.userId);

            return new
            {
                ChangeUsernameEnabled = true,
                IsAdmin = isAdmin,
                UserId = safeUserSession.userId,
                Name = safeUserSession.username,
                DisplayName = safeUserSession.username,
                IsEmailOnFile = true,
                IsEmailVerified = true,
                IsPhoneFeatureEnabled = true,
                RobuxRemainingForUsernameChange = 0,
                PreviousUserNames = "",
                UseSuperSafePrivacyMode = false,
                IsSuperSafeModeEnabledForPrivacySetting = false,
                UseSuperSafeChat = false,
                IsAppChatSettingEnabled = true,
                IsGameChatSettingEnabled = true,
                IsAccountPrivacySettingsV2Enabled = true,
                IsSetPasswordNotificationEnabled = false,
                ChangePasswordRequiresTwoStepVerification = false,
                ChangeEmailRequiresTwoStepVerification = false,
                UserEmail = "athera@athera.sbs",
                UserEmailMasked = true,
                UserEmailVerified = true,
                CanHideInventory = true,
                CanTrade = false,
                MissingParentEmail = false,
                IsUpdateEmailSectionShown = true,
                IsUnder13UpdateEmailMessageSectionShown = false,
                IsUserConnectedToFacebook = false,
                IsTwoStepToggleEnabled = false,
                AgeBracket = 0,
                UserAbove13 = true,
                ClientIpAddress = GetRequesterIpRaw(HttpContext),
                AccountAgeInDays = DateTime.UtcNow.Subtract(userInfo.created).Days,
                IsOBC = false,
                IsTBC = false,
                IsAnyBC = false,
                IsPremium = false,
                IsBcRenewalMembership = false,
                BcExpireDate = "/Date(-0)/",
                BcRenewalPeriod = (string?)null,
                BcLevel = (int?)null,
                HasCurrencyOperationError = false,
                CurrencyOperationErrorMessage = (string?)null,
                BlockedUsersModel = new
                {
                    BlockedUserIds = new List<int>() { },
                    BlockedUsers = new List<string>() { },
                    MaxBlockedUsers = 50,
                    Total = 1,
                    Page = 1
                },
                Tab = (string?)null,
                ChangePassword = false,
                IsAccountPinEnabled = true,
                IsAccountRestrictionsFeatureEnabled = true,
                IsAccountRestrictionsSettingEnabled = false,
                IsAccountSettingsSocialNetworksV2Enabled = false,
                IsUiBootstrapModalV2Enabled = true,
                IsI18nBirthdayPickerInAccountSettingsEnabled = true,
                InApp = false,
                MyAccountSecurityModel = new
                {
                    IsEmailSet = true,
                    IsEmailVerified = true,
                    IsTwoStepEnabled = false,
                    ShowSignOutFromAllSessions = true,
                    TwoStepVerificationViewModel = new
                    {
                        UserId = safeUserSession.userId,
                        IsEnabled = false,
                        CodeLength = 6,
                        ValidCodeCharacters = (int?)null
                    }
                },
                ApiProxyDomain = Configuration.BaseUrl,
                AccountSettingsApiDomain = Configuration.BaseUrl,
                AuthDomain = Configuration.BaseUrl,
                IsDisconnectFbSocialSignOnEnabled = true,
                IsDisconnectXboxEnabled = true,
                NotificationSettingsDomain = Configuration.BaseUrl,
                AllowedNotificationSourceTypes = new List<string>
                {
                    "Test",
                    "FriendRequestReceived",
                    "FriendRequestAccepted",
                    "PartyInviteReceived",
                    "PartyMemberJoined",
                    "ChatNewMessage",
                    "PrivateMessageReceived",
                    "UserAddedToPrivateServerWhiteList",
                    "ConversationUniverseChanged",
                    "TeamCreateInvite",
                    "GameUpdate",
                    "DeveloperMetricsAvailable"
                },
                AllowedReceiverDestinationTypes = new List<string>
                {
                    "DesktopPush",
                    "NotificationStream"
                },
                BlacklistedNotificationSourceTypesForMobilePush = new List<string> { },
                MinimumChromeVersionForPushNotifications = 50,
                PushNotificationsEnabledOnFirefox = true,
                LocaleApiDomain = Configuration.BaseUrl,
                HasValidPasswordSet = true,
                IsUpdateEmailApiEndpointEnabled = true,
                FastTrackMember = (string?)null,
                IsFastTrackAccessible = false,
                HasFreeNameChange = false,
                IsAgeDownEnabled = false,
                IsSendVerifyEmailApiEndpointEnabled = true,
                IsPromotionChannelsEndpointEnabled = true,
                ReceiveNewsletter = false,
                SocialNetworksVisibilityPrivacy = 6,
                SocialNetworksVisibilityPrivacyValue = "AllUsers",
                Facebook = (string?)null,
                Twitter = (string?)null,
                YouTube = (string?)null,
                Twitch = (string?)null
            };
        }
		
		[HttpGetBypass("/v1/user/currency")]
        [HttpGetBypass("/my/balance")]
        public async Task<dynamic> MyBalance()
        {
            return new
            {
                robux = await services.economy.GetUserRobux(safeUserSession.userId),
            };
        }

		[HttpGetBypass("promocodes/redeem")]
		public async Task<dynamic> RedeemPromoCode(
			[Required] string code,
			[MVC.FromServices] NpgsqlConnection db)
		{
			if (userSession == null)
			{
				throw new RobloxException(401, 0, "Not authenticated");
			}
			
			await db.OpenAsync();
			code = code.Trim().ToUpper();
			var userId = userSession.userId;

			PromoCodeEntry promocode;
			try
			{
				promocode = await db.QuerySingleOrDefaultAsync<PromoCodeEntry>(
					"SELECT * FROM promocodes WHERE code = @code",
					new { code });

				if (promocode == null)
				{
					throw new RobloxException(400, 0, "This promocode does not exist");
				}

				var UTCTime = DateTime.UtcNow;
				var ExpiresAtUtc = promocode.expires_at.HasValue 
					? DateTime.SpecifyKind(promocode.expires_at.Value, DateTimeKind.Utc)
					: (DateTime?)null;

				if (!promocode.active)
				{
					throw new RobloxException(400, 0, "This promocode is no longer active");
				}

				if (ExpiresAtUtc.HasValue && ExpiresAtUtc.Value < UTCTime)
				{
					var timeSinceExpired = UTCTime - ExpiresAtUtc.Value;
					throw new RobloxException(400, 0, 
						/* $"This promocode expired {FormatTimeSpan(timeSinceExpired)} ago"); */
						"This promocode has expired");
				}

				if (promocode.expires_at.HasValue && promocode.expires_at.Value < DateTime.UtcNow)
				{
					throw new RobloxException(400, 0, "This promocode has expired");
				}

				if (promocode.uses >= promocode.maxuses)
				{
					throw new RobloxException(400, 0, "This promocode has reached it's maximum redemptions");
				}

				var hasRedeemed = await db.ExecuteScalarAsync<int>(
					"SELECT COUNT(*) FROM promocode_redemptions WHERE user_id = @userId AND promocode = @promocodeID",
					new { userId, promocodeID = promocode.id }) > 0;

				if (hasRedeemed)
				{
					throw new RobloxException(400, 0, "You have already redeemed this promocode");
				}

				using var transaction = await db.BeginTransactionAsync();
				try
				{
					await db.ExecuteAsync(
						"UPDATE promocodes SET uses = uses + 1 WHERE id = @id",
						new { id = promocode.id },
						transaction);

					await db.ExecuteAsync(
						"INSERT INTO promocode_redemptions (promocode, user_id, asset_id, robux) " +
						"VALUES (@promocodeID, @userId, @assetId, @robux)",
						new
						{
							promocodeID = promocode.id,
							userId,
							assetId = promocode.asset_id,
							robux = promocode.robux
						},
						transaction);

					if (promocode.asset_id.HasValue)
					{
						await db.ExecuteAsync(
							"INSERT INTO user_asset (user_id, asset_id) VALUES (@userId, @assetId)",
							new { userId, assetId = promocode.asset_id.Value },
							transaction);
					}

					if (promocode.robux.HasValue && promocode.robux.Value > 0)
					{
						await db.ExecuteAsync(
							"UPDATE user_economy SET balance_robux = balance_robux + @amount WHERE user_id = @userId",
							new { userId, amount = promocode.robux.Value },
							transaction);
					}

					await transaction.CommitAsync();
				}
				catch
				{
					await transaction.RollbackAsync();
					throw;
				}

				string name = null;
				if (promocode.asset_id.HasValue)
				{
					try
					{
						var assetInfo = await services.assets.GetAssetCatalogInfo(promocode.asset_id.Value);
						name = assetInfo.name;
					}
					catch { /* ignore */ }
				}

				return new
				{
					success = true,
					message = "Promocode redeemed successfully!",
					assetId = promocode.asset_id,
					name,
					robux = promocode.robux
				};
			}
			finally
			{
				// idk man do something here
			}
		}

		[HttpGetBypass("donate/tiers")]
		public async Task<dynamic> GetDonateTiers(
			[MVC.FromServices] NpgsqlConnection db)
		{
			await db.OpenAsync();
			var tiers = await db.QueryAsync<DonateTier>(
				"SELECT * FROM donate_tiers WHERE active = true ORDER BY price_usd ASC");
			return tiers.Select(t => new
			{
				id = t.id,
				price_usd = t.price_usd,
				name = t.name,
				asset_id = t.asset_id,
				robux = t.robux,
				includes_all_items = t.includes_all_items,
			});
		}

		[HttpGetBypass("donate/settings")]
		public async Task<dynamic> GetDonateSettings(
			[MVC.FromServices] NpgsqlConnection db)
		{
			await db.OpenAsync();
			var row = await db.QuerySingleOrDefaultAsync(
				"SELECT * FROM donate_settings WHERE id = 1");
			if (row == null)
				return new { countdown_enabled = false, countdown_end_date = (string?)null };
			return row;
		}

		[HttpPostBypass("donate/settings")]
		public async Task<dynamic> UpdateDonateSettings(
			[Required, FromBody] UpdateDonateSettingsReq req,
			[MVC.FromServices] NpgsqlConnection db)
		{
			if (userSession == null)
				throw new RobloxException(401, 0, "Not authenticated");

			await db.OpenAsync();
			await db.ExecuteAsync(
				@"INSERT INTO donate_settings (id, countdown_enabled, countdown_end_date)
				  VALUES (1, @countdown_enabled, @countdown_end_date)
				  ON CONFLICT (id) DO UPDATE SET
				  countdown_enabled = @countdown_enabled,
				  countdown_end_date = @countdown_end_date",
				new
				{
					countdown_enabled = req.CountdownEnabled,
					countdown_end_date = req.CountdownEndDate
				});

			return new { success = true, message = "Donation settings updated!" };
		}

		[HttpPostBypass("donate/redeem")]
		public async Task<dynamic> RedeemDonateCode(
			[Required,FromBody] RedeemDonateCodeReq req,
			[MVC.FromServices] NpgsqlConnection db)
		{
			if (userSession == null)
				throw new RobloxException(401, 0, "Not authenticated");

			await db.OpenAsync();
			var code = req.code?.Trim().ToUpper() ?? "";
			var userId = userSession.userId;

			var donateCode = await db.QuerySingleOrDefaultAsync<DonateCode>(
				"SELECT * FROM donate_codes WHERE code = @code",
				new { code });

			if (donateCode == null)
				throw new RobloxException(400, 0, "This voucher code does not exist");

			if (!donateCode.active)
				throw new RobloxException(400, 0, "This voucher code is no longer active");

			if (donateCode.expires_at.HasValue)
			{
				var expiresAt = DateTime.SpecifyKind(donateCode.expires_at.Value, DateTimeKind.Utc);
				if (expiresAt < DateTime.UtcNow)
					throw new RobloxException(400, 0, "This voucher code has expired");
			}

			if (donateCode.maxuses.HasValue && donateCode.uses.HasValue && donateCode.uses >= donateCode.maxuses)
				throw new RobloxException(400, 0, "This voucher code has reached its maximum redemptions");

			var hasRedeemed = await db.ExecuteScalarAsync<int>(
				"SELECT COUNT(*) FROM donate_redemptions WHERE user_id = @userId AND donate_code_id = @donateCodeId",
				new { userId, donateCodeId = donateCode.id }) > 0;

			if (hasRedeemed)
				throw new RobloxException(400, 0, "You have already redeemed this voucher code");

			var tiers = await db.QueryAsync<DonateTier>(
				"SELECT * FROM donate_tiers WHERE price_usd = @priceUsd",
				new { priceUsd = donateCode.price_usd });

			using var transaction = await db.BeginTransactionAsync();
			try
			{
				await db.ExecuteAsync(
					"UPDATE donate_codes SET uses = uses + 1 WHERE id = @id",
					new { id = donateCode.id },
					transaction);

				await db.ExecuteAsync(
					"INSERT INTO donate_redemptions (donate_code_id, user_id, price_usd) VALUES (@donateCodeId, @userId, @priceUsd)",
					new { donateCodeId = donateCode.id, userId, priceUsd = donateCode.price_usd },
					transaction);

				int totalRobux = 0;
				var grantedItems = new List<long>();

				foreach (var tier in tiers)
				{
					var alreadyOwns = await db.ExecuteScalarAsync<int>(
						"SELECT COUNT(*) FROM user_asset WHERE user_id = @userId AND asset_id = @assetId",
						new { userId, assetId = tier.asset_id },
						transaction) > 0;

					if (!alreadyOwns)
					{
						await db.ExecuteAsync(
							"INSERT INTO user_asset (user_id, asset_id) VALUES (@userId, @assetId)",
							new { userId, assetId = tier.asset_id },
							transaction);
						grantedItems.Add(tier.asset_id);
					}

					if (tier.robux > 0)
					{
						await db.ExecuteAsync(
							"UPDATE user_economy SET balance_robux = balance_robux + @amount WHERE user_id = @userId",
							new { userId, amount = tier.robux },
							transaction);
						totalRobux += tier.robux;
					}

					if (tier.includes_all_items)
					{
						var allTiers = await db.QueryAsync<DonateTier>(
							"SELECT * FROM donate_tiers WHERE price_usd < @priceUsd",
							new { priceUsd = tier.price_usd },
							transaction);

						foreach (var lowerTier in allTiers)
						{
							var ownCheck = await db.ExecuteScalarAsync<int>(
								"SELECT COUNT(*) FROM user_asset WHERE user_id = @userId AND asset_id = @assetId",
								new { userId, assetId = lowerTier.asset_id },
								transaction) > 0;

							if (!ownCheck)
							{
								await db.ExecuteAsync(
									"INSERT INTO user_asset (user_id, asset_id) VALUES (@userId, @assetId)",
									new { userId, assetId = lowerTier.asset_id },
									transaction);
								grantedItems.Add(lowerTier.asset_id);
							}

							if (lowerTier.robux > 0)
							{
								await db.ExecuteAsync(
									"UPDATE user_economy SET balance_robux = balance_robux + @amount WHERE user_id = @userId",
									new { userId, amount = lowerTier.robux },
									transaction);
								totalRobux += lowerTier.robux;
							}
						}
					}
				}

				await transaction.CommitAsync();

				return new
				{
					success = true,
					message = "Voucher redeemed successfully!",
					robux = totalRobux,
					items = grantedItems,
				};
			}
			catch
			{
				await transaction.RollbackAsync();
				throw;
			}
		}

		[HttpPostBypass("moderation/kickuser")]
        public async Task<MVC.IActionResult> KickPlayerFromBot(long userId)
        {
            await services.gameServer.KickPlayer(userId);
            return Ok();
        }

    }
}
