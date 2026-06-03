let enemyHP = 10;
let playerHP = 5;
let time = 300;
let timer;
let current;
let history = [];
let usedQuestions = [];
let mode = "integral";
let score = 0;
let combo = 0;
let playStartTime = 0;

let playerProfile = {
  name:"名無し",
  icon:""
};

let settings = {
  bgm:true,
  se:true
};

let playerData = {
  totalCorrect:0,
  playTime:0,
  maxCombo:0,
  consecutiveDays:0,
  lastPlayDate:"",
  unlockedTitles:["初心者"],
  equippedTitle:"初心者",
  bestRandomScore:0
};

function rand(min,max){
  return Math.floor(Math.random()*(max-min+1))+min;
}

function gcd(a,b){
  while(b){
    let t = a % b;
    a = b;
    b = t;
  }
  return Math.abs(a);
}

function frac(num){
  let eps = 1e-10;

  for(let d=1; d<=1000; d++){
    let n = Math.round(num*d);

    if(Math.abs(num-n/d)<eps){
      let g = gcd(Math.abs(n),d);
      n/=g;
      d/=g;
      if(d===1) return `${n}`;
      return `${n}/${d}`;
    }
  }

  return String(num);
}

function coeff(num){
  let s = frac(num);
  if(s==="1") return "";
  if(s==="-1") return "-";
  return s;
}

function qPower(p){
  if(p===1) return "x";
  if(p===2) return "x²";
  if(p===3) return "x³";
  if(p===4) return "x⁴";
  if(p===5) return "x⁵";
  if(p===6) return "x⁶";
  return "x^"+p;
}

function xPower(p){
  if(p===1) return "x";
  return "x^"+p;
}

function term(c,p){
  if(c===0) return "";
  if(p===0) return frac(c);
  return coeff(c)+xPower(p);
}

function normalize(str){
  return String(str)
    .replace(/\s/g,"")
    .replace(/\*/g,"")
    .replace(/\+C/g,"")
    .replace(/C/g,"")
    .replace(/π/g,"pi")
    .replace(/²/g,"^2")
    .replace(/³/g,"^3")
    .replace(/⁴/g,"^4")
    .replace(/⁵/g,"^5")
    .replace(/⁶/g,"^6");
}

function titleHTML(t){
  if(t === "⚡️創設者"){
    return `<span class="founderTitle">⚡️創設者</span>`;
  }
  return `🏅 ${t}`;
}

function loadAllData(){
  let p = localStorage.getItem("playerProfile");
  if(p) playerProfile = JSON.parse(p);

  let d = localStorage.getItem("playerData");
  if(d) playerData = JSON.parse(d);

  let s = localStorage.getItem("settings");
  if(s) settings = JSON.parse(s);

  if(!playerData.unlockedTitles){
    playerData.unlockedTitles = ["初心者"];
  }

  if(!playerData.equippedTitle){
    playerData.equippedTitle = "初心者";
  }

  applySettings();
  updateCurrentTitle();
}

function saveAllData(){
  localStorage.setItem("playerProfile", JSON.stringify(playerProfile));
  localStorage.setItem("playerData", JSON.stringify(playerData));
  localStorage.setItem("settings", JSON.stringify(settings));
}

window.addEventListener("load", loadAllData);

function applySettings(){
  const bgm = document.getElementById("bgm");
  bgm.muted = !settings.bgm;
}

function toggleBGM(){
  settings.bgm = !settings.bgm;
  saveAllData();
  applySettings();
  showSettings();
}

function toggleSE(){
  settings.se = !settings.se;
  saveAllData();
  showSettings();
}

function refreshLoginStatus(){
  const el = document.getElementById("loginStatus");
  if(!el) return;

  if(window.currentUser){
    el.innerText = "ログイン中：" + window.currentUser.displayName;
  }else{
    el.innerText = "未ログイン";
  }
}

function updateCurrentTitle(){
  const el = document.getElementById("currentTitle");
  if(el){
    el.innerHTML = "称号：" + titleHTML(playerData.equippedTitle || "初心者");
  }
}

function unlockTitle(t){
  if(!playerData.unlockedTitles.includes(t)){
    playerData.unlockedTitles.push(t);
  }
}

function equipTitle(t){
  if(playerData.unlockedTitles.includes(t)){
    playerData.equippedTitle = t;
    saveAllData();
    updateCurrentTitle();
    showTitles();
  }
}

