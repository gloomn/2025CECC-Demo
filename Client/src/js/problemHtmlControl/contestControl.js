let currentProblemId = 1;
let clientIp = null;

window.onload = function () {
    document.getElementById("1").style.display = "block";

    // IP 주소 가져오기
    window.api.getClientIp().then(ip => {
        clientIp = ip;
        console.log("내 IP 주소:", ip);
    });
};

// 다음 문제로 이동하는 함수
function showNextProblem() {
    submitAnswer();

    // 현재 문제 숨기기
    let currentProblem = document.getElementById(String(currentProblemId));
    if (currentProblem) {
        currentProblem.style.display = "none";
    }

    currentProblemId++;

    // 다음 문제 보이기
    let nextProblem = document.getElementById(String(currentProblemId));
    if (nextProblem) {
        nextProblem.style.display = "block";
    }
}

function submitAnswer() {
    const answer = document.getElementById('codeArea').value;

    window.api.sendAnswer({
        problem: currentProblemId,
        answer: answer.trim()
    });
}
