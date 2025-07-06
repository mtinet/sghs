let user = { id: '', name: '' };
let mode = '', startTime, endTime, text, tryCount = 1;
let started = false; // 타이머 시작 여부
let typingRealtimeTimer = null;
let composingIndex = null;

const MODES = [
  { key: 'kor-short', label: '한글 짧은 글' },
  { key: 'kor-long', label: '한글 긴 글' },
  { key: 'eng-short', label: '영문 짧은 글' },
  { key: 'eng-long', label: '영문 긴 글' }
];

let rankingsByMode = {};
let currentModeIndex = 0;
let slideInterval = null;

// ===== 타자연습 리뉴얼용 변수 및 함수 추가 =====
let typingLines = [
  '서울여자중학교는 세상의 변화에 맞춰',
  '스스로 배우는 힘을 갖춘 평생학습자를 육성하며,',
  '언제 어디서나 누구와도 협력하고 일할 수 있는 역량을 기르는 교육을 합니다.',
  '창의적 사고와 문제 해결 능력을 배양하여',
  '글로벌 사회에서 주도적인 학습자가 되기 위해 노력합니다.'
];
let currentLineIndex = 0;
let typingStartTime = null;
let typingEndTime = null;
let typingStats = { correct: 0, wrong: 0, total: 0, start: null, end: null };
let totalTypedCount = 0;
let lastInputLength = 0;
let maxWpm = 0;
let lineStartTime = null;
let isLineTypingStarted = false;
let lineWpmList = []; // 각 줄별 WPM 저장

// 영어 문장 배열 추가
let typingLinesEng = [
  "Seoul Girls Middle School aims to nurture lifelong learners with the ability to learn independently in response to changes in the world.",
  "The school provides education that fosters the capacity to collaborate and work with anyone, anywhere.",
  "By cultivating creative thinking and problem-solving skills, we strive to develop proactive learners in the global society.",
  "Additionally, we create a warm and inclusive school culture where all members participate,",
  "encouraging every student to gain confidence and pursue their dreams.",
  "As a vibrant learning environment that brightens the future of our students,",
  "we will continuously support and encourage them to grow into responsible global leaders who contribute to society."
];
let typingLinesKor = [
  '서울여자중학교는 세상의 변화에 맞춰',
  '스스로 배우는 힘을 갖춘 평생학습자를 육성하며,',
  '언제 어디서나 누구와도 협력하고 일할 수 있는',
  '역량을 기르는 교육을 합니다.',
  '창의적 사고와 문제 해결 능력을 배양하여',
  '글로벌 사회에서 주도적인 학습자가 되기 위해 노력합니다.',
  '또한, 학교 구성원 모두가 참여하는',
  '따뜻하고 포용적인 학교 문화를 조성하여,',
  '모든 학생이 자신감을 갖고 자신의 꿈을 실현할 수 있도록 장려합니다.',
  '학생들의 미래를 밝히는 힘찬 배움터로서,',
  '책임감 있고 사회에 공헌하는 글로벌 리더로',
  '성장할 수 있도록 끝없이 지원하고 격려하겠습니다.'
];

// 언어/글 종류 상태
let currentLang = 'kor'; // kor | eng
let currentType = 'short'; // short | long

// 버튼 클릭 이벤트 연결
function setTypingLang(lang) {
  currentLang = lang;
  updateTypingLines();
  updateLangBtnUI();
  startTypingPractice();
  // startTypingPractice 이후에 강제 초기화
  if (mode === 'kor-short' || mode === 'eng-short') {
    document.getElementById('line-result').innerText = '이번 줄: 0타/분, 소요시간: 0.00초';
  } else {
    document.getElementById('line-result').innerText = '';
  }
}
function setTypingType(type) {
  currentType = type;
  updateTypingLines();
  updateTypeBtnUI();
  startTypingPractice();
  // startTypingPractice 이후에 강제 초기화
  if (mode === 'kor-short' || mode === 'eng-short') {
    document.getElementById('line-result').innerText = '이번 줄: 0타/분, 소요시간: 0.00초';
  } else {
    document.getElementById('line-result').innerText = '';
  }
}
function updateTypingLines() {
  if (currentLang === 'kor' && currentType === 'short') {
    typingLines = typingLinesKor;
    mode = 'kor-short';
  } else if (currentLang === 'kor' && currentType === 'long') {
    typingLines = [typingLinesKor.join(' ')];
    mode = 'kor-long';
  } else if (currentLang === 'eng' && currentType === 'short') {
    typingLines = typingLinesEng;
    mode = 'eng-short';
  } else if (currentLang === 'eng' && currentType === 'long') {
    typingLines = [typingLinesEng.join(' ')];
    mode = 'eng-long';
  }
}
function updateLangBtnUI() {
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
  if (currentLang === 'kor') document.querySelector('.lang-btn:nth-child(1)').classList.add('active');
  else document.querySelector('.lang-btn:nth-child(2)').classList.add('active');
}
function updateTypeBtnUI() {
  const typeBtns = document.querySelectorAll('.type-btn');
  typeBtns.forEach(btn => btn.classList.remove('active'));
  if (currentType === 'short') typeBtns[0].classList.add('active');
  else typeBtns[1].classList.add('active');
}

// 누적 통계 변수
let totalCorrect = 0;
let totalWrong = 0;
let totalLength = 0;

let lineRealtimeTimer = null; // 줄별 실시간 타이머

function startTypingPractice() {
  currentLineIndex = 0;
  typingStats = { correct: 0, wrong: 0, total: 0, start: null, end: null };
  typingStartTime = null;
  typingEndTime = null;
  totalCorrect = 0;
  totalWrong = 0;
  totalLength = 0;
  maxWpm = 0;
  isLineTypingStarted = false;
  totalTypedCount = 0;
  lastInputLength = 0;
  lineStartTime = null;
  renderTypingLine();
  updateTypingStats();
  const input = document.getElementById('typing-input');
  input.value = '';
  input.disabled = false;
  input.style.background = '#fff';
  input.style.border = '1.5px solid #b0bec5';
  input.focus();
  document.getElementById('typing-restart-btn').innerText = '다시 시작';
  // 기존 타이머가 있다면 중지
  if (typingRealtimeTimer) clearInterval(typingRealtimeTimer);
  // 100ms마다 WPM/시간 갱신
  typingRealtimeTimer = setInterval(() => {
    document.getElementById('typing-wpm').innerText = calcWPM();
    document.getElementById('typing-time').innerText = formatTypingTime();
  }, 100);
  // 안내 문구와 칸을 항상 보이게, 값만 0으로 초기화
  if (mode === 'kor-short' || mode === 'eng-short') {
    document.getElementById('line-result').innerText = '이번 줄: 0타/분, 소요시간: 0.00초';
  } else {
    document.getElementById('line-result').innerText = '';
  }
  if (lineRealtimeTimer) { clearInterval(lineRealtimeTimer); lineRealtimeTimer = null; }
}

function renderTypingLine() {
  const typingArea = document.getElementById('typing-practice-area');
  if (currentType === 'short') {
    // 짧은 글: 한 줄씩
    const line = typingLines[currentLineIndex] || '';
    typingArea.innerHTML = `<div class="typing-line" id="typing-line">${colorizeInput(line, '')}</div>`;
    // 아래 줄들 표시
    let below = '';
    for (let i = currentLineIndex + 1; i < typingLines.length; i++) {
      below += typingLines[i] + '<br/>';
    }
    document.getElementById('typing-lines-below').innerHTML = below;
    isLineTypingStarted = false; // 줄 시작 시 입력 시작 안함
    lineStartTime = null;
  } else {
    // 긴 글: 전체 문단
    const line = typingLines[0] || '';
    typingArea.innerHTML = `<div class="typing-line" id="typing-line">${colorizeInput(line, '')}</div>`;
    document.getElementById('typing-lines-below').innerHTML = '';
    lineStartTime = null;
  }
}