function checkTitles(){
  let correct = playerData.totalCorrect || 0;
  let play = playerData.playTime || 0;
  let maxCombo = playerData.maxCombo || 0;
  let best = playerData.bestRandomScore || 0;
  let days = playerData.consecutiveDays || 0;

  if(correct >= 5) unlockTitle("理系");
  if(correct >= 10) unlockTitle("数学初心者");
  if(correct >= 50) unlockTitle("数学中級者");
  if(correct >= 100) unlockTitle("数学上級者");
  if(correct >= 500) unlockTitle("数学の鬼👹");
  if(correct >= 1000) unlockTitle("数学の申し子🪽");
  if(correct >= 5000) unlockTitle("数学王👑");
  if(correct >= 10000) unlockTitle("伝説");
  if(correct >= 50000) unlockTitle("神話");
  if(correct >= 100000) unlockTitle("創世神🌌");

  if(play >= 15*60) unlockTitle("数学好き");
  if(play >= 30*60) unlockTitle("数学大好き");
  if(play >= 60*60) unlockTitle("数学者🎓");
  if(play >= 3*60*60) unlockTitle("努力家");
  if(play >= 5*60*60) unlockTitle("秀才");
  if(play >= 10*60*60) unlockTitle("鬼才");
  if(play >= 50*60*60) unlockTitle("天才");

  if(maxCombo >= 10) unlockTitle("10連勝");
  if(maxCombo >= 50) unlockTitle("50連勝");
  if(maxCombo >= 100) unlockTitle("不敗神話");

  if(best >= 20) unlockTitle("電光石火");
  if(best >= 50) unlockTitle("疾風迅雷");
  if(best >= 100) unlockTitle("数学の怪物");

  if(days >= 7) unlockTitle("毎日勉強");
  if(days >= 30) unlockTitle("継続は力なり");
  if(days >= 100) unlockTitle("数学狂");

  saveAllData();
}

function allTitles(){
  return [
    "⚡️創設者",
    "理系","数学初心者","数学中級者","数学上級者",
    "数学の鬼👹","数学の申し子🪽","数学王👑",
    "伝説","神話","創世神🌌",
    "数学好き","数学大好き","数学者🎓","努力家","秀才","鬼才","天才",
    "10連勝","50連勝","不敗神話",
    "電光石火","疾風迅雷","数学の怪物",
    "TOP10","TOP3","週間王👑",
    "毎日勉強","継続は力なり","数学狂"
  ];
}

function showTitles(){
  checkTitles();

  let box = document.getElementById("panelArea");
  let html = "<h2>🏅 称号一覧</h2>";

  for(let t of allTitles()){
    let unlocked = playerData.unlockedTitles.includes(t);

    html += `
      <div class="titleItem">
        ${unlocked ? titleHTML(t) : "❓？？？"}
        ${unlocked ? `<button onclick="equipTitle('${t}')">装備</button>` : ""}
      </div>
    `;
  }

  box.innerHTML = html;
}

function showStudyMenu(){
  document.getElementById("panelArea").innerHTML = `
    <h2>📚 学習モード</h2>
    <button class="modeBtn" onclick="selectMode('integral')">積分</button>
    <button class="modeBtn" onclick="selectMode('derivative')">微分</button>
    <button class="modeBtn" onclick="selectMode('factor')">因数分解</button>
    <button class="modeBtn" onclick="selectMode('prime')">素因数分解</button>
    <button class="modeBtn" onclick="selectMode('expand')">展開</button>
  `;
}

function showSettings(){
  document.getElementById("panelArea").innerHTML = `
    <h2>⚙️ 設定</h2>

    <div class="settingsItem">
      <button onclick="toggleBGM()">🎵 BGM ${settings.bgm ? "ON" : "OFF"}</button>
      <button onclick="toggleSE()">🔊 効果音 ${settings.se ? "ON" : "OFF"}</button>
    </div>

    <div class="settingsItem">
      <button onclick="loginGoogle()">Googleログイン</button>
      <button onclick="logoutGoogle()">ログアウト</button>
      <p id="loginStatus">確認中...</p>
    </div>
  `;

  refreshLoginStatus();
}

