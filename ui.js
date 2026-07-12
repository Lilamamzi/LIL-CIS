// ============================================================
// Lil CIS — رابط کاربری
// ============================================================

const appEl = document.getElementById("app");
let currentTab = "dashboard";
let addSubTab = "manual";
let ocrAssigned = {}; // field key -> number

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
  const rec15 = recommend(15, "wounded");

  appEl.innerHTML = `
    <div class="card">
      <h2>خلاصه وضعیت</h2>
      <div class="stat-row"><span class="stat-label">تعداد کل نبردهای ثبت‌شده</span><span class="stat-value">${battles.length}</span></div>
      <div class="stat-row"><span class="stat-label">حساب‌ها</span><span class="stat-value">${accounts.join(" / ") || "—"}</span></div>
      ${last ? `<div class="stat-row"><span class="stat-label">آخرین نبرد</span><span class="stat-value">${last.account} · Lv${last.level} · ${last.troops} نفر</span></div>` : ""}
    </div>

    ${rec15 && rec15.n ? `
    <div class="card">
      <h2>پیشنهاد سریع — وایکینگ ۱۵</h2>
      <p class="muted">بر اساس کمترین مجروح خام، بازه‌ی نیروی <b class="mono">${rec15.label}</b> بهترین نتیجه رو تا الان داشته (میانگین مجروح: <b class="mono">${rec15.meanWounded}</b>، از ${rec15.n} نبرد).</p>
      ${rec15.lowConfidence ? `<span class="badge badge-low">اطمینان کم — نمونه کمتر از ۳</span>` : `<span class="badge badge-ok">اطمینان قابل قبول</span>`}
      <div style="margin-top:12px"><button class="btn btn-secondary" onclick="currentTab='analysis';render();document.querySelector('[data-tab=analysis]').click()">مشاهده تحلیل کامل ←</button></div>
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
  const troopOptions = TROOP_TYPES.map(t => `<option value="${t.name}">${t.fa} (${t.category === 'Cavalry' ? 'سواره‌نظام' : CATEGORY_FA[t.category]})</option>`).join("");
  const container = document.getElementById("add-content");
  container.innerHTML = `
    <div class="card">
      <h2>افزودن نبرد — ورود دستی</h2>

      <label>نام حساب</label>
      <input type="text" id="f-account" placeholder="مثلا Lilmamazi" list="acc-list">
      <datalist id="acc-list">${[...new Set(loadBattles().map(b=>b.account))].map(a=>`<option value="${a}">`).join("")}</datalist>

      <div class="row2">
        <div><label>تاریخ</label><input type="text" id="f-date" placeholder="MM-DD"></div>
        <div><label>سطح وایکینگ</label><input type="number" id="f-level" placeholder="15" value="15"></div>
      </div>

      <label>قدرت هدف (وایکینگ)</label>
      <input type="number" id="f-power" placeholder="مثلا 240000">

      <div class="row2">
        <div><label>نیروی اعزامی</label><input type="number" id="f-troops" placeholder="مثلا 1800"></div>
        <div><label>نوع نیرو</label><select id="f-type">${troopOptions}</select></div>
      </div>
      <p class="muted" id="power-estimate" style="margin:6px 2px 0"></p>

      <div class="row2">
        <div><label>تلفات</label><input type="number" id="f-deaths" placeholder="0" value="1"></div>
        <div><label>مجروح</label><input type="number" id="f-wounded" placeholder="مثلا 50"></div>
      </div>
      <div class="row2">
        <div><label>مصدوم (اختیاری)</label><input type="number" id="f-injured" placeholder="—"></div>
        <div><label>بازمانده (اختیاری)</label><input type="number" id="f-survivors" placeholder="—"></div>
      </div>

      <label>یادداشت (اختیاری)</label>
      <input type="text" id="f-note" placeholder="مثلا probe با Zulu">

      <div style="margin-top:16px"><button class="btn" id="save-battle">ذخیره نبرد</button></div>
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

  // پیش‌پرکردن از OCR در صورت وجود
  if (Object.keys(ocrAssigned).length) {
    if (ocrAssigned.level) document.getElementById("f-level").value = ocrAssigned.level;
    if (ocrAssigned.targetPower) document.getElementById("f-power").value = ocrAssigned.targetPower;
    if (ocrAssigned.troops) document.getElementById("f-troops").value = ocrAssigned.troops;
    if (ocrAssigned.deaths !== undefined) document.getElementById("f-deaths").value = ocrAssigned.deaths;
    if (ocrAssigned.wounded) document.getElementById("f-wounded").value = ocrAssigned.wounded;
    if (ocrAssigned.injured) document.getElementById("f-injured").value = ocrAssigned.injured;
    updateEstimate();
    ocrAssigned = {};
  }

  document.getElementById("save-battle").onclick = () => {
    const b = {
      account: document.getElementById("f-account").value.trim() || "بدون‌نام",
      date: document.getElementById("f-date").value.trim(),
      level: +document.getElementById("f-level").value || 15,
      targetPower: +document.getElementById("f-power").value || null,
      troops: +document.getElementById("f-troops").value || 0,
      troopType: document.getElementById("f-type").value,
      deaths: +document.getElementById("f-deaths").value || 0,
      wounded: +document.getElementById("f-wounded").value || 0,
      injured: document.getElementById("f-injured").value ? +document.getElementById("f-injured").value : null,
      survivors: document.getElementById("f-survivors").value ? +document.getElementById("f-survivors").value : null,
      note: document.getElementById("f-note").value.trim(),
    };
    if (!b.troops || !b.wounded) {
      document.getElementById("save-msg").innerHTML = `<div class="banner banner-error">نیروی اعزامی و تعداد مجروح باید پر بشه.</div>`;
      return;
    }
    addBattle(b);
    document.getElementById("save-msg").innerHTML = `<div class="banner banner-success">نبرد با موفقیت ذخیره شد ✓</div>`;
    setTimeout(() => { document.querySelector('[data-tab=dashboard]').click(); }, 900);
  };
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
      <div class="tabs2">
        ${[14,15,16].map(l => `<button class="${analysisLevel===l?'active':''}" onclick="setAnalysisLevel(${l})">سطح ${l}</button>`).join("")}
      </div>
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

    ${!a.insufficient ? `
    <div class="card">
      <h2>پیشنهاد هوشمند</h2>
      ${renderRecCard("کمترین مجروح خام", recommend(analysisLevel,"wounded"))}
      ${renderRecCard("کمترین نرخ مجروحیت", recommend(analysisLevel,"rate"))}
    </div>

    <div class="card">
      <h2>تخمین ترکیب پنهان سپاه دشمن</h2>
      <p class="muted">اطمینان: <b>${comp.confidence}</b> (بر اساس ${comp.n || 0} نبرد). این فقط یه تخمین احتمالاتیه، نه واقعیت قطعی.</p>
      ${comp.ranking.length ? `
        <table>
          <tr><th>رده احتمالی</th><th>واکنش Cataphract</th><th>امتیاز</th></tr>
          ${comp.ranking.slice(0,4).map(r => `
            <tr><td>${r.categoryFa}</td><td style="color:${EFFECT_FA[r.effect].color}">${EFFECT_FA[r.effect].label}</td><td class="mono">${r.score}</td></tr>
          `).join("")}
        </table>
      ` : `<p class="muted">داده کافی نیست.</p>`}
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

  if (!a.insufficient) {
    drawConfidenceRing(document.getElementById("conf-ring"), Math.min(a.n / 20, 1), a.n + "");
    drawScatter(document.getElementById("scatter"), a.battles.map(b => ({ x: b.troops, y: b.woundRate })), { xLabel: "نیروی اعزامی" });
  }
}

function renderRecCard(title, rec) {
  if (!rec) return `<p class="muted">${title}: داده کافی نیست.</p>`;
  return `<div class="stat-row"><span class="stat-label">${title}</span><span class="stat-value">${rec.label} نفر ${rec.lowConfidence ? '<span class="badge badge-low">کم</span>' : ''}</span></div>`;
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
          <span>${b.account} · Lv${b.level} · ${b.troops} نفر · مجروح ${b.wounded}</span>
          <button class="del" onclick="removeBattle(${b.id})">✕</button>
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
