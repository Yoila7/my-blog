import { notFound } from 'next/navigation';
import { fetchArticles, fetchArticle, type Heading } from '../_lib/api';
import ArticlesSidebar from '../_components';
import TocMenu from '../_components/menu';

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let article;
  try {
    article = await fetchArticle(id);
  } catch {
    notFound();
  }

  // 仍然用 processArticleContent 来提取标题和注入 ID
  const { content, headings } = processArticleContentLocal(article.content);

  const articles = await fetchArticles();

  return (
    <div>
      <ArticlesSidebar currentId={id} articles={articles} />
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

/** 纯字符串版本，不读文件 */
function processArticleContentLocal(raw: string): {
  content: string;
  headings: Heading[];
} {
  const headings: Heading[] = [];
  const usedIds = new Set<string>();

  function slugify(text: string): string {
    return text.trim().toLowerCase().replace(/[\s]+/g, '-').replace(/[^\w一-鿿-]/g, '');
  }

  const processed = raw.replace(
    /<h([2-6])([^>]*)>([\s\S]*?)<\/h[2-6]>/gi,
    (_match: string, level: string, attrs: string, text: string) => {
      const lv = Number(level) as Heading['level'];
      const cleanText = text.replace(/<[^>]+>/g, '').trim();
      let slug = slugify(cleanText) || 'heading';
      if (usedIds.has(slug)) {
        let n = 2;
        while (usedIds.has(`${slug}-${n}`)) n++;
        slug = `${slug}-${n}`;
      }
      usedIds.add(slug);
      headings.push({ id: slug, text: cleanText, level: lv });
      return `<h${lv}${attrs} id="${slug}">${text}</h${lv}>`;
    }
  );

  return { content: processed, headings };
}