function showProfile(){
  let playMin = Math.floor((playerData.playTime || 0) / 60);

  document.getElementById("panelArea").innerHTML = `
    <h2>👤 プロフィール</h2>

    <div class="profileItem">
      <img id="profileIconEdit" src="${playerProfile.icon || ""}" class="rankIcon">
      <br>
      <input id="playerNameEdit" placeholder="名前" value="${playerProfile.name || "名無し"}">
      <br>
      <input type="file" id="iconInputEdit" accept="image/*">
      <br>
      <button onclick="saveProfileFromPanel()">保存</button>
    </div>

    <div class="profileItem">
      <p>現在の称号：${titleHTML(playerData.equippedTitle || "初心者")}</p>
      <p>累計正解数：${playerData.totalCorrect || 0}問</p>
      <p>プレイ時間：約${playMin}分</p>
      <p>最大連勝：${playerData.maxCombo || 0}</p>
      <p>ベストスコア：${playerData.bestRandomScore || 0}問</p>
      <p>連続プレイ：${playerData.consecutiveDays || 0}日</p>
    </div>
  `;
}

function saveProfileFromPanel(){
  let name = document.getElementById("playerNameEdit").value.trim();
  let file = document.getElementById("iconInputEdit").files[0];

  if(name) playerProfile.name = name;

  if(file){
    let reader = new FileReader();
    reader.onload = function(e){
      playerProfile.icon = e.target.result;
      saveAllData();
      showProfile();
      alert("プロフィールを保存したよ");
    };
    reader.readAsDataURL(file);
  }else{
    saveAllData();
    showProfile();
    alert("プロフィールを保存したよ");
  }
}

function recordPlayDay(){
  let today = new Date().toLocaleDateString("ja-JP", {
    timeZone:"Asia/Tokyo"
  });

  if(!playerData.lastPlayDate){
    playerData.lastPlayDate = today;
    playerData.consecutiveDays = 1;
    return;
  }

  if(playerData.lastPlayDate === today) return;

  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate()-1);

  let y = yesterday.toLocaleDateString("ja-JP", {
    timeZone:"Asia/Tokyo"
  });

  if(playerData.lastPlayDate === y){
    playerData.consecutiveDays++;
  }else{
    playerData.consecutiveDays = 1;
  }

  playerData.lastPlayDate = today;
}

function selectMode(m){
  mode = m;

  document.getElementById("homeScreen").classList.remove("active");
  document.getElementById("gameScreen").classList.add("active");

  let title = "⚔️ 積分バトル ⚔️";
  if(mode==="derivative") title="⚔️ 微分バトル ⚔️";
  if(mode==="factor") title="⚔️ 因数分解バトル ⚔️";
  if(mode==="prime") title="⚔️ 素因数分解バトル ⚔️";
  if(mode==="expand") title="⚔️ 展開バトル ⚔️";
  if(mode==="random") title="⚔️ ランキングモード ⚔️";

  document.getElementById("modeTitle").innerText = title;
  start();
}

function backHome(){
  clearInterval(timer);
  updatePlayTime();

  document.getElementById("gameScreen").classList.remove("active");
  document.getElementById("homeScreen").classList.add("active");

  document.getElementById("bgm").pause();

  checkTitles();
  updateCurrentTitle();
}
function start(){
  clearInterval(timer);

  history = [];
  usedQuestions = [];
  score = 0;
  combo = 0;
  playStartTime = Date.now();

  document.getElementById("result").innerHTML = "";
  document.getElementById("q").innerText = "START";

  recordPlayDay();

  if(mode==="random"){
    enemyHP = 9999;
    playerHP = 1;
    document.getElementById("timer").innerText = "";
  }else{
    enemyHP = 10;
    playerHP = 5;
    document.getElementById("timer").innerText = "";
  }

  updateHP();
  nextQ();

  let bgm = document.getElementById("bgm");
  bgm.volume = 0.2;

  if(settings.bgm){
    bgm.play();
  }
}

function updatePlayTime(){
  if(playStartTime){
    let sec = Math.floor((Date.now() - playStartTime)/1000);
    playerData.playTime += sec;
    playStartTime = 0;
    saveAllData();
  }
}

function generateQuestion(){
  if(mode==="integral") return generateIntegral();
  if(mode==="derivative") return generateDerivative();
  if(mode==="factor") return generateFactor();
  if(mode==="prime") return generatePrime();
  if(mode==="expand") return generateExpand();

  if(mode==="random"){
    let r = rand(1,5);
    if(r===1) return generateIntegral();
    if(r===2) return generateDerivative();
    if(r===3) return generateFactor();
    if(r===4) return generatePrime();
    if(r===5) return generateExpand();
  }
}

