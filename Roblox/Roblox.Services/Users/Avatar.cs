using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Dapper;
using Roblox.Dto;
using Roblox.Dto.Avatar;
using Roblox.Models.Assets;
using Roblox.Models.Avatar;
using Roblox.Services.DbModels;
using Roblox.Exceptions.Services.Users;
using Roblox.Rendering;
using Roblox.Services.Exceptions;
using Type = Roblox.Models.Assets.Type;

namespace Roblox.Services;

public class AvatarService : ServiceBase, IService
{
    private const long DefaultShirtAssetId = 0;
    private const long DefaultPantsAssetId = 9383;

    private static readonly Type[] ClothingTypes = new[]
    {
        Type.Shirt,
        Type.TeeShirt,
        Type.Pants,
    };

    private async Task<bool> UserHasClothingType(long userId, Type type)
    {
        var assets = await GetWornAssets(userId);
        var assetList = assets.ToList();
        if (assetList.Count == 0) return false;
        
        using var assetsService = ServiceProvider.GetOrCreate<AssetsService>(this);
        var info = await assetsService.MultiGetInfoById(assetList);
        return info.Any(c => c.assetType == type);
    }

    private async Task<(bool hasShirt, bool hasPants)> GetUserClothingStatus(long userId)
    {
        var hasShirt = await UserHasClothingType(userId, Type.Shirt) || await UserHasClothingType(userId, Type.TeeShirt);
        var hasPants = await UserHasClothingType(userId, Type.Pants);
        return (hasShirt, hasPants);
    }

    private bool IsBodyNaked(ColorEntry colors)
    {
        return colors.headColorId == colors.torsoColorId &&
               colors.torsoColorId == colors.leftArmColorId &&
               colors.leftArmColorId == colors.rightArmColorId &&
               colors.rightArmColorId == colors.leftLegColorId &&
               colors.leftLegColorId == colors.rightLegColorId;
    }

    public async Task<IEnumerable<long>> GetWornAssets(long userId)
    {
        return (await db.QueryAsync<AssetId>(
            "SELECT distinct(ua.asset_id) as assetId FROM user_avatar_asset av INNER JOIN user_asset ua ON ua.user_id = av.user_id AND ua.asset_id = av.asset_id WHERE av.user_id = :user_id", new
            {
                user_id = userId,
            })).Select(c => c.assetId);
    }

    public async Task<bool> IsUserAvatar18Plus(long userId)
    {
        var result = await db.QuerySingleOrDefaultAsync<Dto.Total>
        ("SELECT count(*) AS total FROM user_avatar_asset INNER JOIN asset ON asset.id = user_avatar_asset.asset_id WHERE asset.is_18_plus AND user_avatar_asset.user_id = :user_id",
            new
            {
                user_id = userId,
            });
        return result.total != 0;
    }

    public async Task<IEnumerable<long>> GetRecentItems(long userId)
    {
        var result =
            await db.QueryAsync(
                "SELECT distinct asset_id, max(id) FROM user_asset WHERE user_id = :user_id GROUP BY asset_id ORDER BY max(id) DESC, asset_id LIMIT 50",
                new
                {
                    user_id = userId,
                });
        return result.Select(c => (long) c.asset_id);
    }

	public async Task<AvatarWithColors> GetAvatar(long userId)
	{
		var existingAvatar = await db.QuerySingleOrDefaultAsync<DatabaseAvatarWithImages>(
			"SELECT head_color_id, torso_color_id, left_arm_color_id, right_arm_color_id, left_leg_color_id, right_leg_color_id, thumbnail_url, headshot_thumbnail_url, thumbnail_3d_url FROM user_avatar WHERE user_id = :user_id",
			new
			{
				user_id = userId,
			});
		return new AvatarWithColors()
		{
			headColorId = existingAvatar.head_color_id,
			torsoColorId = existingAvatar.torso_color_id,
			rightArmColorId = existingAvatar.right_arm_color_id,
			leftArmColorId = existingAvatar.left_arm_color_id,
			rightLegColorId = existingAvatar.right_leg_color_id,
			leftLegColorId = existingAvatar.left_leg_color_id,
			thumbnailUrl = existingAvatar.thumbnail_url,
			headshotUrl = existingAvatar.headshot_thumbnail_url,
			thumbnail3dUrl = existingAvatar.thumbnail_3d_url,
		};
	}

    public async Task<ColorEntry> GetAvatarColors(long userId)
    {
        var existingAvatar = await db.QuerySingleOrDefaultAsync<DatabaseAvatar>(
            "SELECT head_color_id, torso_color_id, left_arm_color_id,right_arm_color_id,left_leg_color_id,right_leg_color_id FROM user_avatar WHERE user_id = :user_id",
            new
            {
                user_id = userId,
            });
        return new ColorEntry()
        {
            headColorId = existingAvatar.head_color_id,
            torsoColorId = existingAvatar.torso_color_id,
            rightArmColorId = existingAvatar.right_arm_color_id,
            leftArmColorId = existingAvatar.left_arm_color_id,
            rightLegColorId = existingAvatar.right_leg_color_id,
            leftLegColorId = existingAvatar.left_leg_color_id,
        };
    }
	
