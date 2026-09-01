// this shit is so janky and sucks so much but it works and i don't feel like integrating db shit into this
// THIS IS TEMPORARY! move this to a real page later using the existing endpoint in BypassController (promocodes/redeem)
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Net.Http;
using System.Threading.Tasks;
using System.Net;
using Newtonsoft.Json;
using System.Collections.Generic;
// roblox.models are for enums, just move this to websitemodels later
using Roblox.Models.Promocodes;

namespace Roblox.Website.Pages.Internal;

public class Promocodes : RobloxPageModel
{
    [BindProperty]
    public string Code { get; set; }
    
    public PCResult Result { get; set; }
    
    public void OnGet()
    {
        Result = new PCResult();
    }

    public async Task<IActionResult> OnPost()
    {
        Result = new PCResult { showResult = true };

        if (string.IsNullOrEmpty(Code))
        {
            Result.success = false;
            Result.message = "Promocode is required";
            return Page();
        }

        Code = Code.ToUpper();

        var handler = new HttpClientHandler
        {
            UseCookies = true,
            AutomaticDecompression = DecompressionMethods.All,
            AllowAutoRedirect = true
        };

        using var client = new HttpClient(handler);
        client.DefaultRequestHeaders.Add("User-Agent", Request.Headers["User-Agent"].ToString());
        
        if (Request.Cookies.TryGetValue(".ROBLOSECURITY", out var robloSecurity))
        {
            handler.CookieContainer.Add(new Uri(Roblox.Configuration.BaseUrl), new Cookie(".ROBLOSECURITY", robloSecurity));
        }

        try
        {
            var url = $"{Roblox.Configuration.BaseUrl}/promocodes/redeem?code={WebUtility.UrlEncode(Code)}";
            var response = await client.GetAsync(url);
            var rescontent = await response.Content.ReadAsStringAsync();
			
            if (response.IsSuccessStatusCode)
            {
                Result = JsonConvert.DeserializeObject<PCResult>(rescontent);
                Result.showResult = true;
                return Page();
            }

            try
            {
                var errorResponse = JsonConvert.DeserializeObject<ErrorResponse>(rescontent);
                if (errorResponse?.errors != null && errorResponse.errors.Count > 0)
                {
                    Result.success = false;
                    Result.message = errorResponse.errors[0].message;
                    return Page();
                }
            }
            catch
            {
            }

            Result.success = false;
            Result.message = "Failed to redeem promocode";
            return Page();
        }
        catch (Exception ex)
        {
            Result.success = false;
            Result.message = ex.Message;
            return Page();
        }
    }
}