function generateIntegral(){
  let type = rand(1,8);

  if(type===1){
    let a = rand(-6,6);
    if(a===0) a = 1;

    let n = rand(1,5);
    let ans = a/(n+1);

    return{
      q:`∫ ${coeff(a)}${qPower(n)} dx`,
      a:`${ans}*x^${n+1}`,
      display:`${term(ans,n+1)}+C`
    };
  }

  if(type===2){
    let a = rand(-5,5);
    let b = rand(-5,5);
    let c = rand(-5,5);

    if(a===0 && b===0 && c===0) a = 1;

    let display =
      `${term(a/3,3)}+${term(b/2,2)}+${term(c,1)}+C`
      .replace(/\+\-/g,"-")
      .replace(/\+\+/g,"+")
      .replace(/^\+/,"");

    return{
      q:`∫ (${coeff(a)}x²${b>=0?"+":""}${coeff(b)}x${c>=0?"+":""}${c}) dx`,
      a:`${a/3}*x^3+${b/2}*x^2+${c}*x`,
      display:display
    };
  }

  if(type===3){
    let l = rand(0,3);
    let r = rand(l+1,l+5);
    let a = rand(1,5);
    let n = rand(1,4);

    let ans =
      (a/(n+1)) *
      (Math.pow(r,n+1)-Math.pow(l,n+1));

    return{
      q:`∫[${l}→${r}] ${coeff(a)}${qPower(n)} dx`,
      a:`${ans}`,
      display:frac(ans)
    };
  }

  if(type===4){
    let l = rand(0,2);
    let r = rand(l+1,l+4);

    let a = rand(-4,4);
    let b = rand(-4,4);
    let c = rand(-4,4);

    if(a===0 && b===0 && c===0) a = 1;

    let ans =
      (a/3)*(Math.pow(r,3)-Math.pow(l,3))+
      (b/2)*(Math.pow(r,2)-Math.pow(l,2))+
      c*(r-l);

    return{
      q:`∫[${l}→${r}] (${coeff(a)}x²${b>=0?"+":""}${coeff(b)}x${c>=0?"+":""}${c}) dx`,
      a:`${ans}`,
      display:frac(ans)
    };
  }

  if(type===5){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`∫ ${coeff(a)}sin(${k===1?"x":k+"x"}) dx`,
      a:`-${a}*cos(${k}*x)/${k}`,
      display:`-${frac(a/k)}cos(${k===1?"x":k+"x"})+C`
    };
  }

  if(type===6){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`∫ ${coeff(a)}cos(${k===1?"x":k+"x"}) dx`,
      a:`${a}*sin(${k}*x)/${k}`,
      display:`${frac(a/k)}sin(${k===1?"x":k+"x"})+C`
    };
  }

  if(type===7){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`∫ ${coeff(a)}e^(${k===1?"x":k+"x"}) dx`,
      a:`${a}*exp(${k}*x)/${k}`,
      display:`${frac(a/k)}e^(${k===1?"x":k+"x"})+C`
    };
  }

  if(type===8){
    let a = rand(1,5);
    let b = rand(-5,5);
    let n = rand(2,4);
    let bottom = a*(n+1);

    return{
      q:`∫ (${a}x${b>=0?"+":""}${b})${n===2?"²":n===3?"³":"⁴"} dx`,
      a:`(${a}*x+${b})^${n+1}/${bottom}`,
      display:`(${a}x${b>=0?"+":""}${b})^${n+1}/${bottom}+C`
    };
  }
}

