import type { WorkflowContext, SerpResult } from '../types.ts';
import { fetchWithRetry } from '../utils.ts';

// Free web scraping service URLs
const JINA_READER_URL = 'https://r.jina.ai/';
const HTMLCSSTOIMAGE_URL = 'https://htmlcsstoimage.com/demo_run';
const SCRAPY_SERVICE_URL = Deno.env.get('SCRAPY_SERVICE_URL');

interface ScrapedContent {
  url: string;
  title?: string;
  headings: string[];
  content?: string;
  metaDescription?: string;
  technologies?: string[];
  ctas?: string[];
  images?: string[];
  links?: string[];
}

/**
 * Scrape competitor websites using Firecrawl with Scrapy fallback
 * @param context Workflow context containing website and industry info
 * @param serpResults SERP results to extract competitor URLs from
 * @returns Array of scraped content from competitor websites
 */
/**
 * FREE Competitor Website Scraping
 * Uses only free alternatives: Jina AI Reader + Native Scraping
 */
export async function fetchFirecrawlInsights(
  context: WorkflowContext,
  serpResults: SerpResult[]
): Promise<ScrapedContent[]> {
  const competitorUrls = extractCompetitorUrls(context, serpResults);
  
  if (competitorUrls.length === 0) {
    console.log('No competitor URLs found for scraping');
    return [];
  }

  console.log(`Starting FREE scraping for ${competitorUrls.length} competitor URLs`);
  
  const allResults: ScrapedContent[] = [];
  let remainingUrls = [...competitorUrls];

  // 1. Try Jina AI Reader (FREE) - Excellent for content extraction
  if (remainingUrls.length > 0) {
    const jinaResults = await tryJinaReader(remainingUrls);
    allResults.push(...jinaResults);
    remainingUrls = remainingUrls.filter(url => !jinaResults.some(r => r.url === url));
    console.log(`✅ Jina Reader (FREE): ${jinaResults.length} successful, ${remainingUrls.length} remaining`);
  }

  // 2. Try custom Scrapy service (if deployed) - FREE if self-hosted
  if (remainingUrls.length > 0 && SCRAPY_SERVICE_URL) {
    const scrapyResults = await tryScrapyService(remainingUrls);
    allResults.push(...scrapyResults);
    remainingUrls = remainingUrls.filter(url => !scrapyResults.some(r => r.url === url));
    console.log(`✅ Scrapy service: ${scrapyResults.length} successful, ${remainingUrls.length} remaining`);
  }

  // 3. Native scraping as fallback (100% FREE)
  if (remainingUrls.length > 0) {
    const nativeResults = await tryNativeScraping(remainingUrls);
    allResults.push(...nativeResults);
    console.log(`✅ Native scraping: ${nativeResults.length} successful`);
  }

  console.log(`🎉 Total FREE scraping results: ${allResults.length}/${competitorUrls.length} URLs processed`);
  
  return allResults;
}

/**
 * Extract competitor URLs from SERP results
 */
function extractCompetitorUrls(context: WorkflowContext, serpResults: SerpResult[]): string[] {
  const targetDomain = new URL(context.websiteUrl).hostname;
  
  return Array.from(
    new Set(
      serpResults
        .filter((result) => {
          try {
            const urlDomain = new URL(result.url).hostname;
            return urlDomain !== targetDomain;
          } catch {
            return false;
          }
        })
        .map((result) => result.url)
        .slice(0, 8) // Increased limit for better competitor analysis
    )
  );
}

/**
 * Try scraping with Jina AI Reader (100% FREE)
 * Excellent for extracting clean content from web pages
 */
