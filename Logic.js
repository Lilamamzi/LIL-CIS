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

export class BattleAnalyzer {
    // ضرایب تخریب بر اساس نوع نیرو (مثال)
    static UNIT_STRENGTHS = {
        'infantry': 1.0,
        'cavalry': 1.5,
        'archery': 1.2
    };

    static calculateAttackScore(myUnits, enemyDefense) {
        let totalPower = 0;
        // محاسبه قدرت کل با اعمال ضرایب
        for (let unit in myUnits) {
            totalPower += myUnits[unit].count * this.UNIT_STRENGTHS[unit];
        }

        let winRate = (totalPower / enemyDefense.toughness) * 100;
        
        return {
            winRate: Math.min(winRate, 100).toFixed(1),
            suggestion: this.generateSuggestion(winRate, enemyDefense.type)
        };
    }

    static generateSuggestion(rate, defenseType) {
        if (rate < 50) return "پیشنهاد: صبر کنید و نیروهای سواره‌نظام بیشتری تولید کنید.";
        if (rate > 80) return "پیشنهاد: حمله کنید! نقاط ضعف دیوارها شناسایی شد.";
        return "پیشنهاد: با استفاده از کماندارها از فاصله دور حمله کنید.";
    }
}
// این قسمت رو وقتی دکمه تحلیل رو زدی صدا کن
function showChart(percent) {
    const ctx = document.getElementById('myChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut', // مدل دایره‌ای
        data: {
            labels: ['شانس پیروزی'],
            datasets: [{
                data: [percent, 100 - percent],
                backgroundColor: ['#007bff', '#e0e0e0'] // رنگ آبی برای پیروزی، خاکستری برای بقیه
            }]
        },
        options: {
            plugins: { legend: { display: false } } // متن‌های اضافه رو حذف می‌کنه
        }
    });
}
