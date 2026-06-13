/* ranking.js
   数学マスター v3.3.6 ranking module
   このファイルにランキング関連処理を分離。
   今後、称号・問題・UIを更新しても、このファイルを更新しなければランキング処理は維持される。
*/
(function(){
"use strict";

// ===== savePublicProfile =====
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

// ===== showFriendRanking =====
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

// ===== showWorldRanking =====
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

// ===== showRankingMenu =====
function showRankingMenu(){
document.getElementById("panelArea").innerHTML=`
<h2>🏆 ランキング</h2>
<button class="modeBtn" onclick="showWorldRanking()">🌍 週間ランキング</button>
<button class="modeBtn" onclick="showRateRanking()">🏅 レートランキング</button>
`;
}

// ===== showRateRanking =====
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


// onclick / 他ファイルから呼べるように明示的に公開
try{
  if(typeof showRankingMenu !== "undefined") window.showRankingMenu = showRankingMenu;
  if(typeof showWorldRanking !== "undefined") window.showWorldRanking = showWorldRanking;
  if(typeof showFriendRanking !== "undefined") window.showFriendRanking = showFriendRanking;
  if(typeof showRateRanking !== "undefined") window.showRateRanking = showRateRanking;
  if(typeof savePublicProfile !== "undefined") window.savePublicProfile = savePublicProfile;
  if(typeof loadWorldRanking !== "undefined") window.loadWorldRanking = loadWorldRanking;
  if(typeof loadFriendData !== "undefined") window.loadFriendData = loadFriendData;
  if(typeof savePlayerPublicData !== "undefined") window.savePlayerPublicData = savePlayerPublicData;
  if(typeof showRateMatch !== "undefined") window.showRateMatch = showRateMatch;
  if(typeof startRateMatch !== "undefined") window.startRateMatch = startRateMatch;
  if(typeof showRateResult !== "undefined") window.showRateResult = showRateResult;
  if(typeof saveRateData !== "undefined") window.saveRateData = saveRateData;
  if(typeof loadRateRanking !== "undefined") window.loadRateRanking = loadRateRanking;
}catch(e){
  console.error("ranking.js export error", e);
}
})();
