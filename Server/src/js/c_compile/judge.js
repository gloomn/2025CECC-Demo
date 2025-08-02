//© 2025 LeeKiJoon all rights reserved
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// 유틸 함수들
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const factorial = n => (n <= 1 ? 1 : n * factorial(n - 1));

// 테스트케이스 생성
function generateTestCases(problemId) {
  switch (problemId) {
    case 4: return [{ input: "", output: "Hello" }];
    case 5: return Array.from({ length: 5 }, () => {
      const input = randInt(1, 10);
      const output = Array.from({ length: input }, (_, i) => '*'.repeat(i + 1)).join('\n') + '\n';
      return { input: `${input}\n`, output };
    });
    case 6: return Array.from({ length: 5 }, () => {
      const n = randInt(2, 10);  // 최소 2개, 최대 10개 숫자
      const arr = Array.from({ length: n }, () => randInt(-100, 100));
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const input = `${n}\n${arr.join(' ')}\n`;
      const output = `${min} ${max}`;
      return { input, output };
    });
    case 7:  // 포인터 swap 문제
      return Array.from({ length: 5 }, () => {
        const a = randInt(-1000, 1000);
        const b = randInt(-1000, 1000);
        const input = `${a} ${b}\n`;
        const output = `${b} ${a}\n`;
        return { input, output };
      });

    case 8:  // 문자열 인덱싱 문제
      return Array.from({ length: 5 }, () => {
        const len = randInt(1, 20);
        const s = Array.from({ length: len }, () =>
          String.fromCharCode(randInt(97, 122))
        ).join('');
        const idx = randInt(1, len);
        const input = `${s}\n${idx}\n`;
        const output = `${s[idx - 1]}\n`;
        return { input, output };
      });

    case 9:  // 평균 이상 점수
      return Array.from({ length: 5 }, () => {
        const n = randInt(3, 10);
        const scores = Array.from({ length: n }, () => randInt(0, 100));
        const avg = scores.reduce((a, b) => a + b, 0) / n;
        const count = scores.filter(s => s >= avg).length;
        const input = `${n}\n${scores.join(' ')}\n`;
        const output = `${count}\n`;
        return { input, output };
      });

    // 문제 10: 숫자 뒤집고 비교하기
    case 10:  // reverse and compare
      return Array.from({ length: 5 }, () => {
        const reverse = (num) => {
          return parseInt(num.toString().split('').reverse().join(''));
        };

        // 100~999 범위의 세 자리 수 두 개 생성
        const a = randInt(100, 999);
        const b = randInt(100, 999);
        const revA = reverse(a);
        const revB = reverse(b);
        const result = Math.max(revA, revB);

        const input = `${a} ${b}\n`;
        const output = `${result}\n`;

        return { input, output };
      });

    default: return [];
  }
}

// 코드 채점
async function judgeCCode(code, testCases) {
  const id = `${Date.now()}_${uuidv4()}`;
  const dir = path.join(__dirname, 'temp', id);
  const src = path.join(dir, 'main.c');
  const exe = path.join(dir, 'main.exe');
  const gcc = process.env.GCC_PATH || path.join(__dirname, '../../../portable-gcc/bin/gcc.exe');

  if (!fs.existsSync(gcc)) {
    throw new Error(`gcc executable not found at path: ${gcc}`);
  }

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(src, code, 'utf8');

  const compileResult = await new Promise((resolve) => {
    execFile(gcc, [src, '-o', exe], { encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err) return resolve({ ok: false, error: stderr.toString() });
      resolve({ ok: true });
    });
  });

  if (!compileResult.ok) {
    cleanupDir(dir);
    return 0;
  }

  const normalize = str => str.replace(/\r/g, '').trim();
  let passedAll = true;

  // 모든 테스트 케이스를 체크
  for (const tc of testCases) {
    const output = await new Promise((resolve) => {
      const proc = execFile(exe, [], { timeout: 3000, encoding: 'utf8' }, (err, stdout) => {
        resolve((stdout || '').toString().trim());
      });
      proc.stdin.write(tc.input);
      proc.stdin.end();
    });

    // 하나라도 틀리면 모든 테스트 케이스 실패로 처리
    if (normalize(output) !== normalize(tc.output)) {
      passedAll = false;
      break;
    }
  }

  cleanupDir(dir);
  return passedAll ? Math.floor(Math.random() * 4) + 1 : 0;
}


// 디렉토리 전체 삭제
function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}


module.exports = { generateTestCases, judgeCCode };
