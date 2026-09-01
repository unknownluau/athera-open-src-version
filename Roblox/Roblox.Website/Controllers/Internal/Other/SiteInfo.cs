using MVC = Microsoft.AspNetCore.Mvc;
using CsvHelper;
using System.Xml;
using System.Threading.Tasks;

namespace Roblox.Website.Controllers
{

    [MVC.ApiController]
    [MVC.Route("/")]
    public class SiteAlertMobile: ControllerBase
    {
        [HttpGetBypass("alerts/alert-info")]
        public async Task<dynamic> GetAlert()
        {
            var alert = await services.users.GetGlobalAlert();
            return new
            {
                IsVisible = alert != null,
                Text = alert?.message ?? "",
                LinkText = "",
                LinkUrl = alert?.url ?? "",
            };
        }

        [HttpGetBypass("v1/player-policies-client")]
        public dynamic GetPlayerPolicies()
        {
            return new
            {
                allowedExternalLinkReferences = new[] { "Discord", "YouTube", "Twitch", "Facebook" },
                arePaidRandomItemsRestricted = false,
                isPaidItemTradingAllowed = true,
                isSubjectToChinaPolicies = false
            };
        }
    }
}