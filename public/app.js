// ── 数値フォーマット ──────────────────────────
function fmt(yen) {
  if (yen >= 1e8) return (yen / 1e8).toFixed(1) + '億円';
  if (yen >= 1e4) {
    const man = yen / 1e4;
    return (man >= 100 ? man.toFixed(0) : man.toFixed(1)) + '万円';
  }
  return Math.round(yen).toLocaleString() + '円';
}
function fmtAxis(yen) {
  if (yen >= 1e8) return (yen / 1e8).toFixed(1) + '億';
  return (yen / 1e4).toFixed(0) + '万';
}

// ── 計算ロジック ──────────────────────────────
function calcSnapshots(P, M, ratePercent, years) {
  const r = ratePercent / 100;
  const mr = r / 12;
  const snaps = [];
  const step = years <= 10 ? 5 : 5;

  for (let y = 0; y <= years; y++) {
    if (y !== 0 && y !== years && y % step !== 0) continue;
    const months = y * 12;
    const cf = mr === 0 ? 1 : Math.pow(1 + mr, months);
    const grownP = P * cf;
    const grownC = mr === 0 ? M * months : M * (cf - 1) / mr;
    const total = grownP + grownC;
    const invested = P + M * months;
    const interest = Math.max(0, total - invested);
    const pureContrib = M * months;
    snaps.push({ year: y, principal: P, contribution: pureContrib, interest });
  }
  return snaps;
}

