// ===== 상수 =====
const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#6b7280','#84cc16','#06b6d4'];
const ALL_CATS = ['식비/외식','카페/베이커리','교통','쇼핑','대형마트','편의점','의료/건강','문화/여가','여행','미용','생활','기타'];
const RULES = {
  '식비/외식': ['식당','치킨','피자','분식','한식','중식','일식','스시','초밥','횟집','라멘','우동','소바','돈가스','삼겹','갈비','곱창','찜닭','닭갈비','보쌈','족발','김밥','도시락','국밥','설렁탕','해장국','순대국','부대찌개','찌개','냉면','막국수','떡볶이','순대','배달의민족','요기요','쿠팡이츠','두두','꽃낙','아맘','쑥꿀레','파이브가이즈','버거','맥도날드','롯데리아','버거킹','맘스터치','서브웨이','쉐이크쉑','도미노','피자헛','멸치','밥상','레스토랑','브런치','다이닝'],
  '카페/베이커리': ['커피','카페','스타벅스','투썸','메가커피','컴포즈','이디야','빽다방','할리스','베이커리','제과','빵','파리바게뜨','뚜레쥬르','아우어베이커리','레망도레','르뱅','마카롱','디저트','케이크','도넛','던킨','크리스피','클럽드바리스타','밀크티','버블티','공차','아이스크림','배스킨','빙수'],
  '교통': ['택시','카카오t','버스','지하철','철도','ktx','srt','주유','gs칼텍스','sk에너지','충전','ev','톨게이트','하이패스','주차','파킹','도시철도'],
  '쇼핑': ['쿠팡','네이버페이','마켓컬리','컬리페이','11번가','지마켓','옥션','위메프','티몬','무신사','29cm','에이블리','카카오선물','배민스토어','오늘의집','롯데쇼핑','신세계','현대백화점','갤러리아','백화점','아울렛','면세점','루이비통','샤넬','구찌','프라다','톰포드','dior','hermes','에르메스','애플','나이키','아디다스','뉴발란스','zara','유니클로','무인양품'],
  '대형마트': ['코스트코','이마트','롯데마트','홈플러스','트레이더스','메가마트'],
  '편의점': ['gs25','cu','세븐일레븐','이마트24','미니스톱'],
  '의료/건강': ['약국','병원','의원','치과','한의원','의료','검진','정형','피부과','내과','산부인과','안과','재활','물리치료','마사지','요가','필라테스','헬스','올리브영','왓슨스','비타민','영양제'],
  '문화/여가': ['영화','cgv','메가박스','롯데시네마','공연','뮤지컬','연극','콘서트','전시','박물관','미술관','교보','서점','넷플릭스','왓챠','티빙','멜론','게임','스팀','볼링','당구','테니스','골프','수영','클라이밍','스키','시설공단'],
  '여행': ['호텔','hotel','리조트','resort','펜션','모텔','에어비앤비','airbnb','야놀자','여기어때','항공','airlines','아시아나','대한항공','제주항공','진에어','티웨이','인터파크투어','하나투어','모두투어','익스피디아','booking','agoda'],
  '미용': ['바버','바버샵','헤어','미용실','살롱','네일','왁싱','피부관리','이발'],
  '생활': ['통신','sk텔레콤','kt통신','lg유플','전기','가스','수도','관리비','보험','세탁','청소','렌탈','인터넷','문구','학원','교육'],
};

