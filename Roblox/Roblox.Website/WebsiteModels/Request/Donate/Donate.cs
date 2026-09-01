namespace Roblox.Website.WebsiteModels.Donate;

public class RedeemDonateCodeReq
{
	public string code { get; set; }
}

public class UpdateDonateSettingsReq
{
	public bool CountdownEnabled { get; set; }
	public DateTime? CountdownEndDate { get; set; }
}

public class DonateCode
{
	public int id { get; set; }
	public string code { get; set; }
	public int price_usd { get; set; }
	public long? asset_id { get; set; }
	public int? robux { get; set; }
	public bool includes_all_items { get; set; }
	public DateTime created_at { get; set; }
	public DateTime? expires_at { get; set; }
	public int? maxuses { get; set; }
	public int? uses { get; set; }
	public bool active { get; set; }
}

public class DonateTier
{
	public int id { get; set; }
	public int price_usd { get; set; }
	public string name { get; set; }
	public long asset_id { get; set; }
	public int robux { get; set; }
	public bool includes_all_items { get; set; }
	public bool active { get; set; }
}
