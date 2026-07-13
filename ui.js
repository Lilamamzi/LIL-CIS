// ============================================================
// Lil CIS — رابط کاربری
// ============================================================

const appEl = document.getElementById("app");
let currentTab = "dashboard";
let addSubTab = "manual";
let ocrAssigned = {}; // field key -> number
let editingBattleId = null; // اگه پر باشه یعنی داریم ویرایش می‌کنیم، نه ثبت جدید

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentTab = btn.dataset.tab;
    render();
  });
});

function render() {
  if (currentTab === "dashboard") renderDashboard();
  else if (currentTab === "add") renderAdd();
  else if (currentTab === "analysis") renderAnalysis();
  else if (currentTab === "settings") renderSettings();
  window.scrollTo(0, 0);
}

// ---------------- Dashboard ----------------
function renderDashboard() {
  const battles = loadBattles();
  const accounts = [...new Set(battles.map(b => b.account))];
  const last = [...battles].sort((a, b) => b.id - a.id)[0];
  const model = fitWoundRateModel();

  appEl.innerHTML = `
    <div class="card">
      <h2>خلاصه وضعیت</h2>
      <div class="stat-row"><span class="stat-label">تعداد کل نبردهای ثبت‌شده</span><span class="stat-value">${battles.length}</span></div>
      <div class="stat-row"><span class="stat-label">حساب‌ها</span><span class="stat-value">${accounts.join(" / ") || "—"}</span></div>
      ${last ? `<div class="stat-row"><span class="stat-label">آخرین نبرد</span><span class="stat-value">${last.account} · Lv${last.level} · ${last.troops.toLocaleString('en-US')} نفر</span></div>` : ""}
    </div>

    ${model ? `
    <div class="card">
      <h2>موتور پیش‌بینی</h2>
      <p class="muted">مدل فعلی با دقت <b class="mono">${(model.r2*100).toFixed(0)}٪</b> روی <b class="mono">${model.n}</b> نبرد فعاله.</p>
      <button class="btn btn-secondary" onclick="document.querySelector('[data-tab=analysis]').click()">محاسبه نیروی لازم برای یه هدف ←</button>
    </div>` : ""}

    <div class="card">
      <h3>موتور رشد</h3>
      <p class="muted">${growthSuggestion()}</p>
    </div>
  `;
}

// ---------------- Add Battle ----------------
function renderAdd() {
  appEl.innerHTML = `
    <div class="tabs2">
      <button id="tab-manual" class="${addSubTab === 'manual' ? 'active' : ''}">ورود دستی</button>
      <button id="tab-vision" class="${addSubTab === 'vision' ? 'active' : ''}">Vision Engine</button>
    </div>
    <div id="add-content"></div>
  `;
  document.getElementById("tab-manual").onclick = () => { addSubTab = "manual"; renderAdd(); };
  document.getElementById("tab-vision").onclick = () => { addSubTab = "vision"; renderAdd(); };

  if (addSubTab === "manual") renderManualForm();
  else renderVisionTab();
}

