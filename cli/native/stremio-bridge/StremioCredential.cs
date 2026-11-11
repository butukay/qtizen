using System.Text.Json;

internal sealed class StremioCredential
{
    private readonly LauncherPrivateFile file = new LauncherPrivateFile("stremio-feed.json");
    internal string Token { get; }
    internal StremioCredential(string token) { Token = token; }
    internal bool EnsurePublished() => file.Publish(JsonSerializer.SerializeToUtf8Bytes(new { schema_version = 1, token = Token }));
    internal void Remove() => file.Remove();
}
