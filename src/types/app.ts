export interface ArticleMeta {
  title: string;
  author: string;
  digest: string;
  article_type?: 'news' | 'newspic';
  images?: string[];
  cover?: string;
  thumb_media_id?: string;
  comment: boolean;
  source_url?: string;
  theme: string;
  code_theme: string;
}

export interface PublishLogItem {
  step: number;
  msg: string;
  status: 'running' | 'done' | 'skip';
  timestamp: string;
}

export interface PublishHistoryItem {
  hash: string;
  media_id: string;
  title: string;
  author?: string;
  theme?: string;
  article_type?: 'news' | 'newspic';
  images_count?: number;
  published_at: string;
}

export interface ImageItem {
  src: string;
  isRemote: boolean;
  status: 'ready' | 'uploaded' | 'missing';
  mmbizUrl?: string;
}
