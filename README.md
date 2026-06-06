# My Notebook — 个人学习笔记博客

基于 **Next.js 16 + Go (Gin/GORM) + SQLite** 的全栈个人博客，支持 GitHub OAuth 登录、评论点赞、文章管理、Docker 容器化部署和 CI/CD 自动构建。

---

## 功能特性

### 前端
- **文章系统**：层级目录侧边栏、TOC 导航、代码高亮
- **评论系统**：GitHub OAuth 登录、发表/删除评论、点赞/取消（乐观更新）
- **管理面板**：`/admin` 路由（无链接入口），管理员可编辑删除文章/用户/评论
- **主题切换**：亮色/暗色，基于 `data-theme` 属性 + CSS 变量
- **项目日志**：时间线样式（`/journal`）
- **关于页**：静态 HTML 渲染（`/about`）

### 后端
- **RESTful API**：文章 CRUD、评论 CRUD、用户管理、点赞系统
- **GitHub OAuth 2.0**：JWT 鉴权（7 天有效期）、管理员权限控制
- **SQLite 数据库**：纯 Go 驱动（`glebarez/sqlite`），零依赖
- **种子数据**：容器启动时自动从 HTML 文件导入文章

### DevOps
- **Docker Compose**：三服务编排（frontend + backend + nginx），volume 持久化
- **GitHub Actions CI/CD**：推送自动编译检查 → 构建镜像 → 推送到 ghcr.io
- **Windows 反向代理**：`portproxy/` 解决 Docker Desktop 端口映射限制

---

## 项目结构

```
my-blog/
├── app/                          # Next.js 前端 (App Router)
│   ├── _lib/api-base.ts          #   共享 API 地址工具
│   ├── layout.tsx                #   根布局 (Header/Footer/主题)
│   ├── globals.css               #   全局样式 + CSS 变量
│   ├── page.tsx                  #   首页
│   ├── articles/
│   │   ├── _lib/api.ts           #   SSR API 调用 (文章)
│   │   ├── _components/
│   │   │   ├── index.tsx         #   左侧文章目录侧边栏
│   │   │   ├── menu.tsx          #   右侧 TOC 导航
│   │   │   └── comments.tsx      #   评论区组件
│   │   ├── page.tsx              #   文章索引页
│   │   └── [id]/page.tsx         #   文章详情页
│   ├── admin/page.tsx            #   管理面板
│   ├── about/page.tsx            #   关于页
│   └── journal/page.tsx          #   项目日志
├── components/
│   ├── Header.tsx                #   导航栏 (sticky)
│   ├── Footer.tsx                #   页脚 (fixed)
│   ├── AuthProvider.tsx          #   OAuth token 处理
│   └── icon/                     #   SVG 图标
├── server/                       # Go 后端
│   ├── main.go                   #   入口 + 路由注册
│   ├── config/config.go          #   配置加载 (.env)
│   ├── database/database.go      #   数据库初始化
│   ├── models/                   #   GORM 模型
│   │   ├── article.go
│   │   ├── comment.go            #   Comment + CommentLike
│   │   └── user.go
│   ├── handlers/                 #   请求处理器
│   │   ├── article.go
│   │   ├── auth.go               #   OAuth + JWT
│   │   ├── comment.go            #   评论 + 点赞
│   │   └── admin.go              #   管理 API
│   ├── middleware/auth.go        #   JWT + Admin 中间件
│   ├── cmd/seed/main.go          #   文章种子工具
│   ├── data/                     #   种子数据
│   │   ├── articles.json
│   │   └── articles/*.html
│   ├── Dockerfile
│   ├── entrypoint.sh             #   启动脚本 (seed → server)
│   └── .env                      #   环境变量 (不入 git)
├── portproxy/                    #   Windows TCP 代理
│   └── main.go
├── nginx/nginx.conf              #   反向代理配置
├── docker-compose.yml
├── Dockerfile.frontend
└── .github/workflows/ci.yml      #   CI/CD 流水线
```