	public async Task<AvatarImages> GetAvatarImages(long userId)
	{
		var result = await db.QuerySingleOrDefaultAsync<AvatarImages>(
			"SELECT thumbnail_url as thumbnailUrl, headshot_thumbnail_url as headshotUrl, thumbnail_3d_url as thumbnail3dUrl FROM user_avatar WHERE user_id = :user_id",
			new { user_id = userId });
		
		return result ?? new AvatarImages();
	}

	public class AvatarImages
	{
		public string? thumbnailUrl { get; set; }
		public string? headshotUrl { get; set; }
		public string? thumbnail3dUrl { get; set; }
	}

	private readonly Models.Assets.Type[] _wearableAssetTypes = new[]
	{
		Type.Shirt,
		Type.Pants,
		Type.TeeShirt,
		
		Type.Face,
		Type.Hat,
		Type.FrontAccessory,
		Type.BackAccessory,
		Type.WaistAccessory,
		Type.HairAccessory,
		Type.NeckAccessory,
		Type.ShoulderAccessory,
		Type.FaceAccessory,
		
		Type.LeftArm,
		Type.RightArm,
		Type.LeftLeg,
		Type.RightLeg,
		Type.Torso,
		Type.Head,
		
		Type.Gear,

		Type.ClimbAnimation,
		Type.FallAnimation,
		Type.IdleAnimation,
		Type.JumpAnimation,
		Type.RunAnimation,
		Type.SwimAnimation,
		Type.WalkAnimation,
		Type.EmoteAnimation,
	};

    public async Task<IEnumerable<long>> FilterAssetsForRender(long userId, IEnumerable<long> dirtyAssetIds)
    {
        var assetIds = dirtyAssetIds.ToList();
        if (assetIds.Count != 0)
        {
            using var assets = ServiceProvider.GetOrCreate<AssetsService>();
            var moderationStatus = (await db.QueryAsync<AssetModerationEntry>(
                "SELECT moderation_status as moderationStatus, id as assetId, asset_type as assetType FROM asset WHERE id = ANY(:ids)", new
                {
                    ids = assetIds,
                })).ToList();
            var safeModList = moderationStatus.ToList();
            foreach (var item in moderationStatus)
            {
                if (item.assetType == Type.Package)
                {
                    var packageAssetIds = await assets.GetPackageAssets(item.assetId);
                    var otherModStatus = (await db.QueryAsync<AssetModerationEntry>(
                        "SELECT moderation_status as moderationStatus, id as assetId, asset_type as assetType FROM asset WHERE id = ANY(:ids)", new
                        {
                            ids = packageAssetIds.ToList(),
                        })).ToList();
                    foreach (var nestedAsset in otherModStatus)
                    {
                        safeModList.Add(nestedAsset);
                        assetIds.Add(nestedAsset.assetId);
                    }
                }
            }
            assetIds = assetIds.Where(c =>
            {
                var hasEntry = safeModList.Find(v => v.assetId == c);
                if (hasEntry == null) return false;
                if (!_wearableAssetTypes.Contains(hasEntry.assetType)) return false;
                if (hasEntry.moderationStatus != ModerationStatus.ReviewApproved) return false;
                return true;
            }).ToList();
            var goodAssetIds = new List<long>();
            foreach (var id in assetIds)
            {
                var ownResult = await db.QuerySingleOrDefaultAsync<UserAssetEntry>(
                    "SELECT asset_id as assetId, user_id as userId from user_asset WHERE user_id = :user_id AND asset_id = :asset_id LIMIT 1",
                    new
                    {
                        user_id = userId,
                        asset_id = id,
                    });
                if (ownResult != null)
                {
                    goodAssetIds.Add(id);
                }
            }

            assetIds = goodAssetIds;
        }

        return assetIds;
    }

	public class AvatarTypeEntry
	{
		public bool isR15 { get; set; }
	}

	public class ScaleEntry
	{
		public int height { get; set; }
		public int width { get; set; }
		public int head { get; set; }
		public int proportion { get; set; }
		public int bodyType { get; set; }
	}
	
	public async Task<AvatarTypeEntry> GetAvatarType(long userId)
	{
		var result = await db.QuerySingleOrDefaultAsync<AvatarTypeEntry>(
			"SELECT r15 as isR15 FROM user_avatar_type WHERE user_id = :user_id",
			new { user_id = userId });
		
		return result ?? new AvatarTypeEntry { isR15 = false };
	}

