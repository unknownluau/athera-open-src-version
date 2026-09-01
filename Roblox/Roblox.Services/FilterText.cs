using System.Globalization;
using System.Text;

namespace Roblox.Services;


public class FilterService : ServiceBase, IService
{
    private static readonly string[] filteredWords =
    {
        "digga",
        "faget",
        "fagg",
        "fag",
        "fagget",
        "fagging",
        "faggit",
        "faggot",
        "faggots",
        "faggs",
        "fagit",
        "fagot",
        "fagots",
        "kkk",
        "molest",
        "nazi",
        "nazis",
        "niger",
        "nigger",
        "niigger",
        "niggers",
        "niiggers",
        "neiga",
        "nga",
        "ngga",
        "negger",
        "neckhurt",
        "nigga",
        "n0gga",
        "nhigga",
        "n8ggas",
        "niigga",
        "niga",
        "ni$$a",
        "ni$$as",
        "swastika",
        "kys",
        "killyourself",
        "killurself",
        "jew",
        "juice",
     };
    private static readonly HashSet<string> _filteredWordsSet = new HashSet<string>(filteredWords);
    public string FilterText(string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return input;
        }
        
        string cleanedInput = string.Join("", input.ToCharArray()
            .Where(c => !char.IsWhiteSpace(c))
            .Select(char.ToLower)
            .Select(c =>
            {
            /* This will prevent words like n!igga, n!gg@ etc */
            switch (c)
            {
                case '#': return '\0';
                case '.': return '\0';
                case '$': return 's';
                case '@': return 'a';
                case '!': return 'i';
                case '0': return 'o';
                case '*': return '\0';
                case 'я': return 'r';
                default: return c;
            }
            })
            .Where(c => c != '\0')
            .ToArray());

        if (_filteredWordsSet.Any(word => cleanedInput.Contains(word)))
        {
            return new string('#', input.Length);
        }
        return input;
    }
    public string CleanText(string input)
    {
        StringBuilder sb = new StringBuilder();
        foreach (char c in input.Normalize(NormalizationForm.FormC))
        {
            if (char.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        return sb.ToString();
    }

    public bool IsReusable()
    {
        return true;
    }

    public bool IsThreadSafe()
    {
        return true;
    }
}
