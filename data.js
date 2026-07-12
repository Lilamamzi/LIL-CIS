// ============================================================
// Lil CIS — داده‌های پایه (Seed Data)
// این فایل رو خودتون دستی ویرایش نمی‌کنید؛ داده‌های جدید از
// داخل خود اپ (فرم ثبت نبرد) اضافه می‌شن و در localStorage
// ذخیره می‌مونن. این فایل فقط نقطه شروع (seed) هست.
// ============================================================

const SEED_BATTLES = [
  {account:"Lilmamazi", date:"07-06", level:15, targetPower:242165, troops:4349, troopType:"Cataphract", deaths:1, wounded:74, injured:null, survivors:3356},
  {account:"Lilmamazi", date:"07-06", level:16, targetPower:309203, troops:8132, troopType:"Cataphract", deaths:2, wounded:82, injured:null, survivors:6738},
  {account:"Lilmamazi", date:"07-06", level:14, targetPower:184889, troops:3986, troopType:"Cataphract", deaths:1, wounded:61, injured:null, survivors:3009},
  {account:"Lilmamazi", date:"07-07", level:15, targetPower:246229, troops:4063, troopType:"Cataphract", deaths:1, wounded:57, injured:null, survivors:3090},
  {account:"Lilmamazi", date:"07-07", level:15, targetPower:240755, troops:8007, troopType:"Cataphract", deaths:1, wounded:56, injured:null, survivors:7026},
  {account:"Lilmamazi", date:"07-08", level:15, targetPower:243921, troops:3986, troopType:"Cataphract", deaths:1, wounded:44, injured:null, survivors:2994},
  {account:"Lilmamazi", date:"07-08", level:15, targetPower:245548, troops:3986, troopType:"Cataphract", deaths:1, wounded:40, injured:null, survivors:3026},
  {account:"Lilmamazi", date:"07-08", level:15, targetPower:240618, troops:3986, troopType:"Cataphract", deaths:1, wounded:44, injured:null, survivors:3036},
  {account:"Lilmamazi", date:"07-08", level:15, targetPower:238608, troops:1710, troopType:"Cataphract", deaths:1, wounded:41, injured:null, survivors:801},
  {account:"NaderSHAAH", date:"07-08", level:15, targetPower:246082, troops:1805, troopType:"Cataphract", deaths:1, wounded:55, injured:821, survivors:928},
  {account:"NaderSHAAH", date:"07-08", level:15, targetPower:234145, troops:1710, troopType:"Cataphract", deaths:0, wounded:36, injured:833, survivors:841},
  {account:"NaderSHAAH", date:"07-08", level:15, targetPower:238954, troops:1863, troopType:"Cataphract", deaths:0, wounded:50, injured:827, survivors:986},
  {account:"NaderSHAAH", date:"07-08", level:15, targetPower:248516, troops:1939, troopType:"Cataphract", deaths:1, wounded:48, injured:859, survivors:1031},
  {account:"NaderSHAAH", date:"07-08", level:15, targetPower:249826, troops:1723, troopType:"Cataphract", deaths:1, wounded:69, injured:858, survivors:795},
  {account:"NaderSHAAH", date:"07-08", level:15, targetPower:231435, troops:1805, troopType:"Cataphract", deaths:1, wounded:48, injured:803, survivors:953},
  {account:"NaderSHAAH", date:"07-08", level:15, targetPower:238280, troops:1953, troopType:"Cataphract", deaths:1, wounded:57, injured:812, survivors:1083},
  {account:"Lilmamazi", date:"07-09", level:15, targetPower:240165, troops:1723, troopType:"Cataphract", deaths:1, wounded:46, injured:null, survivors:798},
  {account:"Lilmamazi", date:"07-10", level:15, targetPower:241121, troops:2183, troopType:"Cataphract", deaths:1, wounded:71, injured:null, survivors:1260},
  {account:"Lilmamazi", date:"07-10", level:15, targetPower:243140, troops:2064, troopType:"Cataphract", deaths:1, wounded:68, injured:null, survivors:1116},
  {account:"Lilmamazi", date:"07-10", level:15, targetPower:248649, troops:3195, troopType:"Cataphract", deaths:1, wounded:67, injured:null, survivors:2233},
  {account:"Lilmamazi", date:"07-10", level:15, targetPower:243282, troops:2059, troopType:"Cataphract", deaths:1, wounded:43, injured:null, survivors:1125},
  {account:"Lilmamazi", date:"07-10", level:15, targetPower:234953, troops:1728, troopType:"Cataphract", deaths:1, wounded:64, injured:null, survivors:816},
  {account:"Lilmamazi", date:"07-10", level:15, targetPower:233808, troops:5922, troopType:"Cataphract", deaths:1, wounded:67, injured:null, survivors:5033},
  {account:"Lilmamazi", date:"07-10", level:15, targetPower:243542, troops:3562, troopType:"Cataphract", deaths:1, wounded:51, injured:null, survivors:2652},
  {account:"Lilmamazi", date:"07-10", level:15, targetPower:237585, troops:3549, troopType:"Cataphract", deaths:1, wounded:51, injured:null, survivors:2636},
  {account:"Lilmamazi", date:"07-10", level:15, targetPower:248383, troops:1724, troopType:"Cataphract", deaths:1, wounded:53, injured:null, survivors:755},

  // نبردهای ۱۲ تیر (probe کنترل‌شده طبیعی: همه دقیقاً با ۱۷۱۵ نفر Cataphract)
  {account:"Lilmamazi", date:"07-11", level:15, targetPower:246388, troops:1715, troopType:"Cataphract", deaths:1, wounded:74, injured:879, survivors:761},
  {account:"Lilmamazi", date:"07-11", level:15, targetPower:228755, troops:1715, troopType:"Cataphract", deaths:1, wounded:43, injured:842, survivors:829},
  {account:"Lilmamazi", date:"07-12", level:15, targetPower:242583, troops:1715, troopType:"Cataphract", deaths:1, wounded:42, injured:883, survivors:789},
  {account:"Lilmamazi", date:"07-12", level:15, targetPower:241638, troops:1715, troopType:"Cataphract", deaths:1, wounded:68, injured:872, survivors:774},
  {account:"Lilmamazi", date:"07-12", level:15, targetPower:249529, troops:1715, troopType:"Cataphract", deaths:1, wounded:75, injured:868, survivors:771},
  {account:"Lilmamazi", date:"07-12", level:15, targetPower:249191, troops:1715, troopType:"Cataphract", deaths:1, wounded:59, injured:908, survivors:747},
  {account:"Lilmamazi", date:"07-12", level:15, targetPower:237468, troops:1715, troopType:"Cataphract", deaths:1, wounded:39, injured:888, survivors:787},
  {account:"Lilmamazi", date:"07-12", level:15, targetPower:248183, troops:1715, troopType:"Cataphract", deaths:1, wounded:68, injured:888, survivors:758},
  {account:"Lilmamazi", date:"07-12", level:15, targetPower:243906, troops:1715, troopType:"Cataphract", deaths:1, wounded:58, injured:859, survivors:797},
  {account:"Lilmamazi", date:"07-12", level:15, targetPower:235632, troops:1715, troopType:"Cataphract", deaths:1, wounded:38, injured:867, survivors:809},
  {account:"Lilmamazi", date:"07-12", level:15, targetPower:237277, troops:1715, troopType:"Cataphract", deaths:1, wounded:55, injured:849, survivors:810},
];

