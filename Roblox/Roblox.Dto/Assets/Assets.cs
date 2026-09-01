using System.Text.Json.Serialization;
using Roblox.Models.Assets;
using Type = Roblox.Models.Assets.Type;

namespace Roblox.Dto.Assets
{
    public class AssetId
    {
        public long assetId { get; set; }
    }

    public class AssetIdWithType
    {
        public long assetId { get; set; }
        public Models.Assets.Type assetType { get; set; }
    }

    public class CreateResponse
    {
        public long assetId { get; set; }
        public long assetVersionId { get; set; }
        public ModerationStatus moderationStatus { get; set; }
    }

    public class CreatePlaceResponse
    {
        public long placeId { get; set; }
    }

    public class ProductEntry
    {
        public string name { get; set; }
		public string description { get; set; }
        public bool isForSale { get; set; }
        public bool isLimited { get; set; }
        public bool isLimitedUnique { get; set; }
		public bool isVisible { get; set; }
        public int? priceRobux { get; set; }
        public int? priceTickets { get; set; }
        public int? serialCount { get; set; }
        public DateTime? offsaleAt { get; set; }
        public long? recentAveragePrice { get; set; }
    }
	
	public class AssetVisibility
	{
		public bool visible { get; set; }
	}

    public class MultiGetEntryLowestSeller
    {
        public long userId { get; set; }
        public string username { get; set; }
        public long userAssetId { get; set; }
        public long price { get; set; }
        public long assetId { get; set; }
    }

    public class MultiGetEntryInternal
    {
        public long id { get; set; }
        public Models.Assets.Type assetType { get; set; }
        public string name { get; set; }
        public string? description { get; set; }
        
        public Genre genre { get; set; }
        
        public CreatorType creatorType { get; set; }
        public long creatorTargetId { get; set; }
        public DateTime? offsaleDeadline { get; set; }
        public bool isForSale { get; set; }
        public int? priceRobux { get; set; }
        public int? priceTickets { get; set; }
        public bool isLimited { get; set; }
        public bool isLimitedUnique { get; set; }
        public int serialCount { get; set; }
        public int saleCount { get; set; }
        public long favoriteCount { get; set; }
        public string groupName { get; set; }
        public string username { get; set; }
        public bool is18Plus { get; set; }
        public bool verified { get; set; }
        public DateTime createdAt { get; set; }
        public DateTime updatedAt { get; set; }
        public ModerationStatus moderationStatus { get; set; }
        public long? recentAveragePrice { get; set; }
        public MultiGetEntryLowestSeller? lowestSellerData { get; set; }
    }

    public class MultiGetEntry
    {
        public MultiGetEntry()
        {
            
        }

