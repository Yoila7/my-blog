'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import homeIcon from './icon/home.svg';
import sunIcon from './icon/sun.svg';
import moonIcon from './icon/moon.svg';
import gitIcon from './icon/git.svg';
import { getApiBase } from '@/app/_lib/api-base';

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
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 主题
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const shouldBeDark = saved === 'dark';
    setIsDark(shouldBeDark);
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
  }, []);

  // 登录状态
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
      fetch(`${getApiBase()}/api/auth/me`, {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((user) => {
          if (user) {
            setUsername(user.username);
            setAvatarUrl(user.avatar_url);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        });
    }
  }, []);

  // 点击菜单外关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleLogin = async () => {
    localStorage.setItem('returnTo', window.location.pathname);
    const res = await fetch(`${getApiBase()}/api/auth/login-url`);
    const data = await res.json();
    window.location.href = data.url;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsername(null);
    setAvatarUrl(null);
    setMenuOpen(false);
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg)' }}>
      <div style={styles.topRow}>
        <Link href="/" style={styles.brand} title="主页">
          <span style={maskStyle(homeIcon.src)} />
          My Notebook
        </Link>

        <div style={styles.topRight}>
          <button onClick={toggleTheme} style={styles.iconBtn} title={isDark ? '切换到浅色模式' : '切换到深色模式'}>
            {isDark ? (
              <img src={moonIcon.src} alt="深色模式" width={24} height={24} />
            ) : (
              <img src={sunIcon.src} alt="浅色模式" width={24} height={24} />
            )}
          </button>
          <a href="#" target="_blank" rel="noopener noreferrer" style={styles.iconBtn} title="Git项目仓库">
            <span style={maskStyle(gitIcon.src)} />
          </a>

          {/* 登录 / 用户信息 */}
          {token ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '4px 10px 4px 4px',
                  border: '1px solid var(--border-color, #ccc)',
                  borderRadius: '20px', background: 'none', color: 'inherit',
                  cursor: 'pointer', fontSize: '0.85rem',
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" width={24} height={24} style={{ borderRadius: '50%' }} />
                ) : (
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--border-color)', display: 'inline-block' }} />
                )}
                <span>{username || '...'}</span>
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: '120px',
                  border: '1px solid var(--border-color)', borderRadius: '6px',
                  background: 'var(--bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 20, overflow: 'hidden',
                }}>
                  <button onClick={handleLogout} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 14px', border: 'none', background: 'none',
                    color: 'inherit', cursor: 'pointer', fontSize: '0.85rem',
                  }}>
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleLogin} style={{
              padding: '6px 14px',
              border: '1px solid var(--border-color, #ccc)',
              borderRadius: '6px', background: 'none', color: 'inherit',
              cursor: 'pointer', fontSize: '0.85rem',
            }}>
              登录
            </button>
          )}
        </div>
      </div>

      <nav style={styles.navRow}>
        <Link href="/" style={styles.navLink}>首页</Link>
        <Link href="/articles" style={styles.navLink}>学习笔记</Link>
        <Link href="/journal" style={styles.navLink}>项目日志</Link>
      </nav>
    </header>
  );
}

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
