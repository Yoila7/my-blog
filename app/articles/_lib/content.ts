import { readFileSync } from 'fs';
import { join } from 'path';

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3 | 4 | 5 | 6;
}

export function getArticleContent(id: string): string {
  const filePath = join(process.cwd(), 'data', 'articles', `${id}.html`);
  return readFileSync(filePath, 'utf-8');
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w一-鿿-]/g, '');
}

/** 从 HTML 中提取 h2/h3 标题，并为标签注入 id 属性 */
export function processArticleContent(id: string): {
  content: string;
  headings: Heading[];
} {
  const raw = getArticleContent(id);
  const headings: Heading[] = [];
  let index = 0;

  const usedIds = new Set<string>();

  const content = raw.replace(
    /<h([2-6])([^>]*)>([\s\S]*?)<\/h[2-6]>/gi,
    (_match: string, level: string, attrs: string, text: string) => {
      const lv = Number(level) as 2 | 3 | 4 | 5 | 6;
      const cleanText = text.replace(/<[^>]+>/g, '').trim();
      let slug = slugify(cleanText) || 'heading';
      // 去重：若 slug 已存在，追加序号
      if (usedIds.has(slug)) {
        let n = 2;
        while (usedIds.has(`${slug}-${n}`)) n++;
        slug = `${slug}-${n}`;
      }
      usedIds.add(slug);
      index++;
      headings.push({ id: slug, text: cleanText, level: lv });
      return `<h${lv}${attrs} id="${slug}">${text}</h${lv}>`;
    }
  );

  return { content, headings };
}