// قدرت هر واحد از رده مکس هر دسته (منبع: wiki.castelgame.ir)
const TROOP_TYPES = [
  {name:"Gladiator", fa:"گلادیاتور", category:"Swordsman", power:94.85},
  {name:"Elite", fa:"نخبه", category:"Archer", power:91.95},
  {name:"Cataphract", fa:"کاتافراکت", category:"Cavalry", power:98.2},
  {name:"Immortal", fa:"جاویدان", category:"Spearman", power:95.3},
  {name:"Bear", fa:"خرس", category:"Beast", power:95.65},
  {name:"Aztec", fa:"آزتک", category:"Gypsy", power:93},
  {name:"Zulu", fa:"زولو", category:"Giant", power:98.2},
];

const CATEGORY_FA = {
  Swordsman:"شمشیرزن", Archer:"کماندار", Cavalry:"سواره‌نظام",
  Spearman:"نیزه‌دار", Beast:"وحش", Gypsy:"کولی", Giant:"غول"
};

// ماتریس کانتر رسمی (منبع: wiki.castelgame.ir) — attacker -> defender -> effect
const TROOP_COUNTERS = {
  Swordsman:{Archer:"dominant", Cavalry:"vulnerable", Spearman:"favorable", Beast:"hindered", Gypsy:"dominant", Giant:"vulnerable"},
  Archer:{Swordsman:"vulnerable", Cavalry:"dominant", Spearman:"hindered", Beast:"favorable", Gypsy:"vulnerable", Giant:"dominant"},
  Cavalry:{Swordsman:"dominant", Archer:"vulnerable", Spearman:"hindered", Beast:"favorable", Gypsy:"dominant", Giant:"vulnerable"},
  Spearman:{Swordsman:"hindered", Archer:"favorable", Cavalry:"favorable", Beast:"vulnerable", Gypsy:"hindered", Giant:"dominant"},
  Beast:{Swordsman:"favorable", Archer:"hindered", Cavalry:"hindered", Spearman:"dominant", Gypsy:"vulnerable", Giant:"favorable"},
  Gypsy:{Swordsman:"vulnerable", Archer:"dominant", Cavalry:"vulnerable", Spearman:"favorable", Beast:"dominant", Giant:"hindered"},
  Giant:{Swordsman:"dominant", Archer:"vulnerable", Cavalry:"dominant", Spearman:"vulnerable", Beast:"hindered", Gypsy:"favorable"},
};

const EFFECT_FA = {
  dominant: {label:"قدرتمند خیلی زیاد", color:"#3FA796"},
  favorable: {label:"قدرتمند", color:"#7FBF7F"},
  hindered: {label:"ضعیف", color:"#D98C4A"},
  vulnerable: {label:"آسیب‌پذیر خیلی زیاد", color:"#C24444"},
};

// غنیمت شناخته‌شده (فقط سطح ۱۵ تأیید شده)
const LOOT_TABLE = {
  15: {direct: 12560, item: 10000},
  14: null,
  16: null,
};
