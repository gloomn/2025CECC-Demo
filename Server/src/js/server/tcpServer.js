//© 2025 LeeKiJoon all rights reserved
const net = require('net');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { generateTestCases, judgeCCode } = require('../c_compile/judge.js');
const logFilePath = path.join(__dirname, 'logs', 'server-log.txt');
/* 이게 바로 clients와 clientsInfo의 차이
clients = [ socket1, socket2, socket3 ]

clientsInfo =
Map {
  socket1 => { nickname: "A", score: 5 },
  socket2 => { nickname: "B", score: 7 },
  socket3 => { nickname: "C", score: 10 }
}
*/

let server = null; //TCP 서버 객체
let clients = []; //socket을 담는 배열
let serverStartTime = null; //서버 업타임
const clientsInfo = new Map(); //socket을 키로 한 Map 객체
let processQueue = Promise.resolve(); //비동키 작업 큐 체인
let mainWindowRef = null; // 외부에서 설정(main.js의 window를 받아옴)

// 로그 저장 함수
const saveLogToFile = (message) => {
  const timestamp = new Date().toLocaleTimeString(); // HH:MM:SS
  const logLine = `[${timestamp}] ${message}\n`;

  // 로그 디렉토리 없으면 생성
  const logDir = path.dirname(logFilePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFile(logFilePath, logLine, (err) => {
    if (err) {
      console.error('save log file failed:', err);
    }
  });
};

//프로그램 종료 시 로그 파일 삭제
const clearLogFile = () => {
  fs.writeFile(logFilePath, '', (err) => {
    if (err) {
      console.error('log file initialize failed:', err);
    } else {
      console.log('log file has been initialized.');
    }
  });
};

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
    sendLogToRenderer(`클라이언트 연결됨: ${getClientIp(socket.remoteAddress)}`);
    console.log('Client Connected:', getClientIp(socket.remoteAddress));
    const clientIp = getClientIp(socket.remoteAddress);
    
    // 같은 IP가 이미 존재하는지 확인
    if (Array.from(clientsInfo.values()).some(client => client.ip === clientIp)) {
      sendLogToRenderer(`${clientIp}는 이미 존재하는 클라이언트임.`);
      console.log(`${clientIp} already existing client.`);
      socket.destroy(); // 이미 존재하는 클라이언트는 연결 종료
      return;
    }
    clients.push(socket);

    //서버가 데이터를 수신 받을 때
    socket.on('data', (data) => {
      const raw = data.toString(); //수신 받은 JSON raw 데이터
      console.log(`${clientIp}:`, raw); //디버깅용

      let msg;
      try {
        msg = JSON.parse(raw);  // raw 데이터를 JSON 파싱 (여기서만 1번 실행)
      } catch (err) {
        console.error('Invalid JSON from client:', raw);
        return;
      }

      // 클라이언트로부터 연결됨 (식별 명령어는 CONNECT)
      if (msg.type === 'CONNECT') {
        clientsInfo.set(socket, {
          ip: clientIp, //클라이언트의 IP 주소
          port: socket.remotePort, //클라이언트의 연결 포트
          nickname: msg.nickname || 'Unknown', //클라이언트의 닉네임, 식별 불가능이면 자동으로 Unknown 처리
          problem: msg.problem || '0', //클라이언트가 완료한 문제 번호(초기는 0)
          score: msg.score || 0 //클라이언트의 현재 점수(초기는 0)
        });
        return;
      }

      //클라이언트로부터 답을 받을 때
      if (msg.type === 'SUBMIT_ANSWER') {
        sendLogToRenderer(`${clientIp}로 부터 답이 수신됨`);
        sendLogToRenderer(`문제: ${msg.problem}`);
        sendLogToRenderer(`답: ${msg.answer}`);
        console.log(`Received answer from ${clientIp}`);
        console.log(`Problem: ${msg.problem}`);
        console.log(`Answer: ${msg.answer}`);

        //클라이언트의 문제 채점을 비동기로 Queue를 사용하여 순차적으로 처리
        //ProcessQueue는 비동기 작업을 순차적으로 처리하기 위한 체인
        //processQueue = processQueue.then(...)은 기존 작업이 끝난 후 다음 작업을 이어서 실행하게 함.
        //내부에서 새 Promise를 만들어서 비동기 작업을 수행한 후 resolve() 함.
        processQueue = processQueue.then(() => {
          return new Promise(async (resolve) => {
            const clientInfo = clientsInfo.get(socket); //Map 객체인 clientsInfo에서 메세지를 받은 소켓의 정보를 가져옴.
            if (clientInfo) {
              const scoreDelta = await evaluateProblem(msg.problem, msg.answer);
              clientInfo.score += scoreDelta; //점수 업데이트
              clientInfo.problem = msg.problem; //문제 번호 업데이트
              sendLogToRenderer(`${clientInfo.nickname}의 점수가 ${clientInfo.score}로 업데이트 됨.`);
              console.log(`Updated score for ${clientInfo.nickname}: ${clientInfo.score}`);
            }
            resolve();
          });
        });
      }
    });

    //소켓이 연결을 끊을 때
    socket.on('end', () => {
      sendLogToRenderer(`${clientIp}의 연결이 끊어졌습니다.`);
      console.log(`${clientIp} has been disconnected`);
      clients = clients.filter((s) => s !== socket);
      clientsInfo.delete(socket);
    });

    //소켓 에러
    socket.on('error', (err) => {
      console.error('socket error:', err);
      clients = clients.filter((s) => s !== socket);
      clientsInfo.delete(socket);
    });
  });

  //TCP 포트 실행
  server.listen(port, () => {
    sendLogToRenderer(`TCP 서버가 포트번호 ${port}에서 시작됐습니다.`);
    console.log(`TCP Server started on port ${port}`);
  });
}