// ===== 유틸 =====
function classify(name) {
  const n = (name || '').toLowerCase();
  for (const [cat, kws] of Object.entries(RULES)) {
    if (kws.some(k => n.includes(k.toLowerCase()))) return { cat, certain: true };
  }
  return { cat: '기타', certain: false };
}
function fmt(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
function fmtDate(s) { return (s || '').replace(/(\d{4})년\s*(\d{2})월\s*(\d{2})일/, '$1.$2.$3'); }

// ===== 상태 =====
let cfg = null, currentPin = '';
let pinBuf = '', setupBuf = '', tempMembers = [];
let curType = 'income', curWho = '', whoFilter = 'all', allTxs = [];
let curStatWho = '', pendingFiles = [], allStatTxs = [], statFilter = '전체', donutChart = null;
let customCats = {}, activePeriods = new Set();
let statWhoFilter = 'all', selCats = new Set(), monthlyChartInst = null, catTrendInst = null;
let txUnsubscribe = null;

// ===== 잠금화면 =====
function showMainBtns() {
  document.getElementById('mainBtns').style.display = '';
  document.getElementById('lockSub').style.display = '';
  document.getElementById('pinArea').style.display = 'none';
  document.getElementById('setupArea').style.display = 'none';
  pinBuf = ''; setupBuf = '';
}

function showSetup() {
  document.getElementById('mainBtns').style.display = 'none';
  document.getElementById('lockSub').style.display = 'none';
  document.getElementById('setupArea').style.display = '';
  setupBuf = ''; tempMembers = [];
  renderSetupDots();
  document.getElementById('memberRow').innerHTML = '';
  document.getElementById('setupErr').textContent = '';
}

function showPinInput() {
  document.getElementById('mainBtns').style.display = 'none';
  document.getElementById('lockSub').style.display = 'none';
  document.getElementById('pinArea').style.display = '';
  document.getElementById('pinLabel').textContent = '비밀번호(입장 코드) 입력';
  pinBuf = ''; renderPinDots();
  document.getElementById('pinErr').textContent = '';
}

function pinKey(v) {
  if (v === 'back') { pinBuf = pinBuf.slice(0, -1); renderPinDots(); return; }
  if (pinBuf.length >= 4) return;
  pinBuf += v; renderPinDots();
  if (pinBuf.length === 4) {
    setTimeout(async () => {
      const data = await window.dbRef.getCfg(pinBuf);
      if (data) {
        cfg = data; currentPin = pinBuf;
        unlockApp();
      } else {
        document.getElementById('pinErr').textContent = '해당 가계부를 찾을 수 없어요';
        pinBuf = ''; renderPinDots();
      }
    }, 200);
  }
}

function renderPinDots() {
  document.querySelectorAll('#pinDots .pin-dot').forEach((d, i) => {
    d.className = 'pin-dot' + (i < pinBuf.length ? ' on' : '');
  });
}

function setupKey(v) {
  if (v === 'back') { setupBuf = setupBuf.slice(0, -1); renderSetupDots(); return; }
  if (setupBuf.length >= 4) return;
  setupBuf += v; renderSetupDots();
}

function renderSetupDots() {
  document.querySelectorAll('#setupDots .pin-dot').forEach((d, i) => {
    d.className = 'pin-dot' + (i < setupBuf.length ? ' on' : '');
  });
}

function addMember() {
  const val = document.getElementById('memberInput').value.trim();
  if (!val) return;
  addMemberTag(val);
  document.getElementById('memberInput').value = '';
}

function addMemberTag(name) {
  if (tempMembers.includes(name)) return;
  tempMembers.push(name);
  const row = document.getElementById('memberRow');
  const span = document.createElement('span');
  span.className = 'm-tag'; span.dataset.name = name;
  span.innerHTML = name + '<span class="m-rm tap" onclick="removeMember(this)">&#215;</span>';
  row.appendChild(span);
}

function removeMember(el) {
  const name = el.parentElement.dataset.name;
  tempMembers = tempMembers.filter(m => m !== name);
  el.parentElement.remove();
}

async function createApp() {
  const name = document.getElementById('setupName').value.trim();
  if (!name) { document.getElementById('setupErr').textContent = '가계부 이름을 입력해주세요'; return; }
  if (setupBuf.length < 4) { document.getElementById('setupErr').textContent = '비밀번호 4자리를 입력해주세요'; return; }
  if (tempMembers.length === 0) { document.getElementById('setupErr').textContent = '멤버를 1명 이상 추가해주세요'; return; }
  const members = [...tempMembers, '공통'];
  const data = { name, pin: setupBuf, members, createdAt: Date.now() };
  const existing = await window.dbRef.getCfg(setupBuf);
  if (existing) { document.getElementById('setupErr').textContent = '이미 사용 중인 비밀번호예요. 다른 번호를 사용해주세요'; return; }
  await window.dbRef.saveCfg(setupBuf, data);
  cfg = data; currentPin = setupBuf;
  unlockApp();
}

function unlockApp() {
  document.getElementById('lockScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = '';
  initApp();
  if (txUnsubscribe) txUnsubscribe();
  txUnsubscribe = window.dbRef.subscribeTxs(currentPin, txs => renderTxList(txs));
}

function logout() {
  if (txUnsubscribe) { txUnsubscribe(); txUnsubscribe = null; }
  cfg = null; currentPin = ''; allTxs = [];
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('lockScreen').style.display = '';
  showMainBtns();
}

async function resetCfg() {
  if (!confirm('이 가계부의 설정을 초기화할까요?')) return;
  await window.dbRef.deleteCfg(currentPin);
  logout();
}

async function resetTxs() {
  if (!confirm('모든 거래 내역을 삭제할까요?\n되돌릴 수 없어요.')) return;
  await window.dbRef.deleteAllTxs(currentPin, allTxs.map(t => t.id));
  alert('삭제 완료!');
}

// ===== 앱 초기화 =====
function initApp() {
  document.getElementById('inDate').value = new Date().toISOString().split('T')[0];
  const members = cfg.members;
  curWho = members[0]; curStatWho = members[0];
  const cols = `repeat(${members.length},1fr)`;

  function makeWhoToggle(id, fn) {
    const el = document.getElementById(id);
    el.style.gridTemplateColumns = cols;
    el.innerHTML = members.map((m, i) => {
      const cls = i === 0 ? 'am' : i === 1 ? 'aw' : 'ac';
      return `<button class="who-btn ${cls} tap" onclick="${fn}('${m}')">${m}</button>`;
    }).join('');
  }
  makeWhoToggle('whoToggle0', 'setWho');
  makeWhoToggle('whoToggle1', 'setStatWho');

  const wt2 = document.getElementById('whoToggle2');
  wt2.style.gridTemplateColumns = `repeat(${members.length + 1},1fr)`;
  wt2.innerHTML = `<button class="who-btn am tap" onclick="setStatWhoFilter('all',this)">전체</button>` +
    members.map(m => `<button class="who-btn tap" onclick="setStatWhoFilter('${m}',this)">${m}</button>`).join('');

  document.getElementById('whoFilter0').innerHTML =
    `<button class="pill active tap" onclick="setWhoFilter('all',this)">전체</button>` +
    members.map(m => `<button class="pill tap" onclick="setWhoFilter('${m}',this)">${m}</button>`).join('');

  document.getElementById('sumGrid').style.gridTemplateColumns = `repeat(${Math.min(members.length, 3)},1fr)`;
  document.getElementById('cfgInfo').innerHTML =
    `<div class="info-row"><b>가계부 이름</b>: ${cfg.name}</div>` +
    `<div class="info-row"><b>입장 코드</b>: ${currentPin}</div>` +
    `<div class="info-row"><b>멤버</b>: ${cfg.members.join(', ')}</div>`;

  renderSummary([]);
}

function switchTab(idx) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
  document.querySelectorAll('.tab-content').forEach((c, i) => c.classList.toggle('active', i === idx));
  if (idx === 2) renderMonthly();
}

function setWho(who) {
  curWho = who;
  document.querySelectorAll('#whoToggle0 .who-btn').forEach((b, i) => {
    b.className = 'who-btn tap';
    if (cfg.members[i] === who) b.className += (i === 0 ? ' am' : i === 1 ? ' aw' : ' ac');
  });
}

function setType(type) {
  curType = type;
  document.getElementById('btnIncome').classList.toggle('active', type === 'income');
  document.getElementById('btnExpense').classList.toggle('active', type === 'expense');
  document.getElementById('submitBtn').className = `submit-btn ${type} tap`;
}

function setWhoFilter(who, btn) {
  whoFilter = who;
  btn.closest('.filter-row').querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTxList(allTxs);
}

async function addTx() {
  if (!window.dbRef) { alert('연결 중입니다.'); return; }
  const amount = parseInt(document.getElementById('inAmt').value);
  const desc = document.getElementById('inDesc').value.trim();
  const cat = document.getElementById('inCat').value;
  const date = document.getElementById('inDate').value;
  if (!amount || !desc || !date) { alert('금액, 적요, 날짜를 모두 입력해주세요'); return; }
  await window.dbRef.addTx(currentPin, { type: curType, amount, desc, category: cat, date, who: curWho, createdAt: Date.now() });
  document.getElementById('inAmt').value = '';
  document.getElementById('inDesc').value = '';
  document.getElementById('inCat').value = '';
}

async function delTx(id) {
  if (!confirm('삭제할까요?')) return;
  await window.dbRef.deleteTx(currentPin, id);
}

function renderSummary(txs) {
  allTxs = txs;
  const members = cfg.members;
  document.getElementById('sumGrid').innerHTML = members.map((m, idx) => {
    const g = txs.filter(t => t.who === m);
    const inc = g.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = g.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const bal = inc - exp;
    const col = idx === 0 ? '#3730a3' : idx === 1 ? '#9d174d' : '#065f46';
    return `<div class="sum-sec">
      <div class="wl" style="color:${col}">${m}</div>
      <div class="row"><span style="color:#9ca3af">수입</span><span class="val" style="color:#10b981">${fmt(inc)}</span></div>
      <div class="row"><span style="color:#9ca3af">지출</span><span class="val" style="color:#ef4444">${fmt(exp)}</span></div>
      <div class="bal"><span>잔액</span><span style="color:${bal >= 0 ? '#10b981' : '#ef4444'}">${bal < 0 ? '-' : ''}${fmt(Math.abs(bal))}</span></div>
    </div>`;
  }).join('');
}

function renderTxList(txs) {
  allTxs = txs; renderSummary(txs);
  const filtered = whoFilter === 'all' ? txs : txs.filter(t => t.who === whoFilter);
  const list = document.getElementById('txList');
  if (!filtered.length) { list.innerHTML = '<div class="empty">아직 내역이 없어요</div>'; return; }
  const members = cfg.members;
  list.innerHTML = filtered.map(t => {
    const mi = members.indexOf(t.who);
    const wc = mi === 0 ? 'background:#eff6ff;color:#3730a3' : mi === 1 ? 'background:#fdf2f8;color:#9d174d' : 'background:#f0fdf4;color:#065f46';
    return `<div class="tx-item">
      <div class="tx-l">
        <div class="tx-dot" style="background:${t.type === 'income' ? '#10b981' : '#ef4444'}"></div>
        <div>
          <div class="tx-desc">
            <span>${t.desc}</span>
            <span class="wtag" style="${wc}">${t.who || members[0]}</span>
            ${t.category ? `<span class="ctag">${t.category}</span>` : ''}
          </div>
          <div class="tx-meta">${t.date}</div>
        </div>
      </div>
      <div class="tx-r">
        <div class="tx-amt" style="color:${t.type === 'income' ? '#10b981' : '#ef4444'}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div>
        <button class="del-btn tap" onclick="delTx('${t.id}')">&#215;</button>
      </div>
    </div>`;
  }).join('');
}

// ===== 명세서 파싱 =====
function setStatWho(who) {
  curStatWho = who;
  document.querySelectorAll('#whoToggle1 .who-btn').forEach((b, i) => {
    b.className = 'who-btn tap';
    if (cfg.members[i] === who) b.className += (i === 0 ? ' am' : i === 1 ? ' aw' : ' ac');
  });
}

function parseHyundai(text) {
  const fixed = text.replace(/<\/t([dh])\s+>/gi, '<\/t$1>');
  const pm = text.match(/(\d{4})년\s*(\d{2})월\s*이용대금명세서/);
  const period = pm ? `${pm[1]}-${pm[2]}` : null;
  const rowMs = [...fixed.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];
  const allRows = rowMs.map(m => {
    const cells = [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
    return cells.map(c => c[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
  }).filter(r => r.length > 0);
  const hIdx = allRows.findIndex(r => r.includes('이용일') && r.includes('이용가맹점'));
  if (hIdx < 0) return null;
  const h = allRows[hIdx];
  const iD = h.indexOf('이용일'), iS = h.indexOf('이용가맹점'), iA = h.indexOf('이용금액');
  const txs = allRows.slice(hIdx + 1).map(row => {
    const store = row[iS] || '';
    const custom = customCats[store];
    const res = custom ? { cat: custom, certain: true } : classify(store);
    return { date: row[iD] || '', store, amount: parseInt((row[iA] || '0').replace(/[^0-9]/g, '')) || 0, category: res.cat, certain: res.certain };
  }).filter(t => t.store && t.amount > 0);
  return { txs, period };
}

function parseWoori(buf) {
  try {
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const hIdx = rows.findIndex(r => r.some(c => String(c).includes('가맹점')));
    if (hIdx < 0) return null;
    const h = rows[hIdx].map(c => String(c).trim());
    const iS = h.findIndex(x => x.includes('가맹점'));
    const iA = h.findIndex(x => x.includes('승인금액') || x.includes('이용금액'));
    const iD = h.findIndex(x => x.includes('접수일') || x.includes('이용일') || x.includes('거래일'));
    if (iS < 0 || iA < 0) return null;
    let period = null;
    for (let i = 0; i < hIdx; i++) {
      for (let j = 0; j < rows[i].length; j++) {
        const m = String(rows[i][j]).match(/(\d{4})[\/\-](\d{2})/);
        if (m) { period = `${m[1]}-${m[2]}`; break; }
      }
      if (period) break;
    }
    const txs = rows.slice(hIdx + 1).map(row => {
      const store = String(row[iS] || '').trim();
      const amt = parseInt(String(row[iA] || '0').replace(/[^0-9]/g, '')) || 0;
      const dr = iD >= 0 ? String(row[iD] || '') : '';
      const dm = dr.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
      const date = dm ? `${dm[1]}년 ${dm[2]}월 ${dm[3]}일` : dr;
      const custom = customCats[store];
      const res = custom ? { cat: custom, certain: true } : classify(store);
      return { date, store, amount: amt, category: res.cat, certain: res.certain };
    }).filter(t => t.store && t.amount > 0 && !t.store.includes('합계'));
    return { txs, period };
  } catch(e) { return null; }
}

async function parseImageOCR(file) {
  // base64 변환
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Vercel Function 호출
  const resp = await fetch('/api/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 })
  });
  if (!resp.ok) throw new Error('OCR 분석 실패: ' + resp.status);
  const data = await resp.json();

  // 텍스트 추출
  let fullText = '';
  if (data.responses && data.responses[0] && data.responses[0].fullTextAnnotation) {
    fullText = data.responses[0].fullTextAnnotation.text;
  } else if (data.responses && data.responses[0] && data.responses[0].textAnnotations && data.responses[0].textAnnotations.length > 0) {
    fullText = data.responses[0].textAnnotations[0].description;
  }
  if (!fullText) throw new Error('텍스트를 인식하지 못했어요. 더 선명한 이미지를 사용해주세요.');

  // 연월 추출
  const periodMatch = fullText.match(/(\d{4})[.\-\/년]\s*(\d{1,2})[.\-\/월]/);
  const today = new Date().toISOString().slice(0, 7);
  const period = periodMatch ? `${periodMatch[1]}-${periodMatch[2].padStart(2, '0')}` : today;

  // 라인별 파싱
  const lines = fullText.split('\n').map(l => l.trim()).filter(l => l);
  const txs = [];
  const seen = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const amtMatches = line.match(/\d{1,3}(?:,\d{3})+/g);
    if (!amtMatches) continue;
    const amount = parseInt(amtMatches[amtMatches.length - 1].replace(/,/g, ''));
    if (amount < 100 || amount > 10000000) continue;

    // 가맹점명: 금액/날짜 제거 후 남은 텍스트
    let store = line.replace(/\d{1,3}(?:,\d{3})+/g, '').replace(/\d{2}[\/\.\-]\d{2}/g, '').replace(/원/g, '').trim();
    store = store.replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s\-_&]/g, '').trim();
    if (!store || store.length < 2) {
      // 이전 라인에서 가맹점명 가져오기
      store = (lines[i - 1] || '').replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s\-_&]/g, '').trim();
    }
    if (!store || store.length < 2) continue;

    const key = `${store}_${amount}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const dateMatch = line.match(/(\d{2})[\/\.\-](\d{2})/);
    const date = dateMatch
      ? `${period.slice(0, 4)}년 ${dateMatch[1]}월 ${dateMatch[2]}일`
      : `${period.slice(0, 4)}년 ${period.slice(5, 7)}월`;

    const custom = customCats[store];
    const res = custom ? { cat: custom, certain: true } : classify(store);
    txs.push({ date, store, amount, category: res.cat, certain: res.certain });
  }

  return { txs, period };
}

document.getElementById('fileInput').addEventListener('change', e => {
  Array.from(e.target.files).forEach(f => {
    if (!pendingFiles.find(p => p.name === f.name)) pendingFiles.push({ file: f, name: f.name, period: null, count: 0 });
  });
  e.target.value = '';
  renderFileList();
});

function removeFile(name) { pendingFiles = pendingFiles.filter(p => p.name !== name); renderFileList(); }

function renderFileList() {
  document.getElementById('ufiles').innerHTML = pendingFiles.map(p =>
    `<div class="ufile">
      <div><div class="fname">${p.name}</div><div class="fmeta">${p.period ? p.period + ' · ' + p.count + '건' : '대기 중'}</div></div>
      <button class="frm tap" onclick="removeFile('${p.name}')">&#215;</button>
    </div>`
  ).join('');
  document.getElementById('analyzeBtn').disabled = pendingFiles.length === 0;
}

async function analyzeAll() {
  document.getElementById('errMsg').textContent = '';
  const btn = document.getElementById('analyzeBtn');
  btn.textContent = '분석 중...'; btn.disabled = true;
  const results = [];

  for (const pf of pendingFiles) {
    try {
      const isImage = /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(pf.name) || pf.file.type.startsWith('image/');
      let parsed = null;

      if (isImage) {
        parsed = await parseImageOCR(pf.file);
      } else {
        const ab = await pf.file.arrayBuffer();
        const magic = new Uint8Array(ab.slice(0, 4));
        const isXLS = magic[0] === 0xD0 && magic[1] === 0xCF;
        parsed = isXLS ? parseWoori(new Uint8Array(ab)) : parseHyundai(await pf.file.text());
      }

      if (!parsed || !parsed.txs.length) throw new Error(`${pf.name}: 내역을 찾지 못했어요`);
      pf.period = parsed.period || '날짜불명';
      pf.count = parsed.txs.length;
      parsed.txs.forEach(t => results.push({ ...t, who: curStatWho, period: pf.period, source: pf.name }));
    } catch(e) {
      document.getElementById('errMsg').textContent = e.message;
      btn.textContent = '분석하기'; btn.disabled = false;
      return;
    }
  }

  renderFileList();
  allStatTxs = results; statFilter = '전체';
  const ps = [...new Set(results.map(t => t.period))].sort();
  activePeriods = new Set(ps);
  renderAnalysis();
  document.getElementById('analysisResult').style.display = '';
  btn.textContent = '분석하기'; btn.disabled = false;
}

function getActiveTxs() { return allStatTxs.filter(t => activePeriods.has(t.period)); }

function renderPeriodBadges() {
  const ps = [...new Set(allStatTxs.map(t => t.period))].sort();
  document.getElementById('periodBadges').innerHTML = ps.map(p =>
    `<span class="pbadge${activePeriods.has(p) ? '' : ' off'} tap" onclick="togglePeriod('${p}')">${p}</span>`
  ).join('');
}

function togglePeriod(p) {
  if (activePeriods.has(p)) activePeriods.delete(p); else activePeriods.add(p);
  renderAnalysis();
}

function renderAnalysis() {
  renderPeriodBadges();
  const txs = getActiveTxs();
  const total = txs.reduce((s, t) => s + t.amount, 0);
  const ct = {};
  txs.forEach(t => { ct[t.category] = (ct[t.category] || 0) + t.amount; });
  const sorted = Object.entries(ct).sort((a, b) => b[1] - a[1]);
  const cmap = Object.fromEntries(sorted.map(([c], i) => [c, COLORS[i % COLORS.length]]));
  const unc = txs.filter(t => !t.certain).length;

  document.getElementById('statsGrid').innerHTML =
    `<div class="si"><div class="sl">총 지출</div><div class="sv">${fmt(total)}</div></div>` +
    `<div class="si"><div class="sl">거래 건수</div><div class="sv">${txs.length}건</div></div>` +
    `<div class="si"><div class="sl">최다 지출</div><div class="sv" style="font-size:13px">${sorted[0]?.[0] || '-'}</div></div>` +
    `<div class="si"><div class="sl">미분류</div><div class="sv">${unc}건</div></div>`;

  document.getElementById('chartLegend').innerHTML = sorted.map(([cat, amt], i) =>
    `<span class="li"><span class="ld" style="background:${COLORS[i % COLORS.length]}"></span>${cat} ${total ? Math.round(amt / total * 100) : 0}%</span>`
  ).join('');

  if (donutChart) donutChart.destroy();
  donutChart = new Chart(document.getElementById('donut'), {
    type: 'doughnut',
    data: { labels: sorted.map(x => x[0]), datasets: [{ data: sorted.map(x => x[1]), backgroundColor: COLORS.slice(0, sorted.length), borderWidth: 2, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}` } } } }
  });

  document.getElementById('catBars').innerHTML = sorted.map(([cat, amt], i) =>
    `<div class="cbrow">
      <div class="cblbl">${cat}</div>
      <div class="cbbg"><div class="cbfill" style="width:${total ? Math.round(amt / total * 100) : 0}%;background:${COLORS[i % COLORS.length]}"></div></div>
      <div class="cbamt">${fmt(amt)}</div>
    </div>`
  ).join('');

  const btns = ['전체', ...sorted.map(x => x[0])].map(c =>
    `<button class="pill${c === statFilter ? ' active' : ''} tap" onclick="setStatFilter('${c}',this)">${c}</button>`
  );
  if (unc > 0) btns.push(`<button class="pill-uncat${statFilter === '__unc__' ? ' active' : ''} tap" onclick="setStatFilter('__unc__',this)">미분류 ${unc}건</button>`);
  document.getElementById('filterBtns').innerHTML = btns.join('');

  renderStatTable(cmap, txs);
}