async function tryJinaReader(urls: string[]): Promise<ScrapedContent[]> {
  const results: ScrapedContent[] = [];
  
  // Process URLs individually to avoid overwhelming the free service
  for (const url of urls) {
    try {
      // Jina Reader API - simply append the URL to their reader endpoint
      const jinaUrl = `${JINA_READER_URL}${encodeURIComponent(url)}`;
      
      const response = await fetch(jinaUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BI-Dashboard/1.0; +https://artificialintelligentsia.co)',
          'Accept': 'text/plain, text/markdown, application/json'
        },
        signal: AbortSignal.timeout(20000) // 20 second timeout
      });

      if (!response.ok) {
        console.error(`Jina Reader failed for ${url}: HTTP ${response.status}`);
        continue;
      }

      const content = await response.text();
      
      // Jina Reader returns clean markdown content
      const parsedContent = parseJinaContent(url, content);
      results.push(parsedContent);
      
      // Add small delay between requests to be respectful to the free service
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Jina Reader failed for ${url}:`, error.message);
    }
  }

  return results;
}

/**
 * Parse content returned by Jina AI Reader
 */
function parseJinaContent(url: string, content: string): ScrapedContent {
  // Jina returns clean markdown, extract key elements
  const lines = content.split('\n');
  
  // Extract title (usually first H1)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  // Extract all headings
  const headings = extractHeadings(content);
  
  // Extract CTAs and important links
  const ctas = extractCTAs(content);
  
  // Clean content (remove excessive whitespace, limit size)
  const cleanContent = content
    .replace(/\n\s*\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 2000);
  
  return {
    url,
    title,
    headings: headings.slice(0, 15), // More headings since Jina provides clean data
    content: cleanContent,
    metaDescription: extractMetaFromContent(cleanContent),
    technologies: detectTechnologies(content),
    ctas,
    images: extractImageReferences(content),
    links: []
  };
}

/**
 * Extract meta description from content
 */
function extractMetaFromContent(content: string): string {
  // Take first paragraph or sentence as meta description
  const sentences = content.split(/[.!?]+/);
  const firstSentence = sentences[0]?.trim();
  return firstSentence && firstSentence.length > 20 && firstSentence.length < 160 
    ? firstSentence 
    : content.substring(0, 150).trim();
}

/**
 * Detect technologies mentioned in content
 */
function detectTechnologies(content: string): string[] {
  const techKeywords = [
    'React', 'Vue', 'Angular', 'JavaScript', 'TypeScript', 'Node.js',
    'Python', 'Django', 'Flask', 'Ruby', 'Rails', 'PHP', 'Laravel',
    'WordPress', 'Shopify', 'WooCommerce', 'Magento',
    'AWS', 'Google Cloud', 'Azure', 'Cloudflare',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'Docker', 'Kubernetes', 'Next.js', 'Gatsby', 'Nuxt'
  ];
  
  const detected = techKeywords.filter(tech => 
    content.toLowerCase().includes(tech.toLowerCase())
  );
  
  return detected.slice(0, 10); // Limit results
}

/**
 * Extract image references from markdown content
 */
function extractImageReferences(content: string): string[] {
  const imageMatches = content.match(/!\[.*?\]\((.*?)\)/g) || [];
  return imageMatches
    .map(match => {
      const urlMatch = match.match(/\((.*?)\)/);
      return urlMatch ? urlMatch[1] : '';
    })
    .filter(url => url.length > 0)
    .slice(0, 5);
}

/**
 * Try scraping with Scrapy service
 */
async function tryScrapyService(urls: string[]): Promise<ScrapedContent[]> {
  try {
    const response = await fetch(SCRAPY_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        urls: urls,
        options: {
          timeout: 30,
          concurrent_requests: 3,
          extract_headings: true,
          extract_links: false, // Reduce response size
          extract_images: false,
          content_limit: 2000
        }
      }),
      signal: AbortSignal.timeout(45000) // 45 second timeout for batch
    });

    if (!response.ok) {
      throw new Error(`Scrapy service HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Scrapy service failed:', error.message);
    return [];
  }
}

/**
 * Native web scraping using Deno's fetch with basic HTML parsing
 */
async function tryNativeScraping(urls: string[]): Promise<ScrapedContent[]> {
  const results: ScrapedContent[] = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BI-Dashboard/1.0; +https://artificialintelligentsia.co)'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const scraped = parseHtmlContent(url, html);
      results.push(scraped);
    } catch (error) {
      console.error(`Native scraping failed for ${url}:`, error.message);
    }
  }

  return results;
}

/**
 * Basic HTML parsing for native scraping
 */
function parseHtmlContent(url: string, html: string): ScrapedContent {
  // Simple regex-based HTML parsing (not robust but works for basic extraction)
  const titleMatch = html.match(/<title[^>]*>([^<]*)</i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1] : '';

  // Extract headings
  const headingMatches = html.match(/<h[1-6][^>]*>([^<]*)</gi) || [];
  const headings = headingMatches.map(match => {
    const textMatch = match.match(/>([^<]*)</i);
    return textMatch ? textMatch[1].trim() : '';
  }).filter(h => h.length > 0);

  // Extract basic content (remove tags)
  let content = html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 2000);

  return {
    url,
    title,
    headings: headings.slice(0, 10), // Limit headings
    content,
    metaDescription,
    technologies: [],
    ctas: [],
    images: [],
    links: []
  };
}

/**
 * Extract headings from markdown content
 */
function extractHeadings(markdown: string): string[] {
  const headingMatches = markdown.match(/^#+\s+(.+)$/gm) || [];
  return headingMatches.map(match => match.replace(/^#+\s+/, '')).slice(0, 10);
}

/**
 * Extract potential CTAs from markdown content
 */
function extractCTAs(markdown: string): string[] {
  const ctaPatterns = [
    /\b(get started|sign up|try free|book demo|contact us|learn more|download|subscribe)\b/gi,
    /\[(.*?)\]\(.*?\)/g // Markdown links
  ];
  
  const ctas: string[] = [];
  
  ctaPatterns.forEach(pattern => {
    const matches = markdown.match(pattern) || [];
    ctas.push(...matches);
  });
  
  return [...new Set(ctas)].slice(0, 5); // Dedupe and limit
}

