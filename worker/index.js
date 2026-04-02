// Cloudflare Workers - 代理到 Vercel 后端

// Vercel 后端地址
const VERCEL_BACKEND_URL = 'https://w.nfq.dpdns.org';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const searchParams = url.search;

    // CORS 处理
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 构建转发 URL
      const targetUrl = `${VERCEL_BACKEND_URL}/_/backend${path}${searchParams}`;
      
      console.log(`[代理] ${request.method} ${path} -> ${targetUrl}`);

      // 转发请求到 Vercel 后端
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // 获取响应内容
      const responseBody = await response.text();

      // 返回响应
      return new Response(responseBody, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });

    } catch (error) {
      console.error('[代理错误]', error);
      return new Response(
        JSON.stringify({ 
          error: '代理请求失败',
          message: error.message 
        }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
  },
};
