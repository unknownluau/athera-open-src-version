using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Roblox.Models;
using Roblox.Models.Assets;
using Roblox.Dto.Assets;
using Type = Roblox.Models.Assets.Type;

namespace Roblox.Website.WebsiteModels.Admin.MigrateUGC;

public class MigrateAssetRequest
{
	[Required]
	public string rbxURL { get; set; }

	[Required]
	public IFormFile OBJ { get; set; }
}

public class RBXAssetDetails
{
	public long AssetId { get; set; }
	public string Name { get; set; }
	public string Description { get; set; }
	public int AssetTypeId { get; set; }
	public Creator Creator { get; set; }
	public bool IsLimited { get; set; }
	public bool IsLimitedUnique { get; set; }
}

public class Creator
{
	public long Id { get; set; }
	public string Name { get; set; }
	public string CreatorType { get; set; }
	public long CreatorTargetId { get; set; }
}

public class MigrationResponse
{
	public bool success { get; set; }
	public long meshId { get; set; }
	public string message { get; set; }
}

public class UploadCustomAssetReq
{
    [Required]
    public IFormFile RBXM { get; set; }
    
    [Required]
    public IFormFile OBJ { get; set; }
    
    [Required]
    public string Name { get; set; }
    public string? Description { get; set; } = "No description provided.";
    
    [Required]
    public Type AssetType { get; set; }
}