// ── Chart.js 初期化 ───────────────────────────
const ctx = document.getElementById('chart').getContext('2d');
const myChart = new Chart(ctx, {
  type: 'bar',
  data: { labels: [], datasets: [
    { label: '元本',   data: [], backgroundColor: '#8e8e93', stack: 'a' },
    { label: '積立',   data: [], backgroundColor: '#34c759', stack: 'a' },
    { label: '利息',   data: [], backgroundColor: '#007aff', stack: 'a' },
  ]},
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}：${fmt(ctx.parsed.y * 1e4)}`,
          title: items => `${items[0].label}時点`,
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#8e8e93' },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          font: { size: 10 },
          color: '#8e8e93',
          callback: v => fmtAxis(v * 1e4),
        },
        grid: { color: 'rgba(128,128,128,0.15)' },
      }
    }
  }
});

// ── スライダートラック更新 ─────────────────────
function updateSliderTrack(el) {
  const min = +el.min, max = +el.max, val = +el.value;
  const pct = ((val - min) / (max - min) * 100).toFixed(1) + '%';
  el.style.setProperty('--pct', pct);
}

// ── パラメータ取得 ─────────────────────────────
function getParams() {
  const P     = Math.max(0, +document.getElementById('inp-principal').value) * 1e4;
  const M     = Math.max(0, +document.getElementById('inp-monthly').value)   * 1e4;
  const rate  = Math.max(0.1, +document.getElementById('inp-rate').value);
  const years = Math.max(1,   +document.getElementById('inp-years').value);
  return { P, M, rate, years };
}

// ── スライダー → テキスト入力に同期 ─────────────
function onSlider(field) {
  if (field === 'principal') {
    const v = +document.getElementById('sl-principal').value;
    document.getElementById('inp-principal').value = Math.round(v / 1e4);
  } else if (field === 'monthly') {
    const v = +document.getElementById('sl-monthly').value;
    document.getElementById('inp-monthly').value = Math.round(v / 1e4);
  } else if (field === 'rate') {
    document.getElementById('inp-rate').value = +document.getElementById('sl-rate').value;
  } else if (field === 'years') {
    document.getElementById('inp-years').value = +document.getElementById('sl-years').value;
  }
  updateAllTracks();
  update();
}

// ── テキスト入力 → スライダーに同期 ─────────────
function onTextInput(field) {
  if (field === 'principal') {
    const v = Math.max(0, +document.getElementById('inp-principal').value) * 1e4;
    const sl = document.getElementById('sl-principal');
    sl.value = Math.min(Math.max(v, +sl.min), +sl.max);
  } else if (field === 'monthly') {
    const v = Math.max(0, +document.getElementById('inp-monthly').value) * 1e4;
    const sl = document.getElementById('sl-monthly');
    sl.value = Math.min(Math.max(v, +sl.min), +sl.max);
  } else if (field === 'rate') {
    const v = +document.getElementById('inp-rate').value;
    const sl = document.getElementById('sl-rate');
    sl.value = Math.min(Math.max(v, +sl.min), +sl.max);
  } else if (field === 'years') {
    const v = +document.getElementById('inp-years').value;
    const sl = document.getElementById('sl-years');
    sl.value = Math.min(Math.max(v, +sl.min), +sl.max);
  }
  updateAllTracks();
  update();
}

function updateAllTracks() {
  ['sl-principal','sl-monthly','sl-rate','sl-years'].forEach(id => {
    updateSliderTrack(document.getElementById(id));
  });
}

// ── メイン計算・描画 ──────────────────────────
function update() {
  const { P, M, rate, years } = getParams();

  const snaps = calcSnapshots(P, M, rate, years);
  const last  = snaps[snaps.length - 1];
  const finalAsset    = last.principal + last.contribution + last.interest;
  const totalInvested = P + M * years * 12;
  const totalInterest = Math.max(0, finalAsset - totalInvested);

  document.getElementById('card-final').textContent    = fmt(finalAsset);
  document.getElementById('card-invest').textContent   = fmt(totalInvested);
  document.getElementById('card-interest').textContent = fmt(totalInterest);

  const dy = rate > 0 ? (72 / rate).toFixed(1) : '∞';
  document.getElementById('rule72-text').textContent =
    `年利${rate}%なら約${dy}年で2倍`;

  myChart.data.labels            = snaps.map(s => s.year + '年');
  myChart.data.datasets[0].data  = snaps.map(s => s.principal    / 1e4);
  myChart.data.datasets[1].data  = snaps.map(s => s.contribution / 1e4);
  myChart.data.datasets[2].data  = snaps.map(s => s.interest     / 1e4);
  myChart.update();
}

// ── シェア機能 ────────────────────────────────
function shareResult() {
  const { P, M, rate, years } = getParams();
  const snaps = calcSnapshots(P, M, rate, years);
  const last  = snaps[snaps.length - 1];
  const finalAsset    = last.principal + last.contribution + last.interest;
  const totalInvested = P + M * years * 12;
  const totalInterest = Math.max(0, finalAsset - totalInvested);
  const dy = rate > 0 ? (72 / rate).toFixed(1) : '∞';

  const text = `【複利シミュレーター結果】
初期元本: ${fmt(P)}
毎月積立: ${fmt(M)}
年利: ${rate}%
運用期間: ${years}年

▶ 最終資産: ${fmt(finalAsset)}
▶ 総投資額: ${fmt(totalInvested)}
▶ 利息合計: ${fmt(totalInterest)}

72の法則：年利${rate}%なら約${dy}年で2倍`;

  if (navigator.share) {
    navigator.share({ title: '複利シミュレーター', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('クリップボードにコピーしました'));
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── 初期描画 ──────────────────────────────────
updateAllTracks();
update();

// ── ライフプラン計算エンジン (PHASE_E + NISA/税金) ──────────
const VERSION = '2026-04-13';
const TAX_RATE = 0.20315;
const NISA_LIMIT = 1800;
const CURRENT_YEAR = 2026;

const DEFAULT_PARAMS = {
  startAge: 35, endAge: 80, retireAge: 60,
  salary: 800, salaryGrowthRate: 0.01, wifeIncome: 156,
  severance: 2500, pension: 266,
  sp500Rate: 0.07, schdGrowthRate: 0.05,
  initYoc: 2.89, yocGrowthRate: 0.05,
  sp500WithdrawThreshold: 0, sp500WithdrawRate: 0.04,
  cashCap: 1000,
  phase1EndAge: 40,
  p1Sp500: 120, p1Schd: 240, p1Domestic: 60,
  p2Sp500: 0, p2Schd: 180, p2Domestic: 180,
  livingCost1: 600, livingCostChangeAge: 45,
  livingCost2: 700, livingCostRetired: 600,
  initCash: 195, initSp500: 506.3, initSchd: 489.9, initDomestic: 132.0, initDiv: 9.0,
};

const LP_TUITION_DEFAULTS = [
  { label: '幼稚園(4-6歳)', ageMin: 4, ageMax: 6, cost: 30 },
  { label: '小学校(7-12歳)', ageMin: 7, ageMax: 12, cost: 35 },
  { label: '中学校(13-15歳)', ageMin: 13, ageMax: 15, cost: 50 },
  { label: '高校(16-18歳)', ageMin: 16, ageMax: 18, cost: 55 },
  { label: '大学(19-22歳)', ageMin: 19, ageMax: 22, cost: 150 },
];

function lpCalcTuitionForAge(childAge, tuitionCosts) {
  for (const t of tuitionCosts) {
    if (childAge >= t.ageMin && childAge <= t.ageMax) return t.cost;
  }
  return 0;
}

function lpGetInvestForAge(age, phases, retireAge) {
  const z = { sp500Nisa:0, sp500Tok:0, schdNisa:0, schdTok:0, domNisa:0, domTok:0 };
  if (age >= retireAge) return z;
  for (const ph of phases) {
    if (age >= ph.startAge && age < ph.endAge) return {
      sp500Nisa: ph.sp500Nisa||0, sp500Tok: ph.sp500Tok||0,
      schdNisa: ph.schdNisa||0, schdTok: ph.schdTok||0,
      domNisa: ph.domNisa||0, domTok: ph.domTok||0,
    };
  }
  return z;
}

function calcLifePlan(p) {
  const initYoc = p.initYoc != null ? p.initYoc : 0;
  const schdGrowthRate = p.schdGrowthRate != null ? p.schdGrowthRate : 0.05;
  const cashCap = p.cashCap || 0;
  const inflationRate = p.inflationRate || 0;
  const children = p.children || [];
  const tuitionCosts = p.tuitionCosts || LP_TUITION_DEFAULTS;
  const domYoc0 = p.domYoc != null ? p.domYoc : 0;
  const domYocGrowth = p.domYocGrowth != null ? p.domYocGrowth : 0;
  const phases = p.phases || null;

  let sp500N = (p.sp500NisaVal||0) + (p.sp500NisaValSp||0);
  let sp500T = (p.sp500TokVal||0) + (p.sp500TokValSp||0);
  let schdN  = (p.schdNisaVal||0) + (p.schdNisaValSp||0);
  let schdT  = (p.schdTokVal||0) + (p.schdTokValSp||0);
  let domN   = (p.domNisaVal||0) + (p.domNisaValSp||0);
  let domT   = (p.domTokVal||0) + (p.domTokValSp||0);

  let selfNisaUsed = (p.sp500NisaVal||0) + (p.schdNisaVal||0) + (p.domNisaVal||0);
  let spouseNisaUsed = (p.sp500NisaValSp||0) + (p.schdNisaValSp||0) + (p.domNisaValSp||0);
  let childNisaUsed = children.map(() => 0);
  let childNisaVal = children.map(() => 0);
  const childNisaRate = p.childNisaRate || 0.07;

  function allocInvest(inv, age) {
    const year = CURRENT_YEAR + (age - p.startAge);
    let nisaRem = Math.max(0, NISA_LIMIT - selfNisaUsed) + Math.max(0, NISA_LIMIT - spouseNisaUsed);
    for (let ci = 0; ci < children.length; ci++) {
      const c = children[ci];
      if (c.useChildNisa) {
        const ca = c.age + (age - p.startAge);
        if (ca >= 18) nisaRem += Math.max(0, NISA_LIMIT - childNisaUsed[ci]);
        else if (year >= 2027 && ca >= 0) nisaRem += (c.childNisaAnnual ?? 120);
      }
    }
    function alloc1(nisaIn, tokIn) {
      const actual = Math.min(nisaIn, nisaRem);
      const overflow = nisaIn - actual;
      nisaRem -= actual;
      return { n: actual, t: tokIn + overflow };
    }
    const sp = alloc1(inv.sp500Nisa, inv.sp500Tok);
    const sc = alloc1(inv.schdNisa, inv.schdTok);
    const dm = alloc1(inv.domNisa, inv.domTok);
    sp500N += sp.n; sp500T += sp.t;
    schdN += sc.n; schdT += sc.t;
    domN += dm.n; domT += dm.t;
    const totalNisa = sp.n + sc.n + dm.n;
    let rem = totalNisa;
    const su = Math.min(rem, Math.max(0, NISA_LIMIT - selfNisaUsed));
    selfNisaUsed += su; rem -= su;
    const spu = Math.min(rem, Math.max(0, NISA_LIMIT - spouseNisaUsed));
    spouseNisaUsed += spu; rem -= spu;
    for (let ci = 0; ci < children.length && rem > 0; ci++) {
      const c = children[ci];
      if (!c.useChildNisa) continue;
      const ca = c.age + (age - p.startAge);
      let cc = 0;
      if (ca >= 18) cc = Math.max(0, NISA_LIMIT - childNisaUsed[ci]);
      else if (year >= 2027 && ca >= 0) cc = c.childNisaAnnual ?? 120;
      const u = Math.min(rem, cc); childNisaUsed[ci] += u; rem -= u;
    }
    for (let ci = 0; ci < children.length; ci++) {
      const c = children[ci];
      if (!c.useChildNisa) continue;
      const ca = c.age + (age - p.startAge);
      if (year >= 2027 && ca >= 0 && ca < 18) {
        childNisaVal[ci] = childNisaVal[ci] * (1 + childNisaRate) + (c.childNisaAnnual ?? 120);
      } else if (ca >= 18) {
        childNisaVal[ci] = childNisaVal[ci] * (1 + childNisaRate);
      }
    }
    return { iSp: sp.n + sp.t, iSc: sc.n + sc.t, iDo: dm.n + dm.t };
  }

  function baseLivingCost(age) {
    if (age < p.livingCostChangeAge) return p.livingCost1;
    if (age < p.retireAge) return p.livingCost2;
    return p.livingCostRetired;
  }
  function tuitionForYear(myAge) {
    let t = 0;
    for (const c of children) t += lpCalcTuitionForAge(c.age + (myAge - p.startAge), tuitionCosts);
    return t;
  }
  function investForAge(age) {
    if (phases && phases.length > 0) return lpGetInvestForAge(age, phases, p.retireAge);
    return { sp500Nisa:0, sp500Tok:0, schdNisa:0, schdTok:0, domNisa:0, domTok:0 };
  }

  const rows = [];
  const initSp500 = sp500N + sp500T;
  const initSchd = schdN + schdT;
  const initDom = domN + domT;
  const initCash = p.initCash || 0;

  const lc0 = baseLivingCost(p.startAge) + tuitionForYear(p.startAge);
  const inv0 = investForAge(p.startAge);
  const prevSchdTotal0 = initSchd, prevDomTotal0 = initDom;
  const etfDivGross0 = (p.initEtfDiv > 0) ? p.initEtfDiv : (initYoc > 0 ? prevSchdTotal0 * initYoc / 100 : 0);
  const etfDivNisa0 = prevSchdTotal0 > 0 ? etfDivGross0 * (schdN / prevSchdTotal0) : 0;
  const etfDivTok0 = etfDivGross0 - etfDivNisa0;
  const divAT0 = etfDivNisa0 + etfDivTok0 * (1 - TAX_RATE);
  const domDivGross0 = (p.initDomDiv > 0) ? p.initDomDiv : (domYoc0 > 0 ? prevDomTotal0 * domYoc0 / 100 : 0);
  const domDivNisa0 = prevDomTotal0 > 0 ? domDivGross0 * (domN / prevDomTotal0) : 0;
  const domDivTok0 = domDivGross0 - domDivNisa0;
  const domDivAT0 = domDivNisa0 + domDivTok0 * (1 - TAX_RATE);

  const inv0totals = allocInvest(inv0, p.startAge);
  const totInc0 = p.salary + p.wifeIncome + divAT0 + domDivAT0;
  const totInv0 = inv0totals.iSp + inv0totals.iSc + inv0totals.iDo;
  rows.push({
    age: p.startAge, salary: p.salary, wifeIncome: p.wifeIncome,
    dividendIncome: divAT0, domDividend: domDivAT0, yoc: initYoc, domYocVal: domYoc0,
    sp500Withdraw: 0, pension: 0, severance: 0,
    totalIncome: totInc0, livingCost: lc0, tuition: tuitionForYear(p.startAge),
    investSp500: inv0totals.iSp, investSchd: inv0totals.iSc, investDomestic: inv0totals.iDo,
    totalInvest: totInv0,
    preinvestBalance: totInc0 - lc0, postinvestBalance: totInc0 - lc0 - totInv0,
    cash: initCash, sp500Val: initSp500, schdVal: initSchd, domesticVal: initDom,
    sp500Nisa: sp500N, sp500Tok: sp500T, schdNisa: schdN, schdTok: schdT,
    domNisa: domN, domTok: domT,
    severanceRemain: 0, totalAsset: initCash + initSp500 + initSchd + initDom,
    childNisaVal: [...childNisaVal], childNisaTuitionCover: 0,
    selfNisaUsed, spouseNisaUsed, childNisaUsed: [...childNisaUsed],
  });

  let prevSp500N = sp500N, prevSp500T = sp500T;
  let prevSchdN = schdN, prevSchdT = schdT;
  let prevDomN = domN, prevDomT = domT;
  let prevCash = initCash, prevSev = 0;
  let yoc = initYoc, curDomYoc = domYoc0, salary = p.salary;
  let lcInflationFactor = 1;

  for (let age = p.startAge + 1; age <= p.endAge; age++) {
    const inv = investForAge(age);

    lcInflationFactor *= (1 + inflationRate);
    const lc = baseLivingCost(age) * lcInflationFactor + tuitionForYear(age);

    const prevSp500 = prevSp500N + prevSp500T;
    const prevSchd = prevSchdN + prevSchdT;
    const prevDom = prevDomN + prevDomT;

    let sp500WithdrawGross = 0;
    const thresholdMet = (p.sp500WithdrawThreshold > 0 && prevSp500 >= p.sp500WithdrawThreshold);
    const retireMet = (age >= p.retireAge);
    if ((thresholdMet || retireMet) && p.sp500WithdrawRate != null)
      sp500WithdrawGross = prevSp500 * p.sp500WithdrawRate;
    const wdNisa = Math.min(sp500WithdrawGross, prevSp500N);
    const wdTok = sp500WithdrawGross - wdNisa;
    const sp500WithdrawAT = wdNisa + wdTok * (1 - TAX_RATE);

    const newSp500N = (prevSp500N - wdNisa) * (1 + p.sp500Rate);
    const newSp500T = (prevSp500T - wdTok) * (1 + p.sp500Rate);
    const newSchdN = prevSchdN * (1 + schdGrowthRate);
    const newSchdT = prevSchdT * (1 + schdGrowthRate);
    const newDomN = prevDomN;
    const newDomT = prevDomT;

    sp500N = newSp500N; sp500T = newSp500T;
    schdN = newSchdN; schdT = newSchdT;
    domN = newDomN; domT = newDomT;
    const invTotals = allocInvest(inv, age);
    const iSp = invTotals.iSp, iSc = invTotals.iSc, iDo = invTotals.iDo;

    const newSp500 = sp500N + sp500T;
    const newSchd = schdN + schdT;
    const newDom = domN + domT;

    yoc = yoc * (1 + p.yocGrowthRate);
    const etfDivGross = prevSchd > 0 ? prevSchd * yoc / 100 : 0;
    const etfNisaShare = prevSchd > 0 ? prevSchdN / prevSchd : 0;
    const etfDivNisa = etfDivGross * etfNisaShare;
    const etfDivTok = etfDivGross - etfDivNisa;
    const divAT = etfDivNisa + etfDivTok * (1 - TAX_RATE);

    if (domYocGrowth > 0) curDomYoc = curDomYoc * (1 + domYocGrowth);
    const domDivGross = curDomYoc > 0 && prevDom > 0 ? prevDom * curDomYoc / 100 : 0;
    const domNisaShare = prevDom > 0 ? prevDomN / prevDom : 0;
    const domDivNisa = domDivGross * domNisaShare;
    const domDivTok = domDivGross - domDivNisa;
    const domDivAT = domDivNisa + domDivTok * (1 - TAX_RATE);

    salary = salary * (1 + p.salaryGrowthRate);
    const salNow = age < p.retireAge ? salary : 0;
    const wifeNow = age < p.retireAge ? p.wifeIncome : 0;
    const pensionNow = age >= p.retireAge ? p.pension : 0;
    const sevNow = age === p.retireAge ? p.severance : 0;
    const totalIncome = salNow + wifeNow + divAT + domDivAT + sp500WithdrawAT + pensionNow + sevNow;

    const preinv = totalIncome - lc;
    const totInv = iSp + iSc + iDo;
    const postinv = preinv - totInv;

    let cashNew = prevCash + postinv;

    let childNisaTuitionCover = 0;
    for (let ci = 0; ci < children.length; ci++) {
      const ca = children[ci].age + (age - p.startAge);
      if (ca >= 19 && ca <= 22) {
        const uniCost = lpCalcTuitionForAge(ca, tuitionCosts);
        const fromNisa = Math.min(childNisaVal[ci], uniCost);
        childNisaVal[ci] -= fromNisa;
        childNisaTuitionCover += fromNisa;
      }
    }
    cashNew += childNisaTuitionCover;

    if (cashCap > 0 && cashNew > cashCap) cashNew = cashCap;
    const sevRem = age === p.retireAge ? p.severance : prevSev;
    const childNisaTotal = childNisaVal.reduce((s, v) => s + v, 0);
    const totalAsset = cashNew + newSp500 + newSchd + newDom + sevRem + childNisaTotal;

    rows.push({
      age, salary: salNow, wifeIncome: wifeNow,
      dividendIncome: divAT, domDividend: domDivAT, yoc, domYocVal: curDomYoc,
      sp500Withdraw: sp500WithdrawAT, pension: pensionNow, severance: sevNow,
      totalIncome, livingCost: lc, tuition: tuitionForYear(age),
      investSp500: iSp, investSchd: iSc, investDomestic: iDo,
      totalInvest: totInv, preinvestBalance: preinv, postinvestBalance: postinv,
      cash: cashNew, sp500Val: newSp500, schdVal: newSchd, domesticVal: newDom,
      sp500Nisa: sp500N, sp500Tok: sp500T, schdNisa: schdN, schdTok: schdT,
      domNisa: domN, domTok: domT,
      severanceRemain: sevRem, totalAsset,
      childNisaVal: [...childNisaVal], childNisaTuitionCover,
      selfNisaUsed, spouseNisaUsed, childNisaUsed: [...childNisaUsed],
    });

    prevSp500N = sp500N; prevSp500T = sp500T;
    prevSchdN = schdN; prevSchdT = schdT;
    prevDomN = domN; prevDomT = domT;
    prevCash = cashNew; prevSev = sevRem;
  }
  return rows;
}

// ===== ライフプランUI =====
function lpSwitchTab(name) {
  document.querySelectorAll('.lp-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.lp-tab').forEach(el => el.classList.remove('lp-tab-active'));
  document.getElementById('lp-content-' + name).style.display = 'block';
  document.getElementById('tab-' + name).classList.add('lp-tab-active');
  if (name === 'simple' && typeof myChart !== 'undefined' && myChart) {
    setTimeout(() => { myChart.resize(); myChart.update(); }, 50);
  }
}

let lpCashKeepManual = false;
let lpChildren = [];
let lpPhases = [
  { startAge: 18, endAge: 40, sp500Nisa: 0, sp500Tok: 0, schdNisa: 0, schdTok: 0, domNisa: 0, domTok: 0 },
  { startAge: 40, endAge: 60, sp500Nisa: 0, sp500Tok: 0, schdNisa: 0, schdTok: 0, domNisa: 0, domTok: 0 },
];
let lpTuitionCosts = LP_TUITION_DEFAULTS.map(t => ({ ...t }));

const LP_FIELDS = [
  { title: '基本設定', fields: [
    { key: 'startAge', label: '開始年齢', min: 15, max: 60, step: 1, def: 18, unit: '歳' },
    { key: 'endAge', label: 'シミュレーション終了年齢', min: 50, max: 90, step: 1, def: 80, unit: '歳' },
    { key: 'retireAge', label: '退職年齢', min: 40, max: 70, step: 1, def: 60, unit: '歳' },
  ]},
  { title: '家族設定', id: 'lp-family-section', fields: [
    { key: 'spouseAge', label: '配偶者の年齢', min: 15, max: 80, step: 1, def: 18, unit: '歳' },
  ]},
  { title: '収入設定', fields: [
    { key: 'salary', label: '給与収入（手取り）', min: 0, max: 3000, step: 10, def: 0, unit: '万円/年' },
    { key: 'salaryGrowthRate', label: '給与昇給率', min: 0, max: 5, step: 0.1, def: 0, unit: '%/年' },
    { key: 'wifeIncome', label: '配偶者入金', min: 0, max: 500, step: 10, def: 0, unit: '万円/年' },
    { key: 'severance', label: '退職金', min: 0, max: 5000, step: 100, def: 0, unit: '万円' },
    { key: 'pension', label: '年金収入', min: 0, max: 500, step: 10, def: 0, unit: '万円/年' },
  ]},
  { title: '投資設定', fields: [
    { key: 'sp500Rate', label: 'インデックスファンド 期待年利', min: 1, max: 15, step: 0.1, def: 7.0, unit: '%' },
    { key: 'schdInitialYoc', label: '米国高配当株ETF 取得時利回り', min: 0, max: 10, step: 0.01, def: 0, unit: '%' },
    { key: 'yocGrowthRate', label: '米国高配当株ETF 増配率', min: 0, max: 10, step: 0.1, def: 0, unit: '%' },
    { key: 'schdGrowthRate', label: '米国高配当株ETF 値上がり率', min: 0, max: 15, step: 0.1, def: 5.0, unit: '%' },
    { key: 'domYoc', label: '国内高配当株 取得時利回り', min: 0, max: 10, step: 0.1, def: 0, unit: '%' },
    { key: 'domYocGrowth', label: '国内高配当株 増配率', min: 0, max: 10, step: 0.1, def: 0, unit: '%' },
    { key: 'sp500WithdrawThreshold', label: 'インデックス取崩 開始評価額', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
    { key: 'sp500WithdrawRate', label: 'インデックス取崩率', min: 0, max: 10, step: 0.1, def: 4.0, unit: '%' },
    { key: 'cashKeep', label: '現金キャップ', min: 0, max: 3000, step: 100, def: 0, unit: '万円' },
    { key: 'childNisaRate', label: 'こどもNISA 期待年利', min: 0, max: 15, step: 0.1, def: 7.0, unit: '%' },
  ]},
  { title: '口座別評価額（自分）', id: 'lp-nisa-self', fields: [
    { key: 'sp500NisaVal', label: 'ｲﾝﾃﾞｯｸｽ（NISA口座）', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
    { key: 'sp500TokVal', label: 'ｲﾝﾃﾞｯｸｽ（特定口座）', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
    { key: 'schdNisaVal', label: '米国ETF（NISA口座）', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
    { key: 'schdTokVal', label: '米国ETF（特定口座）', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
    { key: 'domNisaVal', label: '国内株（NISA口座）', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
    { key: 'domTokVal', label: '国内株（特定口座）', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
  ]},
  { title: '口座別評価額（配偶者）', id: 'lp-nisa-spouse', fields: [
    { key: 'sp500NisaValSp', label: 'ｲﾝﾃﾞｯｸｽ（NISA口座）', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
    { key: 'sp500TokValSp', label: 'ｲﾝﾃﾞｯｸｽ（特定口座）', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
    { key: 'schdNisaValSp', label: '米国ETF（NISA口座）', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
    { key: 'schdTokValSp', label: '米国ETF（特定口座）', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
    { key: 'domNisaValSp', label: '国内株（NISA口座）', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
    { key: 'domTokValSp', label: '国内株（特定口座）', min: 0, max: 50000, step: 10, def: 0, unit: '万円' },
  ]},
  { title: '初期配当収入', fields: [
    { key: 'initEtfDiv', label: '米国ETF 初期配当収入(年額)', min: 0, max: 1000, step: 1, def: 0, unit: '万円/年' },
    { key: 'initDomDiv', label: '国内株 初期配当収入(年額)', min: 0, max: 1000, step: 1, def: 0, unit: '万円/年' },
    { key: 'initCash', label: '現金 初期値', min: 0, max: 10000, step: 10, def: 0, unit: '万円' },
  ]},
  { title: '生活費設定', fields: [
    { key: 'livingCost1', label: '生活費(変化年齢前)', min: 0, max: 2000, step: 50, def: 0, unit: '万円/年' },
    { key: 'livingCostChangeAge', label: '生活費 変化年齢', min: 15, max: 70, step: 1, def: 45, unit: '歳' },
    { key: 'livingCost2', label: '生活費(変化年齢〜退職)', min: 0, max: 2000, step: 50, def: 0, unit: '万円/年' },
    { key: 'livingCostRetired', label: '退職後 生活費', min: 0, max: 2000, step: 50, def: 0, unit: '万円/年' },
    { key: 'inflationRate', label: '生活費インフレ率', min: 0, max: 5, step: 0.1, def: 0, unit: '%/年' },
  ]},
];

function lpFieldHtml(f) {
  return `<div class="lp-field">
    <div class="lp-field-header"><label class="lp-label">${f.label}</label><span class="lp-unit">${f.unit}</span></div>
    <div class="lp-input-row">
      <input type="range" id="r_${f.key}" min="${f.min}" max="${f.max}" step="${f.step}" value="${f.def}">
      <input type="number" id="n_${f.key}" min="${f.min}" step="${f.step}" value="${f.def}" class="lp-num">
    </div>
  </div>`;
}

function lpBuildPanel() {
  let html = '';
  for (const g of LP_FIELDS) {
    html += `<div class="lp-group"><div class="lp-group-title">${g.title}</div>`;
    html += g.fields.map(lpFieldHtml).join('');
    if (g.id === 'lp-family-section') {
      html += `<div id="lp-children-list"></div>
        <button onclick="lpAddChild()" style="font-size:12px;padding:6px 12px;cursor:pointer;border-radius:4px;border:1px solid #ccc;background:#fff;margin-top:4px;">+ 子どもを追加</button>`;
    }
    if (g.id === 'lp-nisa-self') {
      html += `<div id="lp-nisa-self-warn" style="font-size:11px;color:#E24B4A;display:none;margin-top:4px;"></div>`;
    }
    if (g.id === 'lp-nisa-spouse') {
      html += `<div id="lp-nisa-spouse-warn" style="font-size:11px;color:#E24B4A;display:none;margin-top:4px;"></div>`;
    }
    html += '</div>';
  }
  html += `<div class="lp-group"><div class="lp-group-title">学費設定</div><div id="lp-tuition-fields">`;
  for (let i = 0; i < lpTuitionCosts.length; i++) {
    const t = lpTuitionCosts[i];
    html += `<div class="lp-field"><div class="lp-field-header"><label class="lp-label">${t.label}</label><span class="lp-unit">万円/年</span></div>
      <div class="lp-input-row">
        <input type="range" id="r_tuition${i}" min="0" max="300" step="5" value="${t.cost}">
        <input type="number" id="n_tuition${i}" min="0" step="5" value="${t.cost}" class="lp-num">
      </div></div>`;
  }
  html += '</div></div>';
  html += `<div class="lp-group"><div class="lp-group-title">投資フェーズ</div><div id="lp-phases-list"></div>
    <button onclick="lpAddPhase()" style="font-size:12px;padding:6px 12px;cursor:pointer;border-radius:4px;border:1px solid #ccc;background:#fff;margin-top:4px;">+ フェーズを追加</button></div>`;

  document.getElementById('lp-panel').innerHTML = html;
  LP_FIELDS.forEach(g => g.fields.forEach(f => lpLink(f.key)));
  for (let i = 0; i < lpTuitionCosts.length; i++) lpLinkTuition(i);
  lpRenderChildren();
  lpRenderPhases();
}

function lpLink(key) {
  const r = document.getElementById('r_' + key);
  const n = document.getElementById('n_' + key);
  if (!r || !n) return;
  r.addEventListener('input', () => {
    n.value = r.value;
    if (key === 'cashKeep') lpCashKeepManual = true;
    lpRecalc();
  });
  n.addEventListener('input', () => {
    const v = parseFloat(n.value);
    if (!isNaN(v)) r.value = Math.min(Math.max(v, +r.min), +r.max);
    if (key === 'cashKeep') lpCashKeepManual = true;
    lpRecalc();
  });
}

function lpLinkTuition(i) {
  const r = document.getElementById('r_tuition' + i);
  const n = document.getElementById('n_tuition' + i);
  if (!r || !n) return;
  r.addEventListener('input', () => { n.value = r.value; lpTuitionCosts[i].cost = +r.value; lpRecalc(); });
  n.addEventListener('input', () => { r.value = Math.min(Math.max(+n.value, 0), 300); lpTuitionCosts[i].cost = +n.value; lpRecalc(); });
}

function lpAddChild() {
  lpChildren.push({ age: 0, useChildNisa: false, childNisaAnnual: 120 });
  lpRenderChildren();
  lpRecalc();
}
function lpRemoveChild(i) {
  lpChildren.splice(i, 1);
  lpRenderChildren();
  lpRecalc();
}
function lpRenderChildren() {
  const el = document.getElementById('lp-children-list');
  if (!el) return;
  el.innerHTML = lpChildren.map((c, i) => `
    <div style="border:1px solid #ddd;border-radius:6px;padding:8px;margin-bottom:6px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <label class="lp-label" style="flex-shrink:0;">子ども${i + 1}</label>
        <input type="number" value="${c.age}" min="-5" max="30" step="1" class="lp-num" style="width:56px;"
          onchange="lpChildren[${i}].age=+this.value;lpRecalc();">
        <span class="lp-unit">歳</span>
        <button onclick="lpRemoveChild(${i})" style="font-size:11px;padding:2px 8px;cursor:pointer;border:1px solid #ccc;border-radius:3px;background:#fff;color:#E24B4A;">削除</button>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;">
        <label><input type="checkbox" ${c.useChildNisa ? 'checked' : ''}
          onchange="lpChildren[${i}].useChildNisa=this.checked;lpRecalc();"> こどもNISA</label>
        ${c.useChildNisa ? `<label>年間<input type="number" value="${c.childNisaAnnual}" min="0" max="120" step="10" class="lp-num" style="width:56px;"
          onchange="lpChildren[${i}].childNisaAnnual=+this.value;lpRecalc();">万円</label>` : ''}
      </div>
    </div>
  `).join('');
}

function lpAddPhase() {
  const last = lpPhases.length > 0 ? lpPhases[lpPhases.length - 1] : null;
  lpPhases.push({ startAge: last ? last.endAge : 35, endAge: last ? last.endAge + 10 : 45, sp500Nisa:0, sp500Tok:0, schdNisa:0, schdTok:0, domNisa:0, domTok:0 });
  lpRenderPhases();
  lpRecalc();
}
function lpRemovePhase(i) {
  lpPhases.splice(i, 1);
  lpRenderPhases();
  lpRecalc();
}
function lpRenderPhases() {
  const el = document.getElementById('lp-phases-list');
  if (!el) return;
  el.innerHTML = lpPhases.map((ph, i) => `
    <div style="border:1px solid #ddd;border-radius:6px;padding:8px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:12px;font-weight:600;color:#555;">フェーズ${i + 1}</span>
        <button onclick="lpRemovePhase(${i})" style="font-size:11px;padding:2px 8px;cursor:pointer;border:1px solid #ccc;border-radius:3px;background:#fff;color:#E24B4A;">削除</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px;margin-bottom:6px;">
        <label>開始 <input type="number" value="${ph.startAge}" min="15" max="80" class="lp-num" style="width:56px;" onchange="lpPhases[${i}].startAge=+this.value;lpRecalc();"></label>
        <label>終了 <input type="number" value="${ph.endAge}" min="15" max="80" class="lp-num" style="width:56px;" onchange="lpPhases[${i}].endAge=+this.value;lpRecalc();"></label>
      </div>
      <div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:2px 4px;font-size:11px;align-items:center;">
        <span></span><span style="text-align:center;font-weight:600;color:#888;">NISA</span><span style="text-align:center;font-weight:600;color:#888;">特定</span>
        <span>ｲﾝﾃﾞｯｸｽ</span>
        <input type="number" value="${ph.sp500Nisa||0}" min="0" step="10" class="lp-num" style="width:100%;" onchange="lpPhases[${i}].sp500Nisa=+this.value;lpRecalc();">
        <input type="number" value="${ph.sp500Tok||0}" min="0" step="10" class="lp-num" style="width:100%;" onchange="lpPhases[${i}].sp500Tok=+this.value;lpRecalc();">
        <span>米国ETF</span>
        <input type="number" value="${ph.schdNisa||0}" min="0" step="10" class="lp-num" style="width:100%;" onchange="lpPhases[${i}].schdNisa=+this.value;lpRecalc();">
        <input type="number" value="${ph.schdTok||0}" min="0" step="10" class="lp-num" style="width:100%;" onchange="lpPhases[${i}].schdTok=+this.value;lpRecalc();">
        <span>国内株</span>
        <input type="number" value="${ph.domNisa||0}" min="0" step="10" class="lp-num" style="width:100%;" onchange="lpPhases[${i}].domNisa=+this.value;lpRecalc();">
        <input type="number" value="${ph.domTok||0}" min="0" step="10" class="lp-num" style="width:100%;" onchange="lpPhases[${i}].domTok=+this.value;lpRecalc();">
      </div>
    </div>
  `).join('');
}

function lpGetParams() {
  const v = key => { const el = document.getElementById('n_' + key); return el ? parseFloat(el.value) : 0; };
  const params = {
    startAge: v('startAge'), endAge: v('endAge'), retireAge: v('retireAge'),
    salary: v('salary'), salaryGrowthRate: v('salaryGrowthRate') / 100,
    wifeIncome: v('wifeIncome'), severance: v('severance'), pension: v('pension'),
    sp500Rate: v('sp500Rate') / 100,
    initYoc: v('schdInitialYoc'),
    yocGrowthRate: v('yocGrowthRate') / 100,
    schdGrowthRate: v('schdGrowthRate') / 100,
    domYoc: v('domYoc'), domYocGrowth: v('domYocGrowth') / 100,
    sp500WithdrawThreshold: v('sp500WithdrawThreshold'),
    sp500WithdrawRate: v('sp500WithdrawRate') / 100,
    cashCap: v('cashKeep'),
    sp500NisaVal: v('sp500NisaVal'), sp500TokVal: v('sp500TokVal'),
    schdNisaVal: v('schdNisaVal'), schdTokVal: v('schdTokVal'),
    domNisaVal: v('domNisaVal'), domTokVal: v('domTokVal'),
    sp500NisaValSp: v('sp500NisaValSp'), sp500TokValSp: v('sp500TokValSp'),
    schdNisaValSp: v('schdNisaValSp'), schdTokValSp: v('schdTokValSp'),
    domNisaValSp: v('domNisaValSp'), domTokValSp: v('domTokValSp'),
    livingCost1: v('livingCost1'), livingCostChangeAge: v('livingCostChangeAge'),
    livingCost2: v('livingCost2'), livingCostRetired: v('livingCostRetired'),
    inflationRate: v('inflationRate') / 100,
    childNisaRate: v('childNisaRate') / 100,
    children: lpChildren, tuitionCosts: lpTuitionCosts, phases: lpPhases,
    initCash: v('initCash'),
    initEtfDiv: v('initEtfDiv'), initDomDiv: v('initDomDiv'),
  };
  lpUpdateNisaWarnings(params);
  return params;
}

function lpUpdateNisaWarnings(p) {
  const selfTotal = (p.sp500NisaVal||0) + (p.schdNisaVal||0) + (p.domNisaVal||0);
  const spouseTotal = (p.sp500NisaValSp||0) + (p.schdNisaValSp||0) + (p.domNisaValSp||0);
  const wSelf = document.getElementById('lp-nisa-self-warn');
  const wSpouse = document.getElementById('lp-nisa-spouse-warn');
  if (wSelf) {
    if (selfTotal > NISA_LIMIT) { wSelf.style.display = 'block'; wSelf.textContent = `NISA合計${selfTotal}万円 (上限${NISA_LIMIT}万円超過!)`; }
    else { wSelf.style.display = 'none'; }
  }
  if (wSpouse) {
    if (spouseTotal > NISA_LIMIT) { wSpouse.style.display = 'block'; wSpouse.textContent = `NISA合計${spouseTotal}万円 (上限${NISA_LIMIT}万円超過!)`; }
    else { wSpouse.style.display = 'none'; }
  }
}

function lpBuildOutput() {
  document.getElementById('lp-output').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span id="lp-save-status" style="font-size:11px;color:#888;"></span>
        <button onclick="lpResetSettings()" style="font-size:11px;padding:4px 10px;cursor:pointer;border-radius:4px;border:1px solid #ccc;background:#fff;color:#888;">設定リセット</button>
        <span style="font-size:10px;color:#aaa;align-self:center;">v2026-04-13</span>
      </div>
      <div style="display:flex; gap:8px;">
        <button onclick="lpCopyUrl()" style="font-size:13px;padding:8px 16px;cursor:pointer;border-radius:6px;border:1px solid #ccc;background:#fff;">URLをコピー</button>
        <button id="lp-share-btn" onclick="lpShare()" style="font-size:13px;padding:8px 16px;cursor:pointer;border-radius:6px;border:1px solid #ccc;background:#fff;">結果をシェア</button>
      </div>
    </div>
    <div id="lp-summary" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px;">
      <div class="lp-card"><div class="lp-card-label">最終総資産</div><div class="lp-card-value" id="lp-s-asset">—</div></div>
      <div class="lp-card"><div class="lp-card-label">FI達成年齢</div><div class="lp-card-value" id="lp-s-fi">—</div></div>
      <div class="lp-card"><div class="lp-card-label">退職時 配当(税引後)</div><div class="lp-card-value" id="lp-s-div">—</div></div>
    </div>
    <div id="lp-nisa-summary" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
      <div class="lp-card"><div class="lp-card-label">自分 NISA残枠</div><div class="lp-card-value" id="lp-s-nisa-self" style="font-size:16px;">—</div></div>
      <div class="lp-card"><div class="lp-card-label">配偶者 NISA残枠</div><div class="lp-card-value" id="lp-s-nisa-spouse" style="font-size:16px;">—</div></div>
      <div class="lp-card"><div class="lp-card-label">夫婦合計残枠</div><div class="lp-card-value" id="lp-s-nisa-couple" style="font-size:16px;">—</div></div>
    </div>
    <div id="lp-nisa-children-summary" style="margin-bottom:24px;"></div>
    <div style="margin-bottom:32px;"><h3 style="font-size:14px;margin-bottom:8px;color:#555;">総資産推移</h3><canvas id="lp-chart-asset" style="max-height:300px;"></canvas></div>
    <div style="margin-bottom:32px;"><h3 style="font-size:14px;margin-bottom:8px;color:#555;">収入内訳推移</h3><canvas id="lp-chart-income" style="max-height:280px;"></canvas></div>
    <div style="margin-bottom:32px;"><h3 style="font-size:14px;margin-bottom:8px;color:#555;">年間収支</h3><canvas id="lp-chart-balance" style="max-height:240px;"></canvas></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <h3 style="font-size:14px;color:#555;margin:0;">年次データ</h3>
      <button id="lp-csv-btn" onclick="lpDownloadCsv()" style="font-size:12px;padding:6px 12px;cursor:pointer;border-radius:6px;border:1px solid #ccc;background:#fff;">CSVダウンロード</button>
    </div>
    <div style="overflow-x:auto;">
      <table id="lp-table" style="border-collapse:collapse;font-size:12px;min-width:1100px;width:100%;">
        <thead id="lp-thead"></thead><tbody id="lp-tbody"></tbody>
      </table>
    </div>
  `;
}