function generateDerivative(){
  let type = rand(1,12);

  if(type===1){
    let a = rand(-6,6);
    if(a===0) a = 1;

    let n = rand(2,7);
    let ansC = a*n;

    return{
      q:`d/dx ${coeff(a)}${qPower(n)}`,
      a:`${ansC}*x^${n-1}`,
      display:`${term(ansC,n-1)}`
    };
  }

  if(type===2){
    let a = rand(-5,5);
    let b = rand(-5,5);
    let c = rand(-5,5);

    if(a===0 && b===0) a = 1;

    let display =
      `${term(3*a,2)}+${term(2*b,1)}+${c}`
      .replace(/\+\-/g,"-")
      .replace(/\+\+/g,"+")
      .replace(/^\+/,"");

    return{
      q:`d/dx (${coeff(a)}x³${b>=0?"+":""}${coeff(b)}x²${c>=0?"+":""}${c}x)`,
      a:`${3*a}*x^2+${2*b}*x+${c}`,
      display:display
    };
  }

  if(type===3){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`d/dx ${coeff(a)}sin(${k===1?"x":k+"x"})`,
      a:`${a*k}*cos(${k}*x)`,
      display:`${coeff(a*k)}cos(${k===1?"x":k+"x"})`
    };
  }

  if(type===4){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`d/dx ${coeff(a)}cos(${k===1?"x":k+"x"})`,
      a:`-${a*k}*sin(${k}*x)`,
      display:`-${coeff(a*k)}sin(${k===1?"x":k+"x"})`
    };
  }

  if(type===5){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`d/dx ${coeff(a)}e^(${k===1?"x":k+"x"})`,
      a:`${a*k}*exp(${k}*x)`,
      display:`${coeff(a*k)}e^(${k===1?"x":k+"x"})`
    };
  }

  if(type===6){
    let a = rand(2,5);
    let b = rand(-5,5);
    let n = rand(2,4);

    return{
      q:`d/dx (${a}x${b>=0?"+":""}${b})${n===2?"²":n===3?"³":"⁴"}`,
      a:`${n*a}*(${a}*x+${b})^${n-1}`,
      display:`${n*a}(${a}x${b>=0?"+":""}${b})^${n-1}`
    };
  }

  if(type===7){
    return{
      q:`d/dx (x+1)(x-1)`,
      a:`2*x`,
      display:`2x`
    };
  }

  if(type===8){
    let a = rand(1,5);
    let b = rand(1,5);

    return{
      q:`d/dx (x+${a})(x+${b})`,
      a:`2*x+${a+b}`,
      display:`2x+${a+b}`
    };
  }

  if(type===9){
    return{
      q:`d/dx √x`,
      a:`1/(2*sqrt(x))`,
      display:`1/(2√x)`
    };
  }

  if(type===10){
    return{
      q:`d/dx 1/x`,
      a:`-1/x^2`,
      display:`-1/x^2`
    };
  }

  if(type===11){
    let a = rand(1,5);

    return{
      q:`d/dx (${a}x²+1)/2`,
      a:`${a}*x`,
      display:`${coeff(a)}x`
    };
  }

  if(type===12){
    let a = rand(1,5);

    return{
      q:`d/dx ${a}x^(3/2)`,
      a:`${a*3/2}*sqrt(x)`,
      display:`${frac(a*3/2)}√x`
    };
  }
}

function generateFactor(){
  let type = rand(1,4);

  if(type===1){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`x²+${a+b}x+${a*b} を因数分解`,
      a:`(x+${a})*(x+${b})`,
      display:`(x+${a})(x+${b})`
    };
  }

  if(type===2){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`x²-${a+b}x+${a*b} を因数分解`,
      a:`(x-${a})*(x-${b})`,
      display:`(x-${a})(x-${b})`
    };
  }

  if(type===3){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`x²+${b-a}x-${a*b} を因数分解`,
      a:`(x-${a})*(x+${b})`,
      display:`(x-${a})(x+${b})`
    };
  }

  if(type===4){
    let a = rand(2,9);

    return{
      q:`x²-${a*a} を因数分解`,
      a:`(x-${a})*(x+${a})`,
      display:`(x-${a})(x+${a})`
    };
  }
}

function isPrime(n){
  if(n<2) return false;

  for(let i=2;i*i<=n;i++){
    if(n%i===0) return false;
  }

  return true;
}

function primeFactors(n){
  let arr = [];
  let d = 2;

  while(n>1){
    while(n%d===0){
      arr.push(d);
      n = n/d;
    }
    d++;
  }

  return arr;
}

function generatePrime(){
  let primes = [2,3,5,7,11,13];
  let count = rand(2,5);
  let num = 1;

  for(let i=0;i<count;i++){
    num *= primes[rand(0,primes.length-1)];
  }

  let factors = primeFactors(num);

  return{
    q:`${num} を素因数分解`,
    a:factors.join("*"),
    display:factors.join("×"),
    number:num
  };
}

