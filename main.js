/*
All code in this file written by Caden O'Kellylee @Cesium72.
Don't steal my code!
*/
const http = require("http");
const fs = require("fs");
const crypto = require("crypto");

var surveys = [];
var accounts = [];
var ads = [];

var blockedIps = {'IP Address': 'Reason for blocking.'};

const HTMLHandle = val => val.split("&").join("&amp;").split("<").join("&lt;").split("@").join("&commat;").split('"').join("&qout;");

const parseIp = (req) => req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress

function serve(request,response) {
    var ip = parseIp(request);
    console.log(ip);
    
    if (ip in Object.keys(blockedIps)) {
        var content = fs.readFileSync("blocked.html");

        content.replace('@1', ip);
        content.replace('@2', blockedIps[ip]);

        response.end(content);
        return;
    }

    var info = request.url;
    console.log(`GET ${request.url}`);
    if(info != "/")
        info = info.slice(1)
    response.setHeader("Content-type","text/html");
    var infoSplit = info.split("/");
    infoSplit = infoSplit.map(decodeURIComponent);
    response.statusCode = 200;
    switch(infoSplit[0]) {
            case "": {
                //Display home page
                var content = fs.readFileSync("index.html");
                response.write(content);
                break;
            }
            case "bypass": {
                if (infoSplit[1]) {
                    console.log(`Attempting bypass:\n For ip ${ip}\nWith pass ${infoSplit[1]}`);
                }

                // Check password
                if (infoSplit[1] === "3.14") {
                    if (blockedIps[ip]) {
                        console.log(`Unblocking ${ip}...`);
                        delete blockedIps[ip];
                        console.log('Unblocked');
                    } else {
                        console.log('IP was never blocked.');
                    }
                } else {
                    console.log('Incorrect password.');
                }

                
                break;
            }
            case "list": {
                //Show selected surveys
                if(infoSplit[1] != "null") {
                response.setHeader("Content-type","text/plain");
                var j = 0;
                for(var i = surveys.length - 1; j < Math.min(250,surveys.length) && i >= 0; i--) {
                    if(!surveys[i].responders.includes(infoSplit[1])) {
                    response.write(`<div class="widget"id="${i}"><h1>${surveys[i].name}</h1><h2>${surveys[i].sub}</h2>${[null, undefined,"#"].includes(surveys[i].img) ?  "" : `<hr><img src="${decodeURIComponent(surveys[i].img)}"width="350"><hr>` }`)
                    for(var k = 0; k < surveys[i].answers.length; k++)
                        response.write(`<button onclick="send(${i},${k})">${surveys[i].answers[k]}</button><br/>`)
                    response.write(`Made by ${accounts[accounts.map(a => a.key).indexOf(surveys[i].creator)].name}</div>`);
                    j++;
                    }
                }

                if(j == 0) {
                    response.write("<h2>No More Surveys to Load</h2><br/><a href='create'>Make a Survey</a>");
                }
                }
                break;
            }
            case "create": {
                //Display create survey page
                var content = fs.readFileSync("create.html");
                response.write(content);
                break;
            }
            case "createAd": {
                var content = fs.readFileSync("createAd.html");
                response.write(content);
                break;
            }
            case "terms": {
                var content = fs.readFileSync("terms.html");
                response.write(content);
                break;
            }
            case "submit": {
                //Submit survey for creation
                if(accounts.map(a => a.key).includes(infoSplit[1])) {
                surveys.push({
                    creator:infoSplit[1],
                    name:HTMLHandle(infoSplit[2]),
                    sub:HTMLHandle(infoSplit[3]),
                    answers:[infoSplit[5],
                             infoSplit[6]
                            ],
                    responses:[0,0],
                    responders:[],
                    img:(infoSplit[4] == "#") ? "#" : encodeURIComponent(infoSplit[4])
                })
                for(var i = 7; i <= 12; i++) {
                    if(infoSplit[i]) {
                        surveys[surveys.length - 1].answers.push(infoSplit[i])
                        surveys[surveys.length - 1].responses.push(0)
                    } else 
                        break;
                }
                surveys[surveys.length - 1].answers = surveys[surveys.length - 1].answers.map(HTMLHandle);
                }
                break;
            }
            case "check_acc": {
                response.setHeader("Content-type","text/plain");
                //Check for username existence
                if(accounts.map(a => a.username).includes(infoSplit[1])) {
                    response.write("exist");
                } else {
                    response.write("not_exist");
                }
                break;
            }
            case "check_auth": {
                response.setHeader("Content-type","text/plain");
                try {
                if(accounts[accounts.map(a => a.username).indexOf(infoSplit[1])].password == infoSplit[2]) {
                    response.write(accounts[accounts.map(a => a.username).indexOf(infoSplit[1])].key);
                } else {
                    response.write("not_valid");
                }
                } catch {
                    response.write("not_valid");
                }
                break;
            }
            case "send": {
                //Send survey response
                try {
                    if(accounts.map(a => a.key).includes(infoSplit[3]) && !surveys[parseInt(infoSplit[1])].responders.includes(infoSplit[3])) {
                    surveys[parseInt(infoSplit[1])].responses[parseInt(infoSplit[2])]++;
                    surveys[parseInt(infoSplit[1])].responders.push(infoSplit[3])
                    }
                } catch {}
                break;
            }
            case "login": {
                //Display login page
                response.write(fs.readFileSync("login.html"));
                break;
            }
            case "newuser": {
                response.write(fs.readFileSync("newuser.html"));
                break;
            }
            case "name": {
                response.setHeader("Content-type","text/plain");
                try {
                    response.write(accounts[accounts.map(a => a.username).indexOf(infoSplit[1])].name)
                } catch {}
                break;
            }
            case "view": {
                //View responses
                response.setHeader("Content-type","text/plain");
                var cur = surveys[parseInt(infoSplit[1])];
                if(cur.responders.length > 0) {
                response.write(`<h1>${cur.name}</h1><h2>${cur.sub}</h2>${[null, undefined,"#"].includes(cur.img) ?  "" : `<hr><img src="${decodeURIComponent(cur.img)}"width="350"><hr>` }`);
                    for(var i = 0; i < cur.responses.length; i++)
                        response.write(`${cur.answers[i]} &bull; ${cur.responses[i]} responders &bull; ${Math.round(cur.responses[i]/cur.responders.length*100)}%<br/><div class="outer"><div class="inner"style="width:${cur.responses[i]/cur.responders.length*100}%;"></div></div><br/>`);
                }
                response.write(`Made by ${accounts[accounts.map(a => a.key).indexOf(cur.creator)].name}`);
                break;
            }
            case "join": {
                //Display account creation page
                var content = fs.readFileSync("join.html");
                response.write(content);
                break;
            }
            case "account": {
                //Create accont
                try {
                    let k;
                    do {
                        k = crypto.randomBytes(8).toString("hex")
                    } while(accounts.map(a => a.key.slice(8)).includes(k.slice(8)))
                    accounts.push(
                        {
                            "username":infoSplit[1],
                            "password":infoSplit[2],
                            "name":infoSplit[3],
                            "bio":infoSplit[4],
                            "img":infoSplit[5],
                            "key":k
                        }
                    );
                    response.write(k);
                } catch {}
                break;
            }
            case "index.js": {
                response.setHeader("Content-type","text/javascript");
                var content = fs.readFileSync("index.js");
                response.write(content);
                break;
            }
            case "menu.js": {
                response.setHeader("Content-type","text/javascript");
                var content = fs.readFileSync("menu.js");
                response.write(content);
                break;
            }
            case "favicon.ico": {
                response.setHeader("Content-type","image/png");
                var content = fs.readFileSync("favicon.png");
                response.write(content);
                break;
            }
            case "none.jpg": {
                response.setHeader("Content-type","image/jpeg");
                response.write(fs.readFileSync("None.jpg"));
                break;
            }
            case "history": {
                response.setHeader("Content-type","text/html");
                response.write(fs.readFileSync("history.html"));
                break;
            }
            case "_history": {
                response.setHeader("Content-type","text/plain");
                let acc = accounts[accounts.map(a => a.username).indexOf(infoSplit[1])];
                if(acc != null) {
                    acc = acc.key;
                }
                var flag = false;
                for(var cur of surveys.filter(a => a.creator == acc).reverse()) {
                    response.write(`<div class="widget"><h1>${cur.name}</h1><h2>${cur.sub}</h2>${[null, undefined,"#"].includes(cur.img) ?  "" : `<hr><img src="${decodeURIComponent(cur.img)}"width="350"><hr>`}`);
                    for(var i = 0; i < cur.responses.length; i++)
                        response.write(`${cur.answers[i]} &bull; ${cur.responses[i]} responders &bull; ${Math.round(cur.responses[i]/cur.responders.length*100)}%<br/><div class="outer"><div class="inner"style="width:${cur.responses[i]/cur.responders.length*100}%;"></div></div><br/>`);
                response.write(`Made by ${accounts[accounts.map(a => a.key).indexOf(cur.creator)].name}</div>`);
                    flag = true;
                }
                if(!flag) {
                    response.write(`<h2>${infoSplit[1]} hasn't posted any surveys yet</h2><br/><a href='create'>Make a Survey</a>`);
                }
                break;
            }
            case "styles.css": {
                response.setHeader("Content-type","text/css");
                response.write(fs.readFileSync("styles.css"));
                break;
            }
            case "profile": {
                response.write(fs.readFileSync("profile.html"));
                break;
            }
            case "_profile": {
                response.setHeader("Content-type","text/json")
                let cur = accounts.filter(a => a.username == infoSplit[1])[0]
                if(cur) {
                    response.write(JSON.stringify(
                {
                    "name":cur.name,
                    "bio":cur.bio,
                    "img":cur.img ? cur.img : "/none.jpg"
                }
                    ));
                } else
                response.write("");
                break;
            }
            case "login.css": {
                response.setHeader("Content-type","text/css");
                response.write(fs.readFileSync("login.css"));
                break;
            }
            case "code": {
                response.setHeader("Content-type","text/javascript");
                if(infoSplit[1] == "dev")
                    response.write(fs.readFileSync("main.js"));
                break;
            }
            case "submitAd": {
                if(infoSplit.length == 4) {
                    ads.push({"creator":infoSplit[1],"clickURL":infoSplit[2],"imgURL":infoSplit[3]});
                }
                break;
            }
            case "viewAd": {
                response.setHeader("Content-type","text/json");
                var rand = Math.floor(Math.random() * ads.length);
                response.write(encodeURIComponent(JSON.stringify(
                    {
                        "clickURL":ads[rand].clickURL,
                        "imgURL":ads[rand].imgURL
                    }
                )));
                break;
            }
            default: {
                var content = fs.readFileSync("404.html");
                response.write(content);
                response.statusCode = 404;
            }
    } 
    response.end();
}

var server = http.createServer(serve);
server.listen(3000);
console.log("SERVER LIVE!");

function cacheData() {
    console.log("Caching----------------------------------------------------------")
    var data = JSON.stringify(surveys);
    fs.writeFileSync("surveys.json",data,err => {if(err) {console.log("CacheErr: "+err)}})
    data = JSON.stringify(accounts);
    fs.writeFileSync("accounts.json",data,err => {if(err) {console.log("CacheErr: "+err)}})
    data = JSON.stringify(ads);
    fs.writeFileSync("ads.json",data,err => {if(err) {console.log("CacheErr: "+err)}})
    console.log("Caching Complete-------------------------------------------------")
}
surveys = JSON.parse(fs.readFileSync("surveys.json"));
accounts = JSON.parse(fs.readFileSync("accounts.json"));
ads = JSON.parse(fs.readFileSync("ads.json"));
setInterval(cacheData,30000);