function lpFmt(man) {
  if (man >= 10000) return (man / 10000).toFixed(1) + '億円';
  if (man >= 1) return Math.round(man) + '万円';
  return Math.round(man * 10000) + '円';
}

let lpChartAsset = null, lpChartIncome = null, lpChartBalance = null;
let lpLastRows = null;

function lpUpdateSummary(rows, params) {
  const last = rows[rows.length - 1];
  document.getElementById('lp-s-asset').textContent = lpFmt(last.totalAsset);
  const fiRow = rows.find(r => (r.dividendIncome + (r.domDividend || 0)) >= r.livingCost);
  document.getElementById('lp-s-fi').textContent = fiRow ? fiRow.age + '歳' : '未達';
  const retireRow = rows.find(r => r.age === params.retireAge);
  document.getElementById('lp-s-div').textContent =
    retireRow ? lpFmt(retireRow.dividendIncome + (retireRow.domDividend || 0)) + '/年' : '—';

  const selfUsed = (params.sp500NisaVal||0) + (params.schdNisaVal||0) + (params.domNisaVal||0);
  const spouseUsed = (params.sp500NisaValSp||0) + (params.schdNisaValSp||0) + (params.domNisaValSp||0);
  const selfRem = Math.max(0, NISA_LIMIT - selfUsed);
  const spouseRem = Math.max(0, NISA_LIMIT - spouseUsed);
  document.getElementById('lp-s-nisa-self').textContent = selfRem + '万円';
  document.getElementById('lp-s-nisa-self').style.color = selfUsed > NISA_LIMIT ? '#E24B4A' : '';
  document.getElementById('lp-s-nisa-spouse').textContent = spouseRem + '万円';
  document.getElementById('lp-s-nisa-spouse').style.color = spouseUsed > NISA_LIMIT ? '#E24B4A' : '';
  document.getElementById('lp-s-nisa-couple').textContent = (selfRem + spouseRem) + '万円';

  const childSumEl = document.getElementById('lp-nisa-children-summary');
  if (childSumEl && last.childNisaUsed) {
    const children = params.children || [];
    let html = '';
    children.forEach((c, i) => {
      if (!c.useChildNisa) return;
      const used = last.childNisaUsed[i] || 0;
      const val = last.childNisaVal ? (last.childNisaVal[i] || 0) : 0;
      html += `<div class="lp-card" style="margin-bottom:8px;padding:8px 12px;">
        <div class="lp-card-label">子ども${i+1} こどもNISA</div>
        <div style="font-size:14px;font-weight:500;">評価額: ${Math.round(val)}万円 / 累積投資: ${Math.round(used)}万円</div>
      </div>`;
    });
    childSumEl.innerHTML = html;
  }
}

