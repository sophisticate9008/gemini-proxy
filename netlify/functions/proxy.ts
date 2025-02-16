import { Context } from "@netlify/edge-functions";

const pickHeaders = (headers: Headers, keys: (string | RegExp)[]): Headers => {
  const picked = new Headers();
  for (const key of headers.keys()) {
    if (keys.some((k) => (typeof k === "string" ? k === key : k.test(key)))) {
      const value = headers.get(key);
      if (typeof value === "string") {
        picked.set(key, value);
      }
    }
  }
  return picked;
};

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, x-goog-api-client, x-goog-api-key, Accept-Encoding",
};

export default async (request: Request, context: Context) => {

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  const { pathname, searchParams } = new URL(request.url);

  // 根路径提供自定义的 HTML 内容
  if (pathname === "/") {
    let blank_html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Google PaLM API Proxy on Netlify Edge</title>
</head>
<body>
  <h1>Google PaLM API Proxy on Netlify Edge</h1>
  <p>Tips: This project uses a reverse proxy to solve issues like location restrictions in Google APIs.</p>
  <p>If you have any of the following requirements, this project might help:</p>
  <ul>
    <li>When you see the error message "User location is not supported for the API use" when calling the Google PaLM API.</li>
    <li>You want to customize the Google PaLM API.</li>
  </ul>
  <p>For more details, visit <a href="https://simonmy.com/posts/使用netlify反向代理google-palm-api.html">this page</a>.</p>
</body>
</html>
    `;
    return new Response(blank_html, {
      headers: {
        ...CORS_HEADERS,
        "content-type": "text/html",
      },
    });
  }

  // 拼接目标 URL
  const url = new URL(pathname, "https://generativelanguage.googleapis.com");
  searchParams.delete("_path");

  // 将查询参数添加到目标 URL 中
  searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  // 选取要传递给目标 API 的 headers
  const headers = pickHeaders(request.headers, ["content-type", "x-goog-api-client", "x-goog-api-key", "accept-encoding"]);

  try {
    // 使用 fetch 进行转发请求
    const response = await fetch(url, {
      body: request.body,
      method: request.method,
      headers,
    });

    // 确保响应体不为空，并返回合适的响应类型
    const contentType = response.headers.get("Content-Type");
    const responseBody = contentType && contentType.includes("application/json")
      ? await response.json()  // 处理 JSON 响应
      : await response.text(); // 如果是非 JSON 响应，处理为文本

    const responseHeaders = {
      ...CORS_HEADERS,
      ...Object.fromEntries(response.headers),
    };

    return new Response(JSON.stringify(responseBody), {
      headers: responseHeaders,
      status: response.status,
    });

  } catch (error) {
    // 错误处理
    return new Response(JSON.stringify({ error: "Failed to fetch the URL" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