	public async Task<ScaleEntry> GetAvatarScales(long userId)
	{
		var result = await db.QuerySingleOrDefaultAsync<ScaleEntry>(
			"SELECT height, width, head, proportion, body_type as bodyType FROM user_avatar_type WHERE user_id = :user_id",
			new { user_id = userId });
		
		return result ?? new ScaleEntry 
		{ 
			height = 100, 
			width = 100, 
			head = 100, 
			proportion = 100, 
			bodyType = 100 
		};
	}

	public async Task UpdateScales(long userId, decimal height, decimal width, decimal head, decimal proportion, decimal bodyType)
	{
		var scales = new ScaleEntry
		{
			height = (int)(height * 100),
			width = (int)(width * 100),
			head = (int)(head * 100),
			proportion = (int)(proportion * 100),
			bodyType = (int)(bodyType * 100)
		};
		
		await db.ExecuteAsync(@"
			INSERT INTO user_avatar_type (user_id, height, width, head, proportion, body_type) 
			VALUES (:user_id, :height, :width, :head, :proportion, :body_type)
			ON CONFLICT (user_id) 
			DO UPDATE SET 
				height = :height, 
				width = :width, 
				head = :head, 
				proportion = :proportion, 
				body_type = :body_type",
		new 
		{
			user_id = userId,
			height = scales.height,
			width = scales.width,
			head = scales.head,
			proportion = scales.proportion,
			body_type = scales.bodyType
		});
	}
	
	public async Task UpdateAvatarType(long userId, int playerAvatarType)
	{
		var isR15 = playerAvatarType == 2;
		
		await db.ExecuteAsync(@"
			INSERT INTO user_avatar_type (user_id, r15) 
			VALUES (:user_id, :r15)
			ON CONFLICT (user_id) 
			DO UPDATE SET 
				r15 = :r15",
		new 
		{
			user_id = userId,
			r15 = isR15,
		});
	}

    public string GetAvatarHash(ColorEntry colors, IEnumerable<long> assetVersionIds, ScaleEntry scales, AvatarTypeEntry avatarType)
    {
        var assets = assetVersionIds.Distinct().ToList();
        assets.Sort((a, b) => a > b ? 1 : a == b ? 0 : -1);
        var str =
            $"avatar-hash-1.4:{string.Join(",", assets)}:{colors.headColorId},{colors.torsoColorId},{colors.leftArmColorId},{colors.rightArmColorId},{colors.leftLegColorId},{colors.rightLegColorId},{(avatarType.isR15 ? "R15" : "R6")},{scales.height},{scales.width},{scales.head},{scales.proportion},{scales.bodyType}";
        var hasher = SHA256.Create();
        var bits = hasher.ComputeHash(Encoding.UTF8.GetBytes(str));
        return Convert.ToHexString(bits).ToLower();
    }

    private async Task<IEnumerable<long>> MultiGetAssetVersionsFromAssetIds(IEnumerable<long> assetIds)
    {
        var ids = new List<long>();
        using var assets = ServiceProvider.GetOrCreate<AssetsService>(this);
        foreach (var id in assetIds.Distinct())
        {
            try
            {
                var latest = await assets.GetLatestAssetVersion(id);
                ids.Add(latest.assetVersionId);
            }
            catch (RecordNotFoundException)
            {
                Console.WriteLine($"asset {id} not found in asset_version, skipping");
            }
        }
        return ids.Distinct();
    }

    public async Task<string> UpdateUserAvatar(long userId, ColorEntry colors, IEnumerable<long> assetIds)
    {
        var idsList = assetIds.ToList();
        return await InTransaction(async (trx) =>
        {
            await UpdateAsync("user_avatar", "user_id", userId, new
            {
                head_color_id = colors.headColorId,
                torso_color_id = colors.torsoColorId,
                right_arm_color_id = colors.rightArmColorId,
                left_arm_color_id = colors.leftArmColorId,
                right_leg_color_id = colors.rightLegColorId,
                left_leg_color_id = colors.leftLegColorId,
            });
            await db.ExecuteAsync("DELETE FROM user_avatar_asset WHERE user_id = :user_id", new
            {
                user_id = userId,
            });
            foreach (var item in idsList)
            {
                await db.ExecuteAsync("INSERT INTO user_avatar_asset (user_id, asset_id) VALUES (:user_id, :asset_id)",
                    new
                    {
                        user_id = userId,
                        asset_id = item,
                    });
            }

            var assetVersions = await MultiGetAssetVersionsFromAssetIds(idsList);
			var avatarType = await GetAvatarType(userId);
			var scales = await GetAvatarScales(userId);
            return GetAvatarHash(colors, assetVersions, scales, avatarType);
        });
    }