        public MultiGetEntry(MultiGetEntryInternal internalEntry)
        {
            id = internalEntry.id;
            assetType = internalEntry.assetType;
            name = internalEntry.name;
            description = internalEntry.description;
            genres = new[] { internalEntry.genre.ToString() };
            creatorType = internalEntry.creatorType;
            creatorTargetId = internalEntry.creatorTargetId;
            recentAveragePrice = internalEntry.recentAveragePrice;
            if (internalEntry.creatorType == CreatorType.Group)
            {
                creatorName = internalEntry.groupName;
            }
            else
            {
                creatorName = internalEntry.username;
            }
            
            offsaleDeadline = internalEntry.offsaleDeadline;
            is18Plus = internalEntry.is18Plus;
            creatorHasVerifiedBadge = internalEntry.verified;
            moderationStatus = internalEntry.moderationStatus;
            var restrictions = new List<string>();
            saleCount = internalEntry.saleCount;
            purchaseCount = internalEntry.saleCount;
            favoriteCount = internalEntry.favoriteCount;
            isForSale = internalEntry.isForSale && (internalEntry.priceRobux != null || internalEntry.priceTickets != null);
            price = internalEntry.priceRobux;
            priceTickets = internalEntry.priceTickets;
            createdAt = internalEntry.createdAt;
            updatedAt = internalEntry.updatedAt;
            lowestSellerData = internalEntry.lowestSellerData;
            expectedSellerId = creatorTargetId;
            
            // Special stuff
            serialCount = internalEntry.serialCount;
            if (internalEntry.lowestSellerData != null)
            {
                lowestPrice = internalEntry.lowestSellerData.price;
                expectedSellerId = internalEntry.lowestSellerData.userId;
            }
            if (internalEntry.isLimited && !internalEntry.isLimitedUnique)
            {
                restrictions.Add("Limited");
            }
            else if (internalEntry.isLimitedUnique)
            {
                restrictions.Add("LimitedUnique");
            }
            // unitsAvailableForConsumption can appear on both Limited AND LimitedU items.
            if (internalEntry.serialCount != 0)
            {
                var available = internalEntry.serialCount - internalEntry.saleCount;
                if (available <= 0)
                {
                    isForSale = false;
                }
                else
                {
                    unitsAvailableForConsumption = available;
                }
            }

            itemRestrictions = restrictions;
            itemStatus = Array.Empty<string>();
            saleLocationType = "ShopAndAllExperiences";
            genres = new List<string> { internalEntry.genre.ToString() };
        }
        public long id { get; set; }
        [JsonConverter(typeof(JsonIntEnumConverter<Type>))]
        public Models.Assets.Type assetType { get; set; }
        public string name { get; set; }
        public string? description { get; set; }
        
        public IEnumerable<string> genres { get; set; }
        public CreatorType creatorType { get; set; }
        public long creatorTargetId { get; set; }
        public string creatorName { get; set; }
        public long? recentAveragePrice { get; set; }
        public DateTime? offsaleDeadline { get; set; }
        public IEnumerable<string> itemRestrictions { get; set; }
        public IEnumerable<string> itemStatus { get; set; }
        public int saleCount { get; set; }
        public int purchaseCount { get; set; }
        public string itemType { get; set; } = "Asset";
        public bool isForRent { get; set; } = false;
        public long expectedSellerId { get; set; } = 0;
        public bool owned { get; set; } = false;
        public bool isPurchasable => isForSale;
        public IEnumerable<object> bundledItems { get; set; } = Array.Empty<object>();
        public long? lowestResalePrice => lowestPrice;
        public bool hasResellers => lowestSellerData != null;
        public string itemCreatedUtc => createdAt.ToString("yyyy-MM-ddTHH:mm:ssK");
        public string? collectibleItemId { get; set; } = null;
        public int totalQuantity => serialCount ?? 0;
        public long? favoriteCount { get; set; } = null;
        public long productId => id;
        public bool creatorHasVerifiedBadge { get; set; }
        public bool isForSale { get; set; }
        public long? price { get; set; }
        public long? priceTickets { get; set; }
        public long? lowestPrice { get; set; } = null;
        public string saleLocationType { get; set; }
        public long? premiumPrice { get; set; } = null;
        public object? premiumPricing { get; set; } = null;
        public string? priceStatus
        {
            get
            {
                if (price == 0 || priceTickets == 0) return "Free";
                if (isForSale) return "ForSale";
                if (itemRestrictions != null &&
                    (itemRestrictions.Contains("Limited") || itemRestrictions.Contains("LimitedUnique")))
                {
                    if (lowestSellerData == null) return "No Resellers";
                }
                return "Offsale";
            }
        }
        
        public MultiGetEntryLowestSeller? lowestSellerData { get; set; }
        public int? unitsAvailableForConsumption { get; set; } = null;
        public int? serialCount { get; set; } = null;
        public bool is18Plus { get; set; }
        public ModerationStatus moderationStatus { get; set; }
        public DateTime createdAt { get; set; }
        public DateTime updatedAt { get; set; }
    }
	
	public class SetRapReq
	{
		public long assetId { get; set; }
		public long rap { get; set; }
	}
    
