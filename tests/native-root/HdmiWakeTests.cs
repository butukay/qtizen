using System;
using System.Text;
using System.Text.Json;
using Qtizen.Hdmi;

internal static class HdmiWakeTests
{
    internal static void Run(Action<bool, string> check)
    {
        const long now = 100000;
        byte[] Request(int port, long at, string id = "abc-123") => JsonSerializer.SerializeToUtf8Bytes(new { schema_version = 1, request_id = id, port, requested_at = at });
        foreach (int port in new[] { 1, 2, 3, 4 }) check(HdmiWakePolicy.Parse(Request(port, now), now)?.Port == port, "Valid HDMI wake rejected");
        foreach (int port in new[] { -1, 0, 5, int.MaxValue }) check(HdmiWakePolicy.Parse(Request(port, now), now) == null, "Invalid HDMI port accepted");
        foreach (long at in new[] { 0L, now - 5001, now + 1, long.MinValue, long.MaxValue }) check(HdmiWakePolicy.Parse(Request(1, at), now) == null, "Stale or future wake accepted");
        foreach (string id in new[] { "", "../anything", "abc\n", new string('a', 49) }) check(HdmiWakePolicy.Parse(Request(1, now, id), now) == null, "Invalid request identity accepted");
        foreach (string text in new[] { "{}", "null", "{", "[]", "{\"schema_version\":2}", "{\"schema_version\":\"1\"}" }) check(HdmiWakePolicy.Parse(Encoding.UTF8.GetBytes(text), now) == null, "Malformed HDMI request accepted");
        check(HdmiWakePolicy.Parse(new byte[513], now) == null, "Oversized HDMI request accepted");
        Console.WriteLine("HDMI_WAKE_POLICY_CHECKS_PASSED");
    }
}