    public async Task UpdateUserAvatarImages(long userId, string? headshotImage, string? thumbnailImage, string? thumbnail3dImage = null)
    {
        await db.ExecuteAsync(
            "UPDATE user_avatar SET thumbnail_url = :thumbnail_url, headshot_thumbnail_url = :headshot_url, thumbnail_3d_url = :thumbnail_3d_url WHERE user_id = :user_id",
            new
            {
                user_id = userId,
                thumbnail_url = thumbnailImage,
                headshot_url = headshotImage,
                thumbnail_3d_url = thumbnail3dImage,
            });
    }
	
	public async Task<string?> GetUserHeadshotUrl(long userId)
	{
		return await db.QuerySingleOrDefaultAsync<string?>(
			"SELECT headshot_thumbnail_url FROM user_avatar WHERE user_id = :user_id",
			new { user_id = userId }
		);
	}

    public async Task<IEnumerable<OutfitEntry>> GetUserOutfits(long userId, int limit, int offset)
    {
        return await db.QueryAsync<OutfitEntry>(
            "SELECT id, name, created_at as created FROM user_outfit WHERE user_id = :user_id ORDER BY id DESC LIMIT :limit OFFSET :offset",
            new
            {
                user_id = userId,
                limit = limit,
                offset = offset,
            });
    }

    public async Task<OutfitExtendedDetails> GetOutfitById(long outfitId)
    {
        var result = await db.QuerySingleOrDefaultAsync<OutfitAvatar>(
            "SELECT head_color_id as headColorId, torso_color_id as torsoColorId, left_arm_color_id as leftArmColorId, right_arm_color_id as rightArmColorId, left_leg_color_id as leftLegColorId, right_leg_color_id as rightLegColorId, user_id as userId FROM user_outfit WHERE id = :id",
            new
            {
                id = outfitId,
            });
        var assets =
            (await db.QueryAsync<AssetId>(
                "SELECT asset_id as assetId FROM user_outfit_asset WHERE outfit_id = :outfit_id",
                new {outfit_id = outfitId})).Select(c => c.assetId);

        return new OutfitExtendedDetails()
        {
            assetIds = assets,
            details = result,
        };
    }

    public async Task CreateOutfit(long userId, string name, string? thumbnailUrl, string? headshotUrl,
        OutfitExtendedDetails outfitDetails)
    {
        var existingOutfitCount = await db.QuerySingleOrDefaultAsync<Total>(
            "SELECT COUNT(*) as total FROM user_outfit WHERE user_id = :user_id", new
            {
                user_id = userId,
            });
        if (existingOutfitCount.total >= 100)
            throw new TooManyOutfitsException();
        if (string.IsNullOrEmpty(name) || string.IsNullOrWhiteSpace(name))
            throw new OutfitNameTooShortException();
        if (name.Length > 25)
            throw new OutfitNameTooLongException();
        if (string.IsNullOrWhiteSpace(thumbnailUrl) || string.IsNullOrWhiteSpace(headshotUrl))
            throw new NoImageUrlException();

        await InTransaction(async (trx) =>
        {
            var id = await InsertAsync("user_outfit", new
            {
                name = name,
                user_id = userId,
                head_color_id = outfitDetails.details.headColorId,
                torso_color_id = outfitDetails.details.torsoColorId,
                left_arm_color_id = outfitDetails.details.leftArmColorId,
                right_arm_color_id = outfitDetails.details.rightArmColorId,
                left_leg_color_id = outfitDetails.details.leftLegColorId,
                right_leg_color_id = outfitDetails.details.rightLegColorId,
                avatar_type = AvatarType.R6,
                headshot_thumbnail_url = headshotUrl,
                thumbnail_url = thumbnailUrl,
            });
            foreach (var assetId in outfitDetails.assetIds)
            {
                await InsertAsync("user_outfit_asset", "outfit_id", new
                {
                    outfit_id = id,
                    asset_id = assetId,
                });
            }

            return 0;
        });
    }

    public async Task UpdateOutfit(long outfitId, string name, string? thumbnailUrl, string? headshotUrl,
        OutfitExtendedDetails outfitDetails)
    {
        if (string.IsNullOrEmpty(name) || string.IsNullOrWhiteSpace(name))
            throw new OutfitNameTooShortException();
        if (name.Length > 25)
            throw new OutfitNameTooLongException();
        if (string.IsNullOrWhiteSpace(thumbnailUrl) || string.IsNullOrWhiteSpace(headshotUrl))
            throw new NoImageUrlException();
        await InTransaction(async (trx) =>
        {
            await UpdateAsync("user_outfit", outfitId, new
            {
                name = name,
                head_color_id = outfitDetails.details.headColorId,
                torso_color_id = outfitDetails.details.torsoColorId,
                left_arm_color_id = outfitDetails.details.leftArmColorId,
                right_arm_color_id = outfitDetails.details.rightArmColorId,
                left_leg_color_id = outfitDetails.details.leftLegColorId,
                right_leg_color_id = outfitDetails.details.rightLegColorId,
                avatar_type = AvatarType.R6,
                headshot_thumbnail_url = headshotUrl,
                thumbnail_url = thumbnailUrl,
            });
            await db.ExecuteAsync("DELETE FROM user_outfit_asset WHERE outfit_id = :id", new {id = outfitId});
            foreach (var assetId in outfitDetails.assetIds)
            {
                await InsertAsync("user_outfit_asset", "outfit_id", new
                {
                    outfit_id = outfitId,
                    asset_id = assetId,
                });
            }

            return 0;
        });
    }

