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

function findDuplicate(b, excludeId = null) {
  const list = loadBattles();
  return list.find(x =>
    x.id !== excludeId &&
    x.level === b.level &&
    x.troops === b.troops &&
    x.targetPower === b.targetPower &&
    x.wounded === b.wounded
  ) || null;
}

function updateBattle(id, updates) {
  const list = loadBattles();
  const idx = list.findIndex(b => b.id === id);
  if (idx === -1) return null;
  const merged = finalizeBattle({ ...list[idx], ...updates, id });
  list[idx] = merged;
  saveBattles(list);
  return merged;
}

function getBattle(id) {
  return loadBattles().find(b => b.id === id) || null;
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

// ---------- مدل پیش‌بینی نسبت قدرت/نیرو (تعمیم بین سطوح مختلف) ----------
// فرضیه: نرخ مجروحیت با نسبت (قدرت هدف / نیروی اعزامی) رابطه خطی داره،
// و چون این نسبت خودش قدرت رو نرمالایز می‌کنه، بین سطوح مختلف هم قابل تعمیمه
// (نه فقط برای یه سطح خاص مثل بازه‌های ثابت قدیمی).
function linreg(xs, ys) {
  const n = xs.length;
  const mx = mean(xs), my = mean(ys);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const b = den ? num / den : 0;
  const a = my - b * mx;
  const predicted = xs.map(x => a + b * x);
  const ssRes = ys.reduce((s, y, i) => s + (y - predicted[i]) ** 2, 0);
  const ssTot = ys.reduce((s, y) => s + (y - my) ** 2, 0);
  const r2 = ssTot ? 1 - ssRes / ssTot : 0;
  return { a, b, r2, n };
}

function fitWoundRateModel() {
  const battles = loadBattles().filter(b => b.troopType === "Cataphract" && b.targetPower && b.troops);
  if (battles.length < 5) return null;
  const ratio = battles.map(b => b.targetPower / b.troops);
  const rate = battles.map(b => b.woundRate);
  return linreg(ratio, rate);
}

// پیش‌بینی نرخ مجروحیت برای یک ترکیب قدرت هدف/نیرو دلخواه
function predictWoundRate(targetPower, troops) {
  const model = fitWoundRateModel();
  if (!model) return null;
  const ratio = targetPower / troops;
  return Math.max(0, model.a + model.b * ratio);
}

// معکوس مدل: برای یک هدف با قدرت مشخص، چند نیرو لازمه تا نرخ مجروحیت زیر مقدار دلخواه بمونه؟
function requiredTroopsForRate(targetPower, desiredRate) {
  const model = fitWoundRateModel();
  if (!model) return null;
  if (desiredRate <= model.a) return null; // این نرخ با این مدل خطی قابل دستیابی نیست
  return Math.round((model.b * targetPower) / (desiredRate - model.a));
}


// خوشه‌بندی پویا: به‌جای بازه‌های ثابت (که فقط برای یه سطح خاص جواب می‌داد)،
// نبردها رو بر اساس نزدیکی نیروی اعزامی خودشون به‌صورت خودکار گروه‌بندی می‌کنیم.
// هر نبرد جدید در سطحی که تا حالا نبوده، خودش یه خوشه جدید می‌سازه.
function dynamicBuckets(battles, tolerance = 0.15) {
  const sorted = [...battles].sort((a, b) => a.troops - b.troops);
  const clusters = [];
  for (const b of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && b.troops <= last.max * (1 + tolerance)) {
      last.items.push(b);
      last.max = Math.max(last.max, b.troops);
      last.min = Math.min(last.min, b.troops);
    } else {
      clusters.push({ min: b.troops, max: b.troops, items: [b] });
    }
  }
  return clusters.map(c => {
    const w = c.items.map(b => b.wounded);
    const r = c.items.map(b => b.woundRate);
    const label = c.min === c.max ? `${c.min.toLocaleString('en-US')}` : `${c.min.toLocaleString('en-US')}–${c.max.toLocaleString('en-US')}`;
    return {
      label, min: c.min, max: c.max, n: c.items.length,
      meanWounded: +mean(w).toFixed(1), stdWounded: +std(w).toFixed(1),
      meanRate: +mean(r).toFixed(2), stdRate: +std(r).toFixed(2),
      lowConfidence: c.items.length < 3,
    };
  });
}

function vikingAnalysis(level) {
  const battles = loadBattles().filter(b => b.level === level && b.troopType === "Cataphract");
  if (battles.length < 2) return { battles, n: battles.length, insufficient: true };

  const troops = battles.map(b => b.troops);
  const wounded = battles.map(b => b.wounded);
  const rate = battles.map(b => b.woundRate);

  const corrTroopsWounded = pearson(troops, wounded);
  const corrTroopsRate = pearson(troops, rate);

  // سطل‌بندی پویا (بر اساس داده واقعی همون سطح، نه بازه ثابت)
  const bucketStats = dynamicBuckets(battles);

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
