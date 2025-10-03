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
 * Map location names to DataForSEO location codes
 * Full list: https://docs.dataforseo.com/v3/appendix/locations/
 */
function getLocationCode(location: string): number {
  // Normalize location string (trim, uppercase for comparison)
  const normalizedLocation = location?.trim().toUpperCase() || '';
  
  const locationMap: Record<string, number> = {
    // Australia
    'BRISBANE, AUSTRALIA': 2036,
    'SYDNEY, AUSTRALIA': 2036,
    'MELBOURNE, AUSTRALIA': 2036,
    'AUSTRALIA': 2036,
    
    // USA - Common variations
    'UNITED STATES': 2840,
    'USA': 2840,
    'US': 2840,
    'UNITED STATES OF AMERICA': 2840,
    'NEW YORK, USA': 1023191,
    'NEW YORK': 1023191,
    'LOS ANGELES, USA': 1023768,
    'LOS ANGELES': 1023768,
    'CHICAGO, USA': 1023854,
    'CHICAGO': 1023854,
    
    // UK
    'UNITED KINGDOM': 2826,
    'UK': 2826,
    'GREAT BRITAIN': 2826,
    'LONDON, UK': 2826,
    'LONDON': 2826,
    
    // Canada
    'CANADA': 2124,
    'TORONTO': 9012,
    'VANCOUVER': 9007,
    
    // Europe
    'GERMANY': 2276,
    'FRANCE': 2250,
    'SPAIN': 2724,
    'ITALY': 2380,
    'NETHERLANDS': 2528,
  };
  
  // Try exact match first
  if (locationMap[normalizedLocation]) {
    console.log(`✅ Mapped location "${location}" to code: ${locationMap[normalizedLocation]}`);
    return locationMap[normalizedLocation];
  }
  
  // Try partial matches
  for (const [key, code] of Object.entries(locationMap)) {
    if (normalizedLocation.includes(key) || key.includes(normalizedLocation)) {
      console.log(`✅ Partial match for location "${location}" to "${key}", code: ${code}`);
      return code;
    }
  }
  
  console.warn(`⚠️ No mapping found for location "${location}", defaulting to United States (2840)`);
  return 2840; // Default to United States
}

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
/**
 * Ask Perplexity to suggest competitors based on industry and website
 */
