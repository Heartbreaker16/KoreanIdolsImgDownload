/**
 * 用于爬取dispatch上的图片
 * 使用方法：https://m.entertain.naver.com/entertain?id=1053268&imgId=9133964&host=https://m.entertain.naver.com&listUrl=https://m.entertain.naver.com/photo#thumblist/p:1
 * 访问该链接将得到图集
 * 需要先将访问该链接得到的html文本（从chrome控制台获取response）复制粘贴到target.html中
 * 再使用node运行此文件
 * 后接上参数指定保存文件夹
 */

/**
 * 与naver.js和dbkpop.js不同之处在于:
 * dispatch.js有等待下载机制
 * dispatch下载的图片较多，同时并发下载会爆掉内存
 * 引入最大同时下载数量
 */

/**
 * TODO: 
 * 当前下载方式是分批次下载，第一批全部下载完成才下载第二批
 * 应当修改为下载队列
 */

const fs = require('fs')
const https = require('https')
const _filePath_ = process.argv[2]
const download_query_length = 50
let writingTxt = false

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
	 // https://ssl.pstatic.net/mimgnews/image/origin/433/2019/08/06/61281.jpg?type=n192_192_q70
    const imgREG = /https:\/\/[a-z]+\.pstatic\.net\/[^'"\s]+\.jpg/g
    fs.readFile(HTMLpath, (err, data) => {
      if (err) throw err
      const imgArr = Array.from(new Set(data.toString().match(imgREG)))
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
function batchDownloader(imgArr, startIndex){
  return new Promise(resolve => {
    Promise.all(promiseBuilder(imgArr, startIndex)).then(()=>{
      if(startIndex + download_query_length < imgArr.length)
        batchDownloader(imgArr, startIndex + download_query_length).then(() => resolve('ok'))
      else resolve('ok')
    })
  })
}
function promiseBuilder(imgArr, startIndex){
  const promiseArr = []
  imgArr.slice(startIndex,startIndex + download_query_length).forEach((src, i) => {
    promiseArr.push(
      new Promise(resolve => {
        https.get(src, (req, res) => {
          let imgData = ''
          req.setEncoding('binary')
          req.on('data', chunk => (imgData += chunk))
          req.on('end', () => {
            const filename = decodeURIComponent(src.split('/').pop())
            fs.writeFile(`${_filePath_}/${filename}`, imgData, 'binary', err => {
              if (err) throw err
              console.log(`第${i + startIndex}张图片下载成功,还剩${imgArr.length - i - startIndex}张`)
              resolve('ok')
            })
          })
        })
      })
    )
  })
  return promiseArr
}
function app() {
  mkdir().then(() => {
    getImgListFromHTML('./target.html').then(imgArr => {
      batchDownloader(imgArr,0).then(()=>{
        console.log("全部完成")
      })
    })
  })
}

app()
