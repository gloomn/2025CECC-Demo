//© 2025 LeeKiJoon all rights reserved
const net = require('net');
const client = new net.Socket();
let localIP = 0;
let mainWindowRef = null; // 외부에서 설정

function setMainWindow(win) {
  mainWindowRef = win;
}

function connectToServer(ip, port, nickname) {
  return new Promise((resolve, reject) => {

    client.connect({ host: ip, port: port }, () => {
      console.log('✅ 서버 연결 성공');
      localIP = ip;
      const initData = {
        type: 'connect',
        ip: ip,
        nickname: nickname,
        problem: '0',
        score: 0
      };

      client.write(JSON.stringify(initData));
      resolve(true); // 연결은 성공했음
    });

    client.on('data', (data) => {
      const messages = data.toString().split('\n');

      messages.forEach(msg => {
        msg = msg.trim();
        if (!msg) return;

        let parsed;
        try {
          parsed = JSON.parse(msg);
        } catch (e) {
          console.log('[JSON parcing failed]', msg);
          return;
        }

        console.log('[Received Message]', parsed);

        if (parsed.type === 'START_CONTEST') {
          console.log('START_CONTEST message received');

          if (mainWindowRef) {
            mainWindowRef.loadFile('src/html/contest.html');
          } else {
            console.error('mainWindow is not initialized');
          }
        }

        else if(parsed.type == 'FINISH_CONTEST') {
          console.log('FINISH_CONTEST message received');

          if(mainWindowRef) {
            mainWindowRef.loadFile('src/html/contestFinished.html');
          } else {
            console.error('mainWindow is no selected');
          }
        }

        else if(parsed.type == 'REMOVE_CLIENT') {
          console.log('REMOVE_CLIENT message received');

          if(mainWindowRef) {
            mainWindowRef.loadFile('src/html/clientIndex.html');
          } else {
            console.error('mainWindow is no selected');
          }
        }

        else if(parsed.type == 'CLIENT_STANDBY') {
          console.log('CLIENT_STANDBY message received');

          if(mainWindowRef) {
            mainWindowRef.loadFile('src/html/standby.html');
          } else {
            console.error('mainWindow is no selected');
          }
        }
      });
    });

    client.on('error', (err) => {
      console.error('[Error]', err.message);
      reject(false);
    });

    client.on('close', () => {
      console.log('Disconnected Server');
    });
  });
}

function submitAnswer(problem, answer)
{
  const message = JSON.stringify({
    type: 'SUBMIT_ANSWER',
    ip: localIP,
    problem: problem,
    answer: answer
  });

  if (client && !client.destroyed) {
    client.write(message + '\n');
  }
}

module.exports = { connectToServer, setMainWindow, submitAnswer };
