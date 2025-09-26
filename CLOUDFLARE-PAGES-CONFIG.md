# Cloudflare Pages Configuration for BI Dashboard

## 🔧 Build Settings Configuration

Due to complex React dependencies, Cloudflare Pages needs specific build configuration:

### **Framework Settings:**
```
Framework preset: None (or Custom)
Build command: cd frontend && npm install --legacy-peer-deps && npm run build
Build output directory: frontend/dist
Root directory: (leave empty)
```

### **Environment Variables:**
```
NODE_VERSION=18
NPM_CONFIG_LEGACY_PEER_DEPS=true
VITE_SUPABASE_URL=https://efynkraanhjwfjetnccp.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### **Why This Configuration:**

1. **npm install vs npm ci:** Complex Material-UI dependencies require `npm install --legacy-peer-deps`
2. **Custom build command:** Ensures proper dependency resolution
3. **Node 18:** Optimal compatibility with all dependencies
4. **Legacy peer deps:** Resolves React version conflicts

## 🎯 **Alternative: Manual Upload**

If automatic deployment continues to fail:

1. **Build locally:**
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   npm run build
   ```

2. **Upload dist/ folder manually to Cloudflare Pages**

## ✅ **Expected Result:**

Once configured correctly, your BI Dashboard will be live with:
- Complete intelligence workflow
- Billing integration with trials
- SEO-optimized content
- Brand disambiguation
- Mobile-responsive design

## 🌐 **Live URLs After Deployment:**

- **Main App:** https://artificialintelligentsia.pages.dev/
- **MCP Worker:** https://bi-dashboard-mcp-server.liam-wilson1990.workers.dev/
- **Supabase Functions:** https://efynkraanhjwfjetnccp.supabase.co/functions/v1/

Your complete ecosystem will be production-ready!
