// ============================================================
// نمودارهای Canvas — بدون کتابخانه خارجی (برای کارکرد آفلاین)
// ============================================================

function drawScatter(canvas, points, opts = {}) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = { l: 40, r: 14, t: 14, b: 28 };
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const xMin = Math.min(...xs) * 0.95, xMax = Math.max(...xs) * 1.05;
  const yMin = 0, yMax = Math.max(...ys) * 1.15;

  const X = x => pad.l + ((x - xMin) / (xMax - xMin)) * (w - pad.l - pad.r);
  const Y = y => h - pad.b - ((y - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);

  // محورها
  ctx.strokeStyle = "#232938"; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b);
  ctx.stroke();

  // برچسب y
  ctx.fillStyle = "#8B93A3"; ctx.font = "10px JetBrains Mono, monospace"; ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const val = yMin + (yMax - yMin) * (i / 4);
    const y = Y(val);
    ctx.fillText(val.toFixed(1), pad.l - 6, y + 3);
    ctx.strokeStyle = "rgba(35,41,56,.5)";
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
  }

  // نقاط
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y), 5, 0, Math.PI * 2);
    ctx.fillStyle = p.color || "#E8A33D";
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  if (opts.xLabel) {
    ctx.textAlign = "center"; ctx.fillStyle = "#8B93A3"; ctx.font = "10px Vazirmatn";
    ctx.fillText(opts.xLabel, w / 2, h - 6);
  }
}

function drawConfidenceRing(canvas, ratio, label) {
  const dpr = window.devicePixelRatio || 1;
  const size = canvas.clientWidth;
  canvas.width = size * dpr; canvas.height = size * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const cx = size / 2, cy = size / 2, r = size / 2 - 6;

  ctx.clearRect(0, 0, size, size);
  ctx.lineWidth = 6; ctx.lineCap = "round";

  ctx.strokeStyle = "#232938";
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

  const color = ratio >= 0.66 ? "#3FA796" : ratio >= 0.33 ? "#D98C4A" : "#C24444";
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#E7E9EE"; ctx.font = "700 15px JetBrains Mono, monospace"; ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + 5);
}
