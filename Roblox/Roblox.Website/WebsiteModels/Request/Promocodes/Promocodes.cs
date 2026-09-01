namespace Roblox.Website.WebsiteModels.Promocodes;

public class PromoCodeEntry
{
	public int id { get; set; }
	public string code { get; set; }
	public long? asset_id { get; set; }
	public int? robux { get; set; }
	public DateTime created_at { get; set; }
	public DateTime? expires_at { get; set; }
	public int? maxuses { get; set; }
	public int? uses { get; set; }
	public bool active { get; set; }
}