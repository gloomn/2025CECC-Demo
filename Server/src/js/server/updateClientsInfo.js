//© 2025 LeeKiJoon all rights reserved
setInterval(() => {
    window.api.getClients().then(data => {
        const tbody = document.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = data.map(info => `
        <tr>
          <td>${info.nickname}</td>
          <td>${info.ip}</td>
          <td>${info.port}</td>
          <td>${info.problem}</td>
          <td>${info.score}</td>
        </tr>
      `).join('');
    });
}, 1000);