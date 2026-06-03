let enemyHP = 10;
let playerHP = 5;
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
  totalQuestions:0,
  exp:0,
  playTime:0,
  maxCombo:0,
  consecutiveDays:0,
  lastPlayDate:"",
  unlockedTitles:["初心者"],
  equippedTitle:"初心者",
  bestRandomScore:0,
  reviewList:[],
  dailyMission:{},
  achievements:[],
  friends:[]
};

function rand(min,max){
  return Math.floor(Math.random()*(max-min+1))+min;
}

function gcd(a,b){
  while(b){
    let t=a%b;
    a=b;
    b=t;
  }
  return Math.abs(a);
}

function frac(num){
  for(let d=1; d<=1000; d++){
    let n=Math.round(num*d);
    if(Math.abs(num-n/d)<1e-10){
      let g=gcd(Math.abs(n),d);
      n/=g;
      d/=g;
      if(d===1) return `${n}`;
      return `${n}/${d}`;
    }
  }
  return String(num);
}

function coeff(num){
  let s=frac(num);
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

function getLevel(){
  return Math.floor((playerData.exp || 0) / 100) + 1;
}

function getExpPercent(){
  return (playerData.exp || 0) % 100;
}

function getCorrectRate(){
  if(!playerData.totalQuestions) return 0;
  return Math.round(playerData.totalCorrect / playerData.totalQuestions * 100);
}

function showLevelUp(level){
  let area=document.getElementById("levelUpArea");

  area.innerHTML=`
    <div class="levelUp">
      LEVEL UP!!<br>
      Lv${level}
    </div>
  `;

  setTimeout(()=>{
    area.innerHTML="";
  },1500);
}

function addExp(n){
  let before=getLevel();

  playerData.exp=(playerData.exp||0)+n;

  let after=getLevel();

  if(after>before){
    showLevelUp(after);
  }
}

function titleHTML(t){
  if(t==="⚡️創設者"){
    return `<span class="founderTitle">⚡️創設者</span>`;
  }

  if(t==="MENERU"){
    return `<span class="meneruTitle">👾MENERU👾</span>`;
  }

  return `🏅 ${t}`;
}

function loadAllData(){
  let p=localStorage.getItem("playerProfile");
  if(p) playerProfile=JSON.parse(p);

  let d=localStorage.getItem("playerData");
  if(d) playerData=JSON.parse(d);

  let s=localStorage.getItem("settings");
  if(s) settings=JSON.parse(s);

  if(!playerData.unlockedTitles) playerData.unlockedTitles=["初心者"];
  if(!playerData.equippedTitle) playerData.equippedTitle="初心者";
  if(!playerData.reviewList) playerData.reviewList=[];
  if(!playerData.dailyMission) playerData.dailyMission={};
  if(!playerData.achievements) playerData.achievements=[];
  if(!playerData.friends) playerData.friends=[];
  if(!playerData.exp) playerData.exp=0;

  applySettings();
  updateHomeStatus();
  prepareDailyMission();
}

function saveAllData(){
  localStorage.setItem("playerProfile",JSON.stringify(playerProfile));
  localStorage.setItem("playerData",JSON.stringify(playerData));
  localStorage.setItem("settings",JSON.stringify(settings));
}

window.addEventListener("load",loadAllData);

function updateHomeStatus(){
  let title=document.getElementById("currentTitle");
  let level=document.getElementById("levelInfo");
  let rate=document.getElementById("rateInfo");
  let icon=document.getElementById("profileIcon");

  if(title){
    title.innerHTML="称号："+titleHTML(playerData.equippedTitle || "初心者");
  }

  if(level){
    level.innerHTML=`Lv${getLevel()}　EXP ${getExpPercent()}/100`;
  }

  if(rate){
    rate.innerHTML=`正答率：${getCorrectRate()}%`;
  }

  if(icon && playerProfile.icon){
    icon.src=playerProfile.icon;
  }
}

function applySettings(){
  let bgm=document.getElementById("bgm");
  if(bgm){
    bgm.muted=!settings.bgm;
  }
}

function toggleBGM(){
  settings.bgm=!settings.bgm;
  saveAllData();
  applySettings();
  showSettings();
}

function toggleSE(){
  settings.se=!settings.se;
  saveAllData();
  showSettings();
}

function refreshLoginStatus(){
  let el=document.getElementById("loginStatus");
  if(!el) return;

  if(window.currentUser){
    el.innerText="ログイン中："+window.currentUser.displayName;
  }else{
    el.innerText="未ログイン";
  }
}

function unlockTitle(t){
  if(!playerData.unlockedTitles.includes(t)){
    playerData.unlockedTitles.push(t);
  }
}

function equipTitle(t){
  if(playerData.unlockedTitles.includes(t)){
    playerData.equippedTitle=t;
    saveAllData();
    updateHomeStatus();
    showTitles();
  }
}

function unlockAchievement(a){
  if(!playerData.achievements.includes(a)){
    playerData.achievements.push(a);
  }
}

function achievementList(){
  return [
    "初正解","10問正解","100問正解","1000問正解",
    "初ランキング登録","週間ランキング参加",
    "初ログイン","プロフィール設定完了",

    "3連勝","5連勝","10連勝","25連勝","50連勝","100連勝","無双",

    "積分マスター","微分マスター","因数分解マスター",
    "素因数分解マスター","展開マスター",

    "TOP100","TOP50","TOP10","TOP3","週間王👑",

    "15分プレイ","1時間プレイ","10時間プレイ",
    "50時間プレイ","100時間プレイ","数学廃人",

    "3日連続","7日連続","30日連続","100日連続","毎日数学生活",

    "初復習","復習10問","復習50問","復習100問","反省王",

    "創設者","MENERU発見者","古参勢","神速","完璧主義者",
    "数学神","伝説の数学神",

    "1問目で即死","惜しい！","深夜の数学者","朝活勢","寝るな！"
  ];
}

function checkAchievements(){
  if(playerData.totalCorrect>=1) unlockAchievement("初正解");
  if(playerData.totalCorrect>=10) unlockAchievement("10問正解");
  if(playerData.totalCorrect>=100) unlockAchievement("100問正解");
  if(playerData.totalCorrect>=1000) unlockAchievement("1000問正解");

  if(playerData.bestRandomScore>=1){
    unlockAchievement("初ランキング登録");
    unlockAchievement("週間ランキング参加");
  }

  if(window.currentUser){
    unlockAchievement("初ログイン");
  }

  if(playerProfile.name!=="名無し" || playerProfile.icon){
    unlockAchievement("プロフィール設定完了");
  }

  if(playerData.maxCombo>=3) unlockAchievement("3連勝");
  if(playerData.maxCombo>=5) unlockAchievement("5連勝");
  if(playerData.maxCombo>=10) unlockAchievement("10連勝");
  if(playerData.maxCombo>=25) unlockAchievement("25連勝");
  if(playerData.maxCombo>=50) unlockAchievement("50連勝");
  if(playerData.maxCombo>=100) unlockAchievement("100連勝");
  if(playerData.maxCombo>=200) unlockAchievement("無双");

  if(playerData.playTime>=15*60) unlockAchievement("15分プレイ");
  if(playerData.playTime>=60*60) unlockAchievement("1時間プレイ");
  if(playerData.playTime>=10*60*60) unlockAchievement("10時間プレイ");
  if(playerData.playTime>=50*60*60) unlockAchievement("50時間プレイ");
  if(playerData.playTime>=100*60*60) unlockAchievement("100時間プレイ");
  if(playerData.playTime>=500*60*60) unlockAchievement("数学廃人");

  if(playerData.consecutiveDays>=3) unlockAchievement("3日連続");
  if(playerData.consecutiveDays>=7) unlockAchievement("7日連続");
  if(playerData.consecutiveDays>=30) unlockAchievement("30日連続");
  if(playerData.consecutiveDays>=100) unlockAchievement("100日連続");
  if(playerData.consecutiveDays>=365) unlockAchievement("毎日数学生活");

  if((playerData.reviewList||[]).length>=1){
    unlockAchievement("初復習");
  }

  if((playerData.reviewList||[]).length>=10){
    unlockAchievement("復習10問");
  }

  if(playerData.equippedTitle==="⚡️創設者"){
    unlockAchievement("創設者");
  }

  if(playerData.equippedTitle==="MENERU"){
    unlockAchievement("MENERU発見者");
  }

  if(getLevel()>=300) unlockAchievement("数学神");
  if(getLevel()>=1000) unlockAchievement("伝説の数学神");

  saveAllData();
}

function showAchievements(){
  checkAchievements();

  let html="<h2>🏆 実績一覧</h2>";

  for(let a of achievementList()){
    let got=playerData.achievements.includes(a);

    if(a==="MENERU発見者" && got){
      html+=`
        <div class="achievementItem">
          ✅ <span class="meneruTitle">👾MENERU発見者👾</span>
        </div>
      `;
      continue;
    }

    html+=`
      <div class="achievementItem">
        ${got ? "✅" : "⬜"} ${a}
      </div>
    `;
  }

  document.getElementById("panelArea").innerHTML=html;
}

function allTitles(){
  return [
    "⚡️創設者",
    "MENERU",

    "理系","数学初心者","数学中級者","数学上級者",
    "数学の鬼👹","数学の申し子🪽","数学王👑",
    "伝説","神話","創世神🌌",

    "数学好き","数学大好き","数学者🎓","努力家","秀才","鬼才","天才",

    "10連勝","50連勝","100連勝","不敗神話",

    "電光石火","疾風迅雷","数学の怪物",

    "TOP100","TOP50","TOP10","TOP3","週間王👑",

    "毎日勉強","継続は力なり","数学狂",

    "数学見習い","努力の証","数学修行者","数学戦士",
    "数学エリート","数学の達人","数学マスター",
    "超数学者","数式の支配者","数学神話",

    "数学神","伝説の数学神"
  ];
}

function checkTitles(){
  let correct=playerData.totalCorrect||0;
  let play=playerData.playTime||0;
  let comboMax=playerData.maxCombo||0;
  let best=playerData.bestRandomScore||0;
  let days=playerData.consecutiveDays||0;
  let level=getLevel();

  if(correct>=5) unlockTitle("理系");
  if(correct>=10) unlockTitle("数学初心者");
  if(correct>=50) unlockTitle("数学中級者");
  if(correct>=100) unlockTitle("数学上級者");
  if(correct>=500) unlockTitle("数学の鬼👹");
  if(correct>=1000) unlockTitle("数学の申し子🪽");
  if(correct>=5000) unlockTitle("数学王👑");
  if(correct>=10000) unlockTitle("伝説");
  if(correct>=50000) unlockTitle("神話");
  if(correct>=100000) unlockTitle("創世神🌌");

  if(play>=15*60) unlockTitle("数学好き");
  if(play>=30*60) unlockTitle("数学大好き");
  if(play>=60*60) unlockTitle("数学者🎓");
  if(play>=3*60*60) unlockTitle("努力家");
  if(play>=5*60*60) unlockTitle("秀才");
  if(play>=10*60*60) unlockTitle("鬼才");
  if(play>=50*60*60) unlockTitle("天才");

  if(comboMax>=10) unlockTitle("10連勝");
  if(comboMax>=50) unlockTitle("50連勝");
  if(comboMax>=100) unlockTitle("100連勝");
  if(comboMax>=200) unlockTitle("不敗神話");

  if(best>=20) unlockTitle("電光石火");
  if(best>=50) unlockTitle("疾風迅雷");
  if(best>=100) unlockTitle("数学の怪物");

  if(days>=7) unlockTitle("毎日勉強");
  if(days>=30) unlockTitle("継続は力なり");
  if(days>=100) unlockTitle("数学狂");

  if(level>=5) unlockTitle("数学見習い");
  if(level>=10) unlockTitle("努力の証");
  if(level>=20) unlockTitle("数学修行者");
  if(level>=30) unlockTitle("数学戦士");
  if(level>=50) unlockTitle("数学エリート");
  if(level>=75) unlockTitle("数学の達人");
  if(level>=100) unlockTitle("数学マスター");
  if(level>=150) unlockTitle("超数学者");
  if(level>=200) unlockTitle("数式の支配者");
  if(level>=300) unlockTitle("数学神話");

  saveAllData();
}

function showTitles(){
  checkTitles();

  let html="<h2>🏅 称号一覧</h2>";

  for(let t of allTitles()){
    let unlocked=playerData.unlockedTitles.includes(t);

    html+=`
      <div class="titleItem">
        ${unlocked ? titleHTML(t) : "❓？？？"}
        ${
          unlocked
          ? `<button onclick="equipTitle('${t}')">装備</button>`
          : ""
        }
      </div>
    `;
  }

  document.getElementById("panelArea").innerHTML=html;
}
function getTodayKey(){
  return new Date().toLocaleDateString("ja-JP", {
    timeZone:"Asia/Tokyo"
  });
}

function prepareDailyMission(){
  let today = getTodayKey();

  if(playerData.dailyMission.date === today) return;

  playerData.dailyMission = {
    date:today,
    missions:[
      {id:"correct10", text:"今日10問正解", need:10, count:0, done:false},
      {id:"integral5", text:"積分を5問正解", need:5, count:0, done:false},
      {id:"combo5", text:"5連勝する", need:5, count:0, done:false}
    ]
  };

  saveAllData();
}

function updateMission(type){
  prepareDailyMission();

  let ms = playerData.dailyMission.missions || [];

  for(let m of ms){
    if(m.done) continue;

    if(m.id==="correct10" && type==="correct"){
      m.count++;
    }

    if(m.id==="integral5" && type==="integral"){
      m.count++;
    }

    if(m.id==="combo5" && combo>=5){
      m.count=5;
    }

    if(m.count >= m.need){
      m.done=true;
      addExp(50);
    }
  }

  saveAllData();
}

function showDailyMission(){
  prepareDailyMission();

  let html="<h2>🎯 デイリーミッション</h2>";

  for(let m of playerData.dailyMission.missions){
    html+=`
      <div class="missionItem">
        ${m.done ? "✅" : "⬜"} ${m.text}<br>
        ${m.count}/${m.need}<br>
        報酬：EXP50
      </div>
    `;
  }

  document.getElementById("panelArea").innerHTML=html;
}

function showSettings(){
  document.getElementById("panelArea").innerHTML=`
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

  document.getElementById("panelArea").innerHTML=`
    <h2>👤 プロフィール</h2>

    <div class="profileItem">
      <img src="${playerProfile.icon || ""}" class="rankIcon">
      <br>
      <input id="playerNameEdit" placeholder="名前" value="${playerProfile.name || "名無し"}">
      <br>
      <input type="file" id="iconInputEdit" accept="image/*">
      <br>
      <button onclick="saveProfileFromPanel()">保存</button>
    </div>

    <div class="profileItem">
      <p>称号：${titleHTML(playerData.equippedTitle || "初心者")}</p>
      <p>Lv：${getLevel()}</p>
      <p>EXP：${getExpPercent()}/100</p>
      <p>正答率：${getCorrectRate()}%</p>
      <p>累計正解数：${playerData.totalCorrect || 0}問</p>
      <p>累計問題数：${playerData.totalQuestions || 0}問</p>
      <p>プレイ時間：約${playMin}分</p>
      <p>最大連勝：${playerData.maxCombo || 0}</p>
      <p>ベストスコア：${playerData.bestRandomScore || 0}問</p>
      <p>フレンドID：${window.getMyPlayerId ? window.getMyPlayerId() : "未取得"}</p>
    </div>
  `;
}

function saveProfileFromPanel(){
  let name=document.getElementById("playerNameEdit").value.trim();
  let file=document.getElementById("iconInputEdit").files[0];

  if(name){
    playerProfile.name=name;
  }

  if(file){
    let reader=new FileReader();

    reader.onload=function(e){
      playerProfile.icon=e.target.result;
      saveAllData();
      updateHomeStatus();
      showProfile();
      alert("保存したよ");
    };

    reader.readAsDataURL(file);
  }else{
    saveAllData();
    updateHomeStatus();
    showProfile();
    alert("保存したよ");
  }
}

function showContact(){
  document.getElementById("panelArea").innerHTML=`
    <h2>📩 お問い合わせ</h2>

    <div class="profileItem">
      <p>バグ報告・要望・不具合報告はこちら</p>

      <button onclick="
        window.open(
          'https://docs.google.com/forms/d/e/1FAIpQLSfWnEWXYipQy-x5Vn69yrcOPrlHrKCjHvFblvu-he9HqHhnAA/viewform',
          '_blank'
        )
      ">
        お問い合わせフォームを開く
      </button>

      <p>回答には時間がかかる場合があります。</p>
    </div>

    <div class="profileItem">
      <p><a href="terms.html">利用規約</a></p>
      <p><a href="privacy.html">プライバシーポリシー</a></p>
    </div>
  `;
}

async function savePublicProfile(){
  try{
    if(window.savePlayerPublicData){
      await savePlayerPublicData({
        name:playerProfile.name || "名無し",
        icon:playerProfile.icon || "",
        title:playerData.equippedTitle || "初心者",
        level:getLevel(),
        bestRandomScore:playerData.bestRandomScore || 0
      });
    }
  }catch(e){
    console.log(e);
  }
}

function showFriendMenu(){
  let html=`
    <h2>🤝 フレンド</h2>

    <div class="friendItem">
      <p>あなたのID</p>
      <input value="${window.getMyPlayerId ? window.getMyPlayerId() : "未取得"}" readonly>
    </div>

    <div class="friendItem">
      <input id="friendIdInput" placeholder="フレンドID">
      <button onclick="addFriend()">追加</button>
    </div>

    <div id="friendListArea"></div>

    <button onclick="showFriendRanking()">🏆 フレンドランキング</button>
  `;

  document.getElementById("panelArea").innerHTML=html;

  renderFriendList();
}

function addFriend(){
  let id=document.getElementById("friendIdInput").value.trim();

  if(!id){
    alert("IDを入力して");
    return;
  }

  if(playerData.friends.includes(id)){
    alert("追加済み");
    return;
  }

  playerData.friends.push(id);
  saveAllData();
  renderFriendList();
}

function removeFriend(id){
  playerData.friends=playerData.friends.filter(x=>x!==id);
  saveAllData();
  renderFriendList();
}

async function renderFriendList(){
  let area=document.getElementById("friendListArea");
  if(!area) return;

  let html="";

  if(playerData.friends.length===0){
    html+="<p>フレンドなし</p>";
  }

  for(let id of playerData.friends){
    let data=null;

    try{
      data=await loadFriendData(id);
    }catch(e){}

    if(data){
      html+=`
        <div class="friendItem">
          ${data.icon ? `<img class="rankIcon" src="${data.icon}">` : ""}
          ${data.name}<br>
          ${data.title}<br>
          Lv${data.level}<br>
          <button onclick="removeFriend('${id}')">削除</button>
        </div>
      `;
    }else{
      html+=`
        <div class="friendItem">
          ${id}<br>
          データなし<br>
          <button onclick="removeFriend('${id}')">削除</button>
        </div>
      `;
    }
  }

  area.innerHTML=html;
}

async function showFriendRanking(){
  let html="<h2>🏆 フレンドランキング</h2>";
  let list=[];

  try{
    for(let id of playerData.friends){
      let data=await loadFriendData(id);
      if(data) list.push(data);
    }
  }catch(e){
    console.log(e);
  }

  list.push({
    name:playerProfile.name,
    icon:playerProfile.icon,
    title:playerData.equippedTitle,
    level:getLevel(),
    bestRandomScore:playerData.bestRandomScore
  });

  list.sort((a,b)=>(b.bestRandomScore||0)-(a.bestRandomScore||0));

  for(let i=0;i<list.length;i++){
    html+=`
      <div class="rankItem">
        ${i+1}位
        ${list[i].icon ? `<img class="rankIcon" src="${list[i].icon}">` : ""}
        ${list[i].name}<br>
        ${titleHTML(list[i].title || "初心者")}<br>
        Lv${list[i].level || 1}<br>
        スコア：${list[i].bestRandomScore || 0}
      </div>
    `;
  }

  document.getElementById("panelArea").innerHTML=html;
}
function aiExplain(q){
  q = String(q);

  if(q.includes("∫")){
    return "積分は、基本的に次数を1つ上げて、その新しい次数で割ります。定積分なら上端を代入した値から下端を代入した値を引きます。";
  }

  if(q.includes("d/dx")){
    return "微分は、次数を前に出して、次数を1つ下げます。三角関数や指数関数では中身の微分も忘れないようにします。";
  }

  if(q.includes("因数分解")){
    return "因数分解は、足して真ん中の係数、かけて最後の定数になる数を探すのが基本です。";
  }

  if(q.includes("素因数分解")){
    return "素因数分解は、2、3、5、7のような小さい素数から順番に割っていくとミスしにくいです。";
  }

  return "まず式の形を見て、公式が使えるか確認しましょう。間違えた問題は復習リストで再挑戦できます。";
}

function addReviewItem(q){
  if(!q) return;

  if(playerData.reviewList.some(x=>x.q===q.q)){
    return;
  }

  playerData.reviewList.unshift({
    q:q.q,
    a:q.display,
    explanation:q.explanation || "解説はありません",
    ai:aiExplain(q.q),
    original:q
  });

  playerData.reviewList = playerData.reviewList.slice(0,10);
  saveAllData();
}

function showReviewList(){
  let html = "<h2>📚 復習リスト</h2>";

  if(playerData.reviewList.length===0){
    html += "<p>まだありません</p>";
  }

  for(let i=0;i<playerData.reviewList.length;i++){
    let r = playerData.reviewList[i];

    html += `
      <div class="reviewItem">
        <p>${i+1}. ${r.q}</p>
        <p>正解：${r.a}</p>

        <button onclick="alert('${String(r.explanation).replace(/'/g,"\\'")}')">
          解説
        </button>

        <button onclick="alert('${String(r.ai).replace(/'/g,"\\'")}')">
          🤖AI解説
        </button>

        <button onclick="retryReview(${i})">
          再挑戦
        </button>
      </div>
    `;
  }

  document.getElementById("panelArea").innerHTML = html;
}

function retryReview(i){
  let r = playerData.reviewList[i];
  if(!r) return;

  current = {
    q:r.q,
    a:r.original ? r.original.a : r.a,
    display:r.a,
    explanation:r.explanation
  };

  mode = "review";

  document.getElementById("homeScreen").classList.remove("active");
  document.getElementById("gameScreen").classList.add("active");

  document.getElementById("modeTitle").innerText = "📚 復習モード";
  document.getElementById("result").innerHTML = "";
  document.getElementById("q").innerText = current.q;
  document.getElementById("ans").value = "";

  updateHP();
}

function recordPlayDay(){
  let today = getTodayKey();

  if(!playerData.lastPlayDate){
    playerData.lastPlayDate = today;
    playerData.consecutiveDays = 1;
    return;
  }

  if(playerData.lastPlayDate === today){
    return;
  }

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

function showStudyMenu(){
  document.getElementById("panelArea").innerHTML = `
    <h2>📚 学習モード</h2>

    <button class="modeBtn" onclick="selectMode('integral')">
      積分
    </button>

    <button class="modeBtn" onclick="selectMode('derivative')">
      微分
    </button>

    <button class="modeBtn" onclick="selectMode('factor')">
      因数分解
    </button>

    <button class="modeBtn" onclick="selectMode('prime')">
      素因数分解
    </button>

    <button class="modeBtn" onclick="selectMode('expand')">
      展開
    </button>
  `;
}

function selectMode(m){
  mode = m;

  document.getElementById("homeScreen").classList.remove("active");
  document.getElementById("gameScreen").classList.add("active");

  let title = "⚔️ 積分バトル ⚔️";

  if(mode==="derivative") title = "⚔️ 微分バトル ⚔️";
  if(mode==="factor") title = "⚔️ 因数分解バトル ⚔️";
  if(mode==="prime") title = "⚔️ 素因数分解バトル ⚔️";
  if(mode==="expand") title = "⚔️ 展開バトル ⚔️";
  if(mode==="random") title = "⚔️ ランキングモード ⚔️";

  document.getElementById("modeTitle").innerText = title;

  start();
}

function backHome(){
  updatePlayTime();

  document.getElementById("gameScreen").classList.remove("active");
  document.getElementById("homeScreen").classList.add("active");

  document.getElementById("bgm").pause();

  checkTitles();
  checkAchievements();
  saveAllData();
  savePublicProfile();
  updateHomeStatus();
}

function start(){
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
  }else{
    enemyHP = 10;
    playerHP = 5;
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
      display:`${term(ans,n+1)}+C`,
      explanation:"べき乗の積分公式を使います。x^nはx^(n+1)/(n+1)になります。"
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
      display:display,
      explanation:"多項式は項ごとに積分します。x²はx³/3、xはx²/2になります。"
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
      display:frac(ans),
      explanation:`不定積分してから、上端${r}と下端${l}を代入して引きます。`
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
      display:frac(ans),
      explanation:"項ごとに積分して、上端と下端を代入して差を取ります。"
    };
  }

  if(type===5){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`∫ ${coeff(a)}sin(${k===1?"x":k+"x"}) dx`,
      a:`-${a}*cos(${k}*x)/${k}`,
      display:`-${frac(a/k)}cos(${k===1?"x":k+"x"})+C`,
      explanation:"sin(kx)の積分は -cos(kx)/k です。"
    };
  }

  if(type===6){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`∫ ${coeff(a)}cos(${k===1?"x":k+"x"}) dx`,
      a:`${a}*sin(${k}*x)/${k}`,
      display:`${frac(a/k)}sin(${k===1?"x":k+"x"})+C`,
      explanation:"cos(kx)の積分は sin(kx)/k です。"
    };
  }

  if(type===7){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`∫ ${coeff(a)}e^(${k===1?"x":k+"x"}) dx`,
      a:`${a}*exp(${k}*x)/${k}`,
      display:`${frac(a/k)}e^(${k===1?"x":k+"x"})+C`,
      explanation:"e^(kx)の積分は e^(kx)/k です。"
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
      display:`(${a}x${b>=0?"+":""}${b})^${n+1}/${bottom}+C`,
      explanation:`置換積分です。中身をtと置き、dxの調整で${a}で割ります。`
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
      display:`${term(ansC,n-1)}`,
      explanation:"x^nの微分はnx^(n-1)です。"
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
      display:display,
      explanation:"多項式は項ごとに微分します。"
    };
  }

  if(type===3){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`d/dx ${coeff(a)}sin(${k===1?"x":k+"x"})`,
      a:`${a*k}*cos(${k}*x)`,
      display:`${coeff(a*k)}cos(${k===1?"x":k+"x"})`,
      explanation:"sin(kx)の微分はkcos(kx)です。"
    };
  }

  if(type===4){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`d/dx ${coeff(a)}cos(${k===1?"x":k+"x"})`,
      a:`-${a*k}*sin(${k}*x)`,
      display:`-${coeff(a*k)}sin(${k===1?"x":k+"x"})`,
      explanation:"cos(kx)の微分は-ksin(kx)です。"
    };
  }

  if(type===5){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`d/dx ${coeff(a)}e^(${k===1?"x":k+"x"})`,
      a:`${a*k}*exp(${k}*x)`,
      display:`${coeff(a*k)}e^(${k===1?"x":k+"x"})`,
      explanation:"e^(kx)の微分はke^(kx)です。"
    };
  }

  if(type===6){
    let a = rand(2,5);
    let b = rand(-5,5);
    let n = rand(2,4);

    return{
      q:`d/dx (${a}x${b>=0?"+":""}${b})${n===2?"²":n===3?"³":"⁴"}`,
      a:`${n*a}*(${a}*x+${b})^${n-1}`,
      display:`${n*a}(${a}x${b>=0?"+":""}${b})^${n-1}`,
      explanation:"合成関数の微分です。外側を微分して中身の微分もかけます。"
    };
  }

  if(type===7){
    return{
      q:`d/dx (x+1)(x-1)`,
      a:`2*x`,
      display:`2x`,
      explanation:"先に展開してx²-1にすると、微分は2xです。"
    };
  }

  if(type===8){
    let a = rand(1,5);
    let b = rand(1,5);

    return{
      q:`d/dx (x+${a})(x+${b})`,
      a:`2*x+${a+b}`,
      display:`2x+${a+b}`,
      explanation:"展開してから微分すると簡単です。"
    };
  }

  if(type===9){
    return{
      q:`d/dx √x`,
      a:`1/(2*sqrt(x))`,
      display:`1/(2√x)`,
      explanation:"√xはx^(1/2)なので、微分すると1/(2√x)です。"
    };
  }

  if(type===10){
    return{
      q:`d/dx 1/x`,
      a:`-1/x^2`,
      display:`-1/x^2`,
      explanation:"1/xはx^(-1)なので、微分すると-x^(-2)です。"
    };
  }

  if(type===11){
    let a = rand(1,5);

    return{
      q:`d/dx (${a}x²+1)/2`,
      a:`${a}*x`,
      display:`${coeff(a)}x`,
      explanation:"分子を微分してから2で割ります。"
    };
  }

  if(type===12){
    let a = rand(1,5);

    return{
      q:`d/dx ${a}x^(3/2)`,
      a:`${a*3/2}*sqrt(x)`,
      display:`${frac(a*3/2)}√x`,
      explanation:"x^(3/2)の微分は(3/2)x^(1/2)です。"
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
      display:`(x+${a})(x+${b})`,
      explanation:`足して${a+b}、かけて${a*b}になる数を探します。`
    };
  }

  if(type===2){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`x²-${a+b}x+${a*b} を因数分解`,
      a:`(x-${a})*(x-${b})`,
      display:`(x-${a})(x-${b})`,
      explanation:`足して-${a+b}、かけて${a*b}になる数を探します。`
    };
  }

  if(type===3){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`x²+${b-a}x-${a*b} を因数分解`,
      a:`(x-${a})*(x+${b})`,
      display:`(x-${a})(x+${b})`,
      explanation:`かけて負、足して${b-a}になる組を探します。`
    };
  }

  if(type===4){
    let a = rand(2,9);

    return{
      q:`x²-${a*a} を因数分解`,
      a:`(x-${a})*(x+${a})`,
      display:`(x-${a})(x+${a})`,
      explanation:"平方差 a²-b²=(a-b)(a+b) を使います。"
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
    number:num,
    explanation:`小さい素数から順に割ると ${factors.join("×")} になります。`
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
      display:`x^2+${a+b}x+${a*b}`,
      explanation:`x²+(${a}+${b})x+${a}×${b}です。`
    };
  }

  if(type===2){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`(x-${a})(x-${b}) を展開`,
      a:`x^2-${a+b}*x+${a*b}`,
      display:`x^2-${a+b}x+${a*b}`,
      explanation:"符号に注意して展開します。"
    };
  }

  if(type===3){
    let a = rand(1,8);

    return{
      q:`(x+${a})² を展開`,
      a:`x^2+${2*a}*x+${a*a}`,
      display:`x^2+${2*a}x+${a*a}`,
      explanation:"(x+a)²=x²+2ax+a²です。"
    };
  }

  if(type===4){
    let a = rand(1,8);

    return{
      q:`(x-${a})² を展開`,
      a:`x^2-${2*a}*x+${a*a}`,
      display:`x^2-${2*a}x+${a*a}`,
      explanation:"(x-a)²=x²-2ax+a²です。"
    };
  }
}
function expressionsEqual(user,correct){

  try{

    let u = normalize(user);
    let c = normalize(correct);

    let values =
      [-3,-2,-1,1,2,3,4];

    for(let x of values){

      let uv =
        math.evaluate(u,{x:x});

      let cv =
        math.evaluate(c,{x:x});

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
    usedQuestions.includes(current.q)
    &&
    count<100
  );

  usedQuestions.push(current.q);

  let q =
    document.getElementById("q");

  let go =
    document.getElementById("goText");

  q.innerText = "";

  document.getElementById("ans").value = "";

  go.classList.remove("goAnim");
  q.classList.remove("questionAnim");

  void go.offsetWidth;
  void q.offsetWidth;

  setTimeout(()=>{

    go.classList.add("goAnim");

    setTimeout(()=>{

      q.innerText = current.q;
      q.classList.add("questionAnim");

    },300);

  },200);
}

function submit(){

  if(!current) return;

  let u =
    document.getElementById("ans").value.trim();

  if(u===""){
    alert("答えを入力して");
    return;
  }

  /* 創設者 */

  if(
    u==="adminadminadmin9671"
    &&
    mode==="integral"
  ){

    unlockTitle("⚡️創設者");

    unlockAchievement("創設者");

    playerData.equippedTitle =
      "⚡️創設者";

    saveAllData();

    updateHomeStatus();

    alert("⚡️創設者を解放しました！");

    return;
  }

  /* MENERU */

  if(
    u==="MENERU"
    &&
    mode==="derivative"
  ){

    unlockTitle("MENERU");

    unlockAchievement(
      "MENERU発見者"
    );

    playerData.equippedTitle =
      "MENERU";

    saveAllData();

    updateHomeStatus();

    alert(
      "👾MENERU👾 を解放しました！"
    );

    return;
  }

  let ok = false;

  if(mode==="prime"){

    ok =
      checkPrimeAnswer(
        u,
        current.number
      );
  }

  if(!ok){

    ok =
      expressionsEqual(
        u,
        current.a
      );
  }

  if(!ok){

    ok =
      normalize(u)
      ===
      normalize(current.display);
  }

  playerData.totalQuestions++;

  history.push({
    question:current.q,
    your:u,
    answer:current.display,
    explanation:current.explanation,
    ok:ok
  });

  if(ok){

    score++;
    combo++;

    playerData.totalCorrect++;

    addExp(10);

    if(combo > playerData.maxCombo){

      playerData.maxCombo =
        combo;
    }

    updateMission("correct");

    if(mode==="integral"){
      updateMission("integral");
    }

    if(mode!=="random" && mode!=="review"){
      enemyHP--;
    }

    if(settings.se){

      document
      .getElementById("se_correct")
      .play();
    }

    document.getElementById("result")
      .innerHTML =
      `○ 正解！<br>
       正解：${current.display}`;

  }else{

    combo = 0;

    addReviewItem(current);

    if(mode==="random"){

      finishRandom();
      return;
    }

    if(mode!=="review"){
      playerHP--;
    }

    if(settings.se){

      document
      .getElementById("se_wrong")
      .play();
    }

    document.getElementById("result")
      .innerHTML =
      `× 不正解<br>
       正解：${current.display}
       <br><br>
       📖 ${current.explanation}
       <br><br>
       🤖 ${aiExplain(current.q)}`;
  }

  checkTitles();
  checkAchievements();

  saveAllData();

  updateHP();
  updateHomeStatus();

  nextTurn();
}

function finishRandom(){

  updatePlayTime();

  if(score > playerData.bestRandomScore){

    playerData.bestRandomScore =
      score;
  }

  saveAllData();

  showEnd("終了！");
}

function updateHP(){

  let e =
    document.getElementById("ehp");

  let p =
    document.getElementById("php");

  if(e) e.innerText = enemyHP;
  if(p) p.innerText = playerHP;

  if(mode==="random"){

    document
      .getElementById("enemy")
      .style.display="none";

    document
      .getElementById("enemyFrame")
      .style.display="none";

    return;
  }

  document
    .getElementById("enemyBar")
    .style.width =
    (enemyHP/10*100)+"%";

  document
    .getElementById("playerBar")
    .style.width =
    (playerHP/5*100)+"%";
}

function nextTurn(){

  if(mode==="review"){
    return;
  }

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

  },800);
}

function showEnd(text){

  updatePlayTime();

  document.getElementById("q")
    .innerText = text;

  let html = `
    <h2>スコア：${score}</h2>

    <button onclick="start()">
      もう一回
    </button>

    <button onclick="backHome()">
      ホームへ
    </button>

    <hr>

    <h2>解いた問題一覧</h2>
  `;

  for(let h of history){

    html += `
      <div class="rankItem">

        ${h.ok ? "○" : "×"}

        <br>

        問題：
        ${h.question}

        <br>

        あなた：
        ${h.your}

        <br>

        正解：
        ${h.answer}

      </div>
    `;
  }

  document.getElementById("result")
    .innerHTML = html;
}

async function showWorldRanking(){

  let box =
    document.getElementById("panelArea");

  box.innerHTML =
    "<h2>読み込み中...</h2>";

  try{

    let ranking =
      await loadWorldRanking();

    let html =
      "<h2>🌍 週間ランキング</h2>";

    if(ranking.length===0){

      html +=
        "<p>まだ記録がありません</p>";
    }

    for(let i=0;i<ranking.length;i++){

      html += `
        <div class="rankItem">

          ${i+1}位

          ${
            ranking[i].icon
            ? `<img class="rankIcon"
                 src="${ranking[i].icon}">`
            : ""
          }

          ${ranking[i].name}

          <br>

          ${titleHTML(
            ranking[i].title ||
            "初心者"
          )}

          <br>

          Lv${ranking[i].level || 1}

          <br>

          ${ranking[i].score}問

        </div>
      `;
    }

    box.innerHTML = html;

  }catch(e){

    box.innerHTML =
      "<p>ランキング取得失敗</p>";
  }
}