function handleTypingInput(e) {
  const input = e.target.value;
  const line = typingLines[currentLineIndex] || '';
  // 입력이 1글자 이상이고, lineStartTime이 null이면 지금 시각으로 초기화 (한글/영어 모두)
  if (input.length > 0 && !lineStartTime) {
    lineStartTime = Date.now();
  }
  // 입력이 1글자 이상이고, 아직 입력 시작 안했으면 true로
  if (input.length > 0 && !isLineTypingStarted) {
    isLineTypingStarted = true;
  }
  // 첫 문장 첫 글자 입력 시에만 시작 시간 기록(최초 1회만)
  if (!typingStartTime && input.length > 0 && currentLineIndex === 0) {
    typingStartTime = new Date();
  }
  // 실제 타이핑한 키 수 누적
  if (input.length > lastInputLength) {
    totalTypedCount += input.length - lastInputLength;
  }
  lastInputLength = input.length;
  // 색상 처리
  document.getElementById('typing-line').innerHTML = colorizeInput(line, input);
  // 통계
  updateTypingStatsRealtime(line, input);
  // 입력창 스타일(오타시 빨간 테두리)
  if (input && (input.length > line.length || input.split('').some((ch, i) => ch !== line[i]))) {
    e.target.style.border = '2px solid #2196f3'; // 두께 고정, 색상만 변경
    e.target.style.background = '#e3eafc';
  } else {
    e.target.style.border = '2px solid #b0bec5'; // 두께 고정, 색상만 변경
    e.target.style.background = '#fff';
  }

  // ===== "이번 줄" 실시간 업데이트 추가 =====
  // 짧은글 모드에서만 동작
  if (mode === 'kor-short' || mode === 'eng-short') {
    if (lineStartTime && input.length > 0) {
      // 기존 타이머가 있다면 중지
      if (!lineRealtimeTimer) {
        lineRealtimeTimer = setInterval(() => {
          const elapsed = (Date.now() - lineStartTime) / 1000;
          const inputLength = countKeystrokes(document.getElementById('typing-input').value);
          const wpm = (inputLength > 0 && elapsed > 0) ? (inputLength / elapsed) * 60 : 0;
          document.getElementById('line-result').innerText = `이번 줄: ${Math.round(wpm)}타/분, 소요시간: ${elapsed.toFixed(2)}초`;
        }, 10);
      }
    } else {
      if (lineRealtimeTimer) { clearInterval(lineRealtimeTimer); lineRealtimeTimer = null; }
      document.getElementById('line-result').innerText = '이번 줄: 0타/분, 소요시간: 0.00초';
    }
  } else {
    if (lineRealtimeTimer) { clearInterval(lineRealtimeTimer); lineRealtimeTimer = null; }
    document.getElementById('line-result').innerText = '';
  }
}

const typingInput = document.getElementById('typing-input');
let composing = false;
typingInput.addEventListener('compositionstart', () => { composing = true; });
typingInput.addEventListener('compositionend', (e) => {
  composing = false;
  // 조합이 끝난 후에도 input 이벤트가 발생하므로 별도 처리 불필요
});

document.addEventListener('DOMContentLoaded', () => {
  // 로그인 상태 확인 및 UI 제어
  const loginArea = document.getElementById('login-area');
  const mainContainer = document.getElementById('main-container');
  if (!user.id || !user.name) {
    loginArea.style.display = '';
    mainContainer.style.display = 'none';
  } else {
    loginArea.style.display = 'none';
    mainContainer.style.display = '';
  }
  // 로그인 버튼 이벤트
  document.getElementById('login-btn').onclick = function() {
    const id = document.getElementById('login-id').value.trim();
    const name = document.getElementById('login-name').value.trim();
    const errorDiv = document.getElementById('login-error');
    // 학번: 5자리 숫자, 이름: 한글 2자 이상
    if (!/^\d{5}$/.test(id)) {
      errorDiv.innerText = '학번은 5자리 숫자여야 합니다.';
      errorDiv.style.display = 'block';
      return;
    }
    if (!/^[가-힣]{2,}$/.test(name)) {
      errorDiv.innerText = '이름은 한글 2자 이상이어야 합니다.';
      errorDiv.style.display = 'block';
      return;
    }
    user.id = id;
    user.name = name;
    errorDiv.style.display = 'none';
    loginArea.style.display = 'none';
    mainContainer.style.display = '';
  };
  // 입력 이벤트 연결
  const input = document.getElementById('typing-input');
  input.addEventListener('input', handleTypingInput);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEnterKey();
    }
  });
  // 다시 시작 버튼
  document.getElementById('typing-restart-btn').onclick = startTypingPractice;
  // 첫 화면에서는 버튼 텍스트를 '시작하기'로
  document.getElementById('typing-restart-btn').innerText = '시작하기';
  // 언어 버튼
  document.querySelectorAll('.lang-btn').forEach((btn, idx) => {
    btn.onclick = () => setTypingLang(idx === 0 ? 'kor' : 'eng');
  });
  // 글 종류 버튼
  document.querySelectorAll('.type-btn')[0].onclick = () => setTypingType('short');
  document.querySelectorAll('.type-btn')[1].onclick = () => setTypingType('long');
  // 빈칸 채우기 게임 언어 버튼 이벤트 연결
  document.querySelectorAll('#blank-game-ui .lang-btn').forEach((btn, idx) => {
    btn.onclick = () => setBlankLang(idx === 0 ? 'kor' : 'eng');
  });
  // 최초 시작
  updateTypingLines();
  updateLangBtnUI();
  updateTypeBtnUI();
  updateBlankLangBtnUI(); // 빈칸 채우기 게임 언어 버튼 UI도 초기화
  startTypingPractice();
  // 탭 버튼 이벤트 추가
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // 탭별 화면 전환
      const practiceArea = document.querySelector('.container > div:nth-child(4)');
      const statArea = document.querySelector('.container > div:nth-child(5)');
      const restartArea = document.querySelector('.container > div:nth-child(6)');
      const langTypeArea = document.querySelector('.container > div:nth-child(3)');
      const blankGameUI = document.getElementById('blank-game-ui');
      if (btn.textContent.includes('랭킹')) {
        if (practiceArea) practiceArea.style.display = 'none';
        if (statArea) statArea.style.display = 'none';
        if (restartArea) restartArea.style.display = 'none';
        if (langTypeArea) langTypeArea.style.display = 'none';
        if (blankGameUI) blankGameUI.style.display = 'none';
        document.getElementById('ranking-area').style.display = '';
        renderRankingTabs(); // 기존 showRankingTable(selectedModeKey) 대신 랭킹 탭 UI 렌더링
      } else if (btn.textContent.includes('빈칸')) {
        if (practiceArea) practiceArea.style.display = 'none';
        if (statArea) statArea.style.display = 'none';
        if (restartArea) restartArea.style.display = 'none';
        if (langTypeArea) langTypeArea.style.display = 'none';
        if (blankGameUI) blankGameUI.style.display = '';
        document.getElementById('ranking-area').style.display = 'none';
      } else {
        if (practiceArea) practiceArea.style.display = '';
        if (statArea) statArea.style.display = '';
        if (restartArea) restartArea.style.display = '';
        if (langTypeArea) langTypeArea.style.display = '';
        if (blankGameUI) blankGameUI.style.display = 'none';
        document.getElementById('ranking-area').style.display = 'none';
      }
    });
  });
  // 랭킹 모드 버튼 렌더링
  renderRankingModeBtns();
  // 모드 선택 버튼 이벤트 연결
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.onclick = () => {
      setMode(btn.getAttribute('data-mode'));
      // 버튼 UI 갱신
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });
});

function handleEnterKey() {
  const input = document.getElementById('typing-input').value;
  const line = typingLines[currentLineIndex] || '';
  // 줄별 오타/정확도 누적
  let correct = 0, wrong = 0;
  for (let i = 0; i < line.length; i++) {
    if (input[i] === line[i]) correct++;
    else wrong++;
  }
  totalCorrect += correct;
  totalWrong += wrong;
  totalLength += line.length;

  // === 줄별 타수 계산 및 배열에 저장 ===
  let lastLineWpm = 0;
  let lastLineSec = 0;
  // 입력이 1글자 이상인데 lineStartTime이 null이면 Enter 시점에 강제로 시작
  let effectiveLineStartTime = lineStartTime;
  if (!effectiveLineStartTime && countKeystrokes(input) > 0) {
    effectiveLineStartTime = Date.now();
  }
  if (effectiveLineStartTime && countKeystrokes(input) > 0) {
    const elapsed = (Date.now() - effectiveLineStartTime) / 1000;
    const inputLength = countKeystrokes(input); // 실제 입력한 자음/모음/스페이스 수
    const wpm = elapsed > 0 ? (inputLength / elapsed) * 60 : 0;
    lineWpmList.push(wpm); // 각 줄별 WPM 저장
    lastLineWpm = wpm;
    lastLineSec = elapsed;
  }
  // === 줄별 결과 표시 ===
  const isShortMode = mode === 'kor-short' || mode === 'eng-short';
  if (isShortMode && lastLineSec > 0 && countKeystrokes(input) > 0) {
    document.getElementById('line-result').innerText = `이번 줄: ${Math.round(lastLineWpm)}타/분, 소요시간: ${lastLineSec.toFixed(2)}초`;
  }

  currentLineIndex++;
  if (currentLineIndex < typingLines.length) {
    renderTypingLine();
    document.getElementById('typing-input').value = '';
    document.getElementById('typing-input').focus();
  } else {
    typingEndTime = new Date();
    showTypingResult();
    document.getElementById('line-result').innerText = '';
  }
  lineStartTime = null; // 줄이 끝날 때마다 타이머 초기화
  // 줄별 타이머 중지
  if (lineRealtimeTimer) { clearInterval(lineRealtimeTimer); lineRealtimeTimer = null; }
}

