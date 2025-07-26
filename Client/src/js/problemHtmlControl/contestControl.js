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
async function showNextProblem() {
    await submitAnswer();  // submitAnswer가 완료될 때까지 대기

    // 현재 문제 숨기기
    let currentProblem = document.getElementById(String(currentProblemId));
    if (currentProblem) {
        currentProblem.style.display = "none";
    }

    // 답안 초기화 (다음 문제로 넘어갈 때)
    document.getElementById(`codeArea${currentProblemId}`).value = '';

    currentProblemId++;

    // 다음 문제 보이기
    let nextProblem = document.getElementById(String(currentProblemId));
    if (nextProblem) {
        nextProblem.style.display = "block";
    }
}

async function submitAnswer() {
    // 문제 번호에 맞는 textarea의 ID를 동적으로 사용
    const answer = document.getElementById(`codeArea${currentProblemId}`).value.trim();

    if (!answer) {
        alert("답안을 입력해주세요.");
        return;  // 빈 값일 경우 전송하지 않음
    }

    console.log('Sending answer:', answer);

    await window.api.sendAnswer({
        problem: currentProblemId,
        answer: answer
    });
}