async function suggestCompetitorsViaPerplexity(context: WorkflowContext): Promise<string[]> {
  try {
    console.log('🤖 Using Perplexity AI to suggest competitors...');
    
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      console.warn('⚠️ Perplexity API key not configured');
      return [];
    }
    
    const cleanWebsite = context.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const prompt = `List the top 5 competitor websites for ${cleanWebsite} in the ${context.industry} industry located in ${context.location}. Provide ONLY the domain names (e.g., example.com), one per line, without any explanations, URLs, or additional text. Do not include ${cleanWebsite} itself.`;
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.2,
        max_tokens: 200,
        return_citations: false,
        return_images: false
      }),
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error: ${response.status}`);
      console.error(`   Error details:`, errorText);
      return [];
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse domain names from response
    const competitors = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.includes(' '))
      .map((domain: string) => domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase())
      .filter((domain: string) => {
        // Filter out invalid domains and own domain
        const ownDomain = context.websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
        return domain.includes('.') && domain !== ownDomain && !domain.includes(ownDomain);
      })
      .slice(0, 5);
    
    console.log(`✅ Perplexity suggested ${competitors.length} competitors:`, competitors);
    return competitors;
  } catch (error) {
    console.error('❌ Perplexity competitor suggestion failed:', error);
    return [];
  }
}

export async function identifyCompetitors(context: WorkflowContext): Promise<string[]> {
  try {
    console.log('🔍 Identifying competitors...');
    
    // First, try user-provided competitors
    if (context.competitorDomains && context.competitorDomains.length > 0) {
      console.log(`✅ Using ${context.competitorDomains.length} user-provided competitors`);
      return context.competitorDomains.slice(0, 5);
    }
    
    // Extract clean domain from URL
    const domain = context.websiteUrl
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .split('/')[0]
      .toLowerCase();
    
    console.log(`   - Target domain: ${domain}`);
    console.log('   - Attempting DataForSEO competitor discovery...');
    
    const result = await callDataForSEO(
      '/v3/dataforseo_labs/google/competitors_domain/live',
      [{
        target: domain,
        location_code: getLocationCode(context.location),
        language_code: 'en',
        limit: 10
      }]
    );
    
    // Debug: Log raw items returned
    console.log(`   - Raw API items count: ${result?.items?.length || 0}`);
    if (result?.items?.length > 0) {
      console.log(`   - First 3 items:`, result.items.slice(0, 3).map((i: any) => i.domain));
    }
    
    // Filter out own domain and normalize competitor domains
    const competitors = result?.items
      ?.map((item: any) => {
        if (!item || !item.domain) return null;
        // Normalize domain: remove www, convert to lowercase
        return item.domain.replace(/^www\./, '').toLowerCase();
      })
      ?.filter((d: string | null) => {
        if (!d) return false;
        // Exact match comparison (not substring)
        const isOwnDomain = d === domain || d === `www.${domain}`;
        if (isOwnDomain) {
          console.log(`   - Filtered out own domain: ${d}`);
        }
        return !isOwnDomain;
      })
      ?.slice(0, 5) || [];
    
    if (competitors.length > 0) {
      console.log(`✅ DataForSEO found ${competitors.length} competitors:`, competitors);
      return competitors;
    }
    
    // If DataForSEO didn't find competitors, try Perplexity
    console.warn('⚠️ DataForSEO found no competitors, trying Perplexity AI...');
    const aiSuggestedCompetitors = await suggestCompetitorsViaPerplexity(context);
    
    if (aiSuggestedCompetitors.length > 0) {
      return aiSuggestedCompetitors;
    }
    
    console.warn('⚠️ No competitors identified from any source');
    return [];
  } catch (error) {
    console.error('❌ Failed to identify competitors:', error);
    return [];
  }
}

/**
 * Discover keywords for a website using DataForSEO Labs API
 * Uses the Keywords For Site endpoint when no target keywords are provided
 */
export async function discoverKeywordsForSite(context: WorkflowContext): Promise<string[]> {
  try {
    console.log('🔍 Discovering keywords for website...');
    
    const domain = context.websiteUrl
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .split('/')[0];
    
    const result = await callDataForSEO(
      '/v3/dataforseo_labs/google/keywords_for_site/live',
      [{
        target: domain,
        location_code: getLocationCode(context.location),
        language_code: 'en',
        limit: 20
        // Note: filters not supported by this endpoint
      }]
    );
    
    const keywords = result?.items
      ?.map((item: any) => item.keyword)
      ?.filter((k: string) => k && k.length > 2)
      ?.slice(0, 10) || [];
    
    console.log(`✅ Discovered ${keywords.length} keywords:`, keywords.slice(0, 5));
    return keywords;
  } catch (error) {
    console.error('❌ Failed to discover keywords:', error);
    return [];
  }
}

/**
 * Fetch keyword metrics using DataForSEO Keywords Data API
 */
export async function fetchKeywordMetrics(context: WorkflowContext): Promise<KeywordMetric[]> {
  try {
    console.log('📊 Fetching keyword metrics via proxy server...');
    
    // If no target keywords provided, discover them first
    let keywordsToAnalyze: string[] = [];
    
    if (context.targetKeywords && context.targetKeywords.length > 0) {
      keywordsToAnalyze = context.targetKeywords;
      console.log(`   - Using ${keywordsToAnalyze.length} user-provided keywords`);
    } else {
      console.log('   - No keywords provided, discovering keywords for site...');
      const discoveredKeywords = await discoverKeywordsForSite(context);
      
      if (discoveredKeywords.length > 0) {
        keywordsToAnalyze = discoveredKeywords;
        console.log(`   - Using ${keywordsToAnalyze.length} discovered keywords`);
      } else {
        // Fallback to industry-based keywords
        keywordsToAnalyze = [context.industry];
        console.log('   - Falling back to industry keyword');
      }
    }
    
    // DataForSEO keyword_suggestions requires location_code, not location_name
    const result = await callDataForSEO(
      '/v3/dataforseo_labs/google/keyword_suggestions/live',
      [{
        keyword: keywordsToAnalyze[0], // Use first keyword as seed
        location_code: getLocationCode(context.location),
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
  
  // Use user-provided keywords if available, otherwise discover or generate defaults
  let keywords: string[] = [];
  
  if (context.targetKeywords && context.targetKeywords.length > 0) {
    keywords = context.targetKeywords;
    console.log(`   - Using ${keywords.length} user-provided keywords for SERP`);
  } else {
    console.log('   - No keywords provided for SERP, attempting discovery...');
    const discoveredKeywords = await discoverKeywordsForSite(context);
    
    if (discoveredKeywords.length > 0) {
      keywords = discoveredKeywords.slice(0, 5); // Use top 5 discovered
      console.log(`   - Using ${keywords.length} discovered keywords for SERP`);
    } else {
      // Final fallback to industry-based keywords
      keywords = [
        context.industry,
        `${context.industry} services`,
        `${context.industry} ${context.location}`
      ];
      console.log('   - Using industry-based fallback keywords for SERP');
    }
  }

  for (const keyword of keywords.slice(0, 3)) { // Limit to 3 to avoid timeouts
    try {
      console.log(`🔎 Fetching SERP for "${keyword}" via proxy...`);
      
      const result = await callDataForSEO(
        '/v3/serp/google/organic/live/advanced',
        [{
          keyword,
          location_code: getLocationCode(context.location),
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
          location_code: getLocationCode(context.location),
          language_code: 'en',
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
