namespace Roblox.Models.JWT;

public class InvalidJWTSignature : Exception
{
    public InvalidJWTSignature(string message) : base(message) { }
    public InvalidJWTSignature(string message, Exception inner) : base(message, inner) { }
}