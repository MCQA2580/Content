// Cloudflare Workers 后端入口文件

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

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
      // 健康检查
      if (path === '/api/health') {
        return new Response(
          JSON.stringify({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            service: 'Cloudflare Workers'
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // 搜索音乐
      if (path === '/api/search') {
        const query = url.searchParams.get('query');
        if (!query) {
          return new Response(
            JSON.stringify({ error: '搜索关键词不能为空' }),
            { 
              status: 400,
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
        
        // 注意：这里需要调用实际的音乐 API
        // 由于 Workers 限制，建议使用外部 API 服务
        return new Response(
          JSON.stringify({ 
            results: [],
            message: '请配置实际的音乐 API'
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // 获取歌曲详情
      if (path.startsWith('/api/song/')) {
        const id = path.split('/api/song/')[1];
        if (!id) {
          return new Response(
            JSON.stringify({ error: '歌曲ID不能为空' }),
            { 
              status: 400,
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            song: null,
            message: '请配置实际的音乐 API'
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // 获取歌曲URL
      if (path === '/api/song/url' || path === '/api/song/url/multi') {
        const id = url.searchParams.get('id');
        const platform = url.searchParams.get('platform') || 'wy';
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: '歌曲ID不能为空' }),
            { 
              status: 400,
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: false,
            error: '请配置实际的音乐 API'
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // 获取歌词
      if (path === '/api/song/lyric') {
        const id = url.searchParams.get('id');
        if (!id) {
          return new Response(
            JSON.stringify({ error: '歌曲ID不能为空' }),
            { 
              status: 400,
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: false,
            error: '请配置实际的音乐 API'
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // 解析音乐
      if (path === '/api/parse') {
        const musicUrl = url.searchParams.get('url');
        if (!musicUrl) {
          return new Response(
            JSON.stringify({ error: '音乐URL不能为空' }),
            { 
              status: 400,
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: false,
            error: '请配置实际的音乐 API'
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // 多平台搜索
      if (path === '/api/search/multi') {
        const query = url.searchParams.get('query');
        if (!query) {
          return new Response(
            JSON.stringify({ error: '搜索关键词不能为空' }),
            { 
              status: 400,
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            results: [],
            message: '请配置实际的音乐 API'
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // 404
      return new Response(
        JSON.stringify({ error: '接口不存在' }),
        { 
          status: 404,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );

    } catch (error) {
      console.error('请求错误:', error);
      return new Response(
        JSON.stringify({ error: '服务器内部错误' }),
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
