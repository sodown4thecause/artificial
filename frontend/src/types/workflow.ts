export interface OnboardingFormValues {
  fullName: string;
  websiteUrl: string;
  industry: string;
  location: string;
}

export interface WorkflowStatus {
  state: 'idle' | 'submitting' | 'success' | 'error';
  message?: string;
}

export interface BillingStatus {
  subscribed: boolean;
  planId: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface IntelligenceReportSummary {
  id: string;
  captured_at: string;
  executive_summary: string;
  recommendations: Array<{
    title: string;
    description: string;
    confidence: number;
  }>;
}

export interface SerpTimelinePoint {
  captured_at: string;
  share_of_voice: number;
}

export interface KeywordOpportunity {
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
  keywordOpportunities: KeywordOpportunity[];
  sentiment: SentimentMetric[];
  backlinks: BacklinkMetric[];
  coreWebVitals: CoreWebVitalMetric[];
  techStack: TechStackEntry[];
}

