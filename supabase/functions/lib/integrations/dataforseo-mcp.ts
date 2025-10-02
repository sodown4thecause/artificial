/**
 * DataForSEO Integration via Cloudflare Worker Proxy
 * 
 * Uses the existing Cloudflare Worker that proxies DataForSEO API calls
 * Server: https://bi-dashboard-mcp-server.liam-wilson1990.workers.dev/
 * 
 * Available modules:
 * - AI_OPTIMIZATION: AI keyword data, LLM-optimized responses
 * - SERP: Google, Bing, Yahoo SERP results
 * - KEYWORDS_DATA: Search volume, CPC, competition metrics
 * - ONPAGE: Technical SEO audits
 * - DATAFORSEO_LABS: Competitor analysis, ranked keywords, domain metrics
 * - BUSINESS_DATA: Google My Business, reviews, company profiles
 * - DOMAIN_ANALYTICS: Traffic, technologies, Whois data
 * - CONTENT_ANALYSIS: Sentiment analysis, brand monitoring
 * 
 * Note: BACKLINKS module not enabled in Cloudflare Worker
 */

import type { WorkflowContext, SerpResult, KeywordMetric } from '../types.ts';
import { fetchWithRetry } from '../utils.ts';

/**
 * Call DataForSEO API directly
 * @param endpoint - DataForSEO API endpoint (e.g., '/v3/serp/google/organic/live/advanced')
 * @param payload - API request payload (array for DataForSEO)
 */
