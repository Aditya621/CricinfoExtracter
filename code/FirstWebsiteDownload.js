// npm install axios
// node FirstWebsiteDownload.js --dest="download.html" --url="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results"

let minimist = require("minimist");
let fs = require("fs");
let axios = require("axios");

let args = minimist(process.argv);

// console.log(args.dest);
// console.log(args.url);
let DownloadKahPromise = axios.get(args.url);
DownloadKahPromise.then(function (response) {
  let html = response.data;
  //   console.log(html);
  fs.writeFileSync(args.dest, html, "utf-8");
}).catch(function (err) {
  console.log(err);
});
