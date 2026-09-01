namespace Roblox.Models.Donate
{
	public class DonateRedemptionEntry
	{
		public int id { get; set; }
		public int donate_code_id { get; set; }
		public long user_id { get; set; }
		public int price_usd { get; set; }
		public DateTime redeemed_at { get; set; }
		public string username { get; set; }
	}

	public class CreateDonateCodeReq
	{
		public string Code { get; set; }
		public int PriceUsd { get; set; }
		public int MaxUses { get; set; }
		public bool IsActive { get; set; }
	}

	public class DeleteDonateCodeReq
	{
		public int DonateCodeId { get; set; }
	}

	public class ToggleDonateCodeReq
	{
		public int DonateCodeId { get; set; }
		public bool IsActive { get; set; }
	}

	public class DonateCodeEntry
	{
		public int id { get; set; }
		public string code { get; set; }
		public int price_usd { get; set; }
		public DateTime created_at { get; set; }
		public DateTime? expires_at { get; set; }
		public int? maxuses { get; set; }
		public int? uses { get; set; }
		public bool active { get; set; }
	}

	public class DonateTierEntry
	{
		public int id { get; set; }
		public int price_usd { get; set; }
		public string name { get; set; }
		public long asset_id { get; set; }
		public int robux { get; set; }
		public bool includes_all_items { get; set; }
		public bool active { get; set; }
		public DateTime created_at { get; set; }
	}

	public class CreateDonateTierReq
	{
		public int PriceUsd { get; set; }
		public string Name { get; set; }
		public long AssetId { get; set; }
		public int Robux { get; set; }
		public bool IncludesAllItems { get; set; }
	}

	public class UpdateDonateTierReq
	{
		public int TierId { get; set; }
		public int PriceUsd { get; set; }
		public string Name { get; set; }
		public long AssetId { get; set; }
		public int Robux { get; set; }
		public bool IncludesAllItems { get; set; }
	}

	public class DeleteDonateTierReq
	{
		public int TierId { get; set; }
	}
}