function lpUpdateCharts(rows) {
  const labels = rows.map(r => r.age + '歳');
  if (lpChartAsset) lpChartAsset.destroy();
  lpChartAsset = new Chart(document.getElementById('lp-chart-asset'), {
    type: 'bar',
    data: { labels, datasets: [
      { label: 'ｲﾝﾃﾞｯｸｽ', data: rows.map(r => Math.round(r.sp500Val)), backgroundColor: '#378ADD', stack: 'a' },
      { label: '米国ETF', data: rows.map(r => Math.round(r.schdVal)), backgroundColor: '#639922', stack: 'a' },
      { label: '国内', data: rows.map(r => Math.round(r.domesticVal)), backgroundColor: '#97C459', stack: 'a' },
      { label: '現金', data: rows.map(r => Math.round(r.cash)), backgroundColor: '#888780', stack: 'a' },
      { label: '退職金', data: rows.map(r => Math.round(r.severanceRemain)), backgroundColor: '#EF9F27', stack: 'a' },
    ]},
    options: { responsive: true,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } }, tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + lpFmt(ctx.raw) } } },
      scales: { x: { stacked: true, ticks: { font: { size: 10 } } }, y: { stacked: true, ticks: { callback: v => lpFmt(v), font: { size: 10 } } } }
    }
  });
  if (lpChartIncome) lpChartIncome.destroy();
  lpChartIncome = new Chart(document.getElementById('lp-chart-income'), {
    type: 'bar',
    data: { labels, datasets: [
      { label: '給与', data: rows.map(r => Math.round(r.salary)), backgroundColor: '#378ADD', stack: 'b' },
      { label: 'ETF配当', data: rows.map(r => Math.round(r.dividendIncome)), backgroundColor: '#639922', stack: 'b' },
      { label: '国内配当', data: rows.map(r => Math.round(r.domDividend || 0)), backgroundColor: '#97C459', stack: 'b' },
      { label: '年金', data: rows.map(r => Math.round(r.pension)), backgroundColor: '#EF9F27', stack: 'b' },
      { label: 'ｲﾝﾃﾞｯｸｽ取崩', data: rows.map(r => Math.round(r.sp500Withdraw)), backgroundColor: '#888780', stack: 'b' },
    ]},
    options: { responsive: true,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
      scales: { x: { stacked: true, ticks: { font: { size: 10 } } }, y: { stacked: true, ticks: { callback: v => lpFmt(v), font: { size: 10 } } } }
    }
  });
  if (lpChartBalance) lpChartBalance.destroy();
  lpChartBalance = new Chart(document.getElementById('lp-chart-balance'), {
    type: 'bar',
    data: { labels, datasets: [{ label: '投資後収支', data: rows.map(r => Math.round(r.postinvestBalance)),
      backgroundColor: rows.map(r => r.postinvestBalance >= 0 ? '#1D9E75' : '#E24B4A') }] },
    options: { responsive: true, plugins: { legend: { display: false } },
      scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { callback: v => lpFmt(v), font: { size: 10 } } } }
    }
  });
}

