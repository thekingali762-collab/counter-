export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const key = url.searchParams.get("key") || url.pathname.replace(/^\/+/, "") || "default";
    const safeKey = key.slice(0, 120);

    if (!env.COUNTERS) {
      return new Response(
        JSON.stringify({ ok: false, error: "COUNTERS KV binding is missing" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const currentRaw = await env.COUNTERS.get(safeKey);
    let count = parseInt(currentRaw || "0", 10);
    if (Number.isNaN(count)) count = 0;

    const shouldIncrement =
      request.method === "POST" || url.searchParams.get("hit") === "1";

    if (shouldIncrement) {
      count += 1;
      await env.COUNTERS.put(safeKey, String(count));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        key: safeKey,
        count,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          ...corsHeaders,
        },
      }
    );
  },
};
