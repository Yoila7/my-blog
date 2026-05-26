import { readFileSync } from 'fs';
import { join } from 'path';

export default function Journal() {
  const filePath = join(process.cwd(), 'app', 'journal', 'page.html');
  const content = readFileSync(filePath, 'utf-8');

  return (
    <div className="article-content journal-list" dangerouslySetInnerHTML={{ __html: content }} />
  );
}