const LP_TABLE_COLS = [
  { key: 'age', label: '年齢' },
  { key: 'salary', label: '給与(税引後)' },
  { key: 'wifeIncome', label: '配偶者収入' },
  { key: 'dividendIncome', label: '（内）ETF配当' },
  { key: 'domDividend', label: '（内）国内配当' },
  { key: '_divTotal', label: '配当合計', fn: r => (r.dividendIncome || 0) + (r.domDividend || 0) },
  { key: 'sp500Withdraw', label: '取崩収入' },
  { key: 'pension', label: '年金' },
  { key: 'totalIncome', label: '収入合計' },
  { key: 'livingCost', label: '生活費合計' },
  { key: 'tuition', label: '（内）学費' },
  { key: 'preinvestBalance', label: '収支（投資前）' },
  { key: 'totalInvest', label: '投資合計' },
  { key: 'postinvestBalance', label: '収支（投資後）' },
  { key: 'investSp500', label: 'ｲﾝﾃﾞｯｸｽ投資' },
  { key: 'investSchd', label: 'ETF投資' },
  { key: 'investDomestic', label: '国内投資' },
  { key: 'cash', label: '現金' },
  { key: 'sp500Nisa', label: 'ｲﾝﾃﾞｯｸｽ(NISA)' },
  { key: 'sp500Tok', label: 'ｲﾝﾃﾞｯｸｽ(特定)' },
  { key: 'sp500Val', label: 'ｲﾝﾃﾞｯｸｽ(計)' },
  { key: 'schdNisa', label: 'ETF(NISA)' },
  { key: 'schdTok', label: 'ETF(特定)' },
  { key: 'schdVal', label: 'ETF(計)' },
  { key: 'domNisa', label: '国内(NISA)' },
  { key: 'domTok', label: '国内(特定)' },
  { key: 'domesticVal', label: '国内(計)' },
  { key: 'severanceRemain', label: '退職金残' },
  { key: 'totalAsset', label: '総資産' },
  { key: 'yoc', label: 'ETF YOC(%)' },
];

