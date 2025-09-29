// DataForSEO API Types
export interface DataForSEOKeywordDataRequest {
  keyword: string;
  location_code?: number;
  language_code?: string;
  limit?: number;
}

export interface DataForSEOKeywordResult {
  keyword: string;
  location_code: number;
  language_code: string;
  search_volume: number;
  cpc: number;
  competition: number;
  competition_level: 'LOW' | 'MEDIUM' | 'HIGH';
  search_intent: string;
  categories: string[];
  monthly_searches: MonthlySearch[];
  keyword_info: {
    search_volume: number;
    cpc: number;
    competition: number;
    competition_level: 'LOW' | 'MEDIUM' | 'HIGH';
    low_top_of_page_bid: number;
    high_top_of_page_bid: number;
    search_volume_trend: {
      month: number;
      year: number;
      search_volume: number;
    };
  };
  keyword_properties: {
    keyword: string;
    keyword_difficulty: number;
    search_intent: string;
    categories: string[];
  };
  impressions_info: {
    match_type: string;
    ad_position_min: number;
    ad_position_max: number;
    ad_position_average: number;
    cpc_min: number;
    cpc_max: number;
    cpc_average: number;
    daily_impressions_min: number;
    daily_impressions_max: number;
    daily_impressions_average: number;
    daily_clicks_min: number;
    daily_clicks_max: number;
    daily_clicks_average: number;
    daily_cost_min: number;
    daily_cost_max: number;
    daily_cost_average: number;
  };
  data_for_seo_info: {
    last_updated_time: string;
    previous_updated_time: string;
  };
}

export interface MonthlySearch {
  month: number;
  year: number;
  search_volume: number;
}

export interface DataForSEOApiResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api: string;
      function: string;
      keyword: string;
      location_code: number;
      language_code: string;
      limit: number;
    };
    result: DataForSEOKeywordResult[];
  }>;
}

export interface KeywordSearchState {
  query: string;
  results: DataForSEOKeywordResult[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}
