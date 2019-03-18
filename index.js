$.ajax({
    url: 'answerUsersnainai.json',
    statusCode: {
        404: function() {
            console.log("page not found");
        }
    }
});

$.getJSON('answerUsers.json', function(allSpanUserJson) {
    $.getJSON('monthlyAnswers_2019_03_18.json', function(json) {
        console.log(json);
    });
});


function sortAnswersData(answersData) {
    return answersData.sort(function(a, b) {
        if (a.answeredQuestionMany > b.answeredQuestionMany) {
            return -1;
        } else if (a.answeredQuestionMany < b.answeredQuestionMany) {
            return 1;
        } else {
            if (a.total > b.total) {
                return -1;
            } else if (a.total < b.total) {
                return 1;
            } else {
                return 0;
            }
        }
    });
}

function calc() {
    try {
        // 全期間
        const allSpanUserJson = JSON.parse(fs.readFileSync('answerUsers.json', 'utf8'));
        ranking50 = sortAnswersData(allSpanUserJson).slice(0, 50);

        // 今月
        const thisYearMonthDay = moment().tz("Asia/Tokyo").format('YYYY_MM_DD');
        const thisTimeStanp = moment().tz("Asia/Tokyo");
        const yesterDayYearMonthDay = moment(thisTimeStanp - 1000 * 60 * 60 * 24).tz("Asia/Tokyo").format('YYYY_MM_DD');
        const datBeforeYesterdayYearMonthDay = moment(thisTimeStanp - 1000 * 60 * 60 * 24 * 2).tz("Asia/Tokyo").format('YYYY_MM_DD');

        // おとといのデータがあれば削除
        try { fs.unlinkSync(`monthlyAnswers_${datBeforeYesterdayYearMonthDay}.json`); } catch (e) {}
        // ランキング作成
        const thisMonthUserJson = JSON.parse(fs.readFileSync(`monthlyAnswers_${thisYearMonthDay}.json`, 'utf8'));
        monthlyRanking50 = sortAnswersData(thisMonthUserJson).slice(0, 50);

        // 変更を反映させる。
        try {
            const thisMonthUserJson_old = JSON.parse(fs.readFileSync(`monthlyAnswers_${yesterDayYearMonthDay}.json`, 'utf8'));
            const monthlyRanking50_old = sortAnswersData(thisMonthUserJson_old).slice(0, 50);

            for (let [nowRank, nowValue] of monthlyRanking50.entries()) {
                monthlyRanking50[nowRank].change = `↑`; // 過去にはいないということは上昇！
                for (let [oldRank, oldValue] of monthlyRanking50_old.entries()) {
                    if (nowValue.userId === oldValue.userId) { // 発見！
                        if (nowRank < oldRank) {
                            monthlyRanking50[nowRank].change = `↓`;
                        } else if (nowRank === oldRank) { // 不変;
                            monthlyRanking50[nowRank].change = `-`;
                        }
                        break;
                    }
                }
            }
        } catch (e) {}

    } catch (e) {
        console.log(e);
        return [];
    }
}

calc();