---

## 快速开始

### 本地开发

```bash
# 终端 1 — Go 后端
cd server
go build -o blog-server.exe .
./blog-server.exe

# 终端 2 — Next.js 前端
npx next dev
```

访问 `http://localhost:3000`

### Docker 启动

```bash
# 构建并启动
docker compose up -d --build

# Windows 额外需要：停掉 nginx 容器 + 启动 Go 代理（管理员）
docker compose stop nginx
cd portproxy
go build -o tcp-proxy.exe . && .\tcp-proxy.exe
```

访问 `http://localhost`（或 `http://<本机IP>`）

---

## 环境变量

后端配置在 `server/.env`（不含 secrets 的模板）：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SERVER_URL` | 后端对外地址 | `http://localhost:8080` |
| `PORT` | 后端端口 | `8080` |
| `DB_PATH` | SQLite 路径 | 自动解析 |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID | — |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret | — |
| `JWT_SECRET` | JWT 签名密钥 | — |
| `ADMIN_GITHUB_USERNAMES` | 管理员 GitHub 用户名（逗号分隔） | — |
| `FRONTEND_URL` | 前端地址（登录回调） | 从 SERVER_URL 推导 |
| `HTTPS_PROXY` | 代理地址（可选） | — |

---

## API 路由

### 公开接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/articles` | 文章列表（元数据） |
| GET | `/api/articles/:id` | 文章详情（含内容） |
| GET | `/api/articles/:id/comments` | 文章评论 |
| GET | `/api/auth/login-url` | 获取 GitHub 登录链接 |
| GET | `/api/auth/callback` | GitHub OAuth 回调 |

### 需登录
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/me` | 当前用户信息 |
| GET | `/api/auth/likes` | 用户已点赞的评论 ID |
| POST | `/api/comments` | 发表评论 |
| DELETE | `/api/comments/:id` | 删除自己的评论 |
| POST | `/api/comments/:id/like` | 点赞/取消点赞 |

### 管理员
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/grant` | 授予管理员 |
| GET | `/api/admin/articles` | 文章列表（含内容） |
| PUT | `/api/admin/articles/:id` | 更新文章 |
| DELETE | `/api/admin/articles/:id` | 删除文章 |
| GET | `/api/admin/users` | 用户列表 |
| DELETE | `/api/admin/users/:id` | 删除用户 |
| GET | `/api/admin/comments` | 评论列表 |
| PUT | `/api/admin/comments/:id` | 编辑评论 |
| DELETE | `/api/admin/comments/:id` | 删除评论 |

---

## 部署到云服务器

1. **修改配置**：`server/.env` 中设置 `SERVER_URL=https://你的域名`
2. **更新 GitHub OAuth App**：回调地址改为 `https://你的域名/api/auth/callback`
3. **启动服务**：
   ```bash
   docker compose up -d
   ```
4. **Nginx + HTTPS**：用 Certbot 申请 SSL 证书，nginx 反代到本地端口

---

## 更新文章

1. 在 `server/data/articles/` 下创建/编辑 `<id>.html`
2. 更新 `server/data/articles.json` 添加条目
3. `git push` → CI/CD → 构建新镜像 → 服务器拉取 → 容器启动自动 seed

数据库中的用户、评论、点赞数据存储在 volume `./data/blog.db` 中，不会随镜像更新丢失。

---

## CI/CD

推送 `master` 分支自动触发：
1. `check-backend`：Go 编译检查
2. `check-frontend`：TypeScript + Next.js 构建检查
3. `build-and-push`：构建 Docker 镜像 → 推送到 `ghcr.io/yoila7/my-blog-backend:latest` 和 `ghcr.io/yoila7/my-blog-frontend:latest`

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| 后端框架 | Gin (Go) |
| ORM | GORM |
| 数据库 | SQLite (glebarez/sqlite) |
| 认证 | GitHub OAuth + JWT |
| 容器化 | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| 反向代理 | nginx (Linux) / Go proxy (Windows) |
