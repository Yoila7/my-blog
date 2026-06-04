'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// 根据当前浏览器地址动态获取 API 地址，使从 IP 访问时也能正确请求 API
function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
}

interface CommentData {
  id: number;
  article_id: string;
  username: string;
  avatar_url: string;
  content: string;
  created_at: string;
}

export default function Comments({ articleId }: { articleId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [comments, setComments] = useState<CommentData[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 加载评论
  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/articles/${articleId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch {}
  }, [articleId]);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
      setLoading(true);
      fetchUser(stored).finally(() => setLoading(false));
    }
    loadComments();
  }, [loadComments]);

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

  // 自动调整 textarea 高度
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.max(80, el.scrollHeight) + 'px';
    }
  }, [text]);

  const fetchUser = async (t: string) => {
    try {
      const res = await fetch(`${getApiBase()}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const user = await res.json();
        setUsername(user.username);
        setAvatarUrl(user.avatar_url);
      } else {
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
      const res = await fetch(`${getApiBase()}/api/auth/login-url`);
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

  const handleDelete = async (commentId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) loadComments();
    } catch {}
  };

  const handleSubmit = async () => {
    if (!token || !text.trim()) return;
    try {
      const res = await fetch(`${getApiBase()}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ article_id: articleId, content: text.trim() }),
      });
      if (res.ok) {
        setText('');
        loadComments();
      }
    } catch {}
  };

  const formatDate = (iso: string) => iso.split('T')[0];

  return (
    <div style={{ borderTop: '1px solid var(--border-color, #ccc)', marginTop: '3rem', paddingTop: '2rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>评论</h3>

      {/* 登录 / 用户信息 */}
      <div style={{ marginBottom: '1rem' }}>
        {token ? (
          <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
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
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: '140px',
                border: '1px solid var(--border-color, #ccc)', borderRadius: '6px',
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
            padding: '8px 20px', border: '1px solid var(--border-color, #ccc)',
            borderRadius: '6px', background: 'none', color: 'inherit',
            cursor: 'pointer', fontSize: '0.9rem',
          }}>
            登录
          </button>
        )}
      </div>

      {/* 评论列表 */}
      {comments.length > 0 && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {comments.map((c) => (
            <div key={c.id} style={{
              width: '80%', margin: '0 auto', border: '1px solid var(--border-color, #ccc)',
              borderRadius: '8px', padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <a
                  href={`https://github.com/${c.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, textDecoration: 'none', color: 'inherit' }}
                >
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" width={20} height={20} style={{ borderRadius: '50%' }} />
                  ) : (
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--border-color)', display: 'inline-block' }} />
                  )}
                  <span className="comment-username" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.username}</span>
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{formatDate(c.created_at)}</span>
                  <span style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {username && username === c.username ? (
                      <button
                        onClick={() => handleDelete(c.id)}
                        title="删除"
                        style={{
                          width: '24px', height: '24px', padding: 0,
                          border: 'none', background: 'none', color: 'inherit',
                          cursor: 'pointer', fontSize: '0.8rem', opacity: 0.4,
                        }}
                      >
                        ✕
                      </button>
                    ) : null}
                  </span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* 评论输入框 */}
      <div style={{ width: '80%', margin: '0 auto' }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="写下你的评论..."
          style={{
            width: '100%', minHeight: '80px', padding: '10px 12px',
            border: '1px solid var(--border-color, #ccc)', borderRadius: '8px',
            background: 'var(--bg)', color: 'var(--text)',
            fontSize: '0.9rem', lineHeight: 1.5, resize: 'none',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          {token ? (
            <button onClick={handleSubmit} disabled={!text.trim()} style={{
              padding: '6px 18px', border: '1px solid var(--border-color, #ccc)',
              borderRadius: '6px', background: 'none', color: 'inherit',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              opacity: text.trim() ? 1 : 0.5, fontSize: '0.85rem',
            }}>
              发表
            </button>
          ) : (
            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>登录后可发表评论</span>
          )}
        </div>
      </div>
    </div>
  );
}
