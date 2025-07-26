//© 2025 LeeKiJoon all rights reserved
const serverButton = document.getElementById('serverStartButton');
const startContestButton = document.getElementById('contestStartButton');
const removeClientButton = document.getElementById('removeClientButton');
const clientStandbyButton = document.getElementById('clientStandbyButton');

let serverRunning = false;  // 서버 실행 여부
let contestStarted = false;

// 서버 시작/중지 버튼 클릭
serverButton.addEventListener('click', async () => {
  if (serverRunning) {
    // 서버 중지
    await window.api.stopServer();
    serverButton.textContent = '서버 시작하기';
    serverButton.style.backgroundColor = "#4acfae";
    document.getElementById('serverStatus').innerText = "🔴 서버 중지됨";
    startContestButton.style.backgroundColor = "#4e4acf";
    document.getElementById('ipAddress').innerText = "N/A";
    serverRunning = false;
  } else {
    // 서버 시작
    const port = document.getElementById('port').value;
    await window.api.startServer(port);
    serverButton.textContent = '서버 중지하기';
    serverButton.style.backgroundColor = "#e74c3c";
    document.getElementById('serverStatus').innerText = "🟢 서버 실행중";
    serverRunning = true;

    window.api.onHostIP((ip) => {
      document.getElementById('ipAddress').innerText = ip;
    });

    updateStats();  // 서버 시작 후 stats 업데이트 시작
  }
});

function bytesToMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

// 서버가 실행 중일 때만 주기적으로 stats 업데이트
async function updateStats() {
  if (!serverRunning) return;

  try {
    const stats = await window.api.getStats();

    document.getElementById('uptime').innerText = stats.uptime;
    document.getElementById('rss').innerText = bytesToMB(stats.memory.rss) + "MB";
    document.getElementById('heapused').innerText = bytesToMB(stats.memory.heapUsed) + "MB";
    document.getElementById('thread').innerText = stats.thread;
    document.getElementById('clientCount').innerText = stats.clientCount;
  } catch (err) {
    console.error('Stats 가져오기 실패:', err);
  }

  setTimeout(updateStats, 1000); // 재귀적으로 1초마다 갱신 갱갱갱
}

startContestButton.addEventListener('click', async () => {
  if (contestStarted) {
    window.api.finishContest();
    startContestButton.textContent = '대회 시작하기';
    startContestButton.style.backgroundColor = "#4e4acf";
    contestStarted = false;
  } else {
    if(serverRunning == false)
    {

    }
    else{
    window.api.startContest();
    startContestButton.textContent = '대회 중지하기';
    startContestButton.style.backgroundColor = "#e74c3c";
    contestStarted = true;
    }
  }
});

//클라이언트 초기화 버튼 누를 시
removeClientButton.addEventListener('click', async () => {
  window.api.removeClient();
});

//클라이언트 대기 상태로 바꾸기 버튼 누를 시
clientStandbyButton.addEventListener('click', async () => {
  window.api.clientStandby();
});