function checkPrimeAnswer(input,number){
  try{
    let s = input
      .replace(/\s/g,"")
      .replace(/×/g,"*")
      .replace(/·/g,"*");

    if(s==="") return false;

    let parts = s.split("*");
    let nums = [];

    for(let part of parts){
      if(part.includes("^")){
        let tmp = part.split("^");
        let base = Number(tmp[0]);
        let power = Number(tmp[1]);

        if(!Number.isInteger(base)) return false;
        if(!Number.isInteger(power)) return false;
        if(!isPrime(base)) return false;
        if(power<1) return false;

        for(let i=0;i<power;i++){
          nums.push(base);
        }
      }else{
        let n = Number(part);

        if(!Number.isInteger(n)) return false;
        if(!isPrime(n)) return false;

        nums.push(n);
      }
    }

    let product = nums.reduce((a,b)=>a*b,1);

    return product===number;
  }catch(e){
    return false;
  }
}

function generateExpand(){
  let type = rand(1,4);

  if(type===1){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`(x+${a})(x+${b}) を展開`,
      a:`x^2+${a+b}*x+${a*b}`,
      display:`x^2+${a+b}x+${a*b}`
    };
  }

  if(type===2){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`(x-${a})(x-${b}) を展開`,
      a:`x^2-${a+b}*x+${a*b}`,
      display:`x^2-${a+b}x+${a*b}`
    };
  }

  if(type===3){
    let a = rand(1,8);

    return{
      q:`(x+${a})² を展開`,
      a:`x^2+${2*a}*x+${a*a}`,
      display:`x^2+${2*a}x+${a*a}`
    };
  }

  if(type===4){
    let a = rand(1,8);

    return{
      q:`(x-${a})² を展開`,
      a:`x^2-${2*a}*x+${a*a}`,
      display:`x^2-${2*a}x+${a*a}`
    };
  }
}

function expressionsEqual(user,correct){
  try{
    let u = normalize(user);
    let c = normalize(correct);

    let values = [-3,-2,-1,1,2,3,4];

    for(let x of values){
      let uv = math.evaluate(u,{x:x});
      let cv = math.evaluate(c,{x:x});

      if(Math.abs(uv-cv)>1e-8){
        return false;
      }
    }

    return true;
  }catch(e){
    return false;
  }
}

function nextQ(){
  let count = 0;

  do{
    current = generateQuestion();
    count++;
  }while(
    usedQuestions.includes(current.q) &&
    count<100
  );

  usedQuestions.push(current.q);

  let q = document.getElementById("q");
  let go = document.getElementById("goText");
  let enemy = document.getElementById("enemy");

  q.innerText = "";
  document.getElementById("ans").value = "";

  enemy.classList.remove("enemySpawn");
  go.classList.remove("goAnim");
  q.classList.remove("questionAnim");

  void enemy.offsetWidth;
  void go.offsetWidth;
  void q.offsetWidth;

  enemy.classList.add("enemySpawn");

  setTimeout(()=>{
    go.classList.add("goAnim");

    setTimeout(()=>{
      q.innerText = current.q;
      q.classList.add("questionAnim");
    },300);

  },400);
}

function submit(){
  if(!current) return;

  let u = document.getElementById("ans").value;

  if(u.trim()===""){
    document.getElementById("result").innerText = "答えを入力して！";
    return;
  }

  if(u === "adminadminadmin9671" && mode === "integral"){
    unlockTitle("⚡️創設者");
    playerData.equippedTitle = "⚡️創設者";
    saveAllData();
    updateCurrentTitle();
    alert("⚡️創設者を解放しました！");
    return;
  }

  let ok = false;

  if(mode==="prime" && !ok){
    ok = checkPrimeAnswer(u,current.number);
  }

  if(!ok){
    ok = expressionsEqual(u,current.a);
  }

  if(!ok){
    ok = normalize(u) === normalize(current.display);
  }

  history.push({
    question:current.q,
    your:u,
    answer:current.display,
    ok:ok
  });

  if(ok){
    score++;
    combo++;

    playerData.totalCorrect++;

    if(combo > playerData.maxCombo){
      playerData.maxCombo = combo;
    }

    if(mode!=="random"){
      enemyHP--;
    }

    let enemy = document.getElementById("enemy");
    let slash = document.getElementById("slash");

    enemy.classList.add("enemyHit");
    slash.innerText = "⚔️";
    slash.classList.add("showSlash");

    setTimeout(()=>{
      enemy.classList.remove("enemyHit");
      slash.classList.remove("showSlash");
    },500);

    if(settings.se){
      document.getElementById("se_correct").play();
    }

    document.getElementById("result").innerText =
      "○ 正解！ 正解: " + current.display;

  }else{
    combo = 0;

    if(mode==="random"){
      finishRandom();
      return;
    }

    playerHP--;

    document.body.classList.add("playerHit");

    setTimeout(()=>{
      document.body.classList.remove("playerHit");
    },400);

    if(settings.se){
      document.getElementById("se_wrong").play();
    }

    document.getElementById("result").innerText =
      "× 不正解！ 正解: " + current.display;
  }

  checkTitles();
  saveAllData();
  updateHP();
  nextTurn();
}

