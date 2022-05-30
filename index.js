"use strict"

/*---------------依赖-----------------*/
const nodeMailer = require('nodemailer');
const axios = require('axios');

/*---------------配置-----------------*/
const config = {
    "baseUrl": "https://api.juejin.cn",
    "apiUrl": {
        "getTodayStatus": "/growth_api/v1/get_today_status",
        "checkIn": "/growth_api/v1/check_in",
        "getLotteryConfig": "/growth_api/v1/lottery_config/get",
        "drawLottery": "/growth_api/v1/lottery/draw"
    },
    "cookie": "MONITOR_WEB_ID=14e7f684-0ceb-4718-8cb8-b10bfc8f283f; _ga=GA1.2.720755667.1651823988; __tea_cookie_tokens_2608=%257B%2522web_id%2522%253A%25227094529966423148047%2522%252C%2522user_unique_id%2522%253A%25227094529966423148047%2522%252C%2522timestamp%2522%253A1651823987800%257D; passport_csrf_token=ae797307dc152598d1221b25cdd9eacb; passport_csrf_token_default=ae797307dc152598d1221b25cdd9eacb; n_mh=gNtF5idfT1ba1fyWwb5mMhnEVtoWki99iJ7xVbFx0JI; sid_guard=53980527c22566b384dd2c3af9b1ca0d%7C1651824290%7C31536000%7CSat%2C+06-May-2023+08%3A04%3A50+GMT; uid_tt=a8c1d81dba2c76090862aabb156c8aa5; uid_tt_ss=a8c1d81dba2c76090862aabb156c8aa5; sid_tt=53980527c22566b384dd2c3af9b1ca0d; sessionid=53980527c22566b384dd2c3af9b1ca0d; sessionid_ss=53980527c22566b384dd2c3af9b1ca0d; sid_ucp_v1=1.0.0-KDgwMTAxOGU2NmRlMjc3M2ZlYWFhODI2ZThmMTIwNGIzYTY4MmJhYTcKFgjHt4DA_fX9BhCirdOTBhiwFDgIQDgaAmxmIiA1Mzk4MDUyN2MyMjU2NmIzODRkZDJjM2FmOWIxY2EwZA; ssid_ucp_v1=1.0.0-KDgwMTAxOGU2NmRlMjc3M2ZlYWFhODI2ZThmMTIwNGIzYTY4MmJhYTcKFgjHt4DA_fX9BhCirdOTBhiwFDgIQDgaAmxmIiA1Mzk4MDUyN2MyMjU2NmIzODRkZDJjM2FmOWIxY2EwZA; _tea_utm_cache_2608={%22utm_source%22:%22bdpcjj07934%22%2C%22utm_medium%22:%22sem_baidu_jj_pc_pz01%22%2C%22utm_campaign%22:%22sembaidu%22}; _gid=GA1.2.411639738.1653869234",
    "email": {
        "qq": {
            "user": "602020050@qq.com",
            "from": "602020050@qq.com",
            "to": "602020050@qq.com",
            "pass": "gjbjowspwrbsbcfb"
        }
    }
}

/*---------------掘金-----------------*/

// 签到
const checkIn = async () => {
    let {error, isCheck} = await getTodayCheckStatus();
    if (error) return console.log('查询签到失败');
    if (isCheck) return console.log('今日已参与签到');
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.checkIn, method: 'post', headers: {Cookie: cookie}});
    if (data.err_no) {
        console.log('签到失败');
        await sendEmailFromQQ('今日掘金签到：失败', JSON.stringify(data));
    } else {
        console.log(`签到成功！当前积分：${data.data.sum_point}`);
        await sendEmailFromQQ('今日掘金签到：成功', JSON.stringify(data));
    }
}

// 查询今日是否已经签到
const getTodayCheckStatus = async () => {
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.getTodayStatus, method: 'get', headers: {Cookie: cookie}});
    if (data.err_no) {
        await sendEmailFromQQ('今日掘金签到查询：失败', JSON.stringify(data));
    }
    return {error: data.err_no !== 0, isCheck: data.data}
}

// 抽奖
const draw = async () => {
    let {error, isDraw} = await getTodayDrawStatus();
    if (error) return console.log('查询抽奖次数失败');
    if (isDraw) return console.log('今日已无免费抽奖次数');
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.drawLottery, method: 'post', headers: {Cookie: cookie}});
    if (data.err_no) return console.log('免费抽奖失败');
    console.log(`恭喜抽到：${data.data.lottery_name}`);
}

// 获取今天免费抽奖的次数
const getTodayDrawStatus = async () => {
    const {cookie, baseUrl, apiUrl} = config;
    let {data} = await axios({url: baseUrl + apiUrl.getLotteryConfig, method: 'get', headers: {Cookie: cookie}});
    if (data.err_no) {
        return {error: true, isDraw: false}
    } else {
        return {error: false, isDraw: data.data.free_count === 0}
    }
}

/*---------------邮件-----------------*/

// 通过qq邮箱发送
const sendEmailFromQQ = async (subject, html) => {
    let cfg = config.email.qq;
    if (!cfg || !cfg.user || !cfg.pass) return;
    const transporter = nodeMailer.createTransport({service: 'qq', auth: {user: cfg.user, pass: cfg.pass}});
    transporter.sendMail({
        from: cfg.from,
        to: cfg.to,
        subject: subject,
        html: html
    }, (err) => {
        if (err) return console.log(`发送邮件失败：${err}`, true);
        console.log('发送邮件成功')
    })
}

exports.juejin = async (event, context) => {
    console.log('开始');
    await checkIn();
    await draw();
    console.log('结束');
};