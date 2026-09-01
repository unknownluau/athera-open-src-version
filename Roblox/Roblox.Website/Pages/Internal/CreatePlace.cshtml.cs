using Microsoft.AspNetCore.Mvc.RazorPages;
using Roblox.Dto.Users;
using Roblox.Logging;
using Roblox.Models.Assets;
using Roblox.Models.Trades;
using Roblox.Services;
using Roblox.Services.App.FeatureFlags;
using Type = Roblox.Models.Assets.Type;

namespace Roblox.Website.Pages.Internal;

public class CreatePlace : RobloxPageModel
{
    public string? errorMessage { get; set; }
    public string? successUrl { get; set; }
    
    public void OnGet()
    {
        
    }

    public enum PlaceCreationFailureReason
    {
        Ok = 1,
        AccountTooNew,
        TooManyPlaces,
        NoApplication,
        TooInactive,
        LatestPlaceCreatedTooRecently,
        NotEnoughVisitsForNewPlace,
    }

    private string GetRedisKeyForRejection(long userId)
    {
        return "app_rejected_recently_for_place:v1.2:" + userId;
    }

    private async Task<bool> WasRejectedRecently(long userId)
    {
        var result = await Roblox.Services.Cache.distributed.StringGetAsync(GetRedisKeyForRejection(userId));
        if (result != null)
            return true;
        return false;
    }

    public async Task<bool> IsActiveEnoughForPlace(long userId)
    {
        return true; // OK
    }
    
	public async Task<PlaceCreationFailureReason> CanCreatePlace(long userId)
	{
		var log = Writer.CreateWithId(LogGroup.AbuseDetection);
		log.Info("start CanCreatePlace with userId={0}", userId);
		
		// check if user has reached the maximum number of places (25)
		var createdPlaces = (await services.assets.GetCreations(CreatorType.User, userId, Type.Place, 0, 100)).ToArray();
		if (createdPlaces.Length >= 25)
		{
			log.Info("account has too many places {0}", createdPlaces.Length);
			return PlaceCreationFailureReason.TooManyPlaces;
		}
		
		return PlaceCreationFailureReason.Ok;
	}
	
	private string GetMessage(PlaceCreationFailureReason reason)
	{
		return reason switch
		{
			PlaceCreationFailureReason.TooManyPlaces => "You've reached the maximum limit of 10 places per account.",
			_ => "Unknown reason. Code = " + reason.ToString(),
		};
	}

    public async Task OnPost()
    {
        if (userSession == null)
        {
            errorMessage = "Not logged in.";
            return;
        }

        if (!FeatureFlags.IsEnabled(FeatureFlag.CreatePlaceSelfService))
        {
            errorMessage = "Place creation is disabled globally at this time. Try again later.";
            return;
        }

        await using var createGameLock =
            await Roblox.Services.Cache.redLock.CreateLockAsync("CreatePlaceSelfServiceV1:UserId:" + userSession.userId,
                TimeSpan.FromSeconds(10));
        
        if (!createGameLock.IsAcquired)
        {
            Writer.Info(LogGroup.AbuseDetection, "CreatePlace OnPost could not acquire createGameLock");
            errorMessage = "Too many attempts. Try again in a few seconds.";
            return;
        }

        var createStatus = await CanCreatePlace(userSession.userId);
        if (createStatus != PlaceCreationFailureReason.Ok)
        {
            errorMessage = GetMessage(createStatus);
            return;
        }
        Writer.Info(LogGroup.AbuseDetection, "CreatePlace OnPost userId={0} can create a place, creating it", userSession.userId);
        // create one!
        var asset = await services.assets.CreatePlace(userSession.userId, CreatorType.User, userSession.userId);
        // create universe too
        await services.games.CreateUniverse(asset.placeId);
        // give url
		successUrl = $"{Roblox.Configuration.BaseUrl}/places/{asset.placeId}/update";
    }
}
