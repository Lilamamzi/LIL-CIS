// logic.js
class BattleAnalyzer {
    constructor() {
        this.baseDamageFactor = 1.2;
    }

    // محاسبه قدرت حمله بر اساس سطح نیرو و دفاع
    calculateWinChance(troopLevel, defenseLevel) {
        if (troopLevel < defenseLevel) return "کم (نیاز به استراتژی خاص)";
        if (troopLevel === defenseLevel) return "متوسط (احتمال ۵۰٪)";
        return "بالا (احتمال ۸۰٪)";
    }
}

export default BattleAnalyzer;
