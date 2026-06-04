'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// 根据运行环境获取 API 地址：
// - 设了 NEXT_PUBLIC_API_URL（Docker 中为空串=同源）：直接用
// - 未设置（本地开发）：动态取浏览器地址 + :8080
function getApiBase(): string {
  const configured =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL !== undefined
      ? process.env.NEXT_PUBLIC_API_URL
      : undefined;

  if (configured !== undefined) {
    return configured; // 空串表示同源，非空表示自定义地址
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  return 'http://localhost:8080'; // SSR 回退
}

interface CommentData {
  id: number;
  article_id: string;
  username: string;
  avatar_url: string;
  content: string;
  likes: number;
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
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
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
      loadMyLikesWithToken(stored);
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

  // 加载当前用户点赞过的评论 ID
  const loadMyLikesWithToken = async (t: string) => {
    try {
      const res = await fetch(`${getApiBase()}/api/auth/likes`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const ids: number[] = await res.json();
        setLikedIds(new Set(ids));
      }
    } catch {}
  };

  // 点赞/取消点赞
  const handleLike = async (commentId: number) => {
    if (!token) return;
    const wasLiked = likedIds.has(commentId);
    // 乐观更新
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, likes: c.likes + (wasLiked ? -1 : 1) } : c
      )
    );
    try {
      const res = await fetch(`${getApiBase()}/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('failed');
    } catch {
      // 回滚
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(commentId);
        else next.delete(commentId);
        return next;
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, likes: c.likes + (wasLiked ? 1 : -1) } : c
        )
      );
    }
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
                  {/* 点赞按钮 */}
                  <button
                    onClick={() => handleLike(c.id)}
                    title={likedIds.has(c.id) ? '取消点赞' : '点赞'}
                    style={{
                      position: 'relative',
                      width: '24px', height: '24px', padding: 0,
                      border: 'none', background: 'none',
                      cursor: token ? 'pointer' : 'default',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <img
                      src="/like.svg"
                      alt="like"
                      style={{
                        width: '16px', height: '16px',
                        filter: likedIds.has(c.id)
                          ? 'invert(17%) sepia(95%) saturate(6934%) hue-rotate(358deg) brightness(100%) contrast(117%)'
                          : 'none',
                        opacity: likedIds.has(c.id) ? 1 : 0.4,
                      }}
                    />
                    {c.likes > 0 && (
                      <span style={{
                        position: 'absolute', bottom: '-2px', right: '-4px',
                        fontSize: '0.55rem', lineHeight: 1,
                        color: likedIds.has(c.id) ? '#e0245e' : 'inherit',
                        opacity: likedIds.has(c.id) ? 1 : 0.5,
                      }}>
                        {c.likes}
                      </span>
                    )}
                  </button>
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
