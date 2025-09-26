export interface OnboardingPayload {
  fullName: string;
  websiteUrl: string;
  industry: string;
  location: string;
}

export interface WorkflowTriggerResult {
  workflowId: string;
  status: string;
}

export interface WorkflowContext {
  workflowId: string;
  userId: string;
  websiteUrl: string;
  industry: string;
  location: string;
  fullName: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

export interface SerpResult {
  search_engine: string;
  keyword: string;
  position: number;
  url: string;
  delta?: number;
}

export interface KeywordMetric {
  keyword: string;
  volume: number;
  cpc: number;
  difficulty: number;
  ctrPotential: number;
}

export interface SentimentOutput {
  label: string;
  score: number;
}

export interface CoreWebVital {
  metric: string;
  desktop: number;
  mobile: number;
}

export interface TechStackSummary {
  competitor: string;
  categories: string[];
}

export interface ContentSentiment {
  source: string;
  sentiment_score: number;
  tone: string;
}

export interface BacklinkSummary {
  source: string;
  authority: number;
  anchorText: string;
}

export interface AIInsightPayload {
  summary: string;
  recommendations: Array<{
    title: string;
    description: string;
    confidence: number;
  }>;
}

export interface AIRecommendation {
  title: string;
  description: string;
  confidence: number;
}

export interface IntelligenceReportSummary {
  id: string;
  captured_at: string;
  executive_summary: string;
  recommendations: AIRecommendation[];
}

export interface SerpTimelinePoint {
  captured_at: string;
  keyword?: string;
  share_of_voice: number;
}

export interface KeywordOpportunityPoint {
  keyword: string;
  volume: number;
  difficulty: number;
  ctrPotential: number;
}

export interface SentimentMetric {
  label: string;
  score: number;
}

export interface BacklinkMetric {
  source: string;
  authority: number;
  anchorText: string;
}

export interface CoreWebVitalMetric {
  metric: string;
  desktop: number;
  mobile: number;
}

export interface TechStackEntry {
  competitor: string;
  categories: string[];
}

export interface IntelligenceReportPayload {
  summary: IntelligenceReportSummary;
  serpTimeline: SerpTimelinePoint[];
  keywordOpportunities: KeywordOpportunityPoint[];
  sentiment: SentimentMetric[];
  backlinks: BacklinkMetric[];
  coreWebVitals: CoreWebVitalMetric[];
  techStack: TechStackEntry[];
}