function lpUpdateTable(rows, params, fiAge) {
  const thead = document.getElementById('lp-thead');
  thead.innerHTML = '<tr>' + LP_TABLE_COLS.map(c => `<th>${c.label}</th>`).join('') + '</tr>';
  const tbody = document.getElementById('lp-tbody');
  tbody.innerHTML = rows.map(r => {
    const isFi = fiAge && r.age === fiAge;
    const isRetire = r.age === params.retireAge;
    const isWithdraw = r.sp500Withdraw > 0 && (r.age === rows[0].age || rows.find(x => x.age === r.age - 1)?.sp500Withdraw === 0);
    const bg = isFi ? '#E1F5EE' : '';
    const cells = LP_TABLE_COLS.map(c => {
      const val = c.fn ? c.fn(r) : (r[c.key] || 0);
      let text = (c.key === 'yoc') ? val.toFixed(2) : (c.key === 'age') ? val : val.toFixed(1);
      let badge = '';
      if (c.key === 'age') {
        if (isRetire) badge += ' <span style="font-size:10px;background:#FAEEDA;color:#854F0B;padding:1px 4px;border-radius:3px;">退職</span>';
        if (isWithdraw) badge += ' <span style="font-size:10px;background:#E6F1FB;color:#185FA5;padding:1px 4px;border-radius:3px;">取崩開始</span>';
        if (isFi) badge += ' <span style="font-size:10px;background:#E1F5EE;color:#0F6E56;padding:1px 4px;border-radius:3px;">FI</span>';
      }
      const color = (c.key === 'preinvestBalance' || c.key === 'postinvestBalance') && val < 0 ? 'color:#E24B4A;' : '';
      return `<td style="${color}">${text}${badge}</td>`;
    }).join('');
    return `<tr style="background:${bg};">${cells}</tr>`;
  }).join('');
}

