/**
用于爬取naver上某篇post中的图片

示例post链接 https://m.post.naver.com/viewer/postView.nhn?volumeNo=16936498&memberNo=21661456

使用方法：
需要先将访问该链接得到的html文本（从chrome控制台获取response）复制粘贴到target.html中
再使用node运行此文件
后接上参数指定保存文件夹 
*/

const fs = require('fs')
const https = require('https')
// const request = require('request')
let writingTxt = false
const _filePath_ = process.argv[2]

function mkdir(){
  return new Promise(resolve => {
    fs.mkdir(_filePath_,err => {
      if(err) throw err
      resolve('ok')
    })
  })
}
function getImgListFromHTML(HTMLpath) {
  return new Promise(resolve => {
    const imgREG = /src="https:\/\/post-phinf\.pstatic\.net\/[^\/]+\/[^\/]+\.[a-zA-Z]+\/[^\.]+\.[a-zA-Z]+\?type[^"]+"/g
    fs.readFile(HTMLpath, (err, data) => {
      if (err) throw err
      const imgArr = data.toString().match(imgREG).map(v => v.replace('src=', '').replace(/"/g, '').split('?type')[0])
      fs.writeFile('./downloadList.txt', imgArr.join('\n'), err => {
        if (err) throw err
        resolve(imgArr)
      })
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
        const filename = decodeURIComponent(src.split('/').pop())
        if(/post_[0-9]+\.jpg/.test(filename))
          resolve('ok')
        else
          fs.writeFile(`${_filePath_}/${filename}`, imgData, 'binary', err => {
            if (err) throw err
            resolve('ok')
          })
      })
    })
  })
}
// function getHtml() {
//   return new Promise(resolve => {
//     request('https://m.post.naver.com/viewer/postView.nhn?volumeNo=17278473&memberNo=38791383', function (error, response, body) {
//       console.log(response)
//     })
//   })
// }
function writeDownloadList(str){
  const path = './downloadList.txt'
  if(writingTxt){
    setTimeout(() => writeDownloadList(str), 200)
  } else {
    writingTxt = true
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) throw err
      fs.writeFile(path, data.replace(str,''), err => {
        if (err) throw err
        writingTxt = false
      })
    })
  }
}
function sleep(ms) { //暂停，防止高并发请求导致被屏蔽
  return new Promise(resolve => {
    for (var t = Date.now(); Date.now() - t <= ms; );
    resolve('timeup')
  })
}
function app() {
  mkdir().then(() => {
    getImgListFromHTML('./target.html').then(imgArr => {
      let imgNumLeft = imgArr.length
      for (let i = 0; i < imgArr.length; i++) {
        sleep((Date.now() + Math.random * 1050) % 2000).then(() =>
          downloadImg(imgArr[i]).then(() => {
            writeDownloadList(imgArr[i]+'\n')
            console.log(`第${i + 1}张图片下载成功,还剩${--imgNumLeft}张`)
          })
        )
      }
    })
  })
}

app()

// getHtml()