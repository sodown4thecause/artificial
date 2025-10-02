var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        edge_location: request.cf?.colo || "unknown",
        endpoints: ["/mcp", "/health", "/"],
        modules_enabled: env.ENABLED_MODULES?.split(",") || []
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (url.pathname === "/") {
      return new Response(getDocumentationHTML(), {
        headers: { "Content-Type": "text/html" }
      });
    }
    if (url.pathname === "/mcp") {
      return await handleMCPRequest(request, env);
    }
    return new Response("Not Found", { status: 404 });
  }
};
async function handleMCPRequest(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  try {
    const body = await request.json();
    if (body.endpoint && body.payload) {
      const credentials = btoa(`${env.DATAFORSEO_USERNAME}:${env.DATAFORSEO_PASSWORD}`);
      const response = await fetch(`https://api.dataforseo.com${body.endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${credentials}`
        },
        body: JSON.stringify([body.payload])
      });
      const data = await response.json();
      return new Response(JSON.stringify({
        success: response.ok,
        data,
        edge_location: request.cf?.colo || "unknown"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      error: "Invalid request format",
      expected: { endpoint: "/v3/...", payload: {} }
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Request failed",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleMCPRequest, "handleMCPRequest");
function getDocumentationHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>DataForSEO MCP Server</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; max-width: 800px; }
        .header { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .endpoint { background: #f1f5f9; padding: 15px; margin: 10px 0; border-radius: 6px; }
        .method { background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        code { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>\u{1F50D} DataForSEO MCP Server</h1>
        <p>Edge-distributed access to DataForSEO's comprehensive SEO intelligence APIs</p>
        <p><strong>Edge Location:</strong> Global Cloudflare Network</p>
    </div>
    
    <h2>\u{1F4E1} Available Endpoints</h2>
    
    <div class="endpoint">
        <span class="method">POST</span> <code>/mcp</code>
        <p>MCP protocol endpoint for DataForSEO API access</p>
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <code>/health</code>
        <p>Health check with edge location info</p>
    </div>
    
    <h2>\u{1F527} Enabled Modules</h2>
    <ul>
        <li><strong>SERP API:</strong> Real-time search rankings</li>
        <li><strong>Keywords API:</strong> Search volume and competition data</li>
        <li><strong>Backlinks API:</strong> Link authority and quality metrics</li>
        <li><strong>Domain Analytics:</strong> Traffic and technology insights</li>
        <li><strong>Business Data:</strong> Company intelligence</li>
        <li><strong>Content Analysis:</strong> Sentiment and brand monitoring</li>
        <li><strong>OnPage API:</strong> Technical SEO audits</li>
        <li><strong>Labs API:</strong> Proprietary SEO databases</li>
    </ul>
    
    <h2>\u{1F3AF} Integration</h2>
    <p>This MCP server provides edge-distributed access to DataForSEO APIs for your BI Dashboard intelligence workflow.</p>
    
    <p><em>Powered by Cloudflare Workers \u2022 Global Edge Network</em></p>
</body>
</html>`;
}
__name(getDocumentationHTML, "getDocumentationHTML");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