function lpDownloadCsv() {
  if (!lpLastRows) return;
  const header = LP_TABLE_COLS.map(c => c.label).join(',');
  const body = lpLastRows.map(r => LP_TABLE_COLS.map(c => {
    const v = c.fn ? c.fn(r) : (r[c.key] || 0);
    return (c.key === 'yoc') ? v.toFixed(2) : (c.key === 'age') ? v : v.toFixed(1);
  }).join(',')).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'lifeplan_simulation.csv'; a.click();
}

function lpShare() {
  const last = lpLastRows ? lpLastRows[lpLastRows.length - 1] : null;
  const fi = lpLastRows ? lpLastRows.find(r => (r.dividendIncome + (r.domDividend || 0)) >= r.livingCost) : null;
  const text = last
    ? `【ライフプランシミュレーション】\n最終総資産: ${lpFmt(last.totalAsset)}\nFI達成年齢: ${fi ? fi.age + '歳' : '未達'}\n${location.href}`
    : location.href;
  if (navigator.share) { navigator.share({ text }).catch(() => {}); }
  else { navigator.clipboard.writeText(text).then(() => { if (typeof showToast === 'function') showToast('クリップボードにコピーしました'); else alert('クリップボードにコピーしました'); }); }
}

function lpUpdateOutput(rows) {
  lpLastRows = rows;
  const params = lpGetParams();
  const fiRow = rows.find(r => (r.dividendIncome + (r.domDividend || 0)) >= r.livingCost);
  const fiAge = fiRow ? fiRow.age : null;
  lpUpdateSummary(rows, params);
  lpUpdateCharts(rows);
  lpUpdateTable(rows, params, fiAge);
}

