const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3 | 4 | 5 | 6;
}

export interface ArticleMeta {
  id: string;
  title: string;
  date: string;
}

export interface Article extends ArticleMeta {
  content: string;
}

export async function fetchArticles(): Promise<ArticleMeta[]> {
  const res = await fetch(`${API_BASE}/api/articles`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch articles');
  return res.json();
}

export async function fetchArticle(id: string): Promise<Article> {
  const res = await fetch(`${API_BASE}/api/articles/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Article ${id} not found`);
  return res.json();
}