    public class RecommendedItemEntry
    {
        public long assetId { get; set; }
        public string name { get; set; }
        public int? price { get; set; }
        public long creatorId { get; set; }
        public CreatorType creatorType { get; set; }
        public string creatorName { get; set; }
        public bool isForSale { get; set; }
        public bool isLimited { get; set; }
        public bool isLimitedUnique { get; set; }
        public DateTime? offsaleDeadline { get; set; }
    }

    public class MultiGetAssetDeveloperDetailsDb
    {
        public long assetId { get; set; }
        public int typeId { get; set; }
        public Genre genre { get; set; }
        public CreatorType creatorType { get; set; }
        public long creatorId { get; set; }
        public string name { get; set; }
        public string description { get; set; }
        public DateTime created { get; set; }
        public DateTime updated { get; set; }
        public bool enableComments { get; set; }
        public ModerationStatus moderationStatus { get; set; }
        public bool is18Plus { get; set; }
		public long? placeId { get; set; }
		public string placeName { get; set; }
		public long? badgePlaceId { get; set; }
		public long? passPlaceId { get; set; }
    }

    public class CreatorEntry
    {
        public CreatorType type { get; set; }
        public int typeId => (int) type;
        public long targetId { get; set; }
    }
    
    public class MultiGetAssetDeveloperDetails
    {
        public long assetId { get; set; }
        public int typeId { get; set; }
        public IEnumerable<Genre> genres { get; set; }
        public string name { get; set; }
        public string description { get; set; }
        public CreatorEntry creator { get; set; }
        public DateTime created { get; set; }
        public DateTime updated { get; set; }
        public ModerationStatus moderationStatus { get; set; }
        public bool is18Plus { get; set; }
        public bool enableComments { get; set; }
        public bool isCopyingAllowed { get; set; }
        public bool isPublicDomainEnabled { get; set; }
        public bool isVersioningEnabled { get; set; }
        public bool isArchivable { get; set; }
        public bool canHaveThumbnail { get; set; }
		public long? placeId { get; set; }
		public string placeName { get; set; }

        public MultiGetAssetDeveloperDetails(MultiGetAssetDeveloperDetailsDb dbResult)
        {
            assetId = dbResult.assetId;
            typeId = dbResult.typeId;
            genres = new Genre[] {dbResult.genre};
            name = dbResult.name;
            description = dbResult.description;
            creator = new CreatorEntry()
            {
                type = dbResult.creatorType,
                targetId = dbResult.creatorId,
            };
            created = dbResult.created;
            updated = dbResult.updated;
            enableComments = dbResult.enableComments;
            moderationStatus = dbResult.moderationStatus;
            is18Plus = dbResult.is18Plus;
			placeId = dbResult.placeId;
			placeName = dbResult.placeName;
        }
    }
    
    public class CreationEntry
    {
        public long assetId { get; set; }
        public string name { get; set; }
    }

    public class IsAsset18Plus
    {
        public bool is18Plus { get; set; }
    }

    public class StaffAssetCommentEntry
    {
        public long id { get; set; }
        public long assetId { get; set; }
        public string name { get; set; }
        public long userId { get; set; }
        public string username { get; set; }
        public string comment { get; set; }
        public DateTime createdAt { get; set; }
    }

    public class Vector3
    {
        public double x { get; set; }
        public double y { get; set; }
        public double z { get; set; }
    }

    public class Camera
    {
        public Vector3 position { get; set; }
        public Vector3 direction { get; set; }
        public double fov { get; set; }
    }

    public class AABB
    {
        public Vector3 min { get; set; }
        public Vector3 max { get; set; }
    }

    public class FileContent
    {
        public string content { get; set; }
    }

    public class Thumbnail3DRender
    {
        public Camera camera { get; set; }
        public AABB AABB { get; set; }

        [JsonPropertyName("files")]
        public Dictionary<string, FileContent> files { get; set; }
    }
    
    public class Thumbnail3DRendered
    {
        public Camera camera { get; set; }
        public AABB aabb { get; set; }

        public string mtl { get; set; }
        public string obj { get; set; }
        public string[] textures { get; set; }
    }
}