namespace Roblox.Models.Promocodes
{
    public class PCResult
    {
        public bool success { get; set; }
        public string message { get; set; }
        public long? assetId { get; set; }
        public string name { get; set; }
        public int? robux { get; set; }
        public bool showResult { get; set; } = false;
    }
    
    public class ErrorResponse
    {
        public List<Error> errors { get; set; }
    }
    
    public class Error
    {
        public int code { get; set; }
        public string message { get; set; }
    }
	
	// admin API promocode shit
	public class DeletePC
	{
		public int promocodeID { get; set; }
	}

	public class TogPC
	{
		public int promocodeID { get; set; }
		public bool isActive { get; set; }
	}

	public class CreatePCReq
	{
		public string Code { get; set; }
		public int? AssetId { get; set; }
		public int? Robux { get; set; }
		public int? ExpiresInSeconds { get; set; }
		public int? ExpiresInMinutes { get; set; }
		public int? ExpiresInHours { get; set; }
		public int? ExpiresInDays { get; set; }
		public int MaxUses { get; set; }
		public bool IsActive { get; set; }
	}

	public class PCEntry
	{
		public int id { get; set; }
		public string code { get; set; }
		public long? asset_id { get; set; }
		public int? robux { get; set; }
		public DateTime created_at { get; set; }
		public DateTime? expires_at { get; set; }
		public int maxuses { get; set; }
		public int uses { get; set; }
		public bool active { get; set; }
	}

	public class PCREntry
	{
		public int id { get; set; }
		public long user_id { get; set; }
		public DateTime redeemed_at { get; set; }
		public long? asset_id { get; set; }
		public int? robux { get; set; }
		public string username { get; set; }
	}
}

