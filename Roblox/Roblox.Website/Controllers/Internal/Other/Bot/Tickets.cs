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
    public class TicketBot : ControllerBase
    {
		private void ValidateBotAuth()
        {
	        if (Request.Headers["ATHERA-botAPIkey"].ToString() != Roblox.Configuration.BotAuthorization)
	        {
		        throw new Exception("Internal");
	        }
        }
		
		[HttpGetBypass("botapi/tickets/user/{discordId}")]
		public async Task<ActionResult<UserDiscord>> GetUserByDiscordId(string discordId)
		{
			try
			{
				ValidateBotAuth();
				var User = await services.users.GetUserDataByDiscordId(discordId);
				
				return Ok(User);
			}
			catch (RecordNotFoundException)
			{
				return NotFound();
			}
			catch (Exception ex)
			{
				return StatusCode(500);
			}
		}

		[HttpGetBypass("botapi/tickets/athera/{idOrName}")]
		public async Task<ActionResult<UserDiscord>> GetUserByAtheraId(string idOrName)
		{
			try
			{
				ValidateBotAuth();
				var User = await services.users.GetUserDataByAtheraId(idOrName);
				
				return Ok(User);
			}
			catch (RecordNotFoundException)
			{
				return NotFound();
			}
			catch (Exception ex)
			{
				return StatusCode(500);
			}
		}

		[HttpPostBypass("botapi/tickets/transcripts")]
		public async Task<ActionResult> StoreTranscriptMessages([MVC.FromBody] TicketTranscriptRequest request)
		{
			try
			{
				ValidateBotAuth();
				
				if (request?.data == null || request.data.Count == 0)
				{
					return BadRequest();
				}
				var LatestTicket = await services.users.GetLatestTicket();
				foreach (var kvp in request.data)
				{
					var TRequest = kvp.Value;
					
					if (string.IsNullOrEmpty(TRequest.user) || 
						string.IsNullOrEmpty(TRequest.message) || 
						string.IsNullOrEmpty(TRequest.discordId))
					{
						continue;
					}
					
					try
					{
						long userId = await services.users.GetUserIdUniversal(TRequest.user);
						
						await services.users.StoreTranscriptMessage(
							LatestTicket,
							userId, 
							TRequest.discordId, 
							TRequest.message,
							request.name
						);
					}
					catch (Exception ex)
					{
						Console.WriteLine($"failed to store transcript for {TRequest.user}: {ex.Message}");
					}
				}
				
				return Ok();
			}
			catch (Exception ex)
			{
				return StatusCode(500);
			}
		}
		public class PunishRequest
		{
			public string Type { get; set; }
			public string ID { get; set; }
			public string AuthorId { get; set; }
		}

		[HttpPostBypass("botapi/discord/punish")]
		public async Task<ActionResult> Punish([MVC.FromBody] PunishRequest request)
		{
			try
			{
				ValidateBotAuth();
				
				long userId = await services.users.GetUserIdUniversal(request.ID);

				long authorUserId = 1; 
				try 
				{
					var authorInfo = await services.users.GetUserDataByDiscordId(request.AuthorId);
					authorUserId = authorInfo.userId;
				}
				catch {}

				await services.users.PunishUser(userId, request.Type, authorUserId);
				
				return Ok(new { success = true, message = "Punishment applied" });
			}
			catch (Exception ex)
			{
				return Ok(new { success = false, error = ex.Message });
			}
		}
    }
}