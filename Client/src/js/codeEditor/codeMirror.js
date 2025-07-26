// CodeMirror 편집기 설정
  const editor = CodeMirror.fromTextArea(document.getElementById("codeArea4"), {
    mode: "text/x-csrc",      // C언어 모드 설정
    theme: "darcula",         // 테마 설정
    lineNumbers: true,        // 라인 번호 표시
    tabSize: 2,               // 탭 크기
    indentUnit: 2,            // 들여쓰기 크기
    smartIndent: true,        // 자동 들여쓰기
    lineWrapping: true,       // 코드 줄 바꿈
    extraKeys: {
      "Ctrl-Space": "autocomplete", // 자동완성 단축키
      "Ctrl-Q": "formatCode"       // 코드 포맷팅 단축키
    },
    autoCloseBrackets: true
  });

  // 편집기 초기화가 끝난 후, 라인 번호와 커서 위치가 제대로 나타나도록 refresh() 호출
  setTimeout(() => {
    editor.refresh();
  }, 100);