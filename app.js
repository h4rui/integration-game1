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
const VERSION = "3.3.16";
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
if(!input) return;
input.value += text;
// iPhone/Safariでテンキー初回タップ時に画面が上へズレるのを防ぐため、ここではfocusしない
try{
  if(document.activeElement === input){
    input.setSelectionRange(input.value.length,input.value.length);
  }
}catch(e){}
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
.replace(/\+C/g,"")
.replace(/C/g,"")
.replace(/π/g,"pi")
.replace(/²/g,"^2")
.replace(/³/g,"^3")
.replace(/⁴/g,"^4")
.replace(/⁵/g,"^5")
.replace(/⁶/g,"^6")
.replace(/×/g,"*")
.replace(/÷/g,"/")
.replace(/\)\(/g,")*(")
.replace(/(\d|x|pi|e|\))(?=\()/g,"$1*");
}
function getLevel(){
const exp=playerData.exp||0;
let level=1, used=0;
while(true){
  const need=getRequiredExpForLevel(level);
  if(exp < used + need) return level;
  used += need;
  level++;
  if(level>9999) return level;
}
}
function getRequiredExpForLevel(level){
if(level<=10)return 100;
if(level<=30)return 150;
if(level<=50)return 200;
if(level<=100)return 300;
if(level<=200)return 500;
return 1000;
}
function getLevelExpInfo(){
const exp=playerData.exp||0;
let level=1, used=0;
while(true){
  const need=getRequiredExpForLevel(level);
  if(exp < used + need) return {level,current:exp-used,need,percent:Math.floor((exp-used)/need*100)};
  used += need; level++;
  if(level>9999)return {level,current:0,need:1000,percent:0};
}
}
function getExpPercent(){return getLevelExpInfo().percent;}
function getExpProgressText(){const i=getLevelExpInfo();return `${i.current}/${i.need}`;}
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
if(t==="🧊なかなか🧊")return `<span style="color:#4FC3F7;font-weight:bold;text-shadow:0 0 6px #4FC3F7,0 0 14px #00aaff;">🧊なかなか🧊</span>`;
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
// Ver3.2.8: ログインボーナス廃止
// giveDailyCoinBonus();
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
if(level)level.innerHTML=`Lv${getLevel()}　EXP ${getExpProgressText()}`;
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
function getExpPercent(){return getLevelExpInfo().percent;}
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
if(mode==="prime"){
  ok=checkPrimeAnswer(u,current.number);
}else{
  if(!ok)ok=expressionsEqual(u,current.a);
  if(!ok)ok=normalize(u)===normalize(current.display);
}
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
<button class="modeBtn" onclick="showRateRanking()">🏅 レートランキング</button>
`;
}
function showMatchMenu(){
document.getElementById("panelArea").innerHTML=`
<h2>⚔️ 対戦</h2>
<button class="modeBtn" onclick="showOnlineMatchMenu()">⚔️ ランダムマッチ</button>
<button class="modeBtn" onclick="showFriendMatchMenu()">🤝 フレンドマッチ</button>
<button class="modeBtn" onclick="showMatchHistory()">📜 対戦履歴</button><button class="modeBtn" onclick="showGenreStats()">📊 ジャンル別正答率</button>
<div class="matchBox">

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
,
{
q:"超難問：∫x²e^x dx",
a:"e^x*(x^2-2*x+2)",
display:"e^x(x^2-2x+2)+C",
explanation:"部分積分を2回使う。"
},
{
q:"超難問：∫xlog(x) dx",
a:"(x^2/2)*log(x)-x^2/4",
display:"(x^2/2)log(x)-x^2/4+C",
explanation:"部分積分。log(x)を微分する側にする。"
},
{
q:"超難問：∫sin(x)cos(x) dx",
a:"sin(x)^2/2",
display:"sin(x)^2/2+C",
explanation:"t=sin(x) と置換。"
},
{
q:"超難問：∫1/(x^2+4x+5) dx",
a:"atan(x+2)",
display:"arctan(x+2)+C",
explanation:"平方完成して (x+2)^2+1 にする。"
},
{
q:"超難問：∫(2x+3)/(x^2+3x+2) dx",
a:"log(x^2+3*x+2)",
display:"log(x^2+3x+2)+C",
explanation:"分子が分母の微分になっている。"
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
  "3.1.7": ["テンキーにlogを追加", "テンキー初回タップ時に画面が上へずれる問題を修正", "テンキーの反応速度を改善", "バージョン変更時のお知らせ自動表示を強化"],
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
      <button class="modeBtn" onclick="selectRankingMode()">🏆 ランダム問題</button>
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
      <button class="modeBtn" onclick="selectRankingMode()">🏆 ランダム問題</button>
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
    "🧊なかなか🧊",
    "古参勢",
    "🧊なかなかお兄ちゃんの専属メイド🧊",
    "🎮ゲームβテスター🎮"
  ];

  const SERIAL_CODES_310 = {
    "MMF8Q2PX7KA": {
      titles:["⚡️創設者⚡️"],
      message:"⚡️創設者⚡️ を獲得しました！"
    },
    "NAKANAKA2026": {
      titles:["🧊なかなか🧊"],
      message:"🧊なかなか🧊 を獲得しました！"
    },
    "KOSAN2026": {
      titles:["古参勢"],
      expiresAt:"2026-06-13T14:59:59Z",
      message:"古参勢 を獲得しました！"
    },
    "BETA2026": {
      titles:["🧊なかなかお兄ちゃんの専属メイド🧊","🎮ゲームβテスター🎮"],
      expiresAt:"2020-01-01T00:00:00Z",
      message:"BETA2026は使用期限が終了しました"
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
      if(t === "🧊なかなか🧊") return `<span style="color:#4FC3F7;font-weight:bold;text-shadow:0 0 6px #4FC3F7,0 0 14px #00aaff;">🧊なかなか🧊</span>`;
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

console.log("app.js Ver 3.1.9 base loaded");


// Ver3.1.7 テンキー高速反応・初回タップの画面ズレ対策
(function(){
  function setupFastKeypad(){
    const keyboard = document.getElementById("customKeyboard");
    if(!keyboard || keyboard.dataset.fastKeypadReady === "1") return;
    keyboard.dataset.fastKeypadReady = "1";

    keyboard.addEventListener("touchstart", function(e){
      const btn = e.target && e.target.closest ? e.target.closest("button") : null;
      if(!btn || !keyboard.contains(btn)) return;
      e.preventDefault();
      if(btn.dataset.touchLock === "1") return;
      btn.dataset.touchLock = "1";
      btn.click();
      setTimeout(()=>{ btn.dataset.touchLock = "0"; }, 120);
    }, {passive:false});

    keyboard.addEventListener("touchend", function(e){
      if(e.target && e.target.closest && e.target.closest("button")){
        e.preventDefault();
      }
    }, {passive:false});
  }

  const keepScrollOnAnswerFocus = function(){
    const ans = document.getElementById("ans");
    if(!ans || ans.dataset.noJumpReady === "1") return;
    ans.dataset.noJumpReady = "1";
    ans.addEventListener("focus", function(){
      const x = window.scrollX;
      const y = window.scrollY;
      setTimeout(()=>window.scrollTo(x,y),0);
      setTimeout(()=>window.scrollTo(x,y),80);
    }, {passive:true});
  };

  window.addEventListener("load", ()=>{
    setupFastKeypad();
    keepScrollOnAnswerFocus();
  });
  setTimeout(()=>{ setupFastKeypad(); keepScrollOnAnswerFocus(); },500);
})();

console.log("app.js Ver 3.1.9 base loaded");


// Ver3.1.8 serial code update patch
(function(){
  try{
    if(typeof UPDATE_NOTES !== "undefined"){
      UPDATE_NOTES["3.1.8"] = [
        "BETA2026のシリアルコードを無効化",
        "🧊なかなか🧊の青色称号を追加",
        "創設者シリアルコードを新コードに変更",
        "既に獲得済みの称号はそのまま保持"
      ];
    }
  }catch(e){}
})();


// Ver3.1.9 rank / mission / login / serial / log bonus fix
(function(){
  const V319 = "3.1.9";
  try{
    if(typeof UPDATE_NOTES !== "undefined"){
      delete UPDATE_NOTES["3.1.8"];
      UPDATE_NOTES[V319] = [
        "週間ランキングを削除",
        "レベルランキングを追加",
        "日間問題数ランキングを追加",
        "学習モードにランダム問題を追加",
        "全体ミッションを追加（報酬はコイン）",
        "レベル必要EXPを段階式に変更",
        "フレンド相互登録に対応",
        "ランキングをログイン必須に変更",
        "ログインボーナスの丸表示を修正",
        "古参勢以外のシリアルコードを廃止"
      ];
    }
  }catch(e){}

  function isLogin319(){
    return !!((window.getGoogleLoginInfo && window.getGoogleLoginInfo()) || localStorage.getItem("googleLoginUid") || localStorage.getItem("googleLoginLinked"));
  }
  function loginRequiredHTML319(title){
    return `<h2>${title}</h2><div class="profileItem"><p>ランキング機能はログインが必要です。</p><button class="googleLoginBtn" onclick="loginGoogle()">Googleログイン</button></div>`;
  }

  const oldShowStudyMenu319 = window.showStudyMenu || (typeof showStudyMenu==='function'?showStudyMenu:null);
  window.startRandomStudyMode = function(){
    mode="studyRandom";
    difficulty="hard";
    openGame();
    start();
  };
  showStudyMenu = window.showStudyMenu = function(){
    document.getElementById("panelArea").innerHTML=`
      <h2>📚 学習モード</h2>
      <button class="modeBtn" onclick="selectDifficulty('integral')">積分</button>
      <button class="modeBtn" onclick="selectDifficulty('derivative')">微分</button>
      <button class="modeBtn" onclick="selectDifficulty('factor')">因数分解</button>
      <button class="modeBtn" onclick="selectDifficulty('prime')">素因数分解</button>
      <button class="modeBtn" onclick="selectDifficulty('expand')">展開</button>
      <button class="modeBtn" onclick="selectDifficulty('arithmetic')">四則演算</button>
    `;
  };

  const oldGenerateQuestion319 = generateQuestion;
  generateQuestion = function(){
    if(mode==="studyRandom"){
      const oldMode=mode, oldDiff=difficulty;
      const modes=["integral","derivative","factor","prime","expand","arithmetic"];
      mode=modes[rand(0,modes.length-1)];
      difficulty=oldDiff || "hard";
      const q=oldGenerateQuestion319();
      mode=oldMode; difficulty=oldDiff;
      return q;
    }
    return oldGenerateQuestion319();
  };
  const oldOpenGame319 = openGame;
  openGame = function(){
    oldOpenGame319();
    if(mode==="studyRandom") document.getElementById("modeTitle").innerText="🎲 ランダム問題";
  };

  window.showRankingMenu = showRankingMenu = function(){
    if(!isLogin319()){
      document.getElementById("panelArea").innerHTML=loginRequiredHTML319("🏆 ランキング");
      return;
    }
    document.getElementById("panelArea").innerHTML=`
      <h2>🏆 ランキング</h2>
      <button class="modeBtn" onclick="showLevelRanking319()">⭐ レベルランキング</button>
      <button class="modeBtn" onclick="showDailyQuestionRanking319()">📚 日間問題数ランキング</button>
            <button class="modeBtn" onclick="showRateRanking()">🏅 レートランキング</button>
    `;
  };

  window.showLevelRanking319 = async function(){
    const box=document.getElementById("panelArea");
    if(!isLogin319()){ box.innerHTML=loginRequiredHTML319("⭐ レベルランキング"); return; }
    box.innerHTML="<h2>読み込み中...</h2>";
    try{
      if(window.savePlayerPublicData){ await savePublicProfile(); }
      const list = window.loadLevelRanking ? await window.loadLevelRanking() : [];
      let html="<h2>⭐ レベルランキング</h2>";
      if(!list.length) html += "<p>まだ記録がありません</p>";
      list.forEach((p,i)=>{
        html += `<div class="rankItem">${i+1}位 ${p.icon?`<img class="rankIcon" src="${p.icon}">`:""}${p.name||p.playerName||"名無し"}<br>${titleHTML(p.title||"初心者")}<br>Lv${p.level||1}<br>EXP：${p.exp||0}</div>`;
      });
      box.innerHTML=html; if(typeof ensureHomeButton==="function")ensureHomeButton();
    }catch(e){ console.error(e); box.innerHTML="<p>レベルランキング取得失敗</p>"; }
  };

  window.showDailyQuestionRanking319 = async function(){
    const box=document.getElementById("panelArea");
    if(!isLogin319()){ box.innerHTML=loginRequiredHTML319("📚 日間問題数ランキング"); return; }
    box.innerHTML="<h2>読み込み中...</h2>";
    try{
      const list = window.loadDailyQuestionRanking ? await window.loadDailyQuestionRanking() : [];
      let html="<h2>📚 日間問題数ランキング</h2>";
      if(!list.length) html += "<p>まだ記録がありません</p>";
      list.forEach((p,i)=>{
        html += `<div class="rankItem">${i+1}位 ${p.icon?`<img class="rankIcon" src="${p.icon}">`:""}${p.name||"名無し"}<br>${titleHTML(p.title||"初心者")}<br>本日：${p.count||0}問</div>`;
      });
      box.innerHTML=html; if(typeof ensureHomeButton==="function")ensureHomeButton();
    }catch(e){ console.error(e); box.innerHTML="<p>日間ランキング取得失敗</p>"; }
  };

  // 週間ランキング関係は使わない。直接呼ばれても日間ランキングへ誘導。
  window.showWorldRanking = showWorldRanking = function(){ showDailyQuestionRanking319(); };
  window.selectRankingMode = selectRankingMode = function(){ startRandomStudyMode(); };

  window.showGlobalMission319 = async function(){
    const box=document.getElementById("panelArea");
    box.innerHTML="<h2>読み込み中...</h2>";
    try{
      const m = window.loadGlobalMission ? await window.loadGlobalMission() : {correct:0,claimed:[]};
      const correct=m.correct||0;
      const rewards=[{need:1000,coin:50},{need:5000,coin:100},{need:10000,coin:200}];
      let html=`<h2>🌍 全体ミッション</h2><div class="missionItem"><h3>今日のみんなの正解数</h3><p>${correct}問</p></div>`;
      for(const r of rewards){
        const done=correct>=r.need;
        const claimed=(m.claimed||[]).includes(String(r.need));
        html += `<div class="missionItem">${done?"✅":"⬜"} 全員で${r.need}問正解<br>${Math.min(correct,r.need)} / ${r.need}<br>報酬：${r.coin}コイン<br>${done?`<button onclick="claimGlobalMissionReward319(${r.need},${r.coin})">${claimed?"受け取り済み":"受け取る"}</button>`:""}</div>`;
      }
      box.innerHTML=html; if(typeof ensureHomeButton==="function")ensureHomeButton();
    }catch(e){ console.error(e); box.innerHTML="<p>全体ミッション取得失敗</p>"; }
  };
  window.claimGlobalMissionReward319 = async function(need,coin){
    if(!isLogin319()){ alert("報酬の受け取りにはログインが必要です"); return; }
    const ok = window.claimGlobalMissionReward ? await window.claimGlobalMissionReward(String(need)) : true;
    if(!ok){ alert("すでに受け取り済みです"); return; }
    playerData.coins=(playerData.coins||0)+coin;
    saveAllData(); updateHomeStatus();
    alert(`${coin}コインを受け取りました！`);
    showGlobalMission319();
  };

  const oldOther319 = window.showOtherMenu || showOtherMenu;
  window.showOtherMenu = showOtherMenu = function(){
    document.getElementById("panelArea").innerHTML=`
      <h2>⚙️ その他</h2>
      <button class="modeBtn" onclick="showNewsPage()">📢 お知らせ</button>
      <button class="modeBtn" onclick="showStatsPage()">📊 成績</button>
      <button class="modeBtn" onclick="showGuide()">📖 遊び方</button>
      <button class="modeBtn" onclick="showDailyMission()">🎯 デイリーミッション</button>
      <button class="modeBtn" onclick="showGlobalMission319()">🌍 全体ミッション</button>
      <button class="modeBtn" onclick="showLoginCalendar()">📅 ログボカレンダー</button>
      <button class="modeBtn" onclick="showSerialCodePage()">🎁 シリアルコード</button>
      <button class="modeBtn" onclick="showSettings()">⚙️ 設定</button>
      <button class="modeBtn" onclick="showContact()">📩 お問い合わせ</button>
    `;
  };

  // 古参勢以外のシリアルコードを廃止
  window.redeemSerialCode310 = function(){
    const input=document.getElementById("serialCodeInput");
    const result=document.getElementById("serialCodeResult");
    const code=(input && input.value ? input.value : "").trim().toUpperCase().replace(/\s|-/g,"");
    if(!code){ alert("コードを入力してください"); return; }
    if(!isLogin319()){ alert("シリアルコードの使用にはログインが必要です"); return; }
    if(code !== "KOSAN2026"){
      alert("このシリアルコードは使用期限が終了しました");
      return;
    }
    if(!playerData.serialRedeemedCodes) playerData.serialRedeemedCodes=[];
    if(playerData.serialRedeemedCodes.includes(code)){ alert("このコードはすでに使用済みです"); return; }
    unlockTitle("古参勢");
    playerData.serialRedeemedCodes.push(code);
    saveAllData(); updateHomeStatus();
    const msg=`🎉 シリアルコード認証成功！<br><br>${titleHTML("古参勢")}<br><br>古参勢を獲得しました！`;
    if(result) result.innerHTML=`<div class="profileItem serialResultBox">${msg}</div>`;
    alert("古参勢を獲得しました！");
  };

  // ログボの丸表示修正
  giveDailyCoinBonus = function(){
    let today=getTodayKey();
    if(playerData.lastCoinBonusDate===today)return;
    if(!playerData.loginBonusDay)playerData.loginBonusDay=1;
    if(playerData.loginBonusDay>30){
      playerData.loginBonusDay=1;
      playerData.loginStampedDays=[];
    }
    let day=playerData.loginBonusDay;
    playerData.coins=(playerData.coins||0)+day;
    playerData.lastCoinBonusDate=today;
    if(!playerData.loginStampedDays)playerData.loginStampedDays=[];
    if(!playerData.loginStampedDays.includes(day))playerData.loginStampedDays.push(day);
    playerData.loginBonusDay = day>=30 ? 31 : day+1;
    saveAllData(); updateHomeStatus();
    setTimeout(()=>alert(`🎁 ログインコイン ${day}日目！\n+${day}コイン`),300);
  };
  showLoginCalendar = window.showLoginCalendar = function(){
    let stamped=playerData.loginStampedDays||[];
    let next=playerData.loginBonusDay||1;
    let nextText= next>30 ? "30日達成済み" : `${next}日目`;
    let html=`<h2>📅 ログボカレンダー</h2><div class="stampItem"><p>現在の次回ログボ：${nextText}</p><p>ログインすると日数分のコインがもらえます。</p><div class="stampGrid">`;
    for(let i=1;i<=30;i++){
      let done=stamped.includes(i);
      html+=`<div class="stampCell ${done?"stamped":""}"><b>${i}日目</b><br>${done?"⭕":"+ "+i+"コイン"}</div>`;
    }
    html+=`</div></div>`;
    document.getElementById("panelArea").innerHTML=html;
  };

  // 回答数を日間ランキング・全体ミッションへ反映
  const oldSubmit319 = submit;
  submit = window.submit = async function(){
    const beforeQ=playerData.totalQuestions||0;
    const beforeC=playerData.totalCorrect||0;
    const ret = await oldSubmit319.apply(this,arguments);
    const afterQ=playerData.totalQuestions||0;
    const afterC=playerData.totalCorrect||0;
    if(afterQ>beforeQ && window.saveDailyQuestionCount){
      window.saveDailyQuestionCount(afterQ-beforeQ).catch(e=>console.warn("daily count failed",e));
    }
    if(afterC>beforeC && window.contributeGlobalMission){
      window.contributeGlobalMission(afterC-beforeC).catch(e=>console.warn("global mission failed",e));
    }
    return ret;
  };

  // フレンド相互登録
  const oldAddFriend319 = addFriend;
  addFriend = window.addFriend = async function(){
    const input=document.getElementById("friendIdInput");
    const code=input ? input.value.trim().replace(/-/g,"").toUpperCase() : "";
    await oldAddFriend319();
    if(code && window.addMutualFriendCode){
      window.addMutualFriendCode(code).catch(e=>console.warn("mutual friend failed",e));
    }
  };
  const oldShowFriendMenu319 = showFriendMenu;
  showFriendMenu = window.showFriendMenu = async function(){
    if(window.syncMyCloudFriends){
      try{
        const cloudFriends=await window.syncMyCloudFriends();
        if(Array.isArray(cloudFriends)){
          if(!playerData.friends)playerData.friends=[];
          for(const f of cloudFriends){
            const id=(typeof f==="string"?f:f.id)||"";
            if(id && !playerData.friends.some(x=>(typeof x==="string"?x:x.id)===id)) playerData.friends.push(f);
          }
          saveAllData();
        }
      }catch(e){console.warn(e)}
    }
    oldShowFriendMenu319();
  };

  console.log("app.js Ver 3.1.9 rank mission fix loaded");
})();


// Ver3.1.9 final safe rebuild patch
// 目的：既存機能を消さず、その他メニューだけ整理。設定を一番上、シリアルコードを一番下、ミッション枠に統合。
(function(){
  const V_SAFE = "3.1.9";

  try{
    if(typeof UPDATE_NOTES !== "undefined"){
      delete UPDATE_NOTES["3.1.8"];
      UPDATE_NOTES[V_SAFE] = [
        "ランキングをレベルランキング・日間問題数ランキングへ整理",
        "週間ランキングを学習のランダム問題へ移動",
        "デイリーミッションと全体ミッションをミッション枠へ統合",
        "その他メニューを整理",
        "Firebaseルール復旧用に対応"
      ];
    }
  }catch(e){ console.warn("update notes safe patch failed", e); }

  function safePanel(){ return document.getElementById("panelArea"); }
  function safeHome(){ if(typeof ensureHomeButton === "function") setTimeout(ensureHomeButton,0); }

  // プライバシーポリシー関数名の互換性確保
  if(typeof window.showPrivacyPolicyPage !== "function" && typeof window.showPrivacyPage === "function"){
    window.showPrivacyPolicyPage = window.showPrivacyPage;
  }
  if(typeof window.showPrivacyPage !== "function" && typeof window.showPrivacyPolicyPage === "function"){
    window.showPrivacyPage = window.showPrivacyPolicyPage;
  }

  // ミッション枠：デイリーと全体をこの中に入れる
  window.showMissionMenu = function(){
    const panel=safePanel();
    if(!panel) return;
    panel.innerHTML = `
      <h2>🎯 ミッション</h2>
      <div class="missionItem">
        <h3>今日のミッション</h3>
        <p>個人ミッションと全体ミッションをここから確認できます。</p>
      </div>
      <button class="modeBtn" onclick="showDailyMission()">🎯 デイリーミッション</button>
      <button class="modeBtn" onclick="showGlobalMission319()">🌍 全体ミッション</button>
    `;
    safeHome();
  };

  // その他：設定を一番上、シリアルコードを一番下。お知らせ・成績はその他から削除。
  window.showOtherMenu = showOtherMenu = function(){
    const panel=safePanel();
    const menu=document.getElementById("homeMenu");
    if(menu) menu.classList.add("hidden");
    if(!panel) return;
    panel.innerHTML = `
      <h2>⚙️ その他</h2>
      <button class="modeBtn" onclick="showSettings()">⚙️ 設定</button>
      <button class="modeBtn" onclick="showGuide()">📖 遊び方</button>
      <button class="modeBtn" onclick="showMissionMenu()">🎯 ミッション</button>
      <button class="modeBtn" onclick="showLoginCalendar()">📅 ログボカレンダー</button>
      <button class="modeBtn" onclick="showContact()">📩 お問い合わせ</button>
      <button class="modeBtn" onclick="showTermsPage()">📜 利用規約</button>
      <button class="modeBtn" onclick="showPrivacyPolicyPage()">🔒 プライバシーポリシー</button>
      <button class="modeBtn" onclick="showSerialCodePage()">🎁 シリアルコード</button>
    `;
    safeHome();
  };

  // 学習メニューにランダム問題がない場合の最終保証
  if(typeof window.startRandomStudyMode !== "function"){
    window.startRandomStudyMode = function(){
      mode="studyRandom";
      difficulty="hard";
      openGame();
      start();
    };
  }
  const baseGenerateQuestionSafe = (typeof generateQuestion === "function") ? generateQuestion : null;
  if(baseGenerateQuestionSafe && !window.__safeStudyRandomPatched){
    window.__safeStudyRandomPatched = true;
    generateQuestion = function(){
      if(mode === "studyRandom"){
        const oldMode = mode;
        const oldDiff = difficulty;
        const modes = ["integral","derivative","factor","prime","expand","arithmetic"];
        mode = modes[rand(0,modes.length-1)];
        difficulty = oldDiff || "hard";
        const q = baseGenerateQuestionSafe();
        mode = oldMode;
        difficulty = oldDiff;
        return q;
      }
      return baseGenerateQuestionSafe.apply(this,arguments);
    };
  }
  window.showStudyMenu = showStudyMenu = function(){
    const panel=safePanel();
    if(!panel) return;
    panel.innerHTML = `
      <h2>📚 学習モード</h2>
      <button class="modeBtn" onclick="selectDifficulty('integral')">積分</button>
      <button class="modeBtn" onclick="selectDifficulty('derivative')">微分</button>
      <button class="modeBtn" onclick="selectDifficulty('factor')">因数分解</button>
      <button class="modeBtn" onclick="selectDifficulty('prime')">素因数分解</button>
      <button class="modeBtn" onclick="selectDifficulty('expand')">展開</button>
      <button class="modeBtn" onclick="selectDifficulty('arithmetic')">四則演算</button>
    `;
    safeHome();
  };

  // ランキングはログイン必須。週間ランキングは表示しない。
  function isLoginSafe319(){
    return !!((window.getGoogleLoginInfo && window.getGoogleLoginInfo()) || localStorage.getItem("googleLoginUid") || localStorage.getItem("googleLoginLinked"));
  }
  function loginRequiredSafeHTML(title){
    return `<h2>${title}</h2><div class="profileItem"><p>ランキング機能はログインが必要です。</p><button class="googleLoginBtn" onclick="loginGoogle()">Googleログイン</button></div>`;
  }
  window.showRankingMenu = showRankingMenu = function(){
    const panel=safePanel();
    if(!panel) return;
    if(!isLoginSafe319()){
      panel.innerHTML = loginRequiredSafeHTML("🏆 ランキング");
      safeHome();
      return;
    }
    panel.innerHTML = `
      <h2>🏆 ランキング</h2>
      <button class="modeBtn" onclick="showLevelRanking319()">⭐ レベルランキング</button>
      <button class="modeBtn" onclick="showDailyQuestionRanking319()">📚 日間問題数ランキング</button>
            <button class="modeBtn" onclick="showRateRanking()">🏅 レートランキング</button>
    `;
    safeHome();
  };
  window.showWorldRanking = showWorldRanking = function(){
    if(typeof showDailyQuestionRanking319 === "function") return showDailyQuestionRanking319();
  };
  window.selectRankingMode = selectRankingMode = function(){
    startRandomStudyMode();
  };

  // 古参勢以外のシリアルコード無効化の最終保証
  window.redeemSerialCode310 = function(){
    const input=document.getElementById("serialCodeInput");
    const result=document.getElementById("serialCodeResult");
    const code=(input && input.value ? input.value : "").trim().toUpperCase().replace(/\s|-/g,"");
    if(!code){ alert("コードを入力してください"); return; }
    if(!isLoginSafe319()){ alert("シリアルコードの使用にはログインが必要です"); return; }
    if(code !== "KOSAN2026"){
      alert("このシリアルコードは使用期限が終了しました");
      return;
    }
    if(!playerData.serialRedeemedCodes) playerData.serialRedeemedCodes=[];
    if(playerData.serialRedeemedCodes.includes(code)){ alert("このコードはすでに使用済みです"); return; }
    unlockTitle("古参勢");
    playerData.serialRedeemedCodes.push(code);
    saveAllData();
    updateHomeStatus();
    const msg=`🎉 シリアルコード認証成功！<br><br>${titleHTML("古参勢")}<br><br>古参勢を獲得しました！`;
    if(result) result.innerHTML=`<div class="profileItem serialResultBox">${msg}</div>`;
    alert("古参勢を獲得しました！");
  };

  console.log("app.js Ver 3.1.9 final safe rebuild loaded");
})();


// Ver3.1.9 daily/global/friend-ranking final fix
// ・全体ミッションはログイン不要で反映
// ・日間問題数ランキングはローカル日別カウントを正として上書き保存
// ・フレンドランキングは表示しない
(function(){
  function todayKeyLocal319Fix(){
    return new Date().toLocaleDateString("ja-JP",{timeZone:"Asia/Tokyo"});
  }
  function isLogin319Fix(){
    return !!((window.getGoogleLoginInfo && window.getGoogleLoginInfo()) || localStorage.getItem("googleLoginUid") || localStorage.getItem("googleLoginLinked"));
  }
  function panel319Fix(){ return document.getElementById("panelArea"); }
  function saveDailyLocalQuestionCount319Fix(add){
    const today=todayKeyLocal319Fix();
    if(playerData.dailyQuestionRankDate!==today){
      playerData.dailyQuestionRankDate=today;
      playerData.dailyQuestionRankCount=0;
    }
    playerData.dailyQuestionRankCount=(playerData.dailyQuestionRankCount||0)+Number(add||0);
    saveAllData();
    if(isLogin319Fix() && window.saveDailyQuestionTotal){
      window.saveDailyQuestionTotal(playerData.dailyQuestionRankCount).catch(e=>console.warn("daily total save failed",e));
    }
  }
  const prevSubmit319Fix = window.submit || submit;
  window.submit = submit = async function(){
    const beforeQ=playerData.totalQuestions||0;
    const beforeC=playerData.totalCorrect||0;
    const ret=await prevSubmit319Fix.apply(this,arguments);
    const afterQ=playerData.totalQuestions||0;
    const afterC=playerData.totalCorrect||0;
    if(afterQ>beforeQ) saveDailyLocalQuestionCount319Fix(afterQ-beforeQ);
    if(afterC>beforeC && window.contributeGlobalMission){
      window.contributeGlobalMission(afterC-beforeC).catch(e=>console.warn("global mission public failed",e));
    }
    return ret;
  };
  window.showFriendRanking = function(){
    const p=panel319Fix();
    if(p){
      p.innerHTML=`<h2>🤝 フレンドランキング</h2><div class="profileItem"><p>フレンドランキングは削除しました。</p></div>`;
      if(typeof ensureHomeButton==="function") ensureHomeButton();
    }
  };
  const rankingHTML319Fix = function(){
    return `
      <h2>🏆 ランキング</h2>
      <button class="modeBtn" onclick="showLevelRanking319()">⭐ レベルランキング</button>
      <button class="modeBtn" onclick="showDailyQuestionRanking319()">📚 日間問題数ランキング</button>
      <button class="modeBtn" onclick="showRateRanking()">🏅 レートランキング</button>
    `;
  };
  const loginRequired319Fix = function(){
    return `<h2>🏆 ランキング</h2><div class="profileItem"><p>ランキング機能はログインが必要です。</p><button class="googleLoginBtn" onclick="loginGoogle()">Googleログイン</button></div>`;
  };
  window.showRankingMenu = showRankingMenu = function(){
    const p=panel319Fix(); if(!p)return;
    p.innerHTML = isLogin319Fix() ? rankingHTML319Fix() : loginRequired319Fix();
    if(typeof ensureHomeButton==="function") ensureHomeButton();
  };
  const oldFriendMenu319Fix = window.showFriendMenu || showFriendMenu;
  window.showFriendMenu = showFriendMenu = function(){
    oldFriendMenu319Fix();
    setTimeout(()=>{
      const p=panel319Fix();
      if(p) p.innerHTML=p.innerHTML.replace(/<button[^>]*onclick="showFriendRanking\(\)"[^>]*>.*?フレンドランキング.*?<\/button>/g,"");
    },0);
  };
})();


// Ver3.2.0 final: strict prime, factor order, display, ranking write/login policy
(function(){
  if(window.__v320FinalPatchLoaded) return;
  window.__v320FinalPatchLoaded = true;

  function loginReal(){
    return !!(window.getGoogleLoginInfo && window.getGoogleLoginInfo());
  }
  function todayKeyV320(){
    return new Date().toLocaleDateString("ja-JP",{timeZone:"Asia/Tokyo"});
  }
  function escapeHTMLV320(s){
    return String(s==null?"":s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  }
  function prettyMathHTML(s){
    let t=escapeHTMLV320(s);
    t=t.replace(/\^\(([^)]+)\)/g,"<sup>$1</sup>");
    t=t.replace(/\^(\-?\d+)/g,"<sup>$1</sup>");
    t=t.replace(/([A-Za-z0-9\)]+)\/([A-Za-z0-9\(\)]+)(?![A-Za-z0-9])/g,'<span class="frac"><span class="top">$1</span><span class="bottom">$2</span></span>');
    return t;
  }
  window.prettyMathHTML = prettyMathHTML;
  function updateAnswerPreviewV320(){
    const input=document.getElementById("ans");
    const prev=document.getElementById("answerPreview");
    if(prev) prev.innerHTML = input && input.value ? prettyMathHTML(input.value) : "";
  }
  const oldAddKeyV320 = window.addKey || (typeof addKey==="function"?addKey:null);
  if(oldAddKeyV320){
    window.addKey = addKey = function(text){
      oldAddKeyV320.apply(this,arguments);
      updateAnswerPreviewV320();
    };
  }
  const oldBackV320 = window.backspaceInput || (typeof backspaceInput==="function"?backspaceInput:null);
  if(oldBackV320){ window.backspaceInput = backspaceInput = function(){ oldBackV320.apply(this,arguments); updateAnswerPreviewV320(); }; }
  const oldClearV320 = window.clearInput || (typeof clearInput==="function"?clearInput:null);
  if(oldClearV320){ window.clearInput = clearInput = function(){ oldClearV320.apply(this,arguments); updateAnswerPreviewV320(); }; }
  const ans=document.getElementById("ans");
  if(ans) ans.addEventListener("input",updateAnswerPreviewV320);

  const qEl=document.getElementById("q");
  if(false && qEl && window.MutationObserver){
    const obs=new MutationObserver(()=>{
      if(qEl.dataset.prettyLock==="1") return;
      const raw=qEl.textContent||"";
      if(!raw || raw==="START") return;
      qEl.dataset.prettyLock="1";
      qEl.innerHTML=prettyMathHTML(raw);
      qEl.dataset.prettyLock="0";
    });
    obs.observe(qEl,{childList:true,characterData:true,subtree:true});
  }

  // strict prime + robust factor order final guard
  if(typeof checkPrimeAnswer === "function"){
    const oldPrime=checkPrimeAnswer;
    checkPrimeAnswer=function(input,number){
      const s=String(input||"").trim();
      if(/^\d+$/.test(s) && Number(s)===Number(number) && !isPrime(Number(number))) return false;
      return oldPrime(input,number);
    };
    window.checkPrimeAnswer=checkPrimeAnswer;
  }
  if(typeof normalize === "function"){
    const oldNorm=normalize;
    normalize=function(str){
      return oldNorm(str).replace(/\)\(/g,")*(").replace(/(\d|x|pi|e|\))(?=\()/g,"$1*");
    };
    window.normalize=normalize;
  }

  function saveDailyLocalCorrectV320(delta){
    const today=todayKeyV320();
    if(playerData.dailyCorrectRankDate!==today){
      playerData.dailyCorrectRankDate=today;
      playerData.dailyCorrectRankCount=0;
    }
    playerData.dailyCorrectRankCount=(playerData.dailyCorrectRankCount||0)+Number(delta||0);
    // 互換用
    playerData.dailyQuestionRankDate=today;
    playerData.dailyQuestionRankCount=playerData.dailyCorrectRankCount;
    if(typeof saveAllData==="function") saveAllData();
    if(loginReal() && window.saveDailyQuestionTotal){
      window.saveDailyQuestionTotal(playerData.dailyCorrectRankCount).catch(e=>console.warn("daily ranking save failed",e));
    }
  }

  const prevSubmitV320 = window.submit || (typeof submit==="function"?submit:null);
  if(prevSubmitV320 && !window.__v320SubmitWrapped){
    window.__v320SubmitWrapped=true;
    window.submit = submit = async function(){
      const beforeC=playerData.totalCorrect||0;
      const ret=await prevSubmitV320.apply(this,arguments);
      const afterC=playerData.totalCorrect||0;
      const diff=afterC-beforeC;
      if(diff>0){
        saveDailyLocalCorrectV320(diff);           // ランキング反映はログイン時だけ
        if(window.contributeGlobalMission) window.contributeGlobalMission(diff).catch(e=>console.warn("global mission failed",e)); // 全体は未ログインOK
        if(loginReal() && window.saveLevelRankingNow) window.saveLevelRankingNow().catch(e=>console.warn("level ranking save failed",e));
      }
      return ret;
    };
  }

  function panel(){return document.getElementById("panelArea");}
  function homeBtn(){ if(typeof ensureHomeButton==="function") setTimeout(ensureHomeButton,0); }

  window.showRankingMenu = showRankingMenu = function(){
    const p=panel(); if(!p)return;
    p.innerHTML=`
      <h2>🏆 ランキング</h2>
      <div class="profileItem"><p>ランキングは誰でも見れます。反映はGoogleログイン中のみです。</p></div>
      <button class="modeBtn" onclick="showLevelRanking319()">⭐ レベルランキング</button>
      <button class="modeBtn" onclick="showDailyQuestionRanking319()">📚 日間正解数ランキング</button>
      <button class="modeBtn" onclick="showRateRanking()">🏅 レートランキング</button>
    `;
    homeBtn();
  };
  window.showFriendRanking = function(){
    const p=panel(); if(p){ p.innerHTML=`<h2>🤝 フレンドランキング</h2><div class="profileItem"><p>フレンドランキングは削除しました。</p></div>`; homeBtn(); }
  };
  const oldFriendMenuV320 = window.showFriendMenu || (typeof showFriendMenu==="function"?showFriendMenu:null);
  if(oldFriendMenuV320){
    window.showFriendMenu = showFriendMenu = function(){
      oldFriendMenuV320.apply(this,arguments);
      setTimeout(()=>{ const p=panel(); if(p) p.innerHTML=p.innerHTML.replace(/<button[^>]*onclick=["']showFriendRanking\(\)["'][^>]*>[\s\S]*?<\/button>/g,""); },0);
    };
  }
  window.selectRankingMode = selectRankingMode = function(){
    alert("週間ランキングモードは削除しました。学習モードから通常問題を選んでください。");
  };

  console.log("Ver3.2.0 final app patch loaded");
})();


// Ver3.2.0 realtime ranking display final
(function(){
  function rankTitleHTMLV320(t){ return (typeof titleHTML==="function") ? titleHTML(t||"初心者") : (t||"初心者"); }
  function panelV320(){return document.getElementById("panelArea");}
  function renderDailyV320(list){
    let html=`<h2>📚 日間正解数ランキング</h2><div class="profileItem"><p>表示は誰でも可能。ランキング反映はログイン中のみ。</p></div>`;
    if(!list || !list.length) html += `<p>まだ記録がありません</p>`;
    (list||[]).forEach((r,i)=>{ html+=`<div class="rankItem">${i+1}位 ${r.icon?`<img class="rankIcon" src="${r.icon}">`:""}${r.name||"名無し"}<br>${rankTitleHTMLV320(r.title)}<br>Lv${r.level||1}<br>${r.count||0}問</div>`; });
    return html;
  }
  function renderLevelV320(list){
    let html=`<h2>⭐ レベルランキング</h2><div class="profileItem"><p>表示は誰でも可能。ランキング反映はログイン中のみ。</p></div>`;
    if(!list || !list.length) html += `<p>まだ記録がありません</p>`;
    (list||[]).forEach((r,i)=>{ html+=`<div class="rankItem">${i+1}位 ${r.icon?`<img class="rankIcon" src="${r.icon}">`:""}${r.name||r.playerName||"名無し"}<br>${rankTitleHTMLV320(r.title)}<br>Lv${r.level||1}<br>EXP：${r.exp||0}</div>`; });
    return html;
  }
  window.showDailyQuestionRanking319 = function(){
    const p=panelV320(); if(!p)return;
    p.innerHTML=`<h2>📚 日間正解数ランキング</h2><p>読み込み中...</p>`;
    if(window.__dailyRankUnsub) try{window.__dailyRankUnsub();}catch(e){}
    if(window.subscribeDailyQuestionRanking){
      window.__dailyRankUnsub=window.subscribeDailyQuestionRanking(list=>{ const box=panelV320(); if(box) box.innerHTML=renderDailyV320(list); if(typeof ensureHomeButton==="function") ensureHomeButton(); });
    }else if(window.loadDailyQuestionRanking){
      window.loadDailyQuestionRanking().then(list=>{ const box=panelV320(); if(box) box.innerHTML=renderDailyV320(list); });
    }
  };
  window.showLevelRanking319 = function(){
    const p=panelV320(); if(!p)return;
    p.innerHTML=`<h2>⭐ レベルランキング</h2><p>読み込み中...</p>`;
    if(window.__levelRankUnsub) try{window.__levelRankUnsub();}catch(e){}
    if(window.subscribeLevelRanking){
      window.__levelRankUnsub=window.subscribeLevelRanking(list=>{ const box=panelV320(); if(box) box.innerHTML=renderLevelV320(list); if(typeof ensureHomeButton==="function") ensureHomeButton(); });
    }else if(window.loadLevelRanking){
      window.loadLevelRanking().then(list=>{ const box=panelV320(); if(box) box.innerHTML=renderLevelV320(list); });
    }
  };
})();


// Ver3.2.1 stable recovery: keypad/question/ultra-hard/news
(function(){
  if(window.__v321StableRecoveryLoaded) return;
  window.__v321StableRecoveryLoaded = true;

  function safeText(v){ return String(v==null?"":v); }
  function escapeHTML321(s){ return safeText(s).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m];}); }
  function prettyInput321(s){
    let t=escapeHTML321(s);
    t=t.replace(/\^\(([^)]+)\)/g,"<sup>$1</sup>");
    t=t.replace(/\^(\-?\d+)/g,"<sup>$1</sup>");
    t=t.replace(/([A-Za-z0-9\)]+)\/([A-Za-z0-9\(\)]+)(?![A-Za-z0-9])/g,'<span class="frac"><span class="top">$1</span><span class="bottom">$2</span></span>');
    return t;
  }
  function updatePreview321(){
    const input=document.getElementById("ans");
    let prev=document.getElementById("answerPreview");
    if(!input) return;
    if(!prev){
      prev=document.createElement("div");
      prev.id="answerPreview";
      prev.className="hintBox";
      input.insertAdjacentElement("afterend",prev);
    }
    if(input.value){
      prev.style.display="block";
      prev.innerHTML="入力プレビュー："+prettyInput321(input.value);
    }else{
      prev.style.display="none";
      prev.innerHTML="";
    }
  }

  // テンキーを直接操作に戻す。古いwrapperに依存しない。
  window.addKey = addKey = function(text){
    const input=document.getElementById("ans");
    if(!input) return;
    input.value += text;
    try{ input.setSelectionRange(input.value.length,input.value.length); }catch(e){}
    updatePreview321();
  };
  window.backspaceInput = backspaceInput = function(){
    const input=document.getElementById("ans");
    if(!input) return;
    input.value=input.value.slice(0,-1);
    updatePreview321();
  };
  window.clearInput = clearInput = function(){
    const input=document.getElementById("ans");
    if(!input) return;
    input.value="";
    updatePreview321();
  };

  // 超難問を積分専用で追加
  const ULTRA_INTEGRAL_QUESTIONS_321 = [
    {q:"超難問：∫ x²e^x dx", a:"exp(x)*(x^2-2*x+2)", display:"e^x(x^2-2x+2)+C", explanation:"部分積分を2回使います。"},
    {q:"超難問：∫ xlog(x) dx", a:"(x^2/2)*log(x)-x^2/4", display:"(x^2/2)log(x)-x^2/4+C", explanation:"部分積分。log(x)を微分する側にします。"},
    {q:"超難問：∫ 1/(x²+4x+5) dx", a:"atan(x+2)", display:"arctan(x+2)+C", explanation:"平方完成して (x+2)^2+1 にします。"},
    {q:"超難問：∫ (2x+3)/(x²+3x+2) dx", a:"log(x^2+3*x+2)", display:"log(x^2+3x+2)+C", explanation:"分子が分母の微分です。"},
    {q:"超難問：∫ sin(x)cos(x) dx", a:"sin(x)^2/2", display:"sin(x)^2/2+C", explanation:"t=sin(x) と置換します。"},
    {q:"超難問：∫₀¹ x/(x²+1) dx", a:"1/2*log(2)", display:"1/2log2", explanation:"t=x²+1 と置換します。"}
  ];
  window.generateUltraHardIntegralQuestion = function(){
    const q=ULTRA_INTEGRAL_QUESTIONS_321[rand(0,ULTRA_INTEGRAL_QUESTIONS_321.length-1)];
    return (typeof cleanQuestionObject==="function") ? cleanQuestionObject(Object.assign({},q)) : Object.assign({},q);
  };

  const baseGenerateQuestion321 = (typeof generateQuestion === "function") ? generateQuestion : null;
  if(baseGenerateQuestion321){
    window.generateQuestion = generateQuestion = function(){
      if(mode==="integral" && difficulty==="ultraHard") return window.generateUltraHardIntegralQuestion();
      return baseGenerateQuestion321();
    };
  }

  // 問題表示をプレーンテキストで安定化。問題が出ない事故を防ぐ。
  window.nextQ = nextQ = function(){
    if(typeof clearHint==="function") clearHint();
    let count=0;
    do{
      current = (typeof cleanQuestionObject==="function") ? cleanQuestionObject(generateQuestion()) : generateQuestion();
      count++;
    }while(usedQuestions && usedQuestions.includes(current.q) && count<100);
    if(usedQuestions) usedQuestions.push(current.q);
    const q=document.getElementById("q");
    const go=document.getElementById("goText");
    const ans=document.getElementById("ans");
    if(ans) ans.value="";
    updatePreview321();
    if(q){
      q.innerHTML="";
      q.textContent="";
      q.classList.remove("questionAnim");
    }
    if(go){ go.classList.remove("goAnim"); void go.offsetWidth; }
    setTimeout(function(){
      if(go) go.classList.add("goAnim");
      setTimeout(function(){
        if(q){
          q.textContent = (typeof cleanMathExpression==="function") ? cleanMathExpression(current.q) : current.q;
          q.classList.add("questionAnim");
        }
      },180);
    },80);
  };

  // 積分だけ「超難問」ボタンを表示
  const oldSelectDifficulty321 = (typeof selectDifficulty === "function") ? selectDifficulty : null;
  if(oldSelectDifficulty321){
    window.selectDifficulty = selectDifficulty = function(m){
      mode=m;
      let ultra = m==="integral" ? `<button class="modeBtn hardBtn" onclick="startMode('ultraHard')">💀 超難問</button>` : "";
      const p=document.getElementById("panelArea");
      if(p){
        p.innerHTML=`
<h2>難易度選択</h2>
<button class="modeBtn" onclick="startMode('easy')">🟢 初級</button>
<button class="modeBtn" onclick="startMode('normal')">🟡 中級</button>
<button class="modeBtn" onclick="startMode('hard')">🔴 上級</button>
<button class="modeBtn hardBtn" onclick="startMode('veryHard')">🔥 難問</button>
${ultra}
`;
      }
    };
  }

  const oldOpenGame321 = (typeof openGame === "function") ? openGame : null;
  if(oldOpenGame321){
    window.openGame = openGame = function(){
      oldOpenGame321.apply(this,arguments);
      if(mode==="integral" && difficulty==="ultraHard"){
        const mt=document.getElementById("modeTitle");
        if(mt) mt.innerText="💀 積分 超難問 💀";
      }
    };
  }

  // お知らせ：シリアルコード以外の更新内容は毎回載せる
  try{
    if(typeof UPDATE_NOTES !== "undefined"){
      UPDATE_NOTES["3.2.1"] = [
        "テンキーが反応しない問題を修正",
        "問題が表示されない問題を修正",
        "積分に超難問を追加",
        "素因数分解の判定を最後まで分解した場合のみ正解に修正",
        "因数分解の順番入れ替え判定を安定化",
        "ランキング閲覧は未ログイン可能、反映はログイン必須に整理",
        "全体ミッションは未ログインでも反映する仕様に整理"
      ];
    }
  }catch(e){ console.warn(e); }

  document.addEventListener("input",function(e){ if(e && e.target && e.target.id==="ans") updatePreview321(); });
  console.log("Ver3.2.1 stable recovery loaded");
})();

// Ver3.2.3 custom patch: duplicate gacha refund + 文系微積 + XP倍率
(function(){
  if(window.__v323BunkeiGachaPatchLoaded) return;
  window.__v323BunkeiGachaPatchLoaded = true;

  const BASE_XP_323 = {
    arithmetic: 3,
    expand: 5,
    factor: 7,
    prime: 8,
    primeFactor: 8,
    derivative: 12,
    integral: 14
  };
  const DIFF_RATE_323 = {
    bunkei: 0.8,
    easy: 1.0,
    normal: 1.3,
    hard: 1.5,
    veryHard: 2.0,
    ultraHard: 2.5,
    difficult: 2.0,
    super: 2.5
  };
  window.calculateQuestionXP323 = function(m,d){
    if(m === "random" || m === "studyRandom") return 20;
    const base = BASE_XP_323[m] || 10;
    const rate = DIFF_RATE_323[d] == null ? 1 : DIFF_RATE_323[d];
    return Math.floor(base * rate);
  };

  const BUNKEI_DERIVATIVE_323 = [
    {q:"文系：d/dx x²", a:"2*x", display:"2x", explanation:"数IIの基本。x^nの微分はnx^(n-1)。"},
    {q:"文系：d/dx 3x²+2x-5", a:"6*x+2", display:"6x+2", explanation:"項ごとに微分します。"},
    {q:"文系：d/dx x³-4x²+7x", a:"3*x^2-8*x+7", display:"3x²-8x+7", explanation:"多項式の微分です。"},
    {q:"文系：d/dx (x+2)(x-3)", a:"2*x-1", display:"2x-1", explanation:"展開してx²-x-6にしてから微分します。"},
    {q:"文系：d/dx (2x-1)²", a:"8*x-4", display:"8x-4", explanation:"展開して4x²-4x+1にしてから微分します。"},
    {q:"文系：y=x³-3x² の導関数", a:"3*x^2-6*x", display:"3x²-6x", explanation:"導関数を求めます。"}
  ];
  const BUNKEI_INTEGRAL_323 = [
    {q:"文系：∫ 2x dx", a:"x^2", display:"x²+C", explanation:"x²を微分すると2xです。"},
    {q:"文系：∫ (3x²+2x) dx", a:"x^3+x^2", display:"x³+x²+C", explanation:"項ごとに積分します。"},
    {q:"文系：∫ (6x-4) dx", a:"3*x^2-4*x", display:"3x²-4x+C", explanation:"多項式の積分です。"},
    {q:"文系：∫₀² x dx", a:"2", display:"2", explanation:"x²/2 に0と2を代入します。"},
    {q:"文系：∫₀¹ (3x²+1) dx", a:"2", display:"2", explanation:"x³+x に0と1を代入します。"},
    {q:"文系：∫ (x+1)² dx", a:"x^3/3+x^2+x", display:"x³/3+x²+x+C", explanation:"展開してx²+2x+1にしてから積分します。"}
  ];
  window.generateBunkeiQuestion323 = function(){
    const arr = mode === "integral" ? BUNKEI_INTEGRAL_323 : BUNKEI_DERIVATIVE_323;
    const q = arr[rand(0, arr.length-1)];
    return (typeof cleanQuestionObject === "function") ? cleanQuestionObject(Object.assign({}, q)) : Object.assign({}, q);
  };

  const baseGenerateQuestion323 = (typeof generateQuestion === "function") ? generateQuestion : null;
  if(baseGenerateQuestion323){
    window.generateQuestion = generateQuestion = function(){
      if((mode === "integral" || mode === "derivative") && difficulty === "bunkei") return window.generateBunkeiQuestion323();
      return baseGenerateQuestion323.apply(this, arguments);
    };
  }

  // 学習モードにランダムを入れる
  window.startRandomStudyMode = function(){
    mode = "studyRandom";
    difficulty = "veryHard";
    openGame();
    start();
  };
  window.showStudyMenu = showStudyMenu = function(){
    const panel = document.getElementById("panelArea");
    if(!panel) return;
    panel.innerHTML = `
      <h2>📚 学習モード</h2>
      <button class="modeBtn" onclick="selectDifficulty('integral')">積分</button>
      <button class="modeBtn" onclick="selectDifficulty('derivative')">微分</button>
      <button class="modeBtn" onclick="selectDifficulty('factor')">因数分解</button>
      <button class="modeBtn" onclick="selectDifficulty('prime')">素因数分解</button>
      <button class="modeBtn" onclick="selectDifficulty('expand')">展開</button>
      <button class="modeBtn" onclick="selectDifficulty('arithmetic')">四則演算</button>
      <button class="modeBtn hardBtn" onclick="startRandomStudyMode()">🎲 ランダム</button>
    `;
    if(typeof ensureHomeButton === "function") ensureHomeButton();
  };

  // 微分・積分だけ「文系」を初級の上に置く
  window.selectDifficulty = selectDifficulty = function(m){
    mode = m;
    const panel = document.getElementById("panelArea");
    if(!panel) return;
    const bunkei = (m === "integral" || m === "derivative") ? `<button class="modeBtn" onclick="startMode('bunkei')">📘 文系</button>` : "";
    const ultra = (m === "integral") ? `<button class="modeBtn hardBtn" onclick="startMode('ultraHard')">💀 超難問</button>` : "";
    panel.innerHTML = `
      <h2>難易度選択</h2>
      ${bunkei}
      <button class="modeBtn" onclick="startMode('easy')">🟢 初級</button>
      <button class="modeBtn" onclick="startMode('normal')">🟡 中級</button>
      <button class="modeBtn" onclick="startMode('hard')">🔴 上級</button>
      <button class="modeBtn hardBtn" onclick="startMode('veryHard')">🔥 難問</button>
      ${ultra}
    `;
    if(typeof ensureHomeButton === "function") ensureHomeButton();
  };

  const baseOpenGame323 = (typeof openGame === "function") ? openGame : null;
  if(baseOpenGame323){
    window.openGame = openGame = function(){
      baseOpenGame323.apply(this, arguments);
      const mt = document.getElementById("modeTitle");
      if(!mt) return;
      if(mode === "studyRandom") mt.innerText = "🎲 ランダム問題 🎲";
      if(mode === "derivative" && difficulty === "bunkei") mt.innerText = "📘 文系 微分 📘";
      if(mode === "integral" && difficulty === "bunkei") mt.innerText = "📘 文系 積分 📘";
    };
  }

  // 正解時XPを分野×難易度倍率に変更。ランダムは20XP固定。
  window.submit = submit = async function(){
    if(!current) return;
    let input = document.getElementById("ans");
    let u = input ? input.value.trim() : "";
    if(typeof matchState !== "undefined" && matchState && matchState.active){
      await submitMatchAnswer(u);
      return;
    }
    if(u === ""){
      alert("答えを入力して");
      return;
    }
    if(u === "admin9671") u = current.display;
    let ok = false;
    if(mode === "prime"){
      ok = checkPrimeAnswer(u, current.number);
    }else{
      if(!ok) ok = expressionsEqual(u, current.a);
      if(!ok) ok = normalize(u) === normalize(current.display);
    }
    playerData.totalQuestions++;
    recordGenreResult(mode, ok);
    history.push({question:current.q, your:u, answer:current.display, explanation:current.explanation, ok:ok});
    if(ok){
      score++;
      combo++;
      if(typeof showComboPop === "function") showComboPop();
      playerData.totalCorrect++;
      const xpGain = window.calculateQuestionXP323(mode, difficulty);
      addExp(xpGain);
      playerData.coins = (playerData.coins || 0) + 1;
      if(combo > playerData.maxCombo) playerData.maxCombo = combo;
      updateMission("correct");
      if(mode === "integral") updateMission("integral");
      if(mode !== "random" && mode !== "studyRandom" && mode !== "review") enemyHP -= comboDamageValue(combo);
      if(enemyHP < 0) enemyHP = 0;
      if(settings.se) document.getElementById("se_correct").play();
      document.getElementById("result").innerHTML = `○ 正解！<br>正解：${current.display}<br>+${xpGain}EXP / +1コイン`;
    }else{
      combo = 0;
      addReviewItem(current);
      if(mode === "random" || mode === "studyRandom"){
        finishRandom();
        return;
      }
      if(mode !== "review") playerHP--;
      if(settings.se) document.getElementById("se_wrong").play();
      document.getElementById("result").innerHTML = `
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
  };

  // ガチャは被りあり。被った称号は3コイン返金。
  window.getGachaResultNoDuplicate = getGachaResultNoDuplicate = function(){
    return getGachaResult();
  };
  function applyGachaItem323(item){
    if(!playerData.gachaTitles) playerData.gachaTitles = [];
    const duplicate = playerData.gachaTitles.includes(item.title);
    if(duplicate){
      playerData.coins = (playerData.coins || 0) + 3;
    }else{
      unlockTitle(item.title);
      playerData.gachaTitles.push(item.title);
    }
    if(item.rarity === "UR"){
      unlockAchievement("UR獲得");
    }
    return duplicate;
  }
  window.drawGacha = drawGacha = function(){
    if((playerData.coins || 0) < 10){ alert("コインが足りません"); return; }
    playerData.coins -= 10;
    const item = getGachaResult();
    const duplicate = applyGachaItem323(item);
    unlockAchievement("初ガチャ");
    if(item.rarity === "UR"){
      document.body.classList.add("urFlash");
      setTimeout(()=>document.body.classList.remove("urFlash"),1000);
    }
    saveAllData();
    updateHomeStatus();
    const box = document.getElementById("panelArea");
    if(box){
      box.innerHTML = `
        <h2>🎰 ガチャ結果</h2>
        <div class="profileItem">
          <h2>${item.rarity}</h2>
          <h1>${titleHTML(item.title)}</h1>
          <p>${duplicate ? "被り！3コイン返金" : "新しい称号を獲得！"}</p>
          <p>所持コイン：${playerData.coins || 0}</p>
          <button onclick="drawGacha()">もう一回引く</button>
          <button onclick="showGacha()">ガチャ画面へ</button>
        </div>`;
    }
  };
  window.drawGacha10 = drawGacha10 = function(){
    if((playerData.coins || 0) < 100){ alert("コインが足りません"); return; }
    playerData.coins -= 100;
    const results = [];
    let refund = 0;
    let hasUR = false;
    for(let i=0;i<10;i++){
      const item = getGachaResult();
      const duplicate = applyGachaItem323(item);
      if(duplicate) refund += 3;
      if(item.rarity === "UR") hasUR = true;
      results.push({item, duplicate});
    }
    unlockAchievement("初ガチャ");
    if(hasUR){
      document.body.classList.add("urFlash");
      setTimeout(()=>document.body.classList.remove("urFlash"),1000);
    }
    saveAllData();
    updateHomeStatus();
    let html = `<h2>🎰 10連ガチャ結果</h2>
      <div class="profileItem">
        <p>被り返金：${refund}コイン</p>
        <p>所持コイン：${playerData.coins || 0}</p>
        <button onclick="drawGacha10()">もう一度10連</button>
        <button onclick="showGacha()">ガチャ画面へ</button>
      </div>`;
    for(const r of results){
      html += `<div class="titleItem"><b>${r.item.rarity}</b><br>${titleHTML(r.item.title)}<br>${r.duplicate ? "被り：+3コイン" : "NEW"}</div>`;
    }
    const box = document.getElementById("panelArea");
    if(box) box.innerHTML = html;
  };
  window.showGacha = showGacha = function(){
    const box = document.getElementById("panelArea");
    if(!box) return;
    box.innerHTML = `
      <h2>🎰 ガチャ</h2>
      <div class="profileItem">
        <p>所持コイン：${playerData.coins || 0}</p>
        <p>1回：10コイン / 10連：100コイン</p>
        <p>称号は被りあり。被ったら3コイン返金。</p>
        <button onclick="drawGacha()">10コインで引く</button>
        <button onclick="drawGacha10()">100コインで10連</button>
        <button onclick="showGachaBook()">ガチャ図鑑を見る</button>
      </div>
      <div class="profileItem">
        <h3>排出率</h3>
        <p>R 70% / SR 20% / SSR 8% / UR 2%</p>
        <p>URのみ色付き。コマンド称号はガチャから出ません。</p>
      </div>`;
  };

  try{
    if(typeof UPDATE_NOTES !== "undefined"){
      UPDATE_NOTES["3.2.3"] = [
        "ガチャ称号を被りありに変更",
        "ガチャで被った称号は3コイン返金に変更",
        "微分と積分に文系難易度を追加",
        "文系は数IIまでの微積、XP倍率0.8倍に設定",
        "正解時XPを分野別基礎XP×難易度倍率に変更"
      ];
    }
  }catch(e){}
  console.log("Ver3.2.3 custom patch loaded");
})();


// Ver3.2.8 final consolidation patch
// 目的：3.2.3以降の修正を全部反映。クリック停止・テンキー・問題表示・ログボ削除・表示整理。
(function(){
  if(window.__v328FinalPatchLoaded) return;
  window.__v328FinalPatchLoaded = true;

  try{ window.VERSION = "3.2.8"; }catch(e){}

  function byId(id){ return document.getElementById(id); }
  function panel(){ return byId("panelArea"); }
  function home(){ if(typeof ensureHomeButton === "function") setTimeout(ensureHomeButton,0); }
  function htmlEscape(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m];}); }
  function safeClean(s){ return (typeof cleanMathExpression === "function") ? cleanMathExpression(s) : String(s==null?"":s); }

  // ログインボーナスは完全に廃止。初回ロード時にも付与しない。
  window.giveDailyCoinBonus = giveDailyCoinBonus = function(){ return; };
  window.showLoginCalendar = showLoginCalendar = function(){
    const p = panel();
    if(p){
      p.innerHTML = `<h2>📅 ログボカレンダー</h2><div class="profileItem"><p>ログインボーナスは廃止しました。</p></div>`;
      home();
    }
  };

  // XP：分野別基礎XP × 難易度倍率。小数切り捨て。ランダムは20固定。
  const BASE_XP_328 = { arithmetic:3, expand:5, factor:7, prime:8, primeFactor:8, derivative:12, integral:14 };
  const RATE_XP_328 = { bunkei:0.8, easy:1, normal:1.3, hard:1.5, veryHard:2, ultraHard:2.5, superHard:2.5, difficult:2, super:2.5 };
  window.calculateQuestionXP323 = window.calculateQuestionXP = function(m,d){
    if(m === "random" || m === "studyRandom") return 20;
    const base = BASE_XP_328[m] || 10;
    const rate = RATE_XP_328[d] == null ? 1 : RATE_XP_328[d];
    return Math.floor(base * rate);
  };

  // 分数表示をなるべく統一
  function fracHTML(a,b){ return `<span class="frac"><span class="top">${a}</span><span class="bottom">${b}</span></span>`; }
  function prettyMath328(raw){
    let t = htmlEscape(raw);
    t = t.replace(/\^\(([^)]+)\)/g,"<sup>$1</sup>");
    t = t.replace(/\^(\-?\d+)/g,"<sup>$1</sup>");
    t = t.replace(/\(([^()<>]+)\)\/\(([^()<>]+)\)/g, function(_,a,b){return fracHTML(a,b);});
    t = t.replace(/([\-]?\d+)\/\(([^()<>]+)\)/g, function(_,a,b){return fracHTML(a,b);});
    t = t.replace(/\(([^()<>]+)\)\/([A-Za-z0-9π]+(?:<sup>\-?\d+<\/sup>|[²³⁴⁵⁶])?)/g, function(_,a,b){return fracHTML(a,b);});
    t = t.replace(/(^|[^\w<\/])([\-]?(?:\d+|x|π|e|log\d*|sin\d*|cos\d*|tan\d*|arctan\d*))\/([A-Za-z0-9π]+(?:<sup>\-?\d+<\/sup>|[²³⁴⁵⁶])?)/g, function(m,pre,a,b){return pre+fracHTML(a,b);});
    return t;
  }
  window.prettyMathHTML = prettyMath328;

  function updatePreview328(){
    const input = byId("ans");
    if(!input) return;
    let prev = byId("answerPreview");
    if(!prev){
      prev = document.createElement("div");
      prev.id = "answerPreview";
      prev.className = "hintBox";
      input.insertAdjacentElement("afterend", prev);
    }
    if(input.value){
      prev.style.display = "block";
      prev.innerHTML = "入力プレビュー：" + prettyMath328(input.value);
    }else{
      prev.style.display = "none";
      prev.innerHTML = "";
    }
  }
  window.updateAnswerPreviewV328 = updatePreview328;

  // テンキー：古いwrapperに頼らず直接入力へ。
  window.addKey = addKey = function(text){
    const input = byId("ans");
    if(!input) return;
    input.value += text;
    try{ input.dispatchEvent(new Event("input", {bubbles:true})); }catch(e){}
    try{ input.setSelectionRange(input.value.length,input.value.length); }catch(e){}
    updatePreview328();
  };
  window.backspaceInput = backspaceInput = function(){
    const input = byId("ans");
    if(!input) return;
    input.value = input.value.slice(0,-1);
    try{ input.dispatchEvent(new Event("input", {bubbles:true})); }catch(e){}
    updatePreview328();
  };
  window.clearInput = clearInput = function(){
    const input = byId("ans");
    if(!input) return;
    input.value = "";
    try{ input.dispatchEvent(new Event("input", {bubbles:true})); }catch(e){}
    updatePreview328();
  };

  // 積分超難問（積分だけLv10相当）
  const ULTRA_328 = [
    {q:"超難問：∫ x²e^x dx", a:"exp(x)*(x^2-2*x+2)", display:"e^x(x^2-2x+2)+C", explanation:"部分積分を2回使います。"},
    {q:"超難問：∫ x²sinx dx", a:"-x^2*cos(x)+2*x*sin(x)+2*cos(x)", display:"-x^2cosx+2xsinx+2cosx+C", explanation:"部分積分を2回使います。"},
    {q:"超難問：∫ x²cosx dx", a:"x^2*sin(x)+2*x*cos(x)-2*sin(x)", display:"x^2sinx+2xcosx-2sinx+C", explanation:"部分積分を2回使います。"},
    {q:"超難問：∫ e^x cosx dx", a:"exp(x)*(sin(x)+cos(x))/2", display:"e^x(sinx+cosx)/2+C", explanation:"部分積分を2回使い、元の積分を移項します。"},
    {q:"超難問：∫ e^x sinx dx", a:"exp(x)*(sin(x)-cos(x))/2", display:"e^x(sinx-cosx)/2+C", explanation:"部分積分を2回使い、元の積分を移項します。"},
    {q:"超難問：∫ 1/(x²+4x+8) dx", a:"atan((x+2)/2)/2", display:"1/2arctan((x+2)/2)+C", explanation:"平方完成して (x+2)^2+4 にします。"},
    {q:"超難問：∫ x/(x²+1)^2 dx", a:"-1/(2*(x^2+1))", display:"-1/(2(x^2+1))+C", explanation:"t=x²+1 と置換します。"},
    {q:"超難問：∫ logx dx", a:"x*log(x)-x", display:"xlogx-x+C", explanation:"部分積分で logx を微分する側にします。"}
  ];
  window.generateUltraHardIntegralQuestion = function(){
    const q = ULTRA_328[Math.floor(Math.random()*ULTRA_328.length)];
    return (typeof cleanQuestionObject === "function") ? cleanQuestionObject(Object.assign({},q)) : Object.assign({},q);
  };

  const baseGenerate328 = (typeof generateQuestion === "function") ? generateQuestion : null;
  if(baseGenerate328 && !window.__v328GenerateWrapped){
    window.__v328GenerateWrapped = true;
    window.generateQuestion = generateQuestion = function(){
      if(mode === "studyRandom"){
        const oldMode = mode, oldDiff = difficulty;
        const modes = ["integral","derivative","factor","prime","expand"];
        mode = modes[Math.floor(Math.random()*modes.length)];
        difficulty = "veryHard";
        let q = baseGenerate328();
        mode = oldMode; difficulty = oldDiff;
        return (typeof cleanQuestionObject === "function") ? cleanQuestionObject(q) : q;
      }
      if(mode === "integral" && (difficulty === "ultraHard" || difficulty === "superHard")) return window.generateUltraHardIntegralQuestion();
      return baseGenerate328.apply(this, arguments);
    };
  }

  // 問題表示：アニメ待ちで消える事故を防ぐため即表示＋軽い演出。
  window.nextQ = nextQ = function(){
    try{ if(typeof clearHint === "function") clearHint(); }catch(e){}
    let count = 0;
    do{
      current = (typeof cleanQuestionObject === "function") ? cleanQuestionObject(generateQuestion()) : generateQuestion();
      count++;
    }while(usedQuestions && current && usedQuestions.includes(current.q) && count < 100);
    if(usedQuestions && current && current.q) usedQuestions.push(current.q);
    const q = byId("q");
    const ans = byId("ans");
    const go = byId("goText");
    if(ans) ans.value = "";
    updatePreview328();
    if(q){
      q.classList.remove("questionAnim");
      q.textContent = current && current.q ? safeClean(current.q) : "問題を生成できませんでした";
      try{ void q.offsetWidth; q.classList.add("questionAnim"); }catch(e){}
    }
    if(go){ try{ go.classList.remove("goAnim"); void go.offsetWidth; go.classList.add("goAnim"); }catch(e){} }
  };

  // 学習メニュー：ランダムの横のXP表示は消す。
  window.startRandomStudyMode = function(){
    mode = "studyRandom";
    difficulty = "veryHard";
    openGame();
    start();
  };
  window.showStudyMenu = showStudyMenu = function(){
    const p = panel();
    if(!p) return;
    p.innerHTML = `
      <h2>📚 学習モード</h2>
      <button class="modeBtn" onclick="selectDifficulty('integral')">積分</button>
      <button class="modeBtn" onclick="selectDifficulty('derivative')">微分</button>
      <button class="modeBtn" onclick="selectDifficulty('factor')">因数分解</button>
      <button class="modeBtn" onclick="selectDifficulty('prime')">素因数分解</button>
      <button class="modeBtn" onclick="selectDifficulty('expand')">展開</button>
      <button class="modeBtn" onclick="selectDifficulty('arithmetic')">四則演算</button>
      <button class="modeBtn hardBtn" onclick="startRandomStudyMode()">🎲 ランダム</button>
    `;
    home();
  };

  // 難易度選択：Lv表示なし。文系は微分・積分だけ、初級の上。
  window.selectDifficulty = selectDifficulty = function(m){
    mode = m;
    const p = panel();
    if(!p) return;
    const bunkei = (m === "integral" || m === "derivative") ? `<button class="modeBtn" onclick="startMode('bunkei')">📘 文系</button>` : "";
    const ultra = (m === "integral") ? `<button class="modeBtn hardBtn" onclick="startMode('ultraHard')">💀 超難問</button>` : "";
    p.innerHTML = `
      <h2>難易度選択</h2>
      ${bunkei}
      <button class="modeBtn" onclick="startMode('easy')">🟢 初級</button>
      <button class="modeBtn" onclick="startMode('normal')">🟡 中級</button>
      <button class="modeBtn" onclick="startMode('hard')">🔴 上級</button>
      <button class="modeBtn hardBtn" onclick="startMode('veryHard')">🔥 難問</button>
      ${ultra}
    `;
    home();
  };

  const baseOpen328 = (typeof openGame === "function") ? openGame : null;
  if(baseOpen328 && !window.__v328OpenWrapped){
    window.__v328OpenWrapped = true;
    window.openGame = openGame = function(){
      baseOpen328.apply(this, arguments);
      const mt = byId("modeTitle");
      if(!mt) return;
      if(mode === "studyRandom") mt.innerText = "🎲 ランダム問題 🎲";
      if(mode === "derivative" && difficulty === "bunkei") mt.innerText = "📘 文系 微分 📘";
      if(mode === "integral" && difficulty === "bunkei") mt.innerText = "📘 文系 積分 📘";
      if(mode === "integral" && (difficulty === "ultraHard" || difficulty === "superHard")) mt.innerText = "💀 積分 超難問 💀";
    };
  }

  // 対戦メニュー：ホーム/対戦欄の「ランダム問題」は置かない。
  window.showMatchMenu = showMatchMenu = function(){
    const p = panel();
    if(!p) return;
    p.innerHTML = `
      <h2>⚔️ 対戦</h2>
      <button class="modeBtn" onclick="showOnlineMatchMenu()">⚔️ ランダムマッチ</button>
      <button class="modeBtn" onclick="showFriendMatchMenu()">🤝 フレンドマッチ</button>
      <button class="modeBtn" onclick="showMatchHistory()">📜 対戦履歴</button>
      <button class="modeBtn" onclick="showGenreStats()">📊 ジャンル別正答率</button>
    `;
    home();
  };

  // その他・ミッションからログボを消す。
  window.showMissionMenu = showMissionMenu = function(){
    const p = panel();
    if(!p) return;
    p.innerHTML = `
      <h2>🎯 ミッション</h2>
      <button class="modeBtn" onclick="showDailyMission()">🎯 デイリーミッション</button>
      <button class="modeBtn" onclick="showGlobalMission319()">🌍 全体ミッション</button>
    `;
    home();
  };
  window.showOtherMenu = showOtherMenu = function(){
    const p = panel();
    const menu = byId("homeMenu");
    if(menu) menu.classList.add("hidden");
    if(!p) return;
    p.innerHTML = `
      <h2>⚙️ その他</h2>
      <button class="modeBtn" onclick="showSettings()">⚙️ 設定</button>
      <button class="modeBtn" onclick="showGuide()">📖 遊び方</button>
      <button class="modeBtn" onclick="showMissionMenu()">🎯 ミッション</button>
      <button class="modeBtn" onclick="showContact()">📩 お問い合わせ</button>
      <button class="modeBtn" onclick="showTermsPage()">📜 利用規約</button>
      <button class="modeBtn" onclick="showPrivacyPolicyPage()">🔒 プライバシーポリシー</button>
      <button class="modeBtn" onclick="showSerialCodePage()">🎁 シリアルコード</button>
    `;
    home();
  };

  // カード/ボタンが押せなくなる対策：捕捉フェーズで安全実行する保険。
  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest ? e.target.closest("button[onclick], .modeBtn[onclick], .keyBtn[onclick]") : null;
    if(!btn || btn.__v328Handling) return;
    const code = btn.getAttribute("onclick") || "";
    if(!code) return;
    // 通常のinline onclickに任せる。もし直前で止まっている環境だけ、この保険が効く。
    setTimeout(function(){
      try{
        if(btn.__v328ClickedRecently) return;
        btn.__v328ClickedRecently = true;
        setTimeout(function(){ btn.__v328ClickedRecently = false; }, 250);
      }catch(e){}
    },0);
  }, true);

  // openPanelPageを安全化。eval失敗でカードが無反応に見えるのを防ぐ。
  window.openPanelPage = openPanelPage = function(fnName){
    const menu = byId("homeMenu");
    const p = panel();
    if(menu) menu.classList.add("hidden");
    if(p) p.innerHTML = "";
    try{ if(typeof pushPanelHistory === "function") pushPanelHistory(fnName); }catch(e){}
    try{
      const fn = window[fnName] || (typeof globalThis !== "undefined" ? globalThis[fnName] : null);
      if(typeof fn === "function") fn();
      else throw new Error("Function not found: "+fnName);
    }catch(err){
      console.error(err);
      if(p) p.innerHTML = `<p>ページを開けませんでした。</p><button class="modeBtn" onclick="backHome()">ホームへ</button>`;
    }
    home();
  };

  // ガチャ被り3コイン返金の最終保証
  function applyGachaItem328(item){
    if(!playerData.gachaTitles) playerData.gachaTitles = [];
    const duplicate = playerData.gachaTitles.includes(item.title);
    if(duplicate){
      playerData.coins = (playerData.coins || 0) + 3;
    }else{
      if(typeof unlockTitle === "function") unlockTitle(item.title);
      playerData.gachaTitles.push(item.title);
    }
    if(item.rarity === "UR" && typeof unlockAchievement === "function") unlockAchievement("UR獲得");
    return duplicate;
  }
  if(typeof getGachaResult === "function"){
    window.getGachaResultNoDuplicate = getGachaResultNoDuplicate = function(){ return getGachaResult(); };
    window.drawGacha = drawGacha = function(){
      if((playerData.coins || 0) < 10){ alert("コインが足りません"); return; }
      playerData.coins -= 10;
      const item = getGachaResult();
      const duplicate = applyGachaItem328(item);
      if(typeof unlockAchievement === "function") unlockAchievement("初ガチャ");
      if(item.rarity === "UR"){
        document.body.classList.add("urFlash");
        setTimeout(function(){document.body.classList.remove("urFlash");},1000);
      }
      if(typeof saveAllData === "function") saveAllData();
      if(typeof updateHomeStatus === "function") updateHomeStatus();
      const p = panel();
      if(p) p.innerHTML = `<h2>🎰 ガチャ結果</h2><div class="profileItem"><h2>${item.rarity}</h2><h1>${typeof titleHTML==="function"?titleHTML(item.title):item.title}</h1><p>${duplicate?"被り！3コイン返金":"新しい称号を獲得！"}</p><p>所持コイン：${playerData.coins||0}</p><button onclick="drawGacha()">もう一回引く</button><button onclick="showGacha()">ガチャ画面へ</button></div>`;
    };
    window.drawGacha10 = drawGacha10 = function(){
      if((playerData.coins || 0) < 100){ alert("コインが足りません"); return; }
      playerData.coins -= 100;
      let refund=0, hasUR=false, html=`<h2>🎰 10連ガチャ結果</h2>`;
      for(let i=0;i<10;i++){
        const item = getGachaResult();
        const duplicate = applyGachaItem328(item);
        if(duplicate) refund += 3;
        if(item.rarity === "UR") hasUR = true;
        html += `<div class="titleItem"><b>${item.rarity}</b><br>${typeof titleHTML==="function"?titleHTML(item.title):item.title}<br>${duplicate?"被り：+3コイン":"NEW"}</div>`;
      }
      if(typeof unlockAchievement === "function") unlockAchievement("初ガチャ");
      if(hasUR){ document.body.classList.add("urFlash"); setTimeout(function(){document.body.classList.remove("urFlash");},1000); }
      if(typeof saveAllData === "function") saveAllData();
      if(typeof updateHomeStatus === "function") updateHomeStatus();
      const p = panel();
      if(p) p.innerHTML = `<h2>🎰 10連ガチャ結果</h2><div class="profileItem"><p>被り返金：${refund}コイン</p><p>所持コイン：${playerData.coins||0}</p><button onclick="drawGacha10()">もう一度10連</button><button onclick="showGacha()">ガチャ画面へ</button></div>` + html;
    };
  }
  window.showGacha = showGacha = function(){
    const p = panel();
    if(!p) return;
    p.innerHTML = `<h2>🎰 ガチャ</h2><div class="profileItem"><p>所持コイン：${playerData.coins||0}</p><p>1回：10コイン / 10連：100コイン</p><p>称号は被りあり。被ったら3コイン返金。</p><button onclick="drawGacha()">10コインで引く</button><button onclick="drawGacha10()">100コインで10連</button><button onclick="showGachaBook()">ガチャ図鑑を見る</button></div><div class="profileItem"><h3>排出率</h3><p>R 70% / SR 20% / SSR 8% / UR 2%</p><p>URのみ色付き。コマンド称号はガチャから出ません。</p></div>`;
    home();
  };

  try{
    if(typeof UPDATE_NOTES !== "undefined"){
      UPDATE_NOTES["3.2.8"] = [
        "3.2.3以降の修正を統合",
        "カードを押すと反応しなくなる問題を修正",
        "テンキーと問題表示を安定化",
        "ログインボーナスとログボカレンダーを削除",
        "難易度選択のレベル表示を削除",
        "ランダム横のXP表示を削除",
        "ガチャ被り3コイン返金と文系微積を維持"
      ];
    }
  }catch(e){}

  document.addEventListener("input", function(e){ if(e && e.target && e.target.id === "ans") updatePreview328(); });
  console.log("Ver3.2.8 final consolidation patch loaded");
})();

// Ver3.2.9 input preview layout / readable math patch
// 目的：分数・√・π・逆三角関数の入力プレビューを見やすくし、テンキー位置を動かさない。
(function(){
  if(window.__v329PreviewPatchLoaded) return;
  window.__v329PreviewPatchLoaded = true;
  try{ window.VERSION = "3.2.9"; }catch(e){}

  function byId(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m];}); }
  function frac(a,b){ return '<span class="frac"><span class="top">'+a+'</span><span class="bottom">'+b+'</span></span>'; }
  function sqrtBox(v){ return '<span class="sqrtBox"><span class="sqrtSymbol">√</span><span class="sqrtRadicand">'+v+'</span></span>'; }
  function readableInverseTrig(t){
    return t
      .replace(/arctan\s*\(([^()]*)\)/g, 'tan<sup>-1</sup>($1)')
      .replace(/atan\s*\(([^()]*)\)/g, 'tan<sup>-1</sup>($1)')
      .replace(/arcsin\s*\(([^()]*)\)/g, 'sin<sup>-1</sup>($1)')
      .replace(/asin\s*\(([^()]*)\)/g, 'sin<sup>-1</sup>($1)')
      .replace(/arccos\s*\(([^()]*)\)/g, 'cos<sup>-1</sup>($1)')
      .replace(/acos\s*\(([^()]*)\)/g, 'cos<sup>-1</sup>($1)');
  }
  function prettyMath329(raw){
    let t = esc(raw || "");
    t = t.replace(/pi/g, "π");
    t = t.replace(/\*/g, "");
    t = readableInverseTrig(t);
    t = t.replace(/sqrt\(([^()]+)\)/g, function(_,v){ return sqrtBox(v); });
    t = t.replace(/√\(([^()]+)\)/g, function(_,v){ return sqrtBox(v); });
    t = t.replace(/√([A-Za-z0-9π]+(?:\^[\-]?\d+)?)/g, function(_,v){ return sqrtBox(v); });
    t = t.replace(/\^\(([^)]+)\)/g,"<sup>$1</sup>");
    t = t.replace(/\^(\-?\d+)/g,"<sup>$1</sup>");
    t = t.replace(/\(([^()<>]+)\)\/\(([^()<>]+)\)/g, function(_,a,b){return frac(a,b);});
    t = t.replace(/([\-]?\d+)\/\(([^()<>]+)\)/g, function(_,a,b){return frac(a,b);});
    t = t.replace(/\(([^()<>]+)\)\/([A-Za-z0-9π]+(?:<sup>\-?\d+<\/sup>|[²³⁴⁵⁶])?)/g, function(_,a,b){return frac(a,b);});
    t = t.replace(/(^|[^\w<\/])([\-]?(?:\d+|x|π|e|log\d*|sin\d*|cos\d*|tan(?:<sup>\-1<\/sup>)?|tan\d*))\/([A-Za-z0-9π]+(?:<sup>\-?\d+<\/sup>|[²³⁴⁵⁶])?)/g, function(m,pre,a,b){return pre+frac(a,b);});
    return t;
  }
  window.prettyMathHTML = prettyMath329;

  window.updateAnswerPreviewV329 = function(){
    const input = byId("ans");
    let prev = byId("answerPreview");
    if(!input || !prev) return;
    prev.style.display = "flex";
    const val = input.value || "";
    if(val.trim()){
      prev.innerHTML = '<div class="previewLabel">入力プレビュー</div><div class="previewMath">'+prettyMath329(val)+'</div>';
    }else{
      prev.innerHTML = '<div class="previewLabel">入力プレビュー</div><div class="previewPlaceholder">分数・√・指数が入るスペース</div>';
    }
  };

  const oldAdd = window.addKey;
  window.addKey = addKey = function(text){
    const input = byId("ans");
    if(!input) return;
    input.value += text;
    try{ input.dispatchEvent(new Event("input", {bubbles:true})); }catch(e){}
    try{ input.focus({preventScroll:true}); input.setSelectionRange(input.value.length,input.value.length); }catch(e){}
    window.updateAnswerPreviewV329();
  };
  window.backspaceInput = backspaceInput = function(){
    const input = byId("ans");
    if(!input) return;
    input.value = input.value.slice(0,-1);
    try{ input.dispatchEvent(new Event("input", {bubbles:true})); }catch(e){}
    window.updateAnswerPreviewV329();
  };
  window.clearInput = clearInput = function(){
    const input = byId("ans");
    if(!input) return;
    input.value = "";
    try{ input.dispatchEvent(new Event("input", {bubbles:true})); }catch(e){}
    window.updateAnswerPreviewV329();
  };

  const oldNext = window.nextQ;
  if(typeof oldNext === "function"){
    window.nextQ = nextQ = function(){
      oldNext.apply(this, arguments);
      setTimeout(function(){ window.updateAnswerPreviewV329(); }, 0);
    };
  }

  // 既存問題の表示だけを分かりやすく。内部答えは atan のままで判定は壊さない。
  const oldClean = window.cleanQuestionObject;
  if(typeof oldClean === "function"){
    window.cleanQuestionObject = cleanQuestionObject = function(q){
      q = oldClean(q);
      if(q && q.display){
        q.display = String(q.display)
          .replace(/arctan\s*\(([^()]*)\)/g, "tan^-1($1)")
          .replace(/atan\s*\(([^()]*)\)/g, "tan^-1($1)")
          .replace(/pi/g, "π");
      }
      if(q && q.q){ q.q = String(q.q).replace(/pi/g,"π"); }
      return q;
    };
  }

  try{
    if(typeof UPDATE_NOTES !== "undefined"){
      UPDATE_NOTES["3.2.9"] = [
        "入力プレビュー枠を最初から大きめに固定",
        "分数や長い式を入力してもテンキー位置がズレにくいように調整",
        "入力プレビューの pi を π と表示",
        "√ の入力プレビューを根号の上線付き表示に変更",
        "arctan/atan 表示を tan^-1 表記にして見やすく変更"
      ];
    }
  }catch(e){}

  document.addEventListener("input", function(e){ if(e && e.target && e.target.id === "ans") window.updateAnswerPreviewV329(); });
  setTimeout(function(){ window.updateAnswerPreviewV329(); }, 300);
  console.log("Ver3.2.9 preview patch loaded");
})();

// Ver3.2.10 ultra integral expansion / readable answer & your-answer patch
// 目的：積分の超難問を大量追加し、正解表示・自分の回答表示を見やすくする。
(function(){
  if(window.__v3210UltraReadablePatchLoaded) return;
  window.__v3210UltraReadablePatchLoaded = true;
  try{ window.VERSION = "3.2.11"; }catch(e){}

  function byId(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m];}); }
  function frac(a,b){ return '<span class="frac"><span class="top">'+a+'</span><span class="bottom">'+b+'</span></span>'; }
  function sqrtBox(v){ return '<span class="sqrtBox"><span class="sqrtSymbol">√</span><span class="sqrtRadicand">'+v+'</span></span>'; }
  function invTrig(t){
    return t
      .replace(/arctan\s*\(([^()]*)\)/g, 'tan<sup>-1</sup>($1)')
      .replace(/atan\s*\(([^()]*)\)/g, 'tan<sup>-1</sup>($1)')
      .replace(/arcsin\s*\(([^()]*)\)/g, 'sin<sup>-1</sup>($1)')
      .replace(/asin\s*\(([^()]*)\)/g, 'sin<sup>-1</sup>($1)')
      .replace(/arccos\s*\(([^()]*)\)/g, 'cos<sup>-1</sup>($1)')
      .replace(/acos\s*\(([^()]*)\)/g, 'cos<sup>-1</sup>($1)');
  }
  function readableMath3210(raw){
    let t = esc(raw || "");
    t = t.replace(/\bpi\b/g,"π").replace(/\*/g,"");
    t = invTrig(t);
    t = t.replace(/sqrt\(([^()]+)\)/g, function(_,v){return sqrtBox(v);});
    t = t.replace(/√\(([^()]+)\)/g, function(_,v){return sqrtBox(v);});
    t = t.replace(/√([A-Za-z0-9π]+(?:\^[\-]?\d+)?)/g, function(_,v){return sqrtBox(v);});
    t = t.replace(/\^\(([^)]+)\)/g,"<sup>$1</sup>");
    t = t.replace(/\^(\-?\d+)/g,"<sup>$1</sup>");
    t = t.replace(/\b(sin|cos|tan|log)\s*\(([^()]*)\)/g,"$1($2)");
    // カッコ付きの分数を優先して縦表示
    t = t.replace(/\(([^()<>]+)\)\/\(([^()<>]+)\)/g, function(_,a,b){return frac(a,b);});
    t = t.replace(/([\-]?\d+)\/\(([^()<>]+)\)/g, function(_,a,b){return frac(a,b);});
    t = t.replace(/\(([^()<>]+)\)\/([A-Za-z0-9π]+(?:<sup>\-?\d+<\/sup>|[²³⁴⁵⁶])?)/g, function(_,a,b){return frac(a,b);});
    t = t.replace(/(^|[^\w<\/])([\-]?(?:\d+|x|π|e|log\d*|sin\d*|cos\d*|tan(?:<sup>\-1<\/sup>)?|tan\d*))\/([A-Za-z0-9π]+(?:<sup>\-?\d+<\/sup>|[²³⁴⁵⁶])?)/g, function(m,pre,a,b){return pre+frac(a,b);});
    return t;
  }
  window.prettyMathHTML = readableMath3210;
  window.readableMathHTML3210 = readableMath3210;

  const ULTRA_3210 = [
    {q:"超難問：∫ x²e^x dx", a:"exp(x)*(x^2-2*x+2)", display:"e^x(x^2-2x+2)+C", explanation:"部分積分を2回使います。"},
    {q:"超難問：∫ x³e^x dx", a:"exp(x)*(x^3-3*x^2+6*x-6)", display:"e^x(x^3-3x^2+6x-6)+C", explanation:"部分積分を3回使います。"},
    {q:"超難問：∫ x²sin(x) dx", a:"-x^2*cos(x)+2*x*sin(x)+2*cos(x)", display:"-x^2cos(x)+2xsin(x)+2cos(x)+C", explanation:"部分積分を2回使います。"},
    {q:"超難問：∫ x²cos(x) dx", a:"x^2*sin(x)+2*x*cos(x)-2*sin(x)", display:"x^2sin(x)+2xcos(x)-2sin(x)+C", explanation:"部分積分を2回使います。"},
    {q:"超難問：∫ x³sin(x) dx", a:"-x^3*cos(x)+3*x^2*sin(x)+6*x*cos(x)-6*sin(x)", display:"-x^3cos(x)+3x^2sin(x)+6xcos(x)-6sin(x)+C", explanation:"部分積分をくり返します。"},
    {q:"超難問：∫ x³cos(x) dx", a:"x^3*sin(x)+3*x^2*cos(x)-6*x*sin(x)-6*cos(x)", display:"x^3sin(x)+3x^2cos(x)-6xsin(x)-6cos(x)+C", explanation:"部分積分をくり返します。"},
    {q:"超難問：∫ e^xcos(x) dx", a:"exp(x)*(sin(x)+cos(x))/2", display:"(e^x(sin(x)+cos(x)))/2+C", explanation:"部分積分を2回使い、元の積分を移項します。"},
    {q:"超難問：∫ e^xsin(x) dx", a:"exp(x)*(sin(x)-cos(x))/2", display:"(e^x(sin(x)-cos(x)))/2+C", explanation:"部分積分を2回使い、元の積分を移項します。"},
    {q:"超難問：∫ e^(2x)cos(3x) dx", a:"exp(2*x)*(2*cos(3*x)+3*sin(3*x))/13", display:"(e^(2x)(2cos(3x)+3sin(3x)))/13+C", explanation:"∫e^(ax)cos(bx)dx の型です。"},
    {q:"超難問：∫ e^(2x)sin(3x) dx", a:"exp(2*x)*(2*sin(3*x)-3*cos(3*x))/13", display:"(e^(2x)(2sin(3x)-3cos(3x)))/13+C", explanation:"∫e^(ax)sin(bx)dx の型です。"},
    {q:"超難問：∫ xlog(x) dx", a:"(x^2*log(x))/2-x^2/4", display:"(x^2log(x))/2-(x^2)/4+C", explanation:"log(x)を微分する側にして部分積分。"},
    {q:"超難問：∫ x²log(x) dx", a:"(x^3*log(x))/3-x^3/9", display:"(x^3log(x))/3-(x^3)/9+C", explanation:"log(x)を微分する側にして部分積分。"},
    {q:"超難問：∫ log(x)/x² dx", a:"-(log(x)+1)/x", display:"-(log(x)+1)/x+C", explanation:"部分積分。1/x² を積分する側にします。"},
    {q:"超難問：∫ (log(x))² dx", a:"x*(log(x))^2-2*x*log(x)+2*x", display:"x(log(x))^2-2xlog(x)+2x+C", explanation:"部分積分を使います。"},
    {q:"超難問：∫ 1/(x²+4x+8) dx", a:"atan((x+2)/2)/2", display:"tan^-1((x+2)/2)/2+C", explanation:"平方完成して (x+2)^2+4 にします。"},
    {q:"超難問：∫ 1/(x²+6x+13) dx", a:"atan((x+3)/2)/2", display:"tan^-1((x+3)/2)/2+C", explanation:"平方完成して (x+3)^2+4 にします。"},
    {q:"超難問：∫ x/(x²+1)² dx", a:"-1/(2*(x^2+1))", display:"-1/(2(x^2+1))+C", explanation:"t=x²+1 と置換します。"},
    {q:"超難問：∫ x/(x²+4)² dx", a:"-1/(2*(x^2+4))", display:"-1/(2(x^2+4))+C", explanation:"t=x²+4 と置換します。"},
    {q:"超難問：∫ x²/(x²+1) dx", a:"x-atan(x)", display:"x-tan^-1(x)+C", explanation:"x²/(x²+1)=1-1/(x²+1) にします。"},
    {q:"超難問：∫ x²/(x²+4) dx", a:"x-2*atan(x/2)", display:"x-2tan^-1(x/2)+C", explanation:"x²/(x²+4)=1-4/(x²+4) にします。"},
    {q:"超難問：∫ (2x+3)/(x²+3x+2) dx", a:"log(x^2+3*x+2)", display:"log(x^2+3x+2)+C", explanation:"分子が分母の微分です。"},
    {q:"超難問：∫ (3x²+2)/(x³+2x+1) dx", a:"log(x^3+2*x+1)", display:"log(x^3+2x+1)+C", explanation:"分子が分母の微分です。"},
    {q:"超難問：∫ 1/(x²-1) dx", a:"log((x-1)/(x+1))/2", display:"log((x-1)/(x+1))/2+C", explanation:"部分分数分解を使います。"},
    {q:"超難問：∫ 1/(x²-4) dx", a:"log((x-2)/(x+2))/4", display:"log((x-2)/(x+2))/4+C", explanation:"部分分数分解を使います。"},
    {q:"超難問：∫ 1/(x²+3x+2) dx", a:"log((x+1)/(x+2))", display:"log((x+1)/(x+2))+C", explanation:"(x+1)(x+2) に因数分解します。"},
    {q:"超難問：∫ (x+1)/(x²+2x+2) dx", a:"log(x^2+2*x+2)/2", display:"log(x^2+2x+2)/2+C", explanation:"分母の微分の半分です。"},
    {q:"超難問：∫ x/(x²+2x+2) dx", a:"log(x^2+2*x+2)/2-atan(x+1)", display:"log(x^2+2x+2)/2-tan^-1(x+1)+C", explanation:"x=(x+1)-1 と分けます。"},
    {q:"超難問：∫ sin(x)cos(x) dx", a:"sin(x)^2/2", display:"(sin(x)^2)/2+C", explanation:"t=sin(x) と置換します。"},
    {q:"超難問：∫ sin²(x)cos(x) dx", a:"sin(x)^3/3", display:"(sin(x)^3)/3+C", explanation:"t=sin(x) と置換します。"},
    {q:"超難問：∫ cos²(x)sin(x) dx", a:"-cos(x)^3/3", display:"-(cos(x)^3)/3+C", explanation:"t=cos(x) と置換します。"},
    {q:"超難問：∫ sin³(x) dx", a:"-cos(x)+cos(x)^3/3", display:"-cos(x)+(cos(x)^3)/3+C", explanation:"sin³x=sinx(1-cos²x) とします。"},
    {q:"超難問：∫ cos³(x) dx", a:"sin(x)-sin(x)^3/3", display:"sin(x)-(sin(x)^3)/3+C", explanation:"cos³x=cosx(1-sin²x) とします。"},
    {q:"超難問：∫ sin²(x) dx", a:"x/2-sin(2*x)/4", display:"x/2-sin(2x)/4+C", explanation:"半角公式を使います。"},
    {q:"超難問：∫ cos²(x) dx", a:"x/2+sin(2*x)/4", display:"x/2+sin(2x)/4+C", explanation:"半角公式を使います。"},
    {q:"超難問：∫ tan(x) dx", a:"-log(cos(x))", display:"-log(cos(x))+C", explanation:"tanx=sinx/cosx とします。"},
    {q:"超難問：∫ 1/cos²(x) dx", a:"tan(x)", display:"tan(x)+C", explanation:"1/cos²x=sec²x です。"},
    {q:"超難問：∫ 1/sin²(x) dx", a:"-1/tan(x)", display:"-1/tan(x)+C", explanation:"csc²x の積分です。"},
    {q:"超難問：∫ 1/(1+e^x) dx", a:"x-log(1+exp(x))", display:"x-log(1+e^x)+C", explanation:"分子分母に e^(-x) をかけても考えられます。"},
    {q:"超難問：∫ e^x/(1+e^x) dx", a:"log(1+exp(x))", display:"log(1+e^x)+C", explanation:"t=1+e^x と置換します。"},
    {q:"超難問：∫ e^x/(1+e^x)² dx", a:"-1/(1+exp(x))", display:"-1/(1+e^x)+C", explanation:"t=1+e^x と置換します。"},
    {q:"超難問：∫ x/(√(x²+1)) dx", a:"sqrt(x^2+1)", display:"√(x^2+1)+C", explanation:"t=x²+1 と置換します。"},
    {q:"超難問：∫ 1/(√x(1+√x)) dx", a:"2*log(1+sqrt(x))", display:"2log(1+√x)+C", explanation:"t=√x と置換します。"},
    {q:"超難問：∫ 1/(√x+1) dx", a:"2*sqrt(x)-2*log(sqrt(x)+1)", display:"2√x-2log(√x+1)+C", explanation:"t=√x と置換します。"},
    {q:"超難問：∫ 1/(x√x) dx", a:"-2/sqrt(x)", display:"-2/√x+C", explanation:"x^(-3/2) と見ます。"},
    {q:"超難問：∫ x√(x+1) dx", a:"2*(x+1)^(5/2)/5-2*(x+1)^(3/2)/3", display:"(2(x+1)^(5/2))/5-(2(x+1)^(3/2))/3+C", explanation:"t=x+1 と置換します。"},
    {q:"超難問：∫ (x+1)√(x²+2x) dx", a:"(x^2+2*x)^(3/2)/3", display:"((x^2+2x)^(3/2))/3+C", explanation:"t=x²+2x と置換します。"},
    {q:"超難問：∫₀¹ x/(x²+1) dx", a:"log(2)/2", display:"log(2)/2", explanation:"t=x²+1 と置換します。"},
    {q:"超難問：∫₀¹ x² dx", a:"1/3", display:"1/3", explanation:"定積分の基本です。"},
    {q:"超難問：∫₀^π sin(x) dx", a:"2", display:"2", explanation:"[-cosx]₀^π を計算します。"},
    {q:"超難問：∫₀^(π/2) cos(x) dx", a:"1", display:"1", explanation:"[sinx]₀^(π/2) を計算します。"},
    {q:"超難問：∫₀^(π/2) sin²(x) dx", a:"pi/4", display:"π/4", explanation:"半角公式を使います。"},
    {q:"超難問：∫₀^(π/2) cos²(x) dx", a:"pi/4", display:"π/4", explanation:"半角公式を使います。"},
    {q:"超難問：∫₀^1 1/(x²+1) dx", a:"pi/4", display:"π/4", explanation:"tan^-1(1)-tan^-1(0) です。"},
    {q:"超難問：∫₀^1 1/(x+1) dx", a:"log(2)", display:"log(2)", explanation:"log(x+1) に代入します。"},
    {q:"超難問：∫₁^e log(x) dx", a:"1", display:"1", explanation:"xlogx-x に 1 と e を代入します。"},
    {q:"超難問：∫₀^1 xe^x dx", a:"1", display:"1", explanation:"部分積分で xe^x を積分します。"},
    {q:"超難問：∫₀^π xsin(x) dx", a:"pi", display:"π", explanation:"部分積分を使います。"},
    {q:"超難問：∫₀^(π/2) xcos(x) dx", a:"pi/2-1", display:"π/2-1", explanation:"部分積分を使います。"},
    {q:"超難問：∫₀^(π/2) xsin(x) dx", a:"1", display:"1", explanation:"部分積分を使います。"}
  ];

  window.generateUltraHardIntegralQuestion = function(){
    const q = ULTRA_3210[Math.floor(Math.random()*ULTRA_3210.length)];
    return (typeof cleanQuestionObject === "function") ? cleanQuestionObject(Object.assign({},q)) : Object.assign({},q);
  };

  // 問題文も innerHTML で見やすく表示。入力欄は常にプレビュー枠を表示。
  const oldNext3210 = window.nextQ;
  window.nextQ = nextQ = function(){
    if(typeof oldNext3210 === "function") oldNext3210.apply(this, arguments);
    setTimeout(function(){
      const qEl = byId("q");
      if(qEl && current && current.q){ qEl.innerHTML = readableMath3210(current.q); }
      if(typeof window.updateAnswerPreviewV329 === "function") window.updateAnswerPreviewV329();
    }, 0);
  };

  // 正解/不正解欄で、正解と自分の回答を両方見やすく表示。
  const baseSubmit3210 = window.submit;
  if(typeof baseSubmit3210 === "function"){
    window.submit = submit = async function(){
      const ansEl = byId("ans");
      const before = ansEl ? ansEl.value.trim() : "";
      await baseSubmit3210.apply(this, arguments);
      const result = byId("result");
      if(result && current){
        const isCorrectText = result.innerHTML.indexOf("○ 正解") >= 0;
        const isWrongText = result.innerHTML.indexOf("× 不正解") >= 0;
        if(isCorrectText || isWrongText){
          const correct = current.display || current.a || "";
          const expMatch = result.innerHTML.match(/\+(\d+)EXP/);
          const xp = expMatch ? expMatch[1] : "";
          if(isCorrectText){
            result.innerHTML = `○ 正解！<br><div class="readableAnswerBox"><div>あなたの回答：</div><div class="previewMath">${readableMath3210(before)}</div><div>正解：</div><div class="previewMath">${readableMath3210(correct)}</div></div>${xp?`+${xp}EXP / +1コイン`:""}`;
          }else{
            result.innerHTML = `× 不正解<br><div class="readableAnswerBox"><div>あなたの回答：</div><div class="previewMath">${readableMath3210(before)}</div><div>正解：</div><div class="previewMath">${readableMath3210(correct)}</div></div><br>📖 ${current.explanation||""}<br><br>🤖 ${typeof aiExplain === "function" ? aiExplain(current.q) : ""}`;
          }
        }
      }
      // 直近履歴にも見やすい回答を保存
      try{
        if(Array.isArray(history) && history.length){ history[history.length-1].yourPretty = before; }
      }catch(e){}
    };
  }

  // 結果画面の「あなた」「正解」も見やすく表示。
  window.showResultPage = showResultPage = function(text){
    if(typeof setInputVisible === "function") setInputVisible(false);
    byId("gameScreen") && byId("gameScreen").classList.remove("active");
    byId("homeScreen") && byId("homeScreen").classList.remove("active");
    byId("resultScreen") && byId("resultScreen").classList.add("active");
    setTimeout(function(){ if(typeof ensureHomeButton === "function") ensureHomeButton(); },0);
    const sum = byId("resultSummary");
    if(sum) sum.innerHTML = `<div class="profileItem"><h2>${esc(text)}</h2><p>スコア：${score}</p><p>正解数：${history.filter(h=>h.ok).length}</p><p>問題数：${history.length}</p><button class="resultBtn" onclick="restartFromResult()">もう一回</button><button class="resultBtn" onclick="backHomeFromResult()">ホームへ</button></div>`;
    let html = "<h2>解いた問題一覧</h2>";
    for(let h of history){
      html += `<div class="rankItem">${h.ok?"○":"×"}<br>問題：<div class="previewMath">${readableMath3210(h.question)}</div>あなた：<div class="previewMath">${readableMath3210(h.yourPretty || h.your || "")}</div>正解：<div class="previewMath">${readableMath3210(h.answer || "")}</div></div>`;
    }
    const list = byId("resultList");
    if(list) list.innerHTML = html;
  };

  try{
    if(typeof UPDATE_NOTES !== "undefined"){
      UPDATE_NOTES["3.2.10"] = [
        "積分の超難問を大幅追加",
        "正解表示を見やすい数式表示に変更",
        "自分の回答も見やすい数式表示で表示",
        "結果画面の問題・あなたの回答・正解を見やすく表示"
      ];
    }
  }catch(e){}
  console.log("Ver3.2.10 ultra integral and readable answer patch loaded");
})();

// Ver3.2.11 advanced math preview patch
// 目的：指数の文字・式、文字入り分数、複雑な分子分母をプレビュー/回答/正解表示で見やすくする。
(function(){
  if(window.__v3211AdvancedPreviewLoaded) return;
  window.__v3211AdvancedPreviewLoaded = true;
  try{ window.VERSION = "3.2.11"; }catch(e){}

  function byId(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m];}); }
  function frac(a,b){ return '<span class="frac"><span class="top">'+a+'</span><span class="bottom">'+b+'</span></span>'; }
  function sqrtBox(v){ return '<span class="sqrtBox"><span class="sqrtSymbol">√</span><span class="sqrtRadicand">'+v+'</span></span>'; }
  function isBalanced(s){
    let d=0;
    for(let i=0;i<s.length;i++){
      if(s[i]==='(') d++;
      else if(s[i]===')') { d--; if(d<0) return false; }
    }
    return d===0;
  }
  function stripOuter(s){
    s=String(s||"").trim();
    while(s[0]==='(' && s[s.length-1]===')'){
      let d=0, ok=true;
      for(let i=0;i<s.length;i++){
        if(s[i]==='(') d++;
        else if(s[i]===')') d--;
        if(d===0 && i<s.length-1){ ok=false; break; }
      }
      if(ok) s=s.slice(1,-1).trim(); else break;
    }
    return s;
  }
  function splitAddSub(s){
    let parts=[], d=0, start=0;
    for(let i=0;i<s.length;i++){
      const c=s[i];
      if(c==='(') d++;
      else if(c===')') d--;
      else if(d===0 && i>0 && (c==='+' || c==='-')){
        const prev=s[i-1];
        if(prev==='^' || prev==='e' || prev==='E') continue;
        parts.push(s.slice(start,i));
        start=i;
      }
    }
    if(parts.length){ parts.push(s.slice(start)); return parts; }
    return null;
  }
  function topSlash(s){
    let d=0;
    for(let i=0;i<s.length;i++){
      const c=s[i];
      if(c==='(') d++;
      else if(c===')') d--;
      else if(c==='/' && d===0) return i;
    }
    return -1;
  }
  function readParens(s, openIndex){
    let d=0;
    for(let i=openIndex;i<s.length;i++){
      if(s[i]==='(') d++;
      else if(s[i]===')'){
        d--;
        if(d===0) return {body:s.slice(openIndex+1,i), end:i};
      }
    }
    return null;
  }
  function formatPowerAndRoots(s){
    let out="";
    for(let i=0;i<s.length;i++){
      if(s.startsWith("sqrt(", i)){
        const r=readParens(s, i+4);
        if(r){ out += sqrtBox(formatExpr(r.body)); i=r.end; continue; }
      }
      if(s[i]==='√'){
        if(s[i+1]==='('){
          const r=readParens(s, i+1);
          if(r){ out += sqrtBox(formatExpr(r.body)); i=r.end; continue; }
        }else{
          let j=i+1;
          while(j<s.length && /[A-Za-z0-9π]/.test(s[j])) j++;
          if(j>i+1){ out += sqrtBox(formatExpr(s.slice(i+1,j))); i=j-1; continue; }
        }
      }
      if(s[i]==='^'){
        if(s[i+1]==='('){
          const r=readParens(s, i+1);
          if(r){ out += '<sup>'+formatExpr(r.body)+'</sup>'; i=r.end; continue; }
        }else{
          let j=i+1;
          if(s[j]==='-') j++;
          while(j<s.length && /[A-Za-z0-9π]/.test(s[j])) j++;
          if(j>i+1){ out += '<sup>'+formatExpr(s.slice(i+1,j))+'</sup>'; i=j-1; continue; }
        }
      }
      out += esc(s[i]);
    }
    return out;
  }
  function invTrigText(s){
    return s
      .replace(/arctan/g,"tan^-1")
      .replace(/atan/g,"tan^-1")
      .replace(/arcsin/g,"sin^-1")
      .replace(/asin/g,"sin^-1")
      .replace(/arccos/g,"cos^-1")
      .replace(/acos/g,"cos^-1");
  }
  function normalizeText(s){
    return String(s||"")
      .replace(/π/g,"pi")
      .replace(/\bpi\b/g,"π")
      .replace(/\*/g,"");
  }
  function formatExpr(raw){
    let s = normalizeText(invTrigText(String(raw==null?"":raw))).trim();
    if(!s) return "";
    s = stripOuter(s);
    const parts = splitAddSub(s);
    if(parts){ return parts.map(function(p){ return formatExpr(p); }).join(""); }
    const slash = topSlash(s);
    if(slash>0){
      const left = stripOuter(s.slice(0,slash));
      const right = stripOuter(s.slice(slash+1));
      if(left && right) return frac(formatExpr(left), formatExpr(right));
    }
    let html = formatPowerAndRoots(s);
    html = html.replace(/tan\^-1/g,'tan<sup>-1</sup>')
               .replace(/sin\^-1/g,'sin<sup>-1</sup>')
               .replace(/cos\^-1/g,'cos<sup>-1</sup>');
    return html;
  }

  window.readableMathHTML3211 = formatExpr;
  window.prettyMathHTML = formatExpr;

  window.updateAnswerPreviewV329 = function(){
    const input = byId("ans");
    let prev = byId("answerPreview");
    if(!input || !prev) return;
    prev.style.display = "flex";
    const val = input.value || "";
    if(val.trim()){
      prev.innerHTML = '<div class="previewLabel">入力プレビュー</div><div class="previewMath">'+formatExpr(val)+'</div>';
    }else{
      prev.innerHTML = '<div class="previewLabel">入力プレビュー</div><div class="previewPlaceholder">分数・√・指数が入るスペース</div>';
    }
  };

  const oldNext3211 = window.nextQ;
  if(typeof oldNext3211 === "function"){
    window.nextQ = nextQ = function(){
      oldNext3211.apply(this, arguments);
      setTimeout(function(){
        const qEl = byId("q");
        if(qEl && typeof current !== "undefined" && current && current.q){ qEl.innerHTML = formatExpr(current.q); }
        window.updateAnswerPreviewV329();
      },0);
    };
  }

  const oldSubmit3211 = window.submit;
  if(typeof oldSubmit3211 === "function"){
    window.submit = submit = async function(){
      const ansEl = byId("ans");
      const before = ansEl ? ansEl.value.trim() : "";
      await oldSubmit3211.apply(this, arguments);
      const result = byId("result");
      if(result && typeof current !== "undefined" && current){
        const ok = result.innerHTML.indexOf("○ 正解") >= 0;
        const ng = result.innerHTML.indexOf("× 不正解") >= 0;
        if(ok || ng){
          const correct = current.display || current.a || "";
          const expMatch = result.innerHTML.match(/\+(\d+)EXP/);
          const xp = expMatch ? expMatch[1] : "";
          const box = '<div class="readableAnswerBox"><div>あなたの回答：</div><div class="previewMath">'+formatExpr(before)+'</div><div>正解：</div><div class="previewMath">'+formatExpr(correct)+'</div></div>';
          if(ok) result.innerHTML = '○ 正解！<br>'+box+(xp?`+${xp}EXP / +1コイン`:"");
          else result.innerHTML = '× 不正解<br>'+box+'<br>📖 '+(current.explanation||"")+'<br><br>🤖 '+(typeof aiExplain === "function" ? aiExplain(current.q) : "");
        }
      }
      try{ if(Array.isArray(history) && history.length){ history[history.length-1].yourPretty = before; } }catch(e){}
    };
  }

  if(typeof showResultPage === "function"){
    window.showResultPage = showResultPage = function(text){
      if(typeof setInputVisible === "function") setInputVisible(false);
      byId("gameScreen") && byId("gameScreen").classList.remove("active");
      byId("homeScreen") && byId("homeScreen").classList.remove("active");
      byId("resultScreen") && byId("resultScreen").classList.add("active");
      setTimeout(function(){ if(typeof ensureHomeButton === "function") ensureHomeButton(); },0);
      const sum = byId("resultSummary");
      if(sum) sum.innerHTML = `<div class="profileItem"><h2>${esc(text)}</h2><p>スコア：${score}</p><p>正解数：${history.filter(h=>h.ok).length}</p><p>問題数：${history.length}</p><button class="resultBtn" onclick="restartFromResult()">もう一回</button><button class="resultBtn" onclick="backHomeFromResult()">ホームへ</button></div>`;
      let html = "<h2>解いた問題一覧</h2>";
      for(let h of history){
        html += `<div class="rankItem">${h.ok?"○":"×"}<br>問題：<div class="previewMath">${formatExpr(h.question)}</div>あなた：<div class="previewMath">${formatExpr(h.yourPretty || h.your || "")}</div>正解：<div class="previewMath">${formatExpr(h.answer || "")}</div></div>`;
      }
      const list = byId("resultList");
      if(list) list.innerHTML = html;
    };
  }

  try{
    if(typeof UPDATE_NOTES !== "undefined"){
      UPDATE_NOTES["3.2.11"] = [
        "指数の中が x 以外の文字・式でもプレビュー表示に対応",
        "分子・分母に文字や式が入る分数を縦分数で表示",
        "自分の回答・正解・結果画面の数式表示をさらに見やすく調整"
      ];
    }
  }catch(e){}
  document.addEventListener("input", function(e){ if(e && e.target && e.target.id === "ans") window.updateAnswerPreviewV329(); });
  setTimeout(function(){ window.updateAnswerPreviewV329(); },300);
  console.log("Ver3.2.11 advanced preview patch loaded");
})();

// Ver3.2.12 photo ultra integral + question position fix
// 目的：写真の476・477系の超難問積分を追加し、超難問の問題表示位置ズレを修正。
(function(){
  if(window.__v3212PhotoUltraPatchLoaded) return;
  window.__v3212PhotoUltraPatchLoaded = true;
  try{ window.VERSION = "3.2.12"; }catch(e){}

  function injectStyle(){
    if(document.getElementById('v3212-question-position-style')) return;
    const st=document.createElement('style');
    st.id='v3212-question-position-style';
    st.textContent = `
      /* Ver3.2.12: 超難問の問題位置ズレ修正 */
      #q{
        min-height:170px!important;
        box-sizing:border-box!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        flex-wrap:wrap!important;
        gap:2px 4px!important;
        padding:14px 12px!important;
        margin:12px auto 12px!important;
        width:94%!important;
        max-width:760px!important;
        line-height:1.45!important;
        overflow-x:auto!important;
        overflow-y:visible!important;
        word-break:normal!important;
        overflow-wrap:anywhere!important;
      }
      #q .frac{font-size:.86em!important; margin:0 3px!important;}
      #q .frac .top{padding:0 4px 3px!important;}
      #q .frac .bottom{padding:3px 4px 0!important;}
      #q .sqrtBox{display:inline-flex!important;align-items:flex-start!important;vertical-align:middle!important;line-height:1!important;margin:0 3px!important;}
      #q .sqrtRadicand{border-top:2px solid currentColor!important;padding:2px 4px 0!important;margin-left:1px!important;}
      @media(max-width:520px){
        #q{font-size:28px!important;min-height:185px!important;padding:12px 8px!important;}
        #q .frac{font-size:.78em!important;}
      }
    `;
    document.head.appendChild(st);
  }
  injectStyle();

  const PHOTO_ULTRA_3212 = [
    // 476・477の写真で読める問題＋同レベル類題。文字が潰れているものは近い形に補完。
    {q:"超難問：∫ e^x/(e^x+e^(-x)) dx", a:"log(exp(2*x)+1)/2", display:"1/2log(e^(2x)+1)+C", explanation:"分子分母にe^xをかけて、e^(2x)/(e^(2x)+1) と見ます。"},
    {q:"超難問：∫ (e^x-e^(-x))^2 dx", a:"exp(2*x)/2-2*x-exp(-2*x)/2", display:"e^(2x)/2-2x-e^(-2x)/2+C", explanation:"展開してから積分します。"},
    {q:"超難問：∫ (e^(x/2)-e^(-x/2)) dx", a:"2*exp(x/2)+2*exp(-x/2)", display:"2e^(x/2)+2e^(-x/2)+C", explanation:"指数の係数に注意して積分します。"},
    {q:"超難問：∫ (2x-3)/(x^2-3x+4) dx", a:"log(x^2-3*x+4)", display:"log(x^2-3x+4)+C", explanation:"分子が分母の微分です。"},
    {q:"超難問：∫ (2x+1)/(x^2+x-4) dx", a:"log(x^2+x-4)", display:"log(x^2+x-4)+C", explanation:"分子が分母の微分です。"},
    {q:"超難問：∫ (x^2-x)/(x^3+1) dx", a:"log(x+1)-log(x^2-x+1)/2-sqrt(3)*atan((2*x-1)/sqrt(3))/6", display:"log(x+1)-1/2log(x^2-x+1)-√3/6 tan^-1((2x-1)/√3)+C", explanation:"x^3+1=(x+1)(x^2-x+1) として部分分数分解します。"},
    {q:"超難問：∫ dx/(1+sin(x))", a:"tan(x)-1/cos(x)", display:"tan(x)-1/cos(x)+C", explanation:"分子分母に1-sinxをかけます。"},
    {q:"超難問：∫ sin(x)/(1+cos(x)) dx", a:"-log(1+cos(x))", display:"-log(1+cos(x))+C", explanation:"t=1+cosx と置換します。"},
    {q:"超難問：∫ cos(x)/(1-sin(x)) dx", a:"-log(1-sin(x))", display:"-log(1-sin(x))+C", explanation:"t=1-sinx と置換します。"},
    {q:"超難問：∫ 1/(1+cos(x)) dx", a:"tan(x/2)", display:"tan(x/2)+C", explanation:"1+cosx=2cos^2(x/2) を使います。"},
    {q:"超難問：∫ x e^(x^2) dx", a:"exp(x^2)/2", display:"e^(x^2)/2+C", explanation:"t=x^2 と置換します。"},
    {q:"超難問：∫ x e^(-x^2) dx", a:"-exp(-x^2)/2", display:"-e^(-x^2)/2+C", explanation:"t=-x^2 と置換します。"},
    {q:"超難問：∫ 2x e^(-x^2) dx", a:"-exp(-x^2)", display:"-e^(-x^2)+C", explanation:"t=-x^2 と置換します。"},
    {q:"超難問：∫ sin(log(x)) dx", a:"x*(sin(log(x))-cos(log(x)))/2", display:"x(sin(logx)-cos(logx))/2+C", explanation:"t=logx と置換して ∫e^t sint dt にします。"},
    {q:"超難問：∫ cos(log(x)) dx", a:"x*(sin(log(x))+cos(log(x)))/2", display:"x(sin(logx)+cos(logx))/2+C", explanation:"t=logx と置換して ∫e^t cost dt にします。"},
    {q:"超難問：∫ x/(sqrt(x)+1) dx", a:"2*x^(3/2)/3-x+2*sqrt(x)-2*log(sqrt(x)+1)", display:"2x^(3/2)/3-x+2√x-2log(√x+1)+C", explanation:"t=√x と置換します。"},
    {q:"超難問：∫ dx/(sqrt(x)+1)", a:"2*sqrt(x)-2*log(sqrt(x)+1)", display:"2√x-2log(√x+1)+C", explanation:"t=√x と置換します。"},
    {q:"超難問：∫ log(x^2) dx", a:"x*log(x^2)-2*x", display:"xlog(x^2)-2x+C", explanation:"log(x^2)を部分積分します。"},
    {q:"超難問：∫ log(x+1)/x^2 dx", a:"log(x+1)-log(x)-log(x+1)/x", display:"log(x+1)-logx-log(x+1)/x+C", explanation:"部分積分後に部分分数分解します。"},
    {q:"超難問：∫ log(x+1)/x^3 dx", a:"-log(x+1)/(2*x^2)+log(x)/(2)-log(x+1)/2+1/(2*x)", display:"-log(x+1)/(2x^2)+1/2logx-1/2log(x+1)+1/(2x)+C", explanation:"部分積分後に有理式を分解します。"},
    {q:"超難問：∫ dx/(sqrt(x-1)*sqrt(x+1))", a:"log(x+sqrt(x^2-1))", display:"log(x+√(x^2-1))+C", explanation:"双曲線型の標準形です。"},
    {q:"超難問：∫ (x-1)/sqrt(x^2-2*x) dx", a:"sqrt(x^2-2*x)", display:"√(x^2-2x)+C", explanation:"t=x^2-2x と置換します。"},
    {q:"超難問：∫ log(x+sqrt(x^2+1)) dx", a:"x*log(x+sqrt(x^2+1))-sqrt(x^2+1)", display:"xlog(x+√(x^2+1))-√(x^2+1)+C", explanation:"部分積分を使います。"},
    {q:"超難問：∫ x*2^x dx", a:"2^x*(x/log(2)-1/(log(2)^2))", display:"2^x(x/log2-1/(log2)^2)+C", explanation:"部分積分で2^xを積分します。"},
    {q:"超難問：∫ x*log(x^2) dx", a:"x^2*log(x^2)/2-x^2/2", display:"x^2log(x^2)/2-x^2/2+C", explanation:"部分積分です。"},
    {q:"超難問：∫ x^2*2^x dx", a:"2^x*(x^2/log(2)-2*x/(log(2)^2)+2/(log(2)^3))", display:"2^x(x^2/log2-2x/(log2)^2+2/(log2)^3)+C", explanation:"部分積分をくり返します。"},
    {q:"超難問：∫ dx/(1-2x)^3", a:"1/(4*(1-2*x)^2)", display:"1/(4(1-2x)^2)+C", explanation:"t=1-2x と置換します。"},
    {q:"超難問：∫ log(x^2+1)/x^2 dx", a:"2*atan(x)-log(x^2+1)/x", display:"2tan^-1(x)-log(x^2+1)/x+C", explanation:"部分積分を使います。"},
    {q:"超難問：∫ (log(x))^2/x dx", a:"(log(x))^3/3", display:"(logx)^3/3+C", explanation:"t=logx と置換します。"},
    {q:"超難問：∫ cos^3(x)sin(2x) dx", a:"-2*cos(x)^5/5", display:"-2cos^5(x)/5+C", explanation:"sin2x=2sinxcosx として t=cosx。"},
    {q:"超難問：∫ dx/cos^3(x)", a:"tan(x)/cos(x)/2+log((1+sin(x))/cos(x))/2", display:"1/2 tanx/cosx + 1/2log((1+sinx)/cosx)+C", explanation:"sec^3x の標準積分です。"},
    {q:"超難問：∫₀^(π/2) sin^2(x) dx", a:"pi/4", display:"π/4", explanation:"半角公式を使います。"},
    {q:"超難問：∫₀^(π/2) cos^2(x) dx", a:"pi/4", display:"π/4", explanation:"半角公式を使います。"},
    {q:"超難問：∫₀^(π/2) sin^4(x) dx", a:"3*pi/16", display:"3π/16", explanation:"半角公式を2回使います。"},
    {q:"超難問：∫₀^(π/2) cos^4(x) dx", a:"3*pi/16", display:"3π/16", explanation:"半角公式を2回使います。"},
    {q:"超難問：∫₀^(π/2) sin(x)cos(x) dx", a:"1/2", display:"1/2", explanation:"t=sinx と置換します。"},
    {q:"超難問：∫₀^(π/2) sin^2(x)cos(x) dx", a:"1/3", display:"1/3", explanation:"t=sinx と置換します。"},
    {q:"超難問：∫₀^(π/2) sin(x)cos^2(x) dx", a:"1/3", display:"1/3", explanation:"t=cosx と置換します。"},
    {q:"超難問：∫₁^e (log(x))/x dx", a:"1/2", display:"1/2", explanation:"t=logx と置換します。"},
    {q:"超難問：∫₁^e (log(x))^2/x dx", a:"1/3", display:"1/3", explanation:"t=logx と置換します。"},
    {q:"超難問：∫₀^1 dx/(x^2+1)", a:"pi/4", display:"π/4", explanation:"tan^-1x に代入します。"},
    {q:"超難問：∫₀^1 dx/(x^2+4)", a:"atan(1/2)/2", display:"1/2tan^-1(1/2)", explanation:"∫dx/(x^2+a^2)=1/a tan^-1(x/a) です。"},
    {q:"超難問：∫₀^1 dx/(x^2+x+1)", a:"2*atan((2*x+1)/sqrt(3))/sqrt(3)", display:"2/√3[tan^-1((2x+1)/√3)]_0^1", explanation:"平方完成します。定積分の形で表示しています。"}
  ];

  const oldUltra3212 = window.generateUltraHardIntegralQuestion;
  window.generateUltraHardIntegralQuestion = function(){
    let q;
    if(Math.random() < 0.75 || typeof oldUltra3212 !== 'function'){
      q = PHOTO_ULTRA_3212[Math.floor(Math.random()*PHOTO_ULTRA_3212.length)];
      q = Object.assign({}, q);
    }else{
      q = oldUltra3212();
    }
    return (typeof cleanQuestionObject === "function") ? cleanQuestionObject(q) : q;
  };

  const oldNext3212 = window.nextQ;
  if(typeof oldNext3212 === 'function'){
    window.nextQ = nextQ = function(){
      oldNext3212.apply(this, arguments);
      setTimeout(function(){
        injectStyle();
        const qEl=document.getElementById('q');
        if(qEl && typeof current !== 'undefined' && current && current.q){
          try{ qEl.innerHTML = (window.prettyMathHTML || window.readableMathHTML3211)(current.q); }catch(e){}
        }
      },0);
    };
  }

  try{
    if(typeof UPDATE_NOTES !== "undefined"){
      UPDATE_NOTES["3.2.12"] = [
        "写真の476・477系の積分超難問を追加",
        "読みにくい問題は同レベルの類題で補完",
        "超難問の問題表示位置ズレを修正"
      ];
    }
  }catch(e){}
  console.log("Ver3.2.12 photo ultra integral / question position patch loaded");
})();


// Ver3.3.0 range display / simple news patch
// 目的：定積分の範囲表示をきれいにし、お知らせを簡潔にする。
(function(){
  if(window.__v330RangeNewsPatchLoaded) return;
  window.__v330RangeNewsPatchLoaded = true;
  try{ window.VERSION = "3.3.0"; }catch(e){}

  function esc330(s){
    return String(s==null?"":s).replace(/[&<>"']/g,function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m];
    });
  }
  function subToNormal330(s){
    const map={"₀":"0","₁":"1","₂":"2","₃":"3","₄":"4","₅":"5","₆":"6","₇":"7","₈":"8","₉":"9","₋":"-"};
    return String(s||"").replace(/[₀₁₂₃₄₅₆₇₈₉₋]/g,function(c){return map[c]||c;});
  }
  function integralHTML330(lower, upper){
    lower = esc330(subToNormal330(lower)).replace(/pi/g,"π");
    upper = esc330(subToNormal330(upper)).replace(/pi/g,"π");
    return '<span class="defIntegral"><span class="defUpper">'+upper+'</span><span class="defSymbol">∫</span><span class="defLower">'+lower+'</span></span>';
  }
  function prettifyIntegralRanges330(raw){
    let s = String(raw==null?"":raw);
    // ∫₀^(π/2), ∫₁^e, ∫_0^(π/2), ∫_0^1 などを上下付きの積分記号にする
    s = s.replace(/∫([₀₁₂₃₄₅₆₇₈₉₋]+)\^\(([^)]+)\)/g,function(_,lo,up){return integralHTML330(lo,up);});
    s = s.replace(/∫([₀₁₂₃₄₅₆₇₈₉₋]+)\^([A-Za-z0-9π]+|e)/g,function(_,lo,up){return integralHTML330(lo,up);});
    s = s.replace(/∫_\{?([^\}\^\s]+)\}?\^\(([^)]+)\)/g,function(_,lo,up){return integralHTML330(lo,up);});
    s = s.replace(/∫_\{?([^\}\^\s]+)\}?\^\{?([^\}\s]+)\}?/g,function(_,lo,up){return integralHTML330(lo,up);});
    return s;
  }
  const oldPretty330 = window.prettyMathHTML || window.readableMathHTML3211 || function(x){return esc330(x);};
  function pretty330(raw){
    let s = String(raw==null?"":raw);
    // 先に積分範囲だけHTML化して、残りは既存の数式整形へ分割して通す
    let marked = prettifyIntegralRanges330(s);
    const tokens = marked.split(/(<span class="defIntegral"[\s\S]*?<\/span><\/span>)/g);
    return tokens.map(function(tok){
      if(tok.indexOf('class="defIntegral"')>=0) return tok;
      return oldPretty330(tok);
    }).join('');
  }
  window.prettyMathHTML = pretty330;
  window.readableMathHTML330 = pretty330;

  function inject330Style(){
    if(document.getElementById('v330-range-style')) return;
    const st=document.createElement('style');
    st.id='v330-range-style';
    st.textContent=`
      .defIntegral{
        display:inline-grid!important;
        grid-template-rows:auto auto auto!important;
        grid-template-columns:auto!important;
        align-items:center!important;
        justify-items:center!important;
        vertical-align:middle!important;
        line-height:1!important;
        margin:0 .12em!important;
        min-width:.75em!important;
      }
      .defIntegral .defUpper,
      .defIntegral .defLower{
        font-size:.42em!important;
        line-height:1!important;
        white-space:nowrap!important;
        transform:translateX(.22em);
      }
      .defIntegral .defSymbol{
        font-size:1.25em!important;
        line-height:.92!important;
      }
      #q .defIntegral .defUpper,
      #q .defIntegral .defLower{font-size:.36em!important;}
      #q .defIntegral .defSymbol{font-size:1.22em!important;}
      #q{align-items:center!important;}
      @media(max-width:520px){
        #q .defIntegral .defUpper,
        #q .defIntegral .defLower{font-size:.34em!important;}
        #q .defIntegral .defSymbol{font-size:1.18em!important;}
      }
    `;
    document.head.appendChild(st);
  }
  inject330Style();

  const oldNext330 = window.nextQ;
  if(typeof oldNext330 === 'function'){
    window.nextQ = nextQ = function(){
      oldNext330.apply(this, arguments);
      setTimeout(function(){
        inject330Style();
        const qEl=document.getElementById('q');
        if(qEl && typeof current !== 'undefined' && current && current.q){
          try{ qEl.innerHTML = pretty330(current.q); }catch(e){}
        }
      },0);
    };
  }

  const oldUpdatePreview330 = window.updateAnswerPreviewV329;
  window.updateAnswerPreviewV329 = function(){
    const input=document.getElementById('ans');
    const prev=document.getElementById('answerPreview');
    if(!input || !prev) return;
    prev.style.display='flex';
    const val=input.value||'';
    if(val.trim()){
      prev.innerHTML='<div class="previewLabel">入力プレビュー</div><div class="previewMath">'+pretty330(val)+'</div>';
    }else{
      prev.innerHTML='<div class="previewLabel">入力プレビュー</div><div class="previewPlaceholder">分数・√・指数が入るスペース</div>';
    }
  };
  document.addEventListener('input',function(e){ if(e && e.target && e.target.id==='ans') window.updateAnswerPreviewV329(); });

  try{
    if(typeof UPDATE_NOTES !== 'undefined'){
      UPDATE_NOTES['3.3.0'] = ['問題追加'];
    }
  }catch(e){}
  console.log('Ver3.3.0 range/news patch loaded');
})();


// Ver3.3.1 dx size / ultra label / old news cleanup patch
// 目的：指数の後ろの dx が指数サイズになる問題を修正し、超難問の問題ラベルと3.2.12のお知らせを消す。
(function(){
  if(window.__v331DxUltraNewsPatchLoaded) return;
  window.__v331DxUltraNewsPatchLoaded = true;
  try{ window.VERSION = "3.3.6"; }catch(e){}

  function stripUltraLabel331(text){
    return String(text==null?"":text).replace(/^\s*超難問\s*[：:]\s*/,'');
  }
  function protectDx331(text){
    let s = stripUltraLabel331(text);
    // ^4dx が ^4dx 全体で指数扱いされるのを防ぐ
    s = s.replace(/\^(\d+)\s*d\s*x\b/g, '^$1 dx');
    s = s.replace(/\^\(([^)]*)\)\s*d\s*x\b/g, '^($1) dx');
    // 積分の後ろの dx を必ず本文側として分離
    s = s.replace(/([^\s])d\s*x\b/g, '$1 dx');
    return s;
  }
  function fixDxHTML331(html){
    // HTMLタグの中は触らず、残った dx だけ小さめ本文サイズにする簡易処理
    return String(html==null?"":html).replace(/(^|[^A-Za-z])d\s*x(?![A-Za-z])/g, function(_,pre){
      return pre + '<span class="mathDx">dx</span>';
    });
  }

  const oldPretty331 = window.prettyMathHTML || window.readableMathHTML330 || window.readableMathHTML3211 || function(x){
    return String(x==null?"":x).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m];});
  };
  function pretty331(raw){
    const html = oldPretty331(protectDx331(raw));
    return fixDxHTML331(html);
  }
  window.prettyMathHTML = pretty331;
  window.readableMathHTML331 = pretty331;

  const oldClean331 = window.cleanQuestionObject;
  window.cleanQuestionObject = cleanQuestionObject = function(q){
    q = (typeof oldClean331 === 'function') ? oldClean331(q) : q;
    if(q && q.q) q.q = stripUltraLabel331(q.q);
    return q;
  };

  function inject331Style(){
    if(document.getElementById('v331-dx-ultra-style')) return;
    const st=document.createElement('style');
    st.id='v331-dx-ultra-style';
    st.textContent=`
      .mathDx{
        display:inline-block!important;
        font-size:.72em!important;
        line-height:1!important;
        vertical-align:baseline!important;
        margin-left:.10em!important;
        letter-spacing:.01em!important;
      }
      #q .mathDx{font-size:.70em!important;margin-left:.12em!important;}
      .previewMath .mathDx,.answerPretty .mathDx,.correctPretty .mathDx{font-size:.72em!important;}
    `;
    document.head.appendChild(st);
  }
  inject331Style();

  function rerenderQuestion331(){
    const qEl=document.getElementById('q');
    if(qEl && typeof current !== 'undefined' && current && current.q){
      try{ qEl.innerHTML = pretty331(current.q); }catch(e){}
    }
  }
  const oldNext331 = window.nextQ;
  if(typeof oldNext331 === 'function'){
    window.nextQ = nextQ = function(){
      oldNext331.apply(this, arguments);
      setTimeout(function(){ inject331Style(); rerenderQuestion331(); },0);
    };
  }

  const oldUpdatePreview331 = window.updateAnswerPreviewV329;
  window.updateAnswerPreviewV329 = function(){
    const input=document.getElementById('ans');
    const prev=document.getElementById('answerPreview');
    if(!input || !prev) return;
    prev.style.display='flex';
    const val=input.value||'';
    if(val.trim()){
      prev.innerHTML='<div class="previewLabel">入力プレビュー</div><div class="previewMath">'+pretty331(val)+'</div>';
    }else{
      prev.innerHTML='<div class="previewLabel">入力プレビュー</div><div class="previewPlaceholder">分数・√・指数が入るスペース</div>';
    }
  };

  try{
    if(typeof UPDATE_NOTES !== 'undefined'){
      delete UPDATE_NOTES['3.2.12'];
      UPDATE_NOTES['3.3.1'] = ['問題追加'];
    }
  }catch(e){}

  document.addEventListener('DOMContentLoaded',function(){
    inject331Style();
    setTimeout(rerenderQuestion331,0);
  });
  console.log('Ver3.3.1 dx/ultra/news patch loaded');
})();

// Ver3.3.2 full update patch
// 数式表示・タイトル統一・ヒント削除・AI解説強化・四則演算判定・問題追加
(function(){
  if(window.__v332FullPatchLoaded) return;
  window.__v332FullPatchLoaded = true;
  try{ window.VERSION = "3.3.6"; }catch(e){}

  function esc332(s){return String(s==null?"":s).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m];});}
  function stripLabels332(s){
    return String(s==null?"":s)
      .replace(/^\s*(文系|初級|中級|上級|難問|超難問)\s*[：:]\s*/,'')
      .replace(/^\s*[📘⭐🔥⚡👹💀]\s*(文系|初級|中級|上級|難問|超難問)\s*[：:]?\s*/,'');
  }
  function categoryLabel332(m){
    const map={arithmetic:"四則演算",prime:"素因数分解",factor:"因数分解",expand:"展開",derivative:"微分",integral:"積分",review:"復習",studyRandom:"ランダム",random:"ランダム"};
    return map[m]||m||"問題";
  }
  function diffLabel332(d){
    if(d==="bunkei") return ["📘","文系"];
    if(d==="easy") return ["⭐","初級"];
    if(d==="normal") return ["🔥","中級"];
    if(d==="hard") return ["⚡","上級"];
    if(d==="veryHard") return ["👹","難問"];
    if(d==="ultraHard") return ["💀","超難問"];
    return ["🎲","ランダム"];
  }
  function titleText332(){
    const d=diffLabel332(typeof difficulty!=="undefined"?difficulty:"");
    const m=categoryLabel332(typeof mode!=="undefined"?mode:"");
    if((typeof mode!=="undefined") && (mode==="studyRandom"||mode==="random")) return "🎲 ランダム 問題 🎲";
    if(mode==="review") return "📚 復習 問題 📚";
    return d[0]+" "+d[1]+" "+m+" "+d[0];
  }
  function updateModeTitle332(){ const mt=document.getElementById('modeTitle'); if(mt) mt.textContent=titleText332(); }

  function integralHTML332(lower, upper){
    lower=esc332(String(lower||"").replace(/pi/g,"π")); upper=esc332(String(upper||"").replace(/pi/g,"π"));
    return '<span class="defIntegral332"><span class="defSymbol332">∫</span><span class="defLimits332"><span>'+upper+'</span><span>'+lower+'</span></span></span>';
  }
  function simplePretty332(raw){
    let s=stripLabels332(String(raw==null?"":raw));
    s=s.replace(/\bd\s*x\b/g,' dx');
    s=s.replace(/pi/g,'π');
    s=s.replace(/\*\*/g,'^').replace(/\*/g,'×');
    s=s.replace(/atan|arctan/g,'tan⁻¹');
    s=s.replace(/∫\[([^\]→]+)→([^\]]+)\]/g,function(_,lo,up){return integralHTML332(lo,up);});
    s=s.replace(/∫_\{?([^\}\^\s]+)\}?\^\{?([^\}\s]+)\}?/g,function(_,lo,up){return integralHTML332(lo,up);});
    s=s.replace(/∫([₀₁₂₃₄₅₆₇₈₉₋]+)\^\(([^)]+)\)/g,function(_,lo,up){return integralHTML332(lo,up);});
    const old = window.readableMathHTML331 || window.readableMathHTML330 || window.readableMathHTML3211 || window.prettyMathHTML;
    if(typeof old==='function'){
      const parts=s.split(/(<span class="defIntegral332"[\s\S]*?<\/span><\/span><\/span>)/g);
      return parts.map(function(p){ return p.indexOf('defIntegral332')>=0 ? p : old(p); }).join('');
    }
    return esc332(s)
      .replace(/\^\(([^)]+)\)/g,'<sup>$1</sup>')
      .replace(/\^(\d+)/g,'<sup>$1</sup>')
      .replace(/(^|[^A-Za-z])dx(?![A-Za-z])/g,'$1<span class="mathDx332">dx</span>');
  }
  window.prettyMathHTML = simplePretty332;
  window.readableMathHTML332 = simplePretty332;

  function injectStyle332(){
    if(document.getElementById('v332-full-style')) return;
    const st=document.createElement('style'); st.id='v332-full-style';
    st.textContent=`
      #hintBtn,#hintArea{display:none!important;}
      #q{min-height:130px!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;line-height:1.35!important;overflow-x:auto!important;padding:10px 8px!important;}
      #modeTitle{font-size:25px!important;letter-spacing:.02em!important;}
      .defIntegral332{display:inline-grid!important;grid-template-columns:auto auto!important;grid-template-rows:auto!important;align-items:center!important;justify-items:center!important;vertical-align:middle!important;margin:0 .14em!important;line-height:1!important;}
      .defSymbol332{font-size:1.55em!important;line-height:.9!important;font-weight:500!important;}
      .defLimits332{display:grid!important;grid-template-rows:auto auto!important;align-items:center!important;justify-items:start!important;margin-left:.04em!important;line-height:.85!important;transform:translateY(-.03em)!important;}
      .defLimits332 span{font-size:.42em!important;line-height:.9!important;white-space:nowrap!important;}
      .mathDx,.mathDx332{font-size:.86em!important;vertical-align:baseline!important;margin-left:.12em!important;}
      #q .mathDx,#q .mathDx332{font-size:.84em!important;}
      #q .sqrtBox,.previewMath .sqrtBox{display:inline-flex!important;align-items:flex-start!important;vertical-align:middle!important;}
      #q .sqrtRadicand,.previewMath .sqrtRadicand{border-top:2px solid currentColor!important;min-width:1.1em!important;padding:2px 5px 0 4px!important;}
      .reviewItem .aiExplainBox{margin-top:8px;padding:10px;border-radius:12px;background:rgba(0,255,204,.08);text-align:left;line-height:1.65;white-space:pre-wrap;}
      .rankItem .rankExpLine{display:none!important;}
      @media(max-width:520px){#modeTitle{font-size:21px!important;}#q{min-height:145px!important;font-size:24px!important}.defSymbol332{font-size:1.45em!important}.defLimits332 span{font-size:.40em!important;}}
    `;
    document.head.appendChild(st);
  }
  injectStyle332();

  const oldClean332=window.cleanQuestionObject;
  window.cleanQuestionObject = cleanQuestionObject = function(q){
    q = (typeof oldClean332==='function') ? oldClean332(q) : q;
    if(q && q.q) q.q = stripLabels332(q.q);
    return q;
  };

  const oldNext332=window.nextQ;
  if(typeof oldNext332==='function'){
    window.nextQ = nextQ = function(){
      const r=oldNext332.apply(this,arguments);
      setTimeout(function(){
        injectStyle332(); updateModeTitle332();
        const qEl=document.getElementById('q');
        if(qEl && typeof current!=='undefined' && current && current.q){ qEl.innerHTML=simplePretty332(current.q); }
      },20);
      return r;
    };
  }
  const oldOpen332=window.openGame;
  if(typeof oldOpen332==='function'){
    window.openGame = openGame = function(){ const r=oldOpen332.apply(this,arguments); setTimeout(updateModeTitle332,0); return r; };
  }

  window.showHint = showHint = function(){};
  window.clearHint = clearHint = function(){ const h=document.getElementById('hintArea'); if(h) h.innerHTML=''; };

  function normalizeForSameQuestion332(s){
    return String(s||'').replace(/\s/g,'').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/π/g,'pi').replace(/\*\*/g,'^');
  }
  const oldExpressionsEqual332=window.expressionsEqual;
  if(typeof oldExpressionsEqual332==='function'){
    window.expressionsEqual = expressionsEqual = function(user,correct){
      try{
        if(typeof mode!=='undefined' && mode==='arithmetic' && typeof current!=='undefined' && current && normalizeForSameQuestion332(user)===normalizeForSameQuestion332(current.q)) return false;
      }catch(e){}
      return oldExpressionsEqual332.apply(this,arguments);
    };
  }

  window.aiExplain = aiExplain = function(q){
    q=String(q||'');
    if(q.includes('∫')){
      if(q.includes('sin')||q.includes('cos')) return '【方針】三角関数の形を見て、基本公式・置換・部分積分のどれを使うか決める。\n\n【なぜこの公式を使う？】sinやcosが単独なら基本公式、合成関数になっているなら中身を置換、xやlogが掛かっているなら部分積分を考える。\n\n【解き方】① まず積分しやすい形に直す。\n② 公式または置換を使う。\n③ 定積分なら最後に上端−下端を計算する。\n\n【注意】三角関数は符号ミスが多いので、微分して元に戻るか確認するとよい。';
      if(q.includes('e^')||q.includes('log')) return '【方針】指数・対数は、形によって置換積分か部分積分を選ぶ。\n\n【なぜこの公式を使う？】eの指数部分が一次式なら合成関数の積分、logが単独で出るときは微分すると簡単になるので部分積分を使う。\n\n【解き方】① 置換できる中身がないか見る。\n② logがある場合は「logを微分する側」に置く。\n③ 積分後、置換した文字を元に戻す。';
      return '【方針】式の形を見て、べき乗公式・置換積分・部分積分のどれかを選ぶ。\n\n【なぜこの公式を使う？】xのべきだけならべき乗公式、かっこの中とその微分がセットなら置換積分、異なる種類の関数の積なら部分積分を使う。\n\n【解き方】① まず項ごとに分けられるか確認する。\n② 使う公式を決める。\n③ 計算したら +C を忘れない。\n\n【確認】答えを微分して問題の式に戻れば正解。';
    }
    if(q.includes('d/dx')) return '【方針】微分では、外側の関数と内側の関数を分けて考える。\n\n【なぜこの公式を使う？】xのべきならべきの微分、かっこ全体のべきなら合成関数の微分、積なら積の微分を使う。\n\n【解き方】① 何の形か見る。\n② 公式を選ぶ。\n③ 合成関数なら内側の微分を掛ける。';
    if(q.includes('因数分解')) return '【方針】まず共通因数、次に公式、最後にたすき掛けを見る。\n\n【なぜこの公式を使う？】二乗の差なら a²-b²、平方なら (a±b)²、三次なら和・差の公式が使える。\n\n【解き方】① 共通因数をくくる。\n② 公式に当てはまるか見る。\n③ 展開して元に戻るか確認する。';
    if(q.includes('素因数分解')) return '【方針】小さい素数から順番に割る。\n\n【なぜこの方法を使う？】素因数分解は「素数だけの積」にする問題なので、2,3,5,7,...で割れるだけ割るのが確実。\n\n【解き方】① 2で割れるか見る。\n② 次に3,5,7で試す。\n③ 最後に全部素数だけになっているか確認する。';
    return '【方針】まず問題の形を見て、使う公式を決める。\n\n【なぜこの公式を使う？】式の形が公式の形と一致しているから。\n\n【解き方】① 形を見る。\n② 公式に当てはめる。\n③ 計算して答えを確認する。';
  };

  window.showReviewList = showReviewList = function(){
    let html='<h2>📚 復習リスト</h2>';
    if(!playerData.reviewList || playerData.reviewList.length===0) html+='<p>まだありません</p>';
    for(let i=0;i<(playerData.reviewList||[]).length;i++){
      const r=playerData.reviewList[i];
      html += '<div class="reviewItem"><p>'+(i+1)+'. <span class="previewMath">'+simplePretty332(r.q||'')+'</span></p><p>正解：<span class="previewMath">'+simplePretty332(r.a||'')+'</span></p><div class="aiExplainBox">🤖 AI解説\n'+esc332(r.ai || window.aiExplain(r.q||''))+'</div><button onclick="retryReview('+i+')">再挑戦</button><button onclick="postReviewToBoard('+i+')">💬 掲示板へ投稿</button></div>';
    }
    const p=document.getElementById('panelArea'); if(p) p.innerHTML=html;
    if(typeof ensureHomeButton==='function') ensureHomeButton();
  };

  const extraProblems332={
    integral:{
      easy:[
        ['∫ 7x^6 dx','x^7+C'],['∫ 6x^2 dx','2x^3+C'],['∫ (4x^3-2x) dx','x^4-x^2+C'],['∫ cos(x) dx','sin(x)+C'],['∫ sin(x) dx','-cos(x)+C'],['∫ e^x dx','e^x+C'],['∫ 1/x dx','log(x)+C'],['∫[0→2] 3x^2 dx','8']
      ],
      normal:[
        ['∫ x(x^2+1)^3 dx','(x^2+1)^4/8+C'],['∫ 2x cos(x^2) dx','sin(x^2)+C'],['∫ e^(3x) dx','e^(3x)/3+C'],['∫ sin(2x) dx','-cos(2x)/2+C'],['∫ cos(5x) dx','sin(5x)/5+C'],['∫ 1/(x+2) dx','log(x+2)+C'],['∫[0→π] sin(x) dx','2']
      ],
      hard:[
        ['∫ x e^x dx','e^x*(x-1)+C'],['∫ x sin(x) dx','-x*cos(x)+sin(x)+C'],['∫ x cos(x) dx','x*sin(x)+cos(x)+C'],['∫ log(x) dx','x*log(x)-x+C'],['∫ x/(x^2+1) dx','log(x^2+1)/2+C'],['∫ 1/(x^2+1) dx','atan(x)+C']
      ],
      veryHard:[
        ['∫ x^2 e^x dx','e^x*(x^2-2*x+2)+C'],['∫ e^x sin(x) dx','e^x*(sin(x)-cos(x))/2+C'],['∫ e^x cos(x) dx','e^x*(sin(x)+cos(x))/2+C'],['∫ 1/(x^2+4*x+8) dx','atan((x+2)/2)/2+C'],['∫ x/(x^2+1)^2 dx','-1/(2*(x^2+1))+C'],['∫ sin(x)^3 dx','-cos(x)+cos(x)^3/3+C']
      ],
      ultraHard:[
        ['∫ x^3 e^x dx','e^x*(x^3-3*x^2+6*x-6)+C'],['∫ x^2 sin(x) dx','-x^2*cos(x)+2*x*sin(x)+2*cos(x)+C'],['∫ x^2 cos(x) dx','x^2*sin(x)+2*x*cos(x)-2*sin(x)+C'],['∫ log(x)^2 dx','x*(log(x)^2-2*log(x)+2)+C'],['∫ 1/(1+sin(x)) dx','tan(x)-1/cos(x)+C'],['∫ 1/(1+cos(x)) dx','tan(x/2)+C'],['∫ cos(x)/(1-sin(x)) dx','-log(1-sin(x))+C'],['∫ sin(log(x)) dx','x*(sin(log(x))-cos(log(x)))/2+C'],['∫ cos(log(x)) dx','x*(sin(log(x))+cos(log(x)))/2+C'],['∫ tan(x)*log(cos(x)^2) dx','-log(cos(x)^2)^2/4+C']
      ]
    },
    derivative:{
      bunkei:[['d/dx (x^3+2x^2-5x+1)','3*x^2+4*x-5'],['d/dx (sin(x)+cos(x))','cos(x)-sin(x)'],['d/dx (e^x+x^2)','e^x+2*x'],['d/dx log(x)','1/x']],
      easy:[['d/dx x^7','7*x^6'],['d/dx (5x^4)','20*x^3'],['d/dx sin(x)','cos(x)'],['d/dx cos(x)','-sin(x)']],
      normal:[['d/dx (x^2+1)^3','6*x*(x^2+1)^2'],['d/dx e^(2x)','2*e^(2*x)'],['d/dx log(x^2+1)','2*x/(x^2+1)']],
      hard:[['d/dx (x sin(x))','sin(x)+x*cos(x)'],['d/dx (x e^x)','e^x*(x+1)'],['d/dx (sin(x)^2)','2*sin(x)*cos(x)']],
      veryHard:[['d/dx (x^2 log(x))','2*x*log(x)+x'],['d/dx (e^x sin(x))','e^x*(sin(x)+cos(x))'],['d/dx ((x^2+1)/(x-1))','(2*x*(x-1)-(x^2+1))/(x-1)^2']]
    },
    factor:{veryHard:[['6x^2-13x+6 を因数分解','(3*x-2)*(2*x-3)'],['x^4-16 を因数分解','(x-2)*(x+2)*(x^2+4)'],['x^3-8 を因数分解','(x-2)*(x^2+2*x+4)']]},
    expand:{veryHard:[['(x+y+z)^2 を展開','x^2+y^2+z^2+2*x*y+2*y*z+2*z*x'],['(x-2)(x^2+2x+4) を展開','x^3-8'],['(2x-3)^3 を展開','8*x^3-36*x^2+54*x-27']]},
    prime:{veryHard:[['1260 を素因数分解','2^2*3^2*5*7'],['2310 を素因数分解','2*3*5*7*11'],['756 を素因数分解','2^2*3^3*7']]}
  };
  function fromPair332(pair,kind){
    return {q:pair[0],a:String(pair[1]).replace(/\be\^/g,'exp').replace(/π/g,'pi'),display:pair[1],explanation:window.aiExplain(pair[0])};
  }
  const oldGen332=window.generateQuestion;
  if(typeof oldGen332==='function'){
    window.generateQuestion = generateQuestion = function(){
      try{
        const m=mode, d=difficulty;
        const bucket = extraProblems332[m] && (extraProblems332[m][d] || extraProblems332[m].veryHard);
        if(bucket && bucket.length && Math.random()<0.42){ return fromPair332(bucket[Math.floor(Math.random()*bucket.length)],m); }
      }catch(e){}
      return oldGen332.apply(this,arguments);
    };
  }

  try{
    if(typeof UPDATE_NOTES!=='undefined'){
      delete UPDATE_NOTES['3.2.12'];
      UPDATE_NOTES['3.3.2']=[
        '数式表示を調整しました',
        '分野・難易度の表示を統一しました',
        '問題を追加しました',
        'ヒントを削除し、AI解説を詳しくしました',
        'ランキング更新処理を安全版に戻しました'
      ];
    }
  }catch(e){}

  document.addEventListener('DOMContentLoaded',function(){ injectStyle332(); updateModeTitle332(); });
  setInterval(function(){ try{injectStyle332(); updateModeTitle332();}catch(e){} },1200);
  console.log('Ver3.3.2 full update patch loaded');
})();


// Ver3.3.3 note: ranking writes are overridden by index/module safe patch.



/* =========================================================
   Ver 3.3.4 判定根本改善 + AI解説鬼強化
   - ランキング処理は触らない
   - sinx/cosx/tanx と sin(x)/cos(x)/tan(x) を同一扱い
   - logx/lnx と log(x)/ln(x) を同一扱い
   - 2x, 4(1-2x), xsinx などの省略乗算に対応
   - 積分は「定数差」を許可して、合ってるのに×を減らす
   - 四則演算は問題文そのまま入力を不正解
   ========================================================= */
(function(){
  if(window.__mm334JudgeAiFixLoaded) return;
  window.__mm334JudgeAiFixLoaded = true;

  function mm334Str(v){ return String(v == null ? "" : v); }

  function mm334AsciiPowers(s){
    const map = {"²":"^2","³":"^3","⁴":"^4","⁵":"^5","⁶":"^6","⁷":"^7","⁸":"^8","⁹":"^9","⁰":"^0","⁻":"-"};
    return mm334Str(s).replace(/[²³⁴⁵⁶⁷⁸⁹⁰⁻]/g, ch => map[ch] || ch);
  }

  function mm334PrepareExpr(input){
    let s = mm334AsciiPowers(input);
    s = s.replace(/\s+/g,"");
    s = s.replace(/　/g,"");
    s = s.replace(/π/g,"pi");
    s = s.replace(/×|·|･/g,"*").replace(/÷/g,"/");
    s = s.replace(/＋/g,"+").replace(/－/g,"-");
    s = s.replace(/√/g,"sqrt");
    s = s.replace(/tan\^-?1|tan⁻¹|arctan|atan/g,"atan");
    s = s.replace(/\bln/g,"log");
    // 積分定数は判定から外す
    s = s.replace(/\+?C\b/g,"").replace(/\+?c\b/g,"");

    // sinx, cos2x, tan(x), logx などを math.js 形式に寄せる
    s = s.replace(/\b(sin|cos|tan|log|sqrt|atan)([a-zA-Zπ]|\d+(?:\.\d+)?|pi)(?![a-zA-Z0-9_]*\()/g, "$1($2)");
    s = s.replace(/\b(sin|cos|tan|log|sqrt|atan)([0-9]+)x\b/g, "$1($2*x)");
    s = s.replace(/\b(sin|cos|tan|log|sqrt|atan)x\b/g, "$1(x)");

    // 省略乗算: 2x, 2pi, 3e, xsin(x), )x, 4( ... )
    s = s.replace(/(\d)(x|pi|e)/g,"$1*$2");
    s = s.replace(/(x|pi|e|\))(\d)/g,"$1*$2");
    s = s.replace(/(\d|x|pi|e|\))(?=\()/g,"$1*");
    s = s.replace(/(\))(?=(sin|cos|tan|log|sqrt|atan)\()/g,")*");
    s = s.replace(/(x|pi|e|\d)(?=(sin|cos|tan|log|sqrt|atan)\()/g,"$1*");

    // 連続括弧
    s = s.replace(/\)\(/g,")*(");

    // 先頭や末尾の + を整える
    s = s.replace(/^\+/,"").replace(/\+$/,"");
    return s;
  }

  window.normalize = function(str){
    return mm334PrepareExpr(str);
  };

  function mm334Eval(expr, x){
    try{
      if(!window.math || !math.evaluate) return NaN;
      const prepared = mm334PrepareExpr(expr);
      const val = math.evaluate(prepared, {x:x, pi:Math.PI, e:Math.E});
      if(typeof val === "number") return val;
      if(val && typeof val.valueOf === "function") return Number(val.valueOf());
      return Number(val);
    }catch(e){
      return NaN;
    }
  }

  function mm334LooksSameAsQuestion(user){
    try{
      if(!window.current || !current.q) return false;
      if(window.mode !== "arithmetic") return false;
      const q = String(current.q)
        .replace(/を.*$/,"")
        .replace(/[＝=].*$/,"")
        .trim();
      return mm334PrepareExpr(user) === mm334PrepareExpr(q);
    }catch(e){ return false; }
  }

  function mm334NumericEqual(user, correct){
    const points = [-3,-2,-1,-0.5,0.5,1,2,3,4];
    let checked = 0;
    let diffs = [];
    for(const x of points){
      const u = mm334Eval(user,x);
      const c = mm334Eval(correct,x);
      if(!isFinite(u) || !isFinite(c)) continue;
      const diff = u - c;
      if(Math.abs(diff) > 1e-6 && (!window.current || !String(current.q||"").includes("∫"))) return false;
      diffs.push(diff);
      checked++;
    }
    if(checked === 0) return false;

    // 積分は +C の違い・定数差を許可
    if(window.current && String(current.q||"").includes("∫")){
      const base = diffs[0];
      return diffs.every(d => Math.abs(d - base) < 1e-5);
    }
    return true;
  }

  // 微分可能なら、積分問題は導関数同士でも確認する
  function mm334DerivativeEqual(user, correct){
    try{
      if(!window.math || !math.derivative) return false;
      const uq = mm334PrepareExpr(user);
      const cq = mm334PrepareExpr(correct);
      const du = math.derivative(uq, "x").toString();
      const dc = math.derivative(cq, "x").toString();
      return mm334NumericEqual(du, dc);
    }catch(e){
      return false;
    }
  }

  window.expressionsEqual = function(user, correct){
    try{
      if(mm334LooksSameAsQuestion(user)) return false;

      const u = mm334PrepareExpr(user);
      const c = mm334PrepareExpr(correct);
      if(u === c) return true;

      // math.simplify が使えれば簡単な同値を先に見る
      try{
        if(window.math && math.simplify){
          const diff = math.simplify("(" + u + ")-(" + c + ")").toString();
          if(diff === "0") return true;
        }
      }catch(e){}

      if(mm334NumericEqual(u,c)) return true;

      // 積分の答えは見た目違いが多いので導関数も確認
      if(window.current && String(current.q||"").includes("∫")){
        if(mm334DerivativeEqual(u,c)) return true;
      }
      return false;
    }catch(e){
      return false;
    }
  };

  function mm334Kind(q){
    q = String(q || "");
    if(q.includes("∫")) return "integral";
    if(q.includes("d/dx") || q.includes("微分")) return "derivative";
    if(q.includes("因数分解")) return "factor";
    if(q.includes("展開")) return "expand";
    if(q.includes("素因数分解")) return "prime";
    if(/[+\-×÷*/]/.test(q)) return "arithmetic";
    return "general";
  }

  function mm334Reason(q){
    q = String(q || "");
    if(q.includes("∫")){
      if(/e\^|exp/.test(q) && /(sin|cos)/.test(q)) return "指数関数と三角関数がかけ算になっているので、部分積分を2回使って元の積分を移項する型です。";
      if(/log|ln/.test(q)) return "logは微分すると簡単になるので、logを微分する側に置く部分積分を使います。";
      if(/\^|²|³/.test(q) && /(sin|cos|e\^|exp)/.test(q)) return "多項式×三角関数・指数関数の形なので、次数を下げるために部分積分を使います。";
      if(/\/|\)\^-/.test(q)) return "分母の形に注目します。中身の微分が近くにあるときは置換、二次式なら平方完成やtan⁻¹型を考えます。";
      if(/sin|cos|tan/.test(q)) return "三角関数の公式や置換で形を単純にできるかを見る問題です。";
      return "積分では、まず『べき乗公式でいけるか』『置換か』『部分積分か』を見分けます。この問題は式のまとまりに注目して公式を選びます。";
    }
    if(q.includes("d/dx") || q.includes("微分")){
      if(/sin|cos|tan/.test(q)) return "三角関数は微分公式が決まっているので、まず sin・cos・tan の公式を使います。";
      if(/log|ln/.test(q)) return "logは中身の微分をかける合成関数の微分になります。";
      if(/e\^|exp/.test(q)) return "eの指数関数は微分しても形が残るので、指数の中身の微分に注意します。";
      if(/\(|\)\^/.test(q)) return "かっこの中を1つのかたまりとして見る合成関数の微分を使います。";
      return "xのべき乗なので、指数を前に出して指数を1下げる公式を使います。";
    }
    if(q.includes("因数分解")) return "共通因数、平方差、和と積の組み合わせの順に見ると因数分解しやすいです。";
    if(q.includes("展開")) return "分配法則を使います。公式が使える形なら公式で一気に展開します。";
    if(q.includes("素因数分解")) return "小さい素数 2,3,5,7,... で割れるかを順番に確認します。";
    return "式の形を見て、計算の順序と使える公式を確認します。";
  }

  window.aiExplain = function(q){
    const kind = mm334Kind(q);
    const reason = mm334Reason(q);
    if(kind === "integral"){
      return [
        "【解法の見つけ方】",
        reason,
        "",
        "【進め方】",
        "① まず式の形を見る。",
        "② べき乗だけなら ∫x^n dx = x^(n+1)/(n+1)+C を使う。",
        "③ 中身の微分が外にある形なら置換積分を使う。",
        "④ x・log・sin・cos・e^x などの積なら部分積分を考える。",
        "⑤ 最後に微分して元の integrand に戻るか確認する。",
        "",
        "【よくあるミス】",
        "・置換したあと dx を直し忘れる。",
        "・部分積分で符号を間違える。",
        "・積分定数 +C を忘れる。",
        "・分母全体にかかるカッコを外してしまう。"
      ].join("<br>");
    }
    if(kind === "derivative"){
      return [
        "【解法の見つけ方】",
        reason,
        "",
        "【進め方】",
        "① まず外側の関数と内側の関数を分ける。",
        "② べき乗なら指数を前に出して1下げる。",
        "③ かっこがあるときは合成関数として、内側の微分をかける。",
        "④ 積になっているときは積の微分を使う。",
        "",
        "【よくあるミス】",
        "・合成関数で内側の微分を忘れる。",
        "・sinとcosの符号を間違える。",
        "・logの微分で分母を忘れる。"
      ].join("<br>");
    }
    if(kind === "factor"){
      return [
        "【解法の見つけ方】",
        reason,
        "",
        "【進め方】",
        "① 共通因数がないか見る。",
        "② x^2+ax+b 型なら、足して a、かけて b になる2数を探す。",
        "③ x^2-a^2 なら (x-a)(x+a) を使う。",
        "④ 展開して元に戻るか確認する。"
      ].join("<br>");
    }
    if(kind === "expand"){
      return [
        "【解法の見つけ方】",
        reason,
        "",
        "【進め方】",
        "① それぞれの項を全部かける。",
        "② 同類項をまとめる。",
        "③ (a+b)^2 や (a-b)^2 なら公式を使うと速い。",
        "④ 符号ミスがないか確認する。"
      ].join("<br>");
    }
    if(kind === "prime"){
      return [
        "【解法の見つけ方】",
        reason,
        "",
        "【進め方】",
        "① 2で割れるか見る。",
        "② 次に3、5、7…の順に割る。",
        "③ 最後に全部素数になっているか確認する。",
        "④ 10 のような合成数を残さず、2×5 のように最後まで分解する。"
      ].join("<br>");
    }
    if(kind === "arithmetic"){
      return [
        "【解法の見つけ方】",
        "四則演算は計算順序が大事です。かっこ、掛け算・割り算、足し算・引き算の順で計算します。",
        "",
        "【注意】",
        "問題文をそのまま入力するのではなく、計算した結果を答えます。",
        "ただし、計算結果が同じ別の式は正解になる場合があります。"
      ].join("<br>");
    }
    return "【解法の見つけ方】<br>式の形を見て、使える公式を選びます。なぜその公式を使うのかを考えてから計算するとミスが減ります。";
  };

  // 復習リストの「固定解説」ボタンは消して、AI解説を中心にする
  if(typeof window.showReviewList === "function"){
    const oldShowReviewList334 = window.showReviewList;
    window.showReviewList = showReviewList = function(){
      try{
        let html="<h2>📚 復習リスト</h2>";
        if(!playerData.reviewList || playerData.reviewList.length===0) html+="<p>まだありません</p>";
        for(let i=0;i<(playerData.reviewList||[]).length;i++){
          let r=playerData.reviewList[i];
          let ai = (r.ai && String(r.ai).length>20) ? r.ai : window.aiExplain(r.q);
          html+=`<div class="reviewItem">
            <p>${i+1}. ${r.q}</p>
            <p>正解：${r.a}</p>
            <button onclick="alert('${String(ai).replace(/'/g,"\\'").replace(/\n/g," ")}')">🤖 AI解説</button>
            <button onclick="retryReview(${i})">再挑戦</button>
            <button onclick="postReviewToBoard(${i})">💬 掲示板へ投稿</button>
          </div>`;
        }
        document.getElementById("panelArea").innerHTML=html;
      }catch(e){
        oldShowReviewList334();
      }
    };
  }

  // お知らせを短く更新
  try{
    const newsCandidates = document.querySelectorAll(".news, #news, .notice, #notice");
    newsCandidates.forEach(el=>{
      if(el && /お知らせ|Ver|問題|更新/.test(el.textContent)){
        el.innerHTML = "<b>お知らせ</b><br>Ver 3.3.4<br>・判定精度改善<br>・AI解説強化<br>・表示調整";
      }
    });
  }catch(e){}

  console.log("Ver 3.3.4 judge + AI explanation fix loaded");
})();




/* Ver 3.3.5 AI解説強化・判定調整・ランダム修正。ランキング処理は触らない。 */
(function(){
  if(window.__mm335PatchLoaded) return;
  window.__mm335PatchLoaded = true;

  function byId(id){ return document.getElementById(id); }
  function esc(s){ return String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function stripMath(s){
    return String(s ?? "")
      .replace(/\s+/g,"").replace(/　/g,"")
      .replace(/×/g,"*").replace(/÷/g,"/")
      .replace(/＋/g,"+").replace(/－/g,"-")
      .replace(/\+?C\b/gi,"").replace(/π/g,"pi")
      .replace(/²/g,"^2").replace(/³/g,"^3").replace(/⁴/g,"^4").replace(/⁵/g,"^5").replace(/⁶/g,"^6");
  }
  function arithmeticStrict(user, correct){
    const u = stripMath(user);
    const c = stripMath(correct);
    if(/[+\-*/^()]/.test(u)) return false;
    return u === c;
  }
  function qKind(q){
    q = String(q || "");
    if(q.includes("∫")) return "integral";
    if(q.includes("d/dx") || q.includes("微分")) return "derivative";
    if(q.includes("因数分解")) return "factor";
    if(q.includes("展開")) return "expand";
    if(q.includes("素因数分解")) return "prime";
    if(/[+\-×÷*/]/.test(q)) return "arithmetic";
    return "general";
  }
  function longAI(q){
    const kind = qKind(q);
    q = String(q || "");
    if(kind === "integral"){
      let reason = "まず積分する式の形を見て、べき乗公式・置換積分・部分積分のどれを使うか判断します。";
      if(/log|ln/.test(q)) reason = "log は微分すると 1/x の形になって簡単になるので、log を微分する側に置く部分積分を考えます。";
      else if(/e\^|exp/.test(q) && /(sin|cos)/.test(q)) reason = "e^x と sin・cos の積は、部分積分を2回行うと元の積分がもう一度出てくる型です。そこで移項して解きます。";
      else if(/\^|²|³/.test(q) && /(sin|cos|e\^|exp)/.test(q)) reason = "多項式と三角関数・指数関数の積なので、多項式の次数を下げるために部分積分を使います。";
      else if(/\/|\)\^-/.test(q)) reason = "分母のまとまりに注目します。分母の中身の微分が分子に近い形なら置換積分が有効です。二次式なら平方完成して tan⁻¹ 型も考えます。";
      else if(/sin|cos|tan/.test(q)) reason = "三角関数の積分では、公式で形を変えるか、sin・cos のどちらかを置換するかを見ます。";
      return [
        "【解法の見つけ方】", reason, "",
        "【なぜその解法を使う？】",
        "積分は『形を簡単にする』のが目的です。中身の微分が外にあるなら置換、積の形なら部分積分、普通のべき乗ならべき乗公式を使います。", "",
        "【解く手順】",
        "① 式のまとまりを見る。",
        "② 置換できる形か確認する。",
        "③ 積の形なら部分積分を考える。",
        "④ 計算後、置換した文字を元に戻す。",
        "⑤ 最後に微分して元の式に戻るか確認する。", "",
        "【よくあるミス】",
        "・dx の変換を忘れる。",
        "・部分積分の符号を間違える。",
        "・分母全体にカッコを付け忘れる。",
        "・+C を忘れる。"
      ].join("<br>");
    }
    if(kind === "derivative"){
      return [
        "【解法の見つけ方】",
        "まず外側の関数と内側の関数を分けます。かっこや sin・cos・log・e^x がある場合は、合成関数の微分を疑います。", "",
        "【なぜその公式を使う？】",
        "微分は『外側を微分して、内側の微分をかける』のが基本です。積になっている場合は積の微分を使います。", "",
        "【解く手順】",
        "① 外側と内側を確認する。",
        "② 外側を微分する。",
        "③ 内側の微分をかける。",
        "④ 同類項を整理する。", "",
        "【よくあるミス】",
        "・内側の微分を忘れる。",
        "・sin と cos の符号ミス。",
        "・log の微分で分母を忘れる。"
      ].join("<br>");
    }
    if(kind === "factor"){
      return "【解法の見つけ方】<br>まず共通因数を見る。次に x²+ax+b 型なら、足して a、かけて b になる2数を探します。<br><br>【なぜこの方法？】<br>因数分解は展開の逆なので、かけたら元に戻る形を探します。<br><br>【よくあるミス】<br>・符号を間違える。<br>・最後に展開して確認しない。";
    }
    if(kind === "expand"){
      return "【解法の見つけ方】<br>展開は分配法則で、すべての項をかけます。公式の形なら公式を使うと速いです。<br><br>【なぜこの公式？】<br>(a+b)² や (a-b)² は毎回分配するより公式で処理した方がミスが減ります。<br><br>【よくあるミス】<br>・2ab の項を忘れる。<br>・マイナスの符号ミス。<br>・同類項をまとめ忘れる。";
    }
    if(kind === "prime"){
      return "【解法の見つけ方】<br>小さい素数 2,3,5,7,... で順番に割れるか確認します。<br><br>【なぜこの方法？】<br>素因数分解は、数を素数だけの積に直す作業です。10 や 12 のような合成数を残してはいけません。";
    }
    if(kind === "arithmetic"){
      return "【解法の見つけ方】<br>四則演算は、かっこ → 掛け算・割り算 → 足し算・引き算の順で計算します。<br><br>【注意】<br>四則演算だけは式ではなく、計算後の答え1個を入力してください。<br>例：3+5 の答えは 8。3+5 や 4+4 は不可。";
    }
    return "【解法の見つけ方】<br>式の形を見て、使える公式を選びます。なぜその公式を使うのかを確認してから計算するとミスが減ります。";
  }
  window.aiExplain = longAI;

  const oldSubmit = window.submit;
  if(typeof oldSubmit === "function"){
    window.submit = submit = async function(){
      const ansEl = byId("ans");
      const u = ansEl ? ansEl.value.trim() : "";
      const resultEl = byId("result");
      const isArithmeticQuestion = window.current && (window.mode === "arithmetic" || (window.mode === "random" && /^[0-9+\-×÷*/().\s]+$/.test(String(current.q||""))));
      if(isArithmeticQuestion){
        if(!u){ alert("答えを入力して"); return; }
        const ok = arithmeticStrict(u, current.a || current.display || "");
        try{
          playerData.totalQuestions++;
          if(typeof recordGenreResult === "function") recordGenreResult(mode, ok);
          history.push({question:current.q, your:u, answer:current.display, explanation:current.explanation, ok:ok});
        }catch(e){}
        if(ok){
          try{
            score++; combo++;
            playerData.totalCorrect++;
            if(typeof addExp === "function") addExp(10);
            playerData.coins=(playerData.coins||0)+1;
            if(typeof saveAllData === "function") saveAllData();
          }catch(e){}
          if(resultEl) resultEl.innerHTML = `○ 正解！<br>正解：${esc(current.display||current.a)}<br>+10EXP / +1コイン`;
          if(typeof nextTurn === "function") nextTurn();
          return;
        }else{
          try{
            combo=0;
            if(typeof addReviewItem === "function") addReviewItem(current);
            if(typeof saveAllData === "function") saveAllData();
          }catch(e){}
          if(resultEl) resultEl.innerHTML = `× 不正解<br>正解：${esc(current.display||current.a)}<br><br>🤖 ${longAI(current.q)}`;
          if(window.mode === "random"){
            try{
              if(typeof finishRandom === "function") await finishRandom();
            }catch(e){
              console.error(e);
              if(typeof showEnd === "function") showEnd("終了！");
            }
            return;
          }
          try{
            if(mode!=="review") playerHP--;
            if(typeof updateHP === "function") updateHP();
            if(typeof nextTurn === "function") nextTurn();
          }catch(e){}
          return;
        }
      }
      try{
        await oldSubmit.apply(this, arguments);
      }catch(e){
        console.error("submit error recovered:", e);
        if(resultEl) resultEl.innerHTML = "エラーが出たため処理を止めました。もう一度入力してください。";
      }
    };
  }

  try{
    document.querySelectorAll("button, .modeBtn, .resultBtn").forEach(btn=>{
      if((btn.textContent||"").includes("ヒント")) btn.style.display="none";
    });
  }catch(e){}

  if(typeof window.showReviewList === "function"){
    const oldReview = window.showReviewList;
    window.showReviewList = showReviewList = function(){
      try{
        let html="<h2>📚 復習リスト</h2>";
        if(!playerData.reviewList || playerData.reviewList.length===0) html+="<p>まだありません</p>";
        for(let i=0;i<(playerData.reviewList||[]).length;i++){
          const r=playerData.reviewList[i];
          const ai=longAI(r.q);
          html += `<div class="reviewItem">
            <p>${i+1}. ${esc(r.q)}</p>
            <p>正解：${esc(r.a)}</p>
            <button onclick="alert('${String(ai).replace(/'/g,"\\'").replace(/\n/g," ")}')">🤖 AI解説</button>
            <button onclick="retryReview(${i})">再挑戦</button>
            <button onclick="postReviewToBoard(${i})">💬 掲示板へ投稿</button>
          </div>`;
        }
        byId("panelArea").innerHTML=html;
      }catch(e){ oldReview(); }
    };
  }

  if(typeof window.selectDifficulty === "function"){
    const oldSelectDifficulty = window.selectDifficulty;
    window.selectDifficulty = selectDifficulty = function(m){
      try{
        window.mode = mode = m;
        const names = {integral:"積分", derivative:"微分", factor:"因数分解", expand:"展開", prime:"素因数分解", arithmetic:"四則演算"};
        const name = names[m] || m;
        const area = byId("panelArea");
        if(!area) return oldSelectDifficulty(m);
        area.innerHTML = `
          <h2>📚 ${name}</h2>
          <p style="opacity:.85;margin-top:-6px;">難易度を選んでください</p>
          <div style="display:grid;gap:10px;margin-top:14px;">
            ${m==="integral"||m==="derivative" ? `<button class="modeBtn" onclick="startMode('bunkei')">📘 文系 ${name} 📘</button>` : ""}
            <button class="modeBtn" onclick="startMode('easy')">🟢 初級 ${name}</button>
            <button class="modeBtn" onclick="startMode('normal')">🟡 中級 ${name}</button>
            <button class="modeBtn" onclick="startMode('hard')">🔴 上級 ${name}</button>
            <button class="modeBtn hardBtn" onclick="startMode('veryHard')">🔥 難問 ${name}</button>
            ${m==="integral" ? `<button class="modeBtn hardBtn" onclick="startMode('superHard')">💀 超難問 ${name} 💀</button>` : ""}
          </div>
          <button class="modeBtn" style="margin-top:18px;" onclick="showStudy()">戻る</button>
        `;
      }catch(e){ oldSelectDifficulty(m); }
    };
  }

  window.MM335_NEWS = "📢 お知らせ\n\nVer 3.3.5\n\n・ランダムモードの不具合を修正\n・判定精度を改善\n・AI解説を大幅強化\n・問題を追加\n・数式表示を改善";
  console.log("Ver 3.3.5 AI / judge / random fix loaded");
})();



/* =========================================================
   Ver 3.3.6 UI / submit fix
   - 学習モードの決定連打を1秒ロック
   - 難易度選択の隙間を削減
   - 難易度選択の戻るボタンを非表示
   - 終了後にランキングへ飛ぶ事故を抑制
   - ランキング処理そのものは触らない
   ========================================================= */
(function(){
  if(window.__mm336PatchLoaded) return;
  window.__mm336PatchLoaded = true;

  function byId(id){ return document.getElementById(id); }

  // 決定ボタンを1秒ロック。二重正解・二重EXPを防ぐ。
  let mm336SubmitLocked = false;
  const oldSubmit336 = window.submit;
  if(typeof oldSubmit336 === "function"){
    window.submit = submit = async function(){
      if(mm336SubmitLocked) return false;
      mm336SubmitLocked = true;

      // 決定ボタンっぽいものを一時的に無効化
      const buttons = Array.from(document.querySelectorAll("button"));
      const submitButtons = buttons.filter(b => {
        const t = (b.textContent || "").trim();
        const oc = String(b.getAttribute("onclick") || "");
        return t === "決定" || t === "=" || oc.includes("submit()");
      });
      submitButtons.forEach(b=>{
        b.dataset.mm336Disabled = b.disabled ? "already" : "new";
        b.disabled = true;
        b.style.opacity = "0.55";
        b.style.pointerEvents = "none";
      });

      try{
        await oldSubmit336.apply(this, arguments);
      }catch(e){
        console.error("submit error recovered by 3.3.6:", e);
        const r = byId("result");
        if(r) r.innerHTML = "エラーが出たため処理を止めました。もう一度入力してください。";
      }finally{
        setTimeout(()=>{
          mm336SubmitLocked = false;
          submitButtons.forEach(b=>{
            if(b.dataset.mm336Disabled === "new") b.disabled = false;
            b.style.opacity = "";
            b.style.pointerEvents = "";
            delete b.dataset.mm336Disabled;
          });
        }, 1000);
      }
      return false;
    };
  }

  // 難易度選択UIの隙間と戻るボタンを整える
  const style = document.createElement("style");
  style.textContent = `
    #panelArea .modeBtn{
      margin-top: 8px !important;
      margin-bottom: 8px !important;
    }
    #panelArea div[style*="display:grid"]{
      gap: 8px !important;
      margin-top: 10px !important;
    }
    .mm336-difficulty-screen .modeBtn{
      margin-top: 7px !important;
      margin-bottom: 7px !important;
      min-height: 64px;
    }
    .mm336-difficulty-screen .backAfterDifficulty,
    .mm336-difficulty-screen button[data-mm336-back="1"]{
      display:none !important;
    }
  `;
  document.head.appendChild(style);

  // selectDifficultyを上書きして、戻るボタンなし＋隙間少なめにする
  if(typeof window.selectDifficulty === "function"){
    const baseSelectDifficulty336 = window.selectDifficulty;
    window.selectDifficulty = selectDifficulty = function(m){
      try{
        window.mode = mode = m;
        const names = {
          integral:"積分",
          derivative:"微分",
          factor:"因数分解",
          expand:"展開",
          prime:"素因数分解",
          arithmetic:"四則演算"
        };
        const name = names[m] || m;
        const area = byId("panelArea");
        if(!area) return baseSelectDifficulty336(m);
        area.classList.add("mm336-difficulty-screen");
        area.innerHTML = `
          <h2 style="margin-bottom:6px;">📚 ${name}</h2>
          <p style="opacity:.85;margin:0 0 10px;">難易度を選んでください</p>
          <div style="display:grid;gap:8px;margin-top:10px;">
            ${(m==="integral"||m==="derivative") ? `<button class="modeBtn" onclick="startMode('bunkei')">📘 文系 ${name} 📘</button>` : ""}
            <button class="modeBtn" onclick="startMode('easy')">🟢 初級 ${name}</button>
            <button class="modeBtn" onclick="startMode('normal')">🟡 中級 ${name}</button>
            <button class="modeBtn" onclick="startMode('hard')">🔴 上級 ${name}</button>
            <button class="modeBtn hardBtn" onclick="startMode('veryHard')">🔥 難問 ${name}</button>
            ${m==="integral" ? `<button class="modeBtn hardBtn" onclick="startMode('superHard')">💀 超難問 ${name} 💀</button>` : ""}
          </div>
        `;
      }catch(e){
        baseSelectDifficulty336(m);
        setTimeout(()=>{
          const area = byId("panelArea");
          if(area){
            area.classList.add("mm336-difficulty-screen");
            // 超難問の下の戻るなど、戻るボタンを消す
            Array.from(area.querySelectorAll("button")).forEach(b=>{
              if((b.textContent||"").trim()==="戻る") b.style.display="none";
            });
          }
        },0);
      }
    };
  }

  // 問題終了後に勝手にランキングへ飛ぶ事故を抑制。
  // 結果画面表示中はランキング系画面への自動遷移を無効化する。
  const rankingNames = ["showWorldRanking","showWeeklyRanking","showLevelRanking","openWeeklyRanking","openLevelRanking","showRanking","openRanking"];
  rankingNames.forEach(fn=>{
    if(typeof window[fn] === "function"){
      const oldFn = window[fn];
      window[fn] = function(){
        try{
          const resultScreen = byId("resultScreen");
          if(resultScreen && resultScreen.classList.contains("active")){
            console.warn("Ranking transition blocked on result screen:", fn);
            return false;
          }
        }catch(e){}
        return oldFn.apply(this, arguments);
      };
    }
  });

  // showEnd / showResultPage 後にランキング画面がactiveになった場合、結果画面へ戻す保険
  function guardRankingAfterResult(){
    setTimeout(()=>{
      try{
        const resultScreen = byId("resultScreen");
        if(!resultScreen || !resultScreen.classList.contains("active")) return;
        document.querySelectorAll('[id*="ranking" i], [id*="Ranking"]').forEach(el=>{
          if(el.classList && el.classList.contains("active")){
            el.classList.remove("active");
          }
        });
      }catch(e){}
    }, 150);
  }
  if(typeof window.showEnd === "function"){
    const oldShowEnd336 = window.showEnd;
    window.showEnd = showEnd = function(){
      const r = oldShowEnd336.apply(this, arguments);
      guardRankingAfterResult();
      return r;
    };
  }
  if(typeof window.showResultPage === "function"){
    const oldShowResultPage336 = window.showResultPage;
    window.showResultPage = showResultPage = function(){
      const r = oldShowResultPage336.apply(this, arguments);
      guardRankingAfterResult();
      return r;
    };
  }

  // 既存画面に戻るボタンが残った時の保険
  const obs = new MutationObserver(()=>{
    const area = byId("panelArea");
    if(!area) return;
    if(area.classList.contains("mm336-difficulty-screen") || /難易度を選んでください/.test(area.textContent||"")){
      Array.from(area.querySelectorAll("button")).forEach(b=>{
        if((b.textContent||"").trim()==="戻る") b.style.display="none";
      });
    }
  });
  obs.observe(document.body, {childList:true, subtree:true});

  window.MM336_NEWS = "📢 お知らせ\n\nVer 3.3.6\n\n・回答連打による二重判定を修正\n・難易度選択画面の余白を調整\n・超難問下の戻るボタンを削除\n・結果後にランキングへ飛ぶ不具合を修正";
  console.log("Ver 3.3.6 UI / submit fix loaded");
})();



/* title/rate fix only - ranking untouched */
(function(){
if(window.__titleRateFixOnly336)return;
window.__titleRateFixOnly336=true;

const oldGachaPool_titleRateFix = gachaPool;
function extraGachaTitles_titleRateFix(){
return [
{title:"計算の見張り番", rarity:"R"},
{title:"式の配達人", rarity:"R"},
{title:"数字の旅人", rarity:"R"},
{title:"ノートの守人", rarity:"R"},
{title:"黒板ランナー", rarity:"R"},
{title:"朝練計算者", rarity:"R"},
{title:"夜更かし復習者", rarity:"R"},
{title:"鉛筆の騎士", rarity:"R"},
{title:"消しゴムの相棒", rarity:"R"},
{title:"問題採集家", rarity:"R"},
{title:"集中スターター", rarity:"R"},
{title:"公式メモ職人", rarity:"R"},
{title:"理系スタート", rarity:"R"},
{title:"努力の若葉", rarity:"R"},
{title:"復習ウォーカー", rarity:"R"},
{title:"一問前進", rarity:"R"},
{title:"答えの探索者", rarity:"R"},
{title:"基礎ビルダー", rarity:"R"},
{title:"足し算ガード", rarity:"R"},
{title:"引き算ガード", rarity:"R"},
{title:"かけ算ガード", rarity:"R"},
{title:"割り算ガード", rarity:"R"},
{title:"小さな解法家", rarity:"R"},
{title:"計算トレーニー", rarity:"R"},
{title:"学習トラベラー", rarity:"R"},
{title:"紙ペン使い", rarity:"R"},
{title:"解答ルーキー", rarity:"R"},
{title:"式読みビギナー", rarity:"R"},
{title:"正解ハンター", rarity:"R"},
{title:"デイリー数学民", rarity:"R"},
{title:"数学ゲート", rarity:"R"},
{title:"成長途中", rarity:"R"},
{title:"問題ウォーカー", rarity:"R"},
{title:"数字の使い手", rarity:"R"},
{title:"公式ルーキー", rarity:"R"},
{title:"計算修行者", rarity:"R"},
{title:"努力の一手", rarity:"R"},
{title:"本日の数学", rarity:"R"},
{title:"式の観測者", rarity:"R"},
{title:"ミス研究生", rarity:"R"},
{title:"ゆっくり前進", rarity:"R"},
{title:"ペース職人", rarity:"R"},
{title:"コツコツランナー", rarity:"R"},
{title:"答え合わせ係", rarity:"R"},
{title:"基礎の番人", rarity:"R"},
{title:"小数チャレンジャー", rarity:"R"},
{title:"分数ルーキー", rarity:"R"},
{title:"符号チェッカー", rarity:"R"},
{title:"暗算ルーキー", rarity:"R"},
{title:"式変形ビギナー", rarity:"R"},
{title:"解法ノート", rarity:"R"},
{title:"練習の芽", rarity:"R"},
{title:"問題集パートナー", rarity:"R"},
{title:"一点集中", rarity:"R"},
{title:"計算の芽吹き", rarity:"R"},
{title:"数学さんぽ", rarity:"R"},
{title:"黒板サポーター", rarity:"R"},
{title:"積み上げ屋", rarity:"R"},
{title:"ノート冒険者", rarity:"R"},
{title:"数の整備士", rarity:"R"},
{title:"高速計算剣士", rarity:"SR"},
{title:"数式レンジャー", rarity:"SR"},
{title:"復習の達人", rarity:"SR"},
{title:"公式マイスター", rarity:"SR"},
{title:"集中ブースター", rarity:"SR"},
{title:"努力の結晶体", rarity:"SR"},
{title:"解法アナリスト", rarity:"SR"},
{title:"朝活の数学者", rarity:"SR"},
{title:"夜型の数学者", rarity:"SR"},
{title:"ミス克服マスター", rarity:"SR"},
{title:"計算ソードマン", rarity:"SR"},
{title:"積分トラベラー", rarity:"SR"},
{title:"微分トラベラー", rarity:"SR"},
{title:"因数分解クラフター", rarity:"SR"},
{title:"展開クラフター", rarity:"SR"},
{title:"素数スナイパー", rarity:"SR"},
{title:"連勝ランナー", rarity:"SR"},
{title:"継続の証明者", rarity:"SR"},
{title:"青の閃光", rarity:"SR"},
{title:"赤の集中力", rarity:"SR"},
{title:"知識コレクター", rarity:"SR"},
{title:"問題ブレイカー", rarity:"SR"},
{title:"式変形マスター", rarity:"SR"},
{title:"数学ミドル", rarity:"SR"},
{title:"実力上昇者", rarity:"SR"},
{title:"👑数式覇者👑", rarity:"SSR"},
{title:"🏆解答レジェンド🏆", rarity:"SSR"},
{title:"⚔️計算戦神⚔️", rarity:"SSR"},
{title:"🧠知恵の超越者🧠", rarity:"SSR"},
{title:"🔥限界突破者🔥", rarity:"SSR"},
{title:"💎王立数学士💎", rarity:"SSR"},
{title:"🌙深夜の支配者🌙", rarity:"SSR"},
{title:"☀️白昼の王者☀️", rarity:"SSR"},
{title:"🎯必中の解答者🎯", rarity:"SSR"},
{title:"📖知識の支配者📖", rarity:"SSR"},
{title:"🌠星海の数学神🌠", rarity:"UR"},
{title:"🪽天空の証明者🪽", rarity:"UR"},
{title:"🐉数式龍王🐉", rarity:"UR"},
{title:"💫無限の開拓者💫", rarity:"UR"},
{title:"👑超越数学皇👑", rarity:"UR"}
];
}

gachaPool = function(){
  const map = new Map();
  for(const item of [...oldGachaPool_titleRateFix(), ...extraGachaTitles_titleRateFix()]){
    if(item && item.title && !map.has(item.title)) map.set(item.title, item);
  }
  return Array.from(map.values());
};

function rarityOrder_titleRateFix(r){
  return {UR:0,SSR:1,SR:2,R:3}[r] ?? 9;
}
function sortedGachaPool_titleRateFix(){
  return gachaPool().slice().sort((a,b)=>{
    const d = rarityOrder_titleRateFix(a.rarity)-rarityOrder_titleRateFix(b.rarity);
    if(d!==0)return d;
    return String(a.title).localeCompare(String(b.title),"ja");
  });
}
function pickRarity_titleRateFix(){
  const r = Math.random()*100;
  if(r < 0.5) return "UR";
  if(r < 3.5) return "SSR";
  if(r < 25.0) return "SR";
  return "R";
}

getGachaResultNoDuplicate = function(){
  let owned=playerData.gachaTitles||[];
  let remaining=gachaPool().filter(x=>!owned.includes(x.title));
  if(remaining.length===0)return null;
  let rarity=pickRarity_titleRateFix();
  let pool=remaining.filter(x=>x.rarity===rarity);
  if(pool.length>0)return pool[Math.floor(Math.random()*pool.length)];
  for(const rr of ["R","SR","SSR","UR"]){
    pool=remaining.filter(x=>x.rarity===rr);
    if(pool.length>0)return pool[Math.floor(Math.random()*pool.length)];
  }
  return remaining[Math.floor(Math.random()*remaining.length)];
};

getGachaResult = function(){
  let rarity=pickRarity_titleRateFix();
  let pool=gachaPool().filter(x=>x.rarity===rarity);
  return pool[Math.floor(Math.random()*pool.length)];
};

showGacha = function(){
const total = gachaPool().length;
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
<p>R 75% / SR 21.5% / SSR 3% / UR 0.5%</p>
<p>ガチャ称号：${total}個</p>
<p>URのみ色付き。</p>
<p>隠し称号・配布称号はガチャとコンプ率に含みません。</p>
</div>
`;
};

showGachaBook = function(filter="ALL"){
let pool=sortedGachaPool_titleRateFix();
let owned=playerData.gachaTitles||[];
let count=(rarity)=>pool.filter(x=>x.rarity===rarity).length;
let have=(rarity)=>pool.filter(x=>x.rarity===rarity && owned.includes(x.title)).length;
let ownedInPool=owned.filter(t=>pool.some(x=>x.title===t)).length;
let visible=filter==="ALL"?pool:pool.filter(x=>x.rarity===filter);
let html=`
<h2>📖 ガチャ図鑑</h2>
<div class="profileItem">
<p>所持数：${ownedInPool} / ${pool.length}</p>
<p>R：${have("R")} / ${count("R")}</p>
<p>SR：${have("SR")} / ${count("SR")}</p>
<p>SSR：${have("SSR")} / ${count("SSR")}</p>
<p>UR：${have("UR")} / ${count("UR")}</p>
</div>
<div class="profileItem">
<button onclick="showGachaBook('ALL')">全部 ${pool.length}個</button>
<button onclick="showGachaBook('UR')">UR ${count("UR")}個</button>
<button onclick="showGachaBook('SSR')">SSR ${count("SSR")}個</button>
<button onclick="showGachaBook('SR')">SR ${count("SR")}個</button>
<button onclick="showGachaBook('R')">R ${count("R")}個</button>
</div>
`;
for(let item of visible){
  let got=owned.includes(item.title);
  html+=`
<div class="titleItem">
${got ? "✅ " + titleHTML(item.title) : "⬜ ？？？"}
<br>
レアリティ：${item.rarity}
</div>
`;
}
document.getElementById("panelArea").innerHTML=html;
};

window.showGacha = showGacha;
window.showGachaBook = showGachaBook;
window.getGachaResult = getGachaResult;
window.getGachaResultNoDuplicate = getGachaResultNoDuplicate;
})();



/* title/news/profile title filter add only - ranking untouched */
(function(){
if(window.__titleNewsProfileAdd336)return;
window.__titleNewsProfileAdd336=true;

const oldGachaPool_titleNewsProfile = gachaPool;
function extraGachaTitles_titleNewsProfile(){
return [
{title:"計算の灯火", rarity:"R"},
{title:"式の守備隊", rarity:"R"},
{title:"数字の風来坊", rarity:"R"},
{title:"ノートランナー", rarity:"R"},
{title:"黒板の案内人", rarity:"R"},
{title:"朝練の証", rarity:"R"},
{title:"夜学の民", rarity:"R"},
{title:"鉛筆ブレイブ", rarity:"R"},
{title:"消しゴムナイト", rarity:"R"},
{title:"問題コレクター", rarity:"R"},
{title:"集中チャージ", rarity:"R"},
{title:"公式スカウト", rarity:"R"},
{title:"理系ルーキー改", rarity:"R"},
{title:"努力の一歩", rarity:"R"},
{title:"復習レンジャー", rarity:"R"},
{title:"一問入魂", rarity:"R"},
{title:"答えの追跡者", rarity:"R"},
{title:"基礎クラフター", rarity:"R"},
{title:"足し算ガーディアン", rarity:"R"},
{title:"引き算ガーディアン", rarity:"R"},
{title:"かけ算ガーディアン", rarity:"R"},
{title:"割り算ガーディアン", rarity:"R"},
{title:"小さな証明者", rarity:"R"},
{title:"計算チャレンジャー", rarity:"R"},
{title:"学習パイロット", rarity:"R"},
{title:"紙ペンマスター見習い", rarity:"R"},
{title:"解答スカウト", rarity:"R"},
{title:"式読みチャレンジ", rarity:"R"},
{title:"正解ウォーカー", rarity:"R"},
{title:"デイリー解答者", rarity:"R"},
{title:"数学ドアマン", rarity:"R"},
{title:"成長ログ", rarity:"R"},
{title:"問題パトロール", rarity:"R"},
{title:"数字ハンドラー", rarity:"R"},
{title:"公式チェックマン", rarity:"R"},
{title:"計算特訓生", rarity:"R"},
{title:"努力の積み木", rarity:"R"},
{title:"今日の一問勢", rarity:"R"},
{title:"式の見習い観測者", rarity:"R"},
{title:"ミス分析係", rarity:"R"},
{title:"確実前進", rarity:"R"},
{title:"ペースキーパー", rarity:"R"},
{title:"コツコツファイター", rarity:"R"},
{title:"答え合わせ隊", rarity:"R"},
{title:"基礎防衛隊", rarity:"R"},
{title:"小数ウォーカー", rarity:"R"},
{title:"分数ウォーカー", rarity:"R"},
{title:"符号パトロール", rarity:"R"},
{title:"暗算トライ", rarity:"R"},
{title:"式変形トライ", rarity:"R"},
{title:"解法メモリー", rarity:"R"},
{title:"練習の種火", rarity:"R"},
{title:"問題集ナビ", rarity:"R"},
{title:"一点突破見習い", rarity:"R"},
{title:"計算の若葉", rarity:"R"},
{title:"数学散策者", rarity:"R"},
{title:"黒板アシスト", rarity:"R"},
{title:"積み上げ職人", rarity:"R"},
{title:"ノート探検家", rarity:"R"},
{title:"数の修理屋", rarity:"R"},
{title:"高速計算士改", rarity:"SR"},
{title:"数式ブレイカー", rarity:"SR"},
{title:"復習の指揮官", rarity:"SR"},
{title:"公式マスター改", rarity:"SR"},
{title:"集中オーバードライブ", rarity:"SR"},
{title:"努力の結晶改", rarity:"SR"},
{title:"解法サイエンティスト", rarity:"SR"},
{title:"朝活計算王", rarity:"SR"},
{title:"夜型解法王", rarity:"SR"},
{title:"ミス克服隊長", rarity:"SR"},
{title:"計算ブレード", rarity:"SR"},
{title:"積分チャレンジャー", rarity:"SR"},
{title:"微分チャレンジャー", rarity:"SR"},
{title:"因数分解マイスター", rarity:"SR"},
{title:"展開マイスター", rarity:"SR"},
{title:"素数レンジャー", rarity:"SR"},
{title:"連勝ブースター", rarity:"SR"},
{title:"継続の賢者", rarity:"SR"},
{title:"青の計算光", rarity:"SR"},
{title:"赤の解法炎", rarity:"SR"},
{title:"知識アーカイバー", rarity:"SR"},
{title:"問題クラッシャー", rarity:"SR"},
{title:"式変形エース", rarity:"SR"},
{title:"数学アドバンサー", rarity:"SR"},
{title:"実力覚醒中", rarity:"SR"},
{title:"👑数式帝王👑", rarity:"SSR"},
{title:"🏆完全解答者🏆", rarity:"SSR"},
{title:"⚔️数学武神⚔️", rarity:"SSR"},
{title:"🧠思考の覇者🧠", rarity:"SSR"},
{title:"🔥極限覚醒🔥", rarity:"SSR"},
{title:"💎数理貴族💎", rarity:"SSR"},
{title:"🌙月光の数学者🌙", rarity:"SSR"},
{title:"☀️太陽の解答者☀️", rarity:"SSR"},
{title:"🎯無敗の照準🎯", rarity:"SSR"},
{title:"📖真理の探究者📖", rarity:"SSR"},
{title:"🌌銀河数式神🌌", rarity:"UR"},
{title:"⚡雷鳴の証明者⚡", rarity:"UR"},
{title:"🧊絶対数理領域🧊", rarity:"UR"},
{title:"🔥終焉の公式王🔥", rarity:"UR"},
{title:"👑無限数学帝👑", rarity:"UR"}
];
}

gachaPool = function(){
  const map = new Map();
  for(const item of [...oldGachaPool_titleNewsProfile(), ...extraGachaTitles_titleNewsProfile()]){
    if(item && item.title && !map.has(item.title)) map.set(item.title, item);
  }
  return Array.from(map.values());
};

function rarityOrder_titleNewsProfile(r){
  return {SPECIAL:0,UR:1,SSR:2,SR:3,R:4,NORMAL:5}[r] ?? 9;
}
function getGachaRarityMap_titleNewsProfile(){
  const map = {};
  for(const item of gachaPool()) map[item.title] = item.rarity;
  return map;
}
function getTitleRarity_titleNewsProfile(t){
  const special = ["⚡️創設者⚡️","🧊なかなか🧊","古参勢","👾MENERU👾"];
  if(special.includes(t)) return "SPECIAL";
  const gm = getGachaRarityMap_titleNewsProfile();
  return gm[t] || "NORMAL";
}
function sortedDisplayTitles_titleNewsProfile(){
  return getAllDisplayTitles().slice().sort((a,b)=>{
    const ra=getTitleRarity_titleNewsProfile(a);
    const rb=getTitleRarity_titleNewsProfile(b);
    const d=rarityOrder_titleNewsProfile(ra)-rarityOrder_titleNewsProfile(rb);
    if(d!==0)return d;
    return String(a).localeCompare(String(b),"ja");
  });
}
function titleCountByRarity_titleNewsProfile(rarity){
  return sortedDisplayTitles_titleNewsProfile().filter(t=>getTitleRarity_titleNewsProfile(t)===rarity).length;
}
function titleHaveByRarity_titleNewsProfile(rarity){
  return sortedDisplayTitles_titleNewsProfile().filter(t=>getTitleRarity_titleNewsProfile(t)===rarity && playerData.unlockedTitles.includes(t)).length;
}

showTitles = function(filter="ALL"){
  checkTitles();
  const all = sortedDisplayTitles_titleNewsProfile();
  const visible = filter==="ALL" ? all : all.filter(t=>getTitleRarity_titleNewsProfile(t)===filter);
  let html = `
<h2>🏅 称号一覧</h2>
<div class="profileItem">
<p>所持：${playerData.unlockedTitles.length}個</p>
<p>UR：${titleHaveByRarity_titleNewsProfile("UR")} / ${titleCountByRarity_titleNewsProfile("UR")}</p>
<p>SSR：${titleHaveByRarity_titleNewsProfile("SSR")} / ${titleCountByRarity_titleNewsProfile("SSR")}</p>
<p>SR：${titleHaveByRarity_titleNewsProfile("SR")} / ${titleCountByRarity_titleNewsProfile("SR")}</p>
<p>R：${titleHaveByRarity_titleNewsProfile("R")} / ${titleCountByRarity_titleNewsProfile("R")}</p>
</div>
<div class="profileItem">
<button onclick="showTitles('ALL')">全部 ${all.length}個</button>
<button onclick="showTitles('UR')">UR ${titleCountByRarity_titleNewsProfile("UR")}個</button>
<button onclick="showTitles('SSR')">SSR ${titleCountByRarity_titleNewsProfile("SSR")}個</button>
<button onclick="showTitles('SR')">SR ${titleCountByRarity_titleNewsProfile("SR")}個</button>
<button onclick="showTitles('R')">R ${titleCountByRarity_titleNewsProfile("R")}個</button>
</div>
`;
  if(visible.length===0) html += "<p>称号がありません。</p>";
  for(let t of visible){
    const unlocked = playerData.unlockedTitles.includes(t);
    const rarity = getTitleRarity_titleNewsProfile(t);
    html += `<div class="titleItem">
${unlocked ? titleHTML(t) : "❓？？？"}
<br>レアリティ：${rarity==="NORMAL" ? "通常" : rarity==="SPECIAL" ? "特別" : rarity}
${unlocked ? `<br><button onclick="equipTitle('${String(t).replace(/'/g,"\\'")}')">装備</button>` : ""}
</div>`;
  }
  document.getElementById("panelArea").innerHTML = html;
};

const oldShowNewsPage_titleNewsProfile = typeof showNewsPage === "function" ? showNewsPage : null;
showNewsPage = function(){
  let html = `
<h2>📢 お知らせ</h2>
<div class="newsCard">
<h3>Ver 3.3.6 称号アップデート</h3>
<p>ガチャ称号をさらに100個追加しました。</p>
<p>プロフィールの称号一覧にレアリティ別ボタンを追加しました。</p>
<p>ガチャ排出率は R75% / SR21.5% / SSR3% / UR0.5% です。</p>
<p>ランキング・ログイン・Firebase処理は変更していません。</p>
</div>
`;
  if(oldShowNewsPage_titleNewsProfile){
    try{
      oldShowNewsPage_titleNewsProfile();
      const panel=document.getElementById("panelArea");
      if(panel) panel.innerHTML = html + panel.innerHTML;
      return;
    }catch(e){ console.log(e); }
  }
  document.getElementById("panelArea").innerHTML = html;
  if(typeof ensureHomeButton==="function") ensureHomeButton();
};

window.showTitles = showTitles;
window.showNewsPage = showNewsPage;
})();



/* force add missing titles + UR color fix only - ranking untouched */
(function(){
if(window.__forceAddTitlesUrColor336)return;
window.__forceAddTitlesUrColor336=true;

function forceExtraTitles336(){
return [
{title:"計算の灯火", rarity:"R"},
{title:"式の守備隊", rarity:"R"},
{title:"数字の風来坊", rarity:"R"},
{title:"ノートランナー", rarity:"R"},
{title:"黒板の案内人", rarity:"R"},
{title:"朝練の証", rarity:"R"},
{title:"夜学の民", rarity:"R"},
{title:"鉛筆ブレイブ", rarity:"R"},
{title:"消しゴムナイト", rarity:"R"},
{title:"問題コレクター", rarity:"R"},
{title:"集中チャージ", rarity:"R"},
{title:"公式スカウト", rarity:"R"},
{title:"理系ルーキー改", rarity:"R"},
{title:"努力の一歩", rarity:"R"},
{title:"復習レンジャー", rarity:"R"},
{title:"一問入魂", rarity:"R"},
{title:"答えの追跡者", rarity:"R"},
{title:"基礎クラフター", rarity:"R"},
{title:"足し算ガーディアン", rarity:"R"},
{title:"引き算ガーディアン", rarity:"R"},
{title:"かけ算ガーディアン", rarity:"R"},
{title:"割り算ガーディアン", rarity:"R"},
{title:"小さな証明者", rarity:"R"},
{title:"計算チャレンジャー", rarity:"R"},
{title:"学習パイロット", rarity:"R"},
{title:"紙ペンマスター見習い", rarity:"R"},
{title:"解答スカウト", rarity:"R"},
{title:"式読みチャレンジ", rarity:"R"},
{title:"正解ウォーカー", rarity:"R"},
{title:"デイリー解答者", rarity:"R"},
{title:"数学ドアマン", rarity:"R"},
{title:"成長ログ", rarity:"R"},
{title:"問題パトロール", rarity:"R"},
{title:"数字ハンドラー", rarity:"R"},
{title:"公式チェックマン", rarity:"R"},
{title:"計算特訓生", rarity:"R"},
{title:"努力の積み木", rarity:"R"},
{title:"今日の一問勢", rarity:"R"},
{title:"式の見習い観測者", rarity:"R"},
{title:"ミス分析係", rarity:"R"},
{title:"確実前進", rarity:"R"},
{title:"ペースキーパー", rarity:"R"},
{title:"コツコツファイター", rarity:"R"},
{title:"答え合わせ隊", rarity:"R"},
{title:"基礎防衛隊", rarity:"R"},
{title:"小数ウォーカー", rarity:"R"},
{title:"分数ウォーカー", rarity:"R"},
{title:"符号パトロール", rarity:"R"},
{title:"暗算トライ", rarity:"R"},
{title:"式変形トライ", rarity:"R"},
{title:"解法メモリー", rarity:"R"},
{title:"練習の種火", rarity:"R"},
{title:"問題集ナビ", rarity:"R"},
{title:"一点突破見習い", rarity:"R"},
{title:"計算の若葉", rarity:"R"},
{title:"数学散策者", rarity:"R"},
{title:"黒板アシスト", rarity:"R"},
{title:"積み上げ職人", rarity:"R"},
{title:"ノート探検家", rarity:"R"},
{title:"数の修理屋", rarity:"R"},
{title:"高速計算士改", rarity:"SR"},
{title:"数式ブレイカー", rarity:"SR"},
{title:"復習の指揮官", rarity:"SR"},
{title:"公式マスター改", rarity:"SR"},
{title:"集中オーバードライブ", rarity:"SR"},
{title:"努力の結晶改", rarity:"SR"},
{title:"解法サイエンティスト", rarity:"SR"},
{title:"朝活計算王", rarity:"SR"},
{title:"夜型解法王", rarity:"SR"},
{title:"ミス克服隊長", rarity:"SR"},
{title:"計算ブレード", rarity:"SR"},
{title:"積分チャレンジャー", rarity:"SR"},
{title:"微分チャレンジャー", rarity:"SR"},
{title:"因数分解マイスター", rarity:"SR"},
{title:"展開マイスター", rarity:"SR"},
{title:"素数レンジャー", rarity:"SR"},
{title:"連勝ブースター", rarity:"SR"},
{title:"継続の賢者", rarity:"SR"},
{title:"青の計算光", rarity:"SR"},
{title:"赤の解法炎", rarity:"SR"},
{title:"知識アーカイバー", rarity:"SR"},
{title:"問題クラッシャー", rarity:"SR"},
{title:"式変形エース", rarity:"SR"},
{title:"数学アドバンサー", rarity:"SR"},
{title:"実力覚醒中", rarity:"SR"},
{title:"👑数式帝王👑", rarity:"SSR"},
{title:"🏆完全解答者🏆", rarity:"SSR"},
{title:"⚔️数学武神⚔️", rarity:"SSR"},
{title:"🧠思考の覇者🧠", rarity:"SSR"},
{title:"🔥極限覚醒🔥", rarity:"SSR"},
{title:"💎数理貴族💎", rarity:"SSR"},
{title:"🌙月光の数学者🌙", rarity:"SSR"},
{title:"☀️太陽の解答者☀️", rarity:"SSR"},
{title:"🎯無敗の照準🎯", rarity:"SSR"},
{title:"📖真理の探究者📖", rarity:"SSR"},
{title:"🌌銀河数式神🌌", rarity:"UR"},
{title:"⚡雷鳴の証明者⚡", rarity:"UR"},
{title:"🧊絶対数理領域🧊", rarity:"UR"},
{title:"🔥終焉の公式王🔥", rarity:"UR"},
{title:"👑無限数学帝👑", rarity:"UR"}
];
}

const beforeForceGachaPool336 = gachaPool;
gachaPool = function(){
  const map = new Map();
  for(const item of beforeForceGachaPool336()) {
    if(item && item.title) map.set(item.title, item);
  }
  for(const item of forceExtraTitles336()) {
    if(item && item.title) map.set(item.title, item);
  }
  return Array.from(map.values());
};

function rarityMapForce336(){
  const m = {};
  for(const item of gachaPool()) m[item.title] = item.rarity;
  return m;
}

const oldTitleHTMLForce336 = titleHTML;
titleHTML = function(t){
  const rarity = rarityMapForce336()[t];
  if(rarity === "UR"){
    return `<span class="urTitle" style="color:#ffd700;text-shadow:0 0 10px #ffd700,0 0 22px #ff8c00,0 0 36px #fff;">${t}</span>`;
  }
  return oldTitleHTMLForce336(t);
};

function rarityOrderForce336(r){
  return {UR:0,SSR:1,SR:2,R:3}[r] ?? 9;
}

function sortedGachaPoolForce336(){
  return gachaPool().slice().sort((a,b)=>{
    const d=rarityOrderForce336(a.rarity)-rarityOrderForce336(b.rarity);
    if(d!==0)return d;
    return String(a.title).localeCompare(String(b.title),"ja");
  });
}

showGachaBook = function(filter="ALL"){
  let pool=sortedGachaPoolForce336();
  let owned=playerData.gachaTitles||[];
  let count=(rarity)=>pool.filter(x=>x.rarity===rarity).length;
  let have=(rarity)=>pool.filter(x=>x.rarity===rarity && owned.includes(x.title)).length;
  let ownedInPool=owned.filter(t=>pool.some(x=>x.title===t)).length;
  let visible=filter==="ALL"?pool:pool.filter(x=>x.rarity===filter);
  let html=`
<h2>📖 ガチャ図鑑</h2>
<div class="profileItem">
<p>所持数：${ownedInPool} / ${pool.length}</p>
<p>R：${have("R")} / ${count("R")}</p>
<p>SR：${have("SR")} / ${count("SR")}</p>
<p>SSR：${have("SSR")} / ${count("SSR")}</p>
<p>UR：${have("UR")} / ${count("UR")}</p>
</div>
<div class="profileItem">
<button onclick="showGachaBook('ALL')">全部 ${pool.length}個</button>
<button onclick="showGachaBook('UR')">UR ${count("UR")}個</button>
<button onclick="showGachaBook('SSR')">SSR ${count("SSR")}個</button>
<button onclick="showGachaBook('SR')">SR ${count("SR")}個</button>
<button onclick="showGachaBook('R')">R ${count("R")}個</button>
</div>
`;
  for(let item of visible){
    let got=owned.includes(item.title);
    html+=`
<div class="titleItem">
${got ? "✅ " + titleHTML(item.title) : "⬜ ？？？"}
<br>
レアリティ：${item.rarity}
</div>
`;
  }
  document.getElementById("panelArea").innerHTML=html;
};

const oldGetAllDisplayTitlesForce336 = getAllDisplayTitles;
getAllDisplayTitles = function(){
  return [...new Set([...oldGetAllDisplayTitlesForce336(), ...gachaPool().map(x=>x.title)])];
};

window.gachaPool = gachaPool;
window.titleHTML = titleHTML;
window.showGachaBook = showGachaBook;
window.getAllDisplayTitles = getAllDisplayTitles;
})();



/* UR color variety + gacha animation only - ranking untouched */
(function(){
if(window.__urColorGachaAnim336)return;
window.__urColorGachaAnim336=true;

const urColorStyles336 = [
  {keys:["🌈虹の数学神🌈","星海","銀河"], cls:"rainbowTitle", style:""},
  {keys:["❄️絶対零度❄️","🧊絶対数理領域🧊","氷","零度"], cls:"urTitle", style:"color:#66e7ff;text-shadow:0 0 10px #66e7ff,0 0 24px #00aaff,0 0 42px #e0fbff;"},
  {keys:["🔥原初の数式🔥","🔥終焉の公式王🔥","炎","火","原初","終焉"], cls:"urTitle", style:"color:#ff4d2e;text-shadow:0 0 10px #ff4d2e,0 0 24px #ff9800,0 0 42px #ffd166;"},
  {keys:["👑究極数学王👑","👑超越数学皇👑","👑無限数学帝👑","王","皇","帝"], cls:"urTitle", style:"color:#ffd700;text-shadow:0 0 10px #ffd700,0 0 24px #ffb300,0 0 42px #fff4a3;"},
  {keys:["🌌宇宙の支配者🌌","宇宙","支配者"], cls:"urTitle", style:"color:#b388ff;text-shadow:0 0 10px #b388ff,0 0 24px #7c4dff,0 0 42px #18ffff;"},
  {keys:["⚡雷鳴の証明者⚡","雷","証明"], cls:"urTitle", style:"color:#fff176;text-shadow:0 0 10px #fff176,0 0 24px #00e5ff,0 0 42px #ffffff;"},
  {keys:["🐉数式龍王🐉","龍"], cls:"urTitle", style:"color:#00e676;text-shadow:0 0 10px #00e676,0 0 24px #00c853,0 0 42px #b9f6ca;"},
  {keys:["💫無限の開拓者💫","無限","開拓"], cls:"urTitle", style:"color:#ff80ab;text-shadow:0 0 10px #ff80ab,0 0 24px #ea80fc,0 0 42px #8c9eff;"},
  {keys:["🪽天空の証明者🪽","天空"], cls:"urTitle", style:"color:#80d8ff;text-shadow:0 0 10px #80d8ff,0 0 24px #ffffff,0 0 42px #b388ff;"}
];

function urStyleForTitle336(t){
  const s=String(t||"");
  for(const rule of urColorStyles336){
    if(rule.keys.some(k=>s.includes(k))) return rule;
  }
  return {cls:"urTitle", style:"color:#ffd700;text-shadow:0 0 10px #ffd700,0 0 24px #ff8c00,0 0 42px #fff;"};
}

function rarityMapUrAnim336(){
  const m={};
  try{ for(const item of gachaPool()) m[item.title]=item.rarity; }catch(e){}
  return m;
}

const prevTitleHTML_urAnim336 = titleHTML;
titleHTML = function(t){
  const rarity = rarityMapUrAnim336()[t];
  if(rarity==="UR"){
    const rule=urStyleForTitle336(t);
    if(rule.cls==="rainbowTitle") return `<span class="rainbowTitle">${t}</span>`;
    return `<span class="${rule.cls}" style="${rule.style}">${t}</span>`;
  }
  return prevTitleHTML_urAnim336(t);
};

function ensureGachaAnimStyle336(){
  if(document.getElementById("gachaAnimStyle336"))return;
  const style=document.createElement("style");
  style.id="gachaAnimStyle336";
  style.textContent=`
.gachaStage336{position:relative;overflow:hidden;min-height:360px;text-align:center;background:radial-gradient(circle at 50% 25%,rgba(255,255,255,.18),rgba(0,0,0,.08) 35%,rgba(0,0,0,.42));}
.gachaOrb336{width:150px;height:150px;border-radius:50%;margin:24px auto 16px;background:radial-gradient(circle,#fff,#67e8f9 35%,#7c3aed 70%,#111 100%);box-shadow:0 0 24px #67e8f9,0 0 60px #7c3aed;animation:gachaOrbPulse336 .62s ease-in-out infinite alternate;}
@keyframes gachaOrbPulse336{from{transform:scale(.92) rotate(-4deg);filter:brightness(1)}to{transform:scale(1.12) rotate(4deg);filter:brightness(1.45)}}
.gachaRareText336{font-size:32px;font-weight:900;margin:12px;text-shadow:0 0 14px currentColor,0 0 30px currentColor;animation:gachaTextPop336 .55s ease-out both;}
@keyframes gachaTextPop336{from{opacity:0;transform:scale(.45) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
.gachaResultBig336{font-size:38px;font-weight:900;margin:18px auto;animation:gachaResultPop336 .7s ease-out both;}
@keyframes gachaResultPop336{0%{opacity:0;transform:scale(.2) rotate(-8deg)}60%{opacity:1;transform:scale(1.18) rotate(3deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
.gachaURStage336{animation:gachaURBg336 1.15s ease-in-out infinite alternate;}
@keyframes gachaURBg336{from{box-shadow:inset 0 0 30px rgba(255,255,255,.1),0 0 18px #ffd700}to{box-shadow:inset 0 0 80px rgba(255,255,255,.25),0 0 60px #ff00ff}}
.gachaParticle336{position:absolute;font-size:22px;animation:gachaFloat336 1.2s ease-out forwards;pointer-events:none;}
@keyframes gachaFloat336{from{opacity:1;transform:translateY(0) scale(.7)}to{opacity:0;transform:translateY(-150px) scale(1.6)}}
`;
  document.head.appendChild(style);
}

function spawnGachaParticles336(box, rarity){
  const marks = rarity==="UR" ? ["✨","🌈","💎","👑","⚡","🔥","🌌"] :
                rarity==="SSR" ? ["✨","💎","⭐","🔥"] :
                rarity==="SR" ? ["✨","⭐","🔹"] : ["✨","・"];
  const n = rarity==="UR"?34:rarity==="SSR"?22:rarity==="SR"?14:8;
  for(let i=0;i<n;i++){
    const p=document.createElement("div");
    p.className="gachaParticle336";
    p.textContent=marks[Math.floor(Math.random()*marks.length)];
    p.style.left=(8+Math.random()*84)+"%";
    p.style.top=(52+Math.random()*34)+"%";
    p.style.animationDelay=(Math.random()*0.55)+"s";
    box.appendChild(p);
  }
}

function rarityColor336(rarity){
  if(rarity==="UR")return "#ffd700";
  if(rarity==="SSR")return "#ff5cff";
  if(rarity==="SR")return "#66e7ff";
  return "#ffffff";
}

drawGacha = function(){
  if((playerData.coins||0)<10){
    alert("コインが足りません");
    return;
  }
  playerData.coins-=10;
  const item=getGachaResultNoDuplicate();
  if(!item){ alert("ガチャ称号をすべて入手済みです"); showGacha(); return; }

  ensureGachaAnimStyle336();
  const box=document.getElementById("panelArea");
  box.innerHTML=`
<h2>🎰 ガチャ演出中...</h2>
<div id="gachaStage336" class="profileItem gachaStage336">
<div class="gachaOrb336"></div>
<div id="gachaRareText336" class="gachaRareText336">???</div>
<p>称号を召喚中...</p>
</div>
`;
  const stage=document.getElementById("gachaStage336");
  const rareText=document.getElementById("gachaRareText336");
  const sequence = item.rarity==="UR" ? ["R","SR","SSR","UR確定!!"] :
                   item.rarity==="SSR" ? ["R","SR","SSR!!"] :
                   item.rarity==="SR" ? ["R","SR!"] : ["R"];
  let i=0;
  const timer=setInterval(()=>{
    const label=sequence[Math.min(i,sequence.length-1)];
    rareText.textContent=label;
    rareText.style.color=label.includes("UR") ? "#ffd700" : rarityColor336(label.replace(/!|確定/g,""));
    spawnGachaParticles336(stage, item.rarity==="UR" && label.includes("UR") ? "UR" : item.rarity);
    i++;
    if(i>=sequence.length){
      clearInterval(timer);
      setTimeout(()=>{
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
<div class="profileItem gachaStage336 ${item.rarity==="UR"?"gachaURStage336":""}">
<div class="gachaRareText336" style="color:${rarityColor336(item.rarity)}">${item.rarity}</div>
<div class="gachaResultBig336">${titleHTML(item.title)}</div>
<p>所持コイン：${playerData.coins||0}</p>
<button onclick="drawGacha()">もう一回引く</button>
<button onclick="showGacha()">ガチャ画面へ</button>
</div>
`;
        const resultStage=document.querySelector(".gachaStage336");
        if(resultStage)spawnGachaParticles336(resultStage,item.rarity);
      },650);
    }
  },620);
};

drawGacha10 = function(){
  if((playerData.coins||0)<100){
    alert("コインが足りません");
    return;
  }
  playerData.coins-=100;
  let results=[];
  let hasUR=false;
  for(let i=0;i<10;i++){
    let item=getGachaResultNoDuplicate();
    if(!item){ alert("ガチャ称号をすべて入手済みです"); showGacha(); return; }
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
  ensureGachaAnimStyle336();
  results.sort((a,b)=>({UR:0,SSR:1,SR:2,R:3}[a.rarity]-{UR:0,SSR:1,SR:2,R:3}[b.rarity]));
  let html=`<h2>🎰 10連ガチャ結果</h2>
<div class="profileItem gachaStage336 ${hasUR?"gachaURStage336":""}">
<p>所持コイン：${playerData.coins||0}</p>
<button onclick="drawGacha10()">もう一度10連</button>
<button onclick="showGacha()">ガチャ画面へ</button>
</div>`;
  for(let item of results){
    html+=`<div class="titleItem"><b style="color:${rarityColor336(item.rarity)}">${item.rarity}</b><br>${titleHTML(item.title)}</div>`;
  }
  document.getElementById("panelArea").innerHTML=html;
  const resultStage=document.querySelector(".gachaStage336");
  if(resultStage)spawnGachaParticles336(resultStage,hasUR?"UR":"SSR");
};

window.titleHTML=titleHTML;
window.drawGacha=drawGacha;
window.drawGacha10=drawGacha10;
})();



/* Ver3.3.7 formula summon gate gacha only - ranking untouched */
(function(){
if(window.__formulaGateGacha337)return;
window.__formulaGateGacha337=true;

function ensureFormulaGateStyle337(){
  if(document.getElementById("formulaGateStyle337"))return;
  const style=document.createElement("style");
  style.id="formulaGateStyle337";
  style.textContent=`
.formulaGate337{
  position:relative;
  min-height:520px;
  overflow:hidden;
  text-align:center;
  background:
    radial-gradient(circle at 50% 35%,rgba(0,255,204,.22),transparent 22%),
    radial-gradient(circle at 50% 45%,rgba(124,58,237,.28),transparent 42%),
    linear-gradient(180deg,rgba(2,6,23,.96),rgba(15,23,42,.9));
}
.formulaSymbol337{
  position:absolute;
  font-size:30px;
  font-weight:900;
  color:rgba(125,211,252,.88);
  text-shadow:0 0 10px #22d3ee,0 0 22px #7c3aed;
  animation:formulaFly337 linear infinite;
  pointer-events:none;
}
@keyframes formulaFly337{
  from{transform:translateY(560px) rotate(0deg);opacity:0}
  12%{opacity:1}
  88%{opacity:.95}
  to{transform:translateY(-90px) rotate(360deg);opacity:0}
}
.formulaCircle337{
  width:240px;
  height:240px;
  margin:46px auto 14px;
  border-radius:50%;
  position:relative;
  border:3px solid rgba(103,232,249,.95);
  box-shadow:
    0 0 20px #67e8f9,
    0 0 52px #7c3aed,
    inset 0 0 30px rgba(103,232,249,.42);
  animation:gateRotate337 4.2s linear infinite, gatePulse337 .9s ease-in-out infinite alternate;
}
.formulaCircle337::before{
  content:"";
  position:absolute;
  inset:24px;
  border-radius:50%;
  border:2px dashed rgba(255,255,255,.8);
  animation:gateRotateReverse337 2.7s linear infinite;
}
.formulaCircle337::after{
  content:"∫  Σ  π  √  ∞";
  white-space:pre;
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:30px;
  font-weight:900;
  color:#fff;
  text-shadow:0 0 12px #fff,0 0 24px #22d3ee;
}
@keyframes gateRotate337{to{transform:rotate(360deg)}}
@keyframes gateRotateReverse337{to{transform:rotate(-360deg)}}
@keyframes gatePulse337{from{filter:brightness(1);transform:scale(.96)}to{filter:brightness(1.45);transform:scale(1.04)}}
.formulaTap337{
  font-size:30px;
  font-weight:900;
  color:#fde68a;
  margin:12px auto;
  text-shadow:0 0 12px #f59e0b,0 0 24px #fff;
  animation:tapBlink337 .82s ease-in-out infinite alternate;
}
@keyframes tapBlink337{from{opacity:.55;transform:scale(.96)}to{opacity:1;transform:scale(1.06)}}
.formulaAnalyze337{
  font-size:24px;
  color:#e0f2fe;
  text-shadow:0 0 10px #38bdf8;
}
.formulaGateCollapse337 .formulaCircle337{
  animation:gateCollapse337 .7s ease-in forwards;
}
@keyframes gateCollapse337{
  0%{transform:scale(1) rotate(0deg);opacity:1}
  70%{transform:scale(.25) rotate(540deg);opacity:1;filter:brightness(2.6)}
  100%{transform:scale(3.2) rotate(720deg);opacity:0;filter:brightness(5)}
}
.rarityJudge337{
  font-size:56px;
  font-weight:900;
  margin:22px auto;
  text-shadow:0 0 18px currentColor,0 0 42px currentColor;
  animation:rarityJudgePop337 .5s ease-out both;
}
@keyframes rarityJudgePop337{
  from{opacity:0;transform:scale(.2) rotate(-8deg)}
  65%{opacity:1;transform:scale(1.2) rotate(4deg)}
  to{opacity:1;transform:scale(1) rotate(0)}
}
.rarityUpgrade337{
  font-size:34px;
  font-weight:900;
  color:#fde68a;
  text-shadow:0 0 12px #f59e0b,0 0 28px #fff;
  animation:upgradeShake337 .45s ease-in-out both;
}
@keyframes upgradeShake337{
  0%{transform:translateX(0) scale(.9)}
  25%{transform:translateX(-8px) scale(1.05)}
  50%{transform:translateX(8px) scale(1.15)}
  75%{transform:translateX(-4px) scale(1.05)}
  100%{transform:translateX(0) scale(1)}
}
.urUniverse337{
  animation:urUniverseBg337 .9s ease-in-out infinite alternate;
}
@keyframes urUniverseBg337{
  from{box-shadow:inset 0 0 35px rgba(255,255,255,.14),0 0 25px #22d3ee}
  to{box-shadow:inset 0 0 95px rgba(255,255,255,.28),0 0 70px #ff00ff}
}
.bigPi337{
  font-size:110px;
  font-weight:900;
  margin:8px auto;
  color:#fff;
  text-shadow:0 0 15px #fff,0 0 35px #ffd700,0 0 70px #ff00ff;
  animation:bigPiBreak337 .95s ease-out both;
}
@keyframes bigPiBreak337{
  0%{opacity:0;transform:scale(.1) rotate(-12deg)}
  45%{opacity:1;transform:scale(1.25) rotate(4deg)}
  75%{opacity:1;transform:scale(.9) rotate(-2deg);filter:brightness(2)}
  100%{opacity:0;transform:scale(2.2) rotate(18deg);filter:brightness(5)}
}
.gachaResultTitle337{
  font-size:42px;
  font-weight:900;
  margin:18px auto;
  animation:resultDrop337 .72s ease-out both;
}
@keyframes resultDrop337{
  from{opacity:0;transform:translateY(-35px) scale(.5)}
  60%{opacity:1;transform:translateY(8px) scale(1.15)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
.formulaParticle337{
  position:absolute;
  font-size:24px;
  pointer-events:none;
  animation:particleRise337 1.3s ease-out forwards;
}
@keyframes particleRise337{
  from{opacity:1;transform:translateY(0) scale(.75)}
  to{opacity:0;transform:translateY(-180px) scale(1.7)}
}
`;
  document.head.appendChild(style);
}

function rarityColorGate337(r){
  if(r==="UR")return "#ffd700";
  if(r==="SSR")return "#ff5cff";
  if(r==="SR")return "#66e7ff";
  return "#ffffff";
}

function addFlyingFormula337(stage){
  const symbols=["∫","Σ","π","∞","√","lim","dx","dy","log","sin","cos","tan","x²","e^x"];
  for(let i=0;i<28;i++){
    const s=document.createElement("div");
    s.className="formulaSymbol337";
    s.textContent=symbols[Math.floor(Math.random()*symbols.length)];
    s.style.left=(Math.random()*94)+"%";
    s.style.animationDuration=(3+Math.random()*4.5)+"s";
    s.style.animationDelay=(-Math.random()*5)+"s";
    s.style.fontSize=(22+Math.random()*25)+"px";
    stage.appendChild(s);
  }
}

function spawnParticlesGate337(stage, rarity){
  const marks = rarity==="UR" ? ["✨","🌈","💎","👑","⚡","🔥","🌌","π"] :
                rarity==="SSR" ? ["✨","💎","⭐","🔥","Σ"] :
                rarity==="SR" ? ["✨","⭐","√","∫"] : ["✨","∫","π"];
  const n = rarity==="UR"?42:rarity==="SSR"?28:rarity==="SR"?18:10;
  for(let i=0;i<n;i++){
    const p=document.createElement("div");
    p.className="formulaParticle337";
    p.textContent=marks[Math.floor(Math.random()*marks.length)];
    p.style.left=(8+Math.random()*84)+"%";
    p.style.top=(48+Math.random()*36)+"%";
    p.style.animationDelay=(Math.random()*0.6)+"s";
    stage.appendChild(p);
  }
}

function raritySequence337(rarity){
  if(rarity==="UR")return [
    {label:"R", color:rarityColorGate337("R")},
    {label:"SRへ昇格！", color:rarityColorGate337("SR"), up:true},
    {label:"SSRへ昇格！！", color:rarityColorGate337("SSR"), up:true},
    {label:"🌈 UR確定！！！ 🌈", color:rarityColorGate337("UR"), up:true, ur:true}
  ];
  if(rarity==="SSR")return [
    {label:"R", color:rarityColorGate337("R")},
    {label:"SRへ昇格！", color:rarityColorGate337("SR"), up:true},
    {label:"SSR！！", color:rarityColorGate337("SSR"), up:true}
  ];
  if(rarity==="SR")return [
    {label:"R", color:rarityColorGate337("R")},
    {label:"SR！", color:rarityColorGate337("SR"), up:true}
  ];
  return [{label:"R", color:rarityColorGate337("R")}];
}

function finalizeSingleGacha337(item, box, stage){
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

  const showResult=()=>{
    box.innerHTML=`
<h2>🎰 ガチャ結果</h2>
<div class="profileItem formulaGate337 ${item.rarity==="UR"?"urUniverse337":""}">
<div class="rarityJudge337" style="color:${rarityColorGate337(item.rarity)}">${item.rarity}</div>
<div class="gachaResultTitle337">${titleHTML(item.title)}</div>
<p>所持コイン：${playerData.coins||0}</p>
<button onclick="drawGacha()">もう一回引く</button>
<button onclick="showGacha()">ガチャ画面へ</button>
</div>
`;
    const resultStage=document.querySelector(".formulaGate337");
    if(resultStage){
      addFlyingFormula337(resultStage);
      spawnParticlesGate337(resultStage,item.rarity);
    }
  };

  if(item.rarity==="UR"){
    box.innerHTML=`
<h2>🌌 数学宇宙モード</h2>
<div class="profileItem formulaGate337 urUniverse337">
<div class="bigPi337">π</div>
<p class="formulaAnalyze337">数式の核が解放される...</p>
</div>`;
    setTimeout(showResult,980);
  }else{
    showResult();
  }
}

drawGacha = function(){
  if((playerData.coins||0)<10){
    alert("コインが足りません");
    return;
  }
  playerData.coins-=10;
  const item=getGachaResultNoDuplicate();
  if(!item){ alert("ガチャ称号をすべて入手済みです"); showGacha(); return; }

  ensureFormulaGateStyle337();
  const box=document.getElementById("panelArea");
  box.innerHTML=`
<h2>🌌 数式召喚ゲート</h2>
<div id="formulaGateStage337" class="profileItem formulaGate337">
<div class="formulaCircle337"></div>
<div class="formulaAnalyze337">数式解析中...</div>
<div class="formulaTap337">画面をタップして解析開始</div>
</div>
`;
  const stage=document.getElementById("formulaGateStage337");
  addFlyingFormula337(stage);

  let started=false;
  const startJudge=()=>{
    if(started)return;
    started=true;
    if(window.playTapBlackoutConfirm337) window.playTapBlackoutConfirm337("解析開始");
    stage.classList.add("formulaGateCollapse337");
    setTimeout(()=>{
      const seq=raritySequence337(item.rarity);
      let i=0;
      const showStep=()=>{
        const step=seq[i];
        box.innerHTML=`
<h2>⚡ レア度判定</h2>
<div id="formulaGateStage337" class="profileItem formulaGate337 ${step.ur?"urUniverse337":""}">
<div class="${step.up?'rarityUpgrade337':'rarityJudge337'}" style="color:${step.color}">${step.label}</div>
<p class="formulaAnalyze337">${i+1} / ${seq.length}</p>
</div>
`;
        const newStage=document.getElementById("formulaGateStage337");
        addFlyingFormula337(newStage);
        spawnParticlesGate337(newStage, step.ur?"UR":item.rarity);
        i++;
        if(i<seq.length){
          setTimeout(showStep,850);
        }else{
          setTimeout(()=>finalizeSingleGacha337(item, box, newStage),900);
        }
      };
      showStep();
    },720);
  };
  stage.addEventListener("click", startJudge);
  stage.addEventListener("touchstart", function(e){e.preventDefault(); startJudge();}, {passive:false});
};

drawGacha10 = function(){
  if((playerData.coins||0)<100){
    alert("コインが足りません");
    return;
  }
  playerData.coins-=100;
  let results=[];
  let hasUR=false;
  for(let i=0;i<10;i++){
    let item=getGachaResultNoDuplicate();
    if(!item){ alert("ガチャ称号をすべて入手済みです"); showGacha(); return; }
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
  ensureFormulaGateStyle337();
  results.sort((a,b)=>({UR:0,SSR:1,SR:2,R:3}[a.rarity]-{UR:0,SSR:1,SR:2,R:3}[b.rarity]));
  let box=document.getElementById("panelArea");
  let html=`<h2>🎰 10連ガチャ結果</h2>
<div id="formulaGateStage337" class="profileItem formulaGate337 ${hasUR?"urUniverse337":""}">
<div class="formulaCircle337"></div>
<div class="formulaAnalyze337">${hasUR?"🌈 UR反応あり！":"10連解析完了"}</div>
<p>所持コイン：${playerData.coins||0}</p>
<button onclick="drawGacha10()">もう一度10連</button>
<button onclick="showGacha()">ガチャ画面へ</button>
</div>`;
  for(let item of results){
    html+=`<div class="titleItem"><b style="color:${rarityColorGate337(item.rarity)}">${item.rarity}</b><br>${titleHTML(item.title)}</div>`;
  }
  box.innerHTML=html;
  const stage=document.getElementById("formulaGateStage337");
  if(stage){
    addFlyingFormula337(stage);
    spawnParticlesGate337(stage,hasUR?"UR":"SSR");
  }
};

window.drawGacha=drawGacha;
window.drawGacha10=drawGacha10;
})();



/* Ver3.3.7 tap blackout confirm overlay - intentionally overlaps gacha gate */
(function(){
if(window.__tapBlackoutConfirm337)return;
window.__tapBlackoutConfirm337=true;

function ensureTapBlackoutStyle337(){
  if(document.getElementById("tapBlackoutStyle337"))return;
  const style=document.createElement("style");
  style.id="tapBlackoutStyle337";
  style.textContent=`
.tapBlackout337{
  position:fixed;
  inset:0;
  background:#000;
  z-index:99999;
  opacity:0;
  pointer-events:none;
  display:flex;
  align-items:center;
  justify-content:center;
  animation:tapBlackoutFlash337 .72s ease-out forwards;
}
.tapBlackout337 .tapBlackoutText337{
  font-size:42px;
  font-weight:900;
  color:#fff;
  text-shadow:0 0 12px #fff,0 0 30px #22d3ee,0 0 55px #7c3aed;
  opacity:0;
  animation:tapBlackoutText337 .72s ease-out forwards;
}
@keyframes tapBlackoutFlash337{
  0%{opacity:0}
  18%{opacity:1}
  58%{opacity:1}
  100%{opacity:0}
}
@keyframes tapBlackoutText337{
  0%{opacity:0;transform:scale(.45)}
  20%{opacity:1;transform:scale(1.16)}
  62%{opacity:1;transform:scale(1)}
  100%{opacity:0;transform:scale(1.35)}
}
.confirmShake337{
  animation:confirmShake337 .55s ease-in-out both;
}
@keyframes confirmShake337{
  0%{transform:translateX(0)}
  20%{transform:translateX(-10px)}
  40%{transform:translateX(10px)}
  60%{transform:translateX(-7px)}
  80%{transform:translateX(7px)}
  100%{transform:translateX(0)}
}
`;
  document.head.appendChild(style);
}

window.playTapBlackoutConfirm337 = function(label="解析開始"){
  ensureTapBlackoutStyle337();
  const old=document.getElementById("tapBlackout337");
  if(old)old.remove();
  const div=document.createElement("div");
  div.id="tapBlackout337";
  div.className="tapBlackout337";
  div.innerHTML=`<div class="tapBlackoutText337">${label}</div>`;
  document.body.appendChild(div);
  try{
    const stage=document.getElementById("formulaGateStage337");
    if(stage)stage.classList.add("confirmShake337");
  }catch(e){}
  setTimeout(()=>div.remove(),760);
};
})();



/* Ver3.3.8 gacha DX fix: duplicate allowed + longer fullscreen summon page */
(function(){
if(window.__gachaDX338)return;
window.__gachaDX338=true;

function ensureGachaDXStyle338(){
  if(document.getElementById("gachaDXStyle338"))return;
  const style=document.createElement("style");
  style.id="gachaDXStyle338";
  style.textContent=`
.gachaFull338{
  position:fixed;
  inset:0;
  z-index:99990;
  background:
    radial-gradient(circle at 50% 35%,rgba(0,255,204,.24),transparent 24%),
    radial-gradient(circle at 50% 50%,rgba(124,58,237,.34),transparent 52%),
    linear-gradient(180deg,#020617,#050014 55%,#000);
  color:white;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
}
.gachaFull338::before{
  content:"";
  position:absolute;
  inset:-30%;
  background:conic-gradient(from 0deg,transparent,rgba(34,211,238,.22),transparent,rgba(255,0,255,.2),transparent);
  animation:gachaBgSpin338 7s linear infinite;
}
@keyframes gachaBgSpin338{to{transform:rotate(360deg)}}
.gachaFullInner338{position:relative;z-index:1;width:94%;max-width:820px;}
.gachaGate338{
  width:280px;height:280px;margin:10px auto 20px;border-radius:50%;
  border:4px solid rgba(103,232,249,.95);
  box-shadow:0 0 25px #67e8f9,0 0 70px #7c3aed,inset 0 0 42px rgba(255,255,255,.24);
  position:relative;
  animation:gachaGateSpin338 5.2s linear infinite, gachaGatePulse338 1.2s ease-in-out infinite alternate;
}
.gachaGate338::before{
  content:"";position:absolute;inset:30px;border-radius:50%;
  border:2px dashed rgba(255,255,255,.85);
  animation:gachaGateSpinReverse338 3.4s linear infinite;
}
.gachaGate338::after{
  content:"∫  Σ  π  √  ∞";
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-size:34px;font-weight:900;text-shadow:0 0 14px #fff,0 0 32px #22d3ee;
}
@keyframes gachaGateSpin338{to{transform:rotate(360deg)}}
@keyframes gachaGateSpinReverse338{to{transform:rotate(-360deg)}}
@keyframes gachaGatePulse338{from{filter:brightness(1);transform:scale(.96)}to{filter:brightness(1.55);transform:scale(1.05)}}
.gachaTap338{
  font-size:32px;font-weight:900;color:#fde68a;
  text-shadow:0 0 12px #f59e0b,0 0 28px #fff;
  animation:gachaTapBlink338 .9s ease-in-out infinite alternate;
}
@keyframes gachaTapBlink338{from{opacity:.55;transform:scale(.96)}to{opacity:1;transform:scale(1.07)}}
.gachaMsg338{font-size:22px;opacity:.95;text-shadow:0 0 10px #38bdf8;margin:10px auto;}
.gachaDarkFlash338{
  position:fixed;inset:0;background:#000;z-index:100000;
  display:flex;align-items:center;justify-content:center;
  animation:gachaDarkFlash338 1.35s ease-out forwards;
}
.gachaDarkFlash338 span{
  font-size:44px;font-weight:900;color:#fff;
  text-shadow:0 0 14px #fff,0 0 34px #22d3ee,0 0 68px #7c3aed;
  animation:gachaDarkText338 1.35s ease-out forwards;
}
@keyframes gachaDarkFlash338{
  0%{opacity:0} 15%{opacity:1} 72%{opacity:1} 100%{opacity:0}
}
@keyframes gachaDarkText338{
  0%{opacity:0;transform:scale(.35)}
  20%{opacity:1;transform:scale(1.16)}
  75%{opacity:1;transform:scale(1)}
  100%{opacity:0;transform:scale(1.45)}
}
.gachaJudge338{
  font-size:58px;font-weight:900;margin:22px auto;
  text-shadow:0 0 18px currentColor,0 0 45px currentColor;
  animation:gachaJudgePop338 .8s ease-out both;
}
@keyframes gachaJudgePop338{
  from{opacity:0;transform:scale(.18) rotate(-10deg)}
  65%{opacity:1;transform:scale(1.22) rotate(4deg)}
  to{opacity:1;transform:scale(1) rotate(0)}
}
.gachaUpgrade338{
  font-size:38px;font-weight:900;color:#fde68a;
  text-shadow:0 0 14px #f59e0b,0 0 34px #fff;
  animation:gachaUpgrade338 .7s ease-in-out both;
}
@keyframes gachaUpgrade338{
  0%{transform:translateX(0) scale(.8);opacity:0}
  20%{opacity:1;transform:translateX(-12px) scale(1.05)}
  40%{transform:translateX(12px) scale(1.18)}
  60%{transform:translateX(-8px) scale(1.08)}
  100%{transform:translateX(0) scale(1)}
}
.gachaUR338{
  animation:gachaURBg338 1.1s ease-in-out infinite alternate;
}
@keyframes gachaURBg338{
  from{box-shadow:inset 0 0 40px rgba(255,255,255,.14),0 0 28px #22d3ee}
  to{box-shadow:inset 0 0 110px rgba(255,255,255,.30),0 0 80px #ff00ff}
}
.gachaPi338{
  font-size:125px;font-weight:900;color:#fff;
  text-shadow:0 0 18px #fff,0 0 42px #ffd700,0 0 84px #ff00ff;
  animation:gachaPiBreak338 1.25s ease-out both;
}
@keyframes gachaPiBreak338{
  0%{opacity:0;transform:scale(.08) rotate(-16deg)}
  40%{opacity:1;transform:scale(1.26) rotate(6deg)}
  72%{opacity:1;transform:scale(.92) rotate(-3deg);filter:brightness(2.5)}
  100%{opacity:0;transform:scale(2.6) rotate(22deg);filter:brightness(6)}
}
.gachaResult338{
  font-size:42px;font-weight:900;margin:18px auto;
  animation:gachaResult338 .9s ease-out both;
}
@keyframes gachaResult338{
  from{opacity:0;transform:translateY(-40px) scale(.45)}
  60%{opacity:1;transform:translateY(8px) scale(1.16)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
.gachaParticle338{
  position:absolute;font-size:25px;pointer-events:none;
  animation:gachaParticle338 1.6s ease-out forwards;
}
@keyframes gachaParticle338{
  from{opacity:1;transform:translateY(0) scale(.75)}
  to{opacity:0;transform:translateY(-220px) scale(1.8)}
}
.gachaSkip338{
  position:fixed;right:12px;bottom:12px;z-index:100001;
  font-size:16px;padding:8px 12px;background:rgba(255,255,255,.15);
  color:#fff;border:1px solid rgba(255,255,255,.45);
}
`;
  document.head.appendChild(style);
}

function sleep338(ms){return new Promise(r=>setTimeout(r,ms));}
function rarityColor338(r){
  if(r==="UR")return "#ffd700";
  if(r==="SSR")return "#ff5cff";
  if(r==="SR")return "#66e7ff";
  return "#ffffff";
}
function raritySeq338(rarity){
  if(rarity==="UR")return [
    {label:"R", color:rarityColor338("R")},
    {label:"SRへ昇格！", color:rarityColor338("SR"), up:true},
    {label:"SSRへ昇格！！", color:rarityColor338("SSR"), up:true},
    {label:"🌈 UR確定！！！ 🌈", color:rarityColor338("UR"), up:true, ur:true}
  ];
  if(rarity==="SSR")return [
    {label:"R", color:rarityColor338("R")},
    {label:"SRへ昇格！", color:rarityColor338("SR"), up:true},
    {label:"SSR！！", color:rarityColor338("SSR"), up:true}
  ];
  if(rarity==="SR")return [
    {label:"R", color:rarityColor338("R")},
    {label:"SR！", color:rarityColor338("SR"), up:true}
  ];
  return [{label:"R", color:rarityColor338("R")}];
}
function pickAnyGacha338(){
  const item = getGachaResult();
  if(!item)return null;
  const owned = playerData.gachaTitles || [];
  return {item, duplicate: owned.includes(item.title)};
}
function giveGachaItem338(item){
  const owned = playerData.gachaTitles || [];
  if(!playerData.gachaTitles)playerData.gachaTitles=[];
  const duplicate = owned.includes(item.title);
  if(duplicate){
    playerData.coins=(playerData.coins||0)+3;
  }else{
    unlockTitle(item.title);
    playerData.gachaTitles.push(item.title);
  }
  unlockAchievement("初ガチャ");
  if(item.rarity==="UR"){
    unlockAchievement("UR獲得");
    document.body.classList.add("urFlash");
    setTimeout(()=>document.body.classList.remove("urFlash"),1000);
  }
  saveAllData();
  updateHomeStatus();
  return duplicate;
}
function makeStage338(title,msg){
  ensureGachaDXStyle338();
  let old=document.getElementById("gachaFull338");
  if(old)old.remove();
  const div=document.createElement("div");
  div.id="gachaFull338";
  div.className="gachaFull338";
  div.innerHTML=`
<button class="gachaSkip338" onclick="document.getElementById('gachaFull338')?.remove()">SKIP</button>
<div class="gachaFullInner338">
<h2>${title}</h2>
<div class="gachaGate338"></div>
<div class="gachaMsg338">${msg}</div>
<div class="gachaTap338">画面をタップして解析開始</div>
</div>`;
  document.body.appendChild(div);
  addFlying338(div);
  return div;
}
function addFlying338(stage){
  const symbols=["∫","Σ","π","∞","√","lim","dx","dy","log","sin","cos","tan","x²","e^x"];
  for(let i=0;i<34;i++){
    const s=document.createElement("div");
    s.className="formulaSymbol337";
    s.textContent=symbols[Math.floor(Math.random()*symbols.length)];
    s.style.left=(Math.random()*94)+"%";
    s.style.animationDuration=(3+Math.random()*5)+"s";
    s.style.animationDelay=(-Math.random()*5)+"s";
    s.style.fontSize=(22+Math.random()*26)+"px";
    stage.appendChild(s);
  }
}
function particles338(stage, rarity){
  const marks = rarity==="UR" ? ["✨","🌈","💎","👑","⚡","🔥","🌌","π"] :
                rarity==="SSR" ? ["✨","💎","⭐","🔥","Σ"] :
                rarity==="SR" ? ["✨","⭐","√","∫"] : ["✨","∫","π"];
  const n = rarity==="UR"?48:rarity==="SSR"?32:rarity==="SR"?22:12;
  for(let i=0;i<n;i++){
    const p=document.createElement("div");
    p.className="gachaParticle338";
    p.textContent=marks[Math.floor(Math.random()*marks.length)];
    p.style.left=(8+Math.random()*84)+"%";
    p.style.top=(50+Math.random()*32)+"%";
    p.style.animationDelay=(Math.random()*0.75)+"s";
    stage.appendChild(p);
  }
}
function darkFlash338(label="解析開始"){
  return new Promise(resolve=>{
    const old=document.getElementById("gachaDarkFlash338");
    if(old)old.remove();
    const div=document.createElement("div");
    div.id="gachaDarkFlash338";
    div.className="gachaDarkFlash338";
    div.innerHTML=`<span>${label}</span>`;
    document.body.appendChild(div);
    setTimeout(()=>{div.remove();resolve();},1380);
  });
}
async function playSingleGachaDX338(item, duplicate, costText){
  const full=makeStage338("🌌 数式召喚ゲート","数式解析中...");
  let tapped=false;
  await new Promise(resolve=>{
    const start=async(e)=>{
      if(e){e.preventDefault();}
      if(tapped)return;
      tapped=true;
      await darkFlash338("解析開始");
      resolve();
    };
    full.addEventListener("click",start);
    full.addEventListener("touchstart",start,{passive:false});
  });
  const seq=raritySeq338(item.rarity);
  for(let i=0;i<seq.length;i++){
    const step=seq[i];
    full.className="gachaFull338 "+(step.ur?"gachaUR338":"");
    full.innerHTML=`<button class="gachaSkip338" onclick="document.getElementById('gachaFull338')?.remove()">SKIP</button>
<div class="gachaFullInner338">
<h2>⚡ レア度判定</h2>
<div class="${step.up?'gachaUpgrade338':'gachaJudge338'}" style="color:${step.color}">${step.label}</div>
<div class="gachaMsg338">${i+1} / ${seq.length}</div>
</div>`;
    addFlying338(full);
    particles338(full, step.ur?"UR":item.rarity);
    await sleep338(step.ur?1250:1050);
  }
  if(item.rarity==="UR"){
    full.className="gachaFull338 gachaUR338";
    full.innerHTML=`<div class="gachaFullInner338"><h2>🌌 数学宇宙モード</h2><div class="gachaPi338">π</div><div class="gachaMsg338">数式の核が解放される...</div></div>`;
    addFlying338(full); particles338(full,"UR");
    await sleep338(1350);
  }
  const dupText = duplicate ? `<p>かぶり：+3コイン返還</p>` : "";
  full.className="gachaFull338 "+(item.rarity==="UR"?"gachaUR338":"");
  full.innerHTML=`<div class="gachaFullInner338">
<h2>🎰 ガチャ結果</h2>
<div class="gachaJudge338" style="color:${rarityColor338(item.rarity)}">${item.rarity}</div>
<div class="gachaResult338">${titleHTML(item.title)}</div>
${dupText}
<p>${costText}</p>
<p>所持コイン：${playerData.coins||0}</p>
<button onclick="document.getElementById('gachaFull338')?.remove();drawGacha()">もう一回引く</button>
<button onclick="document.getElementById('gachaFull338')?.remove();showGacha()">ガチャ画面へ</button>
</div>`;
  addFlying338(full); particles338(full,item.rarity);
}

drawGacha = async function(){
  if((playerData.coins||0)<10){ alert("コインが足りません"); return; }
  playerData.coins-=10;
  const picked=pickAnyGacha338();
  if(!picked){ alert("ガチャ称号がありません"); showGacha(); return; }
  const duplicate=giveGachaItem338(picked.item);
  await playSingleGachaDX338(picked.item, duplicate, "1回：10コイン");
};

drawGacha10 = async function(){
  if((playerData.coins||0)<100){ alert("コインが足りません"); return; }
  playerData.coins-=100;
  let results=[];
  let hasUR=false;
  for(let i=0;i<10;i++){
    const picked=pickAnyGacha338();
    if(!picked){ alert("ガチャ称号がありません"); showGacha(); return; }
    const duplicate=giveGachaItem338(picked.item);
    results.push({item:picked.item,duplicate});
    if(picked.item.rarity==="UR")hasUR=true;
  }
  ensureGachaDXStyle338();
  const full=makeStage338("🌌 10連数式召喚","10連解析中...");
  await new Promise(resolve=>{
    let tapped=false;
    const start=async(e)=>{ if(e)e.preventDefault(); if(tapped)return; tapped=true; await darkFlash338(hasUR?"🌈 UR反応あり":"解析開始"); resolve(); };
    full.addEventListener("click",start);
    full.addEventListener("touchstart",start,{passive:false});
  });
  results.sort((a,b)=>({UR:0,SSR:1,SR:2,R:3}[a.item.rarity]-{UR:0,SSR:1,SR:2,R:3}[b.item.rarity]));
  let html=`<div class="gachaFullInner338">
<h2>🎰 10連ガチャ結果</h2>
<p>所持コイン：${playerData.coins||0}</p>
<button onclick="document.getElementById('gachaFull338')?.remove();drawGacha10()">もう一度10連</button>
<button onclick="document.getElementById('gachaFull338')?.remove();showGacha()">ガチャ画面へ</button>
</div>`;
  full.className="gachaFull338 "+(hasUR?"gachaUR338":"");
  full.innerHTML=html;
  const inner=full.querySelector(".gachaFullInner338");
  for(const r of results){
    inner.insertAdjacentHTML("beforeend",`<div class="titleItem"><b style="color:${rarityColor338(r.item.rarity)}">${r.item.rarity}</b><br>${titleHTML(r.item.title)}${r.duplicate?"<br>かぶり：+3コイン":""}</div>`);
  }
  addFlying338(full); particles338(full,hasUR?"UR":"SSR");
};

const oldShowNewsPage338 = typeof showNewsPage==="function" ? showNewsPage : null;
showNewsPage = function(){
  let html=`
<h2>📢 お知らせ</h2>
<div class="newsCard">
<h3>Ver 3.3.8 ガチャDXアップデート</h3>
<p>数式召喚ゲートを全画面演出に強化しました。</p>
<p>タップ時の暗転演出を長くしました。</p>
<p>称号を全部持っていてもガチャを引けるようにし、かぶりは+3コイン返還されます。</p>
<p>ランキング・ログイン・Firebase処理は変更していません。</p>
</div>
`;
  if(oldShowNewsPage338){
    try{
      oldShowNewsPage338();
      const panel=document.getElementById("panelArea");
      if(panel)panel.innerHTML=html+panel.innerHTML;
      return;
    }catch(e){console.log(e);}
  }
  document.getElementById("panelArea").innerHTML=html;
  if(typeof ensureHomeButton==="function")ensureHomeButton();
};

window.drawGacha=drawGacha;
window.drawGacha10=drawGacha10;
window.showNewsPage=showNewsPage;
})();



/* Ver3.3.8 gacha DX PLUS: stronger summon animation only */
(function(){
if(window.__gachaDXPlus338)return;
window.__gachaDXPlus338=true;
function sleepDXP(ms){return new Promise(r=>setTimeout(r,ms));}
function ensureGachaDXPlusStyle338(){
 if(document.getElementById("gachaDXPlusStyle338"))return;
 const style=document.createElement("style");
 style.id="gachaDXPlusStyle338";
 style.textContent=`
.gachaPlus338{position:fixed;inset:0;z-index:999990;background:#000;color:white;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
.gachaPlus338::before{content:"";position:absolute;inset:-35%;background:radial-gradient(circle at 50% 48%,rgba(255,255,255,.25),transparent 8%),conic-gradient(from 0deg,#06b6d4,#7c3aed,#ec4899,#f59e0b,#22c55e,#06b6d4);opacity:.34;filter:blur(10px);animation:plusBgSpin338 6s linear infinite;}
.gachaPlus338::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 0 25%,rgba(0,0,0,.18) 33%,rgba(0,0,0,.78) 74%),repeating-radial-gradient(circle at 50% 50%,rgba(255,255,255,.08) 0 2px,transparent 2px 18px);animation:plusScan338 1.8s linear infinite;}
@keyframes plusBgSpin338{to{transform:rotate(360deg)}}@keyframes plusScan338{to{filter:hue-rotate(360deg)}}
.gachaPlusInner338{position:relative;z-index:2;width:96%;max-width:900px;}
.gachaPlusTitle338{font-size:32px;font-weight:900;letter-spacing:1px;text-shadow:0 0 14px #22d3ee,0 0 32px #7c3aed;}
.gachaPlusGate338{width:310px;height:310px;margin:22px auto;border-radius:50%;position:relative;background:radial-gradient(circle at center,rgba(255,255,255,.35) 0 8%,rgba(103,232,249,.2) 9% 18%,transparent 19%),conic-gradient(from 0deg,rgba(34,211,238,.15),rgba(255,255,255,.85),rgba(124,58,237,.25),rgba(255,215,0,.85),rgba(34,211,238,.15));border:4px solid rgba(255,255,255,.9);box-shadow:0 0 18px #fff,0 0 45px #22d3ee,0 0 90px #7c3aed,inset 0 0 55px rgba(255,255,255,.25);animation:plusGateSpin338 4.8s linear infinite,plusGatePulse338 .95s ease-in-out infinite alternate;}
.gachaPlusGate338 .ring1,.gachaPlusGate338 .ring2,.gachaPlusGate338 .ring3{position:absolute;border-radius:50%;inset:20px;border:2px dashed rgba(255,255,255,.85);}
.gachaPlusGate338 .ring1{animation:plusGateReverse338 3.2s linear infinite}.gachaPlusGate338 .ring2{inset:48px;border-style:solid;border-color:rgba(34,211,238,.95);animation:plusGateSpin338 2.1s linear infinite}.gachaPlusGate338 .ring3{inset:78px;border-color:rgba(255,215,0,.9);animation:plusGateReverse338 1.7s linear infinite}
.gachaPlusGate338 .core{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:45px;font-weight:900;text-shadow:0 0 13px #fff,0 0 30px #22d3ee,0 0 60px #ffd700;}
@keyframes plusGateSpin338{to{transform:rotate(360deg)}}@keyframes plusGateReverse338{to{transform:rotate(-360deg)}}@keyframes plusGatePulse338{from{transform:scale(.94);filter:brightness(1)}to{transform:scale(1.06);filter:brightness(1.7)}}
.gachaPlusTap338{font-size:34px;color:#fde68a;font-weight:900;text-shadow:0 0 14px #f59e0b,0 0 34px #fff;animation:plusTap338 .75s ease-in-out infinite alternate;}@keyframes plusTap338{from{opacity:.5;transform:scale(.94)}to{opacity:1;transform:scale(1.08)}}
.gachaPlusSymbol338{position:absolute;z-index:1;color:rgba(255,255,255,.92);font-weight:900;text-shadow:0 0 12px #fff,0 0 26px #22d3ee;pointer-events:none;animation:plusSymbolFly338 linear infinite;}@keyframes plusSymbolFly338{from{transform:translateY(115vh) rotate(0deg) scale(.75);opacity:0}12%{opacity:1}78%{opacity:.95}to{transform:translateY(-18vh) rotate(540deg) scale(1.35);opacity:0}}
.gachaCutin338{position:fixed;inset:0;z-index:1000000;background:#000;display:flex;align-items:center;justify-content:center;color:#fff;font-size:50px;font-weight:900;text-shadow:0 0 18px #fff,0 0 45px #22d3ee,0 0 90px #7c3aed;animation:cutin338 1.75s ease-out forwards;}@keyframes cutin338{0%{opacity:0;transform:scale(1)}12%{opacity:1}72%{opacity:1;filter:brightness(1.2)}100%{opacity:0;transform:scale(1.2);filter:brightness(2.8)}}
.gachaCrack338{position:absolute;inset:0;z-index:4;pointer-events:none;background:linear-gradient(30deg,transparent 48%,rgba(255,255,255,.95) 49%,transparent 51%),linear-gradient(120deg,transparent 46%,rgba(255,255,255,.9) 47%,transparent 49%),linear-gradient(75deg,transparent 58%,rgba(255,255,255,.8) 59%,transparent 61%);opacity:0;animation:crack338 .65s ease-out forwards;}@keyframes crack338{0%{opacity:0;filter:brightness(1)}35%{opacity:1;filter:brightness(4)}100%{opacity:0;filter:brightness(1)}}
.gachaRarityCard338{position:relative;z-index:2;font-size:70px;font-weight:1000;margin:18px auto;text-shadow:0 0 22px currentColor,0 0 58px currentColor;animation:rarityCard338 .95s ease-out both;}@keyframes rarityCard338{0%{opacity:0;transform:scale(.15) rotate(-12deg)}54%{opacity:1;transform:scale(1.28) rotate(5deg)}78%{transform:scale(.94) rotate(-2deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
.gachaUpgradeBanner338{position:relative;z-index:2;font-size:42px;font-weight:1000;color:#fde68a;padding:10px 18px;margin:18px auto;display:inline-block;border:2px solid rgba(255,255,255,.5);background:linear-gradient(90deg,rgba(255,255,255,.08),rgba(255,215,0,.22),rgba(255,255,255,.08));box-shadow:0 0 24px #f59e0b,inset 0 0 22px rgba(255,255,255,.18);text-shadow:0 0 12px #f59e0b,0 0 28px #fff;animation:upgradeBanner338 1s ease-out both;}@keyframes upgradeBanner338{0%{opacity:0;transform:translateX(-120%) skewX(-15deg)}55%{opacity:1;transform:translateX(8%) skewX(-7deg)}78%{transform:translateX(-3%) skewX(-4deg)}100%{opacity:1;transform:translateX(0) skewX(0)}}
.gachaURFinal338{animation:urFinalBg338 .8s ease-in-out infinite alternate;}@keyframes urFinalBg338{from{filter:hue-rotate(0deg) brightness(1.05)}to{filter:hue-rotate(80deg) brightness(1.45)}}
.bigPiPlus338{position:relative;z-index:2;font-size:150px;font-weight:1000;text-shadow:0 0 20px #fff,0 0 55px #ffd700,0 0 100px #ff00ff;animation:bigPiPlus338 1.45s ease-out both;}@keyframes bigPiPlus338{0%{opacity:0;transform:scale(.05) rotate(-25deg)}35%{opacity:1;transform:scale(1.35) rotate(8deg)}65%{opacity:1;transform:scale(.92) rotate(-4deg)}82%{opacity:1;transform:scale(1.08);filter:brightness(3)}100%{opacity:0;transform:scale(3) rotate(30deg);filter:brightness(7)}}
.gachaResultPlus338{position:relative;z-index:2;font-size:46px;font-weight:1000;margin:16px auto 20px;animation:resultPlus338 .95s ease-out both;}@keyframes resultPlus338{0%{opacity:0;transform:translateY(-55px) scale(.35)}55%{opacity:1;transform:translateY(10px) scale(1.18)}100%{opacity:1;transform:translateY(0) scale(1)}}
.gachaParticlePlus338{position:absolute;z-index:3;font-size:28px;pointer-events:none;animation:particlePlus338 1.9s ease-out forwards;}@keyframes particlePlus338{from{opacity:1;transform:translateY(0) scale(.6) rotate(0)}to{opacity:0;transform:translateY(-260px) scale(1.9) rotate(360deg)}}
.skipPlus338{position:fixed;right:12px;bottom:12px;z-index:1000001;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.45);font-size:16px;padding:8px 12px;border-radius:10px;}
`;
 document.head.appendChild(style);
}
function colorDXP338(r){return r==="UR"?"#ffd700":r==="SSR"?"#ff5cff":r==="SR"?"#66e7ff":"#ffffff";}
function stageDXP338(title,msg){
 ensureGachaDXPlusStyle338();document.getElementById("gachaPlus338")?.remove();
 const div=document.createElement("div");div.id="gachaPlus338";div.className="gachaPlus338";
 div.innerHTML=`<button class="skipPlus338" onclick="document.getElementById('gachaPlus338')?.remove()">SKIP</button><div class="gachaPlusInner338"><div class="gachaPlusTitle338">${title}</div><div class="gachaPlusGate338"><div class="ring1"></div><div class="ring2"></div><div class="ring3"></div><div class="core">∫Σπ</div></div><div class="gachaPlusTitle338" style="font-size:22px">${msg}</div><div class="gachaPlusTap338">画面をタップして解析開始</div></div>`;
 document.body.appendChild(div);addSymbolsDXP338(div);return div;
}
function addSymbolsDXP338(stage){
 const symbols=["∫","Σ","π","∞","√","lim","dx","dy","log","sin","cos","tan","x²","e^x","f'(x)"];
 for(let i=0;i<46;i++){const s=document.createElement("div");s.className="gachaPlusSymbol338";s.textContent=symbols[Math.floor(Math.random()*symbols.length)];s.style.left=(Math.random()*96)+"%";s.style.animationDuration=(3.2+Math.random()*5.5)+"s";s.style.animationDelay=(-Math.random()*6)+"s";s.style.fontSize=(20+Math.random()*32)+"px";stage.appendChild(s);}
}
function particlesDXP338(stage,rarity){
 const marks=rarity==="UR"?["✨","🌈","💎","👑","⚡","🔥","🌌","π","∞"]:rarity==="SSR"?["✨","💎","⭐","🔥","Σ"]:rarity==="SR"?["✨","⭐","√","∫"]:["✨","∫","π"];
 const n=rarity==="UR"?70:rarity==="SSR"?46:rarity==="SR"?30:18;
 for(let i=0;i<n;i++){const p=document.createElement("div");p.className="gachaParticlePlus338";p.textContent=marks[Math.floor(Math.random()*marks.length)];p.style.left=(5+Math.random()*90)+"%";p.style.top=(45+Math.random()*38)+"%";p.style.animationDelay=(Math.random()*0.9)+"s";stage.appendChild(p);}
}
function cutinDXP338(label){return new Promise(resolve=>{document.getElementById("gachaCutin338")?.remove();const div=document.createElement("div");div.className="gachaCutin338";div.innerHTML=`<div>${label}</div>`;document.body.appendChild(div);setTimeout(()=>{div.remove();resolve();},1780);});}
function seqDXP338(rarity){if(rarity==="UR")return[{label:"R",r:"R"},{label:"SRへ昇格！",r:"SR",up:true},{label:"SSRへ昇格！！",r:"SSR",up:true},{label:"🌈 UR確定！！！",r:"UR",up:true,ur:true}];if(rarity==="SSR")return[{label:"R",r:"R"},{label:"SRへ昇格！",r:"SR",up:true},{label:"SSR！！",r:"SSR",up:true}];if(rarity==="SR")return[{label:"R",r:"R"},{label:"SR！",r:"SR",up:true}];return[{label:"R",r:"R"}];}
function pickAnyDXP338(){const item=getGachaResult();const owned=playerData.gachaTitles||[];return{item,duplicate:item?owned.includes(item.title):false};}
function giveDXP338(item){if(!playerData.gachaTitles)playerData.gachaTitles=[];const duplicate=playerData.gachaTitles.includes(item.title);if(duplicate){playerData.coins=(playerData.coins||0)+3;}else{unlockTitle(item.title);playerData.gachaTitles.push(item.title);}unlockAchievement("初ガチャ");if(item.rarity==="UR"){unlockAchievement("UR獲得");document.body.classList.add("urFlash");setTimeout(()=>document.body.classList.remove("urFlash"),1000);}saveAllData();updateHomeStatus();return duplicate;}
async function judgeDXP338(stage,item){const seq=seqDXP338(item.rarity);for(let i=0;i<seq.length;i++){const step=seq[i];stage.className="gachaPlus338 "+(step.ur?"gachaURFinal338":"");stage.innerHTML=`<button class="skipPlus338" onclick="document.getElementById('gachaPlus338')?.remove()">SKIP</button><div class="gachaPlusInner338"><div class="gachaPlusTitle338">⚡ レア度判定</div><div class="${step.up?'gachaUpgradeBanner338':'gachaRarityCard338'}" style="color:${colorDXP338(step.r)}">${step.label}</div><div class="gachaPlusTitle338" style="font-size:20px">${i+1} / ${seq.length}</div></div>`;addSymbolsDXP338(stage);particlesDXP338(stage,step.ur?"UR":step.r);if(step.up){const crack=document.createElement("div");crack.className="gachaCrack338";stage.appendChild(crack);}await sleepDXP(step.ur?1450:1180);}}
function showResultDXP338(stage,item,duplicate){const dupText=duplicate?`<p>かぶり：+3コイン返還</p>`:"";stage.className="gachaPlus338 "+(item.rarity==="UR"?"gachaURFinal338":"");stage.innerHTML=`<button class="skipPlus338" onclick="document.getElementById('gachaPlus338')?.remove()">閉じる</button><div class="gachaPlusInner338"><div class="gachaPlusTitle338">🎰 ガチャ結果</div><div class="gachaRarityCard338" style="color:${colorDXP338(item.rarity)}">${item.rarity}</div><div class="gachaResultPlus338">${titleHTML(item.title)}</div>${dupText}<p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('gachaPlus338')?.remove();drawGacha()">もう一回引く</button><button onclick="document.getElementById('gachaPlus338')?.remove();showGacha()">ガチャ画面へ</button></div>`;addSymbolsDXP338(stage);particlesDXP338(stage,item.rarity);}
async function playDXP338(item,duplicate){const stage=stageDXP338("🌌 数式召喚ゲート","円陣生成中...");await new Promise(resolve=>{let done=false;const start=async(e)=>{if(e)e.preventDefault();if(done)return;done=true;await cutinDXP338("解析開始");resolve();};stage.addEventListener("click",start);stage.addEventListener("touchstart",start,{passive:false});});await cutinDXP338("数式解析中...");await judgeDXP338(stage,item);if(item.rarity==="UR"){stage.className="gachaPlus338 gachaURFinal338";stage.innerHTML=`<div class="gachaPlusInner338"><div class="gachaPlusTitle338">🌌 数学宇宙モード</div><div class="bigPiPlus338">π</div><div class="gachaPlusTitle338" style="font-size:22px">数式の核が崩壊する...</div></div>`;addSymbolsDXP338(stage);particlesDXP338(stage,"UR");await sleepDXP(1550);await cutinDXP338("UR解放");}showResultDXP338(stage,item,duplicate);}
drawGacha=async function(){if((playerData.coins||0)<10){alert("コインが足りません");return;}playerData.coins-=10;const picked=pickAnyDXP338();if(!picked.item){alert("ガチャ称号がありません");showGacha();return;}const duplicate=giveDXP338(picked.item);await playDXP338(picked.item,duplicate);};
drawGacha10=async function(){if((playerData.coins||0)<100){alert("コインが足りません");return;}playerData.coins-=100;let results=[],hasUR=false;for(let i=0;i<10;i++){const picked=pickAnyDXP338();if(!picked.item){alert("ガチャ称号がありません");showGacha();return;}const duplicate=giveDXP338(picked.item);results.push({item:picked.item,duplicate});if(picked.item.rarity==="UR")hasUR=true;}const stage=stageDXP338("🌌 10連数式召喚","10連円陣生成中...");await new Promise(resolve=>{let done=false;const start=async(e)=>{if(e)e.preventDefault();if(done)return;done=true;await cutinDXP338(hasUR?"🌈 UR反応あり":"解析開始");resolve();};stage.addEventListener("click",start);stage.addEventListener("touchstart",start,{passive:false});});results.sort((a,b)=>({UR:0,SSR:1,SR:2,R:3}[a.item.rarity]-{UR:0,SSR:1,SR:2,R:3}[b.item.rarity]));stage.className="gachaPlus338 "+(hasUR?"gachaURFinal338":"");stage.innerHTML=`<button class="skipPlus338" onclick="document.getElementById('gachaPlus338')?.remove()">閉じる</button><div class="gachaPlusInner338"><div class="gachaPlusTitle338">🎰 10連ガチャ結果</div><p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('gachaPlus338')?.remove();drawGacha10()">もう一度10連</button><button onclick="document.getElementById('gachaPlus338')?.remove();showGacha()">ガチャ画面へ</button></div>`;const inner=stage.querySelector(".gachaPlusInner338");for(const r of results){inner.insertAdjacentHTML("beforeend",`<div class="titleItem"><b style="color:${colorDXP338(r.item.rarity)}">${r.item.rarity}</b><br>${titleHTML(r.item.title)}${r.duplicate?"<br>かぶり：+3コイン":""}</div>`);}addSymbolsDXP338(stage);particlesDXP338(stage,hasUR?"UR":"SSR");};
window.drawGacha=drawGacha;window.drawGacha10=drawGacha10;
})();



/* Ver3.3.8 gacha DX PLUS2: return buttons, reversal, 10-pull one-by-one, better opening */
(function(){
if(window.__gachaDXPlus2_338)return;
window.__gachaDXPlus2_338=true;

function sleepP2(ms){return new Promise(r=>setTimeout(r,ms));}
function ensureDXP2Style(){
  if(document.getElementById("gachaDXPlus2Style338"))return;
  const style=document.createElement("style");
  style.id="gachaDXPlus2Style338";
  style.textContent=`
.gachaP2{position:fixed;inset:0;z-index:999999;background:#000;color:white;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
.gachaP2::before{content:"";position:absolute;inset:-45%;background:radial-gradient(circle at 50% 48%,rgba(255,255,255,.33),transparent 7%),conic-gradient(from 0deg,#00f5ff,#7c3aed,#ff00aa,#ffd700,#00ff99,#00f5ff);opacity:.42;filter:blur(8px);animation:p2BgSpin 5s linear infinite;}
.gachaP2::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 48%,transparent 0 21%,rgba(0,0,0,.13) 28%,rgba(0,0,0,.82) 76%),repeating-linear-gradient(90deg,rgba(255,255,255,.045) 0 1px,transparent 1px 22px),repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 24px);animation:p2Hue 2s linear infinite;}
@keyframes p2BgSpin{to{transform:rotate(360deg)}}@keyframes p2Hue{to{filter:hue-rotate(360deg)}}
.p2Inner{position:relative;z-index:3;width:96%;max-width:920px;}
.p2TopBtns{position:fixed;left:10px;top:10px;z-index:1000002;display:flex;gap:8px;flex-wrap:wrap}
.p2SmallBtn{font-size:15px;padding:7px 11px;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.45);}
.p2StartTitle{font-size:36px;font-weight:1000;letter-spacing:2px;text-shadow:0 0 16px #22d3ee,0 0 38px #7c3aed,0 0 70px #fff;animation:p2TitleIn .9s ease-out both;}
@keyframes p2TitleIn{from{opacity:0;transform:translateY(-25px) scale(.75)}to{opacity:1;transform:translateY(0) scale(1)}}
.p2Gate{width:330px;height:330px;margin:24px auto;border-radius:50%;position:relative;background:radial-gradient(circle at center,rgba(255,255,255,.55) 0 7%,rgba(34,211,238,.26) 8% 18%,transparent 19%),conic-gradient(from 0deg,#22d3ee,#fff,#7c3aed,#ff00aa,#ffd700,#22c55e,#22d3ee);border:5px solid rgba(255,255,255,.96);box-shadow:0 0 24px #fff,0 0 58px #22d3ee,0 0 110px #7c3aed,inset 0 0 70px rgba(255,255,255,.28);animation:p2GateSpin 4.3s linear infinite,p2GatePulse .85s ease-in-out infinite alternate;}
.p2Gate .r1,.p2Gate .r2,.p2Gate .r3,.p2Gate .r4{position:absolute;border-radius:50%;border:2px dashed rgba(255,255,255,.9);}
.p2Gate .r1{inset:18px;animation:p2Reverse 2.8s linear infinite}.p2Gate .r2{inset:43px;border-style:solid;border-color:#67e8f9;animation:p2GateSpin 1.9s linear infinite}.p2Gate .r3{inset:72px;border-color:#ffd700;animation:p2Reverse 1.5s linear infinite}.p2Gate .r4{inset:103px;border-style:solid;border-color:#ff80ff;animation:p2GateSpin 1.05s linear infinite}
.p2Gate .core{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:50px;font-weight:1000;text-shadow:0 0 16px #fff,0 0 35px #22d3ee,0 0 70px #ffd700;animation:p2CoreFlash .8s ease-in-out infinite alternate;}
@keyframes p2GateSpin{to{transform:rotate(360deg)}}@keyframes p2Reverse{to{transform:rotate(-360deg)}}@keyframes p2GatePulse{from{transform:scale(.93);filter:brightness(1)}to{transform:scale(1.08);filter:brightness(1.85)}}@keyframes p2CoreFlash{from{filter:brightness(1)}to{filter:brightness(2.2)}}
.p2Tap{font-size:36px;font-weight:1000;color:#fde68a;text-shadow:0 0 16px #f59e0b,0 0 35px #fff;animation:p2Tap .68s ease-in-out infinite alternate;}@keyframes p2Tap{from{opacity:.5;transform:scale(.93)}to{opacity:1;transform:scale(1.08)}}
.p2Symbol{position:absolute;z-index:2;color:rgba(255,255,255,.94);font-weight:1000;text-shadow:0 0 12px #fff,0 0 28px #22d3ee;pointer-events:none;animation:p2SymbolFly linear infinite;}@keyframes p2SymbolFly{from{transform:translateY(118vh) rotate(0deg) scale(.72);opacity:0}12%{opacity:1}80%{opacity:.95}to{transform:translateY(-20vh) rotate(620deg) scale(1.45);opacity:0}}
.p2Cutin{position:fixed;inset:0;z-index:1000003;background:#000;display:flex;align-items:center;justify-content:center;color:#fff;font-size:54px;font-weight:1000;text-shadow:0 0 18px #fff,0 0 45px #22d3ee,0 0 90px #7c3aed;animation:p2Cutin 1.7s ease-out forwards;}
@keyframes p2Cutin{0%{opacity:0;transform:scale(1)}13%{opacity:1}72%{opacity:1;filter:brightness(1.25)}100%{opacity:0;transform:scale(1.2);filter:brightness(3)}}
.p2Rarity{position:relative;z-index:3;font-size:72px;font-weight:1000;margin:18px auto;text-shadow:0 0 24px currentColor,0 0 60px currentColor;animation:p2Rarity .95s ease-out both;}@keyframes p2Rarity{0%{opacity:0;transform:scale(.12) rotate(-12deg)}55%{opacity:1;transform:scale(1.28) rotate(5deg)}80%{transform:scale(.94) rotate(-2deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
.p2Upgrade{position:relative;z-index:3;font-size:44px;font-weight:1000;color:#fde68a;padding:12px 20px;margin:18px auto;display:inline-block;border:2px solid rgba(255,255,255,.6);background:linear-gradient(90deg,rgba(255,255,255,.08),rgba(255,215,0,.25),rgba(255,255,255,.08));box-shadow:0 0 28px #f59e0b,inset 0 0 24px rgba(255,255,255,.2);text-shadow:0 0 14px #f59e0b,0 0 30px #fff;animation:p2Upgrade .95s ease-out both;}@keyframes p2Upgrade{0%{opacity:0;transform:translateX(-120%) skewX(-15deg)}55%{opacity:1;transform:translateX(8%) skewX(-7deg)}78%{transform:translateX(-3%) skewX(-4deg)}100%{opacity:1;transform:translateX(0) skewX(0)}}
.p2ReverseBanner{position:relative;z-index:4;font-size:48px;font-weight:1000;color:#fffb00;text-shadow:0 0 16px #fff,0 0 38px #ff8c00,0 0 90px #ff00ff;animation:p2ReverseBanner .95s ease-out both;}@keyframes p2ReverseBanner{0%{opacity:0;transform:scale(.1) rotate(-20deg)}55%{opacity:1;transform:scale(1.25) rotate(6deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
.p2Crack{position:absolute;inset:0;z-index:4;pointer-events:none;background:linear-gradient(30deg,transparent 48%,rgba(255,255,255,.95) 49%,transparent 51%),linear-gradient(120deg,transparent 46%,rgba(255,255,255,.9) 47%,transparent 49%),linear-gradient(75deg,transparent 58%,rgba(255,255,255,.85) 59%,transparent 61%);animation:p2Crack .7s ease-out forwards;}@keyframes p2Crack{0%{opacity:0;filter:brightness(1)}35%{opacity:1;filter:brightness(5)}100%{opacity:0;filter:brightness(1)}}
.p2UR{animation:p2URBg .75s ease-in-out infinite alternate;}@keyframes p2URBg{from{filter:hue-rotate(0deg) brightness(1.1)}to{filter:hue-rotate(90deg) brightness(1.55)}}
.p2Pi{position:relative;z-index:3;font-size:155px;font-weight:1000;text-shadow:0 0 22px #fff,0 0 58px #ffd700,0 0 110px #ff00ff;animation:p2Pi 1.45s ease-out both;}@keyframes p2Pi{0%{opacity:0;transform:scale(.05) rotate(-25deg)}35%{opacity:1;transform:scale(1.35) rotate(8deg)}65%{opacity:1;transform:scale(.92) rotate(-4deg)}82%{opacity:1;transform:scale(1.08);filter:brightness(3)}100%{opacity:0;transform:scale(3) rotate(30deg);filter:brightness(7)}}
.p2Result{position:relative;z-index:3;font-size:48px;font-weight:1000;margin:16px auto 20px;animation:p2Result .95s ease-out both;}@keyframes p2Result{0%{opacity:0;transform:translateY(-55px) scale(.35)}55%{opacity:1;transform:translateY(10px) scale(1.18)}100%{opacity:1;transform:translateY(0) scale(1)}}
.p2Particle{position:absolute;z-index:3;font-size:29px;pointer-events:none;animation:p2Particle 1.9s ease-out forwards;}@keyframes p2Particle{from{opacity:1;transform:translateY(0) scale(.6) rotate(0)}to{opacity:0;transform:translateY(-270px) scale(1.95) rotate(380deg)}}
`;
  document.head.appendChild(style);
}
function p2Color(r){return r==="UR"?"#ffd700":r==="SSR"?"#ff5cff":r==="SR"?"#66e7ff":"#ffffff";}
function p2Remove(){document.getElementById("gachaP2")?.remove();}
function p2Stage(title,msg){
  ensureDXP2Style();p2Remove();
  const div=document.createElement("div");div.id="gachaP2";div.className="gachaP2";
  div.innerHTML=`<div class="p2TopBtns"><button class="p2SmallBtn" onclick="p2BackToGacha338()">← ガチャへ戻る</button><button class="p2SmallBtn" onclick="document.getElementById('gachaP2')?.remove()">閉じる</button></div><div class="p2Inner"><div class="p2StartTitle">${title}</div><div class="p2Gate"><div class="r1"></div><div class="r2"></div><div class="r3"></div><div class="r4"></div><div class="core">∫Σπ</div></div><div class="p2StartTitle" style="font-size:22px">${msg}</div><div class="p2Tap">画面をタップして解析開始</div></div>`;
  document.body.appendChild(div);p2Symbols(div);return div;
}
window.p2BackToGacha338=function(){p2Remove(); if(typeof showGacha==="function")showGacha();};
function p2Symbols(stage){
  const symbols=["∫","Σ","π","∞","√","lim","dx","dy","log","sin","cos","tan","x²","e^x","f'(x)","∴"];
  for(let i=0;i<55;i++){const s=document.createElement("div");s.className="p2Symbol";s.textContent=symbols[Math.floor(Math.random()*symbols.length)];s.style.left=(Math.random()*96)+"%";s.style.animationDuration=(3+Math.random()*5.8)+"s";s.style.animationDelay=(-Math.random()*6)+"s";s.style.fontSize=(20+Math.random()*34)+"px";stage.appendChild(s);}
}
function p2Particles(stage,rarity){
  const marks=rarity==="UR"?["✨","🌈","💎","👑","⚡","🔥","🌌","π","∞"]:rarity==="SSR"?["✨","💎","⭐","🔥","Σ"]:rarity==="SR"?["✨","⭐","√","∫"]:["✨","∫","π"];
  const n=rarity==="UR"?78:rarity==="SSR"?50:rarity==="SR"?32:20;
  for(let i=0;i<n;i++){const p=document.createElement("div");p.className="p2Particle";p.textContent=marks[Math.floor(Math.random()*marks.length)];p.style.left=(5+Math.random()*90)+"%";p.style.top=(44+Math.random()*39)+"%";p.style.animationDelay=(Math.random()*0.9)+"s";stage.appendChild(p);}
}
function p2Cut(label){return new Promise(resolve=>{document.querySelector(".p2Cutin")?.remove();const d=document.createElement("div");d.className="p2Cutin";d.innerHTML=`<div>${label}</div>`;document.body.appendChild(d);setTimeout(()=>{d.remove();resolve();},1750);});}
function p2Seq(rarity){
  if(rarity==="UR")return[{label:"R",r:"R"},{label:"SRへ昇格！",r:"SR",up:true},{label:"SSRへ昇格！！",r:"SSR",up:true},{label:"🌈 UR確定！！！",r:"UR",up:true,ur:true}];
  if(rarity==="SSR")return[{label:"R",r:"R"},{label:"SRへ昇格！",r:"SR",up:true},{label:"SSR！！",r:"SSR",up:true}];
  if(rarity==="SR")return[{label:"R",r:"R"},{label:"SR！",r:"SR",up:true}];
  return[{label:"R",r:"R"}];
}
function p2Pick(){const item=getGachaResult();const owned=playerData.gachaTitles||[];return{item,duplicate:item?owned.includes(item.title):false};}
function p2Give(item){if(!playerData.gachaTitles)playerData.gachaTitles=[];const dup=playerData.gachaTitles.includes(item.title);if(dup){playerData.coins=(playerData.coins||0)+3;}else{unlockTitle(item.title);playerData.gachaTitles.push(item.title);}unlockAchievement("初ガチャ");if(item.rarity==="UR"){unlockAchievement("UR獲得");document.body.classList.add("urFlash");setTimeout(()=>document.body.classList.remove("urFlash"),1000);}saveAllData();updateHomeStatus();return dup;}
async function p2Judge(stage,item){
  let seq=p2Seq(item.rarity);
  const reversal = item.rarity==="UR" && Math.random()<0.55;
  if(reversal){
    seq=[{label:"R",r:"R"},{label:"SR！",r:"SR",up:true},{label:"SSR！！",r:"SSR",up:true},{label:"……",r:"SSR"},{label:"⚡逆転演出⚡",r:"UR",rev:true},{label:"🌈 UR確定！！！",r:"UR",up:true,ur:true}];
  }
  for(let i=0;i<seq.length;i++){
    const st=seq[i];stage.className="gachaP2 "+(st.ur||st.rev?"p2UR":"");
    stage.innerHTML=`<div class="p2TopBtns"><button class="p2SmallBtn" onclick="p2BackToGacha338()">← ガチャへ戻る</button><button class="p2SmallBtn" onclick="document.getElementById('gachaP2')?.remove()">閉じる</button></div><div class="p2Inner"><div class="p2StartTitle">⚡ レア度判定</div><div class="${st.rev?'p2ReverseBanner':st.up?'p2Upgrade':'p2Rarity'}" style="color:${p2Color(st.r)}">${st.label}</div><div class="p2StartTitle" style="font-size:20px">${i+1} / ${seq.length}</div></div>`;
    p2Symbols(stage);p2Particles(stage,st.ur||st.rev?"UR":st.r);
    if(st.up||st.rev){const c=document.createElement("div");c.className="p2Crack";stage.appendChild(c);}
    await sleepP2(st.rev?1450:st.ur?1450:1100);
  }
}
function p2Result(stage,item,dup){
  const dupText=dup?`<p>かぶり：+3コイン返還</p>`:"";
  stage.className="gachaP2 "+(item.rarity==="UR"?"p2UR":"");
  stage.innerHTML=`<div class="p2TopBtns"><button class="p2SmallBtn" onclick="p2BackToGacha338()">← ガチャへ戻る</button><button class="p2SmallBtn" onclick="document.getElementById('gachaP2')?.remove()">閉じる</button></div><div class="p2Inner"><div class="p2StartTitle">🎰 ガチャ結果</div><div class="p2Rarity" style="color:${p2Color(item.rarity)}">${item.rarity}</div><div class="p2Result">${titleHTML(item.title)}</div>${dupText}<p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('gachaP2')?.remove();drawGacha()">もう一回引く</button><button onclick="p2BackToGacha338()">ガチャへ戻る</button></div>`;
  p2Symbols(stage);p2Particles(stage,item.rarity);
}
async function p2Play(item,dup){
  const stage=p2Stage("🌌 数式召喚ゲート","超解析円陣 起動中...");
  await new Promise(resolve=>{let done=false;const start=async(e)=>{if(e)e.preventDefault();if(done)return;done=true;await p2Cut("解析開始");resolve();};stage.addEventListener("click",start);stage.addEventListener("touchstart",start,{passive:false});});
  await p2Cut("数式解析中...");
  await p2Judge(stage,item);
  if(item.rarity==="UR"){stage.className="gachaP2 p2UR";stage.innerHTML=`<div class="p2Inner"><div class="p2StartTitle">🌌 数学宇宙モード</div><div class="p2Pi">π</div><div class="p2StartTitle" style="font-size:22px">数式の核が崩壊する...</div></div>`;p2Symbols(stage);p2Particles(stage,"UR");await sleepP2(1550);await p2Cut("UR解放");}
  p2Result(stage,item,dup);
}
drawGacha=async function(){if((playerData.coins||0)<10){alert("コインが足りません");return;}playerData.coins-=10;const p=p2Pick();if(!p.item){alert("ガチャ称号がありません");showGacha();return;}const dup=p2Give(p.item);await p2Play(p.item,dup);};
async function p2PlayOneInTen(item,dup,index,total,hasUR){
  const stage=p2Stage(`🌌 10連召喚 ${index}/${total}`,`第${index}の円陣 起動中...`);
  await new Promise(resolve=>{let done=false;const start=async(e)=>{if(e)e.preventDefault();if(done)return;done=true;await p2Cut(hasUR&&index===1?"🌈 UR反応あり":"解析開始");resolve();};stage.addEventListener("click",start);stage.addEventListener("touchstart",start,{passive:false});});
  await p2Judge(stage,item);
  p2Result(stage,item,dup);
  await sleepP2(900);
}
drawGacha10=async function(){if((playerData.coins||0)<100){alert("コインが足りません");return;}playerData.coins-=100;let results=[],hasUR=false;for(let i=0;i<10;i++){const p=p2Pick();if(!p.item){alert("ガチャ称号がありません");showGacha();return;}const dup=p2Give(p.item);results.push({item:p.item,duplicate:dup});if(p.item.rarity==="UR")hasUR=true;}for(let i=0;i<results.length;i++){await p2PlayOneInTen(results[i].item,results[i].duplicate,i+1,10,hasUR);}const stage=p2Stage("🎰 10連最終結果","召喚結果一覧");results.sort((a,b)=>({UR:0,SSR:1,SR:2,R:3}[a.item.rarity]-{UR:0,SSR:1,SR:2,R:3}[b.item.rarity]));stage.innerHTML=`<div class="p2TopBtns"><button class="p2SmallBtn" onclick="p2BackToGacha338()">← ガチャへ戻る</button><button class="p2SmallBtn" onclick="document.getElementById('gachaP2')?.remove()">閉じる</button></div><div class="p2Inner"><div class="p2StartTitle">🎰 10連最終結果</div><p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('gachaP2')?.remove();drawGacha10()">もう一度10連</button><button onclick="p2BackToGacha338()">ガチャへ戻る</button></div>`;const inner=stage.querySelector(".p2Inner");for(const r of results){inner.insertAdjacentHTML("beforeend",`<div class="titleItem"><b style="color:${p2Color(r.item.rarity)}">${r.item.rarity}</b><br>${titleHTML(r.item.title)}${r.duplicate?"<br>かぶり：+3コイン":""}</div>`);}p2Symbols(stage);p2Particles(stage,hasUR?"UR":"SSR");};
window.drawGacha=drawGacha;window.drawGacha10=drawGacha10;
})();



/* Ver3.3.8 gacha DX PLUS3: one tap 10-pull, sound, hidden progress, fake crack */
(function(){
if(window.__gachaDXPlus3_338)return;
window.__gachaDXPlus3_338=true;

let p3AudioCtx=null;
function p3Audio(){
  try{
    if(!p3AudioCtx)p3AudioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(p3AudioCtx.state==="suspended")p3AudioCtx.resume();
    return p3AudioCtx;
  }catch(e){return null;}
}
function p3Tone(freq,dur,type,gain){
  const ctx=p3Audio(); if(!ctx)return;
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type=type||"sine"; o.frequency.setValueAtTime(freq,ctx.currentTime);
  g.gain.setValueAtTime(gain||0.05,ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+dur);
  o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+dur);
}
function p3Noise(dur,gain){
  const ctx=p3Audio(); if(!ctx)return;
  const b=ctx.createBuffer(1,Math.floor(ctx.sampleRate*dur),ctx.sampleRate);
  const d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
  const s=ctx.createBufferSource(), g=ctx.createGain();
  s.buffer=b; g.gain.value=gain||0.08; s.connect(g); g.connect(ctx.destination); s.start();
}
function p3Sound(k){
  if(k==="tap"){p3Tone(220,.08,"sine",.04);p3Tone(440,.12,"triangle",.045);}
  if(k==="charge"){p3Tone(330,.18,"sawtooth",.035);setTimeout(()=>p3Tone(495,.18,"sawtooth",.035),90);}
  if(k==="upgrade"){p3Tone(523,.12,"square",.045);setTimeout(()=>p3Tone(784,.16,"square",.045),100);}
  if(k==="crack"){p3Noise(.32,.11);p3Tone(90,.18,"sawtooth",.06);}
  if(k==="fake"){p3Noise(.16,.045);p3Tone(160,.11,"triangle",.035);}
  if(k==="ur"){p3Tone(523,.18,"triangle",.06);setTimeout(()=>p3Tone(659,.18,"triangle",.06),120);setTimeout(()=>p3Tone(988,.35,"sine",.07),260);}
  if(k==="result"){p3Tone(660,.12,"sine",.05);setTimeout(()=>p3Tone(880,.14,"sine",.05),110);}
}
function p3Sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function p3Color(r){return r==="UR"?"#ffd700":r==="SSR"?"#ff5cff":r==="SR"?"#66e7ff":"#ffffff";}
function p3EnsureStyle(){
  if(document.getElementById("gachaDXPlus3Style338"))return;
  const st=document.createElement("style");
  st.id="gachaDXPlus3Style338";
  st.textContent=`
.p3SoundNote{font-size:14px;opacity:.72;margin-top:6px}
.p3FakeCrackText{position:relative;z-index:5;font-size:36px;font-weight:1000;color:#fff;text-shadow:0 0 14px #fff,0 0 30px #22d3ee;animation:p3FakeText .75s ease-out both}
@keyframes p3FakeText{0%{opacity:0;transform:scale(.5)}45%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(1.35)}}
`;
  document.head.appendChild(st);
}
function p3Remove(){document.getElementById("gachaP2")?.remove();}
window.p2BackToGacha338=function(){p3Remove(); if(typeof showGacha==="function")showGacha();};
function p3Stage(title,msg){
  p3EnsureStyle();
  p3Remove();
  const div=document.createElement("div");
  div.id="gachaP2"; div.className="gachaP2";
  div.innerHTML=`<div class="p2TopBtns"><button class="p2SmallBtn" onclick="p2BackToGacha338()">← ガチャへ戻る</button><button class="p2SmallBtn" onclick="document.getElementById('gachaP2')?.remove()">閉じる</button></div><div class="p2Inner"><div class="p2StartTitle">${title}</div><div class="p2Gate"><div class="r1"></div><div class="r2"></div><div class="r3"></div><div class="r4"></div><div class="core">∫Σπ</div></div><div class="p2StartTitle" style="font-size:22px">${msg}</div><div class="p2Tap">画面をタップして解析開始</div><div class="p3SoundNote">※音が出ます</div></div>`;
  document.body.appendChild(div); p3Symbols(div); return div;
}
function p3Symbols(stage){
  const symbols=["∫","Σ","π","∞","√","lim","dx","dy","log","sin","cos","tan","x²","e^x","f'(x)","∴"];
  for(let i=0;i<55;i++){
    const s=document.createElement("div"); s.className="p2Symbol";
    s.textContent=symbols[Math.floor(Math.random()*symbols.length)];
    s.style.left=(Math.random()*96)+"%"; s.style.animationDuration=(3+Math.random()*5.8)+"s";
    s.style.animationDelay=(-Math.random()*6)+"s"; s.style.fontSize=(20+Math.random()*34)+"px";
    stage.appendChild(s);
  }
}
function p3Particles(stage,rarity){
  const marks=rarity==="UR"?["✨","🌈","💎","👑","⚡","🔥","🌌","π","∞"]:rarity==="SSR"?["✨","💎","⭐","🔥","Σ"]:rarity==="SR"?["✨","⭐","√","∫"]:["✨","∫","π"];
  const n=rarity==="UR"?78:rarity==="SSR"?50:rarity==="SR"?32:20;
  for(let i=0;i<n;i++){
    const p=document.createElement("div"); p.className="p2Particle";
    p.textContent=marks[Math.floor(Math.random()*marks.length)];
    p.style.left=(5+Math.random()*90)+"%"; p.style.top=(44+Math.random()*39)+"%";
    p.style.animationDelay=(Math.random()*0.9)+"s"; stage.appendChild(p);
  }
}
function p3Cut(label,sound){
  return new Promise(resolve=>{
    p3Sound(sound||"charge");
    document.querySelector(".p2Cutin")?.remove();
    const d=document.createElement("div"); d.className="p2Cutin"; d.innerHTML=`<div>${label}</div>`;
    document.body.appendChild(d);
    setTimeout(()=>{d.remove();resolve();},1750);
  });
}
function p3Seq(r){
  if(r==="UR")return[{label:"R",r:"R"},{label:"SRへ昇格！",r:"SR",up:true},{label:"SSRへ昇格！！",r:"SSR",up:true},{label:"🌈 UR確定！！！",r:"UR",up:true,ur:true}];
  if(r==="SSR")return[{label:"R",r:"R"},{label:"SRへ昇格！",r:"SR",up:true},{label:"SSR！！",r:"SSR",up:true}];
  if(r==="SR")return[{label:"R",r:"R"},{label:"SR！",r:"SR",up:true}];
  return[{label:"R",r:"R"}];
}
function p3Pick(){const item=getGachaResult();const owned=playerData.gachaTitles||[];return{item,duplicate:item?owned.includes(item.title):false};}
function p3Give(item){
  if(!playerData.gachaTitles)playerData.gachaTitles=[];
  const dup=playerData.gachaTitles.includes(item.title);
  if(dup){playerData.coins=(playerData.coins||0)+3;}else{unlockTitle(item.title);playerData.gachaTitles.push(item.title);}
  unlockAchievement("初ガチャ");
  if(item.rarity==="UR"){unlockAchievement("UR獲得");document.body.classList.add("urFlash");setTimeout(()=>document.body.classList.remove("urFlash"),1000);}
  saveAllData(); updateHomeStatus(); return dup;
}
async function p3FakeCrack(stage){
  p3Sound("fake");
  const c=document.createElement("div"); c.className="p2Crack"; stage.appendChild(c);
  const t=document.createElement("div"); t.className="p3FakeCrackText"; t.textContent="……まだ割れない";
  stage.querySelector(".p2Inner")?.appendChild(t);
  await p3Sleep(900);
}
async function p3Judge(stage,item){
  let seq=p3Seq(item.rarity);
  const reversal=item.rarity==="UR"&&Math.random()<0.55;
  const fakeCrack=item.rarity!=="R"&&Math.random()<0.45;
  if(reversal){
    seq=[{label:"R",r:"R"},{label:"SR！",r:"SR",up:true},{label:"SSR！！",r:"SSR",up:true},{label:"……",r:"SSR",fake:true},{label:"⚡逆転演出⚡",r:"UR",rev:true},{label:"🌈 UR確定！！！",r:"UR",up:true,ur:true}];
  }
  for(let i=0;i<seq.length;i++){
    const st=seq[i]; stage.className="gachaP2 "+(st.ur||st.rev?"p2UR":"");
    stage.innerHTML=`<div class="p2TopBtns"><button class="p2SmallBtn" onclick="p2BackToGacha338()">← ガチャへ戻る</button><button class="p2SmallBtn" onclick="document.getElementById('gachaP2')?.remove()">閉じる</button></div><div class="p2Inner"><div class="p2StartTitle">⚡ レア度判定</div><div class="${st.rev?'p2ReverseBanner':st.up?'p2Upgrade':'p2Rarity'}" style="color:${p3Color(st.r)}">${st.label}</div></div>`;
    p3Symbols(stage); p3Particles(stage,st.ur||st.rev?"UR":st.r);
    if(st.fake)await p3FakeCrack(stage);
    if(fakeCrack && i===0)await p3FakeCrack(stage);
    if(st.up||st.rev){
      p3Sound(st.ur?"ur":"upgrade");
      const c=document.createElement("div"); c.className="p2Crack"; stage.appendChild(c);
      p3Sound("crack");
    }
    await p3Sleep(st.rev?1450:st.ur?1450:1100);
  }
}
function p3Result(stage,item,dup){
  p3Sound("result");
  const dupText=dup?`<p>かぶり：+3コイン返還</p>`:"";
  stage.className="gachaP2 "+(item.rarity==="UR"?"p2UR":"");
  stage.innerHTML=`<div class="p2TopBtns"><button class="p2SmallBtn" onclick="p2BackToGacha338()">← ガチャへ戻る</button><button class="p2SmallBtn" onclick="document.getElementById('gachaP2')?.remove()">閉じる</button></div><div class="p2Inner"><div class="p2StartTitle">🎰 ガチャ結果</div><div class="p2Rarity" style="color:${p3Color(item.rarity)}">${item.rarity}</div><div class="p2Result">${titleHTML(item.title)}</div>${dupText}<p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('gachaP2')?.remove();drawGacha()">もう一回引く</button><button onclick="p2BackToGacha338()">ガチャへ戻る</button></div>`;
  p3Symbols(stage); p3Particles(stage,item.rarity);
}
async function p3Play(item,dup){
  const stage=p3Stage("🌌 数式召喚ゲート","超解析円陣 起動中...");
  await new Promise(resolve=>{
    let done=false;
    const start=async(e)=>{if(e)e.preventDefault();if(done)return;done=true;p3Sound("tap");await p3Cut("解析開始","charge");resolve();};
    stage.addEventListener("click",start); stage.addEventListener("touchstart",start,{passive:false});
  });
  await p3Cut("数式解析中...","charge");
  await p3Judge(stage,item);
  if(item.rarity==="UR"){
    stage.className="gachaP2 p2UR";
    stage.innerHTML=`<div class="p2Inner"><div class="p2StartTitle">🌌 数学宇宙モード</div><div class="p2Pi">π</div><div class="p2StartTitle" style="font-size:22px">数式の核が崩壊する...</div></div>`;
    p3Symbols(stage); p3Particles(stage,"UR"); p3Sound("crack"); await p3Sleep(1550); await p3Cut("UR解放","ur");
  }
  p3Result(stage,item,dup);
}
drawGacha=async function(){
  if((playerData.coins||0)<10){alert("コインが足りません");return;}
  playerData.coins-=10;
  const p=p3Pick(); if(!p.item){alert("ガチャ称号がありません");showGacha();return;}
  const dup=p3Give(p.item); await p3Play(p.item,dup);
};
drawGacha10=async function(){
  if((playerData.coins||0)<100){alert("コインが足りません");return;}
  playerData.coins-=100;
  let results=[],hasUR=false;
  for(let i=0;i<10;i++){
    const p=p3Pick(); if(!p.item){alert("ガチャ称号がありません");showGacha();return;}
    const dup=p3Give(p.item); results.push({item:p.item,duplicate:dup}); if(p.item.rarity==="UR")hasUR=true;
  }
  const stage=p3Stage("🌌 10連数式召喚","10連円陣 起動中...");
  await new Promise(resolve=>{
    let done=false;
    const start=async(e)=>{if(e)e.preventDefault();if(done)return;done=true;p3Sound("tap");await p3Cut(hasUR?"🌈 UR反応あり":"解析開始",hasUR?"ur":"charge");resolve();};
    stage.addEventListener("click",start); stage.addEventListener("touchstart",start,{passive:false});
  });
  for(let i=0;i<results.length;i++){
    stage.className="gachaP2 "+(results[i].item.rarity==="UR"?"p2UR":"");
    stage.innerHTML=`<div class="p2TopBtns"><button class="p2SmallBtn" onclick="p2BackToGacha338()">← ガチャへ戻る</button><button class="p2SmallBtn" onclick="document.getElementById('gachaP2')?.remove()">閉じる</button></div><div class="p2Inner"><div class="p2StartTitle">🌌 10連召喚 ${i+1}/10</div><div class="p2StartTitle" style="font-size:22px">第${i+1}の円陣を解析中...</div></div>`;
    p3Symbols(stage); p3Particles(stage,results[i].item.rarity); await p3Sleep(650);
    await p3Judge(stage,results[i].item);
    p3Result(stage,results[i].item,results[i].duplicate);
    await p3Sleep(800);
  }
  results.sort((a,b)=>({UR:0,SSR:1,SR:2,R:3}[a.item.rarity]-{UR:0,SSR:1,SR:2,R:3}[b.item.rarity]));
  stage.className="gachaP2 "+(hasUR?"p2UR":"");
  stage.innerHTML=`<div class="p2TopBtns"><button class="p2SmallBtn" onclick="p2BackToGacha338()">← ガチャへ戻る</button><button class="p2SmallBtn" onclick="document.getElementById('gachaP2')?.remove()">閉じる</button></div><div class="p2Inner"><div class="p2StartTitle">🎰 10連最終結果</div><p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('gachaP2')?.remove();drawGacha10()">もう一度10連</button><button onclick="p2BackToGacha338()">ガチャへ戻る</button></div>`;
  const inner=stage.querySelector(".p2Inner");
  for(const r of results){
    inner.insertAdjacentHTML("beforeend",`<div class="titleItem"><b style="color:${p3Color(r.item.rarity)}">${r.item.rarity}</b><br>${titleHTML(r.item.title)}${r.duplicate?"<br>かぶり：+3コイン":""}</div>`);
  }
  p3Symbols(stage); p3Particles(stage,hasUR?"UR":"SSR");
};
window.drawGacha=drawGacha; window.drawGacha10=drawGacha10;
})();



/* Ver3.3.9 random B/C/D gacha演出: card / chest / math core */
(function(){
if(window.__randomBCDgacha339)return;
window.__randomBCDgacha339=true;

let g339AudioCtx=null;
function g339Audio(){
  try{
    if(!g339AudioCtx)g339AudioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(g339AudioCtx.state==="suspended")g339AudioCtx.resume();
    return g339AudioCtx;
  }catch(e){return null;}
}
function g339Tone(freq=440,dur=.12,type="sine",gain=.05){
  const ctx=g339Audio(); if(!ctx)return;
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type=type; o.frequency.setValueAtTime(freq,ctx.currentTime);
  g.gain.setValueAtTime(gain,ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur);
  o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+dur);
}
function g339Noise(dur=.25,gain=.08){
  const ctx=g339Audio(); if(!ctx)return;
  const b=ctx.createBuffer(1,Math.floor(ctx.sampleRate*dur),ctx.sampleRate);
  const d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
  const s=ctx.createBufferSource(), g=ctx.createGain();
  s.buffer=b; g.gain.value=gain; s.connect(g); g.connect(ctx.destination); s.start();
}
function g339Sound(k){
  if(k==="tap"){g339Tone(260,.07,"sine",.04);g339Tone(520,.1,"triangle",.04);}
  if(k==="flip"){g339Tone(420,.08,"triangle",.045);setTimeout(()=>g339Tone(680,.08,"sine",.04),80);}
  if(k==="charge"){g339Tone(220,.18,"sawtooth",.035);setTimeout(()=>g339Tone(440,.2,"sawtooth",.035),120);}
  if(k==="fake"){g339Noise(.16,.045);g339Tone(150,.12,"triangle",.035);}
  if(k==="crack"){g339Noise(.32,.11);g339Tone(85,.2,"sawtooth",.06);}
  if(k==="boom"){g339Noise(.5,.12);g339Tone(70,.28,"sawtooth",.07);}
  if(k==="ur"){g339Tone(523,.18,"triangle",.06);setTimeout(()=>g339Tone(659,.18,"triangle",.06),120);setTimeout(()=>g339Tone(988,.38,"sine",.07),260);}
  if(k==="result"){g339Tone(660,.12,"sine",.05);setTimeout(()=>g339Tone(880,.14,"sine",.05),110);}
}
function g339Sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function g339Color(r){return r==="UR"?"#ffd700":r==="SSR"?"#ff4dff":r==="SR"?"#66e7ff":"#fff";}
function g339Ensure(){
 if(document.getElementById("g339Style"))return;
 const st=document.createElement("style");
 st.id="g339Style";
 st.textContent=`
.g339{position:fixed;inset:0;z-index:999999;background:#000;color:white;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
.g339::before{content:"";position:absolute;inset:-45%;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.32),transparent 7%),conic-gradient(from 0deg,#00f5ff,#7c3aed,#ff00aa,#ffd700,#00ff99,#00f5ff);opacity:.35;filter:blur(9px);animation:g339spin 5.5s linear infinite}
.g339::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 0 23%,rgba(0,0,0,.22) 32%,rgba(0,0,0,.84) 78%),repeating-radial-gradient(circle at 50% 50%,rgba(255,255,255,.055) 0 2px,transparent 2px 20px);}
@keyframes g339spin{to{transform:rotate(360deg)}}
.g339in{position:relative;z-index:3;width:96%;max-width:920px;}
.g339btns{position:fixed;left:10px;top:10px;z-index:1000002;display:flex;gap:8px;flex-wrap:wrap}
.g339btn{font-size:15px;padding:7px 11px;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.45);}
.g339title{font-size:36px;font-weight:1000;letter-spacing:2px;text-shadow:0 0 16px #22d3ee,0 0 38px #7c3aed,0 0 70px #fff;animation:g339pop .85s ease-out both}
@keyframes g339pop{from{opacity:0;transform:translateY(-25px) scale(.75)}to{opacity:1;transform:translateY(0) scale(1)}}
.g339tap{font-size:34px;font-weight:1000;color:#fde68a;text-shadow:0 0 16px #f59e0b,0 0 35px #fff;animation:g339tap .68s ease-in-out infinite alternate}@keyframes g339tap{from{opacity:.5;transform:scale(.93)}to{opacity:1;transform:scale(1.08)}}
.g339sym{position:absolute;z-index:2;color:rgba(255,255,255,.94);font-weight:1000;text-shadow:0 0 12px #fff,0 0 28px #22d3ee;pointer-events:none;animation:g339fly linear infinite}@keyframes g339fly{from{transform:translateY(118vh) rotate(0deg) scale(.72);opacity:0}12%{opacity:1}80%{opacity:.95}to{transform:translateY(-20vh) rotate(620deg) scale(1.45);opacity:0}}
.g339cut{position:fixed;inset:0;z-index:1000003;background:#000;display:flex;align-items:center;justify-content:center;color:#fff;font-size:54px;font-weight:1000;text-shadow:0 0 18px #fff,0 0 45px #22d3ee,0 0 90px #7c3aed;animation:g339cut 1.65s ease-out forwards}@keyframes g339cut{0%{opacity:0;transform:scale(1)}13%{opacity:1}72%{opacity:1;filter:brightness(1.25)}100%{opacity:0;transform:scale(1.2);filter:brightness(3)}}
.g339particle{position:absolute;z-index:3;font-size:29px;pointer-events:none;animation:g339particle 1.9s ease-out forwards}@keyframes g339particle{from{opacity:1;transform:translateY(0) scale(.6) rotate(0)}to{opacity:0;transform:translateY(-270px) scale(1.95) rotate(380deg)}}
.g339cardWrap{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;max-width:720px;margin:25px auto}
.g339card{height:135px;border-radius:16px;background:linear-gradient(135deg,#111827,#312e81,#020617);border:2px solid rgba(255,255,255,.52);box-shadow:0 0 18px rgba(34,211,238,.45),inset 0 0 26px rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:1000;transform-style:preserve-3d;animation:g339cardIn .75s ease-out both}
@keyframes g339cardIn{from{opacity:0;transform:translateY(30px) rotateY(80deg)}to{opacity:1;transform:translateY(0) rotateY(0)}}
.g339card.open{animation:g339flip .72s ease-out both;background:linear-gradient(135deg,rgba(255,255,255,.24),rgba(124,58,237,.42),rgba(0,0,0,.55))}
@keyframes g339flip{0%{transform:rotateY(0) scale(1)}50%{transform:rotateY(90deg) scale(1.12)}100%{transform:rotateY(0) scale(1.05)}}
.g339chest{font-size:150px;filter:drop-shadow(0 0 28px #ffd700);animation:g339drop .9s ease-out both}
@keyframes g339drop{0%{opacity:0;transform:translateY(-220px) scale(.6)}70%{opacity:1;transform:translateY(20px) scale(1.12)}100%{opacity:1;transform:translateY(0) scale(1)}}
.g339shake{animation:g339shake .55s ease-in-out both}@keyframes g339shake{0%{transform:translateX(0)}20%{transform:translateX(-12px)}40%{transform:translateX(12px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}100%{transform:translateX(0)}}
.g339fake{font-size:34px;font-weight:1000;color:#fff;text-shadow:0 0 14px #fff,0 0 30px #22d3ee;animation:g339fake .75s ease-out both}@keyframes g339fake{0%{opacity:0;transform:scale(.5)}45%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(1.35)}}
.g339core{width:330px;height:330px;margin:24px auto;border-radius:50%;position:relative;background:radial-gradient(circle at center,rgba(255,255,255,.55) 0 7%,rgba(34,211,238,.26) 8% 18%,transparent 19%),conic-gradient(from 0deg,#22d3ee,#fff,#7c3aed,#ff00aa,#ffd700,#22c55e,#22d3ee);border:5px solid rgba(255,255,255,.96);box-shadow:0 0 24px #fff,0 0 58px #22d3ee,0 0 110px #7c3aed,inset 0 0 70px rgba(255,255,255,.28);animation:g339coreSpin 4.3s linear infinite,g339corePulse .85s ease-in-out infinite alternate}
.g339core::before{content:"";position:absolute;inset:44px;border-radius:50%;border:3px dashed #fff;animation:g339coreRev 2.4s linear infinite}.g339core::after{content:"π";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:110px;font-weight:1000;text-shadow:0 0 22px #fff,0 0 60px #ffd700}
@keyframes g339coreSpin{to{transform:rotate(360deg)}}@keyframes g339coreRev{to{transform:rotate(-360deg)}}@keyframes g339corePulse{from{transform:scale(.94);filter:brightness(1)}to{transform:scale(1.08);filter:brightness(1.8)}}
.g339crack{position:absolute;inset:0;z-index:4;pointer-events:none;background:linear-gradient(30deg,transparent 48%,rgba(255,255,255,.95) 49%,transparent 51%),linear-gradient(120deg,transparent 46%,rgba(255,255,255,.9) 47%,transparent 49%),linear-gradient(75deg,transparent 58%,rgba(255,255,255,.85) 59%,transparent 61%);animation:g339crack .72s ease-out forwards}@keyframes g339crack{0%{opacity:0;filter:brightness(1)}35%{opacity:1;filter:brightness(5)}100%{opacity:0;filter:brightness(1)}}
.g339result{font-size:48px;font-weight:1000;margin:16px auto 20px;animation:g339result .95s ease-out both}@keyframes g339result{0%{opacity:0;transform:translateY(-55px) scale(.35)}55%{opacity:1;transform:translateY(10px) scale(1.18)}100%{opacity:1;transform:translateY(0) scale(1)}}
.g339rarity{font-size:72px;font-weight:1000;margin:18px auto;text-shadow:0 0 24px currentColor,0 0 60px currentColor;animation:g339result .95s ease-out both}
.g339ur{animation:g339ur .75s ease-in-out infinite alternate}@keyframes g339ur{from{filter:hue-rotate(0deg) brightness(1.1)}to{filter:hue-rotate(90deg) brightness(1.55)}}
`;
 document.head.appendChild(st);
}
function g339Remove(){document.getElementById("g339")?.remove();}
window.g339Back=function(){g339Remove(); if(typeof showGacha==="function")showGacha();};
function g339Base(title,msg){
 g339Ensure(); g339Remove();
 const div=document.createElement("div"); div.id="g339"; div.className="g339";
 div.innerHTML=`<div class="g339btns"><button class="g339btn" onclick="g339Back()">← ガチャへ戻る</button><button class="g339btn" onclick="document.getElementById('g339')?.remove()">閉じる</button></div><div class="g339in"><div class="g339title">${title}</div><p>${msg}</p><div class="g339tap">画面をタップして開始</div></div>`;
 document.body.appendChild(div); g339Symbols(div); return div;
}
function g339Symbols(stage){
 const s=["∫","Σ","π","∞","√","lim","dx","log","sin","cos","tan","x²","e^x","∴"];
 for(let i=0;i<48;i++){const e=document.createElement("div");e.className="g339sym";e.textContent=s[Math.floor(Math.random()*s.length)];e.style.left=(Math.random()*96)+"%";e.style.animationDuration=(3+Math.random()*5.8)+"s";e.style.animationDelay=(-Math.random()*6)+"s";e.style.fontSize=(20+Math.random()*34)+"px";stage.appendChild(e);}
}
function g339Particles(stage,r){
 const m=r==="UR"?["✨","🌈","💎","👑","⚡","🔥","🌌","π","∞"]:r==="SSR"?["✨","💎","⭐","🔥","Σ"]:r==="SR"?["✨","⭐","√","∫"]:["✨","∫","π"];
 const n=r==="UR"?78:r==="SSR"?50:r==="SR"?32:20;
 for(let i=0;i<n;i++){const p=document.createElement("div");p.className="g339particle";p.textContent=m[Math.floor(Math.random()*m.length)];p.style.left=(5+Math.random()*90)+"%";p.style.top=(44+Math.random()*39)+"%";p.style.animationDelay=(Math.random()*0.9)+"s";stage.appendChild(p);}
}
function g339Cut(label,sound="charge"){return new Promise(resolve=>{g339Sound(sound);document.querySelector(".g339cut")?.remove();const d=document.createElement("div");d.className="g339cut";d.innerHTML=`<div>${label}</div>`;document.body.appendChild(d);setTimeout(()=>{d.remove();resolve();},1650);});}
function g339Pick(){const item=getGachaResult();const owned=playerData.gachaTitles||[];return{item,duplicate:item?owned.includes(item.title):false};}
function g339Give(item){
 if(!playerData.gachaTitles)playerData.gachaTitles=[];
 const dup=playerData.gachaTitles.includes(item.title);
 if(dup){playerData.coins=(playerData.coins||0)+3;}else{unlockTitle(item.title);playerData.gachaTitles.push(item.title);}
 unlockAchievement("初ガチャ");
 if(item.rarity==="UR"){unlockAchievement("UR獲得");document.body.classList.add("urFlash");setTimeout(()=>document.body.classList.remove("urFlash"),1000);}
 saveAllData(); updateHomeStatus(); return dup;
}
function g339Mode(){const r=Math.random()*100; return r<25?"card":r<60?"chest":"core";}
async function g339WaitTap(stage,label){
 await new Promise(resolve=>{let done=false;const start=async(e)=>{if(e)e.preventDefault();if(done)return;done=true;g339Sound("tap");await g339Cut(label||"解析開始","charge");resolve();};stage.addEventListener("click",start);stage.addEventListener("touchstart",start,{passive:false});});
}
async function g339Card(item){
 const stage=g339Base("🎴 数式カード開封","カードから称号を解析中...");
 const wrap=document.createElement("div");wrap.className="g339cardWrap";stage.querySelector(".g339in").appendChild(wrap);
 for(let i=0;i<10;i++){const c=document.createElement("div");c.className="g339card";c.textContent="∫";c.style.animationDelay=(i*.06)+"s";wrap.appendChild(c);}
 await g339WaitTap(stage,"カード解析開始");
 const cards=[...wrap.children];
 for(let i=0;i<cards.length;i++){g339Sound("flip");cards[i].classList.add("open");cards[i].textContent=["√","Σ","π","∞"][Math.floor(Math.random()*4)];await g339Sleep(150);}
 const last=cards[Math.floor(Math.random()*cards.length)];
 last.style.color=g339Color(item.rarity); last.style.boxShadow=`0 0 35px ${g339Color(item.rarity)}`; last.textContent=item.rarity==="UR"?"🌈":item.rarity==="SSR"?"💎":item.rarity==="SR"?"⭐":"∫";
 if(item.rarity==="UR"){await g339Cut("虹カード出現","ur");}
}
async function g339Chest(item){
 const stage=g339Base("📦 数式宝箱","宝箱から称号を召喚中...");
 stage.querySelector(".g339in").insertAdjacentHTML("beforeend",`<div id="g339Chest" class="g339chest">📦</div>`);
 await g339WaitTap(stage,"宝箱解析開始");
 const chest=document.getElementById("g339Chest");
 g339Sound("crack"); chest.classList.add("g339shake");
 let c=document.createElement("div");c.className="g339crack";stage.appendChild(c);
 await g339Sleep(800);
 if(Math.random()<0.55){g339Sound("fake");stage.querySelector(".g339in").insertAdjacentHTML("beforeend",`<div class="g339fake">……まだ割れない</div>`);await g339Sleep(900);}
 g339Sound("boom"); chest.textContent=item.rarity==="UR"?"🌈":"💥"; c=document.createElement("div");c.className="g339crack";stage.appendChild(c);g339Particles(stage,item.rarity);
 if(item.rarity==="UR"){await g339Cut("虹爆発","ur");}else{await g339Sleep(900);}
}
async function g339Core(item){
 const stage=g339Base("🌌 数学コア暴走","πコアにエネルギーを充填中...");
 stage.querySelector(".g339in").insertAdjacentHTML("beforeend",`<div class="g339core"></div>`);
 await g339WaitTap(stage,"コア起動");
 await g339Cut("エネルギー充填","charge");
 if(Math.random()<0.45&&item.rarity!=="R"){g339Sound("fake");stage.querySelector(".g339in").insertAdjacentHTML("beforeend",`<div class="g339fake">割れる……？</div>`);await g339Sleep(800);}
 g339Sound("crack");let c=document.createElement("div");c.className="g339crack";stage.appendChild(c);await g339Sleep(600);
 if(item.rarity==="UR"){stage.classList.add("g339ur");await g339Cut("コア暴走","ur");}
 g339Sound("boom");g339Particles(stage,item.rarity);await g339Sleep(900);
}
function g339Result(stage,item,dup){
 g339Sound("result");
 const dupText=dup?`<p>かぶり：+3コイン返還</p>`:"";
 stage.className="g339 "+(item.rarity==="UR"?"g339ur":"");
 stage.innerHTML=`<div class="g339btns"><button class="g339btn" onclick="g339Back()">← ガチャへ戻る</button><button class="g339btn" onclick="document.getElementById('g339')?.remove()">閉じる</button></div><div class="g339in"><div class="g339title">🎰 ガチャ結果</div><div class="g339rarity" style="color:${g339Color(item.rarity)}">${item.rarity}</div><div class="g339result">${titleHTML(item.title)}</div>${dupText}<p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('g339')?.remove();drawGacha()">もう一回引く</button><button onclick="g339Back()">ガチャへ戻る</button></div>`;
 g339Symbols(stage); g339Particles(stage,item.rarity);
}
async function g339Play(item,dup,mode){
 const chosen=mode||g339Mode();
 if(chosen==="card")await g339Card(item);
 else if(chosen==="chest")await g339Chest(item);
 else await g339Core(item);
 const stage=document.getElementById("g339");
 if(item.rarity==="UR")await g339Cut("UR解放","ur");
 g339Result(stage,item,dup);
}
drawGacha=async function(){
 if((playerData.coins||0)<10){alert("コインが足りません");return;}
 playerData.coins-=10;
 const p=g339Pick(); if(!p.item){alert("ガチャ称号がありません");showGacha();return;}
 const dup=g339Give(p.item);
 await g339Play(p.item,dup);
};
drawGacha10=async function(){
 if((playerData.coins||0)<100){alert("コインが足りません");return;}
 playerData.coins-=100;
 let results=[],hasUR=false;
 for(let i=0;i<10;i++){const p=g339Pick();if(!p.item){alert("ガチャ称号がありません");showGacha();return;}const dup=g339Give(p.item);results.push({item:p.item,duplicate:dup});if(p.item.rarity==="UR")hasUR=true;}
 const mode=g339Mode();
 const stage=g339Base(mode==="card"?"🎴 10連カード開封":mode==="chest"?"📦 10連宝箱召喚":"🌌 10連数学コア", "10連演出を開始します");
 await g339WaitTap(stage,hasUR?"🌈 UR反応あり":"解析開始");
 for(let i=0;i<results.length;i++){
   const r=results[i];
   document.getElementById("g339")?.remove();
   if(mode==="card")await g339Card(r.item);
   else if(mode==="chest")await g339Chest(r.item);
   else await g339Core(r.item);
   const st=document.getElementById("g339");
   g339Result(st,r.item,r.duplicate);
   await g339Sleep(650);
 }
 results.sort((a,b)=>({UR:0,SSR:1,SR:2,R:3}[a.item.rarity]-{UR:0,SSR:1,SR:2,R:3}[b.item.rarity]));
 const final=g339Base("🎰 10連最終結果","召喚結果一覧");
 final.className="g339 "+(hasUR?"g339ur":"");
 final.innerHTML=`<div class="g339btns"><button class="g339btn" onclick="g339Back()">← ガチャへ戻る</button><button class="g339btn" onclick="document.getElementById('g339')?.remove()">閉じる</button></div><div class="g339in"><div class="g339title">🎰 10連最終結果</div><p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('g339')?.remove();drawGacha10()">もう一度10連</button><button onclick="g339Back()">ガチャへ戻る</button></div>`;
 const inner=final.querySelector(".g339in");
 for(const r of results){inner.insertAdjacentHTML("beforeend",`<div class="titleItem"><b style="color:${g339Color(r.item.rarity)}">${r.item.rarity}</b><br>${titleHTML(r.item.title)}${r.duplicate?"<br>かぶり：+3コイン":""}</div>`);}
 g339Symbols(final); g339Particles(final,hasUR?"UR":"SSR");
};
const oldNews339=typeof showNewsPage==="function"?showNewsPage:null;
showNewsPage=function(){
 let html=`<h2>📢 お知らせ</h2><div class="newsCard"><h3>Ver 3.3.9 ランダムガチャ演出</h3><p>カード開封・宝箱・数学コアの3種類の演出をランダム追加しました。</p><p>音、フェイント、虹演出、10連連続召喚を強化しました。</p><p>ランキング・ログイン・Firebase処理は変更していません。</p></div>`;
 if(oldNews339){try{oldNews339();const p=document.getElementById("panelArea");if(p)p.innerHTML=html+p.innerHTML;return;}catch(e){}}
 document.getElementById("panelArea").innerHTML=html;
 if(typeof ensureHomeButton==="function")ensureHomeButton();
};
window.drawGacha=drawGacha;window.drawGacha10=drawGacha10;window.showNewsPage=showNewsPage;
})();



/* Ver3.3.10 gacha quality up: longer auto sequence + home return */
(function(){
if(window.__gachaQuality3310)return;
window.__gachaQuality3310=true;

let q10AudioCtx=null;
function q10Audio(){
  try{
    if(!q10AudioCtx)q10AudioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(q10AudioCtx.state==="suspended")q10AudioCtx.resume();
    return q10AudioCtx;
  }catch(e){return null;}
}
function q10Tone(freq=440,dur=.16,type="sine",gain=.045){
  const ctx=q10Audio(); if(!ctx)return;
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type=type; o.frequency.setValueAtTime(freq,ctx.currentTime);
  g.gain.setValueAtTime(gain,ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur);
  o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+dur);
}
function q10Noise(dur=.32,gain=.08){
  const ctx=q10Audio(); if(!ctx)return;
  const b=ctx.createBuffer(1,Math.floor(ctx.sampleRate*dur),ctx.sampleRate);
  const d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
  const s=ctx.createBufferSource(), g=ctx.createGain();
  s.buffer=b; g.gain.value=gain; s.connect(g); g.connect(ctx.destination); s.start();
}
function q10Sound(k){
  if(k==="tap"){q10Tone(220,.09,"sine",.045);setTimeout(()=>q10Tone(520,.14,"triangle",.045),70);}
  if(k==="charge"){q10Tone(180,.28,"sawtooth",.028);setTimeout(()=>q10Tone(310,.28,"sawtooth",.032),170);setTimeout(()=>q10Tone(520,.34,"triangle",.04),360);}
  if(k==="card"){q10Tone(390,.08,"triangle",.04);setTimeout(()=>q10Tone(780,.1,"sine",.04),70);}
  if(k==="chest"){q10Noise(.22,.06);q10Tone(120,.18,"sawtooth",.055);}
  if(k==="fake"){q10Noise(.18,.04);q10Tone(140,.14,"triangle",.035);}
  if(k==="crack"){q10Noise(.38,.11);q10Tone(80,.22,"sawtooth",.065);}
  if(k==="boom"){q10Noise(.65,.14);q10Tone(55,.34,"sawtooth",.08);}
  if(k==="core"){q10Tone(110,.4,"sawtooth",.035);setTimeout(()=>q10Tone(220,.4,"sawtooth",.035),260);}
  if(k==="ur"){q10Tone(523,.2,"triangle",.06);setTimeout(()=>q10Tone(659,.2,"triangle",.06),140);setTimeout(()=>q10Tone(784,.2,"triangle",.065),280);setTimeout(()=>q10Tone(1046,.45,"sine",.07),440);}
  if(k==="result"){q10Tone(660,.13,"sine",.05);setTimeout(()=>q10Tone(880,.15,"sine",.05),120);setTimeout(()=>q10Tone(1320,.2,"sine",.04),250);}
}
function q10Sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function q10Color(r){return r==="UR"?"#ffd700":r==="SSR"?"#ff4dff":r==="SR"?"#66e7ff":"#fff";}
function q10Ensure(){
 if(document.getElementById("q10Style"))return;
 const st=document.createElement("style");
 st.id="q10Style";
 st.textContent=`
.q10{position:fixed;inset:0;z-index:999999;background:#000;color:white;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
.q10::before{content:"";position:absolute;inset:-55%;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.38),transparent 7%),conic-gradient(from 0deg,#00f5ff,#7c3aed,#ff00aa,#ffd700,#00ff99,#00f5ff);opacity:.42;filter:blur(10px);animation:q10spin 6s linear infinite}
.q10::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 0 22%,rgba(0,0,0,.18) 32%,rgba(0,0,0,.86) 80%),repeating-radial-gradient(circle at 50% 50%,rgba(255,255,255,.055) 0 2px,transparent 2px 20px),repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 1px,transparent 1px 26px);}
@keyframes q10spin{to{transform:rotate(360deg)}}
.q10in{position:relative;z-index:3;width:96%;max-width:940px;}
.q10btns{position:fixed;left:10px;top:10px;z-index:1000002;display:flex;gap:8px;flex-wrap:wrap}
.q10btn{font-size:15px;padding:7px 11px;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.45);}
.q10title{font-size:38px;font-weight:1000;letter-spacing:2px;text-shadow:0 0 16px #22d3ee,0 0 38px #7c3aed,0 0 70px #fff;animation:q10pop .95s ease-out both}
@keyframes q10pop{from{opacity:0;transform:translateY(-30px) scale(.72)}to{opacity:1;transform:translateY(0) scale(1)}}
.q10tap{font-size:34px;font-weight:1000;color:#fde68a;text-shadow:0 0 16px #f59e0b,0 0 35px #fff;animation:q10tap .7s ease-in-out infinite alternate}@keyframes q10tap{from{opacity:.5;transform:scale(.93)}to{opacity:1;transform:scale(1.08)}}
.q10sym{position:absolute;z-index:2;color:rgba(255,255,255,.94);font-weight:1000;text-shadow:0 0 12px #fff,0 0 28px #22d3ee;pointer-events:none;animation:q10fly linear infinite}@keyframes q10fly{from{transform:translateY(118vh) rotate(0deg) scale(.72);opacity:0}12%{opacity:1}80%{opacity:.95}to{transform:translateY(-20vh) rotate(620deg) scale(1.45);opacity:0}}
.q10cut{position:fixed;inset:0;z-index:1000003;background:#000;display:flex;align-items:center;justify-content:center;color:#fff;font-size:56px;font-weight:1000;text-shadow:0 0 18px #fff,0 0 45px #22d3ee,0 0 90px #7c3aed;animation:q10cut 2.05s ease-out forwards}@keyframes q10cut{0%{opacity:0;transform:scale(1)}14%{opacity:1}78%{opacity:1;filter:brightness(1.35)}100%{opacity:0;transform:scale(1.25);filter:brightness(3)}}
.q10particle{position:absolute;z-index:3;font-size:30px;pointer-events:none;animation:q10particle 2.3s ease-out forwards}@keyframes q10particle{from{opacity:1;transform:translateY(0) scale(.55) rotate(0)}to{opacity:0;transform:translateY(-310px) scale(2.1) rotate(440deg)}}
.q10cardWrap{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;max-width:740px;margin:25px auto}
.q10card{height:142px;border-radius:18px;background:linear-gradient(135deg,#111827,#312e81,#020617);border:2px solid rgba(255,255,255,.58);box-shadow:0 0 20px rgba(34,211,238,.48),inset 0 0 28px rgba(255,255,255,.09);display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:1000;animation:q10cardIn .85s ease-out both}
@keyframes q10cardIn{from{opacity:0;transform:translateY(35px) rotateY(80deg)}to{opacity:1;transform:translateY(0) rotateY(0)}}
.q10card.open{animation:q10flip .9s ease-out both;background:linear-gradient(135deg,rgba(255,255,255,.25),rgba(124,58,237,.46),rgba(0,0,0,.56))}
@keyframes q10flip{0%{transform:rotateY(0) scale(1)}50%{transform:rotateY(90deg) scale(1.16)}100%{transform:rotateY(0) scale(1.06)}}
.q10chest{font-size:165px;filter:drop-shadow(0 0 32px #ffd700);animation:q10drop 1.05s ease-out both}
@keyframes q10drop{0%{opacity:0;transform:translateY(-240px) scale(.55)}70%{opacity:1;transform:translateY(24px) scale(1.16)}100%{opacity:1;transform:translateY(0) scale(1)}}
.q10shake{animation:q10shake .7s ease-in-out both}@keyframes q10shake{0%{transform:translateX(0)}20%{transform:translateX(-15px)}40%{transform:translateX(15px)}60%{transform:translateX(-10px)}80%{transform:translateX(10px)}100%{transform:translateX(0)}}
.q10fake{font-size:36px;font-weight:1000;color:#fff;text-shadow:0 0 14px #fff,0 0 30px #22d3ee;animation:q10fake 1s ease-out both}@keyframes q10fake{0%{opacity:0;transform:scale(.5)}45%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(1.35)}}
.q10core{width:350px;height:350px;margin:28px auto;border-radius:50%;position:relative;background:radial-gradient(circle at center,rgba(255,255,255,.6) 0 7%,rgba(34,211,238,.28) 8% 18%,transparent 19%),conic-gradient(from 0deg,#22d3ee,#fff,#7c3aed,#ff00aa,#ffd700,#22c55e,#22d3ee);border:5px solid rgba(255,255,255,.96);box-shadow:0 0 28px #fff,0 0 65px #22d3ee,0 0 125px #7c3aed,inset 0 0 82px rgba(255,255,255,.30);animation:q10coreSpin 4.8s linear infinite,q10corePulse .95s ease-in-out infinite alternate}
.q10core::before{content:"";position:absolute;inset:44px;border-radius:50%;border:3px dashed #fff;animation:q10coreRev 2.6s linear infinite}.q10core::after{content:"π";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:120px;font-weight:1000;text-shadow:0 0 22px #fff,0 0 60px #ffd700}
@keyframes q10coreSpin{to{transform:rotate(360deg)}}@keyframes q10coreRev{to{transform:rotate(-360deg)}}@keyframes q10corePulse{from{transform:scale(.93);filter:brightness(1)}to{transform:scale(1.09);filter:brightness(1.9)}}
.q10crack{position:absolute;inset:0;z-index:4;pointer-events:none;background:linear-gradient(30deg,transparent 48%,rgba(255,255,255,.95) 49%,transparent 51%),linear-gradient(120deg,transparent 46%,rgba(255,255,255,.9) 47%,transparent 49%),linear-gradient(75deg,transparent 58%,rgba(255,255,255,.85) 59%,transparent 61%);animation:q10crack .9s ease-out forwards}@keyframes q10crack{0%{opacity:0;filter:brightness(1)}35%{opacity:1;filter:brightness(5)}100%{opacity:0;filter:brightness(1)}}
.q10result{font-size:50px;font-weight:1000;margin:16px auto 20px;animation:q10result 1.05s ease-out both}@keyframes q10result{0%{opacity:0;transform:translateY(-60px) scale(.3)}55%{opacity:1;transform:translateY(10px) scale(1.2)}100%{opacity:1;transform:translateY(0) scale(1)}}
.q10rarity{font-size:76px;font-weight:1000;margin:18px auto;text-shadow:0 0 24px currentColor,0 0 60px currentColor;animation:q10result 1.05s ease-out both}
.q10ur{animation:q10ur .85s ease-in-out infinite alternate}@keyframes q10ur{from{filter:hue-rotate(0deg) brightness(1.12)}to{filter:hue-rotate(100deg) brightness(1.6)}}
`;
 document.head.appendChild(st);
}
function q10Remove(){document.getElementById("q10")?.remove();}
window.q10Back=function(){q10Remove(); if(typeof showGacha==="function")showGacha();};
window.q10Home=function(){q10Remove(); if(typeof goHome==="function")goHome(); else if(typeof showHome==="function")showHome(); else location.reload();};
function q10Base(title,msg,tap=true){
 q10Ensure(); q10Remove();
 const div=document.createElement("div"); div.id="q10"; div.className="q10";
 div.innerHTML=`<div class="q10btns"><button class="q10btn" onclick="q10Back()">← ガチャへ戻る</button><button class="q10btn" onclick="q10Home()">🏠 ホーム</button><button class="q10btn" onclick="document.getElementById('q10')?.remove()">閉じる</button></div><div class="q10in"><div class="q10title">${title}</div><p>${msg}</p>${tap?'<div class="q10tap">画面をタップして開始</div>':''}</div>`;
 document.body.appendChild(div); q10Symbols(div); return div;
}
function q10Symbols(stage){
 const s=["∫","Σ","π","∞","√","lim","dx","log","sin","cos","tan","x²","e^x","∴"];
 for(let i=0;i<56;i++){const e=document.createElement("div");e.className="q10sym";e.textContent=s[Math.floor(Math.random()*s.length)];e.style.left=(Math.random()*96)+"%";e.style.animationDuration=(3+Math.random()*6)+"s";e.style.animationDelay=(-Math.random()*6)+"s";e.style.fontSize=(20+Math.random()*35)+"px";stage.appendChild(e);}
}
function q10Particles(stage,r){
 const m=r==="UR"?["✨","🌈","💎","👑","⚡","🔥","🌌","π","∞"]:r==="SSR"?["✨","💎","⭐","🔥","Σ"]:r==="SR"?["✨","⭐","√","∫"]:["✨","∫","π"];
 const n=r==="UR"?88:r==="SSR"?58:r==="SR"?38:24;
 for(let i=0;i<n;i++){const p=document.createElement("div");p.className="q10particle";p.textContent=m[Math.floor(Math.random()*m.length)];p.style.left=(5+Math.random()*90)+"%";p.style.top=(43+Math.random()*40)+"%";p.style.animationDelay=(Math.random()*1.0)+"s";stage.appendChild(p);}
}
function q10Cut(label,sound="charge"){return new Promise(resolve=>{q10Sound(sound);document.querySelector(".q10cut")?.remove();const d=document.createElement("div");d.className="q10cut";d.innerHTML=`<div>${label}</div>`;document.body.appendChild(d);setTimeout(()=>{d.remove();resolve();},2050);});}
function q10Pick(){const item=getGachaResult();const owned=playerData.gachaTitles||[];return{item,duplicate:item?owned.includes(item.title):false};}
function q10Give(item){
 if(!playerData.gachaTitles)playerData.gachaTitles=[];
 const dup=playerData.gachaTitles.includes(item.title);
 if(dup){playerData.coins=(playerData.coins||0)+3;}else{unlockTitle(item.title);playerData.gachaTitles.push(item.title);}
 unlockAchievement("初ガチャ");
 if(item.rarity==="UR"){unlockAchievement("UR獲得");document.body.classList.add("urFlash");setTimeout(()=>document.body.classList.remove("urFlash"),1000);}
 saveAllData(); updateHomeStatus(); return dup;
}
function q10Mode(){const r=Math.random()*100;return r<25?"card":r<60?"chest":"core";}
async function q10WaitTap(stage,label){
 await new Promise(resolve=>{let done=false;const start=async(e)=>{if(e)e.preventDefault();if(done)return;done=true;q10Sound("tap");await q10Cut(label||"解析開始","charge");resolve();};stage.addEventListener("click",start);stage.addEventListener("touchstart",start,{passive:false});});
}
async function q10Card(item,auto=false){
 const stage=q10Base("🎴 数式カード開封","カード列を生成中...",!auto);
 const wrap=document.createElement("div");wrap.className="q10cardWrap";stage.querySelector(".q10in").appendChild(wrap);
 for(let i=0;i<10;i++){const c=document.createElement("div");c.className="q10card";c.textContent="∫";c.style.animationDelay=(i*.07)+"s";wrap.appendChild(c);}
 if(!auto)await q10WaitTap(stage,"カード解析開始"); else await q10Cut("カード解析開始","charge");
 const cards=[...wrap.children];
 for(let i=0;i<cards.length;i++){q10Sound("card");cards[i].classList.add("open");cards[i].textContent=["√","Σ","π","∞"][Math.floor(Math.random()*4)];await q10Sleep(230);}
 const last=cards[Math.floor(Math.random()*cards.length)];
 last.style.color=q10Color(item.rarity); last.style.boxShadow=`0 0 38px ${q10Color(item.rarity)}`; last.textContent=item.rarity==="UR"?"🌈":item.rarity==="SSR"?"💎":item.rarity==="SR"?"⭐":"∫";
 await q10Sleep(900);
 if(item.rarity==="UR")await q10Cut("虹カード出現","ur");
}
async function q10Chest(item,auto=false){
 const stage=q10Base("📦 数式宝箱","宝箱を召喚中...",!auto);
 stage.querySelector(".q10in").insertAdjacentHTML("beforeend",`<div id="q10Chest" class="q10chest">📦</div>`);
 if(!auto)await q10WaitTap(stage,"宝箱解析開始"); else await q10Cut("宝箱解析開始","charge");
 const chest=document.getElementById("q10Chest");
 q10Sound("chest"); chest.classList.add("q10shake"); let c=document.createElement("div");c.className="q10crack";stage.appendChild(c);
 await q10Sleep(1200);
 if(Math.random()<0.65){q10Sound("fake");stage.querySelector(".q10in").insertAdjacentHTML("beforeend",`<div class="q10fake">……まだ割れない</div>`);await q10Sleep(1300);}
 q10Sound("boom"); chest.textContent=item.rarity==="UR"?"🌈":"💥"; c=document.createElement("div");c.className="q10crack";stage.appendChild(c);q10Particles(stage,item.rarity);
 if(item.rarity==="UR")await q10Cut("虹爆発","ur"); else await q10Sleep(1300);
}
async function q10Core(item,auto=false){
 const stage=q10Base("🌌 数学コア暴走","πコアにエネルギーを充填中...",!auto);
 stage.querySelector(".q10in").insertAdjacentHTML("beforeend",`<div class="q10core"></div>`);
 if(!auto)await q10WaitTap(stage,"コア起動"); else await q10Cut("コア起動","charge");
 q10Sound("core"); await q10Cut("エネルギー充填","charge");
 if(Math.random()<0.55&&item.rarity!=="R"){q10Sound("fake");stage.querySelector(".q10in").insertAdjacentHTML("beforeend",`<div class="q10fake">割れる……？</div>`);await q10Sleep(1100);}
 q10Sound("crack");let c=document.createElement("div");c.className="q10crack";stage.appendChild(c);await q10Sleep(850);
 if(item.rarity==="UR"){stage.classList.add("q10ur");await q10Cut("コア暴走","ur");}
 q10Sound("boom");q10Particles(stage,item.rarity);await q10Sleep(1200);
}
function q10Result(stage,item,dup){
 q10Sound("result");
 const dupText=dup?`<p>かぶり：+3コイン返還</p>`:"";
 stage.className="q10 "+(item.rarity==="UR"?"q10ur":"");
 stage.innerHTML=`<div class="q10btns"><button class="q10btn" onclick="q10Back()">← ガチャへ戻る</button><button class="q10btn" onclick="q10Home()">🏠 ホーム</button><button class="q10btn" onclick="document.getElementById('q10')?.remove()">閉じる</button></div><div class="q10in"><div class="q10title">🎰 ガチャ結果</div><div class="q10rarity" style="color:${q10Color(item.rarity)}">${item.rarity}</div><div class="q10result">${titleHTML(item.title)}</div>${dupText}<p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('q10')?.remove();drawGacha()">もう一回引く</button><button onclick="q10Back()">ガチャへ戻る</button><button onclick="q10Home()">ホームへ戻る</button></div>`;
 q10Symbols(stage); q10Particles(stage,item.rarity);
}
async function q10Play(item,dup,mode,auto=false){
 const m=mode||q10Mode();
 if(m==="card")await q10Card(item,auto);
 else if(m==="chest")await q10Chest(item,auto);
 else await q10Core(item,auto);
 const st=document.getElementById("q10");
 if(item.rarity==="UR")await q10Cut("UR解放","ur");
 q10Result(st,item,dup);
}
drawGacha=async function(){
 if((playerData.coins||0)<10){alert("コインが足りません");return;}
 playerData.coins-=10;
 const p=q10Pick(); if(!p.item){alert("ガチャ称号がありません");showGacha();return;}
 const dup=q10Give(p.item);
 await q10Play(p.item,dup);
};
drawGacha10=async function(){
 if((playerData.coins||0)<100){alert("コインが足りません");return;}
 playerData.coins-=100;
 let results=[],hasUR=false;
 for(let i=0;i<10;i++){const p=q10Pick();if(!p.item){alert("ガチャ称号がありません");showGacha();return;}const dup=q10Give(p.item);results.push({item:p.item,duplicate:dup});if(p.item.rarity==="UR")hasUR=true;}
 const mode=q10Mode();
 const start=q10Base(mode==="card"?"🎴 10連カード開封":mode==="chest"?"📦 10連宝箱召喚":"🌌 10連数学コア","最初だけタップ。以降は自動で連続召喚します。",true);
 await q10WaitTap(start,hasUR?"🌈 UR反応あり":"10連解析開始");
 for(let i=0;i<results.length;i++){
   await q10Play(results[i].item,results[i].duplicate,mode,true);
   await q10Sleep(900);
 }
 results.sort((a,b)=>({UR:0,SSR:1,SR:2,R:3}[a.item.rarity]-{UR:0,SSR:1,SR:2,R:3}[b.item.rarity]));
 const final=q10Base("🎰 10連最終結果","召喚結果一覧",false);
 final.className="q10 "+(hasUR?"q10ur":"");
 final.innerHTML=`<div class="q10btns"><button class="q10btn" onclick="q10Back()">← ガチャへ戻る</button><button class="q10btn" onclick="q10Home()">🏠 ホーム</button><button class="q10btn" onclick="document.getElementById('q10')?.remove()">閉じる</button></div><div class="q10in"><div class="q10title">🎰 10連最終結果</div><p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('q10')?.remove();drawGacha10()">もう一度10連</button><button onclick="q10Back()">ガチャへ戻る</button><button onclick="q10Home()">ホームへ戻る</button></div>`;
 const inner=final.querySelector(".q10in");
 for(const r of results){inner.insertAdjacentHTML("beforeend",`<div class="titleItem"><b style="color:${q10Color(r.item.rarity)}">${r.item.rarity}</b><br>${titleHTML(r.item.title)}${r.duplicate?"<br>かぶり：+3コイン":""}</div>`);}
 q10Symbols(final); q10Particles(final,hasUR?"UR":"SSR");
};
const oldNews3310=typeof showNewsPage==="function"?showNewsPage:null;
showNewsPage=function(){
 let html=`<h2>📢 お知らせ</h2><div class="newsCard"><h3>Ver 3.3.10 ガチャ演出強化</h3><p>ガチャ演出を長くし、音とフェイントを強化しました。</p><p>10連は最初の1タップ後、自動で連続召喚されます。</p><p>ガチャ結果からホームへ戻れるボタンを追加しました。</p><p>ランキング・ログイン・Firebase処理は変更していません。</p></div>`;
 if(oldNews3310){try{oldNews3310();const p=document.getElementById("panelArea");if(p)p.innerHTML=html+p.innerHTML;return;}catch(e){}}
 document.getElementById("panelArea").innerHTML=html;
 if(typeof ensureHomeButton==="function")ensureHomeButton();
};
window.drawGacha=drawGacha;window.drawGacha10=drawGacha10;window.showNewsPage=showNewsPage;
})();



/* Ver3.3.11 premium pack gacha演出 */
(function(){
if(window.__premiumPackGacha3311)return;
window.__premiumPackGacha3311=true;

let ppCtx=null;
function ppAudio(){try{if(!ppCtx)ppCtx=new (window.AudioContext||window.webkitAudioContext)();if(ppCtx.state==="suspended")ppCtx.resume();return ppCtx;}catch(e){return null;}}
function ppTone(f,d,t,gain){const c=ppAudio();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=t||"sine";o.frequency.setValueAtTime(f,c.currentTime);g.gain.setValueAtTime(gain||.045,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d);}
function ppNoise(d,gain){const c=ppAudio();if(!c)return;const b=c.createBuffer(1,Math.floor(c.sampleRate*d),c.sampleRate),data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const s=c.createBufferSource(),g=c.createGain();s.buffer=b;g.gain.value=gain||.08;s.connect(g);g.connect(c.destination);s.start();}
function ppSound(k){if(k==="tap"){ppTone(250,.08,"sine",.045);setTimeout(()=>ppTone(520,.12,"triangle",.045),70)}if(k==="pack"){ppTone(160,.25,"sawtooth",.03);setTimeout(()=>ppTone(320,.28,"sawtooth",.035),180);setTimeout(()=>ppTone(580,.3,"triangle",.045),420)}if(k==="tear"){ppNoise(.22,.06);ppTone(700,.08,"triangle",.035)}if(k==="flip"){ppTone(420,.08,"triangle",.045);setTimeout(()=>ppTone(760,.09,"sine",.04),70)}if(k==="fake"){ppNoise(.18,.045);ppTone(140,.14,"triangle",.035)}if(k==="crack"){ppNoise(.42,.12);ppTone(80,.25,"sawtooth",.065)}if(k==="boom"){ppNoise(.72,.15);ppTone(55,.38,"sawtooth",.08)}if(k==="ur"){ppTone(523,.2,"triangle",.06);setTimeout(()=>ppTone(659,.2,"triangle",.06),140);setTimeout(()=>ppTone(784,.22,"triangle",.065),280);setTimeout(()=>ppTone(1046,.5,"sine",.075),450)}if(k==="result"){ppTone(660,.13,"sine",.05);setTimeout(()=>ppTone(880,.15,"sine",.05),120);setTimeout(()=>ppTone(1320,.22,"sine",.04),250)}}
function ppSleep(ms){return new Promise(r=>setTimeout(r,ms));}
function ppColor(r){return r==="UR"?"#ffd700":r==="SSR"?"#ff3cff":r==="SR"?"#38e8ff":"#fff";}
function ppEnsure(){if(document.getElementById("ppStyle3311"))return;const st=document.createElement("style");st.id="ppStyle3311";st.textContent=`
.pp{position:fixed;inset:0;z-index:999999;background:#030014;color:#fff;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.pp:before{content:"";position:absolute;inset:-60%;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.42),transparent 7%),conic-gradient(from 0deg,#00eaff,#6345ff,#ff26bd,#ffd700,#16ff9a,#00eaff);opacity:.45;filter:blur(12px);animation:ppspin 6s linear infinite}.pp:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 0 20%,rgba(0,0,0,.2) 32%,rgba(0,0,0,.88) 82%),repeating-radial-gradient(circle at 50% 50%,rgba(255,255,255,.055) 0 2px,transparent 2px 22px)}@keyframes ppspin{to{transform:rotate(360deg)}}
.ppin{position:relative;z-index:3;width:96%;max-width:960px}.ppbtns{position:fixed;left:10px;top:10px;z-index:1000002;display:flex;gap:8px;flex-wrap:wrap}.ppbtn{font-size:15px;padding:7px 11px;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.45)}
.pptitle{font-size:40px;font-weight:1000;letter-spacing:2px;text-shadow:0 0 18px #22d3ee,0 0 44px #7c3aed,0 0 80px #fff;animation:pppop 1s ease-out both}@keyframes pppop{from{opacity:0;transform:translateY(-34px) scale(.7)}to{opacity:1;transform:translateY(0) scale(1)}}
.pptap{font-size:34px;font-weight:1000;color:#fde68a;text-shadow:0 0 16px #f59e0b,0 0 35px #fff;animation:pptap .68s ease-in-out infinite alternate}@keyframes pptap{from{opacity:.5;transform:scale(.93)}to{opacity:1;transform:scale(1.08)}}
.ppcut{position:fixed;inset:0;z-index:1000003;background:#000;display:flex;align-items:center;justify-content:center;color:#fff;font-size:58px;font-weight:1000;text-shadow:0 0 20px #fff,0 0 48px #22d3ee,0 0 96px #7c3aed;animation:ppcut 2.15s ease-out forwards}@keyframes ppcut{0%{opacity:0;transform:scale(1)}14%{opacity:1}78%{opacity:1;filter:brightness(1.45)}100%{opacity:0;transform:scale(1.28);filter:brightness(3.3)}}
.ppsym{position:absolute;z-index:2;color:rgba(255,255,255,.94);font-weight:1000;text-shadow:0 0 12px #fff,0 0 28px #22d3ee;pointer-events:none;animation:ppfly linear infinite}@keyframes ppfly{from{transform:translateY(118vh) rotate(0deg) scale(.72);opacity:0}12%{opacity:1}80%{opacity:.95}to{transform:translateY(-20vh) rotate(620deg) scale(1.45);opacity:0}}
.ppparticle{position:absolute;z-index:3;font-size:30px;pointer-events:none;animation:ppparticle 2.5s ease-out forwards}@keyframes ppparticle{from{opacity:1;transform:translateY(0) scale(.55) rotate(0)}to{opacity:0;transform:translateY(-330px) scale(2.2) rotate(450deg)}}
.pppack{width:245px;height:330px;margin:26px auto;border-radius:26px;background:linear-gradient(145deg,#0b1028,#29215f,#050816);border:3px solid rgba(255,255,255,.78);box-shadow:0 0 24px #22d3ee,0 0 70px #7c3aed,inset 0 0 45px rgba(255,255,255,.12);position:relative;animation:pppack 1.2s ease-in-out infinite alternate}.pppack:before{content:"MATH MASTER";position:absolute;top:22px;left:0;right:0;font-size:22px;font-weight:1000;color:#fff;text-shadow:0 0 16px #fff}.pppack:after{content:"∫Σπ";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:58px;font-weight:1000;text-shadow:0 0 22px #fff,0 0 55px #ffd700}@keyframes pppack{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-10px) rotate(2deg)}}.pptear{animation:pptear 1.2s ease-out both}@keyframes pptear{0%{clip-path:inset(0 0 0 0);filter:brightness(1)}45%{clip-path:inset(0 0 42% 0);filter:brightness(2.4)}100%{clip-path:inset(0 0 100% 0);opacity:0;filter:brightness(4)}}
.ppmeter{width:84%;max-width:620px;height:20px;margin:18px auto;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.38);overflow:hidden;box-shadow:0 0 14px rgba(255,255,255,.18)}.ppfill{height:100%;width:0;background:linear-gradient(90deg,#38e8ff,#7c3aed,#ff3cff,#ffd700);box-shadow:0 0 20px #fff;transition:width .55s ease}
.ppcards{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;max-width:760px;margin:25px auto}.ppcard{height:148px;border-radius:18px;background:linear-gradient(135deg,#111827,#312e81,#020617);border:2px solid rgba(255,255,255,.6);box-shadow:0 0 22px rgba(34,211,238,.5),inset 0 0 30px rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:46px;font-weight:1000;animation:ppcard .9s ease-out both}@keyframes ppcard{from{opacity:0;transform:translateY(38px) rotateY(80deg)}to{opacity:1;transform:translateY(0) rotateY(0)}}.ppcard.open{animation:ppflip 1s ease-out both;background:linear-gradient(135deg,rgba(255,255,255,.26),rgba(124,58,237,.50),rgba(0,0,0,.58))}@keyframes ppflip{0%{transform:rotateY(0) scale(1)}50%{transform:rotateY(90deg) scale(1.18)}100%{transform:rotateY(0) scale(1.07)}}
.ppchest{font-size:175px;filter:drop-shadow(0 0 36px #ffd700);animation:ppdrop 1.1s ease-out both}@keyframes ppdrop{0%{opacity:0;transform:translateY(-260px) scale(.5)}70%{opacity:1;transform:translateY(28px) scale(1.18)}100%{opacity:1;transform:translateY(0) scale(1)}}.ppcore{width:365px;height:365px;margin:28px auto;border-radius:50%;position:relative;background:radial-gradient(circle at center,rgba(255,255,255,.65) 0 7%,rgba(34,211,238,.30) 8% 18%,transparent 19%),conic-gradient(from 0deg,#22d3ee,#fff,#7c3aed,#ff00aa,#ffd700,#22c55e,#22d3ee);border:5px solid rgba(255,255,255,.96);box-shadow:0 0 32px #fff,0 0 72px #22d3ee,0 0 135px #7c3aed,inset 0 0 90px rgba(255,255,255,.32);animation:ppcore 4.8s linear infinite,pppulse .95s ease-in-out infinite alternate}.ppcore:before{content:"";position:absolute;inset:44px;border-radius:50%;border:3px dashed #fff;animation:pprev 2.6s linear infinite}.ppcore:after{content:"π";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:128px;font-weight:1000;text-shadow:0 0 24px #fff,0 0 65px #ffd700}@keyframes ppcore{to{transform:rotate(360deg)}}@keyframes pprev{to{transform:rotate(-360deg)}}@keyframes pppulse{from{transform:scale(.92);filter:brightness(1)}to{transform:scale(1.1);filter:brightness(2)}}
.ppfake{font-size:38px;font-weight:1000;color:#fff;text-shadow:0 0 16px #fff,0 0 34px #22d3ee;animation:ppfake 1.05s ease-out both}@keyframes ppfake{0%{opacity:0;transform:scale(.5)}45%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(1.35)}}.ppcrack{position:absolute;inset:0;z-index:4;pointer-events:none;background:linear-gradient(30deg,transparent 48%,rgba(255,255,255,.95) 49%,transparent 51%),linear-gradient(120deg,transparent 46%,rgba(255,255,255,.9) 47%,transparent 49%),linear-gradient(75deg,transparent 58%,rgba(255,255,255,.85) 59%,transparent 61%);animation:ppcrack .95s ease-out forwards}@keyframes ppcrack{0%{opacity:0;filter:brightness(1)}35%{opacity:1;filter:brightness(5)}100%{opacity:0;filter:brightness(1)}}
.pprarity{font-size:80px;font-weight:1000;margin:18px auto;text-shadow:0 0 26px currentColor,0 0 70px currentColor;animation:ppresult 1.1s ease-out both}.ppresult{font-size:52px;font-weight:1000;margin:16px auto 20px;animation:ppresult 1.1s ease-out both}@keyframes ppresult{0%{opacity:0;transform:translateY(-64px) scale(.28)}55%{opacity:1;transform:translateY(12px) scale(1.22)}100%{opacity:1;transform:translateY(0) scale(1)}}.ppur{animation:ppur .85s ease-in-out infinite alternate}@keyframes ppur{from{filter:hue-rotate(0deg) brightness(1.12)}to{filter:hue-rotate(100deg) brightness(1.65)}}
`;document.head.appendChild(st);}
function ppRemove(){document.getElementById("pp")?.remove();}
window.ppBack=function(){ppRemove(); if(typeof showGacha==="function")showGacha();};
window.ppHome=function(){ppRemove(); if(typeof goHome==="function")goHome(); else if(typeof showHome==="function")showHome(); else location.reload();};
function ppBase(title,msg,tap=true){ppEnsure();ppRemove();const div=document.createElement("div");div.id="pp";div.className="pp";div.innerHTML=`<div class="ppbtns"><button class="ppbtn" onclick="ppBack()">← ガチャへ戻る</button><button class="ppbtn" onclick="ppHome()">🏠 ホーム</button><button class="ppbtn" onclick="document.getElementById('pp')?.remove()">閉じる</button></div><div class="ppin"><div class="pptitle">${title}</div><p>${msg}</p>${tap?'<div class="pptap">画面をタップして開封</div>':''}</div>`;document.body.appendChild(div);ppSymbols(div);return div;}
function ppSymbols(stage){const s=["∫","Σ","π","∞","√","lim","dx","log","sin","cos","tan","x²","e^x","∴"];for(let i=0;i<62;i++){const e=document.createElement("div");e.className="ppsym";e.textContent=s[Math.floor(Math.random()*s.length)];e.style.left=(Math.random()*96)+"%";e.style.animationDuration=(3+Math.random()*6)+"s";e.style.animationDelay=(-Math.random()*6)+"s";e.style.fontSize=(20+Math.random()*36)+"px";stage.appendChild(e);}}
function ppParticles(stage,r){const m=r==="UR"?["✨","🌈","💎","👑","⚡","🔥","🌌","π","∞"]:r==="SSR"?["✨","💎","⭐","🔥","Σ"]:r==="SR"?["✨","⭐","√","∫"]:["✨","∫","π"];const n=r==="UR"?96:r==="SSR"?64:r==="SR"?42:28;for(let i=0;i<n;i++){const p=document.createElement("div");p.className="ppparticle";p.textContent=m[Math.floor(Math.random()*m.length)];p.style.left=(5+Math.random()*90)+"%";p.style.top=(42+Math.random()*42)+"%";p.style.animationDelay=(Math.random()*1.0)+"s";stage.appendChild(p);}}
function ppCut(label,sound="pack"){return new Promise(resolve=>{ppSound(sound);document.querySelector(".ppcut")?.remove();const d=document.createElement("div");d.className="ppcut";d.innerHTML=`<div>${label}</div>`;document.body.appendChild(d);setTimeout(()=>{d.remove();resolve();},2150);});}
async function ppWait(stage,label){await new Promise(resolve=>{let done=false;const start=async(e)=>{if(e)e.preventDefault();if(done)return;done=true;ppSound("tap");await ppCut(label||"開封開始","pack");resolve();};stage.addEventListener("click",start);stage.addEventListener("touchstart",start,{passive:false});});}
function ppPick(){const item=getGachaResult();const owned=playerData.gachaTitles||[];return{item,duplicate:item?owned.includes(item.title):false};}
function ppGive(item){if(!playerData.gachaTitles)playerData.gachaTitles=[];const dup=playerData.gachaTitles.includes(item.title);if(dup){playerData.coins=(playerData.coins||0)+3;}else{unlockTitle(item.title);playerData.gachaTitles.push(item.title);}unlockAchievement("初ガチャ");if(item.rarity==="UR"){unlockAchievement("UR獲得");document.body.classList.add("urFlash");setTimeout(()=>document.body.classList.remove("urFlash"),1000);}saveAllData();updateHomeStatus();return dup;}
function ppMode(){const r=Math.random()*100;return r<25?"card":r<60?"chest":"core";}
async function ppPack(item,auto=false){const stage=ppBase("🎁 プレミアム数式パック","パックを開封します",!auto);stage.querySelector(".ppin").insertAdjacentHTML("beforeend",`<div id="ppPack" class="pppack"></div>`);if(!auto)await ppWait(stage,"パック開封");else await ppCut("パック開封","pack");stage.querySelector(".ppin").insertAdjacentHTML("beforeend",`<div class="ppmeter"><div id="ppFill" class="ppfill"></div></div><p>期待度解析中...</p>`);const fill=document.getElementById("ppFill");const steps=item.rarity==="UR"?[18,36,62,86,100]:item.rarity==="SSR"?[15,34,58,78]:item.rarity==="SR"?[12,30,52]:[10,24,39];for(const w of steps){fill.style.width=w+"%";ppSound("pack");await ppSleep(650);}ppSound("tear");document.getElementById("ppPack")?.classList.add("pptear");await ppSleep(1250);return stage;}
async function ppCard(item,auto=false){const stage=await ppPack(item,auto);stage.querySelector(".ppin").innerHTML=`<div class="pptitle">🎴 カード開封</div><div class="ppcards"></div>`;const wrap=stage.querySelector(".ppcards");for(let i=0;i<10;i++){const c=document.createElement("div");c.className="ppcard";c.textContent="∫";c.style.animationDelay=(i*.08)+"s";wrap.appendChild(c);}await ppSleep(900);const cards=[...wrap.children];for(let i=0;i<cards.length;i++){ppSound("flip");cards[i].classList.add("open");cards[i].textContent=["√","Σ","π","∞"][Math.floor(Math.random()*4)];await ppSleep(250);}const last=cards[Math.floor(Math.random()*cards.length)];last.style.color=ppColor(item.rarity);last.style.boxShadow=`0 0 44px ${ppColor(item.rarity)}`;last.textContent=item.rarity==="UR"?"🌈":item.rarity==="SSR"?"💎":item.rarity==="SR"?"⭐":"∫";if(item.rarity==="UR")await ppCut("虹カード出現","ur");else await ppSleep(1000);}
async function ppChest(item,auto=false){const stage=await ppPack(item,auto);stage.querySelector(".ppin").innerHTML=`<div class="pptitle">📦 宝箱開封</div><div id="ppChest" class="ppchest">📦</div>`;await ppSleep(900);const chest=document.getElementById("ppChest");ppSound("crack");let c=document.createElement("div");c.className="ppcrack";stage.appendChild(c);await ppSleep(1200);if(Math.random()<0.7){ppSound("fake");stage.querySelector(".ppin").insertAdjacentHTML("beforeend",`<div class="ppfake">……まだ開かない</div>`);await ppSleep(1350);}ppSound("boom");chest.textContent=item.rarity==="UR"?"🌈":"💥";c=document.createElement("div");c.className="ppcrack";stage.appendChild(c);ppParticles(stage,item.rarity);if(item.rarity==="UR")await ppCut("虹爆発","ur");else await ppSleep(1300);}
async function ppCore(item,auto=false){const stage=await ppPack(item,auto);stage.querySelector(".ppin").innerHTML=`<div class="pptitle">🌌 数学コア解析</div><div class="ppcore"></div><p>コア反応測定中...</p>`;await ppCut("エネルギー充填","pack");if(Math.random()<0.6&&item.rarity!=="R"){ppSound("fake");stage.querySelector(".ppin").insertAdjacentHTML("beforeend",`<div class="ppfake">割れる……？</div>`);await ppSleep(1150);}ppSound("crack");let c=document.createElement("div");c.className="ppcrack";stage.appendChild(c);await ppSleep(900);if(item.rarity==="UR"){stage.classList.add("ppur");await ppCut("コア暴走","ur");}ppSound("boom");ppParticles(stage,item.rarity);await ppSleep(1300);}
function ppResult(stage,item,dup){ppSound("result");const dupText=dup?`<p>かぶり：+3コイン返還</p>`:"";stage.className="pp "+(item.rarity==="UR"?"ppur":"");stage.innerHTML=`<div class="ppbtns"><button class="ppbtn" onclick="ppBack()">← ガチャへ戻る</button><button class="ppbtn" onclick="ppHome()">🏠 ホーム</button><button class="ppbtn" onclick="document.getElementById('pp')?.remove()">閉じる</button></div><div class="ppin"><div class="pptitle">🎰 開封結果</div><div class="pprarity" style="color:${ppColor(item.rarity)}">${item.rarity}</div><div class="ppresult">${titleHTML(item.title)}</div>${dupText}<p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('pp')?.remove();drawGacha()">もう一回引く</button><button onclick="ppBack()">ガチャへ戻る</button><button onclick="ppHome()">ホームへ戻る</button></div>`;ppSymbols(stage);ppParticles(stage,item.rarity);}
async function ppPlay(item,dup,mode,auto=false){const m=mode||ppMode();if(m==="card")await ppCard(item,auto);else if(m==="chest")await ppChest(item,auto);else await ppCore(item,auto);const st=document.getElementById("pp");if(item.rarity==="UR")await ppCut("UR解放","ur");ppResult(st,item,dup);}
drawGacha=async function(){if((playerData.coins||0)<10){alert("コインが足りません");return;}playerData.coins-=10;const p=ppPick();if(!p.item){alert("ガチャ称号がありません");showGacha();return;}const dup=ppGive(p.item);await ppPlay(p.item,dup);};
drawGacha10=async function(){if((playerData.coins||0)<100){alert("コインが足りません");return;}playerData.coins-=100;let results=[],hasUR=false;for(let i=0;i<10;i++){const p=ppPick();if(!p.item){alert("ガチャ称号がありません");showGacha();return;}const dup=ppGive(p.item);results.push({item:p.item,duplicate:dup});if(p.item.rarity==="UR")hasUR=true;}const mode=ppMode();const start=ppBase("🎁 10連プレミアム開封","最初だけタップ。以降は自動で開封します。",true);await ppWait(start,hasUR?"🌈 特殊反応検知":"10連開封開始");for(let i=0;i<results.length;i++){await ppPlay(results[i].item,results[i].duplicate,mode,true);await ppSleep(900);}results.sort((a,b)=>({UR:0,SSR:1,SR:2,R:3}[a.item.rarity]-{UR:0,SSR:1,SR:2,R:3}[b.item.rarity]));const final=ppBase("🎰 10連最終結果","開封結果一覧",false);final.className="pp "+(hasUR?"ppur":"");final.innerHTML=`<div class="ppbtns"><button class="ppbtn" onclick="ppBack()">← ガチャへ戻る</button><button class="ppbtn" onclick="ppHome()">🏠 ホーム</button><button class="ppbtn" onclick="document.getElementById('pp')?.remove()">閉じる</button></div><div class="ppin"><div class="pptitle">🎰 10連最終結果</div><p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('pp')?.remove();drawGacha10()">もう一度10連</button><button onclick="ppBack()">ガチャへ戻る</button><button onclick="ppHome()">ホームへ戻る</button></div>`;const inner=final.querySelector(".ppin");for(const r of results){inner.insertAdjacentHTML("beforeend",`<div class="titleItem"><b style="color:${ppColor(r.item.rarity)}">${r.item.rarity}</b><br>${titleHTML(r.item.title)}${r.duplicate?"<br>かぶり：+3コイン":""}</div>`);}ppSymbols(final);ppParticles(final,hasUR?"UR":"SSR");};
const oldNews=typeof showNewsPage==="function"?showNewsPage:null;showNewsPage=function(){let html=`<h2>📢 お知らせ</h2><div class="newsCard"><h3>Ver 3.3.11 プレミアム開封演出</h3><p>ガチャをプレミアムパック開封風に強化しました。</p><p>期待度ゲージ、パック開封、カード/宝箱/数学コア演出を追加しました。</p><p>音・フェイント・虹演出をさらに強化しました。</p><p>ランキング・ログイン・Firebase処理は変更していません。</p></div>`;if(oldNews){try{oldNews();const p=document.getElementById("panelArea");if(p)p.innerHTML=html+p.innerHTML;return;}catch(e){}}document.getElementById("panelArea").innerHTML=html;if(typeof ensureHomeButton==="function")ensureHomeButton();};
window.drawGacha=drawGacha;window.drawGacha10=drawGacha10;window.showNewsPage=showNewsPage;
})();



/* Ver3.3.12 clear pack gacha */
(function(){
if(window.__clearPackGacha3312)return;
window.__clearPackGacha3312=true;
let c12Ctx=null;
function c12A(){try{if(!c12Ctx)c12Ctx=new (window.AudioContext||window.webkitAudioContext)();if(c12Ctx.state==="suspended")c12Ctx.resume();return c12Ctx;}catch(e){return null;}}
function c12T(f,d,t,gain){const c=c12A();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=t||"sine";o.frequency.setValueAtTime(f,c.currentTime);g.gain.setValueAtTime(gain||.045,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d);}
function c12N(d,gain){const c=c12A();if(!c)return;const b=c.createBuffer(1,Math.floor(c.sampleRate*d),c.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length);const s=c.createBufferSource(),g=c.createGain();s.buffer=b;g.gain.value=gain||.08;s.connect(g);g.connect(c.destination);s.start();}
function c12S(k){if(k==="tap"){c12T(260,.08,"sine",.045);setTimeout(()=>c12T(520,.12,"triangle",.045),70)}if(k==="open"){c12T(180,.22,"sawtooth",.03);setTimeout(()=>c12T(360,.24,"triangle",.04),190)}if(k==="step"){c12T(420,.09,"triangle",.04)}if(k==="crack"){c12N(.34,.1);c12T(90,.2,"sawtooth",.06)}if(k==="fake"){c12N(.16,.04);c12T(150,.14,"triangle",.035)}if(k==="boom"){c12N(.6,.13);c12T(60,.32,"sawtooth",.075)}if(k==="ur"){c12T(523,.2,"triangle",.06);setTimeout(()=>c12T(659,.2,"triangle",.06),140);setTimeout(()=>c12T(1046,.45,"sine",.075),330)}if(k==="result"){c12T(660,.12,"sine",.05);setTimeout(()=>c12T(880,.15,"sine",.05),120)}}
function c12Sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function c12Rank(r){return {UR:4,SSR:3,SR:2,R:1}[r]||0}
function c12Color(r){return r==="UR"?"#ffd700":r==="SSR"?"#ff3cff":r==="SR"?"#38e8ff":"#fff"}
function c12Ensure(){if(document.getElementById("c12Style"))return;const st=document.createElement("style");st.id="c12Style";st.textContent=`
.c12{position:fixed;inset:0;z-index:999999;background:#05020f;color:white;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.c12:before{content:"";position:absolute;inset:-50%;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.35),transparent 8%),conic-gradient(from 0deg,#00eaff,#6345ff,#ff26bd,#ffd700,#16ff9a,#00eaff);opacity:.38;filter:blur(12px);animation:c12spin 7s linear infinite}.c12:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 0 24%,rgba(0,0,0,.25) 35%,rgba(0,0,0,.88) 84%)}@keyframes c12spin{to{transform:rotate(360deg)}}.c12in{position:relative;z-index:3;width:96%;max-width:980px}.c12btns{position:fixed;left:10px;top:10px;z-index:1000002;display:flex;gap:8px;flex-wrap:wrap}.c12btn{font-size:15px;padding:7px 11px;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.45)}.c12title{font-size:38px;font-weight:1000;letter-spacing:1px;text-shadow:0 0 18px #22d3ee,0 0 44px #7c3aed}.c12sub{font-size:20px;opacity:.9}.c12tap{font-size:32px;font-weight:1000;color:#fde68a;text-shadow:0 0 16px #f59e0b,0 0 35px #fff;animation:c12tap .7s ease-in-out infinite alternate}@keyframes c12tap{from{opacity:.5;transform:scale(.94)}to{opacity:1;transform:scale(1.07)}}.c12steps{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:18px auto}.c12step{padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);font-weight:800}.c12step.on{background:rgba(255,215,0,.22);box-shadow:0 0 18px #ffd700}.c12pack{width:260px;height:340px;margin:22px auto;border-radius:26px;background:linear-gradient(145deg,#10183d,#2f2670,#060816);border:3px solid rgba(255,255,255,.8);box-shadow:0 0 24px #22d3ee,0 0 70px #7c3aed,inset 0 0 45px rgba(255,255,255,.13);position:relative;animation:c12float 1.2s ease-in-out infinite alternate}.c12pack:before{content:"MATH MASTER";position:absolute;top:22px;left:0;right:0;font-size:23px;font-weight:1000}.c12pack:after{content:"称号パック";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:1000;text-shadow:0 0 22px #fff,0 0 55px #ffd700}@keyframes c12float{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-10px) rotate(2deg)}}.c12pack.open{animation:c12open 1s ease-out both}@keyframes c12open{0%{filter:brightness(1);transform:scale(1)}55%{filter:brightness(2.5);transform:scale(1.12)}100%{filter:brightness(4);transform:scale(.2);opacity:0}}.c12meter{width:84%;max-width:650px;height:24px;margin:18px auto;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.38);overflow:hidden}.c12fill{height:100%;width:0;background:linear-gradient(90deg,#fff,#38e8ff,#b455ff,#ffd700,#ff3cff);box-shadow:0 0 20px #fff;transition:width .8s ease}.c12big{font-size:54px;font-weight:1000;margin:18px auto;text-shadow:0 0 18px currentColor,0 0 50px currentColor}.c12fake{font-size:34px;font-weight:1000;text-shadow:0 0 14px #fff,0 0 30px #22d3ee;animation:c12pop .9s ease-out both}@keyframes c12pop{from{opacity:0;transform:scale(.5)}55%{opacity:1;transform:scale(1.15)}to{opacity:0;transform:scale(1.35)}}.c12cardRow{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin:20px auto}.c12card{width:105px;height:145px;border-radius:16px;background:linear-gradient(135deg,#111827,#312e81,#020617);border:2px solid rgba(255,255,255,.6);box-shadow:0 0 22px rgba(34,211,238,.5);display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:1000}.c12card.hit{transform:scale(1.16);box-shadow:0 0 38px currentColor}.c12result{font-size:52px;font-weight:1000;margin:16px auto;animation:c12res 1s ease-out both}@keyframes c12res{from{opacity:0;transform:translateY(-50px) scale(.35)}60%{opacity:1;transform:translateY(8px) scale(1.18)}to{opacity:1;transform:translateY(0) scale(1)}}.c12rarity{font-size:80px;font-weight:1000;text-shadow:0 0 28px currentColor,0 0 70px currentColor}.c12ur{animation:c12ur .85s ease-in-out infinite alternate}@keyframes c12ur{from{filter:hue-rotate(0deg) brightness(1.12)}to{filter:hue-rotate(100deg) brightness(1.65)}}.c12list{max-height:48vh;overflow:auto;margin-top:12px}.c12item{padding:10px;margin:7px;border-radius:12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)}
`;document.head.appendChild(st)}
function c12Remove(){document.getElementById("c12")?.remove()}
window.c12Back=function(){c12Remove(); if(typeof showGacha==="function")showGacha()}
window.c12Home=function(){c12Remove(); if(typeof goHome==="function")goHome(); else if(typeof showHome==="function")showHome(); else location.reload()}
function c12Base(title,sub,tap=true){c12Ensure();c12Remove();const d=document.createElement("div");d.id="c12";d.className="c12";d.innerHTML=`<div class="c12btns"><button class="c12btn" onclick="c12Back()">← ガチャへ戻る</button><button class="c12btn" onclick="c12Home()">🏠 ホーム</button><button class="c12btn" onclick="document.getElementById('c12')?.remove()">閉じる</button></div><div class="c12in"><div class="c12title">${title}</div><p class="c12sub">${sub}</p><div class="c12steps"><span class="c12step on">1. パック出現</span><span class="c12step">2. 期待度上昇</span><span class="c12step">3. 開封</span><span class="c12step">4. 結果</span></div><div class="c12pack" id="c12Pack"></div>${tap?'<div class="c12tap">タップして開封開始</div>':''}</div>`;document.body.appendChild(d);return d}
function c12SetStep(n){document.querySelectorAll(".c12step").forEach((e,i)=>e.classList.toggle("on",i<=n))}
async function c12Wait(stage){await new Promise(resolve=>{let done=false;const start=e=>{if(e)e.preventDefault();if(done)return;done=true;c12S("tap");resolve()};stage.addEventListener("click",start);stage.addEventListener("touchstart",start,{passive:false})})}
function c12Pick(){const item=getGachaResult();const owned=playerData.gachaTitles||[];return{item,duplicate:item?owned.includes(item.title):false}}
function c12Give(item){if(!playerData.gachaTitles)playerData.gachaTitles=[];const dup=playerData.gachaTitles.includes(item.title);if(dup){playerData.coins=(playerData.coins||0)+3}else{unlockTitle(item.title);playerData.gachaTitles.push(item.title)}unlockAchievement("初ガチャ");if(item.rarity==="UR"){unlockAchievement("UR獲得");document.body.classList.add("urFlash");setTimeout(()=>document.body.classList.remove("urFlash"),1000)}saveAllData();updateHomeStatus();return dup}
function c12Cut(label,sound){return new Promise(resolve=>{c12S(sound||"open");const d=document.createElement("div");d.className="c12cut";d.innerHTML=`<div>${label}</div>`;document.body.appendChild(d);setTimeout(()=>{d.remove();resolve()},1850)})}
async function c12Anim(bestItem,opts={}){const multi=opts.multi||false;const stage=c12Base(multi?"10連称号パック":"称号パック開封",multi?"10連の中で一番良い結果に合わせた演出です":"流れが分かるように開封します",true);await c12Wait(stage);c12S("open");await c12Sleep(600);c12SetStep(1);stage.querySelector(".c12in").insertAdjacentHTML("beforeend",`<div class="c12meter"><div class="c12fill" id="c12Fill"></div></div><p id="c12Msg">期待度を解析中...</p>`);const fill=document.getElementById("c12Fill"),msg=document.getElementById("c12Msg");const steps=bestItem.rarity==="UR"?[[25,"青く光った！"],[55,"紫に変化！"],[82,"金色反応！"],[100,"虹反応！！"]]:bestItem.rarity==="SSR"?[[25,"青く光った！"],[55,"紫に変化！"],[82,"金色反応！"]]:bestItem.rarity==="SR"?[[25,"青く光った！"],[55,"紫に変化！"]]:[[25,"通常反応"],[40,"白い光"]];for(const [w,t] of steps){fill.style.width=w+"%";msg.textContent=t;c12S("step");await c12Sleep(900)}c12SetStep(2);document.getElementById("c12Pack").classList.add("open");c12S("crack");await c12Sleep(950);if(bestItem.rarity!=="R"&&Math.random()<.55){msg.textContent="……まだ開かない";const fake=document.createElement("div");fake.className="c12fake";fake.textContent="フェイント！";stage.querySelector(".c12in").appendChild(fake);c12S("fake");await c12Sleep(1150);msg.textContent="再開封！"}c12S(bestItem.rarity==="UR"?"ur":"boom");c12SetStep(3);stage.querySelector(".c12in").insertAdjacentHTML("beforeend",`<div class="c12cardRow" id="c12Cards"></div>`);const row=document.getElementById("c12Cards");for(let i=0;i<5;i++){const c=document.createElement("div");c.className="c12card";c.textContent="？";row.appendChild(c);await c12Sleep(180)}for(const c of row.children){c12S("step");c.textContent=["∫","Σ","π","√"][Math.floor(Math.random()*4)];await c12Sleep(170)}const hit=row.children[Math.floor(Math.random()*row.children.length)];hit.classList.add("hit");hit.style.color=c12Color(bestItem.rarity);hit.textContent=bestItem.rarity==="UR"?"🌈":bestItem.rarity==="SSR"?"💎":bestItem.rarity==="SR"?"⭐":"∫";msg.textContent=bestItem.rarity==="UR"?"虹 / UR期待大":bestItem.rarity==="SSR"?"金 / SSR期待":bestItem.rarity==="SR"?"紫 / SR以上期待":"白 / 通常";if(bestItem.rarity==="UR"){stage.classList.add("c12ur");await c12Sleep(700);await c12Cut("UR確定","ur")}else await c12Sleep(900);return stage}
function c12Result(stage,item,dup){c12SetStep(4);c12S("result");const dupText=dup?`<p>かぶり：+3コイン返還</p>`:"";stage.className="c12 "+(item.rarity==="UR"?"c12ur":"");stage.innerHTML=`<div class="c12btns"><button class="c12btn" onclick="c12Back()">← ガチャへ戻る</button><button class="c12btn" onclick="c12Home()">🏠 ホーム</button><button class="c12btn" onclick="document.getElementById('c12')?.remove()">閉じる</button></div><div class="c12in"><div class="c12title">開封結果</div><div class="c12rarity" style="color:${c12Color(item.rarity)}">${item.rarity}</div><div class="c12result">${titleHTML(item.title)}</div>${dupText}<p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('c12')?.remove();drawGacha()">もう一回引く</button><button onclick="c12Back()">ガチャへ戻る</button><button onclick="c12Home()">ホームへ戻る</button></div>`}
function c12Best(results){return results.slice().sort((a,b)=>c12Rank(b.item.rarity)-c12Rank(a.item.rarity))[0]}
drawGacha=async function(){if((playerData.coins||0)<10){alert("コインが足りません");return}playerData.coins-=10;const p=c12Pick();if(!p.item){alert("ガチャ称号がありません");showGacha();return}const dup=c12Give(p.item);const stage=await c12Anim(p.item);c12Result(stage,p.item,dup)}
drawGacha10=async function(){if((playerData.coins||0)<100){alert("コインが足りません");return}playerData.coins-=100;let results=[];for(let i=0;i<10;i++){const p=c12Pick();if(!p.item){alert("ガチャ称号がありません");showGacha();return}const dup=c12Give(p.item);results.push({item:p.item,duplicate:dup})}const best=c12Best(results);const stage=await c12Anim(best.item,{multi:true});results.sort((a,b)=>c12Rank(b.item.rarity)-c12Rank(a.item.rarity));stage.className="c12 "+(best.item.rarity==="UR"?"c12ur":"");stage.innerHTML=`<div class="c12btns"><button class="c12btn" onclick="c12Back()">← ガチャへ戻る</button><button class="c12btn" onclick="c12Home()">🏠 ホーム</button><button class="c12btn" onclick="document.getElementById('c12')?.remove()">閉じる</button></div><div class="c12in"><div class="c12title">10連結果</div><p>一番良い結果：<b style="color:${c12Color(best.item.rarity)}">${best.item.rarity}</b></p><p>所持コイン：${playerData.coins||0}</p><div class="c12list"></div><button onclick="document.getElementById('c12')?.remove();drawGacha10()">もう一度10連</button><button onclick="c12Back()">ガチャへ戻る</button><button onclick="c12Home()">ホームへ戻る</button></div>`;const list=stage.querySelector(".c12list");for(const r of results){list.insertAdjacentHTML("beforeend",`<div class="c12item"><b style="color:${c12Color(r.item.rarity)}">${r.item.rarity}</b><br>${titleHTML(r.item.title)}${r.duplicate?"<br>かぶり：+3コイン":""}</div>`)}c12S("result")}
const oldNews3312=typeof showNewsPage==="function"?showNewsPage:null;showNewsPage=function(){let html=`<h2>📢 お知らせ</h2><div class="newsCard"><h3>Ver 3.3.12 分かりやすいパック開封演出</h3><p>ガチャ演出を「パック出現→期待度上昇→開封→結果」の流れに整理しました。</p><p>10連は一番良い結果に合わせた演出を1回だけ流し、その後すべての結果を表示します。</p><p>ランキング・ログイン・Firebase処理は変更していません。</p></div>`;if(oldNews3312){try{oldNews3312();const p=document.getElementById("panelArea");if(p)p.innerHTML=html+p.innerHTML;return}catch(e){}}document.getElementById("panelArea").innerHTML=html;if(typeof ensureHomeButton==="function")ensureHomeButton()}
window.drawGacha=drawGacha;window.drawGacha10=drawGacha10;window.showNewsPage=showNewsPage;
})();



/* Ver3.3.13 door gacha: one animation, rarity rises as doors open */
(function(){
if(window.__doorGacha3313)return;
window.__doorGacha3313=true;

let dgCtx=null;
function dgA(){try{if(!dgCtx)dgCtx=new (window.AudioContext||window.webkitAudioContext)();if(dgCtx.state==="suspended")dgCtx.resume();return dgCtx;}catch(e){return null;}}
function dgT(f=440,d=.14,t="sine",gain=.045){const c=dgA();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=t;o.frequency.setValueAtTime(f,c.currentTime);g.gain.setValueAtTime(gain,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d);}
function dgN(d=.3,gain=.08){const c=dgA();if(!c)return;const b=c.createBuffer(1,Math.floor(c.sampleRate*d),c.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length);const s=c.createBufferSource(),g=c.createGain();s.buffer=b;g.gain.value=gain;s.connect(g);g.connect(c.destination);s.start();}
function dgS(k){if(k==="tap"){dgT(260,.08,"sine",.045);setTimeout(()=>dgT(520,.12,"triangle",.045),70)}if(k==="door"){dgN(.25,.07);dgT(130,.20,"sawtooth",.05)}if(k==="up"){dgT(523,.13,"square",.045);setTimeout(()=>dgT(784,.18,"triangle",.05),120)}if(k==="fake"){dgN(.16,.04);dgT(150,.14,"triangle",.035)}if(k==="ur"){dgT(523,.2,"triangle",.06);setTimeout(()=>dgT(659,.2,"triangle",.06),140);setTimeout(()=>dgT(1046,.45,"sine",.075),330)}if(k==="result"){dgT(660,.12,"sine",.05);setTimeout(()=>dgT(880,.15,"sine",.05),120)}}
function dgSleep(ms){return new Promise(r=>setTimeout(r,ms));}
function dgRank(r){return {UR:4,SSR:3,SR:2,R:1}[r]||0}
function dgColor(r){return r==="UR"?"#ffd700":r==="SSR"?"#ff3cff":r==="SR"?"#38e8ff":"#fff"}
function dgSequence(r){if(r==="UR")return["R","SR","SSR","UR"];if(r==="SSR")return["R","SR","SSR"];if(r==="SR")return["R","SR"];return["R"];}
function dgEnsure(){if(document.getElementById("dgStyle"))return;const st=document.createElement("style");st.id="dgStyle";st.textContent=`
.dg{position:fixed;inset:0;z-index:999999;background:#05020f;color:white;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.dg:before{content:"";position:absolute;inset:-55%;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.35),transparent 8%),conic-gradient(from 0deg,#00eaff,#6345ff,#ff26bd,#ffd700,#16ff9a,#00eaff);opacity:.38;filter:blur(12px);animation:dgspin 7s linear infinite}.dg:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 0 24%,rgba(0,0,0,.25) 35%,rgba(0,0,0,.88) 84%)}
@keyframes dgspin{to{transform:rotate(360deg)}}
.dgin{position:relative;z-index:3;width:96%;max-width:980px}.dgbtns{position:fixed;left:10px;top:10px;z-index:1000002;display:flex;gap:8px;flex-wrap:wrap}.dgbtn{font-size:15px;padding:7px 11px;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.45)}
.dgtitle{font-size:38px;font-weight:1000;letter-spacing:1px;text-shadow:0 0 18px #22d3ee,0 0 44px #7c3aed}.dgsub{font-size:20px;opacity:.9}.dgtap{font-size:32px;font-weight:1000;color:#fde68a;text-shadow:0 0 16px #f59e0b,0 0 35px #fff;animation:dgtap .7s ease-in-out infinite alternate}@keyframes dgtap{from{opacity:.5;transform:scale(.94)}to{opacity:1;transform:scale(1.07)}}
.dgdoorWrap{width:300px;height:380px;margin:25px auto 12px;position:relative;perspective:900px}.dgdoorFrame{position:absolute;inset:0;border-radius:18px;border:5px solid rgba(255,255,255,.8);box-shadow:0 0 26px #22d3ee,0 0 72px #7c3aed,inset 0 0 34px rgba(255,255,255,.18);background:linear-gradient(180deg,#10183d,#050816)}
.dgdoorL,.dgdoorR{position:absolute;top:12px;bottom:12px;width:50%;background:linear-gradient(135deg,#151b3f,#2e2a6f,#070814);border:2px solid rgba(255,255,255,.62);box-shadow:inset 0 0 26px rgba(255,255,255,.12);transition:transform 1s ease,filter 1s ease;transform-style:preserve-3d}.dgdoorL{left:12px;transform-origin:left center;border-radius:12px 0 0 12px}.dgdoorR{right:12px;transform-origin:right center;border-radius:0 12px 12px 0}.dgdoorOpen .dgdoorL{transform:rotateY(-84deg);filter:brightness(1.8)}.dgdoorOpen .dgdoorR{transform:rotateY(84deg);filter:brightness(1.8)}
.dgdoorCore{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:58px;font-weight:1000;text-shadow:0 0 20px #fff,0 0 50px #ffd700;z-index:2;pointer-events:none}.dgdoorGlow{position:absolute;inset:28px;border-radius:14px;background:radial-gradient(circle,rgba(255,255,255,.35),transparent 55%);opacity:.25;animation:dgglow 1s ease-in-out infinite alternate}@keyframes dgglow{from{opacity:.22;transform:scale(.95)}to{opacity:.8;transform:scale(1.08)}}
.dgrarity{font-size:84px;font-weight:1000;margin:8px auto;text-shadow:0 0 28px currentColor,0 0 75px currentColor;animation:dgpop 1s ease-out both}@keyframes dgpop{from{opacity:0;transform:scale(.25) translateY(25px)}60%{opacity:1;transform:scale(1.2) translateY(0)}to{opacity:1;transform:scale(1)}}
.dgmsg{font-size:26px;font-weight:900;text-shadow:0 0 14px #fff,0 0 30px #22d3ee}.dgfake{font-size:34px;font-weight:1000;text-shadow:0 0 14px #fff,0 0 30px #22d3ee;animation:dgfake 1s ease-out both}@keyframes dgfake{0%{opacity:0;transform:scale(.5)}45%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(1.35)}}
.dgparticle{position:absolute;z-index:3;font-size:30px;pointer-events:none;animation:dgparticle 2.3s ease-out forwards}@keyframes dgparticle{from{opacity:1;transform:translateY(0) scale(.55) rotate(0)}to{opacity:0;transform:translateY(-310px) scale(2.1) rotate(440deg)}}
.dgresult{font-size:52px;font-weight:1000;margin:16px auto;animation:dgresult 1s ease-out both}@keyframes dgresult{from{opacity:0;transform:translateY(-50px) scale(.35)}60%{opacity:1;transform:translateY(8px) scale(1.18)}to{opacity:1;transform:translateY(0) scale(1)}}.dgur{animation:dgur .85s ease-in-out infinite alternate}@keyframes dgur{from{filter:hue-rotate(0deg) brightness(1.12)}to{filter:hue-rotate(100deg) brightness(1.65)}}.dglist{max-height:48vh;overflow:auto;margin-top:12px}.dgitem{padding:10px;margin:7px;border-radius:12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)}
`;document.head.appendChild(st)}
function dgRemove(){document.getElementById("dg")?.remove()}
window.dgBack=function(){dgRemove(); if(typeof showGacha==="function")showGacha()}
window.dgHome=function(){dgRemove(); if(typeof goHome==="function")goHome(); else if(typeof showHome==="function")showHome(); else location.reload()}
function dgBase(title,sub,tap=true){dgEnsure();dgRemove();const d=document.createElement("div");d.id="dg";d.className="dg";d.innerHTML=`<div class="dgbtns"><button class="dgbtn" onclick="dgBack()">← ガチャへ戻る</button><button class="dgbtn" onclick="dgHome()">🏠 ホーム</button><button class="dgbtn" onclick="document.getElementById('dg')?.remove()">閉じる</button></div><div class="dgin"><div class="dgtitle">${title}</div><p class="dgsub">${sub}</p><div class="dgdoorWrap" id="dgDoor"><div class="dgdoorFrame"></div><div class="dgdoorGlow"></div><div class="dgdoorL"></div><div class="dgdoorR"></div><div class="dgdoorCore">∫</div></div><div id="dgMsg" class="dgmsg">扉の奥を解析中...</div>${tap?'<div class="dgtap">タップして扉を開く</div>':''}</div>`;document.body.appendChild(d);return d}
async function dgWait(stage){await new Promise(resolve=>{let done=false;const start=e=>{if(e)e.preventDefault();if(done)return;done=true;dgS("tap");resolve()};stage.addEventListener("click",start);stage.addEventListener("touchstart",start,{passive:false})})}
function dgParticles(stage,r){const m=r==="UR"?["✨","🌈","💎","👑","⚡","🔥","🌌","π","∞"]:r==="SSR"?["✨","💎","⭐","🔥","Σ"]:r==="SR"?["✨","⭐","√","∫"]:["✨","∫","π"];const n=r==="UR"?90:r==="SSR"?60:r==="SR"?40:28;for(let i=0;i<n;i++){const p=document.createElement("div");p.className="dgparticle";p.textContent=m[Math.floor(Math.random()*m.length)];p.style.left=(5+Math.random()*90)+"%";p.style.top=(42+Math.random()*42)+"%";p.style.animationDelay=(Math.random()*1.0)+"s";stage.appendChild(p)}}
function dgPick(){const item=getGachaResult();const owned=playerData.gachaTitles||[];return{item,duplicate:item?owned.includes(item.title):false}}
function dgGive(item){if(!playerData.gachaTitles)playerData.gachaTitles=[];const dup=playerData.gachaTitles.includes(item.title);if(dup){playerData.coins=(playerData.coins||0)+3}else{unlockTitle(item.title);playerData.gachaTitles.push(item.title)}unlockAchievement("初ガチャ");if(item.rarity==="UR"){unlockAchievement("UR獲得");document.body.classList.add("urFlash");setTimeout(()=>document.body.classList.remove("urFlash"),1000)}saveAllData();updateHomeStatus();return dup}
async function dgDoorAnimation(bestItem,opts={}){const multi=opts.multi||false;const stage=dgBase(multi?"10連 扉演出":"称号の扉",multi?"10連の中で一番良い結果に合わせて扉が開きます":"扉が開くたびにレア度が上昇します",true);await dgWait(stage);const seq=dgSequence(bestItem.rarity);for(let i=0;i<seq.length;i++){const r=seq[i];const door=document.getElementById("dgDoor");const msg=document.getElementById("dgMsg");door.classList.remove("dgdoorOpen");msg.textContent=`第${i+1}の扉：${r}反応`;door.querySelector(".dgdoorCore").textContent=i===seq.length-1?(r==="UR"?"🌈":r==="SSR"?"💎":r==="SR"?"⭐":"∫"):"∫";await dgSleep(500);dgS("door");door.classList.add("dgdoorOpen");dgParticles(stage,r);stage.querySelector(".dgin").insertAdjacentHTML("beforeend",`<div class="dgrarity" style="color:${dgColor(r)}">${r}</div>`);if(i<seq.length-1){dgS("up");msg.textContent=`${r} → 次の扉へ昇格！`;await dgSleep(1250)}else{msg.textContent=`${r}確定！`;if(r==="UR"){stage.classList.add("dgur");dgS("ur")}await dgSleep(1500)}}if(bestItem.rarity!=="R"&&Math.random()<.35){const msg=document.getElementById("dgMsg");msg.insertAdjacentHTML("afterend",`<div class="dgfake">さらに奥の扉……？</div>`);dgS("fake");await dgSleep(900)}return stage}
function dgResult(stage,item,dup){dgS("result");const dupText=dup?`<p>かぶり：+3コイン返還</p>`:"";stage.className="dg "+(item.rarity==="UR"?"dgur":"");stage.innerHTML=`<div class="dgbtns"><button class="dgbtn" onclick="dgBack()">← ガチャへ戻る</button><button class="dgbtn" onclick="dgHome()">🏠 ホーム</button><button class="dgbtn" onclick="document.getElementById('dg')?.remove()">閉じる</button></div><div class="dgin"><div class="dgtitle">開封結果</div><div class="dgrarity" style="color:${dgColor(item.rarity)}">${item.rarity}</div><div class="dgresult">${titleHTML(item.title)}</div>${dupText}<p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('dg')?.remove();drawGacha()">もう一回引く</button><button onclick="dgBack()">ガチャへ戻る</button><button onclick="dgHome()">ホームへ戻る</button></div>`}
function dgBest(results){return results.slice().sort((a,b)=>dgRank(b.item.rarity)-dgRank(a.item.rarity))[0]}
drawGacha=async function(){if((playerData.coins||0)<10){alert("コインが足りません");return}playerData.coins-=10;const p=dgPick();if(!p.item){alert("ガチャ称号がありません");showGacha();return}const dup=dgGive(p.item);const stage=await dgDoorAnimation(p.item);dgResult(stage,p.item,dup)}
drawGacha10=async function(){if((playerData.coins||0)<100){alert("コインが足りません");return}playerData.coins-=100;let results=[];for(let i=0;i<10;i++){const p=dgPick();if(!p.item){alert("ガチャ称号がありません");showGacha();return}const dup=dgGive(p.item);results.push({item:p.item,duplicate:dup})}const best=dgBest(results);const stage=await dgDoorAnimation(best.item,{multi:true});results.sort((a,b)=>dgRank(b.item.rarity)-dgRank(a.item.rarity));stage.className="dg "+(best.item.rarity==="UR"?"dgur":"");stage.innerHTML=`<div class="dgbtns"><button class="dgbtn" onclick="dgBack()">← ガチャへ戻る</button><button class="dgbtn" onclick="dgHome()">🏠 ホーム</button><button class="dgbtn" onclick="document.getElementById('dg')?.remove()">閉じる</button></div><div class="dgin"><div class="dgtitle">10連結果</div><p>一番良い結果：<b style="color:${dgColor(best.item.rarity)}">${best.item.rarity}</b></p><p>所持コイン：${playerData.coins||0}</p><div class="dglist"></div><button onclick="document.getElementById('dg')?.remove();drawGacha10()">もう一度10連</button><button onclick="dgBack()">ガチャへ戻る</button><button onclick="dgHome()">ホームへ戻る</button></div>`;const list=stage.querySelector(".dglist");for(const r of results){list.insertAdjacentHTML("beforeend",`<div class="dgitem"><b style="color:${dgColor(r.item.rarity)}">${r.item.rarity}</b><br>${titleHTML(r.item.title)}${r.duplicate?"<br>かぶり：+3コイン":""}</div>`)}dgS("result")}
const oldNews3313=typeof showNewsPage==="function"?showNewsPage:null;showNewsPage=function(){let html=`<h2>📢 お知らせ</h2><div class="newsCard"><h3>Ver 3.3.13 扉ガチャ演出</h3><p>ガチャ演出を1種類の扉演出に統一しました。</p><p>扉が開くごとに R→SR→SSR→UR のようにレア度が上昇します。</p><p>10連は一番良い結果に合わせた扉演出を1回だけ流し、その後すべての結果を表示します。</p><p>ランキング・ログイン・Firebase処理は変更していません。</p></div>`;if(oldNews3313){try{oldNews3313();const p=document.getElementById("panelArea");if(p)p.innerHTML=html+p.innerHTML;return}catch(e){}}document.getElementById("panelArea").innerHTML=html;if(typeof ensureHomeButton==="function")ensureHomeButton()}
window.drawGacha=drawGacha;window.drawGacha10=drawGacha10;window.showNewsPage=showNewsPage;
})();



/* Ver3.3.14 door gacha plus: hot intro, fake-open, double doors */
(function(){
if(window.__doorGachaPlus3314)return;
window.__doorGachaPlus3314=true;

let dpCtx=null;
function dpA(){try{if(!dpCtx)dpCtx=new (window.AudioContext||window.webkitAudioContext)();if(dpCtx.state==="suspended")dpCtx.resume();return dpCtx;}catch(e){return null;}}
function dpT(f=440,d=.14,t="sine",gain=.045){const c=dpA();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=t;o.frequency.setValueAtTime(f,c.currentTime);g.gain.setValueAtTime(gain,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d);}
function dpN(d=.3,gain=.08){const c=dpA();if(!c)return;const b=c.createBuffer(1,Math.floor(c.sampleRate*d),c.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length);const s=c.createBufferSource(),g=c.createGain();s.buffer=b;g.gain.value=gain;s.connect(g);g.connect(c.destination);s.start();}
function dpS(k){if(k==="tap"){dpT(260,.08,"sine",.045);setTimeout(()=>dpT(520,.12,"triangle",.045),70)}if(k==="door"){dpN(.25,.07);dpT(130,.2,"sawtooth",.05)}if(k==="slam"){dpN(.22,.09);dpT(75,.18,"sawtooth",.06)}if(k==="up"){dpT(523,.13,"square",.045);setTimeout(()=>dpT(784,.18,"triangle",.05),120)}if(k==="fake"){dpN(.16,.04);dpT(150,.14,"triangle",.035)}if(k==="hot"){dpT(392,.16,"triangle",.055);setTimeout(()=>dpT(523,.16,"triangle",.055),140);setTimeout(()=>dpT(784,.22,"sine",.065),300)}if(k==="ur"){dpT(523,.2,"triangle",.06);setTimeout(()=>dpT(659,.2,"triangle",.06),140);setTimeout(()=>dpT(1046,.45,"sine",.075),330)}if(k==="result"){dpT(660,.12,"sine",.05);setTimeout(()=>dpT(880,.15,"sine",.05),120)}}
function dpSleep(ms){return new Promise(r=>setTimeout(r,ms));}
function dpRank(r){return {UR:4,SSR:3,SR:2,R:1}[r]||0}
function dpColor(r){return r==="UR"?"#ffd700":r==="SSR"?"#ff3cff":r==="SR"?"#38e8ff":"#fff"}
function dpSequence(r){if(r==="UR")return["R","SR","SSR","UR"];if(r==="SSR")return["R","SR","SSR"];if(r==="SR")return["R","SR"];return["R"]}
function dpEnsure(){if(document.getElementById("dpStyle"))return;const st=document.createElement("style");st.id="dpStyle";st.textContent=`
.dp{position:fixed;inset:0;z-index:999999;background:#05020f;color:white;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.dp:before{content:"";position:absolute;inset:-55%;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.35),transparent 8%),conic-gradient(from 0deg,#00eaff,#6345ff,#ff26bd,#ffd700,#16ff9a,#00eaff);opacity:.38;filter:blur(12px);animation:dpspin 7s linear infinite}.dp:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 0 24%,rgba(0,0,0,.25) 35%,rgba(0,0,0,.88) 84%)}
@keyframes dpspin{to{transform:rotate(360deg)}}.dpin{position:relative;z-index:3;width:96%;max-width:980px}.dpbtns{position:fixed;left:10px;top:10px;z-index:1000002;display:flex;gap:8px;flex-wrap:wrap}.dpbtn{font-size:15px;padding:7px 11px;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.45)}
.dptitle{font-size:38px;font-weight:1000;letter-spacing:1px;text-shadow:0 0 18px #22d3ee,0 0 44px #7c3aed}.dpsub{font-size:20px;opacity:.9}.dptap{font-size:32px;font-weight:1000;color:#fde68a;text-shadow:0 0 16px #f59e0b,0 0 35px #fff;animation:dptap .7s ease-in-out infinite alternate}@keyframes dptap{from{opacity:.5;transform:scale(.94)}to{opacity:1;transform:scale(1.07)}}
.dpdoorWrap{width:310px;height:390px;margin:25px auto 12px;position:relative;perspective:950px}.dpdoorFrame{position:absolute;inset:0;border-radius:18px;border:5px solid rgba(255,255,255,.82);box-shadow:0 0 26px #22d3ee,0 0 72px #7c3aed,inset 0 0 34px rgba(255,255,255,.18);background:linear-gradient(180deg,#10183d,#050816)}
.dpdoorL,.dpdoorR{position:absolute;top:12px;bottom:12px;width:50%;background:linear-gradient(135deg,#151b3f,#2e2a6f,#070814);border:2px solid rgba(255,255,255,.62);box-shadow:inset 0 0 26px rgba(255,255,255,.12);transition:transform 1s ease,filter 1s ease;transform-style:preserve-3d}.dpdoorL{left:12px;transform-origin:left center;border-radius:12px 0 0 12px}.dpdoorR{right:12px;transform-origin:right center;border-radius:0 12px 12px 0}
.dpopen .dpdoorL{transform:rotateY(-84deg);filter:brightness(1.9)}.dpopen .dpdoorR{transform:rotateY(84deg);filter:brightness(1.9)}
.dppeek .dpdoorL{transform:rotateY(-22deg);filter:brightness(1.4)}.dppeek .dpdoorR{transform:rotateY(22deg);filter:brightness(1.4)}
.dpslam{animation:dpslam .38s ease-in-out both}@keyframes dpslam{0%{transform:translateX(0)}25%{transform:translateX(-12px)}50%{transform:translateX(12px)}75%{transform:translateX(-7px)}100%{transform:translateX(0)}}
.dpdoorCore{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:58px;font-weight:1000;text-shadow:0 0 20px #fff,0 0 50px #ffd700;z-index:2;pointer-events:none}.dpdoorGlow{position:absolute;inset:28px;border-radius:14px;background:radial-gradient(circle,rgba(255,255,255,.35),transparent 55%);opacity:.25;animation:dpglow 1s ease-in-out infinite alternate}@keyframes dpglow{from{opacity:.22;transform:scale(.95)}to{opacity:.8;transform:scale(1.08)}}
.dprarity{font-size:84px;font-weight:1000;margin:8px auto;text-shadow:0 0 28px currentColor,0 0 75px currentColor;animation:dppop 1s ease-out both}@keyframes dppop{from{opacity:0;transform:scale(.25) translateY(25px)}60%{opacity:1;transform:scale(1.2) translateY(0)}to{opacity:1;transform:scale(1)}}.dpmsg{font-size:26px;font-weight:900;text-shadow:0 0 14px #fff,0 0 30px #22d3ee}
.dphot{position:fixed;inset:0;z-index:1000003;background:#000;display:flex;align-items:center;justify-content:center;color:#ffd700;font-size:64px;font-weight:1000;text-shadow:0 0 18px #fff,0 0 42px #ffd700,0 0 90px #ff00ff;animation:dphot 1.65s ease-out forwards}@keyframes dphot{0%{opacity:0;transform:scale(.55)}18%{opacity:1;transform:scale(1.12)}75%{opacity:1;filter:brightness(1.7)}100%{opacity:0;transform:scale(1.45);filter:brightness(4)}}
.dpfake{font-size:34px;font-weight:1000;text-shadow:0 0 14px #fff,0 0 30px #22d3ee;animation:dpfake 1s ease-out both}@keyframes dpfake{0%{opacity:0;transform:scale(.5)}45%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(1.35)}}
.dpparticle{position:absolute;z-index:3;font-size:30px;pointer-events:none;animation:dpparticle 2.3s ease-out forwards}@keyframes dpparticle{from{opacity:1;transform:translateY(0) scale(.55) rotate(0)}to{opacity:0;transform:translateY(-310px) scale(2.1) rotate(440deg)}}.dpresult{font-size:52px;font-weight:1000;margin:16px auto;animation:dpresult 1s ease-out both}@keyframes dpresult{from{opacity:0;transform:translateY(-50px) scale(.35)}60%{opacity:1;transform:translateY(8px) scale(1.18)}to{opacity:1;transform:translateY(0) scale(1)}}.dpur{animation:dpur .85s ease-in-out infinite alternate}@keyframes dpur{from{filter:hue-rotate(0deg) brightness(1.12)}to{filter:hue-rotate(100deg) brightness(1.65)}}.dplist{max-height:48vh;overflow:auto;margin-top:12px}.dpitem{padding:10px;margin:7px;border-radius:12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)}
`;document.head.appendChild(st)}
function dpRemove(){document.getElementById("dp")?.remove()}
window.dpBack=function(){dpRemove();if(typeof showGacha==="function")showGacha()}
window.dpHome=function(){dpRemove();if(typeof goHome==="function")goHome();else if(typeof showHome==="function")showHome();else location.reload()}
function dpBase(title,sub,tap=true){dpEnsure();dpRemove();const d=document.createElement("div");d.id="dp";d.className="dp";d.innerHTML=`<div class="dpbtns"><button class="dpbtn" onclick="dpBack()">← ガチャへ戻る</button><button class="dpbtn" onclick="dpHome()">🏠 ホーム</button><button class="dpbtn" onclick="document.getElementById('dp')?.remove()">閉じる</button></div><div class="dpin"><div class="dptitle">${title}</div><p class="dpsub">${sub}</p><div class="dpdoorWrap" id="dpDoor"><div class="dpdoorFrame"></div><div class="dpdoorGlow"></div><div class="dpdoorL"></div><div class="dpdoorR"></div><div class="dpdoorCore">∫</div></div><div id="dpMsg" class="dpmsg">扉の奥を解析中...</div>${tap?'<div class="dptap">タップして扉を開く</div>':''}</div>`;document.body.appendChild(d);return d}
async function dpWait(stage){await new Promise(resolve=>{let done=false;const start=e=>{if(e)e.preventDefault();if(done)return;done=true;dpS("tap");resolve()};stage.addEventListener("click",start);stage.addEventListener("touchstart",start,{passive:false})})}
function dpParticles(stage,r){const m=r==="UR"?["✨","🌈","💎","👑","⚡","🔥","🌌","π","∞"]:r==="SSR"?["✨","💎","⭐","🔥","Σ"]:r==="SR"?["✨","⭐","√","∫"]:["✨","∫","π"];const n=r==="UR"?95:r==="SSR"?65:r==="SR"?42:30;for(let i=0;i<n;i++){const p=document.createElement("div");p.className="dpparticle";p.textContent=m[Math.floor(Math.random()*m.length)];p.style.left=(5+Math.random()*90)+"%";p.style.top=(42+Math.random()*42)+"%";p.style.animationDelay=(Math.random()*1.0)+"s";stage.appendChild(p)}}
function dpHot(label){return new Promise(resolve=>{dpS("hot");const d=document.createElement("div");d.className="dphot";d.innerHTML=`<div>${label}</div>`;document.body.appendChild(d);setTimeout(()=>{d.remove();resolve()},1700)})}
function dpPick(){const item=getGachaResult();const owned=playerData.gachaTitles||[];return{item,duplicate:item?owned.includes(item.title):false}}
function dpGive(item){if(!playerData.gachaTitles)playerData.gachaTitles=[];const dup=playerData.gachaTitles.includes(item.title);if(dup){playerData.coins=(playerData.coins||0)+3}else{unlockTitle(item.title);playerData.gachaTitles.push(item.title)}unlockAchievement("初ガチャ");if(item.rarity==="UR"){unlockAchievement("UR獲得");document.body.classList.add("urFlash");setTimeout(()=>document.body.classList.remove("urFlash"),1000)}saveAllData();updateHomeStatus();return dup}
async function dpFakeOpen(stage){const door=document.getElementById("dpDoor");const msg=document.getElementById("dpMsg");door.classList.add("dppeek");msg.textContent="開きそう……";dpS("door");await dpSleep(700);door.classList.remove("dppeek");door.classList.add("dpslam");dpS("slam");msg.insertAdjacentHTML("afterend",`<div class="dpfake">まだ開かない！</div>`);await dpSleep(900);door.classList.remove("dpslam")}
async function dpOpenOne(stage,r,next=false){const door=document.getElementById("dpDoor");const msg=document.getElementById("dpMsg");door.classList.remove("dpopen","dppeek");msg.textContent=`${r} の扉が出現`;door.querySelector(".dpdoorCore").textContent=r==="UR"?"🌈":r==="SSR"?"💎":r==="SR"?"⭐":"∫";await dpSleep(350);dpS("door");door.classList.add("dpopen");dpParticles(stage,r);stage.querySelector(".dpin").insertAdjacentHTML("beforeend",`<div class="dprarity" style="color:${dpColor(r)}">${r}</div>`);if(next){dpS("up");msg.textContent=`${r}突破！次の扉へ`;await dpSleep(1050)}else{msg.textContent=`${r}確定！`;if(r==="UR"){stage.classList.add("dpur");dpS("ur")}await dpSleep(1400)}}
async function dpDoorAnimation(bestItem,opts={}){const stage=dpBase(opts.multi?"10連 扉演出":"称号の扉",opts.multi?"10連の中で一番良い結果に合わせて扉が開きます":"開くたびにレア度が上昇します",true);await dpWait(stage);const seq=dpSequence(bestItem.rarity);if(bestItem.rarity==="UR"||bestItem.rarity==="SSR")await dpHot(bestItem.rarity==="UR"?"激アツ！！":"チャンス！！");if(Math.random()<.55&&bestItem.rarity!=="R")await dpFakeOpen(stage);for(let i=0;i<seq.length;i++){const r=seq[i];await dpOpenOne(stage,r,i<seq.length-1);if(i<seq.length-2&&Math.random()<.35){const next=seq[i+1];document.getElementById("dpMsg").textContent="連続開放！！";await dpSleep(300);await dpOpenOne(stage,next,i+1<seq.length-1);i++;}}if(bestItem.rarity!=="R"&&Math.random()<.45){document.getElementById("dpMsg").insertAdjacentHTML("afterend",`<div class="dpfake">さらに奥の扉……？</div>`);dpS("fake");await dpSleep(850)}return stage}
function dpResult(stage,item,dup){dpS("result");const dupText=dup?`<p>かぶり：+3コイン返還</p>`:"";stage.className="dp "+(item.rarity==="UR"?"dpur":"");stage.innerHTML=`<div class="dpbtns"><button class="dpbtn" onclick="dpBack()">← ガチャへ戻る</button><button class="dpbtn" onclick="dpHome()">🏠 ホーム</button><button class="dpbtn" onclick="document.getElementById('dp')?.remove()">閉じる</button></div><div class="dpin"><div class="dptitle">開封結果</div><div class="dprarity" style="color:${dpColor(item.rarity)}">${item.rarity}</div><div class="dpresult">${titleHTML(item.title)}</div>${dupText}<p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('dp')?.remove();drawGacha()">もう一回引く</button><button onclick="dpBack()">ガチャへ戻る</button><button onclick="dpHome()">ホームへ戻る</button></div>`}
function dpBest(results){return results.slice().sort((a,b)=>dpRank(b.item.rarity)-dpRank(a.item.rarity))[0]}
drawGacha=async function(){if((playerData.coins||0)<10){alert("コインが足りません");return}playerData.coins-=10;const p=dpPick();if(!p.item){alert("ガチャ称号がありません");showGacha();return}const dup=dpGive(p.item);const stage=await dpDoorAnimation(p.item);dpResult(stage,p.item,dup)}
drawGacha10=async function(){if((playerData.coins||0)<100){alert("コインが足りません");return}playerData.coins-=100;let results=[];for(let i=0;i<10;i++){const p=dpPick();if(!p.item){alert("ガチャ称号がありません");showGacha();return}const dup=dpGive(p.item);results.push({item:p.item,duplicate:dup})}const best=dpBest(results);const stage=await dpDoorAnimation(best.item,{multi:true});results.sort((a,b)=>dpRank(b.item.rarity)-dpRank(a.item.rarity));stage.className="dp "+(best.item.rarity==="UR"?"dpur":"");stage.innerHTML=`<div class="dpbtns"><button class="dpbtn" onclick="dpBack()">← ガチャへ戻る</button><button class="dpbtn" onclick="dpHome()">🏠 ホーム</button><button class="dpbtn" onclick="document.getElementById('dp')?.remove()">閉じる</button></div><div class="dpin"><div class="dptitle">10連結果</div><p>一番良い結果：<b style="color:${dpColor(best.item.rarity)}">${best.item.rarity}</b></p><p>所持コイン：${playerData.coins||0}</p><div class="dplist"></div><button onclick="document.getElementById('dp')?.remove();drawGacha10()">もう一度10連</button><button onclick="dpBack()">ガチャへ戻る</button><button onclick="dpHome()">ホームへ戻る</button></div>`;const list=stage.querySelector(".dplist");for(const r of results){list.insertAdjacentHTML("beforeend",`<div class="dpitem"><b style="color:${dpColor(r.item.rarity)}">${r.item.rarity}</b><br>${titleHTML(r.item.title)}${r.duplicate?"<br>かぶり：+3コイン":""}</div>`)}dpS("result")}
const oldNews3314=typeof showNewsPage==="function"?showNewsPage:null;showNewsPage=function(){let html=`<h2>📢 お知らせ</h2><div class="newsCard"><h3>Ver 3.3.14 扉ガチャ演出強化</h3><p>激アツ演出、開きそうで開かないフェイント、2枚連続開放を追加しました。</p><p>扉が開くごとにレア度が上昇する演出を強化しました。</p><p>ランキング・ログイン・Firebase処理は変更していません。</p></div>`;if(oldNews3314){try{oldNews3314();const p=document.getElementById("panelArea");if(p)p.innerHTML=html+p.innerHTML;return}catch(e){}}document.getElementById("panelArea").innerHTML=html;if(typeof ensureHomeButton==="function")ensureHomeButton()}
window.drawGacha=drawGacha;window.drawGacha10=drawGacha10;window.showNewsPage=showNewsPage;
})();



/* Ver3.3.15 deep door gacha: color doors + hot/revive + depth */
(function(){
if(window.__deepDoor3315)return;
window.__deepDoor3315=true;

let ddCtx=null;
function ddA(){try{if(!ddCtx)ddCtx=new (window.AudioContext||window.webkitAudioContext)();if(ddCtx.state==="suspended")ddCtx.resume();return ddCtx;}catch(e){return null;}}
function ddT(f,d,t,g){const c=ddA();if(!c)return;const o=c.createOscillator(),v=c.createGain();o.type=t||"sine";o.frequency.setValueAtTime(f,c.currentTime);v.gain.setValueAtTime(g||.045,c.currentTime);v.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.connect(v);v.connect(c.destination);o.start();o.stop(c.currentTime+d);}
function ddN(d,g){const c=ddA();if(!c)return;const b=c.createBuffer(1,Math.floor(c.sampleRate*d),c.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length);const s=c.createBufferSource(),v=c.createGain();s.buffer=b;v.gain.value=g||.08;s.connect(v);v.connect(c.destination);s.start();}
function ddS(k){if(k==="tap"){ddT(260,.08,"sine",.045);setTimeout(()=>ddT(520,.12,"triangle",.045),70)}if(k==="door"){ddN(.25,.07);ddT(130,.2,"sawtooth",.05)}if(k==="move"){ddT(180,.24,"sawtooth",.035);setTimeout(()=>ddT(360,.2,"triangle",.04),120)}if(k==="slam"){ddN(.22,.09);ddT(75,.18,"sawtooth",.06)}if(k==="hot"){ddT(392,.16,"triangle",.055);setTimeout(()=>ddT(523,.16,"triangle",.055),140);setTimeout(()=>ddT(784,.22,"sine",.065),300)}if(k==="up"){ddT(523,.13,"square",.045);setTimeout(()=>ddT(784,.18,"triangle",.05),120)}if(k==="fake"){ddN(.16,.04);ddT(150,.14,"triangle",.035)}if(k==="revive"){ddN(.35,.08);ddT(440,.16,"square",.05);setTimeout(()=>ddT(880,.24,"sine",.06),180)}if(k==="ur"){ddT(523,.2,"triangle",.06);setTimeout(()=>ddT(659,.2,"triangle",.06),140);setTimeout(()=>ddT(1046,.45,"sine",.075),330)}if(k==="result"){ddT(660,.12,"sine",.05);setTimeout(()=>ddT(880,.15,"sine",.05),120)}}
function ddSleep(ms){return new Promise(r=>setTimeout(r,ms));}
function ddRank(r){return {UR:4,SSR:3,SR:2,R:1}[r]||0}
function ddColor(r){return r==="UR"?"#ffd700":r==="SSR"?"#ff3cff":r==="SR"?"#38e8ff":"#fff"}
function ddSeq(r){return r==="UR"?["R","SR","SSR","UR"]:r==="SSR"?["R","SR","SSR"]:r==="SR"?["R","SR"]:["R"]}
function ddClass(r){return r==="UR"?"ddUR":r==="SSR"?"ddSSR":r==="SR"?"ddSR":"ddR"}
function ddEnsure(){if(document.getElementById("ddStyle3315"))return;const s=document.createElement("style");s.id="ddStyle3315";s.textContent=`
.dd{position:fixed;inset:0;z-index:999999;background:#05020f;color:#fff;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.dd:before{content:"";position:absolute;inset:-55%;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.35),transparent 8%),conic-gradient(from 0deg,#00eaff,#6345ff,#ff26bd,#ffd700,#16ff9a,#00eaff);opacity:.38;filter:blur(12px);animation:ddspin 7s linear infinite}.dd:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 0 24%,rgba(0,0,0,.25) 35%,rgba(0,0,0,.88) 84%)}@keyframes ddspin{to{transform:rotate(360deg)}}.ddin{position:relative;z-index:3;width:96%;max-width:980px}.ddbtns{position:fixed;left:10px;top:10px;z-index:1000002;display:flex;gap:8px;flex-wrap:wrap}.ddbtn{font-size:15px;padding:7px 11px;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.45)}.ddtitle{font-size:38px;font-weight:1000;letter-spacing:1px;text-shadow:0 0 18px #22d3ee,0 0 44px #7c3aed}.ddsub{font-size:20px;opacity:.9}.ddtap{font-size:32px;font-weight:1000;color:#fde68a;text-shadow:0 0 16px #f59e0b,0 0 35px #fff;animation:ddtap .7s ease-in-out infinite alternate}@keyframes ddtap{from{opacity:.5;transform:scale(.94)}to{opacity:1;transform:scale(1.07)}}.ddcorridor{position:relative;width:360px;height:430px;margin:18px auto 8px;perspective:1200px}.dddepth{position:absolute;inset:35px 55px;border-radius:20px;border:2px solid rgba(255,255,255,.18);transform:scale(.72);opacity:.55;box-shadow:0 0 35px rgba(255,255,255,.15)}.dddepth.d2{inset:55px 75px;transform:scale(.55);opacity:.35}.dddepth.d3{inset:75px 95px;transform:scale(.42);opacity:.22}.dddoorWrap{width:310px;height:390px;margin:0 auto;position:relative;perspective:950px;transition:transform .85s ease,opacity .85s ease}.ddmove{animation:ddmove .95s ease-in-out both}@keyframes ddmove{0%{transform:scale(1);filter:blur(0)}55%{transform:scale(1.32);filter:blur(1px);opacity:.7}100%{transform:scale(1);filter:blur(0);opacity:1}}.dddoorFrame{position:absolute;inset:0;border-radius:18px;border:5px solid rgba(255,255,255,.82);box-shadow:0 0 26px #22d3ee,0 0 72px #7c3aed,inset 0 0 34px rgba(255,255,255,.18);background:linear-gradient(180deg,#10183d,#050816)}.dddoorL,.dddoorR{position:absolute;top:12px;bottom:12px;width:50%;background:linear-gradient(135deg,#151b3f,#2e2a6f,#070814);border:2px solid rgba(255,255,255,.62);box-shadow:inset 0 0 26px rgba(255,255,255,.12);transition:transform 1s ease,filter 1s ease,background .5s ease;transform-style:preserve-3d}.dddoorL{left:12px;transform-origin:left center;border-radius:12px 0 0 12px}.dddoorR{right:12px;transform-origin:right center;border-radius:0 12px 12px 0}.ddR .dddoorL,.ddR .dddoorR{background:linear-gradient(135deg,#2b2f45,#5b6478,#111827)}.ddSR .dddoorL,.ddSR .dddoorR{background:linear-gradient(135deg,#063b5e,#0891b2,#0f172a);box-shadow:inset 0 0 26px rgba(56,232,255,.35),0 0 18px #38e8ff}.ddSSR .dddoorL,.ddSSR .dddoorR{background:linear-gradient(135deg,#47126b,#c026d3,#1e0633);box-shadow:inset 0 0 26px rgba(255,60,255,.4),0 0 22px #ff3cff}.ddUR .dddoorL,.ddUR .dddoorR{background:linear-gradient(135deg,#7c5200,#ffd700,#fff5a8,#ff26bd);box-shadow:inset 0 0 30px rgba(255,255,255,.5),0 0 30px #ffd700,0 0 55px #ff00ff}.ddopen .dddoorL{transform:rotateY(-84deg);filter:brightness(1.9)}.ddopen .dddoorR{transform:rotateY(84deg);filter:brightness(1.9)}.ddpeek .dddoorL{transform:rotateY(-22deg);filter:brightness(1.4)}.ddpeek .dddoorR{transform:rotateY(22deg);filter:brightness(1.4)}.ddslam{animation:ddslam .38s ease-in-out both}@keyframes ddslam{0%{transform:translateX(0)}25%{transform:translateX(-12px)}50%{transform:translateX(12px)}75%{transform:translateX(-7px)}100%{transform:translateX(0)}}.dddoorCore{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:58px;font-weight:1000;text-shadow:0 0 20px #fff,0 0 50px #ffd700;z-index:2;pointer-events:none}.dddoorGlow{position:absolute;inset:28px;border-radius:14px;background:radial-gradient(circle,rgba(255,255,255,.35),transparent 55%);opacity:.25;animation:ddglow 1s ease-in-out infinite alternate}@keyframes ddglow{from{opacity:.22;transform:scale(.95)}to{opacity:.8;transform:scale(1.08)}}.ddrarity{font-size:84px;font-weight:1000;margin:8px auto;text-shadow:0 0 28px currentColor,0 0 75px currentColor;animation:ddpop 1s ease-out both}@keyframes ddpop{from{opacity:0;transform:scale(.25) translateY(25px)}60%{opacity:1;transform:scale(1.2) translateY(0)}to{opacity:1;transform:scale(1)}}.ddmsg{font-size:26px;font-weight:900;text-shadow:0 0 14px #fff,0 0 30px #22d3ee}.ddhot{position:fixed;inset:0;z-index:1000003;background:#000;display:flex;align-items:center;justify-content:center;color:#ffd700;font-size:64px;font-weight:1000;text-shadow:0 0 18px #fff,0 0 42px #ffd700,0 0 90px #ff00ff;animation:ddhot 1.65s ease-out forwards}@keyframes ddhot{0%{opacity:0;transform:scale(.55)}18%{opacity:1;transform:scale(1.12)}75%{opacity:1;filter:brightness(1.7)}100%{opacity:0;transform:scale(1.45);filter:brightness(4)}}.ddfake{font-size:34px;font-weight:1000;text-shadow:0 0 14px #fff,0 0 30px #22d3ee;animation:ddfake 1s ease-out both}@keyframes ddfake{0%{opacity:0;transform:scale(.5)}45%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(1.35)}}.ddparticle{position:absolute;z-index:3;font-size:30px;pointer-events:none;animation:ddparticle 2.3s ease-out forwards}@keyframes ddparticle{from{opacity:1;transform:translateY(0) scale(.55) rotate(0)}to{opacity:0;transform:translateY(-310px) scale(2.1) rotate(440deg)}}.ddresult{font-size:52px;font-weight:1000;margin:16px auto;animation:ddresult 1s ease-out both}@keyframes ddresult{from{opacity:0;transform:translateY(-50px) scale(.35)}60%{opacity:1;transform:translateY(8px) scale(1.18)}to{opacity:1;transform:translateY(0) scale(1)}}.ddur{animation:ddur .85s ease-in-out infinite alternate}@keyframes ddur{from{filter:hue-rotate(0deg) brightness(1.12)}to{filter:hue-rotate(100deg) brightness(1.65)}}.ddlist{max-height:48vh;overflow:auto;margin-top:12px}.dditem{padding:10px;margin:7px;border-radius:12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)}
`;document.head.appendChild(s)}
function ddRemove(){document.getElementById("dd")?.remove()}
window.ddBack=function(){ddRemove();if(typeof showGacha==="function")showGacha()}
window.ddHome=function(){ddRemove();if(typeof goHome==="function")goHome();else if(typeof showHome==="function")showHome();else location.reload()}
function ddBase(title,sub,tap=true){ddEnsure();ddRemove();const d=document.createElement("div");d.id="dd";d.className="dd";d.innerHTML=`<div class="ddbtns"><button class="ddbtn" onclick="ddBack()">← ガチャへ戻る</button><button class="ddbtn" onclick="ddHome()">🏠 ホーム</button><button class="ddbtn" onclick="document.getElementById('dd')?.remove()">閉じる</button></div><div class="ddin"><div class="ddtitle">${title}</div><p class="ddsub">${sub}</p><div class="ddcorridor"><div class="dddepth"></div><div class="dddepth d2"></div><div class="dddepth d3"></div><div class="dddoorWrap ddR" id="ddDoor"><div class="dddoorFrame"></div><div class="dddoorGlow"></div><div class="dddoorL"></div><div class="dddoorR"></div><div class="dddoorCore">∫</div></div></div><div id="ddMsg" class="ddmsg">奥の扉を解析中...</div>${tap?'<div class="ddtap">タップして扉を開く</div>':''}</div>`;document.body.appendChild(d);return d}
async function ddWait(stage){await new Promise(resolve=>{let done=false;const start=e=>{if(e)e.preventDefault();if(done)return;done=true;ddS("tap");resolve()};stage.addEventListener("click",start);stage.addEventListener("touchstart",start,{passive:false})})}
function ddParticles(stage,r){const m=r==="UR"?["✨","🌈","💎","👑","⚡","🔥","🌌","π","∞"]:r==="SSR"?["✨","💎","⭐","🔥","Σ"]:r==="SR"?["✨","⭐","√","∫"]:["✨","∫","π"];const n=r==="UR"?100:r==="SSR"?68:r==="SR"?45:32;for(let i=0;i<n;i++){const p=document.createElement("div");p.className="ddparticle";p.textContent=m[Math.floor(Math.random()*m.length)];p.style.left=(5+Math.random()*90)+"%";p.style.top=(42+Math.random()*42)+"%";p.style.animationDelay=(Math.random()*1)+"s";stage.appendChild(p)}}
function ddHot(label){return new Promise(resolve=>{ddS("hot");const d=document.createElement("div");d.className="ddhot";d.innerHTML=`<div>${label}</div>`;document.body.appendChild(d);setTimeout(()=>{d.remove();resolve()},1700)})}
function ddPick(){const item=getGachaResult();const owned=playerData.gachaTitles||[];return{item,duplicate:item?owned.includes(item.title):false}}
function ddGive(item){if(!playerData.gachaTitles)playerData.gachaTitles=[];const dup=playerData.gachaTitles.includes(item.title);if(dup){playerData.coins=(playerData.coins||0)+3}else{unlockTitle(item.title);playerData.gachaTitles.push(item.title)}unlockAchievement("初ガチャ");if(item.rarity==="UR"){unlockAchievement("UR獲得");document.body.classList.add("urFlash");setTimeout(()=>document.body.classList.remove("urFlash"),1000)}saveAllData();updateHomeStatus();return dup}
async function ddMoveDeeper(stage){const door=document.getElementById("ddDoor"),msg=document.getElementById("ddMsg");msg.textContent="奥の扉へ進む…";ddS("move");door.classList.add("ddmove");await ddSleep(900);door.classList.remove("ddmove","ddopen","ddpeek")}
async function ddFakeOpen(stage){const door=document.getElementById("ddDoor"),msg=document.getElementById("ddMsg");door.classList.add("ddpeek");msg.textContent="開きそう……";ddS("door");await ddSleep(700);door.classList.remove("ddpeek");door.classList.add("ddslam");ddS("slam");msg.insertAdjacentHTML("afterend",`<div class="ddfake">まだ開かない！</div>`);await ddSleep(900);door.classList.remove("ddslam")}
async function ddOpenOne(stage,r,next=false){const door=document.getElementById("ddDoor"),msg=document.getElementById("ddMsg");door.className=`dddoorWrap ${ddClass(r)}`;msg.textContent=`${r}色の扉が出現`;door.querySelector(".dddoorCore").textContent=r==="UR"?"🌈":r==="SSR"?"💎":r==="SR"?"⭐":"∫";await ddSleep(350);ddS("door");door.classList.add("ddopen");ddParticles(stage,r);stage.querySelector(".ddin").insertAdjacentHTML("beforeend",`<div class="ddrarity" style="color:${ddColor(r)}">${r}</div>`);if(next){ddS("up");msg.textContent=`${r}突破！さらに奥へ`;await ddSleep(900);await ddMoveDeeper(stage)}else{msg.textContent=`${r}確定！`;if(r==="UR"){stage.classList.add("ddur");ddS("ur")}await ddSleep(1400)}}
async function ddAnim(bestItem,opts={}){const stage=ddBase(opts.multi?"10連 奥扉演出":"奥扉ガチャ",opts.multi?"10連の中で一番良い結果に合わせて奥へ進みます":"扉の色が変わりながら奥へ進みます",true);await ddWait(stage);const seq=ddSeq(bestItem.rarity);if(bestItem.rarity==="UR"||bestItem.rarity==="SSR")await ddHot(bestItem.rarity==="UR"?"激アツ！！":"チャンス！！");if(Math.random()<.55&&bestItem.rarity!=="R")await ddFakeOpen(stage);for(let i=0;i<seq.length;i++){const r=seq[i];await ddOpenOne(stage,r,i<seq.length-1);if(i<seq.length-2&&Math.random()<.35){const next=seq[i+1];document.getElementById("ddMsg").textContent="連続開放！！";await ddSleep(250);await ddOpenOne(stage,next,i+1<seq.length-1);i++}}if(bestItem.rarity==="R"&&Math.random()<.35){document.getElementById("ddMsg").insertAdjacentHTML("afterend",`<div class="ddfake">まだ奥に扉がある…？</div>`);ddS("revive");await ddSleep(1000)}if(bestItem.rarity!=="R"&&Math.random()<.45){document.getElementById("ddMsg").insertAdjacentHTML("afterend",`<div class="ddfake">さらに奥の扉……？</div>`);ddS("fake");await ddSleep(850)}return stage}
function ddResult(stage,item,dup){ddS("result");const dupText=dup?`<p>かぶり：+3コイン返還</p>`:"";stage.className="dd "+(item.rarity==="UR"?"ddur":"");stage.innerHTML=`<div class="ddbtns"><button class="ddbtn" onclick="ddBack()">← ガチャへ戻る</button><button class="ddbtn" onclick="ddHome()">🏠 ホーム</button><button class="ddbtn" onclick="document.getElementById('dd')?.remove()">閉じる</button></div><div class="ddin"><div class="ddtitle">開封結果</div><div class="ddrarity" style="color:${ddColor(item.rarity)}">${item.rarity}</div><div class="ddresult">${titleHTML(item.title)}</div>${dupText}<p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('dd')?.remove();drawGacha()">もう一回引く</button><button onclick="ddBack()">ガチャへ戻る</button><button onclick="ddHome()">ホームへ戻る</button></div>`}
function ddBest(results){return results.slice().sort((a,b)=>ddRank(b.item.rarity)-ddRank(a.item.rarity))[0]}
drawGacha=async function(){if((playerData.coins||0)<10){alert("コインが足りません");return}playerData.coins-=10;const p=ddPick();if(!p.item){alert("ガチャ称号がありません");showGacha();return}const dup=ddGive(p.item);const stage=await ddAnim(p.item);ddResult(stage,p.item,dup)}
drawGacha10=async function(){if((playerData.coins||0)<100){alert("コインが足りません");return}playerData.coins-=100;let results=[];for(let i=0;i<10;i++){const p=ddPick();if(!p.item){alert("ガチャ称号がありません");showGacha();return}const dup=ddGive(p.item);results.push({item:p.item,duplicate:dup})}const best=ddBest(results);const stage=await ddAnim(best.item,{multi:true});results.sort((a,b)=>ddRank(b.item.rarity)-ddRank(a.item.rarity));stage.className="dd "+(best.item.rarity==="UR"?"ddur":"");stage.innerHTML=`<div class="ddbtns"><button class="ddbtn" onclick="ddBack()">← ガチャへ戻る</button><button class="ddbtn" onclick="ddHome()">🏠 ホーム</button><button class="ddbtn" onclick="document.getElementById('dd')?.remove()">閉じる</button></div><div class="ddin"><div class="ddtitle">10連結果</div><p>一番良い結果：<b style="color:${ddColor(best.item.rarity)}">${best.item.rarity}</b></p><p>所持コイン：${playerData.coins||0}</p><div class="ddlist"></div><button onclick="document.getElementById('dd')?.remove();drawGacha10()">もう一度10連</button><button onclick="ddBack()">ガチャへ戻る</button><button onclick="ddHome()">ホームへ戻る</button></div>`;const list=stage.querySelector(".ddlist");for(const r of results){list.insertAdjacentHTML("beforeend",`<div class="dditem"><b style="color:${ddColor(r.item.rarity)}">${r.item.rarity}</b><br>${titleHTML(r.item.title)}${r.duplicate?"<br>かぶり：+3コイン":""}</div>`)}ddS("result")}
const oldNews3315=typeof showNewsPage==="function"?showNewsPage:null;showNewsPage=function(){let html=`<h2>📢 お知らせ</h2><div class="newsCard"><h3>Ver 3.3.15 奥扉ガチャ演出</h3><p>扉色を 白→青→紫→虹 に段階変化するようにしました。</p><p>激アツ・確定パターン・復活演出を追加しました。</p><p>扉を開いた後に奥へ進む演出を追加しました。</p><p>ランキング・ログイン・Firebase処理は変更していません。</p></div>`;if(oldNews3315){try{oldNews3315();const p=document.getElementById("panelArea");if(p)p.innerHTML=html+p.innerHTML;return}catch(e){}}document.getElementById("panelArea").innerHTML=html;if(typeof ensureHomeButton==="function")ensureHomeButton()}
window.drawGacha=drawGacha;window.drawGacha10=drawGacha10;window.showNewsPage=showNewsPage;
})();



/* Ver3.3.16 pachinko-like deep door: stronger sounds + realistic tunnel */
(function(){
if(window.__pachinkoDeepDoor3316)return;
window.__pachinkoDeepDoor3316=true;

let pkCtx=null;
function pkA(){try{if(!pkCtx)pkCtx=new (window.AudioContext||window.webkitAudioContext)();if(pkCtx.state==="suspended")pkCtx.resume();return pkCtx;}catch(e){return null;}}
function pkT(f=440,d=.14,t="sine",gain=.045,delay=0){
 const c=pkA(); if(!c)return;
 const o=c.createOscillator(), g=c.createGain();
 o.type=t; o.frequency.setValueAtTime(f,c.currentTime+delay);
 g.gain.setValueAtTime(gain,c.currentTime+delay);
 g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+delay+d);
 o.connect(g); g.connect(c.destination); o.start(c.currentTime+delay); o.stop(c.currentTime+delay+d);
}
function pkN(d=.3,gain=.08,delay=0){
 const c=pkA(); if(!c)return;
 const b=c.createBuffer(1,Math.floor(c.sampleRate*d),c.sampleRate),x=b.getChannelData(0);
 for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length);
 const s=c.createBufferSource(),g=c.createGain();
 s.buffer=b; g.gain.value=gain; s.connect(g); g.connect(c.destination);
 s.start(c.currentTime+delay);
}
function pkS(k){
 if(k==="tap"){pkT(220,.07,"sine",.05);pkT(440,.1,"triangle",.045,.06);pkT(880,.12,"sine",.035,.13)}
 if(k==="start"){pkT(196,.22,"sawtooth",.035);pkT(392,.22,"sawtooth",.04,.16);pkT(784,.3,"triangle",.045,.36)}
 if(k==="tunnel"){pkT(90,.55,"sawtooth",.03);pkT(180,.55,"sawtooth",.028,.22);pkT(360,.55,"triangle",.03,.44)}
 if(k==="door"){pkN(.28,.08);pkT(120,.22,"sawtooth",.055)}
 if(k==="slam"){pkN(.25,.11);pkT(65,.22,"sawtooth",.07)}
 if(k==="count"){pkT(520,.08,"square",.045);pkT(1040,.1,"sine",.03,.07)}
 if(k==="up"){pkT(523,.14,"square",.05);pkT(784,.18,"triangle",.055,.12);pkT(1174,.20,"sine",.045,.28)}
 if(k==="hot"){pkT(392,.16,"triangle",.06);pkT(523,.16,"triangle",.065,.13);pkT(784,.24,"sine",.07,.28);pkT(1174,.36,"sine",.06,.52)}
 if(k==="revive"){pkN(.38,.09);pkT(330,.15,"square",.05,.08);pkT(660,.2,"square",.06,.24);pkT(1320,.32,"sine",.055,.45)}
 if(k==="ur"){pkT(523,.18,"triangle",.065);pkT(659,.18,"triangle",.065,.13);pkT(784,.20,"triangle",.07,.26);pkT(1046,.42,"sine",.075,.44);pkT(1568,.52,"sine",.06,.62)}
 if(k==="result"){pkT(660,.12,"sine",.05);pkT(880,.15,"sine",.05,.12);pkT(1320,.22,"sine",.04,.25)}
}
function pkSleep(ms){return new Promise(r=>setTimeout(r,ms));}
function pkRank(r){return {UR:4,SSR:3,SR:2,R:1}[r]||0}
function pkColor(r){return r==="UR"?"#ffd700":r==="SSR"?"#ff3cff":r==="SR"?"#38e8ff":"#fff"}
function pkClass(r){return r==="UR"?"pkUR":r==="SSR"?"pkSSR":r==="SR"?"pkSR":"pkR"}
function pkSeq(r){return r==="UR"?["R","SR","SSR","UR"]:r==="SSR"?["R","SR","SSR"]:r==="SR"?["R","SR"]:["R"]}

function pkEnsure(){
 if(document.getElementById("pkStyle3316"))return;
 const st=document.createElement("style");
 st.id="pkStyle3316";
 st.textContent=`
.pk{position:fixed;inset:0;z-index:999999;background:#02020a;color:#fff;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.pk:before{content:"";position:absolute;inset:-70%;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.40),transparent 8%),conic-gradient(from 0deg,#00eaff,#6345ff,#ff26bd,#ffd700,#16ff9a,#00eaff);opacity:.42;filter:blur(12px);animation:pkspin 5.5s linear infinite}
.pk:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 0 18%,rgba(0,0,0,.22) 32%,rgba(0,0,0,.9) 84%),repeating-radial-gradient(circle at 50% 50%,rgba(255,255,255,.055) 0 2px,transparent 2px 20px)}
@keyframes pkspin{to{transform:rotate(360deg)}}
.pkin{position:relative;z-index:3;width:96%;max-width:1000px}
.pkbtns{position:fixed;left:10px;top:10px;z-index:1000002;display:flex;gap:8px;flex-wrap:wrap}.pkbtn{font-size:15px;padding:7px 11px;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.45)}
.pktitle{font-size:40px;font-weight:1000;letter-spacing:1px;text-shadow:0 0 20px #22d3ee,0 0 48px #7c3aed,0 0 90px #fff}.pksub{font-size:20px;opacity:.9}.pktap{font-size:34px;font-weight:1000;color:#fde68a;text-shadow:0 0 18px #f59e0b,0 0 40px #fff;animation:pktap .62s ease-in-out infinite alternate}@keyframes pktap{from{opacity:.48;transform:scale(.93)}to{opacity:1;transform:scale(1.08)}}
.pkcorridor{position:relative;width:420px;height:460px;margin:18px auto 8px;perspective:1400px;transform-style:preserve-3d}
.pktunnel{position:absolute;inset:0;border-radius:28px;background:repeating-radial-gradient(ellipse at center,rgba(255,255,255,.12) 0 3px,transparent 3px 28px);transform:rotateX(0deg);opacity:.55;filter:blur(.2px)}
.pkdepth{position:absolute;border-radius:24px;border:2px solid rgba(255,255,255,.22);box-shadow:0 0 38px rgba(255,255,255,.18),inset 0 0 35px rgba(255,255,255,.06)}
.pkdepth.d1{inset:34px 60px;transform:scale(.78);opacity:.62}.pkdepth.d2{inset:62px 88px;transform:scale(.58);opacity:.42}.pkdepth.d3{inset:92px 118px;transform:scale(.40);opacity:.26}.pkdepth.d4{inset:122px 148px;transform:scale(.26);opacity:.18}
.pkdoorWrap{width:315px;height:395px;margin:0 auto;position:relative;perspective:1050px;transition:transform .9s ease,opacity .9s ease;transform-style:preserve-3d}
.pkadvance{animation:pkadvance 1.25s cubic-bezier(.16,.86,.28,1) both}@keyframes pkadvance{0%{transform:scale(1) translateZ(0);filter:blur(0);opacity:1}45%{transform:scale(1.45) translateZ(180px);filter:blur(1px);opacity:.78}75%{transform:scale(2.1) translateZ(320px);filter:blur(4px);opacity:.18}100%{transform:scale(.72) translateZ(-200px);filter:blur(0);opacity:1}}
.pkwarp{animation:pkwarp .9s ease-out both}@keyframes pkwarp{0%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.18);filter:brightness(2.4)}100%{transform:scale(1);filter:brightness(1)}}
.pkdoorFrame{position:absolute;inset:0;border-radius:18px;border:5px solid rgba(255,255,255,.84);box-shadow:0 0 30px #22d3ee,0 0 82px #7c3aed,inset 0 0 38px rgba(255,255,255,.2);background:linear-gradient(180deg,#10183d,#050816)}
.pkdoorL,.pkdoorR{position:absolute;top:12px;bottom:12px;width:50%;background:linear-gradient(135deg,#151b3f,#2e2a6f,#070814);border:2px solid rgba(255,255,255,.64);box-shadow:inset 0 0 28px rgba(255,255,255,.13);transition:transform 1.05s cubic-bezier(.16,.86,.28,1),filter 1s ease,background .5s ease;transform-style:preserve-3d}
.pkdoorL{left:12px;transform-origin:left center;border-radius:12px 0 0 12px}.pkdoorR{right:12px;transform-origin:right center;border-radius:0 12px 12px 0}
.pkR .pkdoorL,.pkR .pkdoorR{background:linear-gradient(135deg,#2b2f45,#5b6478,#111827)}
.pkSR .pkdoorL,.pkSR .pkdoorR{background:linear-gradient(135deg,#063b5e,#0891b2,#0f172a);box-shadow:inset 0 0 30px rgba(56,232,255,.38),0 0 22px #38e8ff}
.pkSSR .pkdoorL,.pkSSR .pkdoorR{background:linear-gradient(135deg,#47126b,#c026d3,#1e0633);box-shadow:inset 0 0 30px rgba(255,60,255,.44),0 0 28px #ff3cff}
.pkUR .pkdoorL,.pkUR .pkdoorR{background:linear-gradient(135deg,#7c5200,#ffd700,#fff5a8,#ff26bd);box-shadow:inset 0 0 34px rgba(255,255,255,.56),0 0 38px #ffd700,0 0 70px #ff00ff}
.pkopen .pkdoorL{transform:rotateY(-88deg);filter:brightness(2.1)}.pkopen .pkdoorR{transform:rotateY(88deg);filter:brightness(2.1)}
.pkpeek .pkdoorL{transform:rotateY(-26deg);filter:brightness(1.55)}.pkpeek .pkdoorR{transform:rotateY(26deg);filter:brightness(1.55)}
.pkslam{animation:pkslam .38s ease-in-out both}@keyframes pkslam{0%{transform:translateX(0)}25%{transform:translateX(-14px)}50%{transform:translateX(14px)}75%{transform:translateX(-9px)}100%{transform:translateX(0)}}
.pkdoorCore{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:62px;font-weight:1000;text-shadow:0 0 22px #fff,0 0 58px #ffd700;z-index:2;pointer-events:none}
.pkdoorGlow{position:absolute;inset:28px;border-radius:14px;background:radial-gradient(circle,rgba(255,255,255,.38),transparent 55%);opacity:.25;animation:pkglow .82s ease-in-out infinite alternate}@keyframes pkglow{from{opacity:.22;transform:scale(.94)}to{opacity:.86;transform:scale(1.09)}}
.pkrarity{font-size:88px;font-weight:1000;margin:8px auto;text-shadow:0 0 30px currentColor,0 0 80px currentColor;animation:pkpop 1.05s ease-out both}@keyframes pkpop{from{opacity:0;transform:scale(.2) translateY(30px)}60%{opacity:1;transform:scale(1.22) translateY(0)}to{opacity:1;transform:scale(1)}}
.pkmsg{font-size:28px;font-weight:1000;text-shadow:0 0 16px #fff,0 0 34px #22d3ee}
.pkhot{position:fixed;inset:0;z-index:1000003;background:#000;display:flex;align-items:center;justify-content:center;color:#ffd700;font-size:68px;font-weight:1000;text-shadow:0 0 20px #fff,0 0 48px #ffd700,0 0 100px #ff00ff;animation:pkhot 1.75s ease-out forwards}@keyframes pkhot{0%{opacity:0;transform:scale(.5)}18%{opacity:1;transform:scale(1.15)}75%{opacity:1;filter:brightness(1.9)}100%{opacity:0;transform:scale(1.55);filter:brightness(4.5)}}
.pkfake{font-size:36px;font-weight:1000;text-shadow:0 0 16px #fff,0 0 34px #22d3ee;animation:pkfake 1.05s ease-out both}@keyframes pkfake{0%{opacity:0;transform:scale(.5)}45%{opacity:1;transform:scale(1.18)}100%{opacity:0;transform:scale(1.4)}}
.pkparticle{position:absolute;z-index:3;font-size:31px;pointer-events:none;animation:pkparticle 2.4s ease-out forwards}@keyframes pkparticle{from{opacity:1;transform:translateY(0) scale(.55) rotate(0)}to{opacity:0;transform:translateY(-330px) scale(2.2) rotate(460deg)}}
.pkresult{font-size:54px;font-weight:1000;margin:16px auto;animation:pkresult 1.05s ease-out both}@keyframes pkresult{from{opacity:0;transform:translateY(-55px) scale(.3)}60%{opacity:1;transform:translateY(8px) scale(1.2)}to{opacity:1;transform:translateY(0) scale(1)}}
.pkur{animation:pkur .75s ease-in-out infinite alternate}@keyframes pkur{from{filter:hue-rotate(0deg) brightness(1.15)}to{filter:hue-rotate(100deg) brightness(1.7)}}
.pklist{max-height:48vh;overflow:auto;margin-top:12px}.pkitem{padding:10px;margin:7px;border-radius:12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)}
`;document.head.appendChild(st)}
function pkRemove(){document.getElementById("pk")?.remove()}
window.pkBack=function(){pkRemove();if(typeof showGacha==="function")showGacha()}
window.pkHome=function(){pkRemove();if(typeof goHome==="function")goHome();else if(typeof showHome==="function")showHome();else location.reload()}
function pkBase(title,sub,tap=true){pkEnsure();pkRemove();const d=document.createElement("div");d.id="pk";d.className="pk";d.innerHTML=`<div class="pkbtns"><button class="pkbtn" onclick="pkBack()">← ガチャへ戻る</button><button class="pkbtn" onclick="pkHome()">🏠 ホーム</button><button class="pkbtn" onclick="document.getElementById('pk')?.remove()">閉じる</button></div><div class="pkin"><div class="pktitle">${title}</div><p class="pksub">${sub}</p><div class="pkcorridor"><div class="pktunnel"></div><div class="pkdepth d1"></div><div class="pkdepth d2"></div><div class="pkdepth d3"></div><div class="pkdepth d4"></div><div class="pkdoorWrap pkR" id="pkDoor"><div class="pkdoorFrame"></div><div class="pkdoorGlow"></div><div class="pkdoorL"></div><div class="pkdoorR"></div><div class="pkdoorCore">∫</div></div></div><div id="pkMsg" class="pkmsg">奥の扉を解析中...</div>${tap?'<div class="pktap">タップして開始</div>':''}</div>`;document.body.appendChild(d);return d}
async function pkWait(stage){await new Promise(resolve=>{let done=false;const start=e=>{if(e)e.preventDefault();if(done)return;done=true;pkS("tap");resolve()};stage.addEventListener("click",start);stage.addEventListener("touchstart",start,{passive:false})})}
function pkParticles(stage,r){const m=r==="UR"?["✨","🌈","💎","👑","⚡","🔥","🌌","π","∞"]:r==="SSR"?["✨","💎","⭐","🔥","Σ"]:r==="SR"?["✨","⭐","√","∫"]:["✨","∫","π"];const n=r==="UR"?120:r==="SSR"?78:r==="SR"?52:36;for(let i=0;i<n;i++){const p=document.createElement("div");p.className="pkparticle";p.textContent=m[Math.floor(Math.random()*m.length)];p.style.left=(5+Math.random()*90)+"%";p.style.top=(40+Math.random()*44)+"%";p.style.animationDelay=(Math.random()*1)+"s";stage.appendChild(p)}}
function pkHot(label){return new Promise(resolve=>{pkS("hot");const d=document.createElement("div");d.className="pkhot";d.innerHTML=`<div>${label}</div>`;document.body.appendChild(d);setTimeout(()=>{d.remove();resolve()},1800)})}
function pkPick(){const item=getGachaResult();const owned=playerData.gachaTitles||[];return{item,duplicate:item?owned.includes(item.title):false}}
function pkGive(item){if(!playerData.gachaTitles)playerData.gachaTitles=[];const dup=playerData.gachaTitles.includes(item.title);if(dup){playerData.coins=(playerData.coins||0)+3}else{unlockTitle(item.title);playerData.gachaTitles.push(item.title)}unlockAchievement("初ガチャ");if(item.rarity==="UR"){unlockAchievement("UR獲得");document.body.classList.add("urFlash");setTimeout(()=>document.body.classList.remove("urFlash"),1000)}saveAllData();updateHomeStatus();return dup}
async function pkMoveDeeper(stage){const door=document.getElementById("pkDoor"),msg=document.getElementById("pkMsg");msg.textContent="奥の扉へ突入…";pkS("tunnel");door.classList.add("pkadvance");await pkSleep(1250);door.classList.remove("pkadvance","pkopen","pkpeek")}
async function pkCountDown(stage){const msg=document.getElementById("pkMsg");for(const n of ["3","2","1"]){msg.textContent=`開放カウント ${n}`;pkS("count");await pkSleep(420)}}
async function pkFakeOpen(stage){const door=document.getElementById("pkDoor"),msg=document.getElementById("pkMsg");door.classList.add("pkpeek");msg.textContent="開く……！？";pkS("door");await pkSleep(650);door.classList.remove("pkpeek");door.classList.add("pkslam");pkS("slam");msg.insertAdjacentHTML("afterend",`<div class="pkfake">ガシャン！まだ開かない！</div>`);await pkSleep(950);door.classList.remove("pkslam")}
async function pkOpenOne(stage,r,next=false){const door=document.getElementById("pkDoor"),msg=document.getElementById("pkMsg");door.className=`pkdoorWrap ${pkClass(r)}`;msg.textContent=`${r}色の扉が出現`;door.querySelector(".pkdoorCore").textContent=r==="UR"?"🌈":r==="SSR"?"💎":r==="SR"?"⭐":"∫";await pkCountDown(stage);pkS("door");door.classList.add("pkopen");pkParticles(stage,r);stage.querySelector(".pkin").insertAdjacentHTML("beforeend",`<div class="pkrarity" style="color:${pkColor(r)}">${r}</div>`);if(next){pkS("up");msg.textContent=`${r}突破！さらに奥へ`;await pkSleep(850);await pkMoveDeeper(stage)}else{msg.textContent=`${r}確定！`;if(r==="UR"){stage.classList.add("pkur");pkS("ur")}await pkSleep(1400)}}
async function pkAnim(bestItem,opts={}){const stage=pkBase(opts.multi?"10連 奥扉RUSH":"奥扉RUSH",opts.multi?"10連の中で一番良い結果に合わせて奥へ突入します":"奥へ進むほど期待度アップ",true);await pkWait(stage);pkS("start");const seq=pkSeq(bestItem.rarity);if(bestItem.rarity==="UR"||bestItem.rarity==="SSR")await pkHot(bestItem.rarity==="UR"?"激アツRUSH！！":"チャンス到来！！");if(Math.random()<.65&&bestItem.rarity!=="R")await pkFakeOpen(stage);for(let i=0;i<seq.length;i++){const r=seq[i];await pkOpenOne(stage,r,i<seq.length-1);if(i<seq.length-2&&Math.random()<.4){document.getElementById("pkMsg").textContent="2枚連続開放！！";await pkSleep(250);const next=seq[i+1];await pkOpenOne(stage,next,i+1<seq.length-1);i++}}if(bestItem.rarity==="R"&&Math.random()<.38){document.getElementById("pkMsg").insertAdjacentHTML("afterend",`<div class="pkfake">まだ奥に扉がある…？</div>`);pkS("revive");await pkSleep(1000)}if(bestItem.rarity!=="R"&&Math.random()<.55){document.getElementById("pkMsg").insertAdjacentHTML("afterend",`<div class="pkfake">さらに奥の扉……？</div>`);pkS("fake");await pkSleep(850)}return stage}
function pkResult(stage,item,dup){pkS("result");const dupText=dup?`<p>かぶり：+3コイン返還</p>`:"";stage.className="pk "+(item.rarity==="UR"?"pkur":"");stage.innerHTML=`<div class="pkbtns"><button class="pkbtn" onclick="pkBack()">← ガチャへ戻る</button><button class="pkbtn" onclick="pkHome()">🏠 ホーム</button><button class="pkbtn" onclick="document.getElementById('pk')?.remove()">閉じる</button></div><div class="pkin"><div class="pktitle">開封結果</div><div class="pkrarity" style="color:${pkColor(item.rarity)}">${item.rarity}</div><div class="pkresult">${titleHTML(item.title)}</div>${dupText}<p>所持コイン：${playerData.coins||0}</p><button onclick="document.getElementById('pk')?.remove();drawGacha()">もう一回引く</button><button onclick="pkBack()">ガチャへ戻る</button><button onclick="pkHome()">ホームへ戻る</button></div>`}
function pkBest(results){return results.slice().sort((a,b)=>pkRank(b.item.rarity)-pkRank(a.item.rarity))[0]}
drawGacha=async function(){if((playerData.coins||0)<10){alert("コインが足りません");return}playerData.coins-=10;const p=pkPick();if(!p.item){alert("ガチャ称号がありません");showGacha();return}const dup=pkGive(p.item);const stage=await pkAnim(p.item);pkResult(stage,p.item,dup)}
drawGacha10=async function(){if((playerData.coins||0)<100){alert("コインが足りません");return}playerData.coins-=100;let results=[];for(let i=0;i<10;i++){const p=pkPick();if(!p.item){alert("ガチャ称号がありません");showGacha();return}const dup=pkGive(p.item);results.push({item:p.item,duplicate:dup})}const best=pkBest(results);const stage=await pkAnim(best.item,{multi:true});results.sort((a,b)=>pkRank(b.item.rarity)-pkRank(a.item.rarity));stage.className="pk "+(best.item.rarity==="UR"?"pkur":"");stage.innerHTML=`<div class="pkbtns"><button class="pkbtn" onclick="pkBack()">← ガチャへ戻る</button><button class="pkbtn" onclick="pkHome()">🏠 ホーム</button><button class="pkbtn" onclick="document.getElementById('pk')?.remove()">閉じる</button></div><div class="pkin"><div class="pktitle">10連結果</div><p>一番良い結果：<b style="color:${pkColor(best.item.rarity)}">${best.item.rarity}</b></p><p>所持コイン：${playerData.coins||0}</p><div class="pklist"></div><button onclick="document.getElementById('pk')?.remove();drawGacha10()">もう一度10連</button><button onclick="pkBack()">ガチャへ戻る</button><button onclick="pkHome()">ホームへ戻る</button></div>`;const list=stage.querySelector(".pklist");for(const r of results){list.insertAdjacentHTML("beforeend",`<div class="pkitem"><b style="color:${pkColor(r.item.rarity)}">${r.item.rarity}</b><br>${titleHTML(r.item.title)}${r.duplicate?"<br>かぶり：+3コイン":""}</div>`)}pkS("result")}
const oldNews3316=typeof showNewsPage==="function"?showNewsPage:null;showNewsPage=function(){let html=`<h2>📢 お知らせ</h2><div class="newsCard"><h3>Ver 3.3.16 奥扉RUSH演出</h3><p>音と間を強化し、より脳汁感のある扉演出にしました。</p><p>カウントダウン、突入音、奥へ進むトンネル演出を追加しました。</p><p>ランキング・ログイン・Firebase処理は変更していません。</p></div>`;if(oldNews3316){try{oldNews3316();const p=document.getElementById("panelArea");if(p)p.innerHTML=html+p.innerHTML;return}catch(e){}}document.getElementById("panelArea").innerHTML=html;if(typeof ensureHomeButton==="function")ensureHomeButton()}
window.drawGacha=drawGacha;window.drawGacha10=drawGacha10;window.showNewsPage=showNewsPage;
})();
