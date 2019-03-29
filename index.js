function calc(allSpanUserJson, monthlyAnswersNewJson, monthlyAnswersOldJson) {
    // 全期間
    const ranking50 = allSpanUserJson.slice(0, 50);
    // 今月
    const monthlyRanking50 = monthlyAnswersNewJson.slice(0, 30);
    const monthlyRanking50_old = monthlyAnswersOldJson.slice(0, 30);

    // 変更を反映させる。
    for (let [nowRank, nowValue] of monthlyRanking50.entries()) {
        monthlyRanking50[nowRank].change = `↑`; // 過去にはいないということは上昇！
        for (let [oldRank, oldValue] of monthlyRanking50_old.entries()) {
            if (nowValue.userId === oldValue.userId) { // 発見！
                if (nowRank > oldRank) {
                    monthlyRanking50[nowRank].change = `↓`;
                } else if (nowRank === oldRank) { // 不変;
                    monthlyRanking50[nowRank].change = `-`;
                }
                break;
            }
        }
    }

    return [ranking50, monthlyRanking50];
}

function display(ranking50, monthlyRanking50) {
    for (let [index, userObj] of monthlyRanking50.entries()) {
        const liDom = $('<li>', {
            class: 'list-group-item'
        });
        const imgDom = $('<img>', {
            src: userObj.icon,
            width: "48px",
            css: { float: "left", marginRight: "10px" }
        });
        let badgeHTML = ``;
        if (userObj.change === '↑') {
            badgeHTML = `<span class="badge badge-danger">${userObj.change}</span>`;
        } else if (userObj.change === '↓') {
            badgeHTML = `<span class="badge badge-primary">${userObj.change}</span>`;
        }
        const rankDom = $('<span>', {
            html: '' + (index + 1) + `位 ${badgeHTML}`,
            css: { marginRight: "10px" }
        });
        const div1Dom = $('<span>', {
            text: userObj.userName + ` さん`
        });
        const div2Dom = $('<div>', {
            text: `貢献フォーラム数: ${userObj.answeredQuestionMany} 回答数: ${userObj.total}`
        });
        liDom.append(imgDom);
        liDom.append(rankDom);
        liDom.append(div1Dom);
        liDom.append(div2Dom);
        $('ul#monthly-ranking').append(liDom);
    }

    for (let [index, userObj] of ranking50.entries()) {
        const liDom = $('<li>', {
            class: 'list-group-item'
        });
        const imgDom = $('<img>', {
            src: userObj.icon,
            width: "48px",
            css: { float: "left", marginRight: "10px" }
        });
        const div1Dom = $('<div>', {
            text: '' + (index + 1) + '位　' + userObj.userName + ' さん'
        });
        const div2Dom = $('<div>', {
            text: '回答したフォーラムの数: ' + userObj.answeredQuestionMany + ' 回答数: ' + userObj.total
        });
        liDom.append(imgDom);
        liDom.append(div1Dom);
        liDom.append(div2Dom);
        $('ul#all-ranking').append(liDom);
    }
}

$.getJSON('answerUsers.json', function(allSpanUserJson) {
    $.getJSON('monthlyAnswers_new.json', function(monthlyAnswersNewJson) {
        $.getJSON('monthlyAnswers_old.json', function(monthlyAnswersOldJson) {
            const [ranking50, monthlyRanking50] = calc(allSpanUserJson, monthlyAnswersNewJson, monthlyAnswersOldJson);
            display(ranking50, monthlyRanking50);
        });
    });
});