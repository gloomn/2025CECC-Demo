const connectBtn = document.getElementById('login-button');

connectBtn.addEventListener('click', () => {
  const ip = document.getElementById('ipaddress').value;
  const port = parseInt(document.getElementById('portnumber').value, 10);
  const nickname = document.getElementById('nickname').value;

  // 포트 검증: 유효한 포트 범위인지 확인
  if (isNaN(port) || port < 1 || port > 65535) {
    alert('잘못된 포트 번호입니다. 1 ~ 65535 사이의 값을 입력해주세요.');
    // 포트 입력 필드를 다시 활성화
    document.getElementById('ipaddress').disabled = false;
    document.getElementById('portnumber').disabled = false;
    document.getElementById('nickname').disabled = false;
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
      alert('서버에 연결할 수 없습니다.');
      // 포트 입력 필드를 다시 활성화
      document.getElementById('ipaddress').disabled = false;
      document.getElementById('portnumber').disabled = false;
      document.getElementById('nickname').disabled = false;
    }
  }).catch((err) => {
    console.error('Failed to connect to server:', err);
    alert('서버에 연결하는 동안 오류가 발생했습니다.');
    // 포트 입력 필드를 다시 활성화
    document.getElementById('ipaddress').disabled = false;
    document.getElementById('portnumber').disabled = false;
    document.getElementById('nickname').disabled = false;
  });
});
