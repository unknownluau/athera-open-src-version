using System;
using System.Collections.Generic;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Roblox.Website.Middleware;
using Roblox.Services.App.FeatureFlags;
using BadRequestException = Roblox.Exceptions.BadRequestException;
using MVC = Microsoft.AspNetCore.Mvc;
using Roblox.Services;
using Roblox.Services.Exceptions;
using Roblox.Models.Users;
using Roblox.Models.Economy;
using Roblox.Dto.Assets;
using Roblox.Models.Assets;
using Roblox.Website.WebsiteModels.Asset;
using Roblox.Dto.Tickets;

namespace Roblox.Website.Controllers
{
    [MVC.ApiController]
    [MVC.Route("/")]
    public class ResetPasswordBot : ControllerBase
    {
        private void ValidateBotAuth()
        {
            if (Request.Headers["ATHERA-botAPIkey"].ToString() != Roblox.Configuration.BotAuthorization)
            {
                throw new Exception("Internal");
            }
        }

        [HttpGetBypass("botapi/resetpassword")]
        public async Task<dynamic> ResetPassword([FromQuery] string ID)
        {
            ValidateBotAuth();
            var userId = await services.users.GetUserIdUniversal(ID);
            string randomlyGeneratedPassword = (Guid.NewGuid().ToString().Replace("-", "") + Guid.NewGuid().ToString().Replace("-", "")).Substring(0, 32);
            await services.users.UpdatePassword(userId, newPassword: randomlyGeneratedPassword);
            return new
            {
                success = true,
                password = randomlyGeneratedPassword,
                message = "The password has been successfully reset. \nThe password has been sent in your DMs"
            };
        }

        public class ChangeUsernameBotRequest
        {
            public string userId { get; set; }
            public string newUsername { get; set; }
        }

        public class KickUserBotRequest
        {
            public string userId { get; set; }
        }

        [HttpPostBypass("botapi/kickuser")]
        public async Task<dynamic> KickUser([FromBody] KickUserBotRequest request)
        {
            ValidateBotAuth();
            var userId = await services.users.GetUserIdUniversal(request.userId);
            var userInfo = await services.users.GetUserById(userId);
            await services.gameServer.KickPlayer(userId);
            
            return new
            {
                success = true,
                message = $"Successfully kicked {userInfo.username}",
                username = userInfo.username
            };
        }

        [HttpPostBypass("botapi/changeusername")]
        public async Task<dynamic> ChangeUsername([FromBody] ChangeUsernameBotRequest request)
        {
            ValidateBotAuth();
            var userId = await services.users.GetUserIdUniversal(request.userId);
            var userInfo = await services.users.GetUserById(userId);
            
            var isValid = await services.users.IsUsernameValid(request.newUsername);
            if (!isValid)
            {
                return new
                {
                    success = false,
                    message = "Invalid username"
                };
            }

            var isAvailable = await services.users.IsNameAvailableForNameChange(userId, request.newUsername);
            if (!isAvailable)
            {
                return new
                {
                    success = false,
                    message = "Username is not available"
                };
            }

            await services.users.AdminChangeUsername(userId, request.newUsername, userInfo.username, 1);
            
            return new
            {
                success = true,
                oldUsername = userInfo.username,
                newUsername = request.newUsername,
                message = "Username changed successfully"
            };
        }
    }
}
        
