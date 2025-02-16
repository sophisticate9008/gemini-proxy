import { Context } from "@netlify/edge-functions";

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "*",
};

export default async (request: Request, context: Context) => {

  // 处理预检请求
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  // 拼接目标 URL
  const { pathname, searchParams } = new URL(request.url);
  const url = new URL(pathname, "https://generativelanguage.googleapis.com");

  // 将查询参数添加到目标 URL 中
  searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  // 将请求头传递给目标 API
  const headers = new Headers(request.headers);
  headers.set("Content-Type", "application/json");

  try {
    // 转发请求到目标 API
    const response = await fetch(url, {
      method: request.method,
      headers: headers,
      body: request.method === "POST" || request.method === "PUT" ? request.body : null,
    });

    // 将目标 API 的响应转发回客户端
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    // 错误处理
    console.error(error); // 打印错误日志
    return new Response("Error fetching the URL", { status: 500 });
  }
};