function setStatFilter(cat, btn) {
  statFilter = cat;
  document.querySelectorAll('#filterBtns .pill, #filterBtns .pill-uncat').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const txs = getActiveTxs();
  const ct = {};
  txs.forEach(t => { ct[t.category] = (ct[t.category] || 0) + t.amount; });
  const sorted = Object.entries(ct).sort((a, b) => b[1] - a[1]);
  renderStatTable(Object.fromEntries(sorted.map(([c], i) => [c, COLORS[i % COLORS.length]])), txs);
}

function renderStatTable(cmap, srcTxs) {
  const txs = srcTxs || getActiveTxs();
  const filtered = statFilter === '전체' ? txs : statFilter === '__unc__' ? txs.filter(t => !t.certain) : txs.filter(t => t.category === statFilter);
  document.getElementById('txBody').innerHTML = !filtered.length
    ? '<tr><td colspan="4" class="empty">내역 없음</td></tr>'
    : filtered.map((t, idx) => {
        const color = cmap[t.category] || '#6b7280';
        const se = t.store.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const catCell = `<span class="${t.certain ? 'badge' : 'ubadge'}" style="${t.certain ? `background:${color}22;color:${color};` : ''}" onclick="openModal(${idx},'${se}')">${t.category}</span>`;
        return `<tr><td style="color:#9ca3af">${fmtDate(t.date)}</td><td>${t.store}</td><td>${catCell}</td><td class="amt-cell">${fmt(t.amount)}</td></tr>`;
      }).join('');
}

