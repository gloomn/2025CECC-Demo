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
      const a = randInt(1, 100), b = randInt(1, 100);
      return { input: `${a} ${b}\n`, output: `${a + b}` };
    });
    case 6: return Array.from({ length: 5 }, () => {
      const n = randInt(0, 10);
      return { input: `${n}\n`, output: `${factorial(n)}` };
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
  const id = uuidv4();
  const base = path.join(__dirname, 'temp', id);
  const src = `${base}.c`;
  const exe = `${base}.exe`;
  const gcc = process.env.GCC_PATH || path.join(__dirname, '../../../portable-gcc/bin/gcc.exe');
  if (!fs.existsSync(gcc)) {
    throw new Error(`gcc executable not found at path: ${gcc}. Set GCC_PATH environment variable if needed.`);
  }
  
  fs.mkdirSync(path.dirname(src), { recursive: true });
  fs.writeFileSync(src, code, 'utf8');

  const compileResult = await new Promise((resolve) => {
    execFile(gcc, [src, '-o', exe], { encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err) return resolve({ ok: false, error: stderr.toString() });
      resolve({ ok: true });
    });
  });

  if (!compileResult.ok) {
    cleanup(src, exe);
    return 0;
  }

  let score = 0;

  for (const tc of testCases) {
    const output = await new Promise((resolve) => {
      const proc = execFile(exe, [], { timeout: 3000, encoding: 'utf8' }, (err, stdout) => {
        resolve((stdout || '').toString().trim());
      });
      proc.stdin.write(tc.input);
      proc.stdin.end();
    });

    if (output === tc.output) score++;
  }

  // 점수를 1~4 사이에서 랜덤하게 부여
  const randomScore = Math.floor(Math.random() * 4) + 1;

  cleanup(src, exe);
  return randomScore
}

// 임시파일 정리
function cleanup(...files) {
  for (const file of files) {
    try {
      fs.unlinkSync(file);
    } catch {}
  }
}

module.exports = { generateTestCases, judgeCCode };
