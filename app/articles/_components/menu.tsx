'use client';

import { useState, useEffect, useRef } from 'react';
import type { Heading } from '../_lib/api';

interface TocMenuProps {
  headings: Heading[];
}

export default function TocMenu({ headings }: TocMenuProps) {
  const [activeId, setActiveId] = useState<string>('');
  const stateMap = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (headings.length === 0) return;
    const map = new Map<string, boolean>();
    stateMap.current = map;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => map.set(e.target.id, e.isIntersecting));
        // 按文档顺序找到第一个在视口内的标题
        const first = headings.find((h) => map.get(h.id));
        if (first) setActiveId(first.id);
      },
      { rootMargin: '-110px 0px -60% 0px' }
    );

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [headings]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (headings.length === 0) return null;

  return (
    <aside style={{ width: 200, borderLeft: '1px solid var(--border-color, #ccc)', paddingLeft: '1rem', position: 'fixed', top: 110, right: '10%', bottom: '3rem', overflowY: 'auto', zIndex: 5, paddingBottom: '1rem' }}>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {headings.map((h) => (
            <li key={h.id}>
              <button
                onClick={() => scrollTo(h.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: activeId === h.id ? '#808080' : 'inherit',
                  fontSize: '0.8rem',
                  fontWeight: activeId === h.id ? 600 : 400,
                  padding: `2px 0 2px ${(h.level - 2) * 0.75}rem`,
                  lineHeight: 1.4,
                  transition: 'color 0.15s ease',
                }}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
