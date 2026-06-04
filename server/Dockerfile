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

# .env 在运行时通过 volume 挂载，或从构建上下文复制
# 默认复制一份，实际部署时可通过 volume 覆盖
COPY .env .env

EXPOSE 8080

CMD ["./blog-server"]
