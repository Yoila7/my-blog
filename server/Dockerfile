# === 构建阶段 ===
FROM golang:1.26-alpine AS builder

WORKDIR /build

# 先复制依赖文件，利用 Docker 层缓存
COPY go.mod go.sum ./
RUN go mod download

# 复制源码并编译 server + seed
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o blog-server .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o seed ./cmd/seed

# === 运行阶段 ===
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /build/blog-server .
COPY --from=builder /build/seed .
# 种子数据文件打包进镜像，启动时自动导入
# seed-data: 文章种子文件（不放在 /app/data 下，避免被 volume 挂载覆盖）
COPY --from=builder /build/data ./seed-data
COPY entrypoint.sh .

# .env 由 docker-compose volume 挂载或环境变量提供，不打包进镜像

EXPOSE 8080

# 启动时先 seed 文章数据，再启动 server
RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
