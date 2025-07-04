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
  'Seoul Girls Middle School aims to nurture',
  'lifelong learners with the ability to learn independently in response to changes in the world.',
  'The school provides education that fosters the capacity to collaborate and work with anyone, anywhere.',
  'By cultivating creative thinking and problem-solving skills, we strive to develop proactive learners in the global society.',
  'Additionally, we create a warm and inclusive school culture where all members participate,',
  'encouraging every student to gain confidence and pursue their dreams.',
  'As a vibrant learning environment that brightens the future of our students,',
  'we will continuously support and encourage them to grow into responsible global leaders who contribute to society.'
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
  // 10ms마다 WPM/시간 갱신
  typingRealtimeTimer = setInterval(() => {
    document.getElementById('typing-wpm').innerText = calcWPM();
    document.getElementById('typing-time').innerText = formatTypingTime();
  }, 10);
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
  document.querySelectorAll('.lang-btn')[0].onclick = () => setTypingLang('kor');
  document.querySelectorAll('.lang-btn')[1].onclick = () => setTypingLang('eng');
  // 글 종류 버튼
  document.querySelectorAll('.type-btn')[0].onclick = () => setTypingType('short');
  document.querySelectorAll('.type-btn')[1].onclick = () => setTypingType('long');
  // 최초 시작
  updateTypingLines();
  updateLangBtnUI();
  updateTypeBtnUI();
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
      if (btn.textContent.includes('랭킹')) {
        if (practiceArea) practiceArea.style.display = 'none';
        if (statArea) statArea.style.display = 'none';
        if (restartArea) restartArea.style.display = 'none';
        if (langTypeArea) langTypeArea.style.display = 'none';
        document.getElementById('ranking-area').style.display = '';
        showRankingTable(selectedModeKey);
      } else {
        if (practiceArea) practiceArea.style.display = '';
        if (statArea) statArea.style.display = '';
        if (restartArea) restartArea.style.display = '';
        if (langTypeArea) langTypeArea.style.display = '';
        document.getElementById('ranking-area').style.display = 'none';
      }
    });
  });
  // 랭킹 모드 버튼 렌더링
  renderRankingModeBtns();
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
  // 정확도 0% 또는 타수 0이면 저장하지 않음
  if (record.accuracy === 0 || record.speed === 0) return;
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
    document.getElementById('ranking-table-body').innerHTML = rows;
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
  const btns = MODES_LABELS.map(m => `<button class="ranking-mode-btn${selectedModeKey===m.key?' active':''}" data-mode="${m.key}">${m.label}</button>`).join(' ');
  document.getElementById('ranking-mode-btns').innerHTML = btns;
  document.querySelectorAll('.ranking-mode-btn').forEach(btn => {
    btn.onclick = () => {
      selectedModeKey = btn.getAttribute('data-mode');
      renderRankingModeBtns();
      showRankingTable(selectedModeKey);
    };
  });
}
