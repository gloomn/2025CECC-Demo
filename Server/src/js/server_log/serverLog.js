// Renderer 프로세스에서 로그를 받아 화면에 표시
    window.api.receiveLog((event, message) => {
      const logContainer = document.getElementById('server-log');
      const logElement = document.createElement('div');
      logElement.classList.add('log-entry');
      logElement.textContent = message;
      logContainer.appendChild(logElement);

      // 자동 스크롤
      logContainer.scrollTop = logContainer.scrollHeight;
    });