function cleanMathExpression(expr){
if(expr===undefined || expr===null) return expr;
let s = String(expr);
s = s.replace(/(^|[+\-])\s*0\s*x(?:\^\d+|[²³⁴⁵⁶])?/g, "$1");
s = s.replace(/(^|[+\-])\s*0\s*x/g, "$1");
s = s.replace(/(^|[+\-(])\s*1\s*x/g, "$1x");
s = s.replace(/(^|[+\-(])\s*-1\s*x/g, "$1-x");
s = s.replace(/([+\-])\s*1\s*x/g, "$1x");
s = s.replace(/([+\-])\s*-1\s*x/g, m => m.includes("+") ? "-x" : "+x");
s = s.replace(/\+\s*0(?=\)|\s|$)/g, "");
s = s.replace(/-\s*0(?=\)|\s|$)/g, "");
s = s.replace(/\+\s*-/g,"-").replace(/-\s*\+/g,"-").replace(/\+\s*\+/g,"+").replace(/--/g,"+");
s = s.replace(/\(\+/g,"(").replace(/^\+/,"");
s = s.replace(/\s+/g," ").trim();
s = s.replace(/\(\s*\)/g,"0");
return s;
}
function colorOperatorsHTML(s){
if(s===undefined || s===null)return "";
return String(s)
.replace(/\+/g,'<span class="operatorOrange">+</span>')
.replace(/-/g,'<span class="operatorOrange">-</span>')
.replace(/×/g,'<span class="operatorOrange">×</span>')
.replace(/÷/g,'<span class="operatorOrange">÷</span>');
}
function comboDamageValue(combo){
combo = combo || 0;
if(combo <= 2)return 1;
return combo - 1;
}
function showComboDamage(){
const result=document.getElementById("result");
if(!result)return;
const dmg=comboDamageValue(combo||0);
const html=`<div class="comboDamageBox">🔥 ${combo||0} COMBO　⚔️ ${dmg} DAMAGE</div>`;
if(!result.innerHTML.includes("comboDamageBox")){
result.innerHTML = html + result.innerHTML;
}
}
function fixFormulaSigns(s){
return cleanMathExpression(s);
}
function cleanQuestionObject(q){
if(!q)return q;
if(q.q)q.q=fixFormulaSigns(q.q);
if(q.display)q.display=fixFormulaSigns(q.display);
if(q.a)q.a=fixFormulaSigns(q.a);
if(q.answer)q.answer=fixFormulaSigns(q.answer);
return q;
}
const VERSION = "3.1.6";
let enemyHP = 10;
let playerHP = 5;
let current;
let history = [];
let usedQuestions = [];
let mode = "integral";
let difficulty = "easy";
let score = 0;
let combo = 0;
let playStartTime = 0;
let playerProfile = {name:"名無し", icon:""};
let settings = {bgm:true, se:true};
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
friends:[],
coins:0,
gachaTitles:[],
loginBonusDay:1,
lastCoinBonusDate:"",
loginStampedDays:[]
};
function setInputVisible(show){
const ans = document.getElementById("ans");
const keyboard = document.getElementById("customKeyboard");
const homeBtn = document.getElementById("gameHomeBtn");
if(ans) ans.style.display = show ? "inline-block" : "none";
if(keyboard) keyboard.style.display = show ? "grid" : "none";
if(homeBtn) homeBtn.style.display = show ? "inline-block" : "none";
}
function addKey(text){
const input = document.getElementById("ans");
input.value += text;
input.focus();
}
function clearInput(){
document.getElementById("ans").value = "";
}
function backspaceInput(){
const input = document.getElementById("ans");
input.value = input.value.slice(0,-1);
}
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function gcd(a,b){while(b){let t=a%b;a=b;b=t;}return Math.abs(a);}
function frac(num){
for(let d=1; d<=1000; d++){
let n=Math.round(num*d);
if(Math.abs(num-n/d)<1e-10){
let g=gcd(Math.abs(n),d);
n/=g; d/=g;
if(d===1)return `${n}`;
return `${n}/${d}`;
}
}
return String(num);
}
function coeff(num){let s=frac(num); if(s==="1")return ""; if(s==="-1")return "-"; return s;}
function qPower(p){return p===1?"x":p===2?"x²":p===3?"x³":p===4?"x⁴":p===5?"x⁵":p===6?"x⁶":"x^"+p;}
function xPower(p){return p===1?"x":"x^"+p;}
function term(c,p){if(c===0)return ""; if(p===0)return frac(c); return coeff(c)+xPower(p);}
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
.replace(/⁶/g,"^6")
.replace(/×/g,"*")
.replace(/÷/g,"/");
}
function getLevel(){return Math.floor((playerData.exp||0)/100)+1;}
function getExpPercent(){return (playerData.exp||0)%100;}
function getCorrectRate(){if(!playerData.totalQuestions)return 0; return Math.round(playerData.totalCorrect/playerData.totalQuestions*100);}
function showLevelUp(level){
let area=document.getElementById("levelUpArea");
area.innerHTML=`<div class="levelUp">LEVEL UP!!<br>Lv${level}</div>`;
setTimeout(()=>area.innerHTML="",1500);
}
function addExp(n){
let before=getLevel();
playerData.exp=(playerData.exp||0)+n;
let after=getLevel();
if(after>before)showLevelUp(after);
}
function titleHTML(t){
if(t==="⚡️創設者⚡️")return `<span class="founderTitle">⚡️創設者⚡️</span>`;
if(t==="古参勢")return `<span class="oldGuardTitle">古参勢</span>`;
if(t==="🌈虹の数学神🌈")return `<span class="rainbowTitle">🌈虹の数学神🌈</span>`;
if(t==="❄️絶対零度❄️")return `<span class="urTitle" style="color:#00ccff;">❄️絶対零度❄️</span>`;
if(t==="🌌宇宙の支配者🌌")return `<span class="rainbowTitle">🌌宇宙の支配者🌌</span>`;
if(t==="🔥原初の数式🔥")return `<span class="urTitle" style="color:#ff3300;">🔥原初の数式🔥</span>`;
if(t==="👑究極数学王👑")return `<span class="urTitle" style="color:#ffd700;">👑究極数学王👑</span>`;
return `🏅 ${t}`;
}
function loadAllData(){
let p=localStorage.getItem("playerProfile"); if(p) playerProfile=JSON.parse(p);
let d=localStorage.getItem("playerData"); if(d) playerData=JSON.parse(d);
let s=localStorage.getItem("settings"); if(s) settings=JSON.parse(s);
if(!playerData.unlockedTitles)playerData.unlockedTitles=["初心者"];
if(!playerData.equippedTitle)playerData.equippedTitle="初心者";
if(!playerData.reviewList)playerData.reviewList=[];
if(!playerData.dailyMission)playerData.dailyMission={};
if(!playerData.achievements)playerData.achievements=[];
if(!playerData.friends)playerData.friends=[];
if(!playerData.gachaTitles)playerData.gachaTitles=[];
if(!playerData.loginStampedDays)playerData.loginStampedDays=[];
if(!playerData.coins)playerData.coins=0;
if(!playerData.bgTheme)playerData.bgTheme="space";
if(!playerData.profileBg)playerData.profileBg="galaxy";
if(!playerData.matchHistory)playerData.matchHistory=[];
if(!playerData.genreStats)playerData.genreStats={};
if(!playerData.loginBonusDay)playerData.loginBonusDay=1;
if(!playerData.lastCoinBonusDate)playerData.lastCoinBonusDate="";
if(!playerData.exp)playerData.exp=0;
applySettings();
updateHomeStatus();
prepareDailyMission();
giveDailyCoinBonus();
}
function saveAllData(){
localStorage.setItem("playerProfile",JSON.stringify(playerProfile));
localStorage.setItem("playerData",JSON.stringify(playerData));
localStorage.setItem("settings",JSON.stringify(settings));
if(window.queueCloudSave && !window.__cloudLoginJustSignedIn) window.queueCloudSave();
}
window.saveAllData = saveAllData;
window.getLevel = getLevel;
window.getLocalGameData = function(){
return {
playerProfile: playerProfile,
playerData: playerData,
settings: settings
};
};
window.applyCloudGameData = function(data){
if(data.playerProfile) playerProfile = Object.assign(playerProfile || {}, data.playerProfile);
if(data.playerData) playerData = Object.assign(playerData || {}, data.playerData);
if(data.settings) settings = Object.assign(settings || {}, data.settings);
localStorage.setItem("playerProfile",JSON.stringify(playerProfile));
localStorage.setItem("playerData",JSON.stringify(playerData));
localStorage.setItem("settings",JSON.stringify(settings));
applySettings();
updateHomeStatus();
};
window.updateHomeStatus = updateHomeStatus;
window.addEventListener("load",()=>{
loadAllData();
setTimeout(refreshLoginStatus,500);
setTimeout(refreshLoginStatus,1500);
setTimeout(refreshLoginStatus,3000);
});
function panelBackButtonHTML(){
return `<button id="panelBackTop" class="commonNavBtn" onclick="closePanelPage()">← ホームメニューへ</button>`;
}
function ensurePanelBackButton(){
const panel=document.getElementById("panelArea");
if(panel && !document.getElementById("panelBackTop")){
panel.insertAdjacentHTML("afterbegin", panelBackButtonHTML());
}
}
function commonNavHTML(){
return `
<div id="commonNav" class="commonNav">
<button onclick="goBackPanel()">← 戻る</button>
<button onclick="goHomeFromAnywhere()">🏠 ホームへ</button>
</div>
`;
}
let panelHistoryStack=[];
function pushPanelHistory(fnName){
if(!panelHistoryStack.length || panelHistoryStack[panelHistoryStack.length-1]!==fnName){
panelHistoryStack.push(fnName);
}
}
function goBackPanel(){
if(panelHistoryStack.length<=1){
goHomeFromAnywhere();
return;
}
panelHistoryStack.pop();
const prev=panelHistoryStack.pop();
openPanelPage(prev);
}
function ensureHomeButton(){
const homeActive=document.getElementById("homeScreen")?.classList.contains("active");
const gameActive=document.getElementById("gameScreen")?.classList.contains("active");
if(gameActive) return;
const panel=document.getElementById("panelArea");
if(homeActive && panel && panel.innerHTML.trim() && !document.getElementById("commonNav")){
panel.insertAdjacentHTML("afterbegin", commonNavHTML());
}
const result=document.getElementById("resultScreen");
if(result && result.classList.contains("active") && !document.getElementById("commonNav")){
result.insertAdjacentHTML("afterbegin", commonNavHTML());
}
}
function goHomeFromAnywhere(){
if(matchState && matchState.poll){
clearInterval(matchState.poll);
matchState.poll=null;
matchState.active=false;
}
document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
document.getElementById("homeScreen").classList.add("active");
const panel=document.getElementById("panelArea");
if(panel)panel.innerHTML="";
const menu=document.getElementById("homeMenu");
if(menu)menu.classList.remove("hidden");
panelHistoryStack=[];
setInputVisible(true);
updateHomeStatus();
}
function setPanelWithNav(html){
const panel=document.getElementById("panelArea");
if(!panel)return;
panel.innerHTML=commonNavHTML()+html;
}
function openPanelPage(fnName){
const menu=document.getElementById("homeMenu");
const panel=document.getElementById("panelArea");
if(menu)menu.classList.add("hidden");
if(panel)panel.innerHTML="";
pushPanelHistory(fnName);
try{
if(typeof window[fnName]==="function"){
window[fnName]();
}else{
eval(fnName+"()");
}
}catch(e){
console.error(e);
if(panel)panel.innerHTML="<p>ページを開けませんでした。</p>";
}
setTimeout(ensureHomeButton,0);
setTimeout(ensureHomeButton,300);
}
function closePanelPage(){
const menu=document.getElementById("homeMenu");
const panel=document.getElementById("panelArea");
if(menu)menu.classList.remove("hidden");
if(panel)panel.innerHTML="";
}
function updateHomeStatus(){
let title=document.getElementById("currentTitle");
let level=document.getElementById("levelInfo");
let rate=document.getElementById("rateInfo");
let coin=document.getElementById("coinInfo");
let icon=document.getElementById("profileIcon");
let pname=document.getElementById("homePlayerName");
if(title)title.innerHTML="称号："+titleHTML(playerData.equippedTitle||"初心者");
if(level)level.innerHTML=`Lv${getLevel()}　EXP ${getExpPercent()}/100`;
if(rate)rate.innerHTML=`正答率：${getCorrectRate()}%`;
if(coin)coin.innerHTML=`コイン：${playerData.coins||0}`;
if(pname)pname.innerText=playerProfile.name||"名無し";
if(icon && playerProfile.icon)icon.src=playerProfile.icon;
refreshLoginStatus();
}
function applySettings(){
let bgm=document.getElementById("bgm");
if(bgm)bgm.muted=!settings.bgm;
}
function toggleBGM(){settings.bgm=!settings.bgm;saveAllData();applySettings();showSettings();}
function toggleSE(){settings.se=!settings.se;saveAllData();showSettings();}
function refreshLoginStatus(){
let el=document.getElementById("loginStatus");
let home=document.getElementById("homeLoginStatus");
let user=null;
if(window.getGoogleLoginInfo){
user=window.getGoogleLoginInfo();
}else if(window.currentUser){
user=window.currentUser;
}
let uid=localStorage.getItem("googleLoginUid");
let linked=localStorage.getItem("googleLoginLinked");
if(user || uid || linked){
if(el)el.innerText="アカウント連携済み";
if(home){
home.innerHTML="🟢 アカウント連携済み";
home.className="loginOk";
}
}else{
if(el)el.innerText="未ログイン";
if(home){
home.innerHTML="🔴 未ログイン";
home.className="loginNg";
}
}
}
function unlockTitle(t){if(!playerData.unlockedTitles.includes(t))playerData.unlockedTitles.push(t);}
function equipTitle(t){if(playerData.unlockedTitles.includes(t)){playerData.equippedTitle=t;saveAllData();updateHomeStatus();showTitles();}}
function unlockAchievement(a){if(!playerData.achievements.includes(a))playerData.achievements.push(a);}
window.unlockAchievement = unlockAchievement;
function achievementList(){
return [
"初正解","10問正解","100問正解","1000問正解",
"初ランキング登録","週間ランキング参加","初ログイン","プロフィール設定完了",
"3連勝","5連勝","10連勝","25連勝","50連勝","100連勝","無双",
"積分マスター","微分マスター","因数分解マスター","素因数分解マスター","展開マスター",
"TOP100","TOP50","TOP10","TOP3","週間王👑",
"15分プレイ","1時間プレイ","10時間プレイ","50時間プレイ","100時間プレイ","数学廃人",
"3日連続","7日連続","30日連続","100日連続","毎日数学生活",
"初復習","復習10問","復習50問","復習100問","反省王",
"初ガチャ","UR獲得",
"古参勢","神速","完璧主義者","数学神","伝説の数学神",
"1問目で即死","惜しい！","深夜の数学者","朝活勢","寝るな！"
];
}
function checkAchievements(){
if(playerData.totalCorrect>=1)unlockAchievement("初正解");
if(playerData.totalCorrect>=10)unlockAchievement("10問正解");
if(playerData.totalCorrect>=100)unlockAchievement("100問正解");
if(playerData.totalCorrect>=1000)unlockAchievement("1000問正解");
if(playerData.bestRandomScore>=1){unlockAchievement("初ランキング登録");unlockAchievement("週間ランキング参加");}
if(window.currentUser)unlockAchievement("初ログイン");
if(playerProfile.name!=="名無し"||playerProfile.icon)unlockAchievement("プロフィール設定完了");
if(playerData.maxCombo>=3)unlockAchievement("3連勝");
if(playerData.maxCombo>=5)unlockAchievement("5連勝");
if(playerData.maxCombo>=10)unlockAchievement("10連勝");
if(playerData.maxCombo>=25)unlockAchievement("25連勝");
if(playerData.maxCombo>=50)unlockAchievement("50連勝");
if(playerData.maxCombo>=100)unlockAchievement("100連勝");
if(playerData.maxCombo>=200)unlockAchievement("無双");
if(playerData.playTime>=15*60)unlockAchievement("15分プレイ");
if(playerData.playTime>=60*60)unlockAchievement("1時間プレイ");
if(playerData.playTime>=10*60*60)unlockAchievement("10時間プレイ");
if(playerData.playTime>=50*60*60)unlockAchievement("50時間プレイ");
if(playerData.playTime>=100*60*60)unlockAchievement("100時間プレイ");
if(playerData.playTime>=500*60*60)unlockAchievement("数学廃人");
if(playerData.consecutiveDays>=3)unlockAchievement("3日連続");
if(playerData.consecutiveDays>=7)unlockAchievement("7日連続");
if(playerData.consecutiveDays>=30)unlockAchievement("30日連続");
if(playerData.consecutiveDays>=100)unlockAchievement("100日連続");
if(playerData.consecutiveDays>=365)unlockAchievement("毎日数学生活");
if((playerData.reviewList||[]).length>=1)unlockAchievement("初復習");
if((playerData.reviewList||[]).length>=10)unlockAchievement("復習10問");
if(getLevel()>=300)unlockAchievement("数学神");
if(getLevel()>=1000)unlockAchievement("伝説の数学神");
saveAllData();
}
function allTitles(){
return [
"⚡️創設者⚡️","古参勢",
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
function getAllDisplayTitles(){
return [...new Set([...allTitles(),...gachaPool().map(x=>x.title)])];
}
function checkTitles(){
let correct=playerData.totalCorrect||0;
let play=playerData.playTime||0;
let comboMax=playerData.maxCombo||0;
let best=playerData.bestRandomScore||0;
let days=playerData.consecutiveDays||0;
let level=getLevel();
if(correct>=5)unlockTitle("理系");
if(correct>=10)unlockTitle("数学初心者");
if(correct>=50)unlockTitle("数学中級者");
if(correct>=100)unlockTitle("数学上級者");
if(correct>=500)unlockTitle("数学の鬼👹");
if(correct>=1000)unlockTitle("数学の申し子🪽");
if(correct>=5000)unlockTitle("数学王👑");
if(correct>=10000)unlockTitle("伝説");
if(correct>=50000)unlockTitle("神話");
if(correct>=100000)unlockTitle("創世神🌌");
if(play>=15*60)unlockTitle("数学好き");
if(play>=30*60)unlockTitle("数学大好き");
if(play>=60*60)unlockTitle("数学者🎓");
if(play>=3*60*60)unlockTitle("努力家");
if(play>=5*60*60)unlockTitle("秀才");
if(play>=10*60*60)unlockTitle("鬼才");
if(play>=50*60*60)unlockTitle("天才");
if(comboMax>=10)unlockTitle("10連勝");
if(comboMax>=50)unlockTitle("50連勝");
if(comboMax>=100)unlockTitle("100連勝");
if(comboMax>=200)unlockTitle("不敗神話");
if(best>=20)unlockTitle("電光石火");
if(best>=50)unlockTitle("疾風迅雷");
if(best>=100)unlockTitle("数学の怪物");
if(days>=7)unlockTitle("毎日勉強");
if(days>=30)unlockTitle("継続は力なり");
if(days>=100)unlockTitle("数学狂");
if(level>=5)unlockTitle("数学見習い");
if(level>=10)unlockTitle("努力の証");
if(level>=20)unlockTitle("数学修行者");
if(level>=30)unlockTitle("数学戦士");
if(level>=50)unlockTitle("数学エリート");
if(level>=75)unlockTitle("数学の達人");
if(level>=100)unlockTitle("数学マスター");
if(level>=150)unlockTitle("超数学者");
if(level>=200)unlockTitle("数式の支配者");
if(level>=300)unlockTitle("数学神話");
saveAllData();
}
function showTitles(){
checkTitles();
let html="<h2>🏅 称号一覧</h2>";
for(let t of getAllDisplayTitles()){
let unlocked=playerData.unlockedTitles.includes(t);
html+=`<div class="titleItem">${unlocked?titleHTML(t):"❓？？？"} ${unlocked?`<button onclick="equipTitle('${t}')">装備</button>`:""}</div>`;
}
document.getElementById("panelArea").innerHTML=html;
}
function getTodayKey(){
return new Date().toLocaleDateString("ja-JP",{timeZone:"Asia/Tokyo"});
}
function giveDailyCoinBonus(){
let today=getTodayKey();
if(playerData.lastCoinBonusDate===today)return;
if(!playerData.loginBonusDay)playerData.loginBonusDay=1;
let day=playerData.loginBonusDay;
playerData.coins=(playerData.coins||0)+day;
playerData.lastCoinBonusDate=today;
if(!playerData.loginStampedDays)playerData.loginStampedDays=[];
if(!playerData.loginStampedDays.includes(day))playerData.loginStampedDays.push(day);
playerData.loginBonusDay++;
if(playerData.loginBonusDay>30){
playerData.loginBonusDay=1;
playerData.loginStampedDays=[];
}
saveAllData();
updateHomeStatus();
setTimeout(()=>{
alert(`🎁 ログインコイン ${day}日目！\\n+${day}コイン`);
},300);
}
function gachaPool(){
return [
{title:"計算見習い", rarity:"R"},
{title:"式の旅人", rarity:"R"},
{title:"数字の友達", rarity:"R"},
{title:"ノート職人", rarity:"R"},
{title:"黒板の住人", rarity:"R"},
{title:"朝の計算者", rarity:"R"},
{title:"夜の復習者", rarity:"R"},
{title:"鉛筆戦士", rarity:"R"},
{title:"消しゴム使い", rarity:"R"},
{title:"問題ハンター", rarity:"R"},
{title:"集中ビギナー", rarity:"R"},
{title:"計算マン", rarity:"R"},
{title:"公式メモ係", rarity:"R"},
{title:"数学好き", rarity:"R"},
{title:"理系の卵", rarity:"R"},
{title:"努力家の芽", rarity:"R"},
{title:"復習の民", rarity:"R"},
{title:"一歩前進", rarity:"R"},
{title:"答え探し", rarity:"R"},
{title:"基礎固め", rarity:"R"},
{title:"足し算勇者", rarity:"R"},
{title:"引き算勇者", rarity:"R"},
{title:"かけ算勇者", rarity:"R"},
{title:"割り算勇者", rarity:"R"},
{title:"小さな天才", rarity:"R"},
{title:"計算訓練生", rarity:"R"},
{title:"学習冒険者", rarity:"R"},
{title:"紙とペン", rarity:"R"},
{title:"解答初心者", rarity:"R"},
{title:"式読み", rarity:"R"},
{title:"正解コレクター", rarity:"R"},
{title:"デイリー勢", rarity:"R"},
{title:"数学の入口", rarity:"R"},
{title:"まだまだ成長中", rarity:"R"},
{title:"問題好き", rarity:"R"},
{title:"数字使い", rarity:"R"},
{title:"公式見習い", rarity:"R"},
{title:"計算修行中", rarity:"R"},
{title:"努力の一問", rarity:"R"},
{title:"今日も数学", rarity:"R"},
{title:"式の観察者", rarity:"R"},
{title:"ミスから学ぶ者", rarity:"R"},
{title:"ゆっくり確実", rarity:"R"},
{title:"ペースメーカー", rarity:"R"},
{title:"コツコツ勢", rarity:"R"},
{title:"答え合わせ職人", rarity:"R"},
{title:"基礎の守護者", rarity:"R"},
{title:"小数マスター", rarity:"R"},
{title:"分数チャレンジャー", rarity:"R"},
{title:"符号注意係", rarity:"R"},
{title:"暗算チャレンジ", rarity:"R"},
{title:"式変形入門", rarity:"R"},
{title:"解法メモ", rarity:"R"},
{title:"練習の鬼見習い", rarity:"R"},
{title:"問題集の友", rarity:"R"},
{title:"1問集中", rarity:"R"},
{title:"計算の種", rarity:"R"},
{title:"数学散歩", rarity:"R"},
{title:"黒板係", rarity:"R"},
{title:"積み上げる者", rarity:"R"},
{title:"高速計算士", rarity:"SR"},
{title:"数式ハンター", rarity:"SR"},
{title:"復習マスター", rarity:"SR"},
{title:"公式使い", rarity:"SR"},
{title:"集中の達人", rarity:"SR"},
{title:"努力の結晶", rarity:"SR"},
{title:"解法研究者", rarity:"SR"},
{title:"朝活数学者", rarity:"SR"},
{title:"夜の数学者", rarity:"SR"},
{title:"ミス克服者", rarity:"SR"},
{title:"計算剣士", rarity:"SR"},
{title:"積分探索者", rarity:"SR"},
{title:"微分探索者", rarity:"SR"},
{title:"因数分解職人", rarity:"SR"},
{title:"展開職人", rarity:"SR"},
{title:"素数ハンター", rarity:"SR"},
{title:"連勝チャレンジャー", rarity:"SR"},
{title:"学習継続者", rarity:"SR"},
{title:"青い閃き", rarity:"SR"},
{title:"赤い集中", rarity:"SR"},
{title:"知識の旅人", rarity:"SR"},
{title:"問題突破者", rarity:"SR"},
{title:"式変形の民", rarity:"SR"},
{title:"数学中堅", rarity:"SR"},
{title:"実力上昇中", rarity:"SR"},
{title:"👑ガチャ王👑", rarity:"SSR"},
{title:"🏆伝説の解答者🏆", rarity:"SSR"},
{title:"⚔️数学戦神⚔️", rarity:"SSR"},
{title:"🧠超天才🧠", rarity:"SSR"},
{title:"🔥極限突破🔥", rarity:"SSR"},
{title:"💎王家の数学者💎", rarity:"SSR"},
{title:"🌙夜王🌙", rarity:"SSR"},
{title:"☀️昼王☀️", rarity:"SSR"},
{title:"🎯百発百中🎯", rarity:"SSR"},
{title:"📖知識の王📖", rarity:"SSR"},
{title:"🌈虹の数学神🌈", rarity:"UR"},
{title:"❄️絶対零度❄️", rarity:"UR"},
{title:"🌌宇宙の支配者🌌", rarity:"UR"},
{title:"🔥原初の数式🔥", rarity:"UR"},
{title:"👑究極数学王👑", rarity:"UR"}
];
}
function getGachaResultNoDuplicate(){
let owned=playerData.gachaTitles||[];
let remaining=gachaPool().filter(x=>!owned.includes(x.title));
if(remaining.length===0)return null;
let r=Math.random()*100;
let order=[];
if(r<2)order=["UR","SSR","SR","R"];
else if(r<10)order=["SSR","SR","R","UR"];
else if(r<30)order=["SR","R","SSR","UR"];
else order=["R","SR","SSR","UR"];
for(let rarity of order){
let pool=remaining.filter(x=>x.rarity===rarity);
if(pool.length>0)return pool[Math.floor(Math.random()*pool.length)];
}
return remaining[Math.floor(Math.random()*remaining.length)];
}
function getGachaResult(){
let r=Math.random()*100;
let rarity="R";
if(r<2)rarity="UR";
else if(r<10)rarity="SSR";
else if(r<30)rarity="SR";
let pool=gachaPool().filter(x=>x.rarity===rarity);
return pool[Math.floor(Math.random()*pool.length)];
}
function showGacha(){
document.getElementById("panelArea").innerHTML=`
<h2>🎰 ガチャ</h2>
<div class="profileItem">
<p>所持コイン：${playerData.coins||0}</p>
<p>1回：10コイン</p>
<button onclick="drawGacha()">10コインで引く</button><button onclick="drawGacha10()">100コインで10連</button>
<button onclick="showGachaBook()">ガチャ図鑑を見る</button>
</div>
<div class="profileItem">
<h3>排出率</h3>
<p>R 70% / SR 20% / SSR 8% / UR 2%</p>
<p>称号100個。URのみ色付き。</p>
<p>コマンド称号はガチャから出ません。</p>
</div>
`;
}
function drawGacha(){
if((playerData.coins||0)<10){
alert("コインが足りません");
return;
}
playerData.coins-=10;
let poolAll=gachaPool();
let box=document.getElementById("panelArea");
box.innerHTML=`
<h2>🎰 ガチャ演出中...</h2>
<div id="gachaAnim" class="gachaAnim">???</div>
`;
let count=0;
let anim=setInterval(()=>{
let temp=poolAll[Math.floor(Math.random()*poolAll.length)];
document.getElementById("gachaAnim").innerHTML=titleHTML(temp.title);
count++;
if(count>=25){
clearInterval(anim);
let item=getGachaResultNoDuplicate();
if(!item){alert('ガチャ称号をすべて入手済みです');showGacha();return;}
unlockTitle(item.title);
if(!playerData.gachaTitles)playerData.gachaTitles=[];
if(!playerData.gachaTitles.includes(item.title))playerData.gachaTitles.push(item.title);
unlockAchievement("初ガチャ");
if(item.rarity==="UR"){
unlockAchievement("UR獲得");
document.body.classList.add("urFlash");
setTimeout(()=>document.body.classList.remove("urFlash"),1000);
}
saveAllData();
updateHomeStatus();
box.innerHTML=`
<h2>🎰 ガチャ結果</h2>
<div class="profileItem">
<h2>${item.rarity}</h2>
<h1>${titleHTML(item.title)}</h1>
<p>所持コイン：${playerData.coins||0}</p>
<button onclick="drawGacha()">もう一回引く</button>
<button onclick="showGacha()">ガチャ画面へ</button>
</div>
`;
}
},100);
}
function drawGacha10(){
if((playerData.coins||0)<100){
alert("コインが足りません");
return;
}
playerData.coins-=100;
let results=[];
let hasUR=false;
for(let i=0;i<10;i++){
let item=getGachaResultNoDuplicate();
if(!item){alert('ガチャ称号をすべて入手済みです');showGacha();return;}
results.push(item);
unlockTitle(item.title);
if(!playerData.gachaTitles)playerData.gachaTitles=[];
if(!playerData.gachaTitles.includes(item.title))playerData.gachaTitles.push(item.title);
if(item.rarity==="UR")hasUR=true;
}
unlockAchievement("初ガチャ");
if(hasUR){
unlockAchievement("UR獲得");
document.body.classList.add("urFlash");
setTimeout(()=>document.body.classList.remove("urFlash"),1000);
}
saveAllData();
updateHomeStatus();
let html=`<h2>🎰 10連ガチャ結果</h2>
<div class="profileItem">
<p>所持コイン：${playerData.coins||0}</p>
<button onclick="drawGacha10()">もう一度10連</button>
<button onclick="showGacha()">ガチャ画面へ</button>
</div>`;
for(let item of results){
html+=`<div class="titleItem"><b>${item.rarity}</b><br>${titleHTML(item.title)}</div>`;
}
document.getElementById("panelArea").innerHTML=html;
}
function showGachaBook(){
let pool=gachaPool();
let owned=playerData.gachaTitles||[];
let count=(rarity)=>pool.filter(x=>x.rarity===rarity).length;
let have=(rarity)=>pool.filter(x=>x.rarity===rarity && owned.includes(x.title)).length;
let html=`
<h2>📖 ガチャ図鑑</h2>
<div class="profileItem">
<p>所持数：${owned.length} / ${pool.length}</p>
<p>R：${have("R")} / ${count("R")}</p>
<p>SR：${have("SR")} / ${count("SR")}</p>
<p>SSR：${have("SSR")} / ${count("SSR")}</p>
<p>UR：${have("UR")} / ${count("UR")}</p>
</div>
`;
for(let item of pool){
let got=owned.includes(item.title);
html+=`
<div class="titleItem">
${
got
? "✅ " + titleHTML(item.title)
: "⬜ ？？？"
}
<br>
レアリティ：${item.rarity}
</div>
`;
}
document.getElementById("panelArea").innerHTML=html;
}
function showLoginCalendar(){
let stamped=playerData.loginStampedDays||[];
let next=playerData.loginBonusDay||1;
let html=`
<h2>📅 ログボカレンダー</h2>
<div class="stampItem">
<p>現在の次回ログボ：${next}日目</p>
<p>ログインすると日数分のコインがもらえます。</p>
<div class="stampGrid">
`;
for(let i=1;i<=30;i++){
let done=stamped.includes(i);
html+=`
<div class="stampCell ${done?"stamped":""}">
<b>${i}日目</b><br>
${done?"⭕":"+ "+i+"コイン"}
</div>
`;
}
html+=`
</div>
</div>
`;
document.getElementById("panelArea").innerHTML=html;
}
function prepareDailyMission(){
let today=getTodayKey();
if(playerData.dailyMission.date===today)return;
playerData.dailyMission={
date:today,
missions:[
{id:"correct10",text:"今日10問正解",need:10,count:0,done:false},
{id:"integral5",text:"積分を5問正解",need:5,count:0,done:false},
{id:"combo5",text:"5連勝する",need:5,count:0,done:false}
]
};
saveAllData();
}
function updateMission(type){
prepareDailyMission();
for(let m of playerData.dailyMission.missions||[]){
if(m.done)continue;
if(m.id==="correct10"&&type==="correct")m.count++;
if(m.id==="integral5"&&type==="integral")m.count++;
if(m.id==="combo5"&&combo>=5)m.count=5;
if(m.count>=m.need){
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
html+=`<div class="missionItem">${m.done?"✅":"⬜"} ${m.text}<br>${m.count}/${m.need}<br>報酬：EXP50</div>`;
}
document.getElementById("panelArea").innerHTML=html;
}
function showGuide(){
document.getElementById("panelArea").innerHTML=`
<h2>📖 遊び方</h2>
<div class="guideItem">
<h3>📚 学習モード</h3>
<p>積分・微分・因数分解・素因数分解・展開・四則演算から選べます。</p>
<p>各ジャンルで初級・中級・上級を選択できます。</p>
</div>
<div class="guideItem">
<h3>⚔️ ランキングモード</h3>
<p>HP1でミスするまで続きます。</p>
<p>ランキングにはその週の自己ベストだけ保存されます。</p>
</div>
<div class="guideItem">
<h3>⭐ EXPとレベル</h3>
<p>1問正解ごとに +10EXP。</p>
<p>EXPが100たまるとレベルアップします。</p>
</div>
<div class="guideItem">
<h3>💰 コイン</h3>
<p>1問正解ごとに +1コイン。</p>
<p>ログインボーナスでもコインがもらえます。</p>
</div>
<div class="guideItem">
<h3>🎰 ガチャ</h3>
<p>10コインで1回引けます。</p>
<p>ガチャ称号は100種類。URは5種類のみ色付きです。</p>
</div>
<div class="guideItem">
<h3>🏅 称号</h3><p>称号は1つだけ装備できます。</p>
</div>
<div class="guideItem">
<h3>🤝 フレンド</h3>
<p>プロフィールのフレンドIDを教え合うとフレンド登録できます。</p>
<p>フレンドランキングで友達と比較できます。</p>
</div>
<div class="guideItem">
<h3>⌨️ 専用テンキー</h3>
<p>スマホでもアプリ内ボタンだけで答えを入力できます。</p>
<p>Cは全消し、⌫は1文字削除です。</p>
</div>
`;
}
function showSettings(){
const linked = !!(window.getGoogleLoginInfo && window.getGoogleLoginInfo()) || !!localStorage.getItem("googleLoginUid") || !!localStorage.getItem("googleLoginLinked");
const accountHTML = linked ? `
<div class="settingsItem">
<h3>アカウント連携</h3>
<p id="loginStatus">アカウント連携済み</p>
<p>データは自動でクラウド保存されます。</p>
${serialCampaignLoginHTML()}
<button onclick="forceCloudSave()">💾 手動セーブ</button>
<button onclick="logoutGoogle()">ログアウト</button>
</div>
` : `
<div class="settingsItem">
<h3>アカウント連携</h3>
<p>ログインするとデータが自動保存されます。</p>
<button class="googleLoginBtn" onclick="loginGoogle()">Googleログイン</button>
<p id="loginStatus">未ログイン</p>
</div>
`;
document.getElementById("panelArea").innerHTML=`
<h2>⚙️ 設定</h2>
<div class="settingsItem">
<button onclick="toggleBGM()">🎵 BGM ${settings.bgm?"ON":"OFF"}</button>
<button onclick="toggleSE()">🔊 効果音 ${settings.se?"ON":"OFF"}</button>
</div>
${accountHTML}
`;
refreshLoginStatus();
}
function getProfileBg(){
return playerData.profileBg || "galaxy";
}
function setProfileBg(bg){
playerData.profileBg=bg;
saveAllData();
showProfile();
}
function profileBgName(bg){
return {
galaxy:"🌌 銀河",
lightning:"⚡️ 稲妻",
gold:"👑 王座",
rainbow:"🌈 虹",
ice:"❄️ 氷",
fire:"🔥 炎",
formula:"📚 数式"
}[bg] || bg;
}
function profileBgButtonsHTML(){
const list=["galaxy","lightning","gold","rainbow","ice","fire","formula"];
let html=`<div class="profileBgSelector"><h3>🎨 プロフィール背景</h3><p>現在：${profileBgName(getProfileBg())}</p>`;
for(const bg of list){
html+=`<button class="profileBgBtn" onclick="setProfileBg('${bg}')">${profileBgName(bg)}</button>`;
}
html+=`</div>`;
return html;
}
function getWinRateText(){
const h=playerData.matchHistory||[];
const wins=h.filter(x=>x.result==="win").length;
const losses=h.filter(x=>x.result==="loss").length;
const total=wins+losses;
return total ? Math.round(wins/total*100)+"%" : "0%";
}
function getAccuracyText(){
const total=playerData.totalQuestions||0;
const correct=playerData.totalCorrect||0;
return total ? Math.round(correct/total*100)+"%" : "0%";
}
function getExpPercent(){
const level=getLevel();
const currentExp=playerData.exp||0;
const need=level*100;
return Math.min(100,Math.round((currentExp%need)/need*100));
}
function showProfile(){
const name=playerProfile.name||"名無し";
const title=playerData.equippedTitle||"初心者";
const icon=playerProfile.icon||"";
const level=getLevel();
const exp=playerData.exp||0;
const rate=playerData.rating||1000;
const coin=playerData.coins||0;
const total=playerData.totalQuestions||0;
const maxCombo=playerData.maxCombo||0;
const achievements=(playerData.achievements||[]).length;
const percent=getExpPercent();
let html=`
<h2>👤 プロフィール</h2>
<div class="profileHero bg-${getProfileBg()}">
<div class="profileTop">
<div class="profileAvatarWrap">
${icon?`<img class="profileAvatar" src="${icon}">`:`<div class="profileAvatar"></div>`}
</div>
<div>
<div class="profileName">${name}</div>
<div class="profileTitle">${titleHTML(title)}</div>
<div class="profileLv">Lv.${level}</div>
<div class="profileExpBar"><div class="profileExpFill" style="width:${percent}%"></div></div>
<div>EXP ${exp}</div>
</div>
</div>
<div class="profileStatsGrid">
<div class="profileStat">📚 総回答数 <b>${total}問</b></div>
<div class="profileStat">🎯 正答率 <b>${getAccuracyText()}</b></div>
<div class="profileStat">⚔️ 対戦勝率 <b>${getWinRateText()}</b></div>
<div class="profileStat">🔥 最高連続正解 <b>${maxCombo}問</b></div>
<div class="profileStat">🏆 レート <b>${rate}</b></div>
<div class="profileStat">🪙 コイン <b>${coin}</b></div>
<div class="profileStat">🏅 実績 <b>${achievements}個</b></div>
</div>
</div>
<div class="equipTitles">
<h3>装備中の称号</h3>
<div class="equipTitleGrid">
<div class="equipTitleItem">${titleHTML(title)}</div>
<div class="equipTitleItem">🏆 Season1 TOP100</div>
<div class="equipTitleItem">📚 積分マスター</div>
<div class="equipTitleItem">🔥 連続正解 ${maxCombo}</div>
</div>
</div>
<div class="profileBgSelector">
<h3>プロフィール編集</h3>
<input id="nameInput" placeholder="名前" value="${name}">
<div class="iconPreviewWrap">
<img id="iconPreview" class="iconPreview" src="${icon || ""}">
<br>
<label class="fileInputLabel" for="iconInputEdit">画像を選ぶ</label>
<input id="iconInputEdit" type="file" accept="image/*" onchange="previewProfileIcon()">
</div>
<button onclick="saveProfileFromPanel()">名前・アイコンを保存</button>
<button onclick="showTitles()">称号を変更</button>
<button onclick="showMatchHistory()">対戦履歴</button>
<button onclick="showStatsPage()">成績を見る</button>
</div>
`;
document.getElementById("panelArea").innerHTML=html;
if(typeof ensureHomeButton==="function")ensureHomeButton();
}
function saveProfileName(){
const v=document.getElementById("nameInput").value.trim();
if(!v){alert("名前を入力して");return;}
playerProfile.name=v;
saveAllData();
updateHomeStatus();
showProfile();
}
function showOpponentProfile(data){
const name=data.name||data.hostName||data.guestName||"相手";
const title=data.title||data.hostTitle||data.guestTitle||"初心者";
const level=data.level||1;
const rate=data.rating||1000;
const winRate=data.winRate||"---";
const accuracy=data.accuracy||"---";
document.getElementById("panelArea").innerHTML=`
<h2>相手プロフィール</h2>
<div class="profileHero bg-gold">
<div class="profileTop">
<div class="profileAvatarWrap"><div class="profileAvatar"></div></div>
<div>
<div class="profileName">${name}</div>
<div class="profileTitle">${titleHTML(title)}</div>
<div class="profileLv">Lv.${level}</div>
</div>
</div>
<div class="profileStatsGrid">
<div class="profileStat">🏆 レート <b>${rate}</b></div>
<div class="profileStat">⚔️ 勝率 <b>${winRate}</b></div>
<div class="profileStat">🎯 正答率 <b>${accuracy}</b></div>
<div class="profileStat">🏅 称号 <b>${title}</b></div>
</div>
</div>
`;
if(typeof ensureHomeButton==="function")ensureHomeButton();
}
function showContact(){
document.getElementById("panelArea").innerHTML=`
<h2>📩 お問い合わせ</h2>
<div class="guideItem">
<h3>不具合報告・要望</h3>
<p>バグ、ログイン問題、対戦の不具合、追加してほしい機能はこちらから送ってください。</p>
<button onclick="window.open('https://docs.google.com/forms/d/e/1FAIpQLSfWnEWXYipQy-x5Vn69yrcOPrlHrKCjHvFblvu-he9HqHhnAA/viewform','_blank')">
お問い合わせフォームを開く
</button>
</div>
<div class="guideItem">
<h3>送ると助かる情報</h3>
<p>・何を押したか</p>
<p>・どんなエラーが出たか</p>
<p>・スクショ</p>
<p>・使っている端末</p>
</div>
`;
if(typeof ensureHomeButton==="function")ensureHomeButton();
}
async function savePublicProfile(){
try{
if(window.savePlayerPublicData){
await savePlayerPublicData({
name:playerProfile.name||"名無し",
icon:playerProfile.icon||"",
title:playerData.equippedTitle||"初心者",
level:getLevel(),
bestRandomScore:playerData.bestRandomScore||0
});
}
}catch(e){console.log(e);}
}
function showFriendMenu(){
const friendCode = window.getMyFriendCode ? window.getMyFriendCode() : (window.getMyPlayerId?window.getMyPlayerId():"未取得");
let html=`
<h2>🤝 フレンド</h2>
<div class="friendItem">
<p>あなたのフレンドコード</p>
<input id="myFriendCodeInput" value="${friendCode}" readonly onclick="copyMyFriendCode()">
<button onclick="copyMyFriendCode()">コピー</button>
<p style="font-size:14px;opacity:.85;">タップするとコピーできます。</p>
</div>
<div class="friendItem">
<input id="friendIdInput" placeholder="フレンドコード 例：A7K4-P2X9">
<button onclick="addFriend()">追加</button>
</div>
<div id="friendListArea"></div>
<button onclick="showFriendRanking()">🏆 フレンドランキング</button>
`;
document.getElementById("panelArea").innerHTML=html;
renderFriendList();
}
function copyMyFriendCode(){
const code = window.getMyFriendCode ? window.getMyFriendCode() : "";
if(!code || code==="未取得"){alert("ログインするとフレンドコードが発行されます");return;}
const plain = code.replace(/-/g,"");
if(navigator.clipboard && navigator.clipboard.writeText){
navigator.clipboard.writeText(plain).then(()=>alert("フレンドコードをコピーしました："+code)).catch(()=>alert("コピーできませんでした。長押しでコピーしてください。"));
}else{
const input=document.getElementById("myFriendCodeInput");
if(input){input.select();document.execCommand("copy");alert("フレンドコードをコピーしました："+code);}
}
}
async function addFriend(){
let id=document.getElementById("friendIdInput").value.trim().replace(/-/g,"").toUpperCase();
if(!id){alert("IDを入力して");return;}
if(playerData.friends.some(f=>(typeof f==="string"?f:f.id)===id)){alert("追加済み");return;}
let data=null;
try{data=await loadFriendData(id);}catch(e){}
playerData.friends.push({id:id,name:data?data.name:id});
saveAllData();
renderFriendList();
}
function removeFriend(id){
playerData.friends=playerData.friends.filter(f=>(typeof f==="string"?f:f.id)!==id);
saveAllData();
renderFriendList();
}
async function renderFriendList(){
let area=document.getElementById("friendListArea");
if(!area)return;
let html=playerData.friends.length===0?"<p>フレンドなし</p>":"";
for(let f of playerData.friends){
let id=typeof f==="string"?f:f.id;
let data=null;
try{data=await loadFriendData(id);}catch(e){}
if(data){
html+=`
<div class="friendItem">
${data.icon?`<img class="rankIcon" src="${data.icon}">`:""}
${data.name}<br>
${titleHTML(data.title||"初心者")}<br>
Lv${data.level||1}<br>
<button onclick="removeFriend('${id}')">削除</button>
</div>
`;
}else{
html+=`
<div class="friendItem">
${(typeof f==="string"?id:f.name)||id}<br>
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
for(let f of playerData.friends){
let id=typeof f==="string"?f:f.id;
let data=await loadFriendData(id);
if(data)list.push(data);
}
}catch(e){console.log(e);}
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
${list[i].icon?`<img class="rankIcon" src="${list[i].icon}">`:""}
${list[i].name}<br>
${titleHTML(list[i].title||"初心者")}<br>
Lv${list[i].level||1}<br>
スコア：${list[i].bestRandomScore||0}
</div>
`;
}
document.getElementById("panelArea").innerHTML=html;
}
function aiExplain(q){
q=String(q);
if(q.includes("∫"))return"積分は、基本的に次数を1つ上げて、その新しい次数で割ります。";
if(q.includes("d/dx"))return"微分は、次数を前に出して、次数を1つ下げます。";
if(q.includes("因数分解"))return"足して真ん中、かけて最後になる数を探します。";
if(q.includes("素因数分解"))return"2、3、5、7のような小さい素数から割ります。";
return"式の形を見て、使える公式を確認しましょう。";
}
function addReviewItem(q){
if(!q)return;
if(playerData.reviewList.some(x=>x.q===q.q))return;
playerData.reviewList.unshift({
q:q.q,
a:q.display,
explanation:q.explanation||"解説はありません",
ai:aiExplain(q.q),
original:q
});
playerData.reviewList=playerData.reviewList.slice(0,10);
saveAllData();
}
function showReviewList(){
let html="<h2>📚 復習リスト</h2>";
if(playerData.reviewList.length===0)html+="<p>まだありません</p>";
for(let i=0;i<playerData.reviewList.length;i++){
let r=playerData.reviewList[i];
html+=`
<div class="reviewItem">
<p>${i+1}. ${r.q}</p>
<p>正解：${r.a}</p>
<button onclick="alert('${String(r.explanation).replace(/'/g,"\\'")}')">解説</button>
<button onclick="alert('${String(r.ai).replace(/'/g,"\\'")}')">🤖AI解説</button>
<button onclick="retryReview(${i})">再挑戦</button>
<button onclick="postReviewToBoard(${i})">💬 掲示板へ投稿</button>
</div>
`;
}
document.getElementById("panelArea").innerHTML=html;
}
function retryReview(i){
setInputVisible(true);
let r=playerData.reviewList[i];
if(!r)return;
current={
q:r.q,
a:r.original?r.original.a:r.a,
display:r.a,
explanation:r.explanation
};
mode="review";
document.getElementById("homeScreen").classList.remove("active");
document.getElementById("gameScreen").classList.add("active");
document.getElementById("modeTitle").innerText="📚 復習モード";
document.getElementById("result").innerHTML="";
current=cleanQuestionObject(current);
document.getElementById("q").innerText=cleanMathExpression(current.q);
document.getElementById("ans").value="";
updateHP();
showComboDamage();
}
function recordPlayDay(){
let today=getTodayKey();
if(!playerData.lastPlayDate){
playerData.lastPlayDate=today;
playerData.consecutiveDays=1;
return;
}
if(playerData.lastPlayDate===today)return;
let yesterday=new Date();
yesterday.setDate(yesterday.getDate()-1);
let y=yesterday.toLocaleDateString("ja-JP",{timeZone:"Asia/Tokyo"});
playerData.consecutiveDays=(playerData.lastPlayDate===y)?playerData.consecutiveDays+1:1;
playerData.lastPlayDate=today;
}
function showStudyMenu(){
document.getElementById("panelArea").innerHTML=`
<h2>📚 学習モード</h2>
<button class="modeBtn" onclick="selectDifficulty('integral')">積分</button>
<button class="modeBtn" onclick="selectDifficulty('derivative')">微分</button>
<button class="modeBtn" onclick="selectDifficulty('factor')">因数分解</button>
<button class="modeBtn" onclick="selectDifficulty('prime')">素因数分解</button>
<button class="modeBtn" onclick="selectDifficulty('expand')">展開</button>
<button class="modeBtn" onclick="selectDifficulty('arithmetic')">四則演算</button>
`;
}
function selectDifficulty(m){
mode=m;
document.getElementById("panelArea").innerHTML=`
<h2>難易度選択</h2>
<button class="modeBtn" onclick="startMode('easy')">🟢 初級</button>
<button class="modeBtn" onclick="startMode('normal')">🟡 中級</button>
<button class="modeBtn" onclick="startMode('hard')">🔴 上級</button>
<button class="modeBtn hardBtn" onclick="startMode('veryHard')">🔥 難問</button>
`;
}
function startMode(diff){
difficulty=diff;
openGame();
start();
}
function selectRankingMode(){
mode="random";
difficulty="hard";
openGame();
start();
}
function openGame(){
document.getElementById("homeScreen").classList.remove("active");
document.getElementById("gameScreen").classList.add("active");
let title="⚔️ 積分バトル ⚔️";
if(mode==="derivative")title="⚔️ 微分バトル ⚔️";
if(mode==="factor")title="⚔️ 因数分解バトル ⚔️";
if(mode==="prime")title="⚔️ 素因数分解バトル ⚔️";
if(mode==="expand")title="⚔️ 展開バトル ⚔️";
if(mode==="arithmetic")title="⚔️ 四則演算バトル ⚔️";
if(mode==="random")title="⚔️ ランキングモード ⚔️";
document.getElementById("modeTitle").innerText=title;
renderEnemyMob();
}
function backHome(){
if(matchState && matchState.active && matchState.roomId){try{leaveMatchRoom(matchState.roomId,matchState.side);}catch(e){}}
if(typeof updateSurrenderButton==='function')updateSurrenderButton();
if(matchState && matchState.poll){clearInterval(matchState.poll);matchState.poll=null;matchState.active=false;}
closePanelPage();
setInputVisible(true);
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
if(typeof updateSurrenderButton==='function')updateSurrenderButton();
setInputVisible(true);
history=[];
usedQuestions=[];
score=0;
combo=0;
playStartTime=Date.now();
document.getElementById("result").innerHTML="";
document.getElementById("q").innerText="START";
recordPlayDay();
if(mode==="random"){
enemyHP=9999;
playerHP=1;
}else{
enemyHP=10;
playerHP=5;
}
updateHP();
nextQ();
let bgm=document.getElementById("bgm");
bgm.volume=.2;
if(settings.bgm)bgm.play();
}
function updatePlayTime(){
if(playStartTime){
let sec=Math.floor((Date.now()-playStartTime)/1000);
playerData.playTime+=sec;
playStartTime=0;
saveAllData();
}
}
function generateQuestion(){
if(mode==="integral")return generateIntegral();
if(mode==="derivative")return generateDerivative();
if(mode==="factor")return generateFactor();
if(mode==="prime")return generatePrime();
if(mode==="expand")return generateExpand();
if(mode==="arithmetic")return generateArithmetic();
if(mode==="random"){
let r=rand(1,5);
if(r===1)return generateIntegral();
if(r===2)return generateDerivative();
if(r===3)return generateFactor();
if(r===4)return generatePrime();
if(r===5)return generateExpand();
}
}
function generateArithmetic(){
let max=difficulty==="easy"?30:difficulty==="normal"?100:300;
let type=difficulty==="hard"?rand(1,6):rand(1,4);
let a=rand(1,max), b=rand(1,max);
if(type===1)return{q:`${a}+${b}`,a:`${a+b}`,display:`${a+b}`,explanation:"足し算です。"};
if(type===2){
if(a<b)[a,b]=[b,a];
return{q:`${a}-${b}`,a:`${a-b}`,display:`${a-b}`,explanation:"引き算です。"};
}
if(type===3){
a=rand(2,difficulty==="easy"?9:20);
b=rand(2,difficulty==="easy"?9:20);
return{q:`${a}×${b}`,a:`${a*b}`,display:`${a*b}`,explanation:"かけ算です。"};
}
if(type===4){
b=rand(2,difficulty==="easy"?9:20);
let ans=rand(2,difficulty==="easy"?9:20);
a=b*ans;
return{q:`${a}÷${b}`,a:`${ans}`,display:`${ans}`,explanation:"割り算です。"};
}
if(type===5){
let c=rand(2,20);
return{q:`(${a}+${b})×${c}`,a:`${(a+b)*c}`,display:`${(a+b)*c}`,explanation:"かっこの中を先に計算します。"};
}
let c=rand(2,20);
let ans=rand(2,20);
let total=(a+b)*ans;
return{q:`${total}÷(${a}+${b})`,a:`${ans}`,display:`${ans}`,explanation:"かっこの中を先に計算します。"};
}
function generateIntegral(){
if(difficulty==="veryHard")return generateHardIntegralQuestion();
let type=difficulty==="easy"?rand(1,3):difficulty==="normal"?rand(1,8):rand(1,12);
if(type===1){
let a=rand(1,8), n=rand(1,6), ans=a/(n+1);
return{q:`∫ ${coeff(a)}${qPower(n)} dx`,a:`${ans}*x^${n+1}`,display:`${term(ans,n+1)}+C`,explanation:"べき乗の積分公式を使います。"};
}
if(type===2){
let a=rand(-6,6), b=rand(-6,6), c=rand(-6,6);
if(a===0&&b===0&&c===0)a=1;
let display=`${term(a/3,3)}+${term(b/2,2)}+${term(c,1)}+C`
.replace(/\+\-/g,"-").replace(/\+\+/g,"+").replace(/^\+/,"");
return{q:`∫ (${coeff(a)}x²${b>=0?"+":""}${coeff(b)}x${c>=0?"+":""}${c}) dx`,a:`${a/3}*x^3+${b/2}*x^2+${c}*x`,display,explanation:"多項式は項ごとに積分します。"};
}
if(type===3){
let l=rand(0,3), r=rand(l+1,l+5), a=rand(1,6), n=rand(1,5);
let ans=(a/(n+1))*(Math.pow(r,n+1)-Math.pow(l,n+1));
return{q:`∫[${l}→${r}] ${coeff(a)}${qPower(n)} dx`,a:`${ans}`,display:frac(ans),explanation:"不定積分して上端と下端を代入します。"};
}
if(type===4){
let a=rand(1,6), k=rand(1,5);
return{q:`∫ ${coeff(a)}sin(${k===1?"x":k+"x"}) dx`,a:`-${a}*cos(${k}*x)/${k}`,display:`-${frac(a/k)}cos(${k===1?"x":k+"x"})+C`,explanation:"sin(kx)の積分は -cos(kx)/k です。"};
}
if(type===5){
let a=rand(1,6), k=rand(1,5);
return{q:`∫ ${coeff(a)}cos(${k===1?"x":k+"x"}) dx`,a:`${a}*sin(${k}*x)/${k}`,display:`${frac(a/k)}sin(${k===1?"x":k+"x"})+C`,explanation:"cos(kx)の積分は sin(kx)/k です。"};
}
if(type===6){
let a=rand(1,6), k=rand(1,5);
return{q:`∫ ${coeff(a)}e^(${k===1?"x":k+"x"}) dx`,a:`${a}*exp(${k}*x)/${k}`,display:`${frac(a/k)}e^(${k===1?"x":k+"x"})+C`,explanation:"e^(kx)の積分は e^(kx)/k です。"};
}
if(type===7){
let a=rand(1,5), b=rand(-5,5), n=rand(2,5), bottom=a*(n+1);
return{q:`∫ (${a}x${b>=0?"+":""}${b})^${n} dx`,a:`(${a}*x+${b})^${n+1}/${bottom}`,display:`(${a}x${b>=0?"+":""}${b})^${n+1}/${bottom}+C`,explanation:"置換積分です。"};
}
if(type===8){
let a=rand(1,6);
return{q:`∫ ${a}/x dx`,a:`${a}*log(x)`,display:`${a}log(x)+C`,explanation:"1/xの積分はlog(x)です。"};
}
if(type===9){
let a=rand(1,5);
return{q:`∫ ${a}√x dx`,a:`${a*2/3}*x^(3/2)`,display:`${frac(a*2/3)}x^(3/2)+C`,explanation:"√xをx^(1/2)に直します。"};
}
if(type===10){
let a=rand(1,5);
return{q:`∫ ${a}/x² dx`,a:`-${a}/x`,display:`-${a}/x+C`,explanation:"x^(-2)として積分します。"};
}
if(type===11){
return{q:`∫ tan(x) dx`,a:`-log(cos(x))`,display:`-log(cos(x))+C`,explanation:"tan(x)=sin(x)/cos(x)を使います。"};
}
return{q:`∫ 1/(x²+1) dx`,a:`atan(x)`,display:`arctan(x)+C`,explanation:"1/(x²+1)の積分はarctan(x)です。"};
}
function generateDerivative(){
let type=difficulty==="easy"?rand(1,3):difficulty==="normal"?rand(1,9):rand(1,14);
if(type===1){
let a=rand(1,8), n=rand(2,8), ansC=a*n;
return{q:`d/dx ${coeff(a)}${qPower(n)}`,a:`${ansC}*x^${n-1}`,display:`${term(ansC,n-1)}`,explanation:"x^nの微分はnx^(n-1)です。"};
}
if(type===2){
let a=rand(-6,6), b=rand(-6,6), c=rand(-6,6);
if(a===0&&b===0)a=1;
let display=`${term(3*a,2)}+${term(2*b,1)}+${c}`
.replace(/\+\-/g,"-").replace(/\+\+/g,"+").replace(/^\+/,"");
return{q:`d/dx (${coeff(a)}x³${b>=0?"+":""}${coeff(b)}x²${c>=0?"+":""}${c}x)`,a:`${3*a}*x^2+${2*b}*x+${c}`,display,explanation:"多項式は項ごとに微分します。"};
}
if(type===3){
let a=rand(1,6), k=rand(1,5);
return{q:`d/dx ${coeff(a)}sin(${k===1?"x":k+"x"})`,a:`${a*k}*cos(${k}*x)`,display:`${coeff(a*k)}cos(${k===1?"x":k+"x"})`,explanation:"sin(kx)の微分はkcos(kx)です。"};
}
if(type===4){
let a=rand(1,6), k=rand(1,5);
return{q:`d/dx ${coeff(a)}cos(${k===1?"x":k+"x"})`,a:`-${a*k}*sin(${k}*x)`,display:`-${coeff(a*k)}sin(${k===1?"x":k+"x"})`,explanation:"cos(kx)の微分は-ksin(kx)です。"};
}
if(type===5){
let a=rand(1,6), k=rand(1,5);
return{q:`d/dx ${coeff(a)}e^(${k===1?"x":k+"x"})`,a:`${a*k}*exp(${k}*x)`,display:`${coeff(a*k)}e^(${k===1?"x":k+"x"})`,explanation:"e^(kx)の微分はke^(kx)です。"};
}
if(type===6){
let a=rand(2,6), b=rand(-5,5), n=rand(2,5);
return{q:`d/dx (${a}x${b>=0?"+":""}${b})^${n}`,a:`${n*a}*(${a}*x+${b})^${n-1}`,display:`${n*a}(${a}x${b>=0?"+":""}${b})^${n-1}`,explanation:"合成関数の微分です。"};
}
if(type===7)return{q:`d/dx √x`,a:`1/(2*sqrt(x))`,display:`1/(2√x)`,explanation:"√xはx^(1/2)です。"};
if(type===8)return{q:`d/dx 1/x`,a:`-1/x^2`,display:`-1/x^2`,explanation:"1/xはx^(-1)です。"};
if(type===9){
let a=rand(1,5);
return{q:`d/dx ${a}log(x)`,a:`${a}/x`,display:`${a}/x`,explanation:"log(x)の微分は1/xです。"};
}
if(type===10)return{q:`d/dx tan(x)`,a:`1/cos(x)^2`,display:`1/cos(x)^2`,explanation:"tan(x)の微分は1/cos²xです。"};
if(type===11){
let a=rand(1,5);
return{q:`d/dx ${a}x^(3/2)`,a:`${a*3/2}*sqrt(x)`,display:`${frac(a*3/2)}√x`,explanation:"x^(3/2)を微分します。"};
}
if(type===12)return{q:`d/dx (x+1)(x-1)`,a:`2*x`,display:`2x`,explanation:"展開してx²-1にします。"};
if(type===13){
let a=rand(1,5), b=rand(1,5);
return{q:`d/dx (x+${a})(x+${b})`,a:`2*x+${a+b}`,display:`2x+${a+b}`,explanation:"展開してから微分します。"};
}
return{q:`d/dx 1/(x+1)`,a:`-1/(x+1)^2`,display:`-1/(x+1)^2`,explanation:"合成関数として微分します。"};
}
function generateFactor(){
let type=difficulty==="easy"?rand(1,2):difficulty==="normal"?rand(1,5):rand(1,8);
if(type===1){
let a=rand(1,8), b=rand(1,8);
return{q:`x²+${a+b}x+${a*b} を因数分解`,a:`(x+${a})*(x+${b})`,display:`(x+${a})(x+${b})`,explanation:`足して${a+b}、かけて${a*b}になる数を探します。`};
}
if(type===2){
let a=rand(1,8), b=rand(1,8);
return{q:`x²-${a+b}x+${a*b} を因数分解`,a:`(x-${a})*(x-${b})`,display:`(x-${a})(x-${b})`,explanation:`足して-${a+b}、かけて${a*b}になる数を探します。`};
}
if(type===3){
let a=rand(1,8), b=rand(1,8);
return{q:`x²+${b-a}x-${a*b} を因数分解`,a:`(x-${a})*(x+${b})`,display:`(x-${a})(x+${b})`,explanation:`かけて負、足して${b-a}になる組を探します。`};
}
if(type===4){
let a=rand(2,9);
return{q:`x²-${a*a} を因数分解`,a:`(x-${a})*(x+${a})`,display:`(x-${a})(x+${a})`,explanation:"平方差を使います。"};
}
if(type===5){
let a=rand(2,9), b=rand(1,9);
return{q:`${a}x+${a*b} を因数分解`,a:`${a}*(x+${b})`,display:`${a}(x+${b})`,explanation:"共通因数でくくります。"};
}
if(type===6){
let a=rand(1,5), b=rand(1,5);
return{q:`x³+${a+b}x²+${a*b}x を因数分解`,a:`x*(x+${a})*(x+${b})`,display:`x(x+${a})(x+${b})`,explanation:"まずxでくくります。"};
}
if(type===7){
let a=rand(1,5);
return{q:`x³-${a*a*a} を因数分解`,a:`(x-${a})*(x^2+${a}*x+${a*a})`,display:`(x-${a})(x²+${a}x+${a*a})`,explanation:"立方差の公式です。"};
}
let a=rand(1,5);
return{q:`x³+${a*a*a} を因数分解`,a:`(x+${a})*(x^2-${a}*x+${a*a})`,display:`(x+${a})(x²-${a}x+${a*a})`,explanation:"立方和の公式です。"};
}
function isPrime(n){
if(n<2)return false;
for(let i=2;i*i<=n;i++)if(n%i===0)return false;
return true;
}
function primeFactors(n){
let arr=[];
let d=2;
while(n>1){
while(n%d===0){
arr.push(d);
n=n/d;
}
d++;
}
return arr;
}
function formatPrimeDisplay(factors){
let counts={};
for(let f of factors)counts[f]=(counts[f]||0)+1;
let compact=Object.keys(counts)
.map(k=>counts[k]===1?k:`${k}^${counts[k]}`)
.join("×");
let expanded=factors.join("×");
if(compact===expanded)return expanded;
return `${compact}（${expanded}）`;
}
function generatePrime(){
let primes=difficulty==="easy"?[2,3,5]:difficulty==="normal"?[2,3,5,7]:[2,3,5,7,11,13];
let count=difficulty==="easy"?rand(2,3):rand(2,5);
let num=1;
for(let i=0;i<count;i++)num*=primes[rand(0,primes.length-1)];
let factors=primeFactors(num);
return{q:`${num} を素因数分解`,a:factors.join("*"),display:formatPrimeDisplay(factors),number:num,explanation:`小さい素数から順に割ると ${factors.join("×")} です。`};
}
function checkPrimeAnswer(input,number){
try{
let s=input.replace(/\s/g,"").replace(/×/g,"*").replace(/·/g,"*");
if(s==="")return false;
let parts=s.split("*");
let nums=[];
for(let part of parts){
if(part==="")return false;
if(part.includes("^")){
let tmp=part.split("^");
if(tmp.length!==2)return false;
let base=Number(tmp[0]);
let power=Number(tmp[1]);
if(!Number.isInteger(base))return false;
if(!Number.isInteger(power))return false;
if(!isPrime(base))return false;
if(power<1)return false;
for(let i=0;i<power;i++)nums.push(base);
}else{
let n=Number(part);
if(!Number.isInteger(n))return false;
if(!isPrime(n))return false;
nums.push(n);
}
}
return nums.reduce((a,b)=>a*b,1)===number;
}catch(e){
return false;
}
}
function generateExpand(){
let type=difficulty==="easy"?rand(1,3):difficulty==="normal"?rand(1,6):rand(1,8);
if(type===1){
let a=rand(1,8), b=rand(1,8);
return{q:`(x+${a})(x+${b}) を展開`,a:`x^2+${a+b}*x+${a*b}`,display:`x^2+${a+b}x+${a*b}`,explanation:"展開します。"};
}
if(type===2){
let a=rand(1,8), b=rand(1,8);
return{q:`(x-${a})(x-${b}) を展開`,a:`x^2-${a+b}*x+${a*b}`,display:`x^2-${a+b}x+${a*b}`,explanation:"符号に注意します。"};
}
if(type===3){
let a=rand(1,8);
return{q:`(x+${a})² を展開`,a:`x^2+${2*a}*x+${a*a}`,display:`x^2+${2*a}x+${a*a}`,explanation:"(x+a)²を使います。"};
}
if(type===4){
let a=rand(1,8);
return{q:`(x-${a})² を展開`,a:`x^2-${2*a}*x+${a*a}`,display:`x^2-${2*a}x+${a*a}`,explanation:"(x-a)²を使います。"};
}
if(type===5){
let a=rand(1,8);
return{q:`(x+${a})(x-${a}) を展開`,a:`x^2-${a*a}`,display:`x^2-${a*a}`,explanation:"和と差の積です。"};
}
if(type===6){
let a=rand(1,5), b=rand(1,5);
return{q:`(x+${a})(x²+${b}x+1) を展開`,a:`x^3+${a+b}*x^2+${a*b+1}*x+${a}`,display:`x^3+${a+b}x^2+${a*b+1}x+${a}`,explanation:"分配法則で展開します。"};
}
if(type===7){
let a=rand(1,5);
return{q:`(x+${a})³ を展開`,a:`x^3+${3*a}*x^2+${3*a*a}*x+${a*a*a}`,display:`x^3+${3*a}x^2+${3*a*a}x+${a*a*a}`,explanation:"三乗の公式です。"};
}
let a=rand(1,5);
return{q:`(x-${a})³ を展開`,a:`x^3-${3*a}*x^2+${3*a*a}*x-${a*a*a}`,display:`x^3-${3*a}x^2+${3*a*a}x-${a*a*a}`,explanation:"三乗の公式です。"};
}
function expressionsEqual(user,correct){
try{
let u=normalize(user);
let c=normalize(correct);
let values=[-3,-2,-1,1,2,3,4];
for(let x of values){
let uv=math.evaluate(u,{x:x});
let cv=math.evaluate(c,{x:x});
if(Math.abs(uv-cv)>1e-8)return false;
}
return true;
}catch(e){
return false;
}
}
function nextQ(){
clearHint();
let count=0;
do{
current=cleanQuestionObject(generateQuestion());
count++;
}while(usedQuestions.includes(current.q)&&count<100);
usedQuestions.push(current.q);
let q=document.getElementById("q");
let go=document.getElementById("goText");
q.innerText="";
document.getElementById("ans").value="";
go.classList.remove("goAnim");
q.classList.remove("questionAnim");
void go.offsetWidth;
void q.offsetWidth;
setTimeout(()=>{
go.classList.add("goAnim");
setTimeout(()=>{
q.innerText=cleanMathExpression(current.q);
q.classList.add("questionAnim");
},300);
},200);
}
async function submit(){
if(!current)return;
let u=document.getElementById("ans").value.trim();
if(matchState && matchState.active){
await submitMatchAnswer(u);
return;
}
if(u===""){
alert("答えを入力して");
return;
}
if(u==="admin9671")u=current.display;
let ok=false;
if(mode==="prime")ok=checkPrimeAnswer(u,current.number);
if(!ok)ok=expressionsEqual(u,current.a);
if(!ok)ok=normalize(u)===normalize(current.display);
playerData.totalQuestions++;
recordGenreResult(mode,ok);
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
showComboPop();
playerData.totalCorrect++;
addExp(10);
playerData.coins=(playerData.coins||0)+1;
if(combo>playerData.maxCombo)playerData.maxCombo=combo;
updateMission("correct");
if(mode==="integral")updateMission("integral");
if(mode!=="random"&&mode!=="review")enemyHP-=comboDamageValue(combo);
if(enemyHP<0)enemyHP=0;
if(settings.se)document.getElementById("se_correct").play();
document.getElementById("result").innerHTML=`○ 正解！<br>正解：${current.display}<br>+10EXP / +1コイン`;
}else{
combo=0;
addReviewItem(current);
if(mode==="random"){
finishRandom();
return;
}
if(mode!=="review")playerHP--;
if(settings.se)document.getElementById("se_wrong").play();
document.getElementById("result").innerHTML=`
× 不正解<br>
正解：${current.display}
<br><br>
📖 ${current.explanation}
<br><br>
🤖 ${aiExplain(current.q)}
`;
}
checkTitles();
checkAchievements();
saveAllData();
updateHP();
updateHomeStatus();
nextTurn();
}
async function finishRandom(){
updatePlayTime();
if(score>playerData.bestRandomScore)playerData.bestRandomScore=score;
checkTitles();
checkAchievements();
saveAllData();
try{
await saveWorldScore({
name:playerProfile.name||"名無し",
icon:playerProfile.icon||"",
score:score,
title:playerData.equippedTitle||"初心者",
level:getLevel(),
mode:"random"
});
}catch(e){
console.log(e);
}
await savePublicProfile();
showEnd("終了！");
}
function updateHP(){
let e=document.getElementById("ehp");
let p=document.getElementById("php");
if(e)e.innerText=enemyHP;
if(p)p.innerText=playerHP;
if(mode==="random"){
document.getElementById("enemy").style.display="none";
document.getElementById("enemyFrame").style.display="none";
document.getElementById("player").style.display="none";
document.getElementById("playerFrame").style.display="none";
let status=document.getElementById("scoreStatus");
if(status)status.innerHTML=`スコア：${score}　連勝：${combo}　残機：1`;
return;
}
if(mode==="review"){
document.getElementById("enemy").style.display="none";
document.getElementById("enemyFrame").style.display="none";
document.getElementById("player").style.display="none";
document.getElementById("playerFrame").style.display="none";
return;
}
let status=document.getElementById("scoreStatus");
if(status)status.innerHTML="";
document.getElementById("enemy").style.display="block";
document.getElementById("enemyFrame").style.display="block";
document.getElementById("player").style.display="block";
document.getElementById("playerFrame").style.display="block";
document.getElementById("enemyBar").style.width=(enemyHP/10*100)+"%";
document.getElementById("playerBar").style.width=(playerHP/5*100)+"%";
}
function nextTurn(){
if(mode==="review")return;
if(mode!=="random"){
if(enemyHP<=0){
playEnemyDefeat();
setTimeout(()=>showEnd("勝利！"),450);
return;
}
if(playerHP<=0){
showEnd("敗北...");
return;
}
}
setTimeout(()=>nextQ(),800);
}
function showEnd(text){
updatePlayTime();
showResultPage(text);
}
async function showWorldRanking(){
let box=document.getElementById("panelArea");
box.innerHTML="<h2>読み込み中...</h2>";
try{
let ranking=await loadWorldRanking();
let myName=playerProfile.name||"名無し";
let myBest=playerData.bestRandomScore||0;
let myRank="-";
for(let i=0;i<ranking.length;i++){
if((ranking[i].score||0)===myBest && (ranking[i].name||"名無し")===myName){
myRank=i+1;
break;
}
}
let html=`<h2>🌍 週間ランキング</h2>
<div class="profileItem">
<h3>あなたの順位</h3>
<p>順位：${myRank}位</p>
<p>自己ベスト：${myBest}問</p>
</div>`;
if(ranking.length===0)html+="<p>まだ記録がありません</p>";
for(let i=0;i<ranking.length;i++){
html+=`<div class="rankItem">${i+1}位 ${ranking[i].icon?`<img class="rankIcon" src="${ranking[i].icon}">`:""}${ranking[i].name}<br>${titleHTML(ranking[i].title||"初心者")}<br>Lv${ranking[i].level||1}<br>${ranking[i].score}問</div>`;
}
box.innerHTML=html;
ensureHomeButton();
ensurePanelBackButton();
}catch(e){
box.innerHTML="<p>ランキング取得失敗</p>";
ensureHomeButton();
ensurePanelBackButton();
}
}
function showResultPage(text){
setInputVisible(false);
document.getElementById("gameScreen").classList.remove("active");
document.getElementById("homeScreen").classList.remove("active");
document.getElementById("resultScreen").classList.add("active");
setTimeout(ensureHomeButton,0);
document.getElementById("resultSummary").innerHTML=`
<div class="profileItem">
<h2>${text}</h2>
<p>スコア：${score}</p>
<p>正解数：${history.filter(h=>h.ok).length}</p>
<p>問題数：${history.length}</p>
<button class="resultBtn" onclick="restartFromResult()">もう一回</button>
<button class="resultBtn" onclick="backHomeFromResult()">ホームへ</button>
</div>
`;
let html="<h2>解いた問題一覧</h2>";
for(let h of history){
html+=`<div class="rankItem">${h.ok?"○":"×"}<br>問題：${fixFormulaSigns(h.question)}<br>あなた：${h.your}<br>正解：${fixFormulaSigns(h.answer)}</div>`;
}
document.getElementById("resultList").innerHTML=html;
}
function restartFromResult(){
document.getElementById("resultScreen").classList.remove("active");
document.getElementById("gameScreen").classList.add("active");
setInputVisible(true);
start();
}
function backHomeFromResult(){
document.getElementById("resultScreen").classList.remove("active");
document.getElementById("homeScreen").classList.add("active");
setInputVisible(true);
checkTitles();
checkAchievements();
saveAllData();
savePublicProfile();
updateHomeStatus();
}
function showRankingMenu(){
document.getElementById("panelArea").innerHTML=`
<h2>🏆 ランキング</h2>
<button class="modeBtn" onclick="showWorldRanking()">🌍 週間ランキング</button>
<button class="modeBtn" onclick="selectRankingMode()">🏆 週間ランキングモードで遊ぶ</button>
<button class="modeBtn" onclick="showFriendRanking()">🤝 フレンドランキング</button>
<button class="modeBtn" onclick="showRateRanking()">🏅 レートランキング</button>
`;
}
function showMatchMenu(){
document.getElementById("panelArea").innerHTML=`
<h2>⚔️ 対戦</h2>
<button class="modeBtn" onclick="selectRankingMode()">🏆 週間ランキングモード</button>
<button class="modeBtn" onclick="showOnlineMatchMenu()">⚔️ ランダムマッチ</button>
<button class="modeBtn" onclick="showFriendMatchMenu()">🤝 フレンドマッチ</button>
<button class="modeBtn" onclick="showMatchHistory()">📜 対戦履歴</button><button class="modeBtn" onclick="showGenreStats()">📊 ジャンル別正答率</button>
<div class="matchBox">
<p>週間ランキングモード：1ミスで終了。自己ベストをランキングに保存。</p>
<p>対戦ルール：1問先に正解した方が1ポイント。3ポイント先取で勝ち。</p>
</div>
`;
ensureHomeButton();
}
function showProfileMenu(){
document.getElementById("panelArea").innerHTML=`
<h2>👤 プロフィール</h2>
<button class="modeBtn" onclick="showProfile()">👤 プロフィール編集</button>
<button class="modeBtn" onclick="showTitles()">🏅 称号一覧</button>
<button class="modeBtn" onclick="showAchievements()">🏆 実績一覧</button>
<button class="modeBtn" onclick="showFriendMenu()">🤝 フレンド</button>
<button class="modeBtn" onclick="showReviewList()">📚 復習リスト</button><button class="modeBtn" onclick="showMatchHistory()">📜 対戦履歴</button>
`;
}
function showOtherMenu(){
document.getElementById("panelArea").innerHTML=`
<h2>⚙️ その他</h2>
<button class="modeBtn" onclick="showNewsPage()">📢 お知らせ</button><button class="modeBtn" onclick="showStatsPage()">📊 成績</button><button class="modeBtn" onclick="showGuide()">📖 遊び方</button>
<button class="modeBtn" onclick="showDailyMission()">🎯 デイリーミッション</button>
<button class="modeBtn" onclick="showLoginCalendar()">📅 ログボカレンダー</button>
<button class="modeBtn" onclick="showSerialCodePage()">🎁 シリアルコード</button>
<button class="modeBtn" onclick="showSettings()">⚙️ 設定</button>
<button class="modeBtn" onclick="showContact()">📩 お問い合わせ</button>
`;
}
async function showRateRanking(){
let box=document.getElementById("panelArea");
box.innerHTML="<h2>読み込み中...</h2>";
try{
let list=await loadRateRanking();
let html="<h2>🏅 レートランキング</h2>";
if(list.length===0)html+="<p>まだ記録がありません</p>";
for(let i=0;i<list.length;i++){
html+=`
<div class="rankItem">
${i+1}位
${list[i].icon?`<img class="rankIcon" src="${list[i].icon}">`:""}
${list[i].name}<br>
${titleHTML(list[i].title||"初心者")}<br>
レート：${list[i].rating||1000}<br>
${list[i].wins||0}勝 ${list[i].losses||0}敗
</div>
`;
}
box.innerHTML=html;
ensurePanelBackButton();
}catch(e){
box.innerHTML="<p>レートランキング取得失敗</p>";
ensurePanelBackButton();
}
}
function showOnlineMatchMenu(){
document.getElementById("panelArea").innerHTML=`
<h2>⚔️ ランダムマッチ</h2>
<div class="matchBox">
<p>先に3ポイント取った方が勝ち。</p>
<p>1問先に正解した方が1ポイント。</p>
<p>レート変動あり：勝ち +25 / 負け -25</p>
<button onclick="createOnlineMatch()">ルーム作成</button>
<input id="joinRoomIdOnline" placeholder="ルームID">
<button onclick="joinOnlineMatch()">ルーム参加</button>
</div>
`;
}
function showFriendMatchMenu(){
document.getElementById("panelArea").innerHTML=`
<h2>🤝 フレンドマッチ</h2>
<div class="matchBox">
<p>ランダムマッチと同じルール。</p>
<p>レート変動なし。</p>
<button onclick="createFriendMatch()">ルーム作成</button>
<input id="joinRoomIdFriend" placeholder="ルームID">
<button onclick="joinFriendMatch()">ルーム参加</button>
</div>
`;
}
let matchState={
active:false,
roomId:"",
type:"",
side:"",
room:null,
currentRound:-1,
currentQuestion:null,
poll:null,
localLocked:false
};
function makeMatchQuestions(){
let oldMode=mode;
let oldDifficulty=difficulty;
let list=[];
let modes=["arithmetic","prime","factor","expand","derivative","integral"];
for(let i=0;i<9;i++){
mode=modes[rand(0,modes.length-1)];
difficulty="normal";
list.push(cleanQuestionObject(generateQuestion()));
}
mode=oldMode;
difficulty=oldDifficulty;
return list;
}
async function createOnlineMatch(){
await createMatch("online");
}
async function createFriendMatch(){
await createMatch("friend");
}
async function joinOnlineMatch(){
let id=document.getElementById("joinRoomIdOnline").value.trim().toUpperCase();
await joinMatch(id,"online");
}
async function joinFriendMatch(){
let id=document.getElementById("joinRoomIdFriend").value.trim().toUpperCase();
await joinMatch(id,"friend");
}
async function createMatch(type){
try{
let questions=makeMatchQuestions();
let roomId=await createMatchRoom({
type:type,
name:playerProfile.name||"名無し",
title:playerData.equippedTitle||"初心者",
rate:playerData.rating||1000,
questions:questions
});
matchState.active=true;
matchState.roomId=roomId;
matchState.type=type;
matchState.side="host";
matchState.currentRound=-1;
matchState.localLocked=false;
showMatchWaiting(roomId,type);
startMatchPolling();
}catch(e){
alert("ルーム作成に失敗しました：" + (e.code || e.message || e));
console.error(e);
}
}
async function joinMatch(roomId,type){
if(!roomId){
alert("ルームIDを入力して");
return;
}
try{
await joinMatchRoom(roomId,{
name:playerProfile.name||"名無し",
title:playerData.equippedTitle||"初心者"
});
matchState.active=true;
matchState.roomId=roomId;
matchState.type=type;
matchState.side="guest";
matchState.currentRound=-1;
matchState.localLocked=false;
startMatchPolling();
}catch(e){
alert("参加できませんでした");
console.log(e);
}
}
function showMatchWaiting(roomId,type){
document.getElementById("homeScreen").classList.add("active");
document.getElementById("gameScreen").classList.remove("active");
document.getElementById("panelArea").innerHTML=`
<h2>${type==="online"?"⚔️ ランダムマッチ":"🤝 フレンドマッチ"}</h2>
<div class="matchBox">
<h3>ルーム作成完了</h3>
<p>ルームID</p>
<input value="${roomId}" readonly>
<p>友達にこのIDを送ってください。</p>
<p>相手が入ると自動で始まります。</p>
</div>
`;
}
function startMatchPolling(){
if(matchState.poll)clearInterval(matchState.poll);
matchState.poll=setInterval(pollMatchRoom,1000);
pollMatchRoom();
}
async function pollMatchRoom(){
if(!matchState.active)return;
let room=await loadMatchRoom(matchState.roomId);
if(!room)return;
matchState.room=room;
if(room.status==="waiting"){
showMatchWaiting(room.roomId,room.type);
return;
}
if(room.status==="finished" || room.status==="canceled"){
finishMatch(room);
return;
}
if(room.round!==matchState.currentRound){
matchState.currentRound=room.round;
matchState.currentQuestion=room.currentQuestion;
matchState.localLocked=false;
showMatchQuestion(room);
}else{
updateMatchHeader(room);
}
}
function showMatchQuestion(room){
updateSurrenderButton();
document.getElementById("homeScreen").classList.remove("active");
document.getElementById("resultScreen")?.classList.remove("active");
document.getElementById("gameScreen").classList.add("active");
setInputVisible(true);
document.getElementById("modeTitle").innerText=
room.type==="online" ? "⚔️ ランダムマッチ" : "🤝 フレンドマッチ";
enemyHP=9999;
playerHP=1;
updateMatchHeader(room);
current=room.currentQuestion;
current=cleanQuestionObject(current);
document.getElementById("q").innerText=cleanMathExpression(current.q);
document.getElementById("ans").value="";
document.getElementById("result").innerHTML=
`<p>第${(room.round||0)+1}問　先に正解した方が1ポイント</p>`;
}
function updateMatchHeader(room){
let host=room.hostName||"ホスト";
let guest=room.guestName||"ゲスト";
let header=document.getElementById("scoreStatus");
if(header){
header.innerHTML=`
<div class="matchScore">
<div>${host}<br><span class="matchPoint">${room.hostPoints||0}</span></div>
<div>VS</div>
<div>${guest}<br><span class="matchPoint">${room.guestPoints||0}</span></div>
</div>
`;
}
document.getElementById("enemy").style.display="none";
document.getElementById("enemyFrame").style.display="none";
document.getElementById("player").style.display="none";
document.getElementById("playerFrame").style.display="none";
}
async function submitMatchAnswer(u){
if(matchState.localLocked)return true;
let ok=false;
if(!current)return false;
if(current.number)ok=checkPrimeAnswer(u,current.number);
if(!ok)ok=expressionsEqual(u,current.a);
if(!ok)ok=normalize(u)===normalize(current.display);
if(!ok){
combo=0;
const ans=document.getElementById("ans");
if(ans) ans.value="";
matchState.localLocked=true;
let remain=5;
const resultEl=document.getElementById("result");
const showPenalty=()=>{ if(resultEl) resultEl.innerHTML=`× 不正解。<br>${remain}秒ペナルティ`; };
showPenalty();
const penaltyTimer=setInterval(()=>{
remain--;
if(remain>0){
showPenalty();
}else{
clearInterval(penaltyTimer);
matchState.localLocked=false;
if(resultEl) resultEl.innerHTML="もう一度入力できます";
if(ans) ans.focus();
}
},1000);
return true;
}
matchState.localLocked=true;
document.getElementById("result").innerHTML="○ 正解！次の問題へ進みます...";
let room=await claimMatchPoint(matchState.roomId,matchState.side,matchState.currentRound);
if(room){
matchState.room=room;
if(room.status==="finished" || room.status==="canceled"){
finishMatch(room);
return true;
}
if(room.round!==matchState.currentRound){
matchState.currentRound=room.round;
matchState.currentQuestion=room.currentQuestion;
matchState.localLocked=false;
showMatchQuestion(room,false);
}else{
updateMatchHeader(room);
}
}
return true;
}
async function finishMatch(room){
if(matchState.poll){
clearInterval(matchState.poll);
matchState.poll=null;
}
matchState.active=false;
if(typeof updateSurrenderButton==="function")updateSurrenderButton();
if(room.status==="canceled"){
setInputVisible(false);
document.getElementById("gameScreen").classList.remove("active");
document.getElementById("homeScreen").classList.add("active");
document.getElementById("panelArea").innerHTML=`<div class="matchBox">相手が退出、または募集が取り消されました。</div>`;
return;
}
let mySide=matchState.side;
let win=room.winner===mySide;
let beforeRate=null;
let afterRate=null;
let reason="";
if(room.surrenderedBy){
reason=room.surrenderedBy===mySide?"自分が降参":"相手が降参";
}else if(room.leftBy){
reason=room.leftBy===mySide?"自分が退出":"相手が退出";
}
if(room.type==="online"){
try{
beforeRate=1000;
let rate=await saveRateData(win?"win":"loss");
afterRate=rate.rating;
}catch(e){
console.log(e);
}
}
addMatchHistory(win?"win":"loss",room,beforeRate,afterRate,reason);
setInputVisible(false);
document.getElementById("gameScreen").classList.remove("active");
document.getElementById("resultScreen").classList.add("active");
let host=room.hostName||"ホスト";
let guest=room.guestName||"ゲスト";
document.getElementById("resultSummary").innerHTML=`
<div class="profileItem">
<h2>${win?"勝利！":"敗北..."}</h2>
${reason?`<p>${reason}</p>`:""}
<p>${host}：${room.hostPoints||0} ポイント</p>
<p>${guest}：${room.guestPoints||0} ポイント</p>
<p>${room.type==="online"?"レート変動あり":"レート変動なし"}</p>
${afterRate!==null?`<p>現在レート：${afterRate}</p>`:""}
<button class="resultBtn" onclick="backHomeFromResult()">ホームへ</button>
</div>
`;
document.getElementById("resultList").innerHTML="";
if(typeof ensureHomeButton==="function")setTimeout(ensureHomeButton,0);
}
function checkGoogleLoginStatus(){
let user=null;
if(window.getGoogleLoginInfo)user=window.getGoogleLoginInfo();
else if(window.currentUser)user=window.currentUser;
const uid=localStorage.getItem("googleLoginUid");
if(user || uid){
alert("アカウント連携済みです\n本名はゲーム画面には表示されません");
}else{
alert("未ログインです");
}
}
function getQuestionHint(q){
if(!q)return "問題をよく見て、使う公式を考えよう。";
const text=String(q.q||"");
if(text.includes("素因数分解")) return "2、3、5、7のような小さい素数から順に割ってみよう。";
if(text.includes("因数分解")){
if(text.includes("x²-")) return "平方差なら (x-a)(x+a)、2次式なら足して真ん中・かけて最後を探そう。";
return "共通因数でくくれるか、足して真ん中・かけて最後になる数を探そう。";
}
if(text.includes("展開")) return "分配法則を使う。公式 (a+b)^2、(a-b)^2、(a+b)(a-b) も確認しよう。";
if(text.includes("∫")){
if(text.includes("sin")) return "sin(kx) の積分は -cos(kx)/k。";
if(text.includes("cos")) return "cos(kx) の積分は sin(kx)/k。";
if(text.includes("/x")) return "1/x の積分は log(x)。";
if(text.includes("√")) return "√x は x^(1/2) に直して積分しよう。";
return "x^n の積分は x^(n+1)/(n+1)。最後に +C を忘れずに。";
}
if(text.includes("d/dx")){
if(text.includes("sin")) return "sin(kx) の微分は kcos(kx)。";
if(text.includes("cos")) return "cos(kx) の微分は -ksin(kx)。";
if(text.includes("log")) return "log(x) の微分は 1/x。";
if(text.includes("tan")) return "tan(x) の微分は 1/cos(x)^2。";
return "x^n の微分は n x^(n-1)。係数も忘れないように。";
}
if(text.includes("+") || text.includes("-") || text.includes("×") || text.includes("÷")) return "かっこがあれば先に計算。×と÷を先に処理しよう。";
return "式の形から使える公式を探そう。";
}
function showHint(){
const area=document.getElementById("hintArea");
if(!area)return;
if(mode==="random" || mode==="review" || (matchState && matchState.active)){
area.innerHTML=`<div class="hintBox">ヒントは学習モードだけで使えます。</div>`;
return;
}
area.innerHTML=`<div class="hintBox">💡 ${getQuestionHint(current)}</div>`;
}
function clearHint(){
const area=document.getElementById("hintArea");
if(area)area.innerHTML="";
}
async function joinOpenOnlineMatch(roomId){
await joinMatch(roomId,"online");
}
async function cancelMyMatchRoom(){
if(!matchState.roomId){
alert("取り消せる部屋がありません");
return;
}
try{
await cancelMatchRoom(matchState.roomId);
if(matchState.poll){
clearInterval(matchState.poll);
matchState.poll=null;
}
matchState.active=false;
alert("募集を取り消しました");
showOnlineMatchMenu();
}catch(e){
alert("募集の取り消しに失敗しました");
console.log(e);
}
}
function getJoinErrorMessage(e){
const msg=String(e && e.message ? e.message : e);
if(msg.includes("room-not-found")) return "部屋が見つかりません。";
if(msg.includes("already-full")) return "この部屋はすでに満員です。";
if(msg.includes("own-room")) return "自分の部屋には参加できません。";
if(msg.includes("room-closed")) return "この部屋は終了または取り消し済みです。";
return "通信エラーです。";
}
function addMatchHistory(result,room,beforeRate=null,afterRate=null,reason=""){
if(!playerData.matchHistory)playerData.matchHistory=[];
const mySide=matchState.side;
const opponent = mySide==="host" ? (room.guestName||"相手") : (room.hostName||"相手");
playerData.matchHistory.unshift({
date:new Date().toLocaleString("ja-JP"),
type:room.type,
result,
score:`${room.hostPoints||0}-${room.guestPoints||0}`,
opponent,
beforeRate,
afterRate,
reason
});
playerData.matchHistory=playerData.matchHistory.slice(0,20);
saveAllData();
}
function showMatchHistory(){
const st=getMatchHistoryStats();
let html=`
<h2>⚔️ 対戦履歴</h2>
<div class="statGrid">
<div class="statCard"><h3>総試合数</h3><p>${st.total}</p></div>
<div class="statCard"><h3>勝利</h3><p>${st.wins}</p></div>
<div class="statCard"><h3>敗北</h3><p>${st.losses}</p></div>
<div class="statCard"><h3>勝率</h3><p>${st.rate}%</p></div>
</div>
`;
if(!playerData.matchHistory || playerData.matchHistory.length===0){
html+="<p>まだ履歴がありません。</p>";
}else{
for(const h of playerData.matchHistory){
html+=`
<div class="rankItem">
${h.result==="win"?"○ 勝利":"× 敗北"}<br>
種類：${h.type==="online"?"ランダムマッチ":"フレンドマッチ"}<br>
相手：${h.opponent}<br>
スコア：${h.score}<br>
${h.reason?`理由：${h.reason}<br>`:""}
${h.beforeRate!==null && h.beforeRate!==undefined?`レート：${h.beforeRate} → ${h.afterRate}<br>`:""}
${h.date}<br><button onclick="showOpponentProfile({name:\`${h.opponent}\`,title:\`初心者\`})">相手を見る</button>
</div>
`;
}
}
document.getElementById("panelArea").innerHTML=html;
if(typeof ensureHomeButton==="function")ensureHomeButton();
}
function showMatchWaiting(roomId,type){
document.getElementById("homeScreen").classList.add("active");
document.getElementById("gameScreen").classList.remove("active");
document.getElementById("panelArea").innerHTML=`
<h2>${type==="online"?"⚔️ ランダムマッチ":"🤝 フレンドマッチ"}</h2>
<div class="matchBox">
<h3>募集作成完了</h3>
<p>相手が参加すると自動で試合開始します。</p>
${type==="friend"?`<p>ルームID</p><input value="${roomId}" readonly><p>友達にこのIDを送ってください。</p>`:""}
${type==="online"?`<button onclick="cancelMyMatchRoom()">募集を取り消す</button>`:""}
<p>相手待ち...</p>
</div>
`;
}
async function joinMatch(roomId,type){
if(!roomId){
alert("ルームIDを入力して");
return;
}
try{
await joinMatchRoom(roomId,{
name:playerProfile.name||"名無し",
title:playerData.equippedTitle||"初心者"
});
matchState.active=true;
matchState.roomId=roomId;
matchState.type=type;
matchState.side="guest";
matchState.currentRound=-1;
matchState.localLocked=false;
startMatchPolling();
}catch(e){
alert(getJoinErrorMessage(e));
console.log(e);
}
}
async function finishMatch(room){
if(matchState.poll){
clearInterval(matchState.poll);
matchState.poll=null;
}
matchState.active=false;
if(room.status==="canceled"){
setInputVisible(false);
document.getElementById("gameScreen").classList.remove("active");
document.getElementById("homeScreen").classList.add("active");
document.getElementById("panelArea").innerHTML=`<div class="matchBox">相手が退出、または募集が取り消されました。</div>`;
return;
}
let mySide=matchState.side;
let win=room.winner===mySide;
let beforeRate=null;
let afterRate=null;
if(room.type==="online"){
try{
beforeRate=1000;
let rate=await saveRateData(win?"win":"loss");
afterRate=rate.rating;
}catch(e){
console.log(e);
}
}
addMatchHistory(win?"win":"loss",room,beforeRate,afterRate);
setInputVisible(false);
document.getElementById("gameScreen").classList.remove("active");
document.getElementById("resultScreen").classList.add("active");
let host=room.hostName||"ホスト";
let guest=room.guestName||"ゲスト";
document.getElementById("resultSummary").innerHTML=`
<div class="profileItem">
<h2>${win?"勝利！":"敗北..."}</h2>
<p>${host}：${room.hostPoints||0} ポイント</p>
<p>${guest}：${room.guestPoints||0} ポイント</p>
<p>${room.type==="online"?"レート変動あり":"レート変動なし"}</p>
${afterRate!==null?`<p>現在レート：${afterRate}</p>`:""}
<button class="resultBtn" onclick="backHomeFromResult()">ホームへ</button>
</div>
`;
document.getElementById("resultList").innerHTML="";
}
async function showOnlineMatchMenu(){
const box=document.getElementById("panelArea");
box.innerHTML=`
<h2>⚔️ ランダムマッチ</h2>
<div class="matchBox">
<p>募集中の部屋から参加できます。</p>
<p>先に1問正解で1ポイント。3ポイント先取で勝ち。</p>
<button onclick="createOnlineMatch()">新しく募集する</button>
<button onclick="showOnlineMatchMenu()">更新</button>
</div>
<h3>募集中一覧</h3>
<div id="openRoomList">読み込み中...</div>
`;
try{
const rooms=await loadOpenMatchRooms();
let html="";
if(!rooms.length){
html="<p>現在募集中の部屋はありません。</p>";
}
for(const r of rooms){
html+=`
<div class="openRoomItem">
<b>${r.hostName||"名無し"}</b><br>
${titleHTML(r.hostTitle||"初心者")}<br>
レート：${r.hostRate||1000}<br>
<button onclick="joinOpenOnlineMatch('${r.roomId}')">参加する</button>
</div>
`;
}
document.getElementById("openRoomList").innerHTML=html;
}catch(e){
console.error(e);
document.getElementById("openRoomList").innerHTML=`<p>募集中一覧の取得に失敗しました。<br>${e.code || e.message || e}</p>`;
}
}
setInterval(ensureHomeButton,1500);
function getModeLabel(m){
const map={
arithmetic:"四則演算",
prime:"素因数分解",
factor:"因数分解",
expand:"展開",
derivative:"微分",
integral:"積分",
random:"ランキング",
review:"復習"
};
return map[m]||m;
}
function recordGenreResult(m,ok){
if(!playerData.genreStats)playerData.genreStats={};
if(!playerData.genreStats[m])playerData.genreStats[m]={correct:0,total:0};
playerData.genreStats[m].total++;
if(ok)playerData.genreStats[m].correct++;
}
function showGenreStats(){
let html=`<h2>📊 ジャンル別正答率</h2><div class="statGrid">`;
const order=["arithmetic","prime","factor","expand","derivative","integral","random"];
for(const m of order){
const s=(playerData.genreStats&&playerData.genreStats[m])?playerData.genreStats[m]:{correct:0,total:0};
const rate=s.total?Math.round(s.correct/s.total*100):0;
html+=`
<div class="statCard">
<h3>${getModeLabel(m)}</h3>
<p>${rate}%</p>
<p>${s.correct}/${s.total}</p>
</div>
`;
}
html+=`</div>`;
document.getElementById("panelArea").innerHTML=html;
if(typeof ensureHomeButton==="function")ensureHomeButton();
}
function getMatchHistoryStats(){
const list=playerData.matchHistory||[];
const wins=list.filter(x=>x.result==="win").length;
const losses=list.filter(x=>x.result==="loss").length;
const total=wins+losses;
const rate=total?Math.round(wins/total*100):0;
return {wins,losses,total,rate};
}
async function surrenderMatch(){
if(!matchState || !matchState.active){
alert("対戦中ではありません");
return;
}
if(!confirm("本当に降参しますか？"))return;
try{
const room=await surrenderMatchRoom(matchState.roomId,matchState.side);
if(room){
finishMatch(room);
}
}catch(e){
alert("降参に失敗しました：" + (e.code || e.message || e));
console.error(e);
}
}
function updateSurrenderButton(){
const btn=document.getElementById("surrenderBtn");
if(!btn)return;
btn.style.display=(matchState && matchState.active)?"block":"none";
}
function getBgTheme(){
return playerData.bgTheme || "space";
}
function applyBgTheme(){
document.body.classList.remove("theme-blue","theme-simple","theme-red","theme-neon","theme-gold","theme-ranker","theme-rainbow","theme-founder");
const t=getBgTheme();
if(t!=="space")document.body.classList.add("theme-"+t);
}
function canUseTheme(t){
if(["space","blue","simple","red","neon"].includes(t))return true;
if(t==="gold")return (playerData.coins||0)>=5000;
if(t==="ranker")return true;
if(t==="rainbow")return (playerData.achievements||[]).length>=50;
if(t==="founder")return (playerData.unlockedTitles||[]).includes("⚡️創設者");
return false;
}
function setBgTheme(t){
if(!canUseTheme(t)){
alert("まだ解放されていません");
return;
}
playerData.bgTheme=t;
saveAllData();
applyBgTheme();
showSettings();
}
function themeLabel(t){
return {
space:"🌌 宇宙背景",
blue:"📘 数式ブルー",
simple:"🌑 シンプル",
red:"🔥 バトルレッド",
neon:"💎 ネオン",
gold:"👑 ゴールド背景",
ranker:"🏆 ランカー背景",
rainbow:"🌈 レインボー背景",
founder:"⚡️ 創設者背景"
}[t]||t;
}
function themeButtonsHTML(){
const themes=["space","blue","simple","red","neon","gold","ranker","rainbow","founder"];
let html=`<div class="settingsItem"><h3>🎨 背景テーマ</h3><p>現在：${themeLabel(getBgTheme())}</p>`;
for(const t of themes){
const ok=canUseTheme(t);
html+=`<button class="themeBtn" onclick="setBgTheme('${t}')">${ok?"":"🔒 "}${themeLabel(t)}</button>`;
}
html+=`
<p>👑 ゴールド背景：5000コイン</p>
<p>🏆 ランカー背景：ランキング参加者向け</p>
<p>🌈 レインボー背景：実績50個</p>
<p>⚡️ 創設者背景：⚡️創設者⚡️所持</p>
</div>`;
return html;
}
const MESSAGE_COLLECTION = [
"数学勉強中","まだまだこれから","初心者です","のんびり挑戦中","一歩ずつ前進",
"今日も頑張る","問題募集中","成長中です","練習あるのみ","地道に攻略",
"毎日コツコツ","努力は裏切らない","数学探究中","解き続ける者","積み重ねが力になる",
"学ぶことが好き","知識を集める者","問題を愛する者","解法研究中","数学の旅人",
"対戦受付中","挑戦者求む","勝利を掴む","連勝中","ライバル募集中",
"実力勝負","真剣勝負希望","全力で挑む","勝負あるのみ","負けても前進",
"数学マスターへの道","限界突破","頂点を目指して","壁を越える者","高みを目指す",
"まだ強くなれる","さらなる高みへ","継続こそ力","実力を磨く","努力継続中",
"伝説はここから始まる","このゲームの古参","歴史の証人","最初の挑戦者","栄光をその手に",
"王者への道","不屈の挑戦者","数学界の探検家","新たな伝説を刻む","このゲームの始まりを知る者"
];
const HARD_INTEGRAL_QUESTIONS = [
{
q:"難問：∫xsinx dx",
a:"-xcosx+sinx+C",
display:"-xcosx+sinx+C",
explanation:"部分積分。xを微分、sinxを積分する。∫xsinx dx = -xcosx+∫cosx dx = -xcosx+sinx+C"
},
{
q:"難問：∫xcosx dx",
a:"xsinx+cosx+C",
display:"xsinx+cosx+C",
explanation:"部分積分。xを微分、cosxを積分する。∫xcosx dx = xsinx-∫sinx dx = xsinx+cosx+C"
},
{
q:"難問：∫2x(x²+1)^3 dx",
a:"(x²+1)^4/4+C",
display:"(x²+1)^4/4+C",
explanation:"置換積分。t=x²+1 とおくと dt=2x dx。∫t^3dt=t^4/4+C"
},
{
q:"難問：∫x/(x²+4) dx",
a:"1/2log(x²+4)+C",
display:"1/2log(x²+4)+C",
explanation:"置換積分。t=x²+4 とおくと dt=2x dx。答えは 1/2log(x²+4)+C"
},
{
q:"難問：∫(3x+1)^4 dx",
a:"(3x+1)^5/15+C",
display:"(3x+1)^5/15+C",
explanation:"置換積分。t=3x+1 とおくと dt=3dx。∫(3x+1)^4dx=(3x+1)^5/15+C"
},
{
q:"難問：∫sin²x dx",
a:"x/2-sin2x/4+C",
display:"x/2-sin2x/4+C",
explanation:"半角公式 sin²x=(1-cos2x)/2 を使う。"
},
{
q:"難問：∫cos²x dx",
a:"x/2+sin2x/4+C",
display:"x/2+sin2x/4+C",
explanation:"半角公式 cos²x=(1+cos2x)/2 を使う。"
},
{
q:"難問：∫e^x(x+1) dx",
a:"xe^x+C",
display:"xe^x+C",
explanation:"xe^x を微分すると e^x(x+1)。逆に見れば答えは xe^x+C。"
},
{
q:"難問：∫xe^(x²) dx",
a:"1/2e^(x²)+C",
display:"1/2e^(x²)+C",
explanation:"置換積分。t=x² とおくと dt=2x dx。"
},
{
q:"難問：∫1/(2x+1) dx",
a:"1/2log(2x+1)+C",
display:"1/2log(2x+1)+C",
explanation:"log型。分母の微分が2なので、係数1/2を付ける。"
},
{
q:"難問：∫₀¹ 2x(x²+1)^2 dx",
a:"7/3",
display:"7/3",
explanation:"t=x²+1 と置換。範囲は x=0→t=1, x=1→t=2。∫₁²t²dt=7/3。"
},
{
q:"難問：∫₀¹ x/(x²+1) dx",
a:"1/2log2",
display:"1/2log2",
explanation:"t=x²+1 と置換。範囲は1から2。答えは 1/2log2。"
}
];
function generateHardIntegralQuestion(){
const q = HARD_INTEGRAL_QUESTIONS[rand(0,HARD_INTEGRAL_QUESTIONS.length-1)];
return cleanQuestionObject ? cleanQuestionObject({...q}) : {...q};
}
if(typeof generateQuestion === "function" && !window.__hardQuestionWrapped){
window.__hardQuestionWrapped = true;
const __originalGenerateQuestion = generateQuestion;
generateQuestion = function(){
if((difficulty==="veryHard" || difficulty==="difficult" || difficulty==="難問") && mode==="integral"){
return generateHardIntegralQuestion();
}
return __originalGenerateQuestion();
};
}
function difficultyLabel(d){
if(d==="easy")return "初級";
if(d==="normal")return "中級";
if(d==="hard")return "上級";
if(d==="veryHard")return "難問";
return d;
}
function openSimplePage(html){
const menu=document.getElementById("homeMenu");
const panel=document.getElementById("panelArea");
if(menu)menu.classList.add("hidden");
if(panel)panel.innerHTML=html;
if(typeof ensureHomeButton==="function")setTimeout(ensureHomeButton,0);
}
function showStatsPage(){
const total=playerData.totalQuestions||0;
const correct=playerData.totalCorrect||0;
const rate=total?Math.round(correct/total*100):0;
const combo=playerData.maxCombo||0;
const level=(typeof getLevel==="function")?getLevel():1;
const mh=playerData.matchHistory||[];
const wins=mh.filter(x=>x.result==="win").length;
const losses=mh.filter(x=>x.result==="loss").length;
const mt=wins+losses;
const wr=mt?Math.round(wins/mt*100):0;
let html=`
<h2>📊 成績</h2>
<div class="statsCard">
<h3>総合成績</h3>
<p>総回答数：${total}問</p>
<p>総正解数：${correct}問</p>
<p>正答率：${rate}%</p>
<p>最高連続正解：${combo}問</p>
<p>レベル：Lv.${level}</p>
</div>
<div class="statsCard">
<h3>対戦成績</h3>
<p>総試合数：${mt}</p>
<p>勝利：${wins}</p>
<p>敗北：${losses}</p>
<p>勝率：${wr}%</p>
</div>
`;
openSimplePage(html);
}
window.showNewsPage=showNewsPage;
window.showStatsPage=showStatsPage;
let __mmKeyLastTouch = 0;
document.addEventListener("touchend", function(e){
const t = e.target;
if(!(t && t.closest && t.closest("#customKeyboard"))) return;
const now = Date.now();
if(now - __mmKeyLastTouch < 300){
e.preventDefault();
}
__mmKeyLastTouch = now;
}, {passive:false});
document.addEventListener("dblclick", function(e){
const t=e.target;
if(t && t.closest && t.closest("#customKeyboard")){
e.preventDefault();
}
}, {passive:false});
const UPDATE_NOTES = {
  "3.1.1": ["シリアルコード画面を調整","称号システムを調整","一部UIを改善"],
"3.1.0": [
"称号システムを調整",
"ログイン画面の表示を改善",
"一部UIを調整"
],
"3.0.9": [
"称号システムを調整",
"ログイン画面の表示を改善",
"一部UIを調整"
],
"3.0.8": [
"フレンド対戦の反応速度を改善",
"どちらかが正解した時点で次の問題へ進むように調整",
"ミス時に5秒ペナルティを追加",
"ミス時に解答欄を自動で空にするように変更"
],
"3.0.4": [
"セキュリティを強化",
"メールアドレスを保存しない方式に変更",
"表示名を非公開データとして保存",
"プログラムを読み取りにくい形へ圧縮",
"ランダムマッチ演出と対戦表示を維持"
],
"3.0.2": [
"画面上部のバージョン表示を更新",
"掲示板を準備中表示へ変更",
"一部の非公開コマンド称号を整理"
],
"3.0.1": [
"フレンドコード未発行時に自動で8桁コードを再発行するように修正",
"掲示板の投稿処理を修正",
"投稿失敗時に原因が分かりやすい表示へ改善"
],
"3.0.0": [
"数学掲示板βを追加",
"復習リストから掲示板へ投稿できるように変更",
"ログイン済みの保存データを自動で読み込むように改善",
"お知らせを右上の小さいボタンへ移動"
],
"2.7.3": [
"壊れていたpanelAreaのHTMLを修正",
"強すぎるタップ制御を削除",
"テンキーの + × ÷ - をオレンジ色に変更",
"お知らせをVERSION連動の自動表示に変更",
"成績・お知らせページを開けるように修正"
],
"2.7.2": [
"テンキーの + × ÷ - をオレンジ色に変更",
"お知らせをVERSION連動の自動表示に変更"
],
"2.6.8": [
"3連続正解からダメージ増加に変更",
"コンボ火力を調整"
],
"2.6.7": [
"演算子 + - × ÷ をオレンジ表示",
"コンボダメージシステムを追加"
],
"2.6.6": [
"難易度「難問」を追加",
"積分に部分積分・置換積分の問題を追加"
],
"2.6.1": [
"問題表示の +- を - に修正"
],
"2.5.0": [
"プロフィール背景変更を追加"
],
"2.4.0": [
"お知らせページを追加",
"成績ページを追加",
"背景テーマを追加"
],
"2.3.0": [
"青紫の宇宙背景を追加",
"浮かぶ数式アニメーションを追加",
"カード式ホームを追加"
]
};
function getLatestUpdateNoteVersion(){
const versions = Object.keys(UPDATE_NOTES).sort((a,b)=>{
const pa=a.split(".").map(Number);
const pb=b.split(".").map(Number);
for(let i=0;i<3;i++){
if(pb[i]!==pa[i])return pb[i]-pa[i];
}
return 0;
});
return versions[0] || "2.7.3";
}
function updateNotesHTML(){
const v = getLatestUpdateNoteVersion();
let html = `
<h2>📢 お知らせ</h2>
<div class="newsCard">
<h3>🔴 最新アップデート Ver${v}</h3>
`;
const latest = UPDATE_NOTES[v] || ["アップデートを適用しました"];
for(const note of latest){
html += `<p>・${note}</p>`;
}
html += `</div><div class="newsCard"><h3>📝 アップデート履歴</h3></div>`;
const versions = Object.keys(UPDATE_NOTES).sort((a,b)=>{
const pa=a.split(".").map(Number);
const pb=b.split(".").map(Number);
for(let i=0;i<3;i++){
if(pb[i]!==pa[i])return pb[i]-pa[i];
}
return 0;
});
for(const ver of versions){
html += `<div class="newsCard"><h3>Ver${ver}</h3>`;
for(const note of UPDATE_NOTES[ver]){
html += `<p>・${note}</p>`;
}
html += `</div>`;
}
return html;
}
function showNewsPage(){
const menu=document.getElementById("homeMenu");
const panel=document.getElementById("panelArea");
if(menu)menu.classList.add("hidden");
if(panel)panel.innerHTML = updateNotesHTML();
if(typeof ensureHomeButton==="function")setTimeout(ensureHomeButton,0);
}
window.showNewsPage=showNewsPage;
function colorKeypadOperators(){
const keys = document.querySelectorAll("#customKeyboard button, #customKeyboard .keyBtn");
keys.forEach(btn=>{
const t=(btn.textContent||"").trim();
if(["+","-","−","×","÷"].includes(t)){
btn.classList.add("keyOpOrange");
}
});
}
setInterval(colorKeypadOperators,800);
window.addEventListener("load",()=>setTimeout(colorKeypadOperators,500));
window.showStudyMenu=showStudyMenu;
window.showRankingMenu=showRankingMenu;
window.showMatchMenu=showMatchMenu;
window.showGacha=showGacha;
window.showProfileMenu=showProfileMenu;
window.showOtherMenu=showOtherMenu;
function showComboPop(){
if((combo||0) < 2)return;
const old=document.getElementById("comboPop");
if(old)old.remove();
const dmg = (typeof comboDamageValue==="function") ? comboDamageValue(combo) : 1;
const div=document.createElement("div");
div.id="comboPop";
div.className="comboPop";
div.innerHTML=`🔥 ${combo} COMBO<br><span style="font-size:28px">⚔️ ${dmg} DAMAGE</span>`;
document.body.appendChild(div);
setTimeout(()=>div.remove(),950);
}
function getAchievementProgress(a){
const correct=playerData.totalCorrect||0;
const best=playerData.bestRandomScore||0;
const maxCombo=playerData.maxCombo||0;
const play=playerData.playTime||0;
const days=playerData.consecutiveDays||0;
const review=(playerData.reviewList||[]).length;
const level=(typeof getLevel==="function")?getLevel():1;
const map={
"初正解":[correct,1],
"10問正解":[correct,10],
"100問正解":[correct,100],
"1000問正解":[correct,1000],
"初ランキング登録":[best,1],
"週間ランキング参加":[best,1],
"プロフィール設定完了":[(playerProfile.name!=="名無し"||playerProfile.icon)?1:0,1],
"3連勝":[maxCombo,3],
"5連勝":[maxCombo,5],
"10連勝":[maxCombo,10],
"25連勝":[maxCombo,25],
"50連勝":[maxCombo,50],
"100連勝":[maxCombo,100],
"無双":[maxCombo,200],
"15分プレイ":[play,15*60],
"1時間プレイ":[play,60*60],
"10時間プレイ":[play,10*60*60],
"50時間プレイ":[play,50*60*60],
"100時間プレイ":[play,100*60*60],
"数学廃人":[play,500*60*60],
"3日連続":[days,3],
"7日連続":[days,7],
"30日連続":[days,30],
"100日連続":[days,100],
"毎日数学生活":[days,365],
"初復習":[review,1],
"復習10問":[review,10],
"復習50問":[review,50],
"復習100問":[review,100],
"数学神":[level,300],
"伝説の数学神":[level,1000]
};
const v=map[a] || [(playerData.achievements||[]).includes(a)?1:0,1];
const now=Math.min(v[0],v[1]);
const need=v[1] || 1;
const pct=Math.min(100,Math.round(now/need*100));
return {now,need,pct};
}
function showAchievements(){
checkAchievements();
let gotCount=(playerData.achievements||[]).length;
let totalCount=achievementList().length;
let totalPct=Math.round(gotCount/totalCount*100);
let html=`
<h2>🏆 実績一覧</h2>
<div class="achievementItem">
<h3>達成率 <span class="achievementPct">${totalPct}%</span></h3>
<p>${gotCount}/${totalCount}</p>
<div class="achievementProgress"><div class="achievementProgressFill" style="width:${totalPct}%"></div></div>
</div>
`;
for(let a of achievementList()){
let got=playerData.achievements.includes(a);
const pr=getAchievementProgress(a);
let label=a;
html+=`
<div class="achievementItem">
${got?"✅":"⬜"} ${label}
<div class="achievementProgress"><div class="achievementProgressFill" style="width:${pr.pct}%"></div></div>
<div class="achievementPct">${pr.pct}%</div>
<small>${pr.now}/${pr.need}</small>
</div>
`;
}
document.getElementById("panelArea").innerHTML=html;
}
function getEnemyInfo(){
if(difficulty==="normal")return {key:"normal", name:"ゴブリン", img:"enemy_goblin.png", label:"中級"};
if(difficulty==="hard")return {key:"hard", name:"オーガ", img:"enemy_ogre.png", label:"上級"};
if(difficulty==="veryHard")return {key:"veryHard", name:"ドラゴン", img:"enemy_dragon.png", label:"難問"};
return {key:"easy", name:"スライム", img:"enemy_slime.png", label:"初級"};
}
function renderEnemyMob(){
const area=document.getElementById("enemyMobArea");
if(!area)return;
area.innerHTML="";
}
function playEnemyDefeat(){
const card=document.getElementById("enemyMobCard");
if(card)card.classList.add("enemyMobDefeated");
}
function previewProfileIcon(){
const input=document.getElementById("iconInputEdit");
const preview=document.getElementById("iconPreview");
if(!input || !input.files || !input.files[0])return;
const file=input.files[0];
const reader=new FileReader();
reader.onload=function(e){
if(preview)preview.src=e.target.result;
};
reader.readAsDataURL(file);
}
function resizeImageDataUrl(file, maxSize=360){
return new Promise((resolve,reject)=>{
const reader=new FileReader();
reader.onload=function(e){
const img=new Image();
img.onload=function(){
let w=img.width, h=img.height;
if(w>h && w>maxSize){h=Math.round(h*maxSize/w);w=maxSize;}
else if(h>=w && h>maxSize){w=Math.round(w*maxSize/h);h=maxSize;}
const canvas=document.createElement("canvas");
canvas.width=w; canvas.height=h;
const ctx=canvas.getContext("2d");
ctx.drawImage(img,0,0,w,h);
resolve(canvas.toDataURL("image/png"));
};
img.onerror=reject;
img.src=e.target.result;
};
reader.onerror=reject;
reader.readAsDataURL(file);
});
}
async function saveProfileFromPanel(){
let nameInput=document.getElementById("nameInput") || document.getElementById("playerNameEdit");
let name=nameInput ? nameInput.value.trim() : "";
let input=document.getElementById("iconInputEdit");
if(name)playerProfile.name=name;
if(input && input.files && input.files[0]){
try{
playerProfile.icon=await resizeImageDataUrl(input.files[0],360);
}catch(e){
alert("画像の保存に失敗しました");
console.error(e);
return;
}
}
saveAllData();
updateHomeStatus();
if(typeof savePublicProfile==="function")savePublicProfile();
showProfile();
alert("保存したよ");
}
window.previewProfileIcon=previewProfileIcon;
window.saveProfileFromPanel=saveProfileFromPanel;
function getMyMatchProfileForV303(){
return {
name:(playerProfile && playerProfile.name) || "名無し",
title:(playerData && playerData.equippedTitle) || "初心者",
level:(typeof getLevel === "function" ? getLevel() : 1),
rate:(playerData && playerData.rating) || 1000
};
}
function matchThreatLabel(myRate, enemyRate){
const diff=(enemyRate||1000)-(myRate||1000);
if(diff>=200)return "🔥 強敵";
if(diff<=-200)return "🟢 挑戦者";
return "⚪ 同格";
}
function matchPlayerCardHTML(name, level, title, rate, label){
return `<div class="matchVsPlayer">
<div class="matchVsName">${name || "名無し"}</div>
<div>Lv ${level || 1}</div>
<div>${titleHTML(title || "初心者")}</div>
<div>レート：${rate || 1000}</div>
${label?`<div class="matchThreat">${label}</div>`:""}
</div>`;
}
function showMatchSearching(type, roomId=""){
document.getElementById("homeScreen").classList.add("active");
document.getElementById("gameScreen").classList.remove("active");
const panel=document.getElementById("panelArea");
if(!panel)return;
panel.innerHTML=`
<h2>${type==="online"?"⚔️ ランダムマッチ":"🤝 フレンドマッチ"}</h2>
<div class="matchSearchBox">
<div class="matchSpinner"></div>
<h3>対戦相手を検索中...</h3>
${roomId?`<p>ルームID：<b>${roomId}</b></p>`:""}
${type==="friend"?"<p>友達にルームIDを送ってください。</p>":"<p>相手が見つかると自動で開始します。</p>"}
${type==="online"?`<button onclick="cancelMyMatchRoom()">募集を取り消す</button>`:""}
</div>`;
if(typeof ensureHomeButton==="function")setTimeout(ensureHomeButton,0);
}
function showMatchFoundIntro(room, after){
const mySide=matchState.side;
const myRate=(mySide==="host" ? room.hostRate : room.guestRate) || 1000;
const enemyRate=(mySide==="host" ? room.guestRate : room.hostRate) || 1000;
const left={
name: room.hostName || "ホスト",
level: room.hostLevel || 1,
title: room.hostTitle || "初心者",
rate: room.hostRate || 1000
};
const right={
name: room.guestName || "ゲスト",
level: room.guestLevel || 1,
title: room.guestTitle || "初心者",
rate: room.guestRate || 1000
};
const enemyLabel=matchThreatLabel(myRate, enemyRate);
const leftLabel=mySide==="host"?"あなた":enemyLabel;
const rightLabel=mySide==="guest"?"あなた":enemyLabel;
document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
document.getElementById("homeScreen").classList.add("active");
const panel=document.getElementById("panelArea");
if(panel){
panel.innerHTML=`
<div class="matchFoundOverlay">
<div class="matchFoundTitle">⚔️ MATCH FOUND ⚔️</div>
<div class="matchVsWrap">
${matchPlayerCardHTML(left.name,left.level,left.title,left.rate,leftLabel)}
<div class="matchVsText">VS</div>
${matchPlayerCardHTML(right.name,right.level,right.title,right.rate,rightLabel)}
</div>
<div id="matchCountdown" class="matchCountdown">3</div>
</div>`;
}
const nums=[3,2,1,"GO!"];
let i=0;
const el=()=>document.getElementById("matchCountdown");
if(el())el().textContent=nums[i];
const timer=setInterval(()=>{
i++;
if(i<nums.length){ if(el())el().textContent=nums[i]; }
else{ clearInterval(timer); after(); }
},650);
}
async function createMatch(type){
try{
let questions=makeMatchQuestions();
const p=getMyMatchProfileForV303();
let roomId=await createMatchRoom({
type:type,
name:p.name,
title:p.title,
level:p.level,
rate:p.rate,
questions:questions
});
matchState.active=true;
matchState.roomId=roomId;
matchState.type=type;
matchState.side="host";
matchState.currentRound=-1;
matchState.currentQuestion=null;
matchState.localLocked=false;
matchState.introShown=false;
showMatchSearching(type,roomId);
startMatchPolling();
}catch(e){
alert("ルーム作成に失敗しました：" + (e.code || e.message || e));
console.error(e);
}
}
async function joinMatch(roomId,type){
if(!roomId){ alert("ルームIDを入力して"); return; }
try{
const p=getMyMatchProfileForV303();
await joinMatchRoom(roomId,{name:p.name,title:p.title,level:p.level,rate:p.rate});
matchState.active=true;
matchState.roomId=roomId;
matchState.type=type;
matchState.side="guest";
matchState.currentRound=-1;
matchState.currentQuestion=null;
matchState.localLocked=false;
matchState.introShown=false;
showMatchSearching(type,roomId);
startMatchPolling();
}catch(e){
alert(typeof getJoinErrorMessage==="function" ? getJoinErrorMessage(e) : "参加できませんでした");
console.log(e);
}
}
function showMatchWaiting(roomId,type){
showMatchSearching(type,roomId);
}
function startMatchPolling(){
if(matchState.poll){
if(typeof matchState.poll === "function") matchState.poll();
else clearInterval(matchState.poll);
matchState.poll=null;
}
if(window.subscribeMatchRoom){
matchState.poll=window.subscribeMatchRoom(matchState.roomId,(room)=>handleMatchRoomRealtime(room));
}else{
matchState.poll=setInterval(pollMatchRoom,400);
pollMatchRoom();
}
}
async function pollMatchRoom(){
if(!matchState.active)return;
let room=await loadMatchRoom(matchState.roomId);
handleMatchRoomRealtime(room);
}
function handleMatchRoomRealtime(room){
if(!matchState.active || !room)return;
matchState.room=room;
if(room.status==="waiting"){
showMatchWaiting(room.roomId,room.type);
return;
}
if(room.status==="finished" || room.status==="canceled"){
finishMatch(room);
return;
}
if(!matchState.introShown){
matchState.introShown=true;
showMatchFoundIntro(room,()=>showMatchQuestion(room,true));
return;
}
if(room.round!==matchState.currentRound){
matchState.currentRound=room.round;
matchState.currentQuestion=room.currentQuestion;
matchState.localLocked=false;
showMatchQuestion(room,false);
}else{
updateMatchHeader(room);
}
}
function showMatchQuestion(room,fromIntro=false){
updateSurrenderButton();
document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
document.getElementById("gameScreen").classList.add("active");
setInputVisible(true);
document.getElementById("modeTitle").innerText= room.type==="online" ? "⚔️ ランダムマッチ" : "🤝 フレンドマッチ";
enemyHP=9999;
playerHP=1;
updateMatchHeader(room);
current=room.currentQuestion;
current=cleanQuestionObject(current);
document.getElementById("q").innerText=cleanMathExpression(current.q);
document.getElementById("ans").value="";
document.getElementById("result").innerHTML=`<p>第${(room.round||0)+1}問　先に正解した方が1ポイント</p>`;
}
function updateMatchHeader(room){
let host=room.hostName||"ホスト";
let guest=room.guestName||"ゲスト";
let header=document.getElementById("scoreStatus");
const mySide=matchState.side;
const myRate=(mySide==="host" ? room.hostRate : room.guestRate) || 1000;
const enemyRate=(mySide==="host" ? room.guestRate : room.hostRate) || 1000;
const enemyLabel=matchThreatLabel(myRate,enemyRate);
if(header){
header.innerHTML=`
<div class="matchScore matchScoreV303">
<div><b>${host}</b><br>Lv ${room.hostLevel||1}<br>${titleHTML(room.hostTitle||"初心者")}<br>R ${room.hostRate||1000}<br><span class="matchPoint">${room.hostPoints||0}</span></div>
<div class="matchCenterSmall">VS<br><span>${enemyLabel}</span></div>
<div><b>${guest}</b><br>Lv ${room.guestLevel||1}<br>${titleHTML(room.guestTitle||"初心者")}<br>R ${room.guestRate||1000}<br><span class="matchPoint">${room.guestPoints||0}</span></div>
</div>`;
}
["enemy","enemyFrame","player","playerFrame"].forEach(id=>{const el=document.getElementById(id); if(el)el.style.display="none";});
}
async function showOnlineMatchMenu(){
const box=document.getElementById("panelArea");
box.innerHTML=`
<h2>⚔️ ランダムマッチ</h2>
<div class="matchBox">
<p>募集中の部屋から参加できます。</p>
<p>マッチ成立後、VS演出のあと試合開始します。</p>
<button onclick="createOnlineMatch()">新しく募集する</button>
<button onclick="showOnlineMatchMenu()">更新</button>
</div>
<h3>募集中一覧</h3>
<div id="openRoomList">読み込み中...</div>`;
try{
const rooms=await loadOpenMatchRooms();
let html="";
if(!rooms.length)html="<p>現在募集中の部屋はありません。</p>";
for(const r of rooms){
const myRate=(playerData&&playerData.rating)||1000;
const label=matchThreatLabel(myRate,r.hostRate||1000);
html+=`<div class="openRoomItem">
<b>${r.hostName||"名無し"}</b><br>
Lv ${r.hostLevel||1}<br>
${titleHTML(r.hostTitle||"初心者")}<br>
レート：${r.hostRate||1000}<br>
<b>${label}</b><br>
<button onclick="joinOpenOnlineMatch('${r.roomId}')">参加する</button>
</div>`;
}
document.getElementById("openRoomList").innerHTML=html;
}catch(e){
console.error(e);
document.getElementById("openRoomList").innerHTML=`<p>募集中一覧の取得に失敗しました。<br>${e.code || e.message || e}</p>`;
}
}


// Ver3.0.5 beta match voting / terms / expression cleanup patch
(function(){
  const GENRES = [
    {id:"arithmetic", label:"四則演算"},
    {id:"prime", label:"素因数分解"},
    {id:"factor", label:"因数分解"},
    {id:"expand", label:"展開"},
    {id:"derivative", label:"微分"},
    {id:"integral", label:"積分"},
    {id:"random", label:"ランダム"}
  ];
  window.BETA_MATCH_GENRES = GENRES;

  window.cleanMathExpression = function(expr){
    if(expr===undefined || expr===null) return expr;
    let s = String(expr);
    s = s.replace(/\s+/g, "");
    // 0係数の項を消す
    s = s.replace(/(^|[+\-])0x(?:\^?\d+|[²³⁴⁵⁶])?/g, "$1");
    s = s.replace(/(^|[+\-])0(?:sin|cos|tan|log|sqrt|√|e\^)/g, "$1");
    // 1係数を省略
    s = s.replace(/(^|[+\-(])1(?=x|sin|cos|tan|log|sqrt|√|e\^|\()/g, "$1");
    s = s.replace(/(^|[+\-(])-1(?=x|sin|cos|tan|log|sqrt|√|e\^|\()/g, "$1-");
    // x^1 を x に
    s = s.replace(/x\^1(?!\d)/g,"x");
    s = s.replace(/x¹/g,"x");
    // +0 / -0 を消す
    s = s.replace(/([+\-])0(?=([+\-) ]|$))/g, "");
    s = s.replace(/\+\-/g,"-").replace(/-\+/g,"-").replace(/\+\+/g,"+").replace(/--/g,"+");
    s = s.replace(/^\+/g,"").replace(/\(\+/g,"(");
    s = s.replace(/\(\)/g,"0");
    return s || "0";
  };
  window.fixFormulaSigns = window.cleanMathExpression;

  const oldNormalize = (typeof normalize === "function") ? normalize : (x=>String(x));
  window.normalize = normalize = function(str){
    let s = String(str)
      .replace(/\s/g,"")
      .replace(/×/g,"*")
      .replace(/÷/g,"/")
      .replace(/π/g,"pi")
      .replace(/²/g,"^2").replace(/³/g,"^3").replace(/⁴/g,"^4").replace(/⁵/g,"^5").replace(/⁶/g,"^6")
      .replace(/¹/g,"^1")
      .replace(/\+C/g,"").replace(/C/g,"");
    s = s.replace(/(^|[+\-\(])1(?=x|sin|cos|tan|log|sqrt|exp|e\^|\()/g,"$1");
    s = s.replace(/(^|[+\-\(])-1(?=x|sin|cos|tan|log|sqrt|exp|e\^|\()/g,"$1-");
    s = s.replace(/x\^1(?!\d)/g,"x");
    s = s.replace(/([+\-])0(?=([+\-\)]|$))/g,"");
    return s;
  };

  function genreLabel(id){ return (GENRES.find(g=>g.id===id)||{}).label || id; }
  function expandedGenres(list){
    let a=(list&&list.length?list:["random"]);
    if(a.includes("random")) return ["arithmetic","prime","factor","expand","derivative","integral"];
    return a.filter(x=>x && x!=="random");
  }
  function decideGenres(a,b){
    const A=expandedGenres(a), B=expandedGenres(b);
    const common=A.filter(x=>B.includes(x));
    const pool=common.length ? common : [...new Set([...A,...B])];
    return pool[Math.floor(Math.random()*pool.length)] || "arithmetic";
  }
  function makeQuestionsForGenreList(genres){
    const oldMode=mode, oldDiff=difficulty;
    let list=[];
    const pool=expandedGenres(genres);
    for(let i=0;i<9;i++){
      mode=pool[Math.floor(Math.random()*pool.length)] || "arithmetic";
      difficulty="normal";
      list.push(cleanQuestionObject(generateQuestion()));
    }
    mode=oldMode; difficulty=oldDiff;
    return list;
  }
  window.makeMatchQuestionsForGenre = function(finalGenre){ return makeQuestionsForGenreList([finalGenre]); };

  window.showMatchMenu = function(){
    document.getElementById("panelArea").innerHTML=`
      <h2>⚔️ 対戦</h2>
      <button class="modeBtn" onclick="selectRankingMode()">🏆 週間ランキングモード</button>
      <button class="modeBtn" onclick="showOnlineMatchMenu()">🧪 β版対戦</button>
      <button class="modeBtn" onclick="showFriendMatchMenu()">🤝 フレンドマッチ</button>
      <button class="modeBtn" onclick="showMatchHistory()">📜 対戦履歴</button>
      <button class="modeBtn" onclick="showGenreStats()">📊 ジャンル別正答率</button>
      <div class="matchBox">
        <p>β版対戦：マッチ成立後に、両者が出題分野を複数選択できます。</p>
        <p>共通する分野があれば共通分野から、なければ両者の選択全体からランダムで決まります。</p>
      </div>`;
    if(typeof ensureHomeButton==="function")ensureHomeButton();
  };

  window.showOnlineMatchMenu = async function(){
    const box=document.getElementById("panelArea");
    box.innerHTML=`
      <h2>🧪 β版対戦</h2>
      <div class="matchBox">
        <p>募集中の部屋から参加できます。</p>
        <p>マッチ成立後、出題分野を複数選択して投票します。</p>
        <button onclick="createOnlineMatch()">新しく募集する</button>
        <button onclick="showOnlineMatchMenu()">更新</button>
      </div>
      <h3>募集中一覧</h3>
      <div id="openRoomList">読み込み中...</div>`;
    try{
      const rooms=await loadOpenMatchRooms();
      let html="";
      if(!rooms.length)html="<p>現在募集中の部屋はありません。</p>";
      for(const r of rooms){
        const myRate=(playerData&&playerData.rating)||1000;
        const label=(typeof matchThreatLabel==="function")?matchThreatLabel(myRate,r.hostRate||1000):"";
        html+=`<div class="openRoomItem"><b>${r.hostName||"名無し"}</b><br>Lv ${r.hostLevel||1}<br>${titleHTML(r.hostTitle||"初心者")}<br>レート：${r.hostRate||1000}<br><b>${label}</b><br><button onclick="joinOpenOnlineMatch('${r.roomId}')">参加する</button></div>`;
      }
      document.getElementById("openRoomList").innerHTML=html;
    }catch(e){
      console.error(e);
      document.getElementById("openRoomList").innerHTML=`<p>募集中一覧の取得に失敗しました。<br>${e.code || e.message || e}</p>`;
    }
  };

  const oldCreateMatch = window.createMatch || createMatch;
  window.createMatch = createMatch = async function(type){
    try{
      let questions=makeQuestionsForGenreList(["random"]);
      const p=(typeof getMyMatchProfileForV303==="function")?getMyMatchProfileForV303():{name:playerProfile.name||"名無し",title:playerData.equippedTitle||"初心者",level:getLevel(),rate:playerData.rating||1000};
      let roomId=await createMatchRoom({type:type,name:p.name,title:p.title,level:p.level,rate:p.rate,questions:questions,betaVote:true});
      matchState.active=true; matchState.roomId=roomId; matchState.type=type; matchState.side="host";
      matchState.currentRound=-1; matchState.currentQuestion=null; matchState.localLocked=false; matchState.introShown=false; matchState.voteSubmitted=false;
      if(typeof showMatchSearching==="function")showMatchSearching(type,roomId); else showMatchWaiting(roomId,type);
      startMatchPolling();
    }catch(e){ alert("ルーム作成に失敗しました：" + (e.code || e.message || e)); console.error(e); }
  };

  window.joinMatch = joinMatch = async function(roomId,type){
    if(!roomId){ alert("ルームIDを入力して"); return; }
    try{
      const p=(typeof getMyMatchProfileForV303==="function")?getMyMatchProfileForV303():{name:playerProfile.name||"名無し",title:playerData.equippedTitle||"初心者",level:getLevel(),rate:playerData.rating||1000};
      await joinMatchRoom(roomId,{name:p.name,title:p.title,level:p.level,rate:p.rate});
      matchState.active=true; matchState.roomId=roomId; matchState.type=type; matchState.side="guest";
      matchState.currentRound=-1; matchState.currentQuestion=null; matchState.localLocked=false; matchState.introShown=false; matchState.voteSubmitted=false;
      if(typeof showMatchSearching==="function")showMatchSearching(type,roomId); else showMatchWaiting(roomId,type);
      startMatchPolling();
    }catch(e){ alert(typeof getJoinErrorMessage==="function" ? getJoinErrorMessage(e) : "参加できませんでした"); console.log(e); }
  };

  function selectedVoteGenres(){
    const checked=[...document.querySelectorAll(".matchGenreCheck:checked")].map(x=>x.value);
    return checked.length ? checked : ["random"];
  }
  window.submitMatchGenreVote = async function(){
    if(!matchState || !matchState.roomId)return;
    const genres=selectedVoteGenres();
    matchState.voteSubmitted=true;
    const area=document.getElementById("panelArea");
    if(area)area.innerHTML=`<div class="matchBox"><h2>投票完了</h2><p>選択：${genres.map(genreLabel).join("、")}</p><p>相手の投票を待っています...</p></div>`;
    try{ await window.setMatchVote(matchState.roomId, matchState.side, genres); }
    catch(e){ console.error(e); alert("投票に失敗しました："+(e.code||e.message||e)); }
  };

  function showVoteScreen(room){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    document.getElementById("homeScreen").classList.add("active");
    const panel=document.getElementById("panelArea");
    const myVote=matchState.side==="host"?room.hostVote:room.guestVote;
    const otherVote=matchState.side==="host"?room.guestVote:room.hostVote;
    if(myVote && myVote.length){
      panel.innerHTML=`<div class="matchBox"><h2>投票完了</h2><p>選択：${myVote.map(genreLabel).join("、")}</p><p>${otherVote&&otherVote.length?"分野を決定中...":"相手の投票を待っています..."}</p></div>`;
      return;
    }
    panel.innerHTML=`
      <h2>🧪 出題分野を投票</h2>
      <div class="matchBox matchVoteBox">
        <p>出したい分野を複数選択できます。</p>
        <div class="genreGrid">
          ${GENRES.map(g=>`<label class="genreChoice"><input class="matchGenreCheck" type="checkbox" value="${g.id}" ${g.id==="random"?"checked":""}> ${g.label}</label>`).join("")}
        </div>
        <button onclick="submitMatchGenreVote()">この分野で投票</button>
        <p>共通分野がある場合は共通分野が優先されます。</p>
      </div>`;
  }

  const oldHandle = (typeof handleMatchRoomRealtime==="function") ? handleMatchRoomRealtime : null;
  window.handleMatchRoomRealtime = handleMatchRoomRealtime = function(room){
    if(!matchState.active || !room)return;
    matchState.room=room;
    if(room.status==="waiting"){ if(typeof showMatchWaiting==="function")showMatchWaiting(room.roomId,room.type); return; }
    if(room.status==="finished" || room.status==="canceled"){ finishMatch(room); return; }
    if(room.status==="playing" && !room.finalGenre){
      const hostVote=room.hostVote||[];
      const guestVote=room.guestVote||[];
      if(hostVote.length && guestVote.length && matchState.side==="host" && !room.finalizingGenre){
        const finalGenre=decideGenres(hostVote,guestVote);
        const questions=makeQuestionsForGenreList([finalGenre]);
        window.finalizeMatchVote(room.roomId, finalGenre, questions).catch(e=>console.error("finalize vote failed",e));
      }
      showVoteScreen(room);
      return;
    }
    if(!matchState.introShown){
      matchState.introShown=true;
      if(typeof showMatchFoundIntro==="function")showMatchFoundIntro(room,()=>showMatchQuestion(room,true));
      else showMatchQuestion(room,true);
      return;
    }
    if(room.round!==matchState.currentRound){
      matchState.currentRound=room.round;
      matchState.currentQuestion=room.currentQuestion;
      matchState.localLocked=false;
      showMatchQuestion(room,false);
    }else{ updateMatchHeader(room); }
  };

  const oldShowMatchQuestion = window.showMatchQuestion || showMatchQuestion;
  window.showMatchQuestion = showMatchQuestion = function(room,fromIntro=false){
    oldShowMatchQuestion(room,fromIntro);
    const result=document.getElementById("result");
    if(result && room && room.finalGenreLabel){
      result.innerHTML = `<p>出題分野：${room.finalGenreLabel}</p>` + result.innerHTML;
    }
  };

  window.showTermsPage = function(){
    const html=`<h2>📜 利用規約</h2>
      <div class="guideItem"><h3>第1条 本サービスについて</h3><p>数学マスターは、数学学習を目的としたWebゲームです。</p></div>
      <div class="guideItem"><h3>第2条 禁止事項</h3><p>チート、不正アクセス、ランキング改ざん、荒らし、他ユーザーへの迷惑行為を禁止します。</p></div>
      <div class="guideItem"><h3>第3条 データの扱い</h3><p>不正または不適切と判断したデータは、運営側で削除・制限する場合があります。</p></div>
      <div class="guideItem"><h3>第4条 サービス変更</h3><p>本サービスの内容は、予告なく変更・停止する場合があります。</p></div>
      <div class="guideItem"><h3>第5条 免責</h3><p>本サービスの利用により生じた損害について、運営者は法令上必要な範囲を除き責任を負いません。</p></div>`;
    openSimplePage(html);
  };
  window.showPrivacyPage = function(){
    const html=`<h2>🔒 プライバシーポリシー</h2>
      <div class="guideItem"><h3>取得する情報</h3><p>ユーザー識別ID、Google表示名、プレイヤー名、フレンドコード、ゲーム進行データを取得する場合があります。</p></div>
      <div class="guideItem"><h3>取得しない情報</h3><p>メールアドレス、パスワード、住所、クレジットカード情報は保存しません。</p></div>
      <div class="guideItem"><h3>利用目的</h3><p>ログイン、セーブデータ保存、ランキング、フレンド機能、不正利用対策、サービス改善のために利用します。</p></div>
      <div class="guideItem"><h3>公開される情報</h3><p>プレイヤー名、称号、レベル、フレンドコードなど、ゲーム内表示に必要な情報が公開される場合があります。</p></div>
      <div class="guideItem"><h3>第三者提供</h3><p>法令に基づく場合を除き、個人を特定できる非公開情報を第三者へ提供しません。</p></div>`;
    openSimplePage(html);
  };
  window.showOtherMenu = function(){
    document.getElementById("panelArea").innerHTML=`
      <h2>⚙️ その他</h2>
      <button class="modeBtn" onclick="showGuide()">📖 遊び方</button>
      <button class="modeBtn" onclick="showDailyMission()">🎯 デイリーミッション</button>
      <button class="modeBtn" onclick="showLoginCalendar()">📅 ログボカレンダー</button>
      <button class="modeBtn" onclick="showSettings()">⚙️ 設定</button>
      <button class="modeBtn" onclick="showContact()">📩 お問い合わせ</button>
      <button class="modeBtn" onclick="showTermsPage()">📜 利用規約</button>
      <button class="modeBtn" onclick="showPrivacyPage()">🔒 プライバシーポリシー</button>`;
  };

  if(typeof UPDATE_NOTES !== "undefined"){
    UPDATE_NOTES["3.0.5"]=[
      "β版対戦に出題分野の複数選択投票を追加",
      "共通分野を優先して出題範囲を決定するように改善",
      "利用規約とプライバシーポリシーを追加",
      "0と1の省略に関する表示・入力判定を改善"
    ];
  }
})();


// Ver3.0.6 friend-match beta vote / random-match rollback patch
(function(){
  const GENRES_306 = [
    {id:"arithmetic", label:"四則演算"},
    {id:"prime", label:"素因数分解"},
    {id:"factor", label:"因数分解"},
    {id:"expand", label:"展開"},
    {id:"derivative", label:"微分"},
    {id:"integral", label:"積分"},
    {id:"random", label:"ランダム"}
  ];
  function genreLabel306(id){ return (GENRES_306.find(g=>g.id===id)||{}).label || id; }
  function expandedGenres306(list){
    const a=(list&&list.length?list:["random"]);
    if(a.includes("random")) return ["arithmetic","prime","factor","expand","derivative","integral"];
    return a.filter(x=>x && x!=="random");
  }
  function decideGenres306(a,b){
    const A=expandedGenres306(a), B=expandedGenres306(b);
    const common=A.filter(x=>B.includes(x));
    const pool=common.length ? common : [...new Set([...A,...B])];
    return pool[Math.floor(Math.random()*pool.length)] || "arithmetic";
  }
  function makeQuestionsForGenres306(genres){
    const oldMode=mode, oldDiff=difficulty;
    const pool=expandedGenres306(genres);
    const list=[];
    for(let i=0;i<9;i++){
      mode=pool[Math.floor(Math.random()*pool.length)] || "arithmetic";
      difficulty="normal";
      list.push(cleanQuestionObject(generateQuestion()));
    }
    mode=oldMode; difficulty=oldDiff;
    return list;
  }

  window.showMatchMenu = function(){
    document.getElementById("panelArea").innerHTML=`
      <h2>⚔️ 対戦</h2>
      <button class="modeBtn" onclick="selectRankingMode()">🏆 週間ランキングモード</button>
      <button class="modeBtn" onclick="showOnlineMatchMenu()">⚔️ ランダムマッチ</button>
      <button class="modeBtn" onclick="showFriendMatchMenu()">🧪 フレンド対戦β</button>
      <button class="modeBtn" onclick="showMatchHistory()">📜 対戦履歴</button>
      <button class="modeBtn" onclick="showGenreStats()">📊 ジャンル別正答率</button>
      <div class="matchBox">
        <p>ランダムマッチ：通常ルールで対戦します。</p>
        <p>フレンド対戦β：マッチ成立後に、両者が出題分野を複数選択できます。</p>
      </div>`;
    if(typeof ensureHomeButton==="function")ensureHomeButton();
  };

  window.showOnlineMatchMenu = async function(){
    const box=document.getElementById("panelArea");
    box.innerHTML=`
      <h2>⚔️ ランダムマッチ</h2>
      <div class="matchBox">
        <p>募集中の部屋から参加できます。</p>
        <p>通常ルールでそのまま対戦します。</p>
        <button onclick="createOnlineMatch()">新しく募集する</button>
        <button onclick="showOnlineMatchMenu()">更新</button>
      </div>
      <h3>募集中一覧</h3>
      <div id="openRoomList">読み込み中...</div>`;
    try{
      const rooms=await loadOpenMatchRooms();
      let html="";
      if(!rooms.length)html="<p>現在募集中の部屋はありません。</p>";
      for(const r of rooms){
        const myRate=(playerData&&playerData.rating)||1000;
        const label=(typeof matchThreatLabel==="function")?matchThreatLabel(myRate,r.hostRate||1000):"";
        html+=`<div class="openRoomItem"><b>${r.hostName||"名無し"}</b><br>Lv ${r.hostLevel||1}<br>${titleHTML(r.hostTitle||"初心者")}<br>レート：${r.hostRate||1000}<br><b>${label}</b><br><button onclick="joinOpenOnlineMatch('${r.roomId}')">参加する</button></div>`;
      }
      document.getElementById("openRoomList").innerHTML=html;
    }catch(e){
      console.error(e);
      document.getElementById("openRoomList").innerHTML=`<p>募集中一覧の取得に失敗しました。<br>${e.code || e.message || e}</p>`;
    }
  };

  window.showFriendMatchMenu = function(){
    document.getElementById("panelArea").innerHTML=`
      <h2>🧪 フレンド対戦β</h2>
      <div class="matchBox">
        <p>友達とルームIDで対戦できます。</p>
        <p>マッチ成立後、両者が出題分野を複数選択して投票します。</p>
        <button onclick="createFriendMatch()">ルーム作成</button>
        <input id="joinRoomIdFriend" placeholder="ルームID">
        <button onclick="joinFriendMatch()">ルーム参加</button>
      </div>`;
    if(typeof ensureHomeButton==="function")ensureHomeButton();
  };

  window.createMatch = createMatch = async function(type){
    try{
      const questions = (type==="friend") ? makeQuestionsForGenres306(["random"]) : makeMatchQuestions();
      const p=(typeof getMyMatchProfileForV303==="function")?getMyMatchProfileForV303():{name:playerProfile.name||"名無し",title:playerData.equippedTitle||"初心者",level:getLevel(),rate:playerData.rating||1000};
      const roomId=await createMatchRoom({type:type,name:p.name,title:p.title,level:p.level,rate:p.rate,questions:questions,betaVote:type==="friend"});
      matchState.active=true; matchState.roomId=roomId; matchState.type=type; matchState.side="host";
      matchState.currentRound=-1; matchState.currentQuestion=null; matchState.localLocked=false; matchState.introShown=false; matchState.voteSubmitted=false;
      if(typeof showMatchSearching==="function")showMatchSearching(type,roomId); else showMatchWaiting(roomId,type);
      startMatchPolling();
    }catch(e){ alert("ルーム作成に失敗しました：" + (e.code || e.message || e)); console.error(e); }
  };

  window.joinMatch = joinMatch = async function(roomId,type){
    if(!roomId){ alert("ルームIDを入力して"); return; }
    try{
      const p=(typeof getMyMatchProfileForV303==="function")?getMyMatchProfileForV303():{name:playerProfile.name||"名無し",title:playerData.equippedTitle||"初心者",level:getLevel(),rate:playerData.rating||1000};
      await joinMatchRoom(roomId,{name:p.name,title:p.title,level:p.level,rate:p.rate});
      matchState.active=true; matchState.roomId=roomId; matchState.type=type; matchState.side="guest";
      matchState.currentRound=-1; matchState.currentQuestion=null; matchState.localLocked=false; matchState.introShown=false; matchState.voteSubmitted=false;
      if(typeof showMatchSearching==="function")showMatchSearching(type,roomId); else showMatchWaiting(roomId,type);
      startMatchPolling();
    }catch(e){ alert(typeof getJoinErrorMessage==="function" ? getJoinErrorMessage(e) : "参加できませんでした"); console.log(e); }
  };

  function selectedVoteGenres306(){
    const checked=[...document.querySelectorAll(".matchGenreCheck:checked")].map(x=>x.value);
    return checked.length ? checked : ["random"];
  }
  window.submitMatchGenreVote = async function(){
    if(!matchState || !matchState.roomId)return;
    const genres=selectedVoteGenres306();
    matchState.voteSubmitted=true;
    const area=document.getElementById("panelArea");
    if(area)area.innerHTML=`<div class="matchBox"><h2>投票完了</h2><p>選択：${genres.map(genreLabel306).join("、")}</p><p>相手の投票を待っています...</p></div>`;
    try{ await window.setMatchVote(matchState.roomId, matchState.side, genres); }
    catch(e){ console.error(e); alert("投票に失敗しました："+(e.code||e.message||e)); }
  };

  function showVoteScreen306(room){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    document.getElementById("homeScreen").classList.add("active");
    const panel=document.getElementById("panelArea");
    const myVote=matchState.side==="host"?room.hostVote:room.guestVote;
    const otherVote=matchState.side==="host"?room.guestVote:room.hostVote;
    if(myVote && myVote.length){
      panel.innerHTML=`<div class="matchBox"><h2>投票完了</h2><p>選択：${myVote.map(genreLabel306).join("、")}</p><p>${otherVote&&otherVote.length?"分野を決定中...":"相手の投票を待っています..."}</p></div>`;
      return;
    }
    panel.innerHTML=`
      <h2>🧪 出題分野を投票</h2>
      <div class="matchBox matchVoteBox">
        <p>出したい分野を複数選択できます。</p>
        <div class="genreGrid">
          ${GENRES_306.map(g=>`<label class="genreChoice"><input class="matchGenreCheck" type="checkbox" value="${g.id}" ${g.id==="random"?"checked":""}> ${g.label}</label>`).join("")}
        </div>
        <button onclick="submitMatchGenreVote()">この分野で投票</button>
        <p>共通分野がある場合は共通分野が優先されます。</p>
      </div>`;
  }

  window.handleMatchRoomRealtime = handleMatchRoomRealtime = function(room){
    if(!matchState.active || !room)return;
    matchState.room=room;
    if(room.status==="waiting"){ if(typeof showMatchWaiting==="function")showMatchWaiting(room.roomId,room.type); return; }
    if(room.status==="finished" || room.status==="canceled"){ finishMatch(room); return; }

    if(room.type==="friend" && room.status==="playing" && !room.finalGenre){
      const hostVote=room.hostVote||[];
      const guestVote=room.guestVote||[];
      if(hostVote.length && guestVote.length && matchState.side==="host" && !room.finalizingGenre){
        const finalGenre=decideGenres306(hostVote,guestVote);
        const questions=makeQuestionsForGenres306([finalGenre]);
        window.finalizeMatchVote(room.roomId, finalGenre, questions).catch(e=>console.error("finalize vote failed",e));
      }
      showVoteScreen306(room);
      return;
    }

    if(!matchState.introShown){
      matchState.introShown=true;
      if(typeof showMatchFoundIntro==="function")showMatchFoundIntro(room,()=>showMatchQuestion(room,true));
      else showMatchQuestion(room,true);
      return;
    }
    if(room.round!==matchState.currentRound){
      matchState.currentRound=room.round;
      matchState.currentQuestion=room.currentQuestion;
      matchState.localLocked=false;
      showMatchQuestion(room,false);
    }else{ updateMatchHeader(room); }
  };

  if(typeof UPDATE_NOTES !== "undefined"){
    UPDATE_NOTES["3.0.6"]=[
      "フレンド対戦βに複数選択投票ルールを適用",
      "ランダムマッチを通常ルールに戻しました",
      "対戦メニューの表記を整理しました"
    ];
  }
})();


// Ver3.1.1 serial titles patch（コードは非表示、称号は残す）
(function(){
  const VERSION_310 = "3.1.3";
  try{
    if(typeof VERSION !== "undefined" && VERSION !== VERSION_310){
      // const VERSION は再代入できないため表示側はindexとUPDATE_NOTESで更新
    }
  }catch(e){}

  const SPECIAL_SERIAL_TITLES_310 = [
    "⚡️創設者⚡️",
    "古参勢",
    "🧊なかなかお兄ちゃんの専属メイド🧊",
    "🎮ゲームβテスター🎮"
  ];

  const SERIAL_CODES_310 = {
    "FOUNDER2026": {
      titles:["⚡️創設者⚡️"],
      message:"⚡️創設者⚡️ を獲得しました！"
    },
    "KOSAN2026": {
      titles:["古参勢"],
      expiresAt:"2026-06-13T14:59:59Z",
      message:"古参勢 を獲得しました！"
    },
    "BETA2026": {
      titles:["🧊なかなかお兄ちゃんの専属メイド🧊","🎮ゲームβテスター🎮"],
      message:"限定称号を2つ獲得しました！"
    }
  };

  function isLoggedInForSerial310(){
    return !!((window.getGoogleLoginInfo && window.getGoogleLoginInfo()) || localStorage.getItem("googleLoginUid") || localStorage.getItem("googleLoginLinked"));
  }

  function ensureTitleStore310(){
    if(!window.playerData && typeof playerData !== "undefined") window.playerData = playerData;
    if(typeof playerData === "undefined") return null;
    if(!playerData.unlockedTitles) playerData.unlockedTitles = ["初心者"];
    if(!playerData.serialRedeemedCodes) playerData.serialRedeemedCodes = [];
    return playerData;
  }

  function addTitles310(titles){
    const data = ensureTitleStore310();
    if(!data) return [];
    const added=[];
    for(const t of titles){
      if(!data.unlockedTitles.includes(t)){
        data.unlockedTitles.push(t);
        added.push(t);
      }
    }
    if(!data.equippedTitle && data.unlockedTitles.length) data.equippedTitle = data.unlockedTitles[0];
    if(typeof saveAllData === "function") saveAllData();
    if(typeof updateHomeStatus === "function") updateHomeStatus();
    return added;
  }

  window.copySerialCode310 = async function(code){
    try{
      await navigator.clipboard.writeText(code);
      alert("シリアルコードをコピーしました：" + code);
    }catch(e){
      prompt("コピーしてください", code);
    }
  };

  // シリアルコードは非公開。ログイン画面にはコードを表示しない。
  window.serialCampaignLoginHTML = function(){
    return "";
  };

  window.showSerialCodePage = function(){
    const panel=document.getElementById("panelArea");
    const menu=document.getElementById("homeMenu");
    if(menu) menu.classList.add("hidden");
    if(!panel) return;
    if(!isLoggedInForSerial310()){
      panel.innerHTML=`
        <h2>🎁 シリアルコード</h2>
        <div class="profileItem">
          <p>シリアルコードの使用にはログインが必要です。</p>
          <button class="googleLoginBtn" onclick="loginGoogle()">Googleログイン</button>
        </div>`;
      if(typeof ensureHomeButton === "function") ensureHomeButton();
      return;
    }
    panel.innerHTML=`
      <h2>🎁 シリアルコード</h2>
      <div class="profileItem">
        <p>コードを入力してください。</p>
        <input id="serialCodeInput" placeholder="シリアルコード" autocomplete="off">
        <button onclick="redeemSerialCode310()">受け取る</button>
      </div>
      <div id="serialCodeResult"></div>`;
    if(typeof ensureHomeButton === "function") ensureHomeButton();
  };

  window.redeemSerialCode310 = function(){
    if(!isLoggedInForSerial310()){
      alert("シリアルコードの使用にはログインが必要です");
      return;
    }
    const input=document.getElementById("serialCodeInput");
    const result=document.getElementById("serialCodeResult");
    const code=(input && input.value ? input.value : "").trim().toUpperCase().replace(/\s|-/g,"");
    const item=SERIAL_CODES_310[code];
    const data=ensureTitleStore310();
    if(!code){ alert("コードを入力してください"); return; }
    if(!item){ alert("このコードは使用できません"); return; }
    if(item.expiresAt && Date.now() > new Date(item.expiresAt).getTime()){
      alert("このコードは期限切れです");
      return;
    }
    if(data.serialRedeemedCodes && data.serialRedeemedCodes.includes(code)){
      alert("このコードはすでに使用済みです");
      return;
    }
    const added=addTitles310(item.titles);
    if(!data.serialRedeemedCodes) data.serialRedeemedCodes=[];
    data.serialRedeemedCodes.push(code);
    if(typeof saveAllData === "function") saveAllData();
    const titlesHTML=item.titles.map(t=>titleHTML(t)).join("<br>");
    const msg=`🎉 シリアルコード認証成功！<br><br>${titlesHTML}<br><br>${item.message||"称号を獲得しました！"}`;
    if(result) result.innerHTML=`<div class="profileItem serialResultBox">${msg}</div>`;
    alert((item.message||"称号を獲得しました！") + (added.length?"":"\n※称号はすでに所持しています"));
    if(typeof showTitles === "function") setTimeout(()=>{},0);
  };

  if(typeof titleHTML === "function" && !window.__titleHTML310Wrapped){
    window.__titleHTML310Wrapped = true;
    const oldTitleHTML310 = titleHTML;
    titleHTML = function(t){
      if(t === "⚡️創設者⚡️") return `<span class="founderTitle">⚡️創設者⚡️</span>`;
      if(t === "古参勢") return `<span class="oldGuardTitle">古参勢</span>`;
      if(t === "🧊なかなかお兄ちゃんの専属メイド🧊") return `<span class="maidIceTitle">🧊なかなかお兄ちゃんの専属メイド🧊</span>`;
      if(t === "🎮ゲームβテスター🎮") return `<span class="gameBetaTitle">🎮ゲームβテスター🎮</span>`;
      return oldTitleHTML310(t);
    };
    window.titleHTML = titleHTML;
  }

  if(typeof allTitles === "function" && !window.__allTitles310Wrapped){
    window.__allTitles310Wrapped = true;
    const oldAllTitles310 = allTitles;
    allTitles = function(){
      const list = oldAllTitles310();
      for(const t of SPECIAL_SERIAL_TITLES_310){
        if(!list.includes(t)) list.unshift(t);
      }
      return list;
    };
    window.allTitles = allTitles;
  }

  if(typeof UPDATE_NOTES !== "undefined"){
    UPDATE_NOTES["3.1.1"] = [
      "シリアルコード画面を調整",
      "称号システムを調整",
      "一部UIを改善"
    ];
    if(UPDATE_NOTES["3.1.0"]){
      UPDATE_NOTES["3.1.0"] = [
        "称号システムを調整",
        "ログイン画面の表示を改善",
        "一部UIを調整"
      ];
    }
    if(UPDATE_NOTES["3.0.9"]){
      UPDATE_NOTES["3.0.9"] = [
        "称号システムを調整",
        "ログイン画面の表示を改善",
        "一部UIを調整"
      ];
    }
  }
})();


// Ver3.1.3 serial input visibility fix
(function(){
  const KOSAN_CODE_312 = "KOSAN2026";
  const KOSAN_EXPIRES_312 = "2026-06-13T14:59:59Z";

  function isLoggedInSerial312(){
    return !!((window.getGoogleLoginInfo && window.getGoogleLoginInfo()) || localStorage.getItem("googleLoginUid") || localStorage.getItem("googleLoginLinked"));
  }

  function isKosanActive312(){
    return Date.now() <= new Date(KOSAN_EXPIRES_312).getTime();
  }

  window.copySerialCode312 = async function(code){
    try{
      await navigator.clipboard.writeText(code);
      alert("シリアルコードをコピーしました：" + code);
    }catch(e){
      prompt("コピーしてください", code);
    }
  };

  // ログイン済みの人だけ、古参勢コードをログイン欄に表示してタップコピー可能にする
  window.serialCampaignLoginHTML = function(){
    if(!isLoggedInSerial312()) return "";
    if(!isKosanActive312()) return "";
    return `
      <div class="serialLoginBox" onclick="copySerialCode312('${KOSAN_CODE_312}')" title="タップでコピー">
        <div>🎁 1週間限定シリアルコード</div>
        <b>${KOSAN_CODE_312}</b>
        <div class="serialSmallText">タップでコピーできます</div>
      </div>
    `;
  };

  // その他の一番下にシリアルコードを置く
  window.showOtherMenu = function(){
    const panel=document.getElementById("panelArea");
    const menu=document.getElementById("homeMenu");
    if(menu) menu.classList.add("hidden");
    if(!panel) return;
    panel.innerHTML=`
      <h2>⚙️ その他</h2>
      <button class="modeBtn" onclick="showNewsPage()">📢 お知らせ</button>
      <button class="modeBtn" onclick="showStatsPage()">📊 成績</button>
      <button class="modeBtn" onclick="showGuide()">📖 遊び方</button>
      <button class="modeBtn" onclick="showDailyMission()">🎯 デイリーミッション</button>
      <button class="modeBtn" onclick="showLoginCalendar()">📅 ログボカレンダー</button>
      <button class="modeBtn" onclick="showSettings()">⚙️ 設定</button>
      <button class="modeBtn" onclick="showContact()">📩 お問い合わせ</button>
      <button class="modeBtn" onclick="showSerialCodePage()">🎁 シリアルコード</button>
    `;
    if(typeof ensureHomeButton === "function") ensureHomeButton();
  };

  // 入力欄を必ず出す。BETA2026は有効だが表示しない。
  window.showSerialCodePage = function(){
    const panel=document.getElementById("panelArea");
    const menu=document.getElementById("homeMenu");
    if(menu) menu.classList.add("hidden");
    if(!panel) return;

    if(!isLoggedInSerial312()){
      panel.innerHTML=`
        <h2>🎁 シリアルコード</h2>
        <div class="profileItem">
          <p>シリアルコードの使用にはログインが必要です。</p>
          <button class="googleLoginBtn" onclick="loginGoogle()">Googleログイン</button>
        </div>`;
      if(typeof ensureHomeButton === "function") ensureHomeButton();
      return;
    }

    panel.innerHTML=`
      <h2>🎁 シリアルコード</h2>
      <div class="profileItem serialInputBox">
        <p>コードを入力してください。</p>
        <input id="serialCodeInput" placeholder="シリアルコード" autocomplete="off">
        <button onclick="redeemSerialCode310()">受け取る</button>
      </div>
      <div id="serialCodeResult"></div>`;
    if(typeof ensureHomeButton === "function") ensureHomeButton();
  };

  if(typeof UPDATE_NOTES !== "undefined"){
    UPDATE_NOTES["3.1.3"] = [
      "ログイン画面に手動セーブを追加",
      "シリアルコード画面を調整",
      "ログイン画面の表示を改善",
      "一部UIを改善"
    ];
  }
})();

// Ver3.1.4 safe patch: reward serial + terms/privacy + other menu cleanup
(function(){
  const REWARD_CODE_314 = "REWARD2026";

  function getSerialData314(){
    if(typeof playerData === "undefined") return null;
    if(!playerData.unlockedTitles) playerData.unlockedTitles=["初心者"];
    if(!playerData.serialRedeemedCodes) playerData.serialRedeemedCodes=[];
    if(!playerData.coins) playerData.coins=0;
    if(!playerData.exp) playerData.exp=0;
    return playerData;
  }

  const oldRedeemSerialCode314 = window.redeemSerialCode310;
  window.redeemSerialCode310 = function(){
    const input=document.getElementById("serialCodeInput");
    const result=document.getElementById("serialCodeResult");
    const code=(input && input.value ? input.value : "").trim().toUpperCase().replace(/\s|-/g,"");

    if(code === REWARD_CODE_314){
      const loggedIn = !!((window.getGoogleLoginInfo && window.getGoogleLoginInfo()) || localStorage.getItem("googleLoginUid") || localStorage.getItem("googleLoginLinked"));
      if(!loggedIn){ alert("シリアルコードの使用にはログインが必要です"); return; }
      const data=getSerialData314();
      if(!data){ alert("データを読み込めませんでした"); return; }
      if(data.serialRedeemedCodes.includes(code)){
        alert("このコードはすでに使用済みです");
        return;
      }
      data.serialRedeemedCodes.push(code);
      data.exp=(data.exp||0)+500;
      data.coins=(data.coins||0)+100;
      if(typeof saveAllData === "function") saveAllData();
      if(typeof updateHomeStatus === "function") updateHomeStatus();
      const msg="🎉 シリアルコード認証成功！<br><br>+500EXP<br>+100コイン";
      if(result) result.innerHTML=`<div class="profileItem serialResultBox">${msg}</div>`;
      alert("500EXPと100コインを受け取りました！");
      return;
    }

    if(typeof oldRedeemSerialCode314 === "function"){
      return oldRedeemSerialCode314();
    }
    alert("このコードは使用できません");
  };

  window.showTermsPage = function(){
    const menu=document.getElementById("homeMenu");
    const panel=document.getElementById("panelArea");
    if(menu) menu.classList.add("hidden");
    if(!panel) return;
    panel.innerHTML=`
      <h2>📜 利用規約</h2>
      <div class="guideItem">
        <h3>第1条（目的）</h3>
        <p>本規約は、数学マスターの利用条件を定めるものです。</p>
      </div>
      <div class="guideItem">
        <h3>第2条（禁止事項）</h3>
        <p>チート、データ改ざん、荒らし、他ユーザーへの迷惑行為、サービス運営を妨害する行為を禁止します。</p>
      </div>
      <div class="guideItem">
        <h3>第3条（データ）</h3>
        <p>不正なデータや不適切な投稿は、運営判断で削除・修正する場合があります。</p>
      </div>
      <div class="guideItem">
        <h3>第4条（サービス変更）</h3>
        <p>機能や内容は、予告なく変更・停止する場合があります。</p>
      </div>
      <div class="guideItem">
        <h3>第5条（免責）</h3>
        <p>本サービスの利用により生じた損害について、運営は可能な範囲で対応しますが、すべての責任を負うものではありません。</p>
      </div>
    `;
    if(typeof ensureHomeButton === "function") ensureHomeButton();
  };

  window.showPrivacyPolicyPage = function(){
    const menu=document.getElementById("homeMenu");
    const panel=document.getElementById("panelArea");
    if(menu) menu.classList.add("hidden");
    if(!panel) return;
    panel.innerHTML=`
      <h2>🔒 プライバシーポリシー</h2>
      <div class="guideItem">
        <h3>取得する情報</h3>
        <p>ログイン識別子、Google表示名、プレイヤー名、フレンドコード、ゲーム進行データを保存する場合があります。</p>
      </div>
      <div class="guideItem">
        <h3>取得しない情報</h3>
        <p>Googleアカウントのパスワードは取得しません。メールアドレスは保存しない方針です。</p>
      </div>
      <div class="guideItem">
        <h3>利用目的</h3>
        <p>ログイン、クラウドセーブ、ランキング、フレンド機能、不正利用対策、サービス改善のために利用します。</p>
      </div>
      <div class="guideItem">
        <h3>公開される情報</h3>
        <p>プレイヤー名、称号、レベル、フレンドコードなど、ゲーム内表示に必要な情報が表示される場合があります。</p>
      </div>
      <div class="guideItem">
        <h3>第三者提供</h3>
        <p>法令に基づく場合を除き、個人情報を第三者に提供しません。</p>
      </div>
    `;
    if(typeof ensureHomeButton === "function") ensureHomeButton();
  };

  // その他から「お知らせ」「成績」を外し、規約・プライバシーポリシーを追加。シリアルコードは一番下。
  window.showOtherMenu = function(){
    const panel=document.getElementById("panelArea");
    const menu=document.getElementById("homeMenu");
    if(menu) menu.classList.add("hidden");
    if(!panel) return;
    panel.innerHTML=`
      <h2>⚙️ その他</h2>
      <button class="modeBtn" onclick="showGuide()">📖 遊び方</button>
      <button class="modeBtn" onclick="showDailyMission()">🎯 デイリーミッション</button>
      <button class="modeBtn" onclick="showLoginCalendar()">📅 ログボカレンダー</button>
      <button class="modeBtn" onclick="showSettings()">⚙️ 設定</button>
      <button class="modeBtn" onclick="showContact()">📩 お問い合わせ</button>
      <button class="modeBtn" onclick="showTermsPage()">📜 利用規約</button>
      <button class="modeBtn" onclick="showPrivacyPolicyPage()">🔒 プライバシーポリシー</button>
      <button class="modeBtn" onclick="showSerialCodePage()">🎁 シリアルコード</button>
    `;
    if(typeof ensureHomeButton === "function") ensureHomeButton();
  };

  if(typeof UPDATE_NOTES !== "undefined"){
    UPDATE_NOTES["3.1.4"] = [
      "利用規約を追加",
      "プライバシーポリシーを追加",
      "その他メニューを整理",
      "一部機能を調整"
    ];
  }
})();

console.log("app.js Ver 3.1.6 cachefix loaded");
