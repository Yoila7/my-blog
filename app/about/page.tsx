import { readFileSync } from 'fs';
import { join } from 'path';

export default function About() {
  const filePath = join(process.cwd(), 'app', 'about', 'page.html');
  const content = readFileSync(filePath, 'utf-8');

  return (
    <div className="article-content" dangerouslySetInnerHTML={{ __html: content }} />
  );
}
