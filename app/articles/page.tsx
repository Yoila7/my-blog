import { fetchArticles, fetchArticle } from './_lib/api';
import ArticlesSidebar from './_components';

export default async function ArticlesPage() {
  const articles = await fetchArticles();
  const intro = await fetchArticle('0');

  return (
    <div>
      <ArticlesSidebar currentId="0" articles={articles} />
      <div style={{ marginLeft: 'calc(220px + 2rem)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {intro.title}
        </h1>
        <div className="article-content" dangerouslySetInnerHTML={{ __html: intro.content }} />
      </div>
    </div>
  );
}