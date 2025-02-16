// netlify/functions/proxy.ts
import { Context } from '@netlify/edge-functions';

const PROXY_URL = 'https://generativelanguage.googleapis.com';

export default async (event: Request, context: Context) => {
  const url = new URL(event.url);
  const targetUrl = PROXY_URL + url.pathname + url.search;

  try {
    const response = await fetch(targetUrl, {
      method: event.method,
      headers: event.headers,
      body: event.method === 'GET' ? undefined : await event.text(), // 如果是GET请求，不传递body
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    return new Response('Error proxying the request', { status: 500 });
  }
};
