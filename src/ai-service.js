// AI服务模块 - 用于集成各种AI功能
class AIService {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.openai.com/v1'; // 默认使用OpenAI API
  }

  // 设置API密钥
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    return this;
  }

  // 设置自定义API基础URL
  setBaseURL(baseURL) {
    this.baseURL = baseURL;
    return this;
  }

  // 使用AI生成音乐描述
  async generateMusicDescription(songInfo) {
    try {
      const prompt = `请为以下歌曲生成一段描述性的文字，包括歌曲的情感色彩、风格特点、适合的场景等。歌曲信息：\n\n` +
        `歌名: ${songInfo.name || songInfo.title}\n` +
        `歌手: ${songInfo.artist || songInfo.singer}\n` +
        `专辑: ${songInfo.album}\n` +
        `时长: ${songInfo.duration}`;

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: '你是一个专业的音乐评论家，擅长描述音乐的情感和特点。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new Error(`AI服务错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        description: data.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('AI生成音乐描述失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 使用AI翻译歌词
  async translateLyrics(lyrics, targetLanguage = 'zh') {
    try {
      const prompt = `请将以下歌词翻译成${targetLanguage === 'zh' ? '中文' : targetLanguage === 'en' ? '英文' : '目标语言'}。保持歌词的韵律和情感，如果原文是中文则翻译成英文，如果是英文则翻译成中文。如果无法准确翻译，请返回原文。\n\n歌词：\n${lyrics}`;

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: '你是一位专业的歌词翻译师，擅长在保持歌词韵律和情感的同时进行翻译。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`AI服务错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        translatedLyrics: data.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('AI翻译歌词失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // AI推荐相似歌曲
  async recommendSimilarSongs(songInfo, count = 5) {
    try {
      const prompt = `基于以下歌曲的信息，推荐${count}首风格、情感或主题相似的歌曲。请按照以下JSON格式返回结果：` +
        `[{name: "歌曲名", artist: "艺术家", genre: "流派", similarity: "相似度描述"}]\n\n` +
        `歌曲信息：\n` +
        `歌名: ${songInfo.name || songInfo.title}\n` +
        `歌手: ${songInfo.artist || songInfo.singer}\n` +
        `专辑: ${songInfo.album}\n` +
        `风格: ${songInfo.genre || '未知'}`;

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: '你是一个专业的音乐推荐系统，擅长根据歌曲特征推荐相似的音乐作品。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6,
          max_tokens: 500,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`AI服务错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const recommendations = JSON.parse(data.choices[0].message.content);
      return {
        success: true,
        recommendations: recommendations
      };
    } catch (error) {
      console.error('AI推荐相似歌曲失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // AI哼唱搜索（模拟实现，实际需要使用专门的音频识别API）
  async humToFind(audioData) {
    // 注意：真正的哼唱搜索需要专门的音频识别API，这里只是模拟实现
    // 实际应用中可以集成Shazam API、Audd API或其他音频识别服务
    return {
      success: false,
      error: '哼唱搜索需要专门的音频识别API，当前仅为模拟实现'
    };
  }

  // AI情感分析
  async analyzeSongEmotion(songInfo) {
    try {
      const prompt = `分析以下歌曲的情感特征，包括主要情感、情绪强度、适合的心情等。请按照以下JSON格式返回：` +
        `{emotion: "主要情感", intensity: "强度等级(1-10)", mood: "适合的心情", scene: "适合的场景"}\n\n` +
        `歌曲信息：\n` +
        `歌名: ${songInfo.name || songInfo.title}\n` +
        `歌手: ${songInfo.artist || songInfo.singer}\n` +
        `专辑: ${songInfo.album}\n` +
        `时长: ${songInfo.duration}\n` +
        `歌词: ${songInfo.lyrics || '无歌词信息'}`;

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: '你是一个专业的情感分析专家，擅长分析音乐作品的情感特征。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 300,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`AI服务错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const emotionAnalysis = JSON.parse(data.choices[0].message.content);
      return {
        success: true,
        emotion: emotionAnalysis
      };
    } catch (error) {
      console.error('AI情感分析失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default AIService;