    public async Task DeleteOutfit(long outfitId)
    {
        await InTransaction(async (t) =>
        {
            await db.ExecuteAsync("DELETE FROM user_outfit WHERE id = :id", new
            {
                id = outfitId,
            });
            await db.ExecuteAsync("DELETE FROM user_outfit_asset WHERE outfit_id = :outfit_id", new
            {
                outfit_id = outfitId,
            });
            return 0;
        });
    }

    private async Task<IEnumerable<long>> EnforceAssetLimits(long userId, IEnumerable<long> unknownAssetIds)
    {
        using var assets = ServiceProvider.GetOrCreate<AssetsService>(this);
        var assetIds = unknownAssetIds.ToList();
        if (assetIds.Count == 0) return assetIds;
        var details = (await assets.MultiGetInfoById(assetIds)).ToList();

        var seen = new Dictionary<Type, int>();
        var limits = new Dictionary<Type, int>
        {
            { Type.TeeShirt, 1 },
            { Type.Shirt, 1 },
            { Type.Pants, 1 },
            { Type.Face, 1 },
            { Type.Gear, 1 },
            { Type.Head, 1 },
            { Type.Torso, 1 },
            { Type.LeftArm, 1 },
            { Type.RightArm, 1 },
            { Type.LeftLeg, 1 },
            { Type.RightLeg, 1 },
            { Type.Hat, 6 },
            { Type.FrontAccessory, 6 },
            { Type.BackAccessory, 6 },
            { Type.HairAccessory, 6 },
            { Type.NeckAccessory, 6 },
            { Type.ShoulderAccessory, 6 },
            { Type.WaistAccessory, 6 },
            { Type.FaceAccessory, 6 },
            { Type.ClimbAnimation, 1 },
            { Type.FallAnimation, 1 },
            { Type.IdleAnimation, 1 },
            { Type.JumpAnimation, 1 },
            { Type.RunAnimation, 1 },
            { Type.SwimAnimation, 1 },
            { Type.WalkAnimation, 1 },
            { Type.EmoteAnimation, 8 },
        };

        var accessoryTypes = new HashSet<Type>
        {
            Type.Hat, Type.FrontAccessory, Type.BackAccessory,
            Type.HairAccessory, Type.NeckAccessory, Type.ShoulderAccessory,
            Type.WaistAccessory, Type.FaceAccessory,
        };

        var animationTypes = new HashSet<Type>
        {
            Type.ClimbAnimation, Type.FallAnimation, Type.IdleAnimation,
            Type.JumpAnimation, Type.RunAnimation, Type.SwimAnimation, Type.WalkAnimation,
        };

        var result = new List<long>();
        var accessoryCount = 0;
        var animationCount = 0;

        foreach (var item in details)
        {
            var type = item.assetType;

            if (!limits.ContainsKey(type))
                continue;

            if (accessoryTypes.Contains(type))
            {
                if (accessoryCount >= 6) continue;
                accessoryCount++;
                result.Add(item.id);
                continue;
            }

            if (animationTypes.Contains(type))
            {
                if (animationCount >= 7) continue;
                animationCount++;
                result.Add(item.id);
                continue;
            }

            seen.TryGetValue(type, out var count);
            if (count >= limits[type]) continue;
            seen[type] = count + 1;
            result.Add(item.id);
        }

        return result;
    }

    private bool IsColorValid(int color)
    {
        var allColors = Roblox.Models.Avatar.AvatarMetadata.GetColors();
        foreach (var item in allColors)
        {
            if (item.brickColorId == color)
            {
                return true;
            }
        }

        return false;
    }

    public bool AreColorsOk(ColorEntry colors)
    {
        if (!IsColorValid(colors.headColorId)) return false;
        if (!IsColorValid(colors.torsoColorId)) return false;
        if (!IsColorValid(colors.leftArmColorId)) return false;
        if (!IsColorValid(colors.rightArmColorId)) return false;
        if (!IsColorValid(colors.leftLegColorId)) return false;
        if (!IsColorValid(colors.rightLegColorId)) return false;
        return true;
    }

    public string GetAvatarRedLockKey(long userId)
    {
        return $"update avatar web v1 {userId}";
    }

