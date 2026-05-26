import { notFound } from 'next/navigation';
import articlesData from '@/data/articles.json';
import { processArticleContent } from '../_lib/content';
import ArticlesSidebar from '../_components';
import TocMenu from '../_components/menu';

interface Article {
  id: string;
  title: string;
  date: string;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articles: Article[] = articlesData;
  const article = articles.find((a) => a.id === id);

  if (!article) {
    notFound();
  }

  const { content, headings } = processArticleContent(id);

  return (
    <div>
      <ArticlesSidebar currentId={id} />
      <main style={{ marginLeft: 'calc(220px + 2rem)', marginRight: 'calc(200px + 2rem)', paddingBottom: 'calc(100vh - 150px)' }}>
        <article>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {article.title}
          </h1>
          <time
            dateTime={article.date}
            style={{ display: 'block', marginBottom: '1.5rem', color: 'var(--text)', opacity: 0.6, fontSize: '0.875rem' }}
          >
            {article.date}
          </time>
          <div className="article-content" dangerouslySetInnerHTML={{ __html: content }} />
        </article>
      </main>
      <TocMenu headings={headings} />
    </div>
  );
}