function colorizeInput(line, input) {
  if (mode === 'kor-long' || mode === 'eng-long') {
    const cursor = input.length;
    let html = '';
    for (let i = 0; i < line.length; i++) {
      if (i === cursor) {
        html += `<span class=\"cursor-char\">${line[i] ?? ''}</span>`;
      } else if (i < cursor) {
        // 오타: 입력값이 없거나 다르면 무조건 분홍색
        if (input[i] === undefined || input[i] !== line[i]) {
          html += `<span class=\"wrong-char\">${line[i] ?? ''}</span>`;
        } else {
          html += line[i] ?? '';
        }
      } else {
        html += line[i] ?? '';
      }
    }
    return html;
  }
  // 기존 방식(짧은글)
  let html = '';
  for (let i = 0; i < line.length; i++) {
    if (i === input.length) {
      html += `<span class=\"cursor-char\">${line[i] ?? ''}</span>`;
    } else if (i < input.length) {
      if (input[i] === undefined || input[i] !== line[i]) {
        html += `<span class=\"wrong-char\">${line[i] ?? ''}</span>`;
      } else {
        html += line[i] ?? '';
      }
    } else {
      html += line[i] ?? '';
    }
  }
  return html;
}

// 자음, 모음, 스페이스바 개수 세는 함수 (한글 완성형 분해 포함)
function countKeystrokes(str) {
  let count = 0;
  if (mode && mode.startsWith('eng-')) {
    // 영문 모드: 알파벳만 카운트
    for (let ch of str) {
      if (/[a-zA-Z]/.test(ch)) count += 1;
    }
  } else {
    // 한글 모드: 기존 방식
    for (let ch of str) {
      if (/[가-힣]/.test(ch)) {
        const code = ch.charCodeAt(0) - 0xAC00;
        const jong = code % 28;
        count += jong ? 3 : 2;
      } else if (/[ㄱ-ㅎㅏ-ㅣ0-9 !"#$%&'()*+,./:;<=>?@[\\]^_`{|}~\-]/.test(ch)) {
        count += 1;
      }
    }
  }
  return count;
}

// 줄별 타수 계산 함수 추가
function calcLineWPM() {
  if (!lineStartTime) return 0;
  const now = new Date();
  const seconds = (now - lineStartTime) / 1000;
  if (seconds === 0) return 0;
  const input = document.getElementById('typing-input').value;
  const keystrokes = countKeystrokes(input);
  return Math.round((keystrokes / seconds) * 60);
}

// updateTypingStatsRealtime에서 줄별 타수로 표시
function updateTypingStatsRealtime(line, input) {
  let correct = 0, wrong = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === line[i]) correct++;
    else wrong++;
  }

  // 누적값 계산
  const accCorrect = totalCorrect + correct;
  const accWrong = totalWrong + wrong;
  const accTyped = accCorrect + accWrong;

  // 전체 기준 정확도/오타 표시
  const accuracy = accTyped > 0 ? Math.round((accCorrect / accTyped) * 100) : 100;
  document.getElementById('typing-accuracy').innerText = `${accuracy}%`;
  document.getElementById('typing-wrong').innerText = accWrong;

  // 하단 통계(타수/타분)는 전체 기준으로 calcWPM() 사용
  document.getElementById('typing-wpm').innerText = calcWPM();
  document.getElementById('typing-time').innerText = formatTypingTime(); // 전체 소요 시간(1/100초)
}

// updateTypingStats는 전체 소요 시간만 표시
function updateTypingStats() {
  document.getElementById('typing-accuracy').innerText = '100%';
  document.getElementById('typing-wpm').innerText = '0';
  document.getElementById('typing-wrong').innerText = '0';
  document.getElementById('typing-time').innerText = formatTypingTime();
}

function calcWPM() {
  if (!typingStartTime) return 0;
  const now = new Date();
  const seconds = (now - typingStartTime) / 1000;
  if (seconds === 0) return 0;
  // 전체 입력값을 합쳐서 카운트 (완성된 줄 + 현재 입력 중인 줄)
  let allInput = '';
  for (let i = 0; i < currentLineIndex; i++) {
    allInput += typingLines[i];
  }
  allInput += document.getElementById('typing-input').value;
  const keystrokes = countKeystrokes(allInput);
  return Math.round((keystrokes / seconds) * 60);
}

