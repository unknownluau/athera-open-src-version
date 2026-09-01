namespace Roblox.Website.WebsiteModels.Session.IP;

public class IPHubRes
{
    public string ip { get; set; }
    public string countryCode { get; set; }
    public string countryName { get; set; }
    public int asn { get; set; }
    public string isp { get; set; }
    public int block { get; set; }
    public string hostname { get; set; }
}

public class IPCacheEntry
{
    public string hashedIP { get; set; }
    public DateTime LastUpdated { get; set; }
    public int blockstats { get; set; }
}