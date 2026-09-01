using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Roblox.Dto.Admin;
using Roblox.Logging;
using Roblox.Models.Assets;
using Roblox.Services.Exceptions;
using Roblox.Website.Filters;
using Type = Roblox.Models.Assets.Type;

namespace Roblox.Website.Controllers;

[ApiController]
[Route("/admin-api/api/")]
public class CopierController : ControllerBase
{
    private static readonly HttpClient httpClient = new(new HttpClientHandler()
    {
        AutomaticDecompression = DecompressionMethods.All,
    });

    private class SourceAssetDetails
    {
        public long TargetId { get; set; }
        public long AssetId { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int AssetTypeId { get; set; }
        public bool IsForSale { get; set; }
        public bool IsLimited { get; set; }
        public bool IsLimitedUnique { get; set; }
        public int? PriceInRobux { get; set; }
        public int? Remaining { get; set; }
    }

    private static async Task<T> FetchJson<T>(string url)
    {
        var msg = new HttpRequestMessage(HttpMethod.Get, url);
        msg.Headers.UserAgent.ParseAdd("Roblox/WinInet");
        var response = await httpClient.SendAsync(msg);
        if (!response.IsSuccessStatusCode)
            throw new Exception($"Source returned {(int)response.StatusCode} for {url}");
        var body = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<T>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (result == null)
            throw new Exception($"Null response from {url}");
        return result;
    }

    private string NormalizeDomain(string domain)
    {
        domain = domain.TrimEnd('/');
        if (!domain.StartsWith("http://") && !domain.StartsWith("https://"))
            domain = "https://" + domain;
        return domain;
    }

    private async Task<byte[]> FetchAssetBytes(string domain, long assetId)
    {
        var urls = new[]
        {
            $"{domain}/asset/?id={assetId}",
            $"{domain}/asset/{assetId}",
            $"{domain}/v1/asset/?id={assetId}",
            $"{domain}/v2/asset/?id={assetId}",
        };
        foreach (var url in urls)
        {
            var msg = new HttpRequestMessage(HttpMethod.Get, url);
            msg.Headers.UserAgent.ParseAdd("Roblox/WinInet");
            var response = await httpClient.SendAsync(msg);
            if (response.IsSuccessStatusCode)
                return await response.Content.ReadAsByteArrayAsync();
        }
        throw new Exception($"Source returned non-200 for asset {assetId} at {domain} (tried {urls.Length} URL patterns)");
    }

    private async Task<long> CopySingleAsset(string domain, long sourceAssetId, bool isForSale = false, int? price = null)
    {
        try
        {
            var existing = await services.assets.GetAssetIdFromRobloxAssetId(sourceAssetId);
            if (existing != 0)
                return existing;
        }
        catch (RecordNotFoundException)
        {
        }

        var details = await FetchJson<SourceAssetDetails>($"{domain}/apisite/economy/v2/assets/{sourceAssetId}/details");
        if (details.Name == null)
            throw new Exception("Source did not return a name for this asset");

        var contentBytes = await FetchAssetBytes(domain, sourceAssetId);

        var assetResult = await services.assets.CreateAsset(
            details.Name,
            details.Description ?? "",
            1,
            CreatorType.User,
            1,
            new MemoryStream(contentBytes),
            (Type)details.AssetTypeId,
            Genre.All,
            ModerationStatus.ReviewApproved,
            DateTime.UtcNow,
            DateTime.UtcNow,
            sourceAssetId
        );

        if (details.IsForSale || isForSale)
        {
            await services.assets.SetItemPrice(assetResult.assetId, price ?? details.PriceInRobux, null);
            await services.assets.UpdateAssetMarketInfo(assetResult.assetId, true, details.IsLimited, details.IsLimitedUnique, details.Remaining, null);
        }

        return assetResult.assetId;
    }

    [HttpPost("copier/asset")]
    [StaffFilter(Models.Staff.Access.CreateAssetCopiedFromRoblox)]
    public async Task<dynamic> CopyAssetFromDomain([Required, FromBody] CopierCopyAssetRequest request)
    {
        var domain = NormalizeDomain(request.sourceDomain);
        var assetId = await CopySingleAsset(domain, request.sourceAssetId, request.isForSale, request.price);
        return new { assetId };
    }

    public class CopyPackageRequest
    {
        public string sourceDomain { get; set; } = string.Empty;
        public long sourceAssetId { get; set; }
        public string packageSubAssetIds { get; set; } = string.Empty;
    }

    [HttpPost("copier/package")]
    [StaffFilter(Models.Staff.Access.CreateAssetCopiedFromRoblox)]
    public async Task<dynamic> CopyPackageFromDomain([Required, FromBody] CopyPackageRequest request)
    {
        var domain = NormalizeDomain(request.sourceDomain);

        var rawIds = request.packageSubAssetIds?.Split(new[] { ',', ' ', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (rawIds == null || rawIds.Length == 0)
            throw new Exception("No sub-asset IDs provided. Enter the sub-asset IDs (comma-separated) to include in the package.");

        var subAssetIds = rawIds.Select(long.Parse).Distinct().ToList();

        Writer.Info(LogGroup.AdminApi, $"Copying package {request.sourceAssetId} with {subAssetIds.Count} sub-assets: {string.Join(", ", subAssetIds)}");

        var copiedSubIds = new List<long>();
        foreach (var subId in subAssetIds)
        {
            Writer.Info(LogGroup.AdminApi, $"Copying sub-asset {subId} for package {request.sourceAssetId}");
            try
            {
                var copiedId = await CopySingleAsset(domain, subId);
                copiedSubIds.Add(copiedId);
            }
            catch (Exception ex)
            {
                Writer.Info(LogGroup.AdminApi, $"Failed to copy sub-asset {subId}: {ex.Message}");
            }
        }

        if (copiedSubIds.Count == 0)
            throw new Exception("No sub-assets could be copied");

        var details = await FetchJson<SourceAssetDetails>($"{domain}/apisite/economy/v2/assets/{request.sourceAssetId}/details");
        var packageName = details?.Name ?? "Package " + request.sourceAssetId;

        var packageContent = await FetchAssetBytes(domain, request.sourceAssetId);

        var assetResult = await services.assets.CreateAsset(
            packageName,
            details?.Description ?? "Copied package",
            1,
            CreatorType.User,
            1,
            packageContent != null ? new MemoryStream(packageContent) : null,
            Type.Package,
            Genre.All,
            ModerationStatus.ReviewApproved,
            DateTime.UtcNow,
            DateTime.UtcNow,
            request.sourceAssetId
        );

        foreach (var subId in copiedSubIds)
        {
            await services.assets.InsertPackageAsset(assetResult.assetId, subId);
        }

        services.assets.RenderAsset(assetResult.assetId, Type.Package);

        return new { assetId = assetResult.assetId, subAssetsCopied = copiedSubIds.Count };
    }
}
