// netlify/functions/proxy.ts

const TARGET = "https://generativelanguage.googleapis.com";

export default async function handler(request: Request) {
  // 重建完整目标路径
  const targetUrl = new URL(request.url);
  targetUrl.hostname = new URL(TARGET).hostname;
  targetUrl.protocol = "https:";

  // 透传请求（保留所有原始headers）
  const response = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: "follow"
  });

  // 透传响应（完全原样返回）
  return response;
}

export const config = {
  path: "/*",
  excludedPattern: "^/_next/.*"  // 排除Next.js相关路径（如有需要）
};