namespace Roblox.Models.Thumbnails;

public enum ThumbnailState
{
    Error = 1,
    Completed,
    InReview,
    Pending,
    Blocked,
    TemporarilyUnavailable
    // 'Error', 'Completed', 'InReview', 'Pending', 'Blocked', 'TemporarilyUnavailable'],
}

public class ChangeThumbnail
{
    public long assetId { get; set; }
    public long actorId { get; set; }
    public string contentUrl { get; set; }
    public DateTime createdAt { get; set; }
}