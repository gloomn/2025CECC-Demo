//© 2025 LeeKiJoon all rights reserved
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// 유틸 함수들
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const factorial = n => (n <= 1 ? 1 : n * factorial(n - 1));
const isPrime = n => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};
const fibo = n => {
  const f = [0, 1];
  for (let i = 2; i <= n; i++) f[i] = f[i - 1] + f[i - 2];
  return f[n];
};

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
    case 7: return Array.from({ length: 5 }, () => {
      const n = randInt(1, 100);
      return { input: `${n}\n`, output: n % 2 === 0 ? "Even" : "Odd" };
    });
    case 8: return Array.from({ length: 5 }, () => {
      const n = randInt(2, 50);
      return { input: `${n}\n`, output: isPrime(n) ? "Prime" : "Not Prime" };
    });
    case 9: return Array.from({ length: 5 }, () => {
      const n = randInt(1, 20);
      return { input: `${n}\n`, output: `${fibo(n)}` };
    });
    case 10: return Array.from({ length: 5 }, () => {
      const n = randInt(2, 20);
      let sum = 0; for (let i = 2; i <= n; i += 2) sum += i;
      return { input: `${n}\n`, output: `${sum}` };
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
