// netlify/functions/proxy.ts

const TARGET_HOST = "generativelanguage.googleapis.com";

export default async function handler(request: Request) {
  try {
    // 重构目标URL（关键修正点）
    const targetUrl = new URL(request.url);
    targetUrl.host = TARGET_HOST;
    targetUrl.protocol = "https:";

    // 强制覆盖Host头
    const headers = new Headers(request.headers);
    headers.set("Host", TARGET_HOST);

    // 转发请求
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: "follow"
    });

    // 返回原始响应
    return response;
  } catch (error) {
    return new Response(`Proxy Error: ${error.message}`, { status: 500 });
  }
}

export const config = {
  path: "/*",
  onError: "bypass"
};