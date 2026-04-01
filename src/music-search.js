// 音乐搜索和合并功能

// 音乐提供者
const Providers = [
  {
    name: 'Netease',
    platform: 'wy',
    searchSongs: async (keyword, page, limit) => {
      try {
        // 调用多平台搜索API
        const response = await fetch(`http://localhost:5000/api/search/multi?query=${encodeURIComponent(keyword)}&platform=wy`);
        const data = await response.json();
        
        if (data.results) {
          return data.results.map(song => ({
            id: song.id,
            name: song.title,
            singer: song.artist,
            album: song.album,
            duration: song.duration,
            url: song.url,
            provider: song.provider,
            platform: song.platform,
            getMergedKey: function() {
              return `${this.singer}-${this.name}`;
            }
          }));
        }
        return [];
      } catch (error) {
        console.error('网易云音乐搜索失败:', error);
        return [];
      }
    }
  },
  {
    name: 'QQMusic',
    platform: 'qq',
    searchSongs: async (keyword, page, limit) => {
      try {
        // 调用多平台搜索API
        const response = await fetch(`http://localhost:5000/api/search/multi?query=${encodeURIComponent(keyword)}&platform=qq`);
        const data = await response.json();
        
        if (data.results) {
          return data.results.map(song => ({
            id: song.id,
            name: song.title,
            singer: song.artist,
            album: song.album,
            duration: song.duration,
            url: song.url,
            provider: song.provider,
            platform: song.platform,
            getMergedKey: function() {
              return `${this.singer}-${this.name}`;
            }
          }));
        }
        return [];
      } catch (error) {
        console.error('QQ音乐搜索失败:', error);
        return [];
      }
    }
  },
  {
    name: 'KuGou',
    platform: 'kg',
    searchSongs: async (keyword, page, limit) => {
      try {
        // 调用多平台搜索API
        const response = await fetch(`http://localhost:5000/api/search/multi?query=${encodeURIComponent(keyword)}&platform=kg`);
        const data = await response.json();
        
        if (data.results) {
          return data.results.map(song => ({
            id: song.id,
            name: song.title,
            singer: song.artist,
            album: song.album,
            duration: song.duration,
            url: song.url,
            provider: song.provider,
            platform: song.platform,
            getMergedKey: function() {
              return `${this.singer}-${this.name}`;
            }
          }));
        }
        return [];
      } catch (error) {
        console.error('酷狗音乐搜索失败:', error);
        return [];
      }
    }
  },
  {
    name: 'Xiami',
    platform: 'xm',
    searchSongs: async (keyword, page, limit) => {
      try {
        // 调用多平台搜索API
        const response = await fetch(`http://localhost:5000/api/search/multi?query=${encodeURIComponent(keyword)}&platform=xm`);
        const data = await response.json();
        
        if (data.results) {
          return data.results.map(song => ({
            id: song.id,
            name: song.title,
            singer: song.artist,
            album: song.album,
            duration: song.duration,
            url: song.url,
            provider: song.provider,
            platform: song.platform,
            getMergedKey: function() {
              return `${this.singer}-${this.name}`;
            }
          }));
        }
        return [];
      } catch (error) {
        console.error('虾米音乐搜索失败:', error);
        return [];
      }
    }
  }
];

// 合并歌曲类
class MergedSong {
  constructor(songs) {
    this.songs = songs;
    this.name = songs[0].name;
    this.singer = songs[0].singer;
    this.album = songs[0].album;
    this.duration = songs[0].duration;
    this.sources = songs.map(song => ({
      provider: song.provider,
      url: song.url,
      id: song.id
    }));
    this.score = this.calculateScore();
  }

  // 计算歌曲得分
  calculateScore() {
    // 基于来源数量和其他因素计算得分
    return this.songs.length * 10 + Math.random() * 5;
  }
}

// 搜索歌曲函数
async function searchSong(singer, songName, exceptProvider) {
  try {
    // 搜索
    const songs = [];
    
    // 并行搜索所有提供者
    const searchPromises = Providers.filter(provider => provider.name !== exceptProvider)
      .map(async (provider) => {
        try {
          const currentSongs = await provider.searchSongs(`${singer} ${songName}`, 1, 10);
          songs.push(...currentSongs);
        } catch (e) {
          console.error(`搜索提供者 ${provider.name} 时出错:`, e);
        }
      });
    
    // 等待所有搜索完成
    await Promise.all(searchPromises);
    
    // 合并
    const mergedSongs = mergeSongs(songs);
    
    // 匹配
    for (const song of mergedSongs) {
      if (song.singer === singer && song.name === songName) {
        return song;
      }
    }
    
    return null;
  } catch (error) {
    console.error('搜索歌曲时出错:', error);
    return null;
  }
}

// 合并歌曲
function mergeSongs(songs) {
  // 按合并键分组
  const songGroups = songs.reduce((groups, song) => {
    const key = song.getMergedKey();
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(song);
    return groups;
  }, {});
  
  // 创建合并歌曲并按得分降序排序
  return Object.values(songGroups)
    .map(group => new MergedSong(group))
    .sort((a, b) => b.score - a.score);
}

// 导出函数
export { searchSong, MergedSong, Providers };