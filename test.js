const puppeteer = require('puppeteer');
const moment = require('moment-timezone');
const fs = require('fs');

const LIMIT_MAX = 50;
const answerUsersMap = new Map();
console.log('today is ' + moment().tz("Asia/Tokyo").format('YYYY-MM-DD HH:mm'));
const thisYear = moment().tz("Asia/Tokyo").format('YYYY');
const thisMonth = moment().tz("Asia/Tokyo").format('MM');
let writeToMonthFileFlag = true;

function fetchForumAPI(offset, limit) {
    console.log(`offset = ${offset}, limit = ${limit}`);
    return new Promise(function(resolve, reject) {
        (async() => {
            try {
                const browser = await puppeteer.launch();
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
                    const questionUserId = contest.user.id;
                    const questionUserName = contest.user.name;
                    const questionTimeStamp = contest.created_at;
                    const questionTimeYear = moment(questionTimeStamp * 1000).tz("Asia/Tokyo").format('YYYY');
                    const questionTimeMonth = moment(questionTimeStamp * 1000).tz("Asia/Tokyo").format('MM');
                    if (writeToMonthFileFlag === true && (questionTimeYear !== thisYear || questionTimeMonth !== thisMonth)) {
                        writeToMonthFileFlag = false;
                        console.log('copy file new to old.');
                        fs.copyFileSync('monthlyAnswers_new.json', 'monthlyAnswers_old.json');
                        console.log('write monthly file to new.');
                        writeToJsonFile(answerUsersMap, 'monthlyAnswers_new.json');
                    }

                    const answersManyMap = new Map();


                    for (let answer of contest.answers) {
                        const answerUserId = answer.user.id;
                        const answerUserName = answer.user.name;
                        if (questionUserId === answerUserId) {
                            continue;
                        }

                        if (!answersManyMap.has(answerUserId)) { // 新規
                            answersManyMap.set(answerUserId, { answerUserName, answerMany: 1 });
                        } else { // 重複
                            const answerManyObj = answersManyMap.get(answerUserId);
                            answerManyObj.answerMany += 1;
                            answersManyMap.set(answerUserId, answerManyObj);
                        }
                    }

                    for (let [answerUserId, answerManyObj] of answersManyMap) {
                        if (!answerUsersMap.has(answerUserId)) { // 新規
                            answerUsersMap.set(answerUserId, { userName: answerManyObj.answerUserName, total: answerManyObj.answerMany, answeredQuestionMany: 1 });
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
            answeredQuestionMany: answerObj.answeredQuestionMany
        };
        outPutJSON.push(pushObj);
    }

    outPutJSON = sortAnswersData(outPutJSON);

    fs.writeFileSync(fileName, JSON.stringify(outPutJSON, null, '   '));
}

function fetchConroler(offset) {

    fetchForumAPI(offset, LIMIT_MAX).then((nonQuestionAnswers) => {
        if (nonQuestionAnswers === 'finish!') {
            console.log('crowring finish');
            writeToJsonFile(answerUsersMap, 'answerUsers.json');
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