function formatTypingTime() {
  if (!typingStartTime) return '00:00.00';
  const now = typingEndTime || new Date();
  let ms = now - typingStartTime;
  let sec = Math.floor(ms / 1000);
  let min = Math.floor(sec / 60);
  let centi = Math.floor((ms % 1000) / 10); // 1/100초
  sec = sec % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${centi.toString().padStart(2, '0')}`;
}

// showTypingResult에서 typing-time(소요 시간)은 전체 연습 시간으로 고정
function showTypingResult() {
  // 전체 정확도 계산
  const totalTyped = totalCorrect + totalWrong;
  const accuracy = totalTyped > 0 ? Math.round((totalCorrect / totalTyped) * 100) : 100;
  // 마지막 통계 갱신
  document.getElementById('typing-input').disabled = true;
  document.getElementById('typing-input').style.background = '#f0f3fa';
  document.getElementById('typing-input').style.border = '1.5px solid #b0bec5';

  // 기록 객체 생성 (정확도, 타수, 오타, 시간 등)
  const wrong = document.getElementById('typing-wrong').innerText;
  const time = formatTypingTime(); // 전체 소요 시간
  // 최고 타수 계산 (줄별 WPM 중 최대값)
  const maxLineWpm = lineWpmList.length > 0 ? Math.round(Math.max(...lineWpmList)) : 0;
  const record = {
    id: user.id || 'guest',
    name: user.name || 'guest',
    mode: mode || 'kor-short',
    accuracy: Number(accuracy),
    speed: maxLineWpm, // 최고 타수로 저장
    wrong: Number(wrong),
    tryCount: tryCount || 1,
    timestamp: Date.now(),
    time: time // 전체 소요 시간 저장
  };
  saveRecord(record, showRankPopup); // 저장 후 등수 팝업
  if (typingRealtimeTimer) clearInterval(typingRealtimeTimer);
  document.getElementById('typing-time').innerText = formatTypingTime(); // 결과 화면에도 전체 소요 시간 표시
  lineWpmList = []; // 결과 표시 후 배열 초기화
}

function startGame() {
  const id = document.getElementById('student-id').value.trim();
  const name = document.getElementById('student-name').value.trim();
  const error = document.getElementById('user-error');
  if (!/^\d{5}$/.test(id)) {
    error.innerText = '학번은 5자리 숫자여야 합니다.';
    return;
  }
  if (!/^[가-힣]{2,10}$/.test(name)) {
    error.innerText = '이름은 한글 2~10자여야 합니다.';
    return;
  }
  user = { id, name };
  document.getElementById('user-info').style.display = 'none';
  document.getElementById('mode-select').style.display = '';
  loadRanking();
}

function setMode(selectedMode) {
  mode = selectedMode;
  document.getElementById('mode-select').style.display = 'none';
  document.getElementById('typing-area').style.display = '';
  document.getElementById('result-area').style.display = 'none';
  if (mode === 'kor-short') text = korShort[Math.floor(Math.random() * korShort.length)];
  if (mode === 'kor-long') text = korLong[0];
  if (mode === 'eng-short') text = engShort[Math.floor(Math.random() * engShort.length)];
  if (mode === 'eng-long') text = engLong[0];
  document.getElementById('text-to-type').innerText = text;
  const textarea = document.getElementById('user-input');
  textarea.value = '';
  document.getElementById('feedback').innerText = '';
  started = false; // 타이머 플래그 초기화

  textarea.onkeydown = function(e) {
    if (!started && e.key.length === 1) { // 첫 입력(문자/숫자/기호)만 반응
      startTime = new Date();
      started = true;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      finishTyping();
    }
  };
}

function checkTyping() {
  const input = document.getElementById('user-input').value;
  let correct = 0, wrong = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === text[i]) correct++;
    else wrong++;
  }
  document.getElementById('feedback').innerText =
    `정확도: ${(correct / text.length * 100).toFixed(1)}% | 오타: ${wrong}`;
}

function finishTyping() {
  endTime = new Date();
  const input = document.getElementById('user-input').value;
  let correct = 0, wrong = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === text[i]) correct++;
    else wrong++;
  }
  const accuracy = (correct / text.length * 100).toFixed(1);

  let speed = 0;
  if (startTime && endTime > startTime) {
    const seconds = (endTime - startTime) / 1000;
    if (seconds > 0) {
      speed = (input.length / seconds * 60).toFixed(1);
    }
  }

  const record = {
    id: user.id,
    name: user.name,
    mode,
    accuracy: Number(accuracy),
    speed: Number(speed),
    wrong,
    tryCount,
    timestamp: Date.now()
  };
  document.getElementById('typing-area').style.display = 'none';
  document.getElementById('result-area').style.display = '';
  document.getElementById('result').innerHTML =
    `정확도: ${accuracy}%<br>타수: ${speed}타/분<br>오타: ${wrong}개<br>도전: ${tryCount}회`;
  saveRecord(record);
  tryCount++;
}

function restart() {
  document.getElementById('mode-select').style.display = '';
  document.getElementById('result-area').style.display = 'none';
}

function saveRecord(record, callback) {
  // 빈칸 채우기 게임은 speed 0이어도 저장, 나머지는 기존 조건 유지
  const isBlankGame = record.mode && record.mode.startsWith('blank-');
  // normal/hard 난이도에서 accuracy가 0이어도 blanks가 모두 채워졌으면 업로드 허용
  if (!isBlankGame && (record.accuracy === 0 || record.speed === 0)) return;
  // blankGame은 accuracy 0이어도 무조건 업로드 (제출 시점에서 이미 빈칸 채우기 완료)
  const userKey = record.id + '_' + record.name;
  const ref = db.ref('records/' + userKey + '/' + record.mode);
  ref.once('value', snapshot => {
    const prev = snapshot.val();
    if (
      !prev ||
      record.accuracy > prev.accuracy ||
      (record.accuracy === prev.accuracy && record.speed > prev.speed)
    ) {
      ref.set(record, function() {
        setTimeout(() => {
          loadRanking();
          loadAllRankings();
          if (callback) callback(record);
        }, 1000); // 1초 대기 후 랭킹 갱신
      });
    } else {
      setTimeout(() => {
        loadRanking();
        loadAllRankings();
        if (callback) callback(record);
      }, 1000); // 1초 대기 후 랭킹 갱신
    }
  });
}

function loadRanking() {
  db.ref('records').on('value', snapshot => {
    const records = [];
    snapshot.forEach(userSnap => {
      const modeRecord = userSnap.child(mode).val();
      if (modeRecord) records.push(modeRecord);
    });
    records.sort((a, b) => b.accuracy - a.accuracy || b.speed - a.speed);
    const top10 = records.slice(0, 10);
    const list = top10.map((r, i) =>
      `<li><b>${i + 1}위</b> [${r.id}] ${r.name} - 정확도 ${r.accuracy}% | 속도 ${r.speed}타/분 | ${r.mode}</li>`
    ).join('');
    document.getElementById('ranking-list').innerHTML = list || '<li>기록 없음</li>';
  });
}

function showRanking() {
  // 현재 모드의 인덱스 찾기
  const idx = MODES.findIndex(m => m.key === mode);
  if (idx === -1) return;
  loadAllRankings(() => {
    showRankingSlide(idx);
    if (slideInterval) clearInterval(slideInterval);
    setTimeout(() => {
      startRankingSlider(idx, 1000); // 1초 간격 슬라이드 (기본)
    }, 3000); // 3초 대기 후 슬라이드 시작
  });
}

function hideRanking() {
  document.getElementById('ranking-area').style.display = 'none';
  document.getElementById('mode-select').style.display = '';
}

function loadAllRankings(callback) {
  db.ref('records').once('value', snapshot => {
    rankingsByMode = {};
    MODES.forEach(({ key }) => rankingsByMode[key] = []);
    snapshot.forEach(userSnap => {
      MODES.forEach(({ key }) => {
        const rec = userSnap.child(key).val();
        if (rec) rankingsByMode[key].push(rec);
      });
    });
    MODES.forEach(({ key }) => {
      rankingsByMode[key].sort((a, b) => b.accuracy - a.accuracy || b.speed - a.speed);
      rankingsByMode[key] = rankingsByMode[key].slice(0, 20);
    });
    if (callback) callback();
  });
}

function showRankingSlide(idx) {
  const { key, label } = MODES[idx];
  const records = rankingsByMode[key] || [];
  let html = `<h2>${label} 랭킹</h2><ul class="chat-list" style="font-size:0.97em;">`;
  if (records.length === 0) {
    html += '<li>기록 없음</li>';
  } else {
    html += records.map((r, i) => {
      const date = new Date(r.timestamp);
      const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
      return `<li><b>${i + 1}위</b> [${r.id}_${r.name}]<br><span style=\"font-size:0.9em;color:#888;\">${dateStr}</span><br>정확도 ${r.accuracy}% | 속도 ${r.speed}타/분</li>`;
    }).join('');
  }
  html += '</ul>';
  document.getElementById('ranking-chat').innerHTML = html;
}

function startRankingSlider(startIdx, delay = 1000) {
  if (slideInterval) clearInterval(slideInterval);
  currentModeIndex = startIdx;
  showRankingSlide(currentModeIndex);
  slideInterval = setInterval(() => {
    currentModeIndex = (currentModeIndex + 1) % MODES.length;
    showRankingSlide(currentModeIndex);
  }, delay);
}

// 5초마다 전체 랭킹 자동 업데이트
setInterval(() => {
  loadAllRankings();
}, 5000);

// 페이지 로드 시 실행
window.onload = function() {
  loadAllRankings(() => showRankingSlide(0));
  startRankingSlider(0); // 슬라이드 자동 시작
};

// 아래 config는 본인 Firebase 콘솔에서 복사해 붙여넣으세요!
const firebaseConfig = {
    apiKey: "AIzaSyDNJBO7P7aZPVDwE33G0X36D6Fshz2b4Es",
    authDomain: "minju-59dd0.firebaseapp.com",
    databaseURL: "https://minju-59dd0-default-rtdb.firebaseio.com",
    projectId: "minju-59dd0",
    storageBucket: "minju-59dd0.firebasestorage.app",
    messagingSenderId: "1013213885823",
    appId: "1:1013213885823:web:153d8308d7dfd5aa47164a",
    measurementId: "G-SWRGQRVDVT"
  };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 내 기록 등수 팝업
function showRankPopup(record) {
  // 전체 랭킹 불러와서 등수 계산
  db.ref('records').once('value', snapshot => {
    const records = [];
    snapshot.forEach(userSnap => {
      const modeRecord = userSnap.child(record.mode).val();
      if (modeRecord) records.push(modeRecord);
    });
    // 정확도→타수 순 정렬
    records.sort((a, b) => b.accuracy - a.accuracy || b.speed - a.speed);
    const rank = records.findIndex(r => r.id === record.id && r.name === record.name && r.timestamp === record.timestamp) + 1;
    if (rank > 0 && rank <= 5) {
      alert(`🎉 축하합니다!\n이번 기록은 [${getModeLabel(record.mode)}] 모드 전체 중 [${rank}등]입니다!`);
    } else if (rank > 0) {
      alert(`아쉽게도 5등 밖입니다!\n이번 기록은 [${getModeLabel(record.mode)}] 모드 전체 중 [${rank}등]입니다.`);
    } else {
      alert('기록이 랭킹에 반영되지 않았습니다.');
    }
  });
}

function getModeLabel(modeKey) {
  const m = MODES.find(m => m.key === modeKey);
  return m ? m.label : modeKey;
}

