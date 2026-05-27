'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import articlesData from '@/data/articles.json';

const STORAGE_KEY = 'articles-sidebar-expanded';

function loadExpanded(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

interface Article {
  id: string;
  title: string;
}

interface ArticlesSidebarProps {
  currentId?: string;
}

export default function ArticlesSidebar({ currentId }: ArticlesSidebarProps) {
  const articles: Article[] = articlesData;

  // 所有 x-0 章节
  const categories = articles.filter((a) => /^\d+-0$/.test(a.id));

  // 展开状态：记录哪些 x 前缀已展开，从 localStorage 读取
  const [expanded, setExpanded] = useState<Set<string>>(loadExpanded);

  // 切换到索引页时重置为全部收起
  useEffect(() => {
    if (currentId === '0') {
      setExpanded(new Set());
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentId]);

  // 状态变化时写入 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...expanded]));
  }, [expanded]);

  const toggleExpand = (prefix: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(prefix)) {
        next.delete(prefix);
      } else {
        next.add(prefix);
      }
      return next;
    });
  };

  // 获取某个分类下的子文章
  const getSubArticles = (prefix: string) =>
    articles.filter((a) => a.id.startsWith(`${prefix}-`) && !/^\d+-0$/.test(a.id));

  // 判断是否为活跃项
  const isActive = (id: string) => currentId === id;

  return (
    <aside style={{ width: 220, borderRight: '1px solid var(--border-color, #ccc)', position: 'fixed', top: 110, left: '10%', bottom: '3rem', overflowY: 'auto', zIndex: 5, paddingBottom: '1rem' }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {categories.map((cat) => {
          const prefix = cat.id.split('-')[0];
          const isOpen = expanded.has(prefix);
          const subArticles = getSubArticles(prefix);

          return (
            <li key={cat.id}>
              {/* 章节行 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Link
                  href={`/articles/${cat.id}`}
                  onClick={() => {
                    if (!isOpen) {
                      toggleExpand(prefix);
                    }
                  }}
                  style={{
                    width: '170px',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: isActive(cat.id) ? 600 : 400,
                    color: isActive(cat.id) ? '#808080' : 'inherit',
                    padding: '3px 6px',
                  }}
                >
                  {cat.title}
                </Link>
                {subArticles.length > 0 && (
                  <button
                    onClick={() => toggleExpand(prefix)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-color, #ccc)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: '3px 4px',
                      color: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                    }}
                    aria-label={isOpen ? '收起' : '展开'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 子文章列表（带动画展开/收起） */}
              <div
                style={{
                  overflow: 'hidden',
                  maxHeight: isOpen ? `${subArticles.length * 40}px` : '0px',
                  opacity: isOpen ? 1 : 0,
                  transition: 'max-height 0.3s ease, opacity 0.3s ease',
                }}
              >
                <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0 16px', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                  {subArticles.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/articles/${sub.id}`}
                        style={{
                          display: 'block',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          color: isActive(sub.id) ? '#808080' : 'inherit',
                          fontWeight: isActive(sub.id) ? 600 : 400,
                          padding: '3px 6px',
                        }}
                      >
                        {sub.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
