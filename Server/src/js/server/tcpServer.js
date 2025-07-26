//© 2025 LeeKiJoon all rights reserved
const net = require('net');
const os = require('os');
const { generateTestCases, judgeCCode } = require('../c_compile/judge.js');

let server = null;
let clients = [];
let serverStartTime = null;
const clientsInfo = new Map();
let processQueue = Promise.resolve();

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const preferredNames = ['Wi-Fi', 'WLAN', 'wlan0', 'en0', 'Ethernet'];

  for (const name of preferredNames) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;

    for (const iface of ifaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (
        iface.family === 'IPv4' &&
        !iface.internal &&
        !name.toLowerCase().includes('vmware') &&
        !name.toLowerCase().includes('virtual')
      ) {
        return iface.address;
      }
    }
  }

  return '127.0.0.1';
}

function getClientIp(address) {
  return address.replace(/^::ffff:/, '');
}

function startServer(port) {
  serverStartTime = Date.now();

  server = net.createServer((socket) => {
    console.log('Client Connected:', getClientIp(socket.remoteAddress));
    const clientIp = getClientIp(socket.remoteAddress);

    // 같은 IP가 이미 존재하는지 확인
    if (Array.from(clientsInfo.values()).some(client => client.ip === clientIp)) {
      console.log(`${clientIp} already existing client.`);
      socket.destroy(); // 이미 존재하는 클라이언트는 연결 종료
      return;
    }

    clients.push(socket);

    socket.on('data', (data) => {
  const raw = data.toString();
  console.log(`${clientIp}:`, raw);

  let msg;
  try {
    msg = JSON.parse(raw);  // 여기서만 파싱!
  } catch (err) {
    console.error('Invalid JSON from client:', raw);
    return;
  }

  // 공통 처리
  if (msg.type === 'connect') {
    clientsInfo.set(socket, {
      ip: clientIp,
      port: socket.remotePort,
      nickname: msg.nickname || 'Unknown',
      problem: msg.problem || '0',
      score: msg.score || 0
    });
    return;
  }

  if (msg.type === 'SUBMIT_ANSWER') {
    console.log(`Received answer from ${clientIp}`);
    console.log(`Problem: ${msg.problem}`);
    console.log(`Answer: ${msg.answer}`);

    processQueue = processQueue.then(() => {
      return new Promise(async(resolve) => {
        const clientInfo = clientsInfo.get(socket);
        if (clientInfo) {
          const scoreDelta = await evaluateProblem(msg.problem, msg.answer);
          clientInfo.score += scoreDelta;
          clientInfo.problem = msg.problem;
          console.log(`Updated score for ${clientInfo.nickname}: ${clientInfo.score}`);
        }
        resolve();
      });
    });
  }
});


  socket.on('end', () => {
    console.log(`${clientIp} has been disconnected`);
    clients = clients.filter((s) => s !== socket);
    clientsInfo.delete(socket);
  });

  socket.on('error', (err) => {
    console.error('socket error:', err);
    clients = clients.filter((s) => s !== socket);
    clientsInfo.delete(socket);
  });
});

server.listen(port, () => {
  console.log(`TCP Server started on port ${port}`);
});
}

async function evaluateProblem(problemId, answer) {
  const correctAnswers = { 1: "4", 2: "3", 3: "1" };

  if (problemId >= 1 && problemId <= 3) {
    return answer === correctAnswers[problemId]
      ? Math.floor(Math.random() * 4) + 1
      : 0;
  }

  if (problemId >= 4 && problemId <= 10) {
    const cases = generateTestCases(problemId);
    return await judgeCCode(answer, cases); // 랜덤 테스트 케이스로 채점
  }

  return 0; // 유효하지 않은 문제 번호
}


function getClientsInfoArray() {
  return Array.from(clientsInfo.values());
}

function startContest() {
  const message = JSON.stringify({ type: 'START_CONTEST' });
  clients.forEach(socket => {
    socket.write(message + '\n'); // 메시지 구분용으로 개행 추가
  });
  console.log('sended contest start message to client');
}

function finishContest() {
  const message = JSON.stringify({ type: 'FINISH_CONTEST' });
  clients.forEach(socket => {
    socket.write(message + '\n'); // 메시지 구분용으로 개행 추가
  });
  console.log('sended contest finish message to client');
}

function removeClient() {
  const message = JSON.stringify({ type: 'REMOVE_CLIENT' });

  clients.forEach((socket) => {
    socket.write(message + '\n'); // 메시지 구분용 개행 추가
    socket.destroy(); // 연결 강제 종료
    clientsInfo.delete(socket);
  });

  console.log('sended remove client message to all clients');

  // 모든 클라이언트 배열 비움
  clients = [];
}


function clientStandby() {
  const message = JSON.stringify({ type: 'CLIENT_STANDBY' });
  clients.forEach(socket => {
    socket.write(message + '\n'); // 메시지 구분용으로 개행 추가
  });
  console.log('sended client standby message to client');
}

function stopServer() {
  if (server) {
    clients.forEach((socket) => socket.destroy());
    clients = [];
    clientsInfo.clear();

    server.close(() => {
      console.log('Server stopped');
      server = null;
    });
  }
}

function getUptime() {
  if (!serverStartTime) return 0;
  return Math.floor((Date.now() - serverStartTime) / 1000);
}

function getMemoryUsage() {
  const mem = process.memoryUsage();
  return {
    rss: mem.rss,
    heapTotal: mem.heapTotal,
    heapUsed: mem.heapUsed,
    external: mem.external
  };
}

function getStats() {
  return {
    ip: getLocalIp(),
    uptime: getUptime(),
    memory: getMemoryUsage()
  };
}

module.exports = {
  startServer,
  stopServer,
  getLocalIp,
  getUptime,
  getMemoryUsage,
  getStats,
  getClientsInfoArray,
  startContest,
  finishContest,
  removeClient,
  clientStandby
};
