let user = { id: '', name: '' };
let mode = '', startTime, endTime, text, tryCount = 1;
let started = false; // 타이머 시작 여부

const MODES = [
  { key: 'kor-short', label: '한글 짧은 글' },
  { key: 'kor-long', label: '한글 긴 글' },
  { key: 'eng-short', label: '영문 짧은 글' },
  { key: 'eng-long', label: '영문 긴 글' }
];

let rankingsByMode = {};
let currentModeIndex = 0;
let slideInterval = null;

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

function saveRecord(record) {
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
        }, 1000); // 1초 대기 후 랭킹 갱신
      });
    } else {
      setTimeout(() => {
        loadRanking();
        loadAllRankings();
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
      rankingsByMode[key] = rankingsByMode[key].slice(0, 5);
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
      return `<li><b>${i + 1}위</b> [${r.id}] ${r.name}<br><span style=\"font-size:0.9em;color:#888;\">${dateStr}</span><br>정확도 ${r.accuracy}% | 속도 ${r.speed}타/분</li>`;
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
