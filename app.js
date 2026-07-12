// ============================================================
// Lil CIS — منطق اصلی
// ============================================================

const STORAGE_KEY = "lilcis_battles_v1";

// ---------- ذخیره‌سازی ----------
function loadBattles() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = SEED_BATTLES.map((b, i) => finalizeBattle({ ...b, id: i + 1 }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function saveBattles(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function finalizeBattle(b) {
  b.woundRate = b.troops ? +( (b.wounded / b.troops) * 100 ).toFixed(2) : null;
  const loot = LOOT_TABLE[b.level] || null;
  b.lootDirect = loot ? loot.direct : null;
  b.lootItem = loot ? loot.item : null;
  return b;
}

function addBattle(b) {
  const list = loadBattles();
  const id = list.length ? Math.max(...list.map(x => x.id)) + 1 : 1;
  const full = finalizeBattle({ ...b, id });
  list.push(full);
  saveBattles(list);
  return full;
}

function deleteBattle(id) {
  const list = loadBattles().filter(b => b.id !== id);
  saveBattles(list);
}

// ---------- آمار پایه ----------
function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function std(arr) {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
}
function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return null;
  const mx = mean(xs), my = mean(ys);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  if (dx2 === 0 || dy2 === 0) return null;
  return num / Math.sqrt(dx2 * dy2);
}

// ---------- Viking Engine ----------
function vikingAnalysis(level) {
  const battles = loadBattles().filter(b => b.level === level && b.troopType === "Cataphract");
  if (battles.length < 2) return { battles, n: battles.length, insufficient: true };

  const troops = battles.map(b => b.troops);
  const wounded = battles.map(b => b.wounded);
  const rate = battles.map(b => b.woundRate);

  const corrTroopsWounded = pearson(troops, wounded);
  const corrTroopsRate = pearson(troops, rate);

  // سطل‌بندی نیرو
  const buckets = [
    { label: "۱۷۰۰–۲۳۰۰", min: 1700, max: 2300 },
    { label: "۳۵۰۰–۴۴۰۰", min: 3500, max: 4400 },
    { label: "۵۹۰۰–۸۲۰۰", min: 5900, max: 8200 },
  ];
  const bucketStats = buckets.map(bk => {
    const items = battles.filter(b => b.troops >= bk.min && b.troops <= bk.max);
    if (!items.length) return { ...bk, n: 0 };
    const w = items.map(b => b.wounded);
    const r = items.map(b => b.woundRate);
    return {
      ...bk, n: items.length,
      meanWounded: +mean(w).toFixed(1), stdWounded: +std(w).toFixed(1),
      meanRate: +mean(r).toFixed(2), stdRate: +std(r).toFixed(2),
      lowConfidence: items.length < 3,
    };
  });

  return {
    battles, n: battles.length, insufficient: false,
    corrTroopsWounded, corrTroopsRate,
    minWounded: Math.min(...wounded), maxWounded: Math.max(...wounded),
    meanWounded: +mean(wounded).toFixed(1),
    bucketStats,
  };
}

function recommend(level, goal) {
  const a = vikingAnalysis(level);
  if (a.insufficient) return null;
  const valid = a.bucketStats.filter(b => b.n > 0);
  if (!valid.length) return null;
  let sorted;
  if (goal === "rate") sorted = [...valid].sort((x, y) => x.meanRate - y.meanRate);
  else sorted = [...valid].sort((x, y) => x.meanWounded - y.meanWounded);
  return sorted[0];
}

// ---------- تخمین ترکیب پنهان (Bayesian ساده) ----------
function compositionEstimate(level) {
  const a = vikingAnalysis(level);
  if (a.insufficient || a.n < 3) return { confidence: "کم (داده ناکافی)", ranking: [] };

  // فرض: نرخ مجروحیت بالاتر از میانگین => احتمال بیشتر آرچر/جاینت (بد برای کاتافراکت)
  const avgRate = mean(a.battles.map(b => b.woundRate));
  const highRateBattles = a.battles.filter(b => b.woundRate > avgRate * 1.15);
  const lowRateBattles = a.battles.filter(b => b.woundRate < avgRate * 0.85);

  // امتیازدهی ساده بر اساس ماتریس کانتر Cataphract
  const cavalryCounters = TROOP_COUNTERS.Cavalry;
  const ranking = Object.entries(cavalryCounters).map(([cat, effect]) => {
    let score = 0;
    if (effect === "vulnerable") score = highRateBattles.length;
    if (effect === "hindered") score = highRateBattles.length * 0.5;
    if (effect === "dominant") score = lowRateBattles.length * -0.3;
    if (effect === "favorable") score = lowRateBattles.length * -0.15;
    return { category: cat, categoryFa: CATEGORY_FA[cat], effect, score: +score.toFixed(2) };
  }).sort((x, y) => y.score - x.score);

  const confidence = a.n >= 15 ? "متوسط" : "کم";
  return { confidence, n: a.n, ranking, highRateCount: highRateBattles.length, lowRateCount: lowRateBattles.length };
}

function probeRecommendation() {
  // رتبه‌بندی نیروها بر اساس اختلاف پروفایل کانتر با Cataphract
  const base = TROOP_COUNTERS.Cavalry;
  const scores = TROOP_TYPES.filter(t => t.name !== "Cataphract").map(t => {
    const other = TROOP_COUNTERS[t.category];
    let diff = 0, count = 0;
    for (const cat of Object.keys(base)) {
      if (other[cat] && other[cat] !== base[cat]) diff++;
      count++;
    }
    return { ...t, diffScore: diff, total: count };
  }).sort((a, b) => b.diffScore - a.diffScore);
  return scores;
}

// ---------- Economy Engine ----------
function economyAnalysis() {
  const battles = loadBattles();
  const byLevel = {};
  for (const b of battles) {
    if (!byLevel[b.level]) byLevel[b.level] = { count: 0, lootDirect: 0, lootItem: 0, unknownLoot: false };
    byLevel[b.level].count++;
    if (b.lootDirect) {
      byLevel[b.level].lootDirect += b.lootDirect;
      byLevel[b.level].lootItem += b.lootItem;
    } else {
      byLevel[b.level].unknownLoot = true;
    }
  }
  return byLevel;
}

// ---------- Growth Engine (نسخه اول، ساده) ----------
function growthSuggestion() {
  return "موتور رشد هنوز داده‌ای درباره ساختمان‌ها/تحقیقات نداره. برای فعال‌سازی این بخش، سطح ساختمان‌های اصلی و صف تحقیقات فعلی رو از تنظیمات وارد کنید.";
}

// ---------- خروجی/ورودی پشتیبان ----------
function exportJSON() {
  const data = { battles: loadBattles(), exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `lilcis-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data.battles)) {
        saveBattles(data.battles);
        alert("بازیابی موفق بود. صفحه رفرش می‌شه.");
        location.reload();
      } else {
        alert("فایل معتبر نیست.");
      }
    } catch (err) {
      alert("خطا در خواندن فایل: " + err.message);
    }
  };
  reader.readAsText(file);
}