// 랭킹 테이블 표시 함수
function showRankingTable(modeKey) {
  loadAllRankings(() => {
    let rows = '';
    const records = (rankingsByMode[modeKey] || []).slice(0, 20);
    records.forEach((r, i) => {
      const date = new Date(r.timestamp);
      const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
      rows += `<tr><td>${i+1}</td><td>${r.id}_${r.name}</td><td>${r.accuracy}%</td><td>${r.speed}</td><td>${dateStr}</td><td>${MODES.find(m=>m.key===modeKey).label}</td></tr>`;
    });
    if (records.length === 0) {
      rows = '<tr><td colspan="6" style="text-align:center; color:#888; padding:18px;">아직 기록이 없습니다.</td></tr>';
    }
    const html = `<table style="width:100%;margin-top:8px;border-collapse:collapse;">
      <thead><tr style="background:#f5f6fa;"><th>순위</th><th>이름</th><th>정확도</th><th>타수(타/분)</th><th>날짜</th><th>모드</th></tr></thead><tbody>${rows}</tbody></table>`;
    // 기존 ranking-table-body가 아니라, typing-ranking-ui 내부에 렌더링
    const tableArea = document.getElementById('ranking-table-area');
    if (tableArea) tableArea.innerHTML = html;
  });
}

// 랭킹 모드 필터 버튼 생성 및 이벤트
const MODES_LABELS = [
  { key: 'kor-short', label: '한글 짧은 글' },
  { key: 'kor-long', label: '한글 긴 글' },
  { key: 'eng-short', label: '영문 짧은 글' },
  { key: 'eng-long', label: '영문 긴 글' }
];
let selectedModeKey = 'kor-short';

function renderRankingModeBtns() {
  // flex로 감싸고, .ranking-mode-btn2 스타일 적용
  const btns = `\n    <div style=\"display:flex; gap:24px; justify-content:center; margin-bottom:24px;\">\n      ${MODES_LABELS.map(m => `\n        <button class=\"ranking-mode-btn2${selectedModeKey===m.key?' active':''}\" data-mode=\"${m.key}\">\n          ${m.label}\n        </button>\n      `).join('')}\n    </div>\n  `;
  document.getElementById('ranking-mode-btns').innerHTML = btns;
  document.querySelectorAll('.ranking-mode-btn2').forEach(btn => {
    btn.onclick = () => {
      selectedModeKey = btn.getAttribute('data-mode');
      renderRankingModeBtns();
      showRankingTable(selectedModeKey);
    };
  });
}

// ===== 빈칸 채우기 게임용 고정 문장/정답/힌트 =====
const BLANK_SENTENCES = {
  easy: [
    "서울여자중학교는 세상의 [변화]에 맞춰",
    "스스로 배우는 힘을 갖춘 [평생학습자]를 육성하며,",
    "언제 어디서나 누구와도 [협력]하고 일할 수 있는 역량을 기르는 교육을 합니다.",
    "[사고]와 문제 해결 능력을 배양하여",
    "글로벌 사회에서 [주도적인] 학습자가 되기 위해 노력합니다.",
    "또한, 학교 구성원 [모두가] 참여하는 따뜻하고 포용적인 학교 문화를 조성하여,",
    "모든 학생이 [자신감]을 갖고 자신의 꿈을 실현할 수 있도록 장려합니다.",
    "학생들의 미래를 밝히는 [배움터] 배움터로서,",
    "책임감 있고 사회에 공헌하는 글로벌 [리더]로 성장할 수 있도록",
    "끝없이 지원하고 [격려]하겠습니다."
  ],
  normal: [
    "서울여자중학교는 세상의 [변화]에 맞춰",
    "[스스로] 배우는 힘을 갖춘 [평생학습자]를 육성하며,",
    "언제 어디서나 누구와도 [협력]하고 일할 수 있는 역량을 기르는 교육을 합니다.",
    "[사고]와 [문제]를 배양하여",
    "[글로벌] 사회에서 [주도적인] 학습자가 되기 위해 노력합니다.",
    "또한, 학교 구성원 모두가 참여하는 [따뜻]하고 [포용]적인 학교 문화를 조성하여,",
    "모든 학생이 [자신감]을 갖고 자신의 [꿈]을 실현할 수 있도록 장려합니다.",
    "학생들의 미래를 밝히는 힘찬 [배움터]로서,",
    "[책임감] 있고 사회에 공헌하는 [글로벌] 리더로 성장할 수 있도록",
    "끝없이 [지원]하고 [격려]하겠습니다."
  ],
  hard: [
    "서울여자중학교는 세상의 [변화]에 맞춰",
    "[스스로] 배우는  [힘]을 갖춘 [평생학습자]를 육성하며,",
    "언제 어디서나 누구와도 [협력]하고 일할 수 있는 역량을 기르는 교육을 합니다.",
    "[사고]와 [문제]를 배양하여",
    "[글로벌] 사회에서 [주도적인] 학습자가 되기 위해 노력합니다.",
    "또한, 학교 구성원  [모두가]참여하는 [따뜻]하고 [포용]적인 학교 문화를 조성하여,",
    "모든 학생이 [자신감]을 갖고 자신의 [꿈]을 실현할 수 있도록 장려합니다.",
    "학생들의  [미래]를 밝히는 힘찬 [배움터]로서,",
    "[책임감] 있고 사회에  [공헌]하는 [글로벌] 리더로 성장할 수 있도록",
    "끝없이 [지원]하고 [격려]하겠습니다."
  ]
};

const BLANK_ANSWERS = {
  easy: [
    "변화", "평생학습자", "협력", "사고", "주도적인", "모두가", "자신감", "배움터", "리더", "격려"
  ],
  normal: [
    "변화", "스스로", "평생학습자", "협력", "사고", "문제", "글로벌", "주도적인", "따뜻", "포용", "자신감", "꿈", "배움터", "책임감", "글로벌", "지원", "격려"
  ],
  hard: [
    "변화", "스스로", "힘", "평생학습자", "협력", "사고", "문제", "글로벌", "주도적인", "모두가", "따뜻", "포용", "자신감", "꿈", "미래", "배움터", "책임감", "공헌", "글로벌", "지원", "격려"
  ]
};

const BLANK_HINTS_FIXED = {
  "변화": "세상의 흐름이나 상태가 바뀌는 것",
  "평생학습자": "평생 동안 배우는 사람",
  "협력": "서로 힘을 합쳐 함께 일함",
  "사고": "생각하는 것",
  "주도적인": "스스로 이끌어 나가는 태도",
  "모두가": "전체 사람들",
  "자신감": "자기 자신을 믿는 마음",
  "배움터": "배우는 장소",
  "리더": "다른 사람을 이끄는 사람",
  "격려": "힘을 내라고 북돋아 주는 것",
  "스스로": "남의 힘을 빌리지 않고 자기 혼자서",
  "문제": "해결해야 할 일이나 상황",
  "글로벌": "전 세계적인, 세계적인",
  "따뜻": "온화하고 포근한 느낌",
  "포용": "너그럽게 감싸 안음",
  "꿈": "이루고 싶은 목표나 바람",
  "책임감": "자신의 역할이나 의무를 다하려는 마음",
  "힘": "어떤 일을 해낼 수 있는 능력",
  "지원": "도와주는 것",
  "공헌": "어떤 일이나 목적을 위해 힘을 보탬"
};

// ===== 빈칸 채우기 게임 상태 및 로직 뼈대 =====
let blankGame = {
  playing: false,
  timer: null,
  timeLeft: 30,
  blanks: [], // {idx, answer, userInput}
  sentence: '',
  level: 'easy',
  score: 0,
  total: 0,
  correct: 0,
  wrong: 0,
  startTime: null,
  endTime: null
};

// --- 게임 시작 버튼 이벤트 ---
document.getElementById('blank-start-btn').onclick = function() {
  const level = document.getElementById('blank-difficulty').value;
  startBlankGame(level);
  renderBlankGame();
  startBlankGameTimer();
};

// --- 난이도 드롭다운 변경 시 미리보기로 빈칸 갱신 ---
document.getElementById('blank-difficulty').onchange = function() {
  if (!blankGame.playing) {
    const level = this.value;
    startBlankGame(level);
    renderBlankGame();
  }
};

