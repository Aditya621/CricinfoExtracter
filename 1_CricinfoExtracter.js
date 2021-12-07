// the purpose of this project is to extract information of worldcup 2019 from cricinfo and present
// that in the form of excel and pdf scorecards
// the real purpose is to learn how to extract information and get experience with js
// A very good reason to ever make a project is to have good fun

// npm init -y
// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib

// node 1_CricinfoExtracter.js --excel=Worldcup.csv --dataFolder=data --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results

let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let pdf = require("pdf-lib");
let fs = require("fs");
let path = require("path");

let args = minimist(process.argv);
// console.log(args.dataFolder);
// console.log(args.source);
// console.log(args.excel);

// read using jsdom
//make excel using excel4node
//make pdf using pdf-lib
// download using axios
let responseKaPromise = axios.get(args.source);
responseKaPromise.then(function (response) {
  let html = response.data;
  // console.log(html);
  let dom = new jsdom.JSDOM(html);
  let document = dom.window.document;
  let title = document.title;
  // console.log(title);

  matches = [];
  let matchScoreDivs = document.querySelectorAll("div.match-score-block");
  // console.log(matchScoreDivs.length);
  for (let i = 0; i < matchScoreDivs.length; i++) {
    let matchDiv = matchScoreDivs[i];
    let match = {
      t1: "",
      t2: "",
      t1s: "",
      t2s: "",
      result: " ",
    };
    let teamName = matchDiv.querySelectorAll("div.name-detail > p.name");
    //   console.log(               nameps[0].textContent);
    //   console.log(nameps[1].textContent);
    match.t1 = teamName[0].textContent;
    match.t2 = teamName[1].textContent;

    let scoreSpan = matchDiv.querySelectorAll("div.score-detail > span.score");

    if (scoreSpan.length == 2) {
      match.t1s = scoreSpan[0].textContent;
      match.t2s = scoreSpan[1].textContent;
    } else if (scoreSpan.length == 1) {
      match.t1s = scoreSpan[0].textContent;
      match.t2s = "";
    } else {
      match.t1s = "";
      match.t2s = "";
    }
    //   match.t1s = ScoreSpan[0].textContent;
    //   match.t2s = ScoreSpan[1].textContent;

    let spanResult = matchDiv.querySelector(" div.status-text >span");
    match.result = spanResult.textContent;
    matches.push(match);
    // console.log(i);
  }
  // console.log(matches);
  let matchesJSON = JSON.stringify(matches);
  fs.writeFileSync("matches.json", matchesJSON, "utf-8");

  let teams = [];
  for (let i = 0; i < matches.length; i++) {
    putTeamArrayIfMissing(teams, matches[i]);
  }

  for (let i = 0; i < matches.length; i++) {
    putMatchesInAppropriateTeam(teams, matches[i]);
  }

  // console.log(JSON.stringify(teams));
  let teamJSON = JSON.stringify(teams);
  fs.writeFileSync("team.json", teamJSON, "utf-8");

  //create excel file

  createExcelFile(teams);
  createFolders(teams);
});

function createFolders(teams) {
  fs.mkdirSync(args.dataFolder);
  for (let i = 0; i < teams.length; i++) {
    let teamFN = path.join(args.dataFolder, teams[i].name);
    fs.mkdirSync(teamFN);

    for (let j = 0; j < teams[i].matches.length; j++) {
      let matchFileName = path.join(teamFN, teams[i].matches[j].vs + ".pdf");
      createScoreCard(teams[i].name, teams[i].matches[j], matchFileName);
    }
  }
}

function createScoreCard(teamName, match, matchFileName) {
  let t1 = teamName;
  let t2 = match.vs;
  let t1s = match.selfScore;
  let t2s = match.oppScore;
  let result = match.result;

  let bytesOfPDFTemplate = fs.readFileSync("Template.pdf");
  let pdfdocKaPromise = pdf.PDFDocument.load(bytesOfPDFTemplate);
  pdfdocKaPromise.then(function (pdfdoc) {
    let page = pdfdoc.getPage(0);

    page.drawText(t1, {
      x: 320,
      y: 720,
      size: 8,
    });
    page.drawText(t2, {
      x: 320,
      y: 690,
      size: 8,
    });
    page.drawText(t1s, {
      x: 320,
      y: 660,
      size: 8,
    });
    page.drawText(t2s, {
      x: 320,
      y: 630,
      size: 8,
    });
    page.drawText(result, {
      x: 320,
      y: 600,
      size: 8,
    });

    let finalPDFBytesKaPromise = pdfdoc.save();
    finalPDFBytesKaPromise.then(function (finalPDFBytes) {
      fs.writeFileSync(matchFileName, finalPDFBytes);
    });
  });
}

function createExcelFile(teams) {
  let wb = new excel.Workbook();

  for (let i = 0; i < teams.length; i++) {
    let sheet = wb.addWorksheet(teams[i].name);

    sheet.cell(1, 1).string("VS");
    sheet.cell(1, 2).string("Self Score");
    sheet.cell(1, 3).string("Opp Score");
    sheet.cell(1, 4).string("Result");
    for (let j = 0; j < teams[i].matches.length; j++) {
      sheet.cell(2 + j, 1).string(teams[i].matches[j].vs);
      sheet.cell(2 + j, 2).string(teams[i].matches[j].selfScore);
      sheet.cell(2 + j, 3).string(teams[i].matches[j].oppScore);
      sheet.cell(2 + j, 4).string(teams[i].matches[j].result);
    }
  }

  wb.write(args.excel);
}

function putTeamArrayIfMissing(teams, match) {
  let t1idx = -1;
  for (let i = 0; i < teams.length; i++) {
    if (teams[i].name == match.t1) {
      t1idx = i;
      break;
    }
  }
  if (t1idx == -1) {
    teams.push({
      name: match.t1,
      matches: [],
    });
  }

  let t2idx = -1;
  for (let i = 0; i < teams.length; i++) {
    if (teams[i].name == match.t2) {
      t2idx = i;
      break;
    }
  }
  if (t2idx == -1) {
    teams.push({
      name: match.t2,
      matches: [],
    });
  }
}

function putMatchesInAppropriateTeam(teams, match) {
  let t1idx = -1;
  for (let i = 0; i < teams.length; i++) {
    if (teams[i].name == match.t1) {
      t1idx = i;
      break;
    }
  }

  let team1 = teams[t1idx];
  team1.matches.push({
    vs: match.t2,
    selfScore: match.t1s,
    oppScore: match.t2s,
    result: match.result,
  });

  let t2idx = -1;
  for (let i = 0; i < teams.length; i++) {
    if (teams[i].name == match.t2) {
      t2idx = i;
      break;
    }
  }

  let team2 = teams[t2idx];
  team2.matches.push({
    vs: match.t1,
    selfScore: match.t2s,
    oppScore: match.t1s,
    result: match.result,
  });
}
