const { exec } = require('child_process');
const path = require('path');

console.log('正在启动音乐解析后端服务...');

// 设置PM2_HOME环境变量，避免权限问题
process.env.PM2_HOME = path.join(__dirname, '.pm2');

console.log('PM2_HOME设置为:', process.env.PM2_HOME);

// 使用本地PM2启动服务
const pm2Path = path.join(__dirname, 'node_modules', '.bin', 'pm2');
const configPath = path.join(__dirname, 'ecosystem.config.js');

console.log('PM2路径:', pm2Path);
console.log('配置文件路径:', configPath);

// 先检查PM2是否已安装
exec(`"${pm2Path}" --version`, (error, stdout, stderr) => {
  if (error) {
    console.error('PM2版本检查失败:', error);
    console.error('回退到直接使用node启动...');
    startDirectly();
    return;
  }
  
  console.log('PM2版本:', stdout.trim());
  
  // 尝试使用PM2启动
  exec(`"${pm2Path}" start "${configPath}"`, (pm2Error, pm2Stdout, pm2Stderr) => {
    if (pm2Error) {
      console.error('PM2启动失败:', pm2Error);
      console.error('stderr:', pm2Stderr);
      console.error('回退到直接使用node启动...');
      startDirectly();
      return;
    }
    
    console.log('PM2启动成功!');
    console.log(pm2Stdout);
    
    // 保存PM2进程列表
    exec(`"${pm2Path}" save`, (saveError, saveStdout, saveStderr) => {
      if (saveError) {
        console.warn('保存PM2进程列表失败:', saveError);
      } else {
        console.log('PM2进程列表已保存');
      }
    });
    
    // 显示PM2状态
    console.log('\n正在显示PM2状态...');
    setTimeout(() => {
      exec(`"${pm2Path}" status`, (statusError, statusStdout, statusStderr) => {
        if (statusError) {
          console.warn('获取PM2状态失败:', statusError);
        } else {
          console.log('\nPM2状态:');
          console.log(statusStdout);
        }
        console.log('\n服务已启动!');
        console.log('后端API地址: http://localhost:5000');
      });
    }, 2000);
  });
});

function startDirectly() {
  console.log('\n直接使用node启动服务...');
  const serverProcess = exec(`node "${path.join(__dirname, 'index.js')}"`);
  
  serverProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  serverProcess.on('close', (code) => {
    console.log(`服务进程退出，代码: ${code}`);
    console.log('正在重新启动服务...');
    startDirectly(); // 自动重启
  });
  
  console.log('\n服务已启动!');
  console.log('后端API地址: http://localhost:5000');
  console.log('注意: 此模式下如果进程崩溃会自动重启');
}

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n收到停止信号，正在关闭服务...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n收到停止信号，正在关闭服务...');
  process.exit(0);
});