// ===== 고정된 빈칸 게임 로직으로 변경 =====
function startBlankGame(level = 'easy') {
  blankGame.level = level;
  // 언어별 문장/정답/힌트 선택
  let sentences, answers, hints;
  if (currentLang === 'kor') {
    sentences = BLANK_SENTENCES[level];
    answers = BLANK_ANSWERS[level];
    hints = BLANK_HINTS_FIXED;
  } else {
    sentences = BLANK_SENTENCES_ENG[level];
    answers = BLANK_ANSWERS_ENG[level];
    hints = BLANK_HINTS_ENG;
  }
  blankGame.sentence = sentences ? sentences.join('\n') : '';
  blankGame.blanks = answers ? answers.map((answer, idx) => ({
    idx,
    answer,
    userInput: '',
    hint: hints[answer] || '',
    josa: ''
  })) : [];
  blankGame.playing = true;
  blankGame.timeLeft = 120;
  blankGame.score = 0;
  blankGame.correct = 0;
  blankGame.wrong = 0;
  blankGame.startTime = Date.now();
  blankGame.endTime = null;
}

function renderBlankGame() {
  let area = document.getElementById('blank-game-area');
  if (!area) {
    area = document.createElement('div');
    area.id = 'blank-game-area';
    area.style.margin = '32px 0';
    document.querySelector('.container').appendChild(area);
  }
  let html = '';
  // 언어별 문장 분기
  let sentences;
  if (currentLang === 'kor') {
    sentences = BLANK_SENTENCES[blankGame.level];
  } else {
    sentences = BLANK_SENTENCES_ENG[blankGame.level];
  }
  let blankIdx = 0;
  for (let line of sentences) {
    // [정답]을 input으로 변환
    line = line.replace(/\[([^\]]+)\]/g, (match, answer) => {
      const userInput = blankGame.blanks[blankIdx]?.userInput || '';
      let bgColor = '#fff';
      if (userInput.trim() !== '') {
        if (userInput.trim() === answer) {
          bgColor = '#e3f2fd'; // 정답
        } else {
          bgColor = '#fce4ec'; // 오답
        }
      }
      const inputHtml = `<input type="text" class="blank-input" data-idx="${blankIdx}" id="blank-input-${blankIdx}" name="blank-input-${blankIdx}" value="${userInput}" style="width:70px; margin:0 4px; text-align:center; background-color:${bgColor};" autocomplete="off" />`;
      blankIdx++;
      return inputHtml;
    });
    html += `<div style="margin-bottom:4px;">${line}</div>`;
  }
  // 제출 버튼 추가 (게임 중일 때만)
  if (blankGame.playing) {
    html += `<div style='margin-top:24px;text-align:center;'><button id="blank-submit-btn" style="background:#3f3fc9;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1.1em;">제출</button></div>`;
  } else {
    html += `<div style='margin-top:24px;text-align:center;'><button id="blank-submit-btn" style="background:#b0bec5;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1.1em;" disabled>제출</button></div>`;
  }
  area.innerHTML = html;
  // input 이벤트 연결 (기존과 동일)
  const blankInputs = area.querySelectorAll('.blank-input');
  blankInputs.forEach((input, idx) => {
    input.addEventListener('input', e => {
      const idx = Number(e.target.getAttribute('data-idx'));
      updateBlankGameInput(idx, e.target.value);
    });
    // Enter나 Tab 키로 다음 빈칸으로 이동
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const currentIdx = Number(e.target.getAttribute('data-idx'));
        const thisInput = input;
        const inputsArr = Array.from(blankInputs);
        const thisIdx = inputsArr.indexOf(thisInput);
        if (thisIdx < blankInputs.length - 1) {
          blankInputs[thisIdx + 1].focus();
        } else {
          const submitBtn = document.getElementById('blank-submit-btn');
          if (submitBtn) submitBtn.focus();
        }
      }
    });
    // 클릭 시 힌트 표시
    input.addEventListener('focus', e => {
      const oldPopup = document.getElementById('blank-hint-popup');
      if (oldPopup) oldPopup.remove();
      const idx = Number(e.target.getAttribute('data-idx'));
      setTimeout(() => {
        showHintPopup(blankGame.blanks[idx]?.hint, e.target);
      }, 1000);
    });
  });
  // 제출 버튼 이벤트 연결
  const submitBtn = document.getElementById('blank-submit-btn');
  if (blankGame.playing && submitBtn) {
    submitBtn.onclick = function() {
      endBlankGame();
    };
  }
  updateBlankGameInfo();
}

function updateBlankGameInfo() {
  document.getElementById('blank-correct').innerText = `${blankGame.score} / ${blankGame.blanks.length}`;
  document.getElementById('blank-score').innerText = blankGame.score;
  document.getElementById('blank-timer').innerText = formatBlankTime(blankGame.timeLeft);
}

function formatBlankTime(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return `${m.toString().padStart(2, '0')}:${s.padStart(4, '0')}`;
}

function startBlankGameTimer() {
  if (blankGame.timer) clearInterval(blankGame.timer);
  blankGame.timer = setInterval(() => {
    blankGame.timeLeft -= 0.1;
    if (blankGame.timeLeft <= 0) {
      blankGame.timeLeft = 0;
      endBlankGame();
    }
    updateBlankGameInfo(); // 타이머마다 하단 정보만 갱신 (입력 필드는 재생성하지 않음)
  }, 100);
}

function updateBlankGameInput(idx, value) {
  if (!blankGame.playing) return;
  blankGame.blanks[idx].userInput = value;
  // 언어별 문장 분기
  let sentences;
  if (currentLang === 'kor') {
    sentences = BLANK_SENTENCES[blankGame.level];
  } else {
    sentences = BLANK_SENTENCES_ENG[blankGame.level];
  }
  let realAnswers = [];
  for (let line of sentences) {
    line.replace(/\[([^\]]+)\]/g, (match, answer) => {
      realAnswers.push(match.replace(/\[|\]/g, ''));
      return match;
    });
  }
  // idx번째 빈칸의 실제 정답
  const realAnswer = realAnswers[idx];
  // 정답 체크 및 점수 갱신 (실제 문구 전체로 비교)
  let correct = 0;
  blankGame.blanks.forEach((b, i) => {
    const ans = realAnswers[i];
    if (b.userInput.trim() === ans) correct++;
  });
  blankGame.score = correct;
  // 입력 필드 배경색 업데이트
  const input = document.getElementById(`blank-input-${idx}`);
  if (input) {
    if (value.trim() !== '') {
      if (value.trim() === realAnswer) {
        input.style.backgroundColor = '#e3f2fd'; // 정답
      } else {
        input.style.backgroundColor = '#fce4ec'; // 오답
      }
    } else {
      input.style.backgroundColor = '#fff';
    }
  }
  updateBlankGameInfo();
}

function endBlankGame() {
  if (!blankGame.playing) return;
  blankGame.playing = false;
  blankGame.endTime = Date.now();
  if (blankGame.timer) clearInterval(blankGame.timer);
  // 언어별 문장 분기
  let sentences;
  if (currentLang === 'kor') {
    sentences = BLANK_SENTENCES[blankGame.level];
  } else {
    sentences = BLANK_SENTENCES_ENG[blankGame.level];
  }
  let realAnswers = [];
  for (let line of sentences) {
    line.replace(/\[([^\]]+)\]/g, (match, answer) => {
      realAnswers.push(match.replace(/\[|\]/g, ''));
      return match;
    });
  }
  // 정답 개수 기준으로 채점 및 기록 저장
  const total = realAnswers.length;
  let correct = 0;
  blankGame.blanks.forEach((b, i) => {
    const ans = realAnswers[i];
    if (b && b.userInput && b.userInput.trim() === ans) correct++;
  });
  const wrong = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const time = ((blankGame.endTime - blankGame.startTime) / 1000);
  // 언어와 난이도에 따라 mode, level 저장 (수정: mode에 난이도 포함)
  const mode = `${currentLang === 'kor' ? 'blank-kor' : 'blank-eng'}-${blankGame.level}`;
  const record = {
    id: user.id || 'guest',
    name: user.name || 'guest',
    mode: mode,
    level: blankGame.level,
    accuracy: accuracy,
    speed: 0,
    wrong: wrong,
    tryCount: 1,
    timestamp: Date.now(),
    time: time,
    score: correct // 점수도 명시적으로 저장
  };
  saveRecord(record);
  showBlankGameResult();
}