    public async Task RedrawAvatar(long userId, IEnumerable<long>? newAssetIds = null, ColorEntry? colors = null,
        AvatarType? avatarType = null, bool forceRedraw = false, bool ignoreLock = true, bool enforceDefaultShirt = false, bool enforceDefaultPants = true)
    {
        using var assets = ServiceProvider.GetOrCreate<AssetsService>();

        avatarType ??= AvatarType.R6;

        await using var redLock =
            await Cache.redLock.CreateLockAsync(GetAvatarRedLockKey(userId), TimeSpan.FromSeconds(5));
        if (!redLock.IsAcquired && !ignoreLock) throw new LockNotAcquiredException();

        var assetIds = newAssetIds?.ToList();

        assetIds ??= (await GetWornAssets(userId)).ToList();
        colors ??= await GetAvatarColors(userId);

        if (!AreColorsOk(colors))
            throw new RobloxException(400, 0, "Colors are invalid");

        if (assetIds.Count != 0)
        {
            assetIds = (await FilterAssetsForRender(userId, assetIds)).ToList();
        }

        assetIds = (await EnforceAssetLimits(userId, assetIds)).ToList();

        var (hasShirt, hasPants) = await GetUserClothingStatus(userId);
        var isNaked = IsBodyNaked(colors);

        if (!hasShirt && enforceDefaultShirt) 
            assetIds.Add(DefaultShirtAssetId);

        if (!hasPants && isNaked && enforceDefaultPants) 
            assetIds.Add(DefaultPantsAssetId);

        var avatarHash = await UpdateUserAvatar(userId, colors, assetIds);
        var thumbnailUrl = $"/images/thumbnails/{avatarHash}_thumbnail.png";
        var headshotUrl = $"/images/thumbnails/{avatarHash}_headshot.png";
        var thumbnail3dUrl = $"/images/thumbnails/{avatarHash}_thumbnail3d.json";
        
        if (!forceRedraw)
        {
            if (File.Exists(Configuration.PublicDirectory + thumbnailUrl) &&
                File.Exists(Configuration.PublicDirectory + headshotUrl) &&
                File.Exists(Configuration.PublicDirectory + thumbnail3dUrl))
            {
                await UpdateUserAvatarImages(userId, headshotUrl, thumbnailUrl, thumbnail3dUrl);
                return;
            }
        }

        await UpdateUserAvatarImages(userId, null, null, null);
        var extendedAssetDetails = await assets.MultiGetInfoById(assetIds);
        var request = new Roblox.Rendering.AvatarData()
        {
            userId = userId,
            assets = extendedAssetDetails.Select(c => new AvatarAssetEntry()
            {
                id = c.id,
                assetType = new AvatarAssetTypeEntry()
                {
                    id = (int) c.assetType,
                },
            }),
            bodyColors = new AvatarBodyColors()
            {
                headColorId = colors.headColorId,
                torsoColorId = colors.torsoColorId,
                leftArmColorId = colors.leftArmColorId,
                rightArmColorId = colors.rightArmColorId,
                leftLegColorId = colors.leftLegColorId,
                rightLegColorId = colors.rightLegColorId,
            },
            playerAvatarType = "R6",
        };
		using var cancellation = new CancellationTokenSource();
		cancellation.CancelAfter(TimeSpan.FromSeconds(30));
		
		var thumbnailStream = await CommandHandler.RequestPlayerThumbnail(request, cancellation.Token);
		
		await using (var fileStream = File.Create(Configuration.PublicDirectory + thumbnailUrl))
		{
			thumbnailStream.Seek(0, SeekOrigin.Begin);
			await thumbnailStream.CopyToAsync(fileStream);
		}
		
		await UpdateUserAvatarImages(userId, null, thumbnailUrl, null);
		
		var headshotStream = await CommandHandler.RequestPlayerHeadshot(request, cancellation.Token);

		await using (var fileStream = File.Create(Configuration.PublicDirectory + headshotUrl))
		{
			headshotStream.Seek(0, SeekOrigin.Begin);
			await headshotStream.CopyToAsync(fileStream);
		}
		
		await UpdateUserAvatarImages(userId, headshotUrl, thumbnailUrl, null);

        var thumbnail3dStream = await CommandHandler.RequestPlayerThumbnail3D(userId, cancellation.Token);
        await Save3DRender(userId, avatarHash, thumbnail3dStream);
	}

