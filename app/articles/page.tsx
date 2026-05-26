import articlesData from '@/data/articles.json';
import { getArticleContent } from './_lib/content';
import ArticlesSidebar from './_components';

interface Article {
  id: string;
  title: string;
  date: string;
}

export default function ArticlesPage() {
  const articles: Article[] = articlesData;
  const intro = articles.find((a) => a.id === '0');
  const content = intro ? getArticleContent('0') : '';

  return (
    <div>
      <ArticlesSidebar currentId="0" />
      <main style={{ marginLeft: 'calc(220px + 2rem)' }}>
        {intro && (
          <>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {intro.title}
            </h1>
            <div className="article-content" dangerouslySetInnerHTML={{ __html: content }} />
          </>
        )}
      </main>
    </div>
  );
}