function showBlankGameResult() {
  // 언어별 문장 분기
  let sentences;
  if (currentLang === 'kor') {
    sentences = BLANK_SENTENCES[blankGame.level];
  } else {
    sentences = BLANK_SENTENCES_ENG[blankGame.level];
  }
  let realAnswers = [];
  for (let line of sentences) {
    line.replace(/\[([^\]]+)\]/g, (match, answer) => {
      realAnswers.push(match.replace(/\[|\]/g, ''));
      return match;
    });
  }
  const total = blankGame.blanks.length;
  let correct = 0;
  blankGame.blanks.forEach((b, i) => {
    const ans = realAnswers[i];
    if (b.userInput.trim() === ans) correct++;
  });
  const wrong = total - correct;
  const time = ((blankGame.endTime - blankGame.startTime) / 1000).toFixed(2);
  const html = `
    <div id="blank-result-modal" style="position:fixed;left:0;top:0;width:100vw;height:100vh;background:#0007;z-index:1000;display:flex;align-items:center;justify-content:center;">
      <div style="background:#fff;padding:36px 48px;border-radius:18px;min-width:320px;text-align:center;">
        <h2 style="color:#3f3fc9;margin-bottom:1em;">결과</h2>
        <div style="font-size:1.2em;margin-bottom:1em;">정확도: <b>${Math.round((correct/total)*100)}%</b></div>
        <div style="font-size:1.2em;margin-bottom:1em;">점수: <b>${correct}</b></div>
        <div style="font-size:1.2em;margin-bottom:1em;">오타수: <b>${wrong}</b></div>
        <div style="font-size:1.2em;margin-bottom:1em;">소요 시간: <b>${time}초</b></div>
        <button id="blank-result-close" style="background:#3f3fc9;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1.1em;">닫기</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
  const closeModal = () => {
    const modal = document.getElementById('blank-result-modal');
    if (modal) modal.remove();
  };
  document.getElementById('blank-result-close').onclick = closeModal;
  const keyHandler = (e) => {
    if (e.key === 'Enter') {
      closeModal();
      window.removeEventListener('keydown', keyHandler);
    }
  };
  setTimeout(() => {
    window.addEventListener('keydown', keyHandler);
  }, 0);
}

// 난이도별 빈칸 개수 반환 함수 복원
function getBlankCountByLevel(words, level) {
  if (level === 'easy') return Math.min(3, words.length);
  if (level === 'normal') return Math.min(6, words.length);
  if (level === 'hard') return Math.min(10, words.length);
  return 3;
}

// 힌트 팝업 함수(2초간 표시, input 아래에 위치, pointer-events: none, 부모에 붙임)
function showHintPopup(hint, inputEl) {
  if (!hint || !inputEl) return;
  // 기존 팝업 제거
  const old = document.getElementById('blank-hint-popup');
  if (old) old.remove();
  const popup = document.createElement('div');
  popup.id = 'blank-hint-popup';
  popup.innerText = hint;
  popup.style.position = 'absolute';
  popup.style.background = '#fff';
  popup.style.color = '#3f3fc9';
  popup.style.fontSize = '1em';
  popup.style.padding = '12px 18px';
  popup.style.borderRadius = '12px';
  popup.style.boxShadow = '0 2px 8px #0002';
  popup.style.zIndex = '2000';
  popup.style.pointerEvents = 'none';
  // input 위치 계산
  const rect = inputEl.getBoundingClientRect();
  popup.style.left = rect.left + window.scrollX + 'px';
  popup.style.top = (rect.bottom + window.scrollY + 8) + 'px';
  document.body.appendChild(popup);
  // 2초 후 팝업만 제거 (focus 반복 없음)
  setTimeout(() => {
    popup.remove();
  }, 2000);
}

// 빈칸 채우기 게임 언어 변경 함수
function setBlankLang(lang) {
  currentLang = lang;
  updateBlankLangBtnUI();
  // 게임이 진행 중이 아니면 미리보기로 빈칸 갱신
  if (!blankGame.playing) {
    const level = document.getElementById('blank-difficulty').value;
    startBlankGame(level);
    renderBlankGame();
  }
}

// 빈칸 채우기 게임 언어 버튼 UI 업데이트
function updateBlankLangBtnUI() {
  const blankLangBtns = document.querySelectorAll('#blank-game-ui .lang-btn');
  blankLangBtns.forEach(btn => btn.classList.remove('active'));
  if (currentLang === 'kor') {
    blankLangBtns[0].classList.add('active');
  } else {
    blankLangBtns[1].classList.add('active');
  }
}

// ===== 랭킹 탭 UI/로직 통합 개선 =====
// 1. 상단 탭 추가 및 상태 변수
let rankingTab = 'typing'; // 'typing' | 'blank'
let blankRankingLang = 'kor'; // 'kor' | 'eng'
let blankRankingLevel = 'easy'; // 'easy' | 'normal' | 'hard'

// 2. 랭킹 탭 UI 렌더링 함수
function renderRankingTabs() {
  const area = document.getElementById('ranking-area');
  if (!area) return;
  let html = '';
  html += `<div style="display:flex;gap:16px;justify-content:center;margin-bottom:24px;">
    <button id="tab-typing-ranking" class="ranking-tab-btn${rankingTab==='typing'?' active':''}" style="font-size:1.1em;padding:8px 24px;border:none;border-radius:8px;background:${rankingTab==='typing'?'#2a2999':'#e3e3fa'};color:${rankingTab==='typing'?'#fff':'#2a2999'};font-weight:600;">타자연습 랭킹</button>
    <button id="tab-blank-ranking" class="ranking-tab-btn${rankingTab==='blank'?' active':''}" style="font-size:1.1em;padding:8px 24px;border:none;border-radius:8px;background:${rankingTab==='blank'?'#2a2999':'#e3e3fa'};color:${rankingTab==='blank'?'#fff':'#2a2999'};font-weight:600;">빈칸 채우기 랭킹</button>
  </div>`;
  html += `<div id="ranking-tab-content"></div>`;
  area.innerHTML = html;
  document.getElementById('tab-typing-ranking').onclick = () => { rankingTab = 'typing'; renderRankingTabs(); };
  document.getElementById('tab-blank-ranking').onclick = () => { rankingTab = 'blank'; renderRankingTabs(); };
  renderRankingTabContent();
}

// 3. 각 탭별 내용 렌더링
function renderRankingTabContent() {
  const content = document.getElementById('ranking-tab-content');
  if (!content) return;
  if (rankingTab === 'typing') {
    // 기존 타자연습 랭킹 UI/로직
    content.innerHTML = `<div id="typing-ranking-ui"></div>`;
    renderTypingRankingUI();
  } else {
    // 빈칸 채우기 랭킹 UI/로직
    content.innerHTML = `<div id="blank-ranking-ui"></div>`;
    renderBlankRankingUI();
  }
}

// 4. 타자연습 랭킹 UI 기존 함수 호출
function renderTypingRankingUI() {
  // 기존 모드별 버튼/테이블을 #typing-ranking-ui 내부에 렌더링
  const area = document.getElementById('typing-ranking-ui');
  if (!area) return;
  area.innerHTML = `<div id="ranking-mode-btns"></div><div id="ranking-table-area"></div>`;
  renderRankingModeBtns();
  showRankingTable(selectedModeKey);
}

// 5. 빈칸 채우기 랭킹 UI
function renderBlankRankingUI() {
  const area = document.getElementById('blank-ranking-ui');
  if (!area) return;
  // 언어/난이도 필터 버튼
  let html = '';
  html += `<div style="display:flex;gap:12px;justify-content:center;margin-bottom:18px;">
    <button class="blank-lang-btn${blankRankingLang==='kor'?' active':''}" data-lang="kor" style="padding:6px 18px;border:none;border-radius:6px;background:${blankRankingLang==='kor'?'#3f3fc9':'#e3e3fa'};color:${blankRankingLang==='kor'?'#fff':'#3f3fc9'};font-weight:600;">한글</button>
    <button class="blank-lang-btn${blankRankingLang==='eng'?' active':''}" data-lang="eng" style="padding:6px 18px;border:none;border-radius:6px;background:${blankRankingLang==='eng'?'#3f3fc9':'#e3e3fa'};color:${blankRankingLang==='eng'?'#fff':'#3f3fc9'};font-weight:600;">영어</button>
    <span style="width:32px;"></span>
    <button class="blank-level-btn${blankRankingLevel==='easy'?' active':''}" data-level="easy" style="padding:6px 18px;border:none;border-radius:6px;background:${blankRankingLevel==='easy'?'#3f3fc9':'#e3e3fa'};color:${blankRankingLevel==='easy'?'#fff':'#3f3fc9'};font-weight:600;">쉬움</button>
    <button class="blank-level-btn${blankRankingLevel==='normal'?' active':''}" data-level="normal" style="padding:6px 18px;border:none;border-radius:6px;background:${blankRankingLevel==='normal'?'#3f3fc9':'#e3e3fa'};color:${blankRankingLevel==='normal'?'#fff':'#3f3fc9'};font-weight:600;">보통</button>
    <button class="blank-level-btn${blankRankingLevel==='hard'?' active':''}" data-level="hard" style="padding:6px 18px;border:none;border-radius:6px;background:${blankRankingLevel==='hard'?'#3f3fc9':'#e3e3fa'};color:${blankRankingLevel==='hard'?'#fff':'#3f3fc9'};font-weight:600;">어려움</button>
  </div>`;
  html += `<div id="blank-ranking-table-area"></div>`;
  area.innerHTML = html;
  // 버튼 이벤트 연결 (UI 렌더링 후 항상 재연결)
  area.querySelectorAll('.blank-lang-btn').forEach(btn => {
    btn.onclick = () => { blankRankingLang = btn.getAttribute('data-lang'); renderBlankRankingUI(); };
  });
  area.querySelectorAll('.blank-level-btn').forEach(btn => {
    btn.onclick = () => { blankRankingLevel = btn.getAttribute('data-level'); renderBlankRankingUI(); };
  });
  renderBlankRankingTable();
}

// 6. 빈칸 랭킹 테이블 렌더링
function renderBlankRankingTable() {
  const area = document.getElementById('blank-ranking-table-area');
  if (!area) return;
  // firebase에서 모든 기록 불러오기
  db.ref('records').once('value', snapshot => {
    const records = [];
    snapshot.forEach(userSnap => {
      userSnap.forEach(modeSnap => {
        const rec = modeSnap.val();
        // mode가 blank-kor-easy, blank-eng-hard 등으로 저장된 것만 필터
        if (rec && rec.mode && rec.mode.startsWith('blank-')) {
          records.push(rec);
        }
      });
    });
    // 필터 적용 (수정: mode 조합으로 필터)
    const langKey = blankRankingLang === 'kor' ? 'blank-kor' : 'blank-eng';
    const modeKey = `${langKey}-${blankRankingLevel}`;
    const filtered = records.filter(r => r.mode === modeKey);
    // 정렬: 정확도 → 점수 → 소요시간(짧은 순)
    filtered.sort((a, b) => b.accuracy - a.accuracy || b.score - a.score || a.time - b.time);
    // 테이블 렌더링
    let html = '';
    html += `<table style="width:100%;margin-top:8px;border-collapse:collapse;">
      <thead><tr style="background:#f5f6fa;">
        <th style="padding:8px 0;">순위</th><th>이름</th><th>정확도</th><th>점수</th><th>오타수</th><th>소요시간</th><th>날짜</th><th>언어</th><th>난이도</th>
      </tr></thead><tbody>`;
    if (filtered.length === 0) {
      html += `<tr><td colspan="9" style="text-align:center;color:#888;padding:18px;">아직 기록이 없습니다.</td></tr>`;
    } else {
      filtered.slice(0, 20).forEach((r, i) => {
        const date = new Date(r.timestamp);
        const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
        html += `<tr style="text-align:center;">
          <td>${i+1}</td>
          <td>${r.id}_${r.name}</td>
          <td>${r.accuracy}%</td>
          <td>${typeof r.score !== 'undefined' ? r.score : (typeof r.blankScore !== 'undefined' ? r.blankScore : (typeof r.blank_score !== 'undefined' ? r.blank_score : '-'))}</td>
          <td>${r.wrong}</td>
          <td>${r.time ? r.time.toFixed(2)+'초' : '-'}</td>
          <td>${dateStr}</td>
          <td>${r.mode.startsWith('blank-kor')?'한글':'영어'}</td>
          <td>${r.level==='easy'?'쉬움':r.level==='normal'?'보통':'어려움'}</td>
        </tr>`;
      });
    }
    html += '</tbody></table>';
    area.innerHTML = html;
  });
}

// 7. 페이지 로드 시 랭킹 탭 렌더링으로 초기화
window.onload = function() {
  loadAllRankings(() => showRankingSlide(0));
  startRankingSlider(0); // 슬라이드 자동 시작
  renderRankingTabs(); // 랭킹 탭 UI 렌더링
};

// ===== 영어 빈칸 채우기 게임용 문장/정답/힌트 추가 =====
const BLANK_SENTENCES_ENG = {
  easy: [
    "Seoul Girls Middle School adapts to the [changes] of the world,",
    "nurtures [lifelong learners] with the ability to learn independently,",
    "and provides education that fosters the capacity to [collaborate] and work with anyone, anywhere.",
    "By cultivating [creative thinking] and [problem-solving skills],",
    "we strive to develop [proactive] learners in the global society.",
    "Additionally, we create a [warm] and [inclusive] school culture where all members participate,",
    "encouraging every student to gain [confidence] and pursue their [dreams].",
    "As a [vibrant learning environment] that brightens the [future] of our students,",
    "we will continuously support and [encourage] them to grow into responsible global [leaders] who contribute to society."
  ],
  normal: [
    "Seoul Girls Middle School adapts to the [changes] of the world,",
    "[independently] learning [lifelong learners] are nurtured,",
    "and provides education that fosters the capacity to [collaborate] and work with anyone, anywhere.",
    "By cultivating [creative thinking] and [problem-solving skills],",
    "in the [global] society, we strive to develop [proactive] learners.",
    "Additionally, all [members] participate in creating a [warm] and [inclusive] school culture,",
    "encouraging every student to gain [confidence] and realize their [dreams].",
    "As a [vibrant learning environment] that brightens the [future] of our students,",
    "with [responsibility] and contributing to society as a [global] leader,",
    "we will continuously [support] and [encourage] them."
  ],
  hard: [
    "Seoul Girls Middle School adapts to the [changes] of the world,",
    "[independently] learning [ability] is fostered in [lifelong learners],",
    "and provides education that fosters the capacity to [collaborate] and work with anyone, anywhere.",
    "By cultivating [creative thinking] and [problem-solving skills],",
    "in the [global] society, we strive to develop [proactive] learners.",
    "Additionally, all [members] participate in creating a [warm] and [inclusive] school culture,",
    "encouraging every student to gain [confidence] and realize their [dreams].",
    "As a [vibrant learning environment] that brightens the [future] of our students,",
    "with [responsibility] and [contributing] as a [global] leader,",
    "we will continuously [support] and [encourage] them."
  ]
};
const BLANK_ANSWERS_ENG = {
  easy: [
    "changes", "lifelong learners", "collaborate", "creative thinking", "problem-solving skills", "proactive", "warm", "inclusive", "confidence", "dreams", "vibrant learning environment", "future", "encourage", "leaders"
  ],
  normal: [
    "changes", "independently", "lifelong learners", "collaborate", "creative thinking", "problem-solving skills", "global", "proactive", "members", "warm", "inclusive", "confidence", "dreams", "vibrant learning environment", "future", "responsibility", "global", "support", "encourage"
  ],
  hard: [
    "changes", "independently", "ability", "lifelong learners", "collaborate", "creative thinking", "problem-solving skills", "global", "proactive", "members", "warm", "inclusive", "confidence", "dreams", "vibrant learning environment", "future", "responsibility", "contributing", "global", "support", "encourage"
  ]
};
const BLANK_HINTS_ENG = {
  "changes": "The act or process of becoming different",
  "lifelong learners": "People who keep learning throughout their lives",
  "collaborate": "To work together with others",
  "creative thinking": "The ability to think in new and original ways",
  "problem-solving skills": "The ability to find solutions to difficult situations",
  "proactive": "Taking action by causing change and not only reacting to change",
  "warm": "Friendly and welcoming",
  "inclusive": "Including all kinds of people and treating them all fairly and equally",
  "confidence": "Belief in yourself and your abilities",
  "dreams": "Things you want to achieve in the future",
  "vibrant learning environment": "A lively and energetic place to learn",
  "future": "The time yet to come",
  "encourage": "To give hope or confidence to someone",
  "leaders": "People who guide or direct others",
  "independently": "Without help from others; on your own",
  "ability": "The skill or power to do something",
  "global": "Relating to the whole world",
  "members": "People who belong to a group or organization",
  "responsibility": "A duty or job that you are required or expected to do",
  "support": "To help or assist",
  "contributing": "Giving or adding something to help achieve a result"
};
