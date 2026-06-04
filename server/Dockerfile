# === 构建阶段 ===
FROM golang:1.26-alpine AS builder

WORKDIR /build

# 先复制依赖文件，利用 Docker 层缓存
COPY go.mod go.sum ./
RUN go mod download

# 复制源码并编译
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o blog-server .

# === 运行阶段 ===
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /build/blog-server .

# .env 由 docker-compose volume 挂载或环境变量提供，不打包进镜像

EXPOSE 8080

CMD ["./blog-server"]