async function callDataForSEO(endpoint: string, payload: any[]): Promise<any> {
  console.log(`📡 Calling DataForSEO API directly: ${endpoint}`);
  console.log(`📦 Payload items: ${payload.length}`);

  const username = Deno.env.get('DATAFORSEO_USERNAME');
  const password = Deno.env.get('DATAFORSEO_PASSWORD');

  // Debug: Log credential status (NOT values)
  console.log(`🔐 Credentials check:`);
  console.log(`   - Username present: ${!!username} (length: ${username?.length || 0})`);
  console.log(`   - Password present: ${!!password} (length: ${password?.length || 0})`);
  console.log(`   - Username starts with: ${username?.substring(0, 3)}...`);

  if (!username || !password) {
    console.error('❌ DataForSEO credentials missing');
    console.error('   Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('DATA')));
    return { items: [] };
  }

  // Create Basic Auth header
  const auth = btoa(`${username}:${password}`);

  const response = await fetchWithRetry(() =>
    fetch(`https://api.dataforseo.com${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90000)
    })
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ DataForSEO API error: ${response.status}`);
    console.error(`   Response body:`, errorText);
    console.error(`   Auth header sent: Basic ${auth.substring(0, 20)}...`);
    
    // Try to parse error response
    try {
      const errorJson = JSON.parse(errorText);
      console.error(`   Parsed error:`, errorJson);
    } catch (e) {
      // Not JSON, already logged as text
    }
    
    return { items: [] };
  }

  const data = await response.json();
  
  // DataForSEO API responses are wrapped in tasks array
  if (data.tasks && data.tasks.length > 0) {
    const task = data.tasks[0];
    
    // Check task status
    if (task.status_code !== 20000) {
      console.error(`❌ DataForSEO task failed [${task.status_code}]: ${task.status_message}`);
      return { items: [] };
    }
    
    // Extract result - it's usually in result[0] for live endpoints
    const result = task.result?.[0] || task.result || {};
    console.log(`✅ DataForSEO API call successful, result items: ${result.items?.length || 0}`);
    return result;
  }
  
  console.warn(`⚠️ No tasks array in DataForSEO response`);
  return { items: [] };
}

/**
 * Identify competitors using DataForSEO Domain Analytics API
 */
export async function identifyCompetitors(context: WorkflowContext): Promise<string[]> {
  try {
    console.log('🔍 Identifying competitors via proxy server...');
    
    const domain = context.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
    
    const result = await callDataForSEO(
      '/v3/dataforseo_labs/google/competitors_domain/live',
      [{
        target: domain,
        location_code: 2036, // Brisbane, Australia
        language_code: 'en',
        limit: 10
      }]
    );
    
    const competitors = result?.items
      ?.map((item: any) => item.domain)
      ?.filter((d: string) => d && !d.includes(domain))
      ?.slice(0, 5) || [];
    
    console.log(`✅ Found ${competitors.length} competitors:`, competitors);
    return competitors;
  } catch (error) {
    console.error('❌ Failed to identify competitors:', error);
    return [];
  }
}

/**
 * Fetch keyword metrics using DataForSEO Keywords Data API
 */
export async function fetchKeywordMetrics(context: WorkflowContext): Promise<KeywordMetric[]> {
  try {
    console.log('📊 Fetching keyword metrics via proxy server...');
    
    // DataForSEO keyword_suggestions requires location_code, not location_name
    const result = await callDataForSEO(
      '/v3/dataforseo_labs/google/keyword_suggestions/live',
      [{
        keyword: context.industry,
        location_code: 2036, // Brisbane, Australia
        language_code: 'en',
        limit: 50,
        include_seed_keyword: true
      }]
    );
    
    const items = result?.items || [];
    const metrics = items.map((item: any) => ({
      keyword: item.keyword,
      volume: item.keyword_info?.search_volume ?? 0,
      cpc: item.keyword_info?.cpc ?? 0,
      difficulty: item.keyword_properties?.keyword_difficulty ?? 50,
      ctrPotential: (item.impressions_info?.ctr ?? 0) / 100
    })).slice(0, 20);
    
    console.log(`✅ Fetched ${metrics.length} keyword metrics`);
    return metrics;
  } catch (error) {
    console.error('❌ Failed to fetch keyword metrics:', error);
    // Return fallback data
    return [{
      keyword: context.industry,
      volume: 1000,
      cpc: 2.5,
      difficulty: 50,
      ctrPotential: 0.25
    }];
  }
}

/**
 * Fetch SERP results using DataForSEO SERP API
 */
export async function fetchEnhancedSerpResults(context: WorkflowContext, competitors: string[]): Promise<SerpResult[]> {
  const allResults: SerpResult[] = [];
  
  const keywords = [
    context.industry,
    `${context.industry} services`,
    `${context.industry} ${context.location}`,
    `best ${context.industry}`,
    `top ${context.industry} companies`
  ];

  for (const keyword of keywords.slice(0, 3)) { // Limit to 3 to avoid timeouts
    try {
      console.log(`🔎 Fetching SERP for "${keyword}" via proxy...`);
      
      const result = await callDataForSEO(
        '/v3/serp/google/organic/live/advanced',
        [{
          keyword,
          location_code: 2036, // Brisbane, Australia
          language_code: 'en',
          device: 'desktop',
          os: 'windows',
          depth: 50
        }]
      );
      
      const items = result?.items || [];
      const targetDomain = extractDomain(context.websiteUrl);
      
      items.forEach((item: any) => {
        if (item.type === 'organic') {
          const domain = extractDomain(item.url || '');
          allResults.push({
            search_engine: 'google',
            keyword,
            position: item.rank_absolute || 0,
            url: item.url,
            domain,
            delta: 0
          });
        }
      });
      
      console.log(`✅ Fetched ${items.length} SERP results for "${keyword}"`);
    } catch (error) {
      console.warn(`⚠️ Failed to fetch SERP for "${keyword}":`, error);
    }
  }

  console.log(`✅ Total SERP results: ${allResults.length}`);
  return allResults;
}

/**
 * Fetch basic SERP results
 */
export async function fetchSerpResults(context: WorkflowContext): Promise<SerpResult[]> {
  return fetchEnhancedSerpResults(context, []);
}

/**
 * Analyze competitor keywords using DataForSEO Labs API
 */
export async function analyzeCompetitorKeywords(competitors: string[], context: WorkflowContext): Promise<any[]> {
  const competitorAnalysis = [];
  
  for (const competitor of competitors.slice(0, 2)) { // Limit to 2 to avoid timeout
    try {
      console.log(`🎯 Analyzing keywords for ${competitor} via proxy...`);
      
      const result = await callDataForSEO(
        '/v3/dataforseo_labs/google/ranked_keywords/live',
        [{
          target: competitor,
          location_name: context.location,
          language_name: 'English',
          limit: 100,
          load_rank_absolute: true,
          filters: [["keyword_data.keyword_info.search_volume", ">", 0]]
        }]
      );
      
      const keywords = result?.items || [];
      const topKeywords = keywords.slice(0, 20).map((item: any) => ({
        keyword: item.keyword_data?.keyword,
        search_volume: item.keyword_data?.keyword_info?.search_volume,
        keyword_difficulty: item.keyword_data?.keyword_properties?.keyword_difficulty,
        position: item.ranked_serp_element?.serp_item?.rank_absolute
      }));
      
      competitorAnalysis.push({
        domain: competitor,
        keywords: topKeywords,
        total_keywords: keywords.length
      });
      
      console.log(`✅ Analyzed ${topKeywords.length} keywords for ${competitor}`);
    } catch (error) {
      console.warn(`⚠️ Failed to analyze competitor ${competitor}:`, error);
    }
  }
  
  return competitorAnalysis;
}

/**
 * Fetch competitor backlinks - NOT SUPPORTED via Cloudflare MCP proxy
 * Note: Backlinks module is not enabled in the Cloudflare Worker.
 * Use the separate backlinks.ts integration if backlink data is needed.
 */
export async function fetchCompetitorBacklinks(competitors: string[]): Promise<any[]> {
  console.log('⚠️ Backlinks API not supported via Cloudflare MCP proxy');
  console.log('Skipping competitor backlink analysis...');
  return [];
}

/**
 * Build SERP share timeline from results
 */
export function buildSerpShareTimeline(serpResults: SerpResult[]): any[] {
  const targetDomain = serpResults[0]?.domain;
  if (!targetDomain) return [];
  
  // Group by date (use current date for now)
  const today = new Date().toISOString();
  const totalResults = serpResults.length;
  const targetResults = serpResults.filter(r => r.domain === targetDomain).length;
  const shareOfVoice = totalResults > 0 ? (targetResults / totalResults) * 100 : 0;
  
  return [{
    captured_at: today,
    share_of_voice: Math.round(shareOfVoice * 100) / 100
  }];
}

/**
 * Build competitor insights
 */
export function buildCompetitorInsights(serpResults: SerpResult[], competitors: string[]): any {
  const competitorMetrics = competitors.map(competitor => {
    const competitorResults = serpResults.filter(r => r.domain === competitor);
    const avgPosition = competitorResults.length > 0
      ? competitorResults.reduce((sum, r) => sum + r.position, 0) / competitorResults.length
      : 0;
    
    return {
      domain: competitor,
      total_rankings: competitorResults.length,
      avg_position: Math.round(avgPosition * 100) / 100,
      keywords: [...new Set(competitorResults.map(r => r.keyword))]
    };
  });
  
  return {
    total_competitors: competitors.length,
    competitor_metrics: competitorMetrics
  };
}

/**
 * Helper: Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}
