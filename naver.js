const request = require('request')
const fs = require('fs')
const https = require('https')

function getImgListFromHTML(HTMLpath) {
  return new Promise(resolve => {
    const imgREG = /src="https:\/\/post-phinf\.pstatic\.net\/[^\/]+\/[^\/]+\.[a-zA-Z]+\/[^\.]+\.[a-zA-Z]+\?type=[^"]+"/g
    fs.readFile(HTMLpath, (err, data) => {
      if (err) throw err
      const imgArr = data.toString().match(imgREG).map(v => v.replace('src=', '').replace(/"/g, '').split('?type=')[0])
      resolve(imgArr)
    })
  })
}
function downloadImg(src) {
  return new Promise(resolve => {
    https.get(src, (req, res) => {
      let imgData = ''
      req.setEncoding('binary')
      req.on('data', chunk => (imgData += chunk))
      req.on('end', () => {
        fs.writeFile(`${process.argv[2]}/${decodeURIComponent(src.split('/').pop())}`, imgData, 'binary', err => {
          if (err) throw err
          resolve('ok')
        })
      })
    })
  })
}
function sleep(ms) { //暂停，防止高并发请求导致被屏蔽
  return new Promise(resolve => {
    for (var t = Date.now(); Date.now() - t <= ms; );
    resolve('timeup')
  })
}
function app() {
  getImgListFromHTML('./target.html').then(imgArr => {
    let imgNumLeft = imgArr.length
    for (let i = 0; i < imgArr.length; i++) {
      sleep((Date.now() + Math.random * 1050) % 2000).then(() =>
        downloadImg(imgArr[i]).then(() => {
          console.log(`第${i + 1}张图片下载成功,还剩${--imgNumLeft}张`)
        })
      )
    }
  })
}

app()