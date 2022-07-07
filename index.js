const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter } = require("./db");

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  console.log('bbbb')
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

app.all('/getInfo', async function (req, res) {
  const { info } = req.method === 'GET' ? req.query : req.body
  console.log('请求头', req.headers)
  const appid = req.headers['x-wx-from-appid'] || ''
  const openid = req.headers['x-wx-from-openid'] || req.headers['x-wx-openid']
  console.log('原始数据', appid, info, openid)
  const infores = await getOpenData(appid, openid, info)
  console.log('接口数据', infores)
  res.send(infores)
})

function getOpenData (appid, openid, cloudid) {
  return new Promise((resolve, reject) => {
    request({
      url: `http://api.weixin.qq.com/wxa/getopendata?from_appid=${appid}&openid=${openid}`,
      method: 'POST',
      body: JSON.stringify({
        cloudid_list: [cloudid]
      })
    }, function (error, res) {
      if (error) reject(error)
      resolve(res.body)
    })
  })
}

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
