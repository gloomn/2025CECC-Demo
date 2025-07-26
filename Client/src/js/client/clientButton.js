//© 2025 LeeKiJoon all rights reserved
const connectBtn = document.getElementById('login-button');

connectBtn.addEventListener('click', () => {
  const ip = document.getElementById('ipaddress').value;
  const port = parseInt(document.getElementById('portnumber').value, 10);
  const nickname = document.getElementById('nickname').value;

  // IP 주소 검증: IP가 비어있는지 확인
  if (!ip) {
    document.getElementById('login-alert').textContent = "❌ IP 주소를 입력해주세요.";
    return; // IP가 없으면 연결 시도하지 않음
  }

  // 닉네임 검증: 닉네임이 비어있는지 확인
  if (!nickname) {
    document.getElementById('login-alert').textContent = "❌ 닉네임을 입력해주세요.";
    return; // 닉네임이 없으면 연결 시도하지 않음
  }

  // 포트 검증: 유효한 포트 범위인지 확인
  if (isNaN(port) || port < 1 || port > 65535) {
    document.getElementById('login-alert').textContent = "❌ IP, 포트번호 및 닉네임을 입력해주세요.";
    return; // 잘못된 포트일 경우 연결 시도하지 않음
  }

  console.log('from client:', ip, port, nickname);

  // 서버에 연결 시도
  window.api.connectToServer(ip, port, nickname).then((isConnected) => {
    if (isConnected) {
      console.log("Connected successfully");
      // 연결 성공 시 대기 상태로 전환
      window.api.changeToStandby();
    } else {
      console.log("Failed to connect");
      // 연결 실패 시 처리
      document.getElementById('login-alert').textContent = "❌ 서버에 연결할 수 없습니다.";
    }
  }).catch((err) => {
    console.error('Failed to connect to server:', err);
    document.getElementById('login-alert').textContent = "❌ 서버에 연결하는 동안 문제가 발생했습니다.";
  });
});