async function finishRandom(){
  clearInterval(timer);
  updatePlayTime();

  if(score > playerData.bestRandomScore){
    playerData.bestRandomScore = score;
  }

  checkTitles();
  saveAllData();

  document.getElementById("result").innerText = "記録送信中...";

  try{
    await saveWorldScore({
      name:playerProfile.name || "名無し",
      icon:playerProfile.icon || "",
      score:score,
      title:playerData.equippedTitle || "初心者",
      mode:"random"
    });
  }catch(e){
    console.log(e);
  }

  showEnd("終了！");
}

function updateHP(){
  document.getElementById("ehp").innerText = enemyHP;
  document.getElementById("php").innerText = playerHP;

  if(mode==="random"){
    document.getElementById("enemy").style.display = "none";
    document.getElementById("enemyFrame").style.display = "none";
    document.getElementById("playerBar").style.width = "100%";
  }else{
    document.getElementById("enemy").style.display = "block";
    document.getElementById("enemyFrame").style.display = "block";

    document.getElementById("enemyBar").style.width =
      (enemyHP/10*100)+"%";

    document.getElementById("playerBar").style.width =
      (playerHP/5*100)+"%";
  }
}

function nextTurn(){
  clearInterval(timer);

  if(mode!=="random"){
    if(enemyHP<=0){
      showEnd("勝利！");
      return;
    }

    if(playerHP<=0){
      showEnd("敗北...");
      return;
    }
  }

  setTimeout(()=>{
    nextQ();
  },900);
}

async function showEnd(text){
  clearInterval(timer);
  updatePlayTime();

  document.getElementById("q").innerText = text;
  document.getElementById("timer").innerText = "";
  document.getElementById("ans").value = "";

  let html = `<button onclick="start()">もう一回</button>`;
  html += `<button onclick="backHome()">ホームへ</button>`;

  if(mode==="random"){
    html += `<h2>スコア：${score}問</h2>`;
    html += `<h2>週間世界ランキング</h2>`;

    try{
      let ranking = await loadWorldRanking();

      if(ranking.length===0){
        html += `<p>まだ記録がありません</p>`;
      }

      for(let i=0;i<ranking.length;i++){
        html += `
          <div class="rankItem">
            ${i+1}位
            ${
              ranking[i].icon
              ? `<img class="rankIcon" src="${ranking[i].icon}">`
              : ""
            }
            ${ranking[i].name}
            <br>
            ${titleHTML(ranking[i].title || "初心者")}
            ：${ranking[i].score}問
          </div>
        `;
      }
    }catch(e){
      html += `<p>ランキング取得に失敗</p>`;
    }
  }

  html += `<h2>解いた問題一覧</h2>`;

  for(let i=0;i<history.length;i++){
    let mark = history[i].ok ? "○" : "×";

    html += `
      <div class="rankItem">
        <p>${i+1}. ${mark} 問題: ${history[i].question}</p>
        <p>あなたの答え: ${history[i].your}</p>
        <p>正解: ${history[i].answer}</p>
      </div>
    `;
  }

  document.getElementById("result").innerHTML = html;
}

async function showWorldRanking(){
  let box = document.getElementById("panelArea");
  box.innerHTML = "<h2>読み込み中...</h2>";

  try{
    let ranking = await loadWorldRanking();

    let html = "<h2>🌍 週間世界ランキング</h2>";

    if(ranking.length===0){
      html += "<p>まだ記録がありません</p>";
    }

    for(let i=0;i<ranking.length;i++){
      html += `
        <div class="rankItem">
          ${i+1}位
          ${
            ranking[i].icon
            ? `<img class="rankIcon" src="${ranking[i].icon}">`
            : ""
          }
          ${ranking[i].name}
          <br>
          ${titleHTML(ranking[i].title || "初心者")}
          ：${ranking[i].score}問
        </div>
      `;
    }

    box.innerHTML = html;
  }catch(e){
    box.innerHTML = "<p>ランキングを読み込めませんでした</p>";
  }
}