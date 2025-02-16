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
  "access-control-allow-methods": "*",
  "access-control-allow-headers": "*",
};

export default async (request: Request, context: Context) => {

  // OPTIONS 请求处理
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  const { pathname, searchParams } = new URL(request.url);

  // 如果是根路径，返回HTML首页
  if (pathname === "/") {
    let blank_html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Google PaLM API proxy on Netlify Edge</title>
</head>
<body>
  <h1 id="google-palm-api-proxy-on-netlify-edge">Google PaLM API proxy on Netlify Edge</h1>
  <p>Tips: This project uses a reverse proxy to solve problems such as location restrictions in Google APIs. </p>
  <p>If you have any of the following requirements, you may need the support of this project.</p>
  <ol>
  <li>When you see the error message &quot;User location is not supported for the API use&quot; when calling the Google PaLM API</li>
  <li>You want to customize the Google PaLM API</li>
  </ol>
  <p>For technical discussions, please visit <a href="https://simonmy.com/posts/使用netlify反向代理google-palm-api.html">https://simonmy.com/posts/使用netlify反向代理google-palm-api.html</a></p>
</body>
</html>
    `;
    return new Response(blank_html, {
      headers: {
        ...CORS_HEADERS,
        "content-type": "text/html"
      },
    });
  }

  // 生成目标API的URL
  const url = new URL(pathname, "https://generativelanguage.googleapis.com");
  searchParams.delete("_path");

  // 将查询参数附加到目标 URL
  searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  // 提取请求头
  const headers = pickHeaders(request.headers, ["content-type", "x-goog-api-client", "x-goog-api-key", "accept-encoding"]);

  // 调试：打印请求头
  console.log('Request Headers:', JSON.stringify(Object.fromEntries(headers)));

  // 调试：打印请求体
  const requestBody = await request.text();
  console.log('Request Body:', requestBody);

  // 转发请求到目标API
  const response = await fetch(url, {
    body: requestBody,
    method: request.method,
    headers,
  });

  // 创建新的响应头对象并复制响应头
  const responseHeaders = new Headers(response.headers);

  // 添加CORS头部
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    responseHeaders.set(key, value);
  });

  // 移除 'content-encoding' 头部（如果必要）
  responseHeaders.delete("content-encoding");

  // 返回响应
  return new Response(response.body, {
    headers: responseHeaders,
    status: response.status
  });
};
