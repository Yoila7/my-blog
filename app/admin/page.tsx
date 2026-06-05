"use client";

import { useState, useEffect, useCallback } from "react";

// 根据运行环境获取 API 地址
function getApiBase(): string {
  const configured =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_API_URL !== undefined
      ? process.env.NEXT_PUBLIC_API_URL
      : undefined;
  if (configured !== undefined) return configured;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  return "http://localhost:8080";
}

interface ArticleData {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface UserData {
  id: number;
  username: string;
  avatar_url: string;
  is_admin: boolean;
  github_id: number;
  created_at: string;
}

interface CommentData {
  id: number;
  article_id: string;
  username: string;
  content: string;
  likes: number;
  created_at: string;
}

type TabKey = "articles" | "users" | "comments";

export default function AdminPage() {
  // 登录状态
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  // 数据
  const [tab, setTab] = useState<TabKey>("articles");
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);

  // 编辑
  const [editingArticle, setEditingArticle] = useState<ArticleData | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");
  // 编辑评论
  const [editingComment, setEditingComment] = useState<CommentData | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  // 初始化
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!stored) {
      setChecking(false);
      return;
    }
    setToken(stored);
    fetch(`${getApiBase()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((r) => {
        if (!r.ok) {
          // token 过期才清除
          localStorage.removeItem("token");
          alert("登录已过期，请重新登录");
          window.location.href = "/";
          return null;
        }
        return r.json();
      })
      .then((user) => {
        if (!user) return;
        setUsername(user.username);
        setAvatarUrl(user.avatar_url);
        if (!user.is_admin) {
          alert("该账号无权访问，即将返回主页");
          window.location.href = "/";
        } else {
          setIsAdmin(true);
        }
      })
      .finally(() => setChecking(false));
  }, []);

  // 加载全部数据（页面初始化时一次性拉取）
  const loadAllData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const endpoints: Record<TabKey, string> = {
      articles: "/api/admin/articles",
      users: "/api/admin/users",
      comments: "/api/admin/comments",
    };
    const [ar, ur, cr] = await Promise.all([
      fetch(`${getApiBase()}${endpoints.articles}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() : []),
      fetch(`${getApiBase()}${endpoints.users}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() : []),
      fetch(`${getApiBase()}${endpoints.comments}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() : []),
    ]);
    setArticles(ar);
    setUsers(ur);
    setComments(cr);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (isAdmin) loadAllData();
  }, [isAdmin, loadAllData]);

  // 删除
  const handleDelete = async (type: TabKey, id: string | number) => {
    if (!token || !confirm(`确定删除？`)) return;
    const ep = `/api/admin/${type}/${id}`;
    const res = await fetch(`${getApiBase()}${ep}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) loadAllData();
  };

  // 保存文章编辑
  const handleSaveArticle = async () => {
    if (!token || !editingArticle) return;
    const res = await fetch(
      `${getApiBase()}/api/admin/articles/${editingArticle.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          date: editDate,
        }),
      }
    );
    if (res.ok) {
      setEditingArticle(null);
      loadAllData();
    }
  };

  const startEdit = (a: ArticleData) => {
    setEditingArticle(a);
    setEditTitle(a.title);
    setEditContent(a.content);
    setEditDate(a.date);
  };

  // 保存评论编辑
  const handleSaveComment = async () => {
    if (!token || !editingComment) return;
    const res = await fetch(
      `${getApiBase()}/api/admin/comments/${editingComment.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editCommentContent }),
      }
    );
    if (res.ok) {
      setEditingComment(null);
      loadAllData();
    }
  };

  const startEditComment = (c: CommentData) => {
    setEditingComment(c);
    setEditCommentContent(c.content);
  };

  // 登录
  const handleLogin = async () => {
    localStorage.setItem("returnTo", "/admin");
    const res = await fetch(`${getApiBase()}/api/auth/login-url`);
    const data = await res.json();
    window.location.href = data.url;
  };

  if (checking) {
    return (
      <div style={{ padding: "3rem 10%", textAlign: "center", opacity: 0.5 }}>
        验证权限中...
      </div>
    );
  }

  // 未登录
  if (!token) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <button
          onClick={handleLogin}
          style={{
            padding: "12px 32px",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            background: "none",
            color: "var(--text)",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          登录
        </button>
      </div>
    );
  }

  // 非管理员
  if (!isAdmin) return null;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "articles", label: `文章 (${articles.length})` },
    { key: "users", label: `用户 (${users.length})` },
    { key: "comments", label: `评论 (${comments.length})` },
  ];

  return (
    <div
      style={{
        padding: "2rem 5%",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* 用户信息 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "1.5rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt=""
            width={32}
            height={32}
            style={{ borderRadius: "50%" }}
          />
        )}
        <span style={{ fontWeight: 600 }}>{username}</span>
        <span
          style={{
            fontSize: "0.75rem",
            padding: "2px 8px",
            border: "1px solid #e0245e",
            borderRadius: "10px",
            color: "#e0245e",
          }}
        >
          管理员
        </span>
      </div>

      {/* Tab 切换 */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "1rem" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "6px 16px",
              border:
                tab === t.key
                  ? "1px solid var(--text)"
                  : "1px solid var(--border-color)",
              borderRadius: "6px 6px 0 0",
              background: tab === t.key ? "var(--border-color)" : "none",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 数据区域 */}
      <div
        style={{
          border: "1px solid var(--border-color)",
          borderRadius: "0 8px 8px 8px",
          overflow: "auto",
          maxHeight: "60vh",
        }}
      >
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", opacity: 0.5 }}>
            加载中...
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr
                style={{
                  position: "sticky",
                  top: 0,
                  background: "var(--bg)",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                {tab === "articles" && (
                  <>
                    <th style={th}>ID</th>
                    <th style={th}>标题</th>
                    <th style={th}>日期</th>
                    <th style={th}>操作</th>
                  </>
                )}
                {tab === "users" && (
                  <>
                    <th style={th}>ID</th>
                    <th style={th}>用户名</th>
                    <th style={th}>GitHub ID</th>
                    <th style={th}>管理员</th>
                    <th style={th}>注册时间</th>
                    <th style={th}>操作</th>
                  </>
                )}
                {tab === "comments" && (
                  <>
                    <th style={th}>ID</th>
                    <th style={th}>文章</th>
                    <th style={th}>用户</th>
                    <th style={th}>内容</th>
                    <th style={th}>点赞</th>
                    <th style={th}>时间</th>
                    <th style={th}>操作</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tab === "articles" &&
                articles.map((a) => (
                  <tr key={a.id} style={trStyle}>
                    <td style={td}>{a.id}</td>
                    <td style={td}>{a.title}</td>
                    <td style={td}>{a.date}</td>
                    <td style={td}>
                      <button
                        onClick={() => startEdit(a)}
                        style={btnSm}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete("articles", a.id)}
                        style={{ ...btnSm, color: "#e0245e" }}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              {tab === "users" &&
                users.map((u) => (
                  <tr key={u.id} style={trStyle}>
                    <td style={td}>{u.id}</td>
                    <td style={td}>{u.username}</td>
                    <td style={td}>{u.github_id}</td>
                    <td style={td}>{u.is_admin ? "是" : "否"}</td>
                    <td style={td}>{u.created_at?.split("T")[0]}</td>
                    <td style={td}>
                      <button
                        onClick={() => handleDelete("users", u.id)}
                        style={{ ...btnSm, color: "#e0245e" }}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              {tab === "comments" &&
                comments.map((c) => (
                  <tr key={c.id} style={trStyle}>
                    <td style={td}>{c.id}</td>
                    <td style={td}>{c.article_id}</td>
                    <td style={td}>{c.username}</td>
                    <td style={{ ...td, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.content}</td>
                    <td style={td}>{c.likes}</td>
                    <td style={td}>{c.created_at?.split("T")[0]}</td>
                    <td style={td}>
                      <button onClick={() => startEditComment(c)} style={btnSm}>
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete("comments", c.id)}
                        style={{ ...btnSm, color: "#e0245e" }}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 编辑文章弹窗 */}
      {editingArticle && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}
          onClick={() => setEditingArticle(null)}
        >
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.5rem",
              width: "90%",
              maxWidth: "700px",
              maxHeight: "85vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>编辑文章: {editingArticle.id}</h3>
            <label style={labelStyle}>
              标题
              <input
                style={inputStyle}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </label>
            <label style={labelStyle}>
              日期
              <input
                style={inputStyle}
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </label>
            <label style={labelStyle}>
              内容 (HTML)
              <textarea
                style={{ ...inputStyle, minHeight: "300px", fontFamily: "monospace" }}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </label>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "1rem",
              }}
            >
              <button
                onClick={() => setEditingArticle(null)}
                style={{
                  ...btnSm,
                  background: "none",
                  color: "var(--text)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  padding: "6px 16px",
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveArticle}
                style={{
                  ...btnSm,
                  background: "var(--text)",
                  color: "var(--bg)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 16px",
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑评论弹窗 */}
      {editingComment && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 100,
          }}
          onClick={() => setEditingComment(null)}
        >
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px", padding: "1.5rem",
              width: "90%", maxWidth: "600px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>
              编辑评论 #{editingComment.id} ({editingComment.username})
            </h3>
            <label style={labelStyle}>
              内容
              <textarea
                style={{ ...inputStyle, minHeight: "150px" }}
                value={editCommentContent}
                onChange={(e) => setEditCommentContent(e.target.value)}
              />
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "1rem" }}>
              <button onClick={() => setEditingComment(null)} style={{ ...btnSm, background: "none", color: "var(--text)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "6px 16px" }}>取消</button>
              <button onClick={handleSaveComment} style={{ ...btnSm, background: "var(--text)", color: "var(--bg)", border: "none", borderRadius: "6px", padding: "6px 16px" }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 表格样式
const th: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontWeight: 600,
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid var(--border-color, #333)",
};
const trStyle: React.CSSProperties = {};
const btnSm: React.CSSProperties = {
  padding: "2px 10px",
  border: "1px solid var(--border-color)",
  borderRadius: "4px",
  background: "none",
  color: "var(--text)",
  cursor: "pointer",
  fontSize: "0.8rem",
  marginRight: "6px",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.75rem",
  fontSize: "0.85rem",
  fontWeight: 600,
};
const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "4px",
  padding: "8px 10px",
  border: "1px solid var(--border-color)",
  borderRadius: "6px",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: "0.9rem",
};
