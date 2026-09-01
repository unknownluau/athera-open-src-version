using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Roblox.Exceptions;
using Roblox.Logging;
using Roblox.Models.Users;
using Roblox.Services;
using Roblox.Services.App.FeatureFlags;
using Roblox.Website.Middleware;
using BadRequestException = Roblox.Exceptions.BadRequestException;
using MVC = Microsoft.AspNetCore.Mvc;
using Roblox.Services.Exceptions;
using Roblox.Website.WebsiteModels.Discord;
using Npgsql;
using Dapper;
using Roblox.Dto.Users;


namespace Roblox.Website.Controllers 
{
    [MVC.ApiController]
    [MVC.Route("/")]
    public class MobileShitTesting : ControllerBase 
    {
		[HttpGetBypass("mobileapi/check-app-version")]
        [HttpPostBypass("mobileapi/check-app-version")]
		public MVC.IActionResult MobileCheckAppVer()
		{
            Console.WriteLine("[POST] /mobileapi/check-app-version");
			return Ok(new
			{
				data = new
				{
					UpgradeAction = "None"
				}
			});
		}
		
		[HttpGetBypass("device/initialize")]
        [HttpPostBypass("device/initialize")]
        public MVC.IActionResult InitDevice()
        {
            Console.WriteLine("[POST] /device/initialize");
            return Ok(new
            {
                browserTrackerId = 1,
                appDeviceIdentifier = (string?)null,
            });
        }
		
		private async Task RateLimitCheck()
		{
			var loginKey = "LoginAttemptCountV1:" + GetIP();
			var attemptCount = (await services.cooldown.GetBucketDataForKey(loginKey, TimeSpan.FromMinutes(10))).ToArray();

			if (!await services.cooldown.TryIncrementBucketCooldown(loginKey, 15, TimeSpan.FromMinutes(10), attemptCount, true))
			{
				throw new ForbiddenException(15, "Too many attempts, please wait about 10 minutes before retrying!");
			}
		}
		
		public class MobileLoginReq
		{
			public string username { get; set; }
			public string password { get; set; }
		}
		
		[HttpPostBypass("mobile/login")]
        public async Task<dynamic> MobileLogin([FromBody] MobileLoginReq request)
        {
            Console.WriteLine("[POST] /mobile/login");
            FeatureFlags.FeatureCheck(FeatureFlag.LoginEnabled);
            await RateLimitCheck();

            if (string.IsNullOrEmpty(request.username) || string.IsNullOrEmpty(request.password))
                throw new BadRequestException(3, "Username and Password are required. Please try again.");

            UserInfo userInfo;
            try
            {
                userInfo = await services.users.GetUserByName(request.username);
            }
            catch (RecordNotFoundException)
            {
                throw new ForbiddenException(1, "Incorrect username or password. Please try again.");
            }

            if(await Login(request.username, request.password, userInfo.userId))
                await CreateSessionAndSetCookie(userInfo.userId);

            var userBalance = await services.economy.GetUserBalance(userInfo.userId);

            return new
            {
                Status = "OK",
                UserId = userInfo.userId,
                UserName = userInfo.username,
                RobuxBalance = userBalance.robux,
                ThumbnailUrl = $"{Configuration.BaseUrl}/Thumbs/Avatar.ashx?userId={userInfo.userId}",
                IsUnder13 = false,
                MembershipType = 1
            };
        }

		[HttpPostBypass("Login/v1")]
        public async Task<dynamic> MobileLoginV1([FromBody] MobileLoginReq request)
        {
            Console.WriteLine("[POST] /Login/v1");
            FeatureFlags.FeatureCheck(FeatureFlag.LoginEnabled);
            await RateLimitCheck();

            if (string.IsNullOrEmpty(request.username) || string.IsNullOrEmpty(request.password))
                throw new BadRequestException(3, "Username and Password are required. Please try again.");

            UserInfo userInfo;
            try
            {
                userInfo = await services.users.GetUserByName(request.username);
            }
            catch (RecordNotFoundException)
            {
                throw new ForbiddenException(1, "Incorrect username or password. Please try again.");
            }

            if(await Login(request.username, request.password, userInfo.userId))
                await CreateSessionAndSetCookie(userInfo.userId);

            var userBalance = await services.economy.GetUserBalance(userInfo.userId);

            return new
            {
                Status = "OK",
                UserId = userInfo.userId,
                UserName = userInfo.username,
                RobuxBalance = userBalance.robux,
                ThumbnailUrl = $"{Configuration.BaseUrl}/Thumbs/Avatar.ashx?userId={userInfo.userId}",
                IsUnder13 = false,
                MembershipType = 1
            };
        }
		
		private async Task<bool> Login(string username, string password, long userId)
		{
			try
			{
				FeatureFlags.FeatureCheck(FeatureFlag.LoginEnabled);
			}
			catch (RobloxException)
			{
				throw new RobloxException(503, 0, "Login is currently disabled. Please try again later.");
			}
			await RateLimitCheck();
			try
			{
				if (!await services.users.VerifyPassword(userId, password))
					throw new ForbiddenException(1, "Incorrect username or password. Please try again");
			}
			catch (RecordNotFoundException)
			{
				throw new ForbiddenException(4, "Your account has been locked. Please reset your password to unlock your account.");
			}

			return true;
		}
		
		private async Task<string> CreateSessionAndSetCookie(long userId)
		{
			var sessionCookie = Middleware.SessionMiddleware.CreateJwt(new Middleware.JwtEntry()
			{
				sessionId = await services.users.CreateSession(userId),
				createdAt = DateTimeOffset.Now.ToUnixTimeSeconds(),
			});

			HttpContext.Response.Cookies.Append(Middleware.SessionMiddleware.CookieName, sessionCookie, new CookieOptions()
			{
				Domain = ".athera.sbs",
				Secure = false,
				Expires = DateTimeOffset.Now.Add(TimeSpan.FromDays(364)),
				IsEssential = true,
				Path = "/",
				SameSite = SameSiteMode.Lax,
			});
			return sessionCookie;
		}
	}
}	