let modalIdx = null;
function openModal(idx, store) {
  modalIdx = idx;
  document.getElementById('modalStore').textContent = store;
  document.getElementById('catOpts').innerHTML = ALL_CATS.map(c => {
    const se = c.replace(/'/g, "\\'");
    const stse = store.replace(/'/g, "\\'");
    return `<button class="cat-opt tap" onclick="selectCat('${se}','${stse}')">${c}</button>`;
  }).join('');
  document.getElementById('catModal').classList.add('open');
}
function closeModal(e) { if (e.target === document.getElementById('catModal')) document.getElementById('catModal').classList.remove('open'); }
function selectCat(cat, store) {
  customCats[store] = cat;
  allStatTxs.forEach(t => { if (t.store === store) { t.category = cat; t.certain = true; } });
  document.getElementById('catModal').classList.remove('open');
  renderAnalysis();
}

// ===== 월별 통계 =====
function setStatWhoFilter(who, btn) {
  statWhoFilter = who;
  btn.closest('.wst').querySelectorAll('.who-btn').forEach(b => b.className = 'who-btn tap');
  btn.className = 'who-btn am tap';
  renderMonthly();
}

function renderMonthly() {
  const txs = statWhoFilter === 'all' ? allStatTxs : allStatTxs.filter(t => t.who === statWhoFilter);
  if (!txs.length) { document.getElementById('monthlyNoData').style.display = ''; return; }
  document.getElementById('monthlyNoData').style.display = 'none';
  const mt = {};
  txs.forEach(t => { mt[t.period] = (mt[t.period] || 0) + t.amount; });
  const months = Object.keys(mt).sort();
  if (monthlyChartInst) monthlyChartInst.destroy();
  monthlyChartInst = new Chart(document.getElementById('monthlyChart'), {
    type: 'bar',
    data: { labels: months, datasets: [{ label: '지출', data: months.map(m => mt[m]), backgroundColor: '#6366f1', borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } } }, scales: { y: { ticks: { callback: v => Math.round(v / 10000) + '만' } }, x: { ticks: { autoSkip: false } } } }
  });
  const acs = [...new Set(txs.map(t => t.category))].sort();
  if (!selCats.size) acs.slice(0, 4).forEach(c => selCats.add(c));
  document.getElementById('catFilterBtns').innerHTML = acs.map(c =>
    `<button class="pill${selCats.has(c) ? ' active' : ''} tap" onclick="toggleCat('${c}',this)">${c}</button>`
  ).join('');
  renderCatTrend(txs, months, acs);
}

function toggleCat(cat, btn) {
  selCats.has(cat) ? selCats.delete(cat) : selCats.add(cat);
  btn.classList.toggle('active');
  const txs = statWhoFilter === 'all' ? allStatTxs : allStatTxs.filter(t => t.who === statWhoFilter);
  const months = [...new Set(txs.map(t => t.period))].sort();
  const acs = [...new Set(txs.map(t => t.category))].sort();
  renderCatTrend(txs, months, acs);
}

function renderCatTrend(txs, months, acs) {
  const ds = acs.filter(c => selCats.has(c)).map(cat => {
    const ci = acs.indexOf(cat);
    return {
      label: cat,
      data: months.map(m => txs.filter(t => t.period === m && t.category === cat).reduce((s, t) => s + t.amount, 0)),
      borderColor: COLORS[ci % COLORS.length],
      backgroundColor: COLORS[ci % COLORS.length] + '33',
      tension: 0.3, fill: false, pointRadius: 4
    };
  });
  if (catTrendInst) catTrendInst.destroy();
  catTrendInst = new Chart(document.getElementById('catTrendChart'), {
    type: 'line',
    data: { labels: months, datasets: ds },
    options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}` } } }, scales: { y: { ticks: { callback: v => Math.round(v / 10000) + '만' } } } }
  });
}
