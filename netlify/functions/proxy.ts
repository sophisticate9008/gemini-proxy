// netlify/functions/proxy.ts
import { Context } from "@netlify/edge-functions";

const TARGET_HOST = "generativelanguage.googleapis.com";

export default async (request: Request, context: Context) => {
  try {
    // 处理根路径请求
    const url = new URL(request.url);
    if (url.pathname === "/") {
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google PaLM API Proxy</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 20px;
      padding: 0;
      background-color: #f9f9f9;
      color: #333;
    }
    h1 {
      color: #1a73e8;
    }
    a {
      color: #1a73e8;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .footer {
      margin-top: 20px;
      font-size: 0.9em;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Google PaLM API Proxy</h1>
    <p>This is a reverse proxy service designed to bypass regional restrictions when accessing the Google PaLM API.</p>
    <h2>Why Use This Proxy?</h2>
    <ul>
      <li>You see the error: <strong>"User location is not supported for the API use"</strong>.</li>
      <li>You need to customize the Google PaLM API behavior.</li>
    </ul>
    <h2>How to Use</h2>
    <p>Replace the base URL of your API requests with this proxy URL. For example:</p>
    <pre>
https://your-domain.netlify.app/v1/models/gemini-pro?key=YOUR_API_KEY
    </pre>
    <h2>Technical Details</h2>
    <p>For more information, visit the project documentation:</p>
    <p><a href="https://simonmy.com/posts/使用netlify反向代理google-palm-api.html" target="_blank">Using Netlify as a Reverse Proxy for Google PaLM API</a></p>
    <div class="footer">
      <p>This service is powered by <a href="https://www.netlify.com/" target="_blank">Netlify Edge Functions</a>.</p>
    </div>
  </div>
</body>
</html>
      `;
      return new Response(htmlContent, {
        headers: { "Content-Type": "text/html" }
      });
    }

    // 重构目标URL
    const targetUrl = new URL(url.pathname, `https://${TARGET_HOST}`);
    targetUrl.search = url.search;

    // 处理特殊参数（可选）
    targetUrl.searchParams.delete("_path");

    // 构建请求头
    const headers = new Headers(request.headers);
    headers.set("Host", TARGET_HOST); // 强制覆盖Host头
    headers.delete("x-forwarded-host");

    // 转发请求
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: "follow"
    });

    // 处理响应头
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export const config = {
  path: "/*",
  onError: "bypass"
};