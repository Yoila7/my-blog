// 根据运行环境获取 API 基地址（客户端和服务端通用）
export function getApiBase(): string {
  // Docker/生产环境：NEXT_PUBLIC_API_URL 已设置（空串=同源，完整URL=自定义）
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_API_URL !== undefined
  ) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // 浏览器环境：自动推导 hostname + 8080
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  // SSR 回退
  return "http://localhost:8080";
}
