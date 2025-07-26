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

//제출 버튼 누를 시 다음 문제로 넘어감 + 서버로 답안 전송
async function showNextProblem() {
    const submitted = await submitAnswer();

    if (!submitted) {
        return;  // 답안이 비어있으면 다음 문제로 넘어가지 않음
    }

    // 현재 문제 숨기기
    let currentProblem = document.getElementById(String(currentProblemId));
    if (currentProblem) {
        currentProblem.style.display = "none";
    }

    // 답안 초기화
    if (currentProblemId >= 4) {
        editors[currentProblemId].setValue('');
    }

    currentProblemId++;

    // 다음 문제 보이기
    let nextProblem = document.getElementById(String(currentProblemId));
    if (nextProblem) {
        nextProblem.style.display = "block";
    }

    if (currentProblemId == 11) {
        showFinishScreen();
    }
}

//서버로 답안 전송
async function submitAnswer() {
    let answer;

    if (currentProblemId >= 4) {
        answer = editors[currentProblemId].getValue().trim();
    } else {
        const textarea = document.getElementById(`codeArea${currentProblemId}`);
        answer = textarea.value.trim();
    }

    if (!answer) {
        const alertBox = document.getElementById(`alert${currentProblemId}`);
        if (alertBox) {
            alertBox.textContent = "답안을 입력해주세요.";
        } else {
            
        }

        if (currentProblemId >= 4) {
            editors[currentProblemId].focus();
        } else {
            document.getElementById(`codeArea${currentProblemId}`).focus();
        }

        return false;
    }

    console.log('Sending answer:', answer);

    await window.api.sendAnswer({
        problem: currentProblemId,
        answer: answer
    });

    return true;
}

//문제 다 풀었으면 종료 화면으로 전환
async function showFinishScreen() {
    window.api.changeToFinish();
}

