const PROXY_URL = 'https://generativelanguage.googleapis.com';

exports.handler = async function(event, context) {
    const url = new URL(event.rawUrl);
    const headers = { ...event.headers };
    const body = event.body ? JSON.parse(event.body) : null;

    try {
        const res = await fetch(PROXY_URL + url.pathname + url.search, {
            method: event.httpMethod,
            headers: headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        // 返回代理的响应
        return {
            statusCode: res.status,
            headers: {
                ...res.headers,
            },
            body: await res.text(),  // 或者使用 res.json() 如果你确定返回的是 JSON
        };
    } catch (error) {
        console.error('代理请求出错:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '服务器内部错误' }),
        };
    }
};
