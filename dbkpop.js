/**
用于爬取dpkpop上某篇post中的图片
使用方法：
node 此文件 链接地址
*/

const fs = require('fs')
const https = require('https')
const request = require('request')
let writingTxt = false
let _filePath_

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
    fs.readFile(HTMLpath, (err, data) => {
      if (err) throw err

      let imgREG
      // if(data.indexOf('gallery-icon portrait') !== -1)
      //   imgREG = /class=['"]gallery-icon portrait['"]>\s*<a\s+href=['"]https:\/\/dbkpop\.com\/[^'"]+['"]/g
      // else
      //   imgREG = /class=['"]wp-caption aligncenter['"]>\s*<a\s+href=['"]https:\/\/dbkpop\.com\/[^'"]+['"]/g
      imgREG = /['"]https:\/\/dbkpop\.com\/wp-content\/uploads\/[^'"\s]+\.jpg/g
      
      const imgArr = imgArrFilter(data.toString().match(imgREG))
      console.log(imgArr)
      // sleep(1000000)
      return fs.writeFile('./downloadList.txt', imgArr.join('\n'), err => {
        if (err) throw err
        const titleREG = /class=['"]entry-title['"]>.+<\/h1>/g
        _filePath_ = decodeURIComponent(data.toString().match(titleREG)[0].replace(/class=['"]entry-title['"]>/,'').replace('<\/h1>','').replace(/[\/:*?"|<>]/g,'').trim())
        mkdir().then(() => resolve(imgArr))
      })
    })
  })
}
function imgArrFilter(imgArr){
  const finalArr = []
  imgArr.forEach(v => {
    if(v.indexOf('/cache/') === -1){
      const img = v.replace(/-\d{3,4}x\d{3,4}/,'').replace(/['"]/g, '').trim()
      if(!finalArr.includes(img))
        finalArr.push(img)
    }
  })
  return finalArr
}
function downloadImg(src) {
  return new Promise(resolve => {
    https.get(encodeURI(src), (req, res) => {
      let imgData = ''
      req.setEncoding('binary')
      req.on('data', chunk => (imgData += chunk))
      req.on('end', () => {
        const filename = decodeURIComponent(src.split('/').pop())
        fs.writeFile(`${_filePath_}/${filename}`, imgData, 'binary', err => {
          if (err) throw err
          resolve('ok')
        })
      })
    })
  })
}
function getHtml() {
  return new Promise(resolve => {
    request(process.argv[2], (err, response, body) => {
      if(err) throw err
      fs.writeFile('./html.html', body, err => {
        if (err) throw err
        resolve('ok')
      })
    })
  })
}
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
  getHtml().then(() => {
    getImgListFromHTML('./html.html').then(imgArr => {
      console.log(imgArr)
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

// downloadImg('https://dbkpop.com/wp-content/uploads/2019/03/Everglow_Crank_In_Film_Backstage_Onda_온다2.jpg')