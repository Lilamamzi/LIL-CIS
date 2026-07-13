// ============================================================
// Vision Engine — OCR سمت مرورگر با Tesseract.js
//
// طراحی عمداً محتاطانه است: به‌جای حدس زدن خودکار "کدوم عدد
// مال کدوم فیلده" (که قبلاً باگ‌های زیادی داشت)، همه‌ی اعداد
// پیدا‌شده رو نشون می‌ده و کاربر با یک ضربه هرکدوم رو به فیلد
// درست وصل می‌کنه. این یعنی OCR کار دستی تایپ کردن رو حذف
// می‌کنه، ولی تصمیم نهایی همیشه دست خود کاربره.
// ============================================================

const OCR_FIELDS = [
  { key: "level", label: "سطح وایکینگ" },
  { key: "targetPower", label: "قدرت هدف" },
  { key: "troops", label: "نیروی اعزامی (من)" },
  { key: "deaths", label: "تلفات (من)" },
  { key: "wounded", label: "مجروح (من)" },
];

function faDigitsToEn(str) {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return str.replace(/[۰-۹]/g, d => fa.indexOf(d));
}

function extractNumbers(rawText) {
  const normalized = faDigitsToEn(rawText).replace(/,/g, "");
  const matches = normalized.match(/-?\d+/g) || [];
  // فیلتر اعداد خیلی بزرگ بی‌معنی (احتمالاً خطای OCR) و صفرهای تکراری بی‌فایده
  return [...new Set(matches.map(Number))]
    .filter(n => Math.abs(n) < 10_000_000)
    .sort((a, b) => b - a);
}

async function runOCR(imageFile, onProgress) {
  if (!window.Tesseract) {
    throw new Error("کتابخانه OCR بارگذاری نشد (اتصال اینترنت رو چک کنید).");
  }
  const worker = await Tesseract.createWorker("eng", 1, {
    logger: (m) => {
      if (onProgress && m.status === "recognizing text") onProgress(Math.round(m.progress * 100));
    },
  });
  try {
    const { data } = await worker.recognize(imageFile);
    return data.text || "";
  } finally {
    await worker.terminate();
  }
}