function lpUpdateCashKeepAuto() {
  if (lpCashKeepManual) return;
  const lc1 = parseFloat(document.getElementById('n_livingCost1')?.value) || 0;
  const auto = 1000 + lc1 * 0.5;
  const r = document.getElementById('r_cashKeep');
  const n = document.getElementById('n_cashKeep');
  if (n) n.value = auto;
  if (r) r.value = Math.min(Math.max(auto, +r.min), +r.max);
}

function lpRecalc() {
  lpUpdateCashKeepAuto();
  const params = lpGetParams();
  const rows = calcLifePlan(params);
  lpUpdateOutput(rows);
  lpAutoUpdateUrl();
}

// ===== URL パラメータ保存・復元 =====
const LP_URL_KEYS = LP_FIELDS.flatMap(g => g.fields.map(f => f.key));

function lpCopyUrl() {
  const url = lpBuildUrlString();
  navigator.clipboard.writeText(url).then(() => {
    if (typeof showToast === 'function') showToast('URLをコピーしました');
    else alert('URLをコピーしました');
  });
}

function lpLoadFromUrl() {
  const params = new URLSearchParams(location.search);
  if (params.size === 0) return false;
  if (params.has('cashKeep')) lpCashKeepManual = true;
  let loaded = false;
  for (const key of LP_URL_KEYS) {
    if (params.has(key)) {
      const r = document.getElementById('r_' + key);
      const n = document.getElementById('n_' + key);
      if (n) { n.value = params.get(key); loaded = true; }
      if (r) r.value = Math.min(Math.max(parseFloat(params.get(key)), +r.min), +r.max);
    }
  }
  for (let i = 0; i < lpTuitionCosts.length; i++) {
    if (params.has('tc' + i)) {
      lpTuitionCosts[i].cost = +params.get('tc' + i);
      const r = document.getElementById('r_tuition' + i);
      const n = document.getElementById('n_tuition' + i);
      if (n) n.value = lpTuitionCosts[i].cost;
      if (r) r.value = lpTuitionCosts[i].cost;
    }
  }
  if (params.has('phases')) {
    try { lpPhases = JSON.parse(params.get('phases')); } catch(e) {}
    lpRenderPhases();
  }
  if (params.has('children')) {
    try {
      lpChildren = JSON.parse(params.get('children')).map(c => ({
        age: c.age || 0,
        useChildNisa: !!c.useChildNisa,
        childNisaAnnual: c.childNisaAnnual ?? 120,
      }));
    } catch(e) {}
    lpRenderChildren();
  }
  return loaded;
}

function lpBuildUrlString() {
  const params = new URLSearchParams();
  for (const key of LP_URL_KEYS) {
    const el = document.getElementById('n_' + key);
    if (el) params.set(key, el.value);
  }
  for (let i = 0; i < lpTuitionCosts.length; i++) params.set('tc' + i, lpTuitionCosts[i].cost);
  params.set('phases', JSON.stringify(lpPhases));
  if (lpChildren.length > 0) {
    const cleanChildren = lpChildren.map(c => ({
      age: c.age || 0,
      useChildNisa: !!c.useChildNisa,
      childNisaAnnual: c.childNisaAnnual ?? 120,
    }));
    params.set('children', JSON.stringify(cleanChildren));
  }
  return location.origin + location.pathname + '?' + params.toString();
}

function lpAutoUpdateUrl() {
  try {
    const url = lpBuildUrlString();
    history.replaceState(null, '', url);
    const el = document.getElementById('lp-save-status');
    if (el) el.textContent = '設定は自動でURLに保存されます';
  } catch(e) { console.warn('URL更新失敗:', e); }
}

function lpResetSettings() {
  location.href = location.origin + location.pathname;
}

(function lpInit() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && typeof Chart !== 'undefined') {
    Chart.defaults.color = '#aaa'; Chart.defaults.borderColor = '#444';
  }
  lpBuildPanel();
  lpBuildOutput();
  lpLoadFromUrl();
  lpRecalc();
})();
