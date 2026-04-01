// 音乐搜索和合并功能

// 模拟音乐提供者
const Providers = [
  {
    name: 'Provider1',
    searchSongs: async (keyword, page, limit) => {
      // 模拟搜索延迟
      await new Promise(resolve => setTimeout(resolve, 100));
      return [
        {
          id: '1-1',
          name: '起风了',
          singer: '买辣椒也用券',
          album: '起风了',
          duration: '4:11',
          url: 'https://example.com/music/1.mp3',
          provider: 'Provider1',
          getMergedKey: function() {
            return `${this.singer}-${this.name}`;
          }
        }
      ];
    }
  },
  {
    name: 'Provider2',
    searchSongs: async (keyword, page, limit) => {
      // 模拟搜索延迟
      await new Promise(resolve => setTimeout(resolve, 150));
      return [
        {
          id: '2-1',
          name: '起风了',
          singer: '买辣椒也用券',
          album: '起风了',
          duration: '4:11',
          url: 'https://example.com/music/2.mp3',
          provider: 'Provider2',
          getMergedKey: function() {
            return `${this.singer}-${this.name}`;
          }
        },
        {
          id: '2-2',
          name: '追光者',
          singer: '岑宁儿',
          album: '夏至未至 电视剧原声带',
          duration: '3:55',
          url: 'https://example.com/music/3.mp3',
          provider: 'Provider2',
          getMergedKey: function() {
            return `${this.singer}-${this.name}`;
          }
        }
      ];
    }
  },
  {
    name: 'Provider3',
    searchSongs: async (keyword, page, limit) => {
      // 模拟搜索延迟
      await new Promise(resolve => setTimeout(resolve, 120));
      return [
        {
          id: '3-1',
          name: '起风了',
          singer: '买辣椒也用券',
          album: '起风了',
          duration: '4:11',
          url: 'https://example.com/music/4.mp3',
          provider: 'Provider3',
          getMergedKey: function() {
            return `${this.singer}-${this.name}`;
          }
        }
      ];
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