function renderManualForm() {
  const editing = editingBattleId ? getBattle(editingBattleId) : null;
  const troopOptions = TROOP_TYPES.map(t => `<option value="${t.name}">${t.fa} (${CATEGORY_FA[t.category]})</option>`).join("");
  const container = document.getElementById("add-content");
  container.innerHTML = `
    <div class="card">
      <h2>${editing ? "ویرایش نبرد" : "افزودن نبرد — ورود دستی"}</h2>
      ${editing ? `<p class="muted">در حال ویرایش نبرد #${editing.id}. <button class="btn-secondary" style="width:auto;padding:4px 10px;border-radius:8px;font-size:.75rem" onclick="cancelEdit()">انصراف</button></p>` : ""}

      <label>نام حساب</label>
      <input type="text" id="f-account" value="${editing ? editing.account : 'Lilmamazi'}">

      <div class="row2">
        <div><label>تاریخ</label><input type="text" id="f-date" placeholder="MM-DD" value="${editing ? editing.date || '' : ''}"></div>
        <div><label>سطح وایکینگ</label><input type="number" id="f-level" placeholder="15" value="${editing ? editing.level : 15}"></div>
      </div>

      <label>قدرت هدف (وایکینگ)</label>
      <input type="number" id="f-power" placeholder="مثلا 240000" value="${editing && editing.targetPower ? editing.targetPower : ''}">

      <div class="row2">
        <div><label>نیروی اعزامی</label><input type="number" id="f-troops" placeholder="مثلا 1800" value="${editing ? editing.troops : ''}"></div>
        <div><label>نوع نیرو</label><select id="f-type">${troopOptions}</select></div>
      </div>
      <p class="muted" id="power-estimate" style="margin:6px 2px 0"></p>

      <div class="row2">
        <div><label>تلفات</label><input type="number" id="f-deaths" placeholder="0" value="${editing ? editing.deaths : 1}"></div>
        <div><label>مجروح</label><input type="number" id="f-wounded" placeholder="مثلا 50" value="${editing ? editing.wounded : ''}"></div>
      </div>

      <label>ترتیب نیروهای دشمن (اختیاری، قبل از حمله ببینید)</label>
      <input type="text" id="f-enemy-order" placeholder="مثلا: خرس, گرگ, شمشیرزن, سوارکار, نیزه بلند" value="${editing && editing.enemyOrder ? editing.enemyOrder.join(', ') : ''}">
      <p class="muted" style="margin:4px 2px 0">با ویرگول جدا کنید، از پرتعداد به کم‌تعداد.</p>

      <label>تعداد کل نیروی دشمن (بعد از حمله)</label>
      <input type="number" id="f-enemy-total" placeholder="مثلا 5170" value="${editing && editing.enemyTroopsTotal ? editing.enemyTroopsTotal : ''}">

      <label>یادداشت (اختیاری)</label>
      <input type="text" id="f-note" placeholder="مثلا probe با Zulu" value="${editing ? editing.note || '' : ''}">

      <div style="margin-top:16px"><button class="btn" id="save-battle">${editing ? "به‌روزرسانی نبرد" : "ذخیره نبرد"}</button></div>
      <div id="save-msg"></div>
    </div>
  `;

  const updateEstimate = () => {
    const troops = +document.getElementById("f-troops").value || 0;
    const type = document.getElementById("f-type").value;
    const t = TROOP_TYPES.find(x => x.name === type);
    const est = document.getElementById("power-estimate");
    if (troops && t) est.textContent = `تخمین قدرت من: ${(troops * t.power).toLocaleString("en-US", {maximumFractionDigits:0})} (فقط اطلاعاتی — در پیش‌بینی مجروح استفاده نمی‌شه)`;
    else est.textContent = "";
  };
  document.getElementById("f-troops").addEventListener("input", updateEstimate);
  document.getElementById("f-type").addEventListener("change", updateEstimate);
  if (editing) document.getElementById("f-type").value = editing.troopType || "Cataphract";
  updateEstimate();

  // پیش‌پرکردن از OCR در صورت وجود
  if (Object.keys(ocrAssigned).length) {
    if (ocrAssigned.level) document.getElementById("f-level").value = ocrAssigned.level;
    if (ocrAssigned.targetPower) document.getElementById("f-power").value = ocrAssigned.targetPower;
    if (ocrAssigned.troops) document.getElementById("f-troops").value = ocrAssigned.troops;
    if (ocrAssigned.deaths !== undefined) document.getElementById("f-deaths").value = ocrAssigned.deaths;
    if (ocrAssigned.wounded) document.getElementById("f-wounded").value = ocrAssigned.wounded;
    updateEstimate();
    ocrAssigned = {};
  }

  document.getElementById("save-battle").onclick = () => doSaveBattle(editing);
}

function cancelEdit() { editingBattleId = null; renderAdd(); }

function doSaveBattle(editing, force = false) {
  const enemyOrderRaw = document.getElementById("f-enemy-order").value.trim();
  const enemyOrder = enemyOrderRaw ? enemyOrderRaw.split(",").map(s => s.trim()).filter(Boolean) : null;
  const b = {
    account: document.getElementById("f-account").value.trim() || "Lilmamazi",
    date: document.getElementById("f-date").value.trim(),
    level: +document.getElementById("f-level").value || 15,
    targetPower: +document.getElementById("f-power").value || null,
    troops: +document.getElementById("f-troops").value || 0,
    troopType: document.getElementById("f-type").value,
    deaths: +document.getElementById("f-deaths").value || 0,
    wounded: +document.getElementById("f-wounded").value || 0,
    enemyOrder: enemyOrder,
    enemyTroopsTotal: document.getElementById("f-enemy-total").value ? +document.getElementById("f-enemy-total").value : null,
    note: document.getElementById("f-note").value.trim(),
  };
  const msgEl = document.getElementById("save-msg");
  if (!b.troops || !b.wounded) {
    msgEl.innerHTML = `<div class="banner banner-error">نیروی اعزامی و تعداد مجروح باید پر بشه.</div>`;
    return;
  }
  let unmatchedWarning = "";
  if (enemyOrder) {
    const unmatched = enemyOrder.filter(n => !guessCategory(n));
    if (unmatched.length) {
      unmatchedWarning = `<div class="banner banner-warn">این اسم‌ها شناخته نشدن و نادیده گرفته می‌شن: ${unmatched.join('، ')}. از کلمات کلیدی مثل «شمشیر، کماند، سوار، نیزه، خرس/گرگ/وحش، کولی، غول» استفاده کنید.</div>`;
    }
  }
  if (!force) {
    const dup = findDuplicate(b, editing ? editing.id : null);
    if (dup) {
      msgEl.innerHTML = `
        <div class="banner banner-warn">
          یه نبرد کاملاً مشابه (همون سطح، نیرو، قدرت هدف و مجروح) قبلاً ثبت شده (#${dup.id}). این احتمالاً یه ثبت تکراریه.
          <div style="margin-top:8px"><button class="btn btn-secondary" onclick="doSaveBattle(${editing ? 'true':'false'}, true)">با این حال ذخیره کن</button></div>
        </div>`;
      return;
    }
  }
  if (editing) updateBattle(editing.id, b);
  else addBattle(b);
  msgEl.innerHTML = unmatchedWarning + `<div class="banner banner-success">${editing ? "به‌روزرسانی شد" : "ذخیره شد"} ✓</div>`;
  editingBattleId = null;
  if (!unmatchedWarning) setTimeout(() => { document.querySelector('[data-tab=dashboard]').click(); }, 900);
}

function renderVisionTab() {
  const container = document.getElementById("add-content");
  container.innerHTML = `
    <div class="card">
      <h2>Vision Engine</h2>
      <p class="muted">اسکرین‌شات نتیجه نبرد رو آپلود کنید. OCR همه‌ی اعداد داخل تصویر رو پیدا می‌کنه؛ بعد خودتون با یک ضربه هرکدوم رو به فیلد درست وصل می‌کنید — این‌جوری هیچ‌وقت عدد اشتباه بی‌تأیید ذخیره نمی‌شه.</p>
      <div class="upload-box" id="upload-box">
        <svg viewBox="0 0 24 24" width="30" height="30"><path fill="#8B93A3" d="M12 3l5 5h-3v6h-4V8H7z"/><path fill="#8B93A3" d="M5 18h14v2H5z"/></svg>
        <div>تصویر را انتخاب یا اینجا رها کنید</div>
        <input type="file" id="file-input" accept="image/*" style="display:none">
      </div>
      <div id="ocr-status"></div>
      <div id="ocr-result"></div>
    </div>
  `;
  const box = document.getElementById("upload-box");
  const fileInput = document.getElementById("file-input");
  box.onclick = () => fileInput.click();
  box.addEventListener("dragover", e => { e.preventDefault(); box.classList.add("dragover"); });
  box.addEventListener("dragleave", () => box.classList.remove("dragover"));
  box.addEventListener("drop", e => {
    e.preventDefault(); box.classList.remove("dragover");
    if (e.dataTransfer.files[0]) handleImage(e.dataTransfer.files[0]);
  });
  fileInput.onchange = () => { if (fileInput.files[0]) handleImage(fileInput.files[0]); };
}

async function handleImage(file) {
  const statusEl = document.getElementById("ocr-status");
  const resultEl = document.getElementById("ocr-result");
  resultEl.innerHTML = "";
  statusEl.innerHTML = `<div class="banner banner-warn">در حال پردازش تصویر... <span id="ocr-progress">0%</span></div>`;
  try {
    const text = await runOCR(file, (p) => {
      const el = document.getElementById("ocr-progress");
      if (el) el.textContent = p + "%";
    });
    const numbers = extractNumbers(text);
    if (!numbers.length) {
      statusEl.innerHTML = `<div class="banner banner-error">هیچ عددی پیدا نشد. عکس واضح‌تر امتحان کنید یا از ورود دستی استفاده کنید.</div>`;
      return;
    }
    statusEl.innerHTML = `<div class="banner banner-success">${numbers.length} عدد پیدا شد. هرکدوم رو به فیلد درست وصل کنید:</div>`;
    renderOcrAssignment(numbers, resultEl);
  } catch (err) {
    statusEl.innerHTML = `<div class="banner banner-error">خطا در OCR: ${err.message}</div>`;
  }
}

function renderOcrAssignment(numbers, container) {
  const opts = numbers.map(n => `<option value="${n}">${n.toLocaleString('en-US')}</option>`).join("");
  container.innerHTML = `
    ${OCR_FIELDS.map(f => `
      <label>${f.label}</label>
      <select id="ocr-${f.key}">
        <option value="">— انتخاب نشده —</option>
        ${opts}
      </select>
    `).join("")}
    <div style="margin-top:16px"><button class="btn" id="ocr-continue">ادامه در فرم دستی برای بررسی و ذخیره</button></div>
  `;
  document.getElementById("ocr-continue").onclick = () => {
    ocrAssigned = {};
    OCR_FIELDS.forEach(f => {
      const val = document.getElementById(`ocr-${f.key}`).value;
      if (val !== "") ocrAssigned[f.key] = Number(val);
    });
    addSubTab = "manual";
    renderAdd();
  };
}

// ---------------- Analysis ----------------
let analysisLevel = 15;

function renderAnalysis() {
  const a = vikingAnalysis(analysisLevel);
  const eco = economyAnalysis();
  const comp = compositionEstimate(analysisLevel);
  const probes = probeRecommendation();

  appEl.innerHTML = `
    <div class="card">
      <h2>تحلیل Viking Engine</h2>
      <label style="margin-top:0">سطح وایکینگ</label>
      <select id="level-select" style="margin-bottom:6px">
        ${Array.from({length:25},(_,i)=>i+1).map(l => `<option value="${l}" ${analysisLevel===l?'selected':''}>سطح ${l}</option>`).join("")}
      </select>
      ${a.insufficient ? `<p class="muted">داده کافی نیست (${a.n} نبرد). حداقل ۲ نبرد لازمه.</p>` : `
        <div class="confidence-wrap">
          <canvas id="conf-ring" width="70" height="70" style="width:70px;height:70px"></canvas>
          <div class="confidence-text">
            <b>${a.n}</b> نبرد یکتا ثبت شده.<br>
            ${a.n >= 20 ? "اطمینان آماری قابل قبول." : a.n >= 10 ? "اطمینان متوسط — نیاز به داده بیشتر." : "اطمینان کم — نتایج رو با احتیاط ببینید."}
          </div>
        </div>

        <h3 style="margin-top:16px">همبستگی</h3>
        <div class="stat-row"><span class="stat-label">نیرو ↔ مجروح خام</span><span class="stat-value">${a.corrTroopsWounded?.toFixed(2) ?? '—'}</span></div>
        <div class="stat-row"><span class="stat-label">نیرو ↔ نرخ مجروحیت %</span><span class="stat-value">${a.corrTroopsRate?.toFixed(2) ?? '—'}</span></div>
        <p class="muted">مجروح خام معمولاً بین <b class="mono">${a.minWounded}</b> تا <b class="mono">${a.maxWounded}</b> می‌مونه، صرف‌نظر از سایز نیرو — ولی درصد مجروحیت با نیروی بیشتر پایین میاد.</p>

        <h3 style="margin-top:16px">نمودار نیرو / نرخ مجروحیت</h3>
        <canvas id="scatter" style="width:100%;height:180px"></canvas>

        <h3 style="margin-top:16px">تحلیل بر اساس بازه نیرو</h3>
        <table>
          <tr><th>بازه</th><th>تعداد</th><th>میانگین مجروح</th><th>میانگین نرخ%</th></tr>
          ${a.bucketStats.filter(b=>b.n>0).map(b => `
            <tr>
              <td>${b.label}</td>
              <td class="mono">${b.n} ${b.lowConfidence ? '<span class="badge badge-low">کم</span>' : ''}</td>
              <td class="mono">${b.meanWounded}</td>
              <td class="mono">${b.meanRate}</td>
            </tr>`).join("")}
        </table>
      `}
    </div>

    ${renderPredictorCard()}

    ${!a.insufficient ? `
    <div class="card">
      <h2>تخمین ترکیب پنهان سپاه دشمن</h2>
      <p class="muted">اطمینان: <b>${comp.confidence}</b> (بر اساس ${comp.n || 0} نبردی که ترکیب دشمنش رو قبل از حمله ثبت کردید).</p>
      ${comp.confirmedCategories && comp.confirmedCategories.length ? `
        <p class="muted">رده‌های تأیید‌شده در این سطح: <b>${comp.confirmedCategories.join('، ')}</b></p>
        <table>
          <tr><th>رده</th><th>واکنش Cataphract</th><th>سیگنال</th></tr>
          ${comp.ranking.map(r => `
            <tr>
              <td>${r.categoryFa}</td>
              <td style="color:${(EFFECT_FA[r.effect]||{}).color || '#8B93A3'}">${(EFFECT_FA[r.effect]||{}).label || r.effect}</td>
              <td class="mono">${r.signal > 0 ? '+' : ''}${r.signal}</td>
            </tr>
          `).join("")}
        </table>
        <p class="muted" style="margin-top:8px">سیگنال مثبت یعنی این رده بیشتر تو نبردهای پرمجروح‌تر دیده شده.</p>
      ` : `<p class="muted">هنوز نبردی با ترکیب دشمن ثبت‌شده نداریم. قبل از حمله بعدی، تو فرم ثبت نبرد، ترتیب نیروهای دیده‌شده رو وارد کنید (حداقل ۳ نبرد لازمه).</p>`}
    </div>

    <div class="card">
      <h3>پیشنهاد کاوشگر تشخیصی (Probe)</h3>
      <p class="muted">این نیروها بیشترین اطلاعات جدید رو درباره ترکیب پنهان می‌دن (چون واکنششون به دشمن با Cataphract فرق داره):</p>
      ${probes.slice(0,3).map((p,i) => `<div class="stat-row"><span class="stat-label">${i+1}. ${p.fa} (${CATEGORY_FA[p.category]})</span><span class="stat-value">${p.diffScore}/${p.total} اختلاف</span></div>`).join("")}
    </div>
    ` : ""}

    <div class="card">
      <h2>Economy Engine — غنیمت</h2>
      <table>
        <tr><th>سطح</th><th>تعداد نبرد</th><th>غنیمت مستقیم کل</th><th>غنیمت آیتمی کل</th></tr>
        ${Object.entries(eco).map(([lvl,d]) => `
          <tr>
            <td>${lvl}</td><td class="mono">${d.count}</td>
            <td class="mono">${d.lootDirect ? d.lootDirect.toLocaleString('en-US') : '—'}</td>
            <td class="mono">${d.lootItem ? d.lootItem.toLocaleString('en-US') : '—'}</td>
          </tr>`).join("")}
      </table>
      ${Object.values(eco).some(d=>d.unknownLoot) ? `<p class="muted" style="margin-top:8px">⚠️ برای بعضی سطوح، مقدار غنیمت هنوز تأیید نشده.</p>` : ""}
    </div>

    <div class="card">
      <h3>ماتریس کانتر (مرجع)</h3>
      <details>
        <summary style="cursor:pointer;color:var(--accent);font-size:.85rem">نمایش جدول کامل</summary>
        <div class="counter-grid">
          ${Object.entries(TROOP_COUNTERS).map(([cat, effects]) => `
            <div class="counter-cell">
              <b>${CATEGORY_FA[cat]}</b>
              ${Object.entries(effects).map(([d,e]) => `<div style="color:${EFFECT_FA[e].color}">${CATEGORY_FA[d]}: ${EFFECT_FA[e].label}</div>`).join("")}
            </div>
          `).join("")}
        </div>
      </details>
    </div>
  `;

  document.getElementById("level-select").onchange = (e) => setAnalysisLevel(+e.target.value);
  attachPredictorEvents();

  if (!a.insufficient) {
    drawConfidenceRing(document.getElementById("conf-ring"), Math.min(a.n / 20, 1), a.n + "");
    drawScatter(document.getElementById("scatter"), a.battles.map(b => ({ x: b.troops, y: b.woundRate })), { xLabel: "نیروی اعزامی" });
  }
}

function renderPredictorCard() {
  const model = fitWoundRateModel();
  if (!model) {
    return `<div class="card"><h2>پیش‌بینی هوشمند بین‌سطحی</h2><p class="muted">حداقل ۵ نبرد (با قدرت هدف ثبت‌شده) لازمه تا این مدل فعال بشه.</p></div>`;
  }
  return `
    <div class="card">
      <h2>پیش‌بینی هوشمند بین‌سطحی</h2>
      <p class="muted">
        این مدل رابطه‌ی «نسبت قدرت هدف به نیروی اعزامی» با نرخ مجروحیت رو از رو <b>همه‌ی سطوح با هم</b> یاد می‌گیره؛
        یعنی حتی برای وایکینگی که هنوز نزدیش نرفتید (فقط قدرتش رو دیدید)، می‌تونه نیروی لازم رو تخمین بزنه.
      </p>
      <div class="stat-row"><span class="stat-label">دقت مدل (R²)</span><span class="stat-value">${(model.r2*100).toFixed(0)}٪</span></div>
      <div class="stat-row"><span class="stat-label">تعداد نبرد پایه مدل</span><span class="stat-value">${model.n}</span></div>

      <label>قدرت هدف (هر سطحی)</label>
      <input type="number" id="pred-power" placeholder="مثلا 309000">
      <label>نرخ مجروحیت قابل‌قبول (٪)</label>
      <input type="number" id="pred-rate" placeholder="مثلا 1.5" step="0.1">
      <div style="margin-top:12px"><button class="btn" id="pred-btn">محاسبه نیروی لازم</button></div>
      <div id="pred-result" style="margin-top:10px"></div>
    </div>
  `;
}

function attachPredictorEvents() {
  const btn = document.getElementById("pred-btn");
  if (!btn) return;
  btn.onclick = () => {
    const power = +document.getElementById("pred-power").value;
    const rate = +document.getElementById("pred-rate").value;
    const resEl = document.getElementById("pred-result");
    if (!power || !rate) {
      resEl.innerHTML = `<div class="banner banner-error">قدرت هدف و نرخ مجروحیت رو پر کنید.</div>`;
      return;
    }
    const result = requiredTroopsForRate(power, rate);
    if (!result || result.point <= 0) {
      resEl.innerHTML = `<div class="banner banner-error">با این نرخ، مدل جواب معقولی نداره — نرخ بالاتری امتحان کنید.</div>`;
      return;
    }
    const lo = result.optimistic ? Math.min(result.optimistic, result.conservative || result.point) : result.point;
    const hi = result.conservative || result.point;
    resEl.innerHTML = `
      <div class="banner banner-success">
        بازه‌ی پیشنهادی: بین <b class="mono">${lo.toLocaleString('en-US')}</b> تا <b class="mono">${hi.toLocaleString('en-US')}</b> نفر Cataphract
        (برای اطمینان بیشتر، عدد بالاتر بازه رو بفرستید)
      </div>
      <p class="muted" style="margin-top:6px">این بازه از خطای معمول مدل (RMSE=${result.rmse.toFixed(2)}٪) به‌دست اومده، نه یه حدس. با داده بیشتر، این بازه تنگ‌تر می‌شه.</p>
    `;
  };
}

function setAnalysisLevel(l) { analysisLevel = l; renderAnalysis(); }

// ---------------- Settings ----------------
function renderSettings() {
  const battles = [...loadBattles()].sort((a,b) => b.id - a.id);
  appEl.innerHTML = `
    <div class="card">
      <h2>پشتیبان‌گیری</h2>
      <p class="muted">دیتا فقط داخل همین مرورگر/گوشی ذخیره می‌شه. حتماً هر چند وقت یه‌بار خروجی بگیرید.</p>
      <button class="btn" id="btn-export">دانلود پشتیبان (JSON)</button>
      <div style="margin-top:10px">
        <label>بازیابی از فایل پشتیبان</label>
        <input type="file" id="btn-import" accept="application/json">
      </div>
    </div>

    <div class="card">
      <h2>همه نبردها (${battles.length})</h2>
      ${battles.map(b => `
        <div class="battle-item">
          <span>${b.account} · Lv${b.level} · ${b.troops.toLocaleString('en-US')} نفر · مجروح ${b.wounded}</span>
          <span>
            <button class="del" style="color:var(--accent)" onclick="editBattle(${b.id})">✎</button>
            <button class="del" onclick="removeBattle(${b.id})">✕</button>
          </span>
        </div>
      `).join("") || `<div class="empty-state">هنوز نبردی ثبت نشده</div>`}
    </div>

    <div class="card">
      <h3>درباره</h3>
      <p class="muted">Lil CIS — دستیار هوشمند بازی Castel. تمام داده‌ها به‌صورت محلی و آفلاین روی همین دستگاه ذخیره می‌شه؛ هیچ سروری درگیر نیست.</p>
    </div>
  `;
  document.getElementById("btn-export").onclick = exportJSON;
  document.getElementById("btn-import").onchange = (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); };
}

function editBattle(id) {
  editingBattleId = id;
  addSubTab = "manual";
  document.querySelector('[data-tab=add]').click();
}

function removeBattle(id) {
  if (confirm("این نبرد حذف بشه؟")) { deleteBattle(id); renderSettings(); }
}

// ---------------- شروع ----------------
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
