export interface BacklinkItem {
  type: string;
  domain_from: string;
  url_from: string;
  url_from_https: boolean;
  domain_to: string;
  url_to: string;
  url_to_https: boolean;
  tld_from: string;
  is_new: boolean;
  is_lost: boolean;
  backlink_spam_score: number;
  rank: number;
  page_from_rank: number;
  domain_from_rank: number;
  domain_from_platform_type: string[] | null;
  domain_from_is_ip: boolean;
  domain_from_ip: string;
  domain_from_country: string | null;
  page_from_external_links: number;
  page_from_internal_links: number;
  page_from_size: number;
  page_from_encoding: string | null;
  page_from_language: string | null;
  page_from_title: string | null;
  page_from_status_code: number;
  first_seen: string;
  prev_seen: string | null;
  last_seen: string;
  item_type: string;
  attributes: string[] | null;
  dofollow: boolean;
  original: boolean;
  alt: string | null;
  image_url: string | null;
  anchor: string | null;
  text_pre: string | null;
  text_post: string | null;
  semantic_location: string | null;
  links_count: number;
  group_count: number;
  is_broken: boolean;
  url_to_status_code: number;
  url_to_spam_score: number;
  url_to_redirect_target: string | null;
  ranked_keywords_info: {
    page_from_keywords_count_top_3: number;
    page_from_keywords_count_top_10: number;
    page_from_keywords_count_top_100: number;
  };
  is_indirect_link: boolean;
  indirect_link_path: Array<{
    type: string;
    status_code: number;
    url: string;
  }> | null;
}

export interface BacklinkResult {
  target: string;
  mode: string;
  custom_mode: string | null;
  total_count: number;
  items_count: number;
  items: BacklinkItem[];
}

export interface BacklinkTask {
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
    mode: string;
    limit: number;
    offset: number;
    target: string;
    include_subdomains: boolean;
    backlinks_status_type: string;
    include_indirect_links: boolean;
  };
  result: BacklinkResult[];
}

export interface BacklinkResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: BacklinkTask[];
}
