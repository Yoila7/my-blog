'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import homeIcon from './icon/home.svg';
import sunIcon from './icon/sun.svg';
import moonIcon from './icon/moon.svg';
import gitIcon from './icon/git.svg';

function maskStyle(url: string): React.CSSProperties {
  return {
    display: 'inline-block',
    width: 24,
    height: 24,
    backgroundColor: 'currentColor',
    maskImage: `url(${url})`,
    WebkitMaskImage: `url(${url})`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  };
}

export default function Header() {
  const [isDark, setIsDark] = useState(false);

  // 组件挂载时从 localStorage 读取主题偏好，并应用到 <html> 上
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const shouldBeDark = saved === 'dark';
    setIsDark(shouldBeDark);
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
  }, []);

  // 切换主题
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg)' }}>
      {/* 第一行 */}
      <div style={styles.topRow}>
        <Link href="/" style={styles.brand} title="主页">
          <span style={maskStyle(homeIcon.src)} />
          My Notebook
        </Link>

        <div style={styles.topRight}>
          <button onClick={toggleTheme} style={styles.iconBtn} title={isDark ? '深色模式' : '浅色模式'}>
            {isDark ? (
              <img src={moonIcon.src} alt="深色模式" width={24} height={24} />
            ) : (
              <img src={sunIcon.src} alt="浅色模式" width={24} height={24} />
            )}
          </button>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.iconBtn}
            title="Git项目仓库"
          >
            <span style={maskStyle(gitIcon.src)} />
          </a>
        </div>
      </div>

      {/* 第二行：导航链接 */}
      <nav style={styles.navRow}>
        <Link href="/" style={styles.navLink}>首页</Link>
        <Link href="/articles" style={styles.navLink}>学习笔记</Link>
        <Link href="/journal" style={styles.navLink}>项目日志</Link>
      </nav>
    </header>
  );
}

// 简单的内联样式（后续你可以抽成 CSS Modules 或 Tailwind）
const styles: Record<string, React.CSSProperties> = {
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 5%',
    borderBottom: '1px solid var(--border-color, #ccc)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: 700,
    textDecoration: 'none',
    color: 'inherit',
    border: '1px solid var(--border-color, #ccc)',
    borderRadius: '6px',
    padding: '4px 8px',
  },
  topRight: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'none',
    border: '1px solid var(--border-color, #ccc)',
    borderRadius: '6px',
    padding: '4px',
    fontSize: '1.5rem',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
  },
  navRow: {
    display: 'flex',
    gap: '1.5rem',
    padding: '0.5rem 5%',
    borderBottom: '1px solid var(--border-color, #ccc)',
  },
  navLink: {
    textDecoration: 'none',
    color: 'inherit',
    fontWeight: 500,
  },
};