//main.js에서 setMainWindow 함수를 사용해서 mainWindowRef에 window 객체 담음
function setMainWindow(win) {
  mainWindowRef = win;
}

// TCP 서버에서 발생하는 로그를 Renderer로 전송
const sendLogToRenderer = (message) => {
  const now = new Date();
  const timestamp = now.toLocaleTimeString('ko-KR', { hour12: false }); // 예: "12:34:56"(타임 스탬프)
  const formattedMessage = `[${timestamp}] ${message}`;
  mainWindowRef.webContents.send('server-log', formattedMessage); // Renderer로 로그 전송

  // 파일에 저장
  saveLogToFile(message);
};

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
  sendLogToRenderer('대회 시작 메세지를 클라이언트들에게 전송함.');
  console.log('sended contest start message to client');
}

//대회 종료 명령을 클라이언트로 전송
function finishContest() {
  const message = JSON.stringify({ type: 'FINISH_CONTEST' });
  clients.forEach(socket => {
    socket.write(message + '\n'); // 메시지 구분용으로 개행 추가
  });

  sendLogToRenderer('대회 종료 메세지를 클라이언트들에게 전송함');
  console.log('sended contest finish message to client');
}

//대회 종료 명령을 클라이언트로 전송
function serverDown() {
  const message = JSON.stringify({ type: 'SERVER_DOWN' });
  clients.forEach(socket => {
    socket.write(message + '\n'); // 메시지 구분용으로 개행 추가
  });
  console.log('sended server down message to client');
}

//클라이언트 초기화
function removeClient() {
  const message = JSON.stringify({ type: 'REMOVE_CLIENT' });

  clients.forEach((socket) => {
    socket.write(message + '\n'); // 메시지 구분용 개행 추가
    socket.destroy(); // 연결 강제 종료
    clientsInfo.delete(socket);
  });

  sendLogToRenderer('클라이언트 초기화 메세지를 클라이언트들에게 전송함');
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

  sendLogToRenderer('대기 상태를 클라이언트들에게 전송함');
  console.log('sended client standby message to client');
}

//TCP 서버 종료(모든 클라이언트 초기화)
function stopServer() {
  const message = JSON.stringify({ type: 'SERVER_DOWN' });
  clients.forEach(socket => {
    socket.write(message + '\n'); // 메시지 구분용으로 개행 추가
  });
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

//서버 업타임 계산 함수
function getUptime() {
  if (!serverStartTime) return "00:00:00";  // 시작 시간이 없으면 00:00:00 변환
  const uptimeInSeconds = Math.floor((Date.now() - serverStartTime) / 1000);

  // 업타임 형식 초를 00:00:00 형식으로 변환
  const hours = String(Math.floor(uptimeInSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((uptimeInSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(uptimeInSeconds % 60).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

//서버에 접속한 클라이언트 카운터!
function getClientCount()
{
  return clients.length;
}

//서버 메모리 사용량 계산 함수
function getMemoryUsage() {
  const mem = process.memoryUsage();
  return {
    rss: mem.rss,
    heapTotal: mem.heapTotal,
    heapUsed: mem.heapUsed,
    external: mem.external
  };
}

//CPU 스레드 수 계산 함수
function getCpuThreads() {
  const cpus = os.cpus(); // 각 CPU 코어에 대한 정보를 가져온다.
  return cpus.length; // CPU 코어 수를 반환합니다. 스레드 수랑 가까운 수임 ㅋㅋ
}

//서버 상태를 getStats로 한 번에 모음
function getStats() {
  return {
    ip: getLocalIp(),
    uptime: getUptime(),
    memory: getMemoryUsage(),
    thread: getCpuThreads(),
    clientCount: getClientCount()
  };
}

//함수 보내버리기 뿌슝
module.exports = {
  startServer,
  stopServer,
  getLocalIp,
  getStats,
  getClientsInfoArray,
  startContest,
  finishContest,
  removeClient,
  clientStandby,
  serverDown,
  sendLogToRenderer,
  setMainWindow,
  clearLogFile
};
