const puppeteer = require('puppeteer');
const moment = require('moment-timezone');
const fs = require('fs');

const LIMIT_MAX = 50;
const answerUsersMap = new Map();
const noAnswerQuestions = [];
console.log('today is ' + moment().tz("Asia/Tokyo").format('YYYY-MM-DD HH:mm'));
const thisYear = moment().tz("Asia/Tokyo").format('YYYY');
const thisMonth = moment().tz("Asia/Tokyo").format('MM');
let writeToMonthFileFlag = true;

function fetchForumAPI(offset, limit) {
    console.log(`offset = ${offset}, limit = ${limit}`);
    return new Promise(function(resolve, reject) {
        (async() => {
            const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            try {
                const page = await browser.newPage();
                const response = await page.goto(`https://api.nnn.ed.nico/v1/questions?offset=${offset}&limit=${limit}`);

                const contentsJson = await page.evaluate(() => {
                    return JSON.parse(document.querySelector("body pre").innerText);
                });

                if (contentsJson.questions.length === 0) {
                    await browser.close();
                    resolve('finish!');
                    return;
                }

                for (let contest of contentsJson.questions) {
                    const questionId = contest.id;
                    const title = contest.title;
                    const tags = contest.tags;
                    const questionUserId = contest.user.id;
                    const questionUserName = contest.user.name;
                    const isResolved = contest.is_resolved;
                    const answersCount = contest.answers_count;
                    const questionTimeStamp = contest.created_at;

                    const questionTimeYear = moment(questionTimeStamp * 1000).tz("Asia/Tokyo").format('YYYY');
                    const questionTimeMonth = moment(questionTimeStamp * 1000).tz("Asia/Tokyo").format('MM');
                    if (writeToMonthFileFlag === true && (questionTimeYear !== thisYear || questionTimeMonth !== thisMonth)) {
                        writeToMonthFileFlag = false;
                        console.log('copy file new to old.');
                        fs.copyFileSync('dataFiles/monthlyAnswers_new.json', 'dataFiles/monthlyAnswers_old.json');
                        // fs.copyFileSync('dataFiles/monthlyAnswers_new_30.json', 'dataFiles/monthlyAnswers_old_30.json');
                        console.log('write monthly file to new.');
                        writeToJsonFile(answerUsersMap, 'monthlyAnswers_new.json');
                    }

                    if (isResolved == false && answersCount == 0 && tags.indexOf('運営') < 0) { // 未回答＆未解決の質問の時
                        noAnswerQuestions.push({ id: questionId, title, tags });
                    }


                    const answersManyMap = new Map();

                    for (let answer of contest.answers) {
                        const answerUserId = answer.user.id;
                        const answerUserName = answer.user.name;
                        const answerUserIcon = answer.user.icon;
                        if (questionUserId === answerUserId) {
                            continue;
                        }

                        if (!answersManyMap.has(answerUserId)) { // 新規
                            answersManyMap.set(answerUserId, { answerUserName, answerMany: 1, answerUserIcon });
                        } else { // 重複
                            const answerManyObj = answersManyMap.get(answerUserId);
                            answerManyObj.answerMany += 1;
                            answersManyMap.set(answerUserId, answerManyObj);
                        }
                    }

                    for (let [answerUserId, answerManyObj] of answersManyMap) {
                        if (!answerUsersMap.has(answerUserId)) { // 新規
                            answerUsersMap.set(answerUserId, { userName: answerManyObj.answerUserName, total: answerManyObj.answerMany, answeredQuestionMany: 1, icon: answerManyObj.answerUserIcon });
                        } else { // 重複
                            const answerUser = answerUsersMap.get(answerUserId);
                            answerUser.total += answerManyObj.answerMany;
                            answerUser.answeredQuestionMany += 1;
                            answerUsersMap.set(answerUserId, answerUser);
                        }
                    }
                }

                await browser.close();
                return resolve('sucsess and contiune');
            } catch (e) {
                await browser.close();
                return reject(e);
            }
        })();
    });
}

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

function writeToJsonFile(answerUsersMap, fileName) {
    let outPutJSON = [];
    for ([userId, answerObj] of answerUsersMap) {
        const pushObj = {
            userId,
            userName: answerObj.userName,
            total: answerObj.total,
            answeredQuestionMany: answerObj.answeredQuestionMany,
            icon: answerObj.icon
        };
        outPutJSON.push(pushObj);
    }

    outPutJSON = sortAnswersData(outPutJSON);

    fs.writeFileSync(`dataFiles/${fileName}`, JSON.stringify(outPutJSON, null, '   '));

    if (fileName === 'monthlyAnswers_new.json') {
        fs.writeFileSync(`dataFiles/${fileName}`.replace('.json', '_30.json'), JSON.stringify(outPutJSON.slice(0, 30), null, '   '));
    }

    if (fileName === 'answerUsers.json') {
        fs.writeFileSync(`dataFiles/${fileName}`.replace('.json', '_50.json'), JSON.stringify(outPutJSON.slice(0, 50), null, '   '));
    }
}

function fetchConroler(offset) {

    fetchForumAPI(offset, LIMIT_MAX).then((nonQuestionAnswers) => {
        if (nonQuestionAnswers === 'finish!') {
            console.log('crowring finish');
            writeToJsonFile(answerUsersMap, 'answerUsers.json');
            fs.writeFileSync('dataFiles/noAnswerQuestions.json', JSON.stringify(noAnswerQuestions, null, '   '));
            return;
        }

        // sucsess
        const nestOffset = offset + LIMIT_MAX;
        setTimeout(fetchConroler, 3000, nestOffset);

    }).catch((e) => {
        console.log(e);
        console.log('retry anyway!');
        setTimeout(fetchConroler, 1000 * 60, offset);
        return;
    });
}

fetchConroler(0);