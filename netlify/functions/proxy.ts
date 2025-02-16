// netlify/functions/proxy.ts


const TARGET = "https://generativelanguage.googleapis.com";

export default async function handler(request: Request) {
  // 构建目标URL
  const url = new URL(request.url);
  const targetUrl = new URL(url.pathname + url.search, TARGET);

  // 透传请求
  const response = await fetch(targetUrl.toString(), {
    method: request.method,
    headers: new Headers({
      ...Object.fromEntries(request.headers),
      Host: targetUrl.hostname  // 关键：强制设置目标Host头
    }),
    body: request.body,
    redirect: "follow"
  });

  // 透传响应
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

export const config = {
  path: "/*"
};