//© 2025 LeeKiJoon all rights reserved
const net = require('net');
const os = require('os');
const { generateTestCases, judgeCCode } = require('../c_compile/judge.js');

let server = null;
let clients = [];
let serverStartTime = null;
const clientsInfo = new Map();
let processQueue = Promise.resolve();

//로컬 아이피주소를 받아옴 ::ffff: 형식임(IPV6 & IPV4)
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

//IPV4로 변환
function getClientIp(address) {
  return address.replace(/^::ffff:/, '');
}

//TCP 서버 시작 -> 파라미터는 포트
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
    msg = JSON.parse(raw);  // 여기서만 파싱
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

//문제 채점 시스템(1~3번은 단답, 4~6번은 코딩 => judgeCCode, generateTestCases 모듈 사용(c_compile/judge.c))
async function evaluateProblem(problemId, answer) {
  const correctAnswers = { 1: "4", 2: "3", 3: "1" };

  if (problemId >= 1 && problemId <= 3) {
    return answer === correctAnswers[problemId]
      ? Math.floor(Math.random() * 4) + 1
      : 0;
  }

  if (problemId >= 4 && problemId <= 10) {
    const cases = generateTestCases(problemId);
    return await judgeCCode(answer, cases); // 랜덤 테스트 케이스로 채점(generateTestCases)
  }

  return 0; // 유효하지 않은 문제 번호
}

//클라이언트 정보를 배열로 가져옴
function getClientsInfoArray() {
  return Array.from(clientsInfo.values());
}

//대회 시작 명령을 클라이언트로 전송
function startContest() {
  const message = JSON.stringify({ type: 'START_CONTEST' });
  clients.forEach(socket => {
    socket.write(message + '\n'); // 메시지 구분용으로 개행 추가
  });
  console.log('sended contest start message to client');
}

//대회 종료 명령을 클라이언트로 전송
function finishContest() {
  const message = JSON.stringify({ type: 'FINISH_CONTEST' });
  clients.forEach(socket => {
    socket.write(message + '\n'); // 메시지 구분용으로 개행 추가
  });
  console.log('sended contest finish message to client');
}

//클라이언트 초기화
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

//모든 클라이언트의 화면을 대기 화면으로 바꿈
function clientStandby() {
  const message = JSON.stringify({ type: 'CLIENT_STANDBY' });
  clients.forEach(socket => {
    socket.write(message + '\n'); // 메시지 구분용으로 개행 추가
  });
  console.log('sended client standby message to client');
}

//TCP 서버 종료(모든 클라이언트 초기화)
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

//서버 업타임 계산
function getUptime() {
  if (!serverStartTime) return 0;
  return Math.floor((Date.now() - serverStartTime) / 1000);
}

//서버 메모리 사용량
function getMemoryUsage() {
  const mem = process.memoryUsage();
  return {
    rss: mem.rss,
    heapTotal: mem.heapTotal,
    heapUsed: mem.heapUsed,
    external: mem.external
  };
}

//서버 상태
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