    private async Task Save3DRender(long userId, string avatarHash, Stream thumbnail3dStream)
    {
        string thumbnail3dUrl = $"/images/thumbnails/{avatarHash}_thumbnail3d.json";
        try
        {
            using var reader = new StreamReader(thumbnail3dStream);
            var thumbnail3DResult = await reader.ReadToEndAsync();
            var thumbJson = JsonSerializer.Deserialize<Roblox.Dto.Assets.Thumbnail3DRender>(thumbnail3DResult);
            if (thumbJson is null)
                throw new Exception("Renderer returned incorrect 3D thumbnail.");

            string? obj = null;
            string? mtl = null;
            var textures = new List<string>();
            
            using (SHA256 hasher = SHA256.Create())
            {
                string threeDFolder = Path.Combine(Configuration.ThumbnailsDirectory, "3d");
                if (!Directory.Exists(threeDFolder))
                {
                    Directory.CreateDirectory(threeDFolder);
                }

                if (thumbJson.files.TryGetValue("scene.obj", out var sceneObj))
                {
                    byte[] objData = Convert.FromBase64String(sceneObj.content);
                    string objHash = Convert.ToHexString(hasher.ComputeHash(objData)).ToLower();
                    string objFileName = objHash;
                    string objDiskPath = Path.Combine(threeDFolder, objFileName);
                    string objUrlPath = $"/images/thumbnails/3d/{objFileName}";

                    obj = objUrlPath;

                    if (!File.Exists(objDiskPath))
                    {
                        await File.WriteAllBytesAsync(objDiskPath, objData);
                    }
                }

                if (thumbJson.files.TryGetValue("scene.mtl", out var sceneMtl))
                {
                    byte[] mtlData = Convert.FromBase64String(sceneMtl.content);
                    string mtlHash = Convert.ToHexString(hasher.ComputeHash(mtlData)).ToLower();
                    string mtlFileName = mtlHash;
                    string mtlDiskPath = Path.Combine(threeDFolder, mtlFileName);
                    string mtlUrlPath = $"/images/thumbnails/3d/{mtlFileName}";

                    mtl = mtlUrlPath;

                    if (!File.Exists(mtlDiskPath))
                    {
                        await File.WriteAllBytesAsync(mtlDiskPath, mtlData);
                    }
                }

                foreach (var (fileName, fileValue) in thumbJson.files)
                {
                    if (!fileName.Contains("tex.png", StringComparison.OrdinalIgnoreCase))
                        continue;

                    byte[] textureData = Convert.FromBase64String(fileValue.content);
                    string textureHash = Convert.ToHexString(hasher.ComputeHash(textureData)).ToLower();
                    string baseName = fileName.Replace(".png", "", StringComparison.OrdinalIgnoreCase);
                    string textureFileName = $"{textureHash}_tex_{baseName}";
                    string textureDiskPath = Path.Combine(threeDFolder, textureFileName);
                    string textureUrlPath = $"/images/thumbnails/3d/{textureFileName}";

                    if (!File.Exists(textureDiskPath))
                    {
                        await File.WriteAllBytesAsync(textureDiskPath, textureData);
                    }

                    textures.Add(textureUrlPath);
                }
            }

            var thumbnail3DJsonObject = new
            {
                userId,
                thumbJson.camera,
                aabb = new
                {
                    thumbJson.AABB.min,
                    thumbJson.AABB.max
                },
                mtl,
                obj,
                textures = textures.Count > 0 ? textures.ToArray() : null
            };

            string jsonOutputPath = Path.Combine(Configuration.ThumbnailsDirectory, $"{avatarHash}_thumbnail3d.json");
            string jsonContent = JsonSerializer.Serialize(thumbnail3DJsonObject);
            await File.WriteAllBytesAsync(jsonOutputPath, Encoding.UTF8.GetBytes(jsonContent));

            var headshotUrl = $"/images/thumbnails/{avatarHash}_headshot.png";
            var thumbnailUrl = $"/images/thumbnails/{avatarHash}_thumbnail.png";
            await UpdateUserAvatarImages(userId, headshotUrl, thumbnailUrl, thumbnail3dUrl);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[AvatarService]: Failed to save 3D thumbnail: {e}");
        }
    }
	
	public async Task RedrawAvatarR15(long userId, IEnumerable<long>? newAssetIds = null, ColorEntry? colors = null, 
		string? currentThumbnail = null, string? currentHeadshot = null, bool forceRedraw = false, bool ignoreLock = true, bool enforceDefaultShirt = false, bool enforceDefaultPants = true)
    {
        using var assets = ServiceProvider.GetOrCreate<AssetsService>();

        await using var redLock =
            await Cache.redLock.CreateLockAsync(GetAvatarRedLockKey(userId), TimeSpan.FromSeconds(5));
        if (!redLock.IsAcquired && !ignoreLock) throw new LockNotAcquiredException();

        var assetIds = newAssetIds?.ToList();

        assetIds ??= (await GetWornAssets(userId)).ToList();
        colors ??= await GetAvatarColors(userId);

        if (!AreColorsOk(colors))
            throw new RobloxException(400, 0, "Colors are invalid");

        if (assetIds.Count != 0)
        {
            assetIds = (await FilterAssetsForRender(userId, assetIds)).ToList();
        }

        assetIds = (await EnforceAssetLimits(userId, assetIds)).ToList();

        var (hasShirt, hasPants) = await GetUserClothingStatus(userId);
        var isNaked = IsBodyNaked(colors);

        if (!hasShirt && enforceDefaultShirt) 
            assetIds.Add(DefaultShirtAssetId);

        if (!hasPants && isNaked && enforceDefaultPants) 
            assetIds.Add(DefaultPantsAssetId);

        var avatarHash = await UpdateUserAvatar(userId, colors, assetIds);
        var thumbnailUrl = $"/images/thumbnails/{avatarHash}_thumbnail.png";
        var headshotUrl = $"/images/thumbnails/{avatarHash}_headshot.png";
        var thumbnail3dUrl = $"/images/thumbnails/{avatarHash}_thumbnail3d.json";

        if (!forceRedraw)
        {
            if (File.Exists(Configuration.PublicDirectory + thumbnailUrl) &&
                File.Exists(Configuration.PublicDirectory + headshotUrl) &&
                File.Exists(Configuration.PublicDirectory + thumbnail3dUrl))
            {
                await UpdateUserAvatarImages(userId, headshotUrl, thumbnailUrl, thumbnail3dUrl);
                return;
            }
        }

        await UpdateUserAvatarImages(userId, null, null, null);
        var extendedAssetDetails = await assets.MultiGetInfoById(assetIds);
		using var cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(30));

