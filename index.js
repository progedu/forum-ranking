function calc(monthlyAnswersNewJson, monthlyAnswersOldJson) {
    // 今月
    const monthlyRanking_new = monthlyAnswersNewJson.slice(0, 30);
    const monthlyRanking_old = monthlyAnswersOldJson.slice(0, 30);

    // 変更を反映させる。
    for (let [nowRank, nowValue] of monthlyRanking_new.entries()) {
        monthlyRanking_new[nowRank].change = `↑`; // 過去にはいないということは上昇！
        for (let [oldRank, oldValue] of monthlyRanking_old.entries()) {
            if (nowValue.userId === oldValue.userId) { // 発見！
                if (nowRank > oldRank) {
                    monthlyRanking_new[nowRank].change = `↓`;
                } else if (nowRank === oldRank) { // 不変;
                    monthlyRanking_new[nowRank].change = `-`;
                }
                break;
            }
        }
    }

    return monthlyRanking_new;
}

function displayMonthly(monthlyRanking) {
    $('div#loading-circle-monthly').remove(); // ローデイングの削除

    if (monthlyRanking.length === 0) {
        const divDom = $('<div>', {
            text: '今月の回答者はまだいません',
            css: { color: "white", textAlign: "center", borderStyle: "solid", borderColor: "white", margin: "5px", paddingTop: "20px", paddingBottom: "20px" }
        });
        $('ul#monthly-ranking').append(divDom);
    } else {

        for (let [index, userObj] of monthlyRanking.entries()) {
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
                text: `貢献フォーラム数 ${userObj.answeredQuestionMany}、回答数 ${userObj.total}`,
                style: 'font-size: 98%;'
            });
            liDom.append(imgDom);
            liDom.append(rankDom);
            liDom.append(div1Dom);
            liDom.append(div2Dom);
            $('ul#monthly-ranking').append(liDom);
        }
    }
}

function displayAllSpan(allSpanUser) {
    $('div#loading-circle-allspan').remove(); // ローデイングの削除

    for (let [index, userObj] of allSpanUser.entries()) {
        const liDom = $('<li>', {
            class: 'list-group-item'
        });
        const imgDom = $('<img>', {
            src: userObj.icon,
            width: "48px",
            css: { float: "left", marginRight: "10px" }
        });
        const div1Dom = $('<div>', {
            text: '' + (index + 1) + '位 ' + userObj.userName + ' さん'
        });
        const div2Dom = $('<div>', {
            html: `貢献フォーラム数 ${userObj.answeredQuestionMany}、回答数 ${userObj.total}`,
            style: 'font-size: 95%;'
        });
        liDom.append(imgDom);
        liDom.append(div1Dom);
        liDom.append(div2Dom);
        $('ul#all-ranking').append(liDom);
    }
}

function displayQuestionLinks(noAnswerQuestions) {
    $('div#loading-circle-question').remove(); // ローデイングの削除

    for (let [index, questionObj] of noAnswerQuestions.entries()) {
        const aDom = $('<a>', {
            href: `https://www.nnn.ed.nico/questions/${questionObj.id}`,
            class: 'list-group-item list-group-item-action',
            target: '_blank'
        });
        const divDom = $('<div>', {
            text: 'タグ: ',
            style: 'font-size: 90%;'
        });
        const tagSpan = $('<span>', {
            text: '【' + questionObj.tags + '】',
            style: 'background: linear-gradient(transparent 70%, #ff0 0%);'
        });
        divDom.append(tagSpan);
        const pDom = $('<p>', {
            text: questionObj.title,
            style: 'font-size: 80%; line-height: 1.5; margin-top: 5px; margin-bottom: 0px;'
        });
        aDom.append(divDom);
        aDom.append(pDom);
        $('div#questionLinks').append(aDom);
    }
}


$.getJSON('dataFiles/monthlyAnswers_new_30.json', function(monthlyAnswersNewJson) {
    $.getJSON('dataFiles/monthlyAnswers_old_30.json', function(monthlyAnswersOldJson) {
        const monthlyRanking = calc(monthlyAnswersNewJson, monthlyAnswersOldJson);
        displayMonthly(monthlyRanking);
        $.getJSON('dataFiles/answerUsers_50.json', function(allSpanUserJson) {
            displayAllSpan(allSpanUserJson.slice(0, 50));
            $.getJSON('dataFiles/noAnswerQuestions.json', function(noAnswerQuestions) {
                displayQuestionLinks(noAnswerQuestions);
            });
        });
    });
});


$('#monthly-tab').on('click', function(e) {
    $('div.col-md').eq(0).before($('#monthly-div'));
});

$('#totaly-tab').on('click', function(e) {
    $('div.col-md').eq(0).before($('#totaly-div'));
});

$('#unaswered-tab').on('click', function(e) {
    $('div.col-md').eq(0).before($('#questions-div'));
});

setTimeout("location.reload()", 24 * 60 * 60 * 1000); // 24時間後にリロード

console.log(
    ' %cＮ%c予備校 %c %cフ%cォ%cー%cラ%cム%c名%c誉%c会%c員%c ',
    'font-weight: bold; font-size: 48px; color: #22AAFF;',
    'font-weight: bold; font-size: 48px;',
    'font-size: 48px; background-color: #1a1a1a;',
    'font-size: 48px; background-color: #1a1a1a; color: red;',
    'font-size: 48px; background-color: #1a1a1a; color: orange;',
    'font-size: 48px; background-color: #1a1a1a; color: yellow;',
    'font-size: 48px; background-color: #1a1a1a; color: greenyellow;',
    'font-size: 48px; background-color: #1a1a1a; color: lime;',
    'font-size: 48px; background-color: #1a1a1a; color: mediumspringgreen;',
    'font-size: 48px; background-color: #1a1a1a; color: cyan;',
    'font-size: 48px; background-color: #1a1a1a; color: deepskyblue;',
    'font-size: 48px; background-color: #1a1a1a; color: violet;',
    'font-size: 48px; background-color: #1a1a1a'
);

console.log(
    '%c　GitHub　%c → %chttps://github.com/progedu/forum-ranking',
    'font-weight: bold; font-size: 20px; background-color: #d4edda; color: #0b2e13; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";',
    'font-size: 24px; color: #FF0000;',
    'font-weight: normal; font-size: 20px; color: #0000FF;'
);