//© 2025 LeeKiJoon all rights reserved
let currentProblemId = 1;
let clientIp = null;
let editors = {};  // 각 문제에 대한 CodeMirror 인스턴스를 저장할 객체

window.onload = function () {
    // 처음 문제 보이기
    document.getElementById("1").style.display = "block";

    // 4번부터 CodeMirror 인스턴스 초기화
    for (let i = 4; i <= 10; i++) {
        editors[i] = initializeCodeMirror(i);  // `initializeCodeMirror` 함수 호출
    }
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
    if (currentProblemId >= 4) {  // 4번 문제부터 CodeMirror 초기화
        editors[currentProblemId].setValue('');  // CodeMirror에서 값 초기화
    }

    currentProblemId++;

    // 다음 문제 보이기
    let nextProblem = document.getElementById(String(currentProblemId));
    if (nextProblem) {
        nextProblem.style.display = "block";
    }

    if (currentProblemId == 10) {
        showFinishScreen();
    }
}

async function submitAnswer() {
    let answer;
    // 4번 문제부터 CodeMirror 사용
    if (currentProblemId >= 4) {
        answer = editors[currentProblemId].getValue().trim();  // CodeMirror에서 답 가져오기
    } else {
        // 1~3번 문제는 textarea로 처리
        answer = document.getElementById(`codeArea${currentProblemId}`).value.trim();
    }

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

async function showFinishScreen() {
    window.api.changeToFinish();
}