		var Thumb = CommandHandler.RequestPlayerThumbnailR15(userId, cancellation.Token);
		var Headshot = CommandHandler.RequestPlayerHeadshot(new Roblox.Rendering.AvatarData()
		{
			userId = userId,
			assets = extendedAssetDetails.Select(c => new AvatarAssetEntry()
			{
				id = c.id,
				assetType = new AvatarAssetTypeEntry() { id = (int)c.assetType }
			}),
			bodyColors = new AvatarBodyColors()
			{
				headColorId = colors.headColorId,
				torsoColorId = colors.torsoColorId,
				leftArmColorId = colors.leftArmColorId,
				rightArmColorId = colors.rightArmColorId,
				leftLegColorId = colors.leftLegColorId,
				rightLegColorId = colors.rightLegColorId,
			},
			playerAvatarType = "R6"
		}, cancellation.Token);

		await Task.WhenAll(Thumb, Headshot);

		await using (var fileStream = File.Create(Configuration.PublicDirectory + thumbnailUrl))
		{
			var thumbStream = await Thumb;
			thumbStream.Seek(0, SeekOrigin.Begin);
			await thumbStream.CopyToAsync(fileStream, cancellation.Token);
		}
        
		await UpdateUserAvatarImages(userId, null, thumbnailUrl, null);

		await using (var fileStream = File.Create(Configuration.PublicDirectory + headshotUrl))
		{
			var headStream = await Headshot;
			headStream.Seek(0, SeekOrigin.Begin);
			await headStream.CopyToAsync(fileStream, cancellation.Token);
		}

		await UpdateUserAvatarImages(userId, headshotUrl, thumbnailUrl, null);

        var thumbnail3dStream = await CommandHandler.RequestPlayerThumbnail3D(userId, cancellation.Token);
        await Save3DRender(userId, avatarHash, thumbnail3dStream);
	}

    public async Task Update3DRenderModified(long userId, string avatarHash)
    {
        var thumbnail3DUrl = $"/images/thumbnails/{avatarHash}_thumbnail3d.json";
        try {
            var thumbnail3DJson = await File.ReadAllTextAsync(Configuration.PublicDirectory + thumbnail3DUrl);
            var thumbJson = System.Text.Json.JsonSerializer.Deserialize<Roblox.Dto.Assets.Thumbnail3DRendered>(thumbnail3DJson);
            if (thumbJson is null)
                throw new Exception("Renderer returned incorrect 3D thumbnail.");

            var objPath = Configuration.ThumbnailsDirectory + thumbJson.obj.Replace("/images/thumbnails/", "");
            if (File.Exists(objPath)) {
                File.SetLastWriteTime(objPath, DateTime.Now);
            }

            var mtlPath = Configuration.ThumbnailsDirectory + thumbJson.mtl.Replace("/images/thumbnails/", "");
            if (File.Exists(mtlPath)) {
                File.SetLastWriteTime(mtlPath, DateTime.Now);
            }

            foreach (var filePath2 in thumbJson.textures) {
                var filePath = Configuration.ThumbnailsDirectory + filePath2.Replace("/images/thumbnails/", "");
                if (File.Exists(filePath)) {
                    File.SetLastWriteTime(filePath, DateTime.Now);
                }
            }
        }
        catch (Exception e) {
            Console.WriteLine($"[AvatarService] Couldn't set last updated for 3D Render for AvatarHash {avatarHash}. Error: {e.Message}");
            if (e.Message.StartsWith("Could not find file")) {
                Console.WriteLine("[AvatarService] Redrawing avatar due to missing 3D render files...");
                await RedrawAvatar(userId);
            }
        }
    }

    public bool IsThreadSafe()
    {
        return true;
    }

    public bool IsReusable()
    {
        return false;
    }
}
