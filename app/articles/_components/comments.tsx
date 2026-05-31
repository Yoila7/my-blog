'use client';

import { useState, useEffect, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function Comments() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
      setLoading(true);
      fetchUser(stored).finally(() => setLoading(false));
    }
  }, []);

  // 点击菜单外区域关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const fetchUser = async (t: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const user = await res.json();
        setUsername(user.username);
        setAvatarUrl(user.avatar_url);
      } else {
        // token 无效，清除
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch {
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  const handleLogin = async () => {
    try {
      localStorage.setItem('returnTo', window.location.pathname);
      const res = await fetch(`${API_BASE}/api/auth/login-url`);
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      console.error('获取登录链接失败', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsername(null);
    setAvatarUrl(null);
    setMenuOpen(false);
  };

  return (
    <div style={{ borderTop: '1px solid var(--border-color, #ccc)', marginTop: '3rem', paddingTop: '2rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>评论</h3>
      {token ? (
        <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px 4px 4px',
              border: '1px solid var(--border-color, #ccc)',
              borderRadius: '20px',
              background: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                width={24}
                height={24}
                style={{ borderRadius: '50%' }}
              />
            ) : (
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--border-color)', display: 'inline-block' }} />
            )}
            <span>{username || '...'}</span>
          </button>
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                minWidth: '140px',
                border: '1px solid var(--border-color, #ccc)',
                borderRadius: '6px',
                background: 'var(--bg)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 20,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={handleLogout}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 14px',
                  border: 'none',
                  background: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                退出登录
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleLogin}
          style={{
            padding: '8px 20px',
            border: '1px solid var(--border-color, #ccc)',
            borderRadius: '6px',
            background: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          登录
        </button>
      )}
    </div>
  );
}
