import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, limit, serverTimestamp, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
const firebaseConfig = {
apiKey: "AIzaSyDVXwXTGeft41ajd0KDwNPG-dH8pmsMIt8",
authDomain: "math-master-3c4df.firebaseapp.com",
projectId: "math-master-3c4df",
storageBucket: "math-master-3c4df.firebasestorage.app",
messagingSenderId: "374039148607",
appId: "1:374039148607:web:529bcba1879124436d208a",
measurementId: "G-4YFNNNT6CK"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
window.firebaseApp = app;
window.db = db;
window.firebaseDb = db;
window.firebaseAuth = auth;
setPersistence(auth,browserLocalPersistence).catch((e)=>console.error(e));
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt:"select_account" });
const FRIEND_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function normalizeFriendCode(code){
return String(code || "").replace(/-/g,"").trim().toUpperCase();
}
function formatFriendCode(code){
const c = normalizeFriendCode(code);
if(c.length === 8) return c.slice(0,4) + "-" + c.slice(4);
return c || "未取得";
}
function makeFriendCode(){
let code = "";
for(let i=0;i<8;i++){
code += FRIEND_CODE_CHARS[Math.floor(Math.random()*FRIEND_CODE_CHARS.length)];
}
return code;
}
async function ensureFriendCode(user){
if(!user) return "";
const profileRef = doc(db,"userProfiles",user.uid);
const profileSnap = await getDoc(profileRef).catch(()=>null);
const existing = profileSnap && profileSnap.exists() ? normalizeFriendCode(profileSnap.data().friendCode) : "";
if(existing && existing.length === 8){
localStorage.setItem("friendCode", existing);
await setDoc(doc(db,"friendCodes",existing),{
code: existing,
uid: user.uid,
playerId: "google_" + user.uid,
updatedAt: serverTimestamp()
},{merge:true}).catch(()=>{});
return existing;
}
const saved = normalizeFriendCode(localStorage.getItem("friendCode"));
if(saved && saved.length === 8){
await setDoc(doc(db,"friendCodes",saved),{
code: saved,
uid: user.uid,
playerId: "google_" + user.uid,
updatedAt: serverTimestamp()
},{merge:true});
await setDoc(profileRef,{
uid:user.uid,
friendCode:saved,
updatedAt:serverTimestamp()
},{merge:true});
return saved;
}
for(let i=0;i<30;i++){
const code = makeFriendCode();
const codeRef = doc(db,"friendCodes",code);
const codeSnap = await getDoc(codeRef);
if(!codeSnap.exists()){
await setDoc(codeRef,{
code,
uid:user.uid,
playerId:"google_" + user.uid,
createdAt:serverTimestamp(),
updatedAt:serverTimestamp()
});
await setDoc(profileRef,{
uid:user.uid,
friendCode:code,
updatedAt:serverTimestamp()
},{merge:true});
localStorage.setItem("friendCode", code);
if(window.updateHomeStatus) window.updateHomeStatus();
return code;
}
}
throw new Error("friend-code-generate-failed");
}
window.getMyFriendCode = function(){
const c = normalizeFriendCode(localStorage.getItem("friendCode"));
return c ? formatFriendCode(c) : "未取得";
};
window.loginGoogle = async function(){
try{
localStorage.setItem("loginTrying","1");
await setPersistence(auth,browserLocalPersistence);
try{
const result = await signInWithPopup(auth,provider);
if(result && result.user){
applyGoogleLoginState(result.user);
alert("アカウント連携に成功しました");
}
}catch(popupError){
console.warn("Popup login failed, fallback to redirect:", popupError);
await signInWithRedirect(auth,provider);
}
}catch(e){
console.error(e);
alert("Googleログイン開始に失敗：" + (e.code || e.message || e));
}
};
function applyGoogleLoginState(user){
window.currentUser = user || null;
if(user){
window.__cloudLoginJustSignedIn = true;
localStorage.setItem("googleLoginLinked","1");
localStorage.setItem("googleLoginUid", user.uid);
localStorage.setItem("googleDisplayNameHidden", "");
localStorage.removeItem("loginTrying");
console.log("アカウント連携中:", user.uid);
if(window.unlockAchievement){
window.unlockAchievement("初ログイン");
if(window.saveAllData) window.saveAllData();
}
}else{
localStorage.removeItem("googleLoginLinked");
localStorage.removeItem("googleDisplayNameHidden");
localStorage.removeItem("googleLoginUid");
console.log("未ログイン");
}
if(window.refreshLoginStatus) window.refreshLoginStatus();
if(window.updateHomeStatus) window.updateHomeStatus();
if(user){
ensurePlayerNameAfterLogin(user);
setTimeout(()=>{
if(window.loadCloudPlayerDataAndApply){
window.loadCloudPlayerDataAndApply().catch(e=>console.warn("cloud load failed",e));
}
},1200);
}
}
getRedirectResult(auth)
.then((result)=>{
if(result && result.user){
applyGoogleLoginState(result.user);
alert("アカウント連携に成功しました");
}
})
.catch((e)=>{
console.error(e);
localStorage.removeItem("loginTrying");
alert("Googleログイン確認エラー：" + (e.code || e.message || e));
});
onAuthStateChanged(auth,user=>{
applyGoogleLoginState(user);
if(!user && localStorage.getItem("loginTrying")==="1"){
setTimeout(()=>{
if(!auth.currentUser){
alert("Googleログイン後に認証状態を取得できませんでした。Safariの設定でサイト越えトラッキング防止が強い場合があります。もう一度ログインを押してください。");
localStorage.removeItem("loginTrying");
}
},2500);
}
});
window.logoutGoogle = async function(){
try{
await signOut(auth);
}finally{
window.currentUser=null;
window.__cloudLoginJustSignedIn = false;
localStorage.removeItem("googleLoginLinked");
localStorage.removeItem("googleDisplayNameHidden");
localStorage.removeItem("googleLoginUid");
localStorage.removeItem("loginTrying");
if(window.refreshLoginStatus) window.refreshLoginStatus();
if(window.updateHomeStatus) window.updateHomeStatus();
alert("ログアウトしました");
}
};
window.getGoogleLoginInfo = function(){
return auth.currentUser || window.currentUser || null;
};
window.currentUser = null;
async function ensurePlayerNameAfterLogin(user){
try{
if(!user) return;
let bundle = window.getLocalGameData ? window.getLocalGameData() : null;
let currentName = bundle && bundle.playerProfile ? (bundle.playerProfile.name || "") : "";
if(!currentName || currentName === "名無し" || currentName === "Googleユーザー"){
let inputName = prompt("プレイヤー名を決めてください（本名ではなくニックネーム推奨）", "");
if(inputName){
inputName = inputName.trim().slice(0,16);
if(inputName){
let newBundle = window.getLocalGameData ? window.getLocalGameData() : {playerProfile:{},playerData:{},settings:{}};
newBundle.playerProfile = newBundle.playerProfile || {};
newBundle.playerProfile.name = inputName;
if(window.applyCloudGameData) window.applyCloudGameData(newBundle);
}
}
}
bundle = window.getLocalGameData ? window.getLocalGameData() : null;
const playerName = bundle && bundle.playerProfile ? (bundle.playerProfile.name || "名無し") : "名無し";
const friendCode = await ensureFriendCode(user);
await setDoc(doc(db,"userProfiles",user.uid),{
uid:user.uid,
friendCode:friendCode,
googleDisplayName:"",
playerName:playerName,
updatedAt:serverTimestamp()
},{merge:true});
}catch(e){
console.warn("player name setup failed", e);
}
}
function getWeekKey(){
const now = new Date();
const japan = new Date(now.toLocaleString("en-US",{timeZone:"Asia/Tokyo"}));
const day = japan.getDay();
const diffToMonday = day === 0 ? -6 : 1 - day;
const monday = new Date(japan);
monday.setDate(japan.getDate()+diffToMonday);
monday.setHours(0,0,0,0);
const y = monday.getFullYear();
const m = String(monday.getMonth()+1).padStart(2,"0");
const d = String(monday.getDate()).padStart(2,"0");
return `${y}-${m}-${d}`;
}
function getPlayerId(){
if(window.currentUser) return "google_" + window.currentUser.uid;
let playerId = localStorage.getItem("playerId");
if(!playerId){
playerId = crypto.randomUUID();
localStorage.setItem("playerId",playerId);
}
return "local_" + playerId;
}
window.getMyPlayerId = () => (window.getMyFriendCode ? window.getMyFriendCode() : getPlayerId());
window.saveWorldScore = async function(data){
if(!auth.currentUser) return false;
const week = getWeekKey();
const playerId = getPlayerId();
const docId = week + "_" + data.mode + "_" + playerId;
const ref = doc(db,"rankings",docId);
const old = await getDoc(ref);
if(old.exists()){
const oldScore = old.data().score || 0;
if(oldScore >= data.score) return;
}
await setDoc(ref,{
name:data.name,
icon:data.icon,
score:data.score,
title:data.title,
level:data.level,
mode:data.mode,
week:week,
playerId:playerId,
updatedAt:serverTimestamp()
});
};
window.loadWorldRanking = async function(){
const q = query(collection(db,"rankings"), where("week","==",getWeekKey()), where("mode","==","random"), limit(100));
const snap = await getDocs(q);
let list = [];
snap.forEach(doc=>list.push(doc.data()));
list.sort((a,b)=>b.score-a.score);
return list;
};
window.savePlayerPublicData = async function(data){
const playerId = getPlayerId();
const friendCode = auth.currentUser ? await ensureFriendCode(auth.currentUser).catch(()=>normalizeFriendCode(localStorage.getItem("friendCode"))) : "";
const publicData = {
playerId:playerId,
friendCode:friendCode || "",
name:data.name,
playerName:data.name,
icon:data.icon,
title:data.title,
level:data.level,
bestRandomScore:data.bestRandomScore,
updatedAt:serverTimestamp()
};
await setDoc(doc(db,"players",playerId),publicData,{merge:true});
if(friendCode){
await setDoc(doc(db,"players",friendCode),publicData,{merge:true});
}
};
window.loadFriendData = async function(friendId){
const code = normalizeFriendCode(friendId);
if(code && code.length === 8){
const codeSnap = await getDoc(doc(db,"friendCodes",code));
if(codeSnap.exists()){
const publicSnap = await getDoc(doc(db,"players",code));
if(publicSnap.exists()) return publicSnap.data();
}
}
const snap = await getDoc(doc(db,"players",friendId));
if(!snap.exists()) return null;
return snap.data();
};
window.loadMatchRoom = async function(roomId){
const snap = await getDoc(doc(db,"matches",roomId));
if(!snap.exists()) return null;
return snap.data();
};
window.subscribeMatchRoom = function(roomId, callback){
const ref = doc(db,"matches",roomId);
return onSnapshot(ref,(snap)=>{
callback(snap.exists() ? snap.data() : null);
},(e)=>{
console.error("match realtime failed", e);
});
};
window.claimMatchPoint = async function(roomId,side,round){
const ref = doc(db,"matches",roomId);
const snap = await getDoc(ref);
if(!snap.exists()) return null;
const room = snap.data();
if(room.status !== "playing") return room;
if(room.round !== round) return room;
let hostPoints = room.hostPoints || 0;
let guestPoints = room.guestPoints || 0;
if(side === "host") hostPoints++;
if(side === "guest") guestPoints++;
let winner = "";
let status = "playing";
let nextRound = round + 1;
let nextQuestion = room.questions[nextRound] || null;
if(hostPoints >= 3){
winner = "host";
status = "finished";
}else if(guestPoints >= 3){
winner = "guest";
status = "finished";
}else if(!nextQuestion){
winner = hostPoints >= guestPoints ? "host" : "guest";
status = "finished";
}
await updateDoc(ref,{
hostPoints,
guestPoints,
roundWinner:side,
roundWinnerRound:round,
round:nextRound,
currentQuestion:nextQuestion,
winner,
status,
updatedAt:serverTimestamp()
});
const after = await getDoc(ref);
return after.data();
};
window.saveRateData = async function(result){
if(!auth.currentUser) return null;
const playerId = getPlayerId();
const ref = doc(db,"ratings",playerId);
const snap = await getDoc(ref);
let data = snap.exists() ? snap.data() : {};
let rating = data.rating || 1000;
let wins = data.wins || 0;
let losses = data.losses || 0;
if(result === "win"){
rating += 25;
wins++;
}else if(result === "loss"){
rating = Math.max(100, rating - 25);
losses++;
}
await setDoc(ref,{
playerId,
name:((window.getLocalGameData&&window.getLocalGameData().playerProfile&&window.getLocalGameData().playerProfile.name) || "名無し"),
icon:((window.getLocalGameData&&window.getLocalGameData().playerProfile&&window.getLocalGameData().playerProfile.icon) || ""),
title:((window.getLocalGameData&&window.getLocalGameData().playerData&&window.getLocalGameData().playerData.equippedTitle) || "初心者"),
level:(window.getLevel ? window.getLevel() : 1),
rating,
wins,
losses,
updatedAt:serverTimestamp()
});
return {rating,wins,losses};
};
window.loadRateRanking = async function(){
const snap = await getDocs(collection(db,"ratings"));
let list=[];
snap.forEach(d=>list.push(d.data()));
list.sort((a,b)=>(b.rating||1000)-(a.rating||1000));
return list.slice(0,100);
};
window.loadOpenMatchRooms = async function(){
const qOpen = query(
collection(db,"matches"),
where("type","==","online"),
where("status","==","waiting"),
limit(30)
);
const snap = await getDocs(qOpen);
let list=[];
const myId=getPlayerId();
snap.forEach(d=>{
const data=d.data();
if(!data.guestId && data.hostId !== myId){
list.push(data);
}
});
list.sort((a,b)=>(b.createdAtText||"").localeCompare(a.createdAtText||""));
return list;
};
window.createMatchRoom = async function(data){
const roomId = Math.random().toString(36).slice(2,8).toUpperCase();
await setDoc(doc(db,"matches",roomId),{
roomId:roomId,
type:data.type || "online",
betaVote: !!data.betaVote,
hostVote:[],
guestVote:[],
finalGenre:"",
finalGenreLabel:"",
status:"waiting",
hostId:getPlayerId(),
hostName:data.name || "名無し",
hostTitle:data.title || "初心者",
hostRate:data.rate || 1000,
hostLevel:data.level || 1,
guestId:"",
guestName:"",
guestTitle:"",
guestRate:1000,
guestLevel:1,
hostPoints:0,
guestPoints:0,
round:0,
currentQuestion:data.questions[0],
questions:data.questions,
roundWinner:"",
winner:"",
createdAtText:new Date().toISOString(),
updatedAt:serverTimestamp()
});
return roomId;
};
window.joinMatchRoom = async function(roomId,data){
const ref = doc(db,"matches",roomId);
const snap = await getDoc(ref);
if(!snap.exists()) throw new Error("room-not-found");
const room = snap.data();
const myId = getPlayerId();
if(room.hostId === myId) throw new Error("own-room");
if(room.guestId) throw new Error("already-full");
if(room.status === "finished" || room.status === "canceled") throw new Error("room-closed");
await updateDoc(ref,{
status:"playing",
guestId:myId,
guestName:data.name || "名無し",
guestTitle:data.title || "初心者",
guestRate:data.rate || 1000,
guestLevel:data.level || 1,
updatedAt:serverTimestamp()
});
const after = await getDoc(ref);
return after.data();
};
window.cancelMatchRoom = async function(roomId){
const ref = doc(db,"matches",roomId);
const snap = await getDoc(ref);
if(!snap.exists()) return;
const room=snap.data();
if(room.hostId !== getPlayerId()) throw new Error("not-host");
await updateDoc(ref,{
status:"canceled",
updatedAt:serverTimestamp()
});
};
window.surrenderMatchRoom = async function(roomId,side){
const ref = doc(db,"matches",roomId);
const snap = await getDoc(ref);
if(!snap.exists()) return null;
const room=snap.data();
if(room.status!=="playing" && room.status!=="waiting") return room;
const winner = side==="host" ? "guest" : "host";
await updateDoc(ref,{
status:"finished",
winner:winner,
surrenderedBy:side,
updatedAt:serverTimestamp()
});
const after=await getDoc(ref);
return after.data();
};
window.leaveMatchRoom = async function(roomId,side){
const ref = doc(db,"matches",roomId);
const snap = await getDoc(ref);
if(!snap.exists()) return null;
const room=snap.data();
if(room.status==="waiting"){
await updateDoc(ref,{
status:"canceled",
leftBy:side,
updatedAt:serverTimestamp()
});
}else if(room.status==="playing"){
const winner = side==="host" ? "guest" : "host";
await updateDoc(ref,{
status:"finished",
winner:winner,
leftBy:side,
updatedAt:serverTimestamp()
});
}
const after=await getDoc(ref);
return after.data();
};
window.testFirestoreDirect = async function(){
const id = "test_" + Date.now();
const ref = doc(db,"connectionTests",id);
await setDoc(ref,{
ok:true,
from:location.hostname,
createdAt:serverTimestamp()
});
const snap = await getDoc(ref);
if(!snap.exists()) throw new Error("write-read-failed");
return {ok:true,id};
};
function getLocalBundleForCloud(){
if(window.getLocalGameData){
return window.getLocalGameData();
}
return null;
}
window.saveCloudPlayerDataNow = async function(){
const user = auth.currentUser;
if(!user) return false;
const bundle = getLocalBundleForCloud();
if(!bundle) return false;
const friendCode = await ensureFriendCode(user).catch(()=>normalizeFriendCode(localStorage.getItem("friendCode")));
await setDoc(doc(db,"userSaves",user.uid),{
uid:user.uid,
friendCode:friendCode || "",
name:(bundle.playerProfile && bundle.playerProfile.name) || "名無し",
playerName:(bundle.playerProfile && bundle.playerProfile.name) || "名無し",
googleDisplayName:"",
playerProfile:bundle.playerProfile || {},
playerData:bundle.playerData || {},
settings:bundle.settings || {},
updatedAt:serverTimestamp()
},{merge:true});
return true;
};
let cloudSaveTimer = null;
window.queueCloudSave = function(){
if(!auth.currentUser) return;
if(cloudSaveTimer) clearTimeout(cloudSaveTimer);
cloudSaveTimer = setTimeout(()=>{
window.saveCloudPlayerDataNow().catch(e=>console.warn("cloud save failed",e));
},800);
};
window.loadCloudPlayerDataAndApply = async function(){
const user = auth.currentUser;
if(!user) return false;
const refs = [
  doc(db,"userSaves",user.uid),
  doc(db,"userSaves","google_" + user.uid)
];
let snap = null;
let usedLegacy = false;
try{
  snap = await getDoc(refs[0]);
}catch(e){
  console.warn("cloud primary load failed", e);
}
if(!snap || !snap.exists()){
  try{
    snap = await getDoc(refs[1]);
    usedLegacy = !!(snap && snap.exists());
  }catch(e){
    console.warn("cloud legacy load failed", e);
  }
}
if(!snap || !snap.exists()){
  await ensurePlayerNameAfterLogin(user);
  await window.saveCloudPlayerDataNow();
  window.__cloudLoginJustSignedIn = false;
  return false;
}
const cloud = snap.data();
if(window.applyCloudGameData){
  window.applyCloudGameData({
    playerProfile:cloud.playerProfile || {},
    playerData:cloud.playerData || {},
    settings:cloud.settings || {}
  });
}
// 旧形式 google_UID から読み込めた場合は、今後用に通常UIDへコピーしておく
if(usedLegacy){
  try{
    await setDoc(doc(db,"userSaves",user.uid),{
      ...cloud,
      uid:user.uid,
      migratedFrom:"google_" + user.uid,
      migratedAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    },{merge:true});
  }catch(e){
    console.warn("cloud migration failed", e);
  }
}
window.__cloudLoginJustSignedIn = false;
return true;
};
window.forceCloudSave = async function(){
try{
const ok = await window.saveCloudPlayerDataNow();
alert(ok ? "Google連動セーブ完了" : "Googleログインしていません");
}catch(e){
console.error(e);
alert("Google連動セーブ失敗：" + (e.code || e.message || e));
}
};
window.forceCloudLoad = async function(){
try{
const ok = await window.loadCloudPlayerDataAndApply();
alert(ok ? "Googleセーブを読み込みました" : "クラウドデータがないのでこの端末データを保存しました");
}catch(e){
console.error(e);
alert("Googleセーブ読み込み失敗：" + (e.code || e.message || e));
}
};
window.showBoardPage = async function(){
const menu=document.getElementById("homeMenu");
const panel=document.getElementById("panelArea");
if(menu) menu.classList.add("hidden");
if(!panel) return;
panel.innerHTML = `<h2>💬 数学掲示板 β</h2>
<div class="boardPost">
<p>わからない問題を投稿して、みんなで教え合えます。</p>
<p>投稿・回答・いいねはログイン必須。投稿は1日5件まで。</p>
<button class="boardSmallBtn" onclick="showBoardPostForm()">質問を投稿する</button>
<button class="boardSmallBtn" onclick="showBoardPage()">更新</button>
</div>
<div id="boardList">読み込み中...</div>`;
if(typeof ensureHomeButton==="function") setTimeout(ensureHomeButton,0);
await loadBoardPosts();
};
window.loadBoardPosts = async function(){
const listBox=document.getElementById("boardList");
if(!listBox) return;
try{
const snap=await getDocs(query(collection(db,"boardPosts"), limit(50)));
let posts=[];
snap.forEach(d=>posts.push({id:d.id,...d.data()}));
posts.sort((a,b)=>(b.createdAtMs||0)-(a.createdAtMs||0));
if(posts.length===0){ listBox.innerHTML="<p>まだ投稿がありません。</p>"; return; }
let html="";
for(const p of posts){
html += `<div class="boardPost">
<h3>【${escapeHTML(p.genre || "質問")}】</h3>
<div class="boardQuestion">${escapeHTML(p.question || "")}</div>
<div class="boardMeta">投稿者：${escapeHTML(p.playerName || "名無し")} / 回答 ${p.answerCount||0}件 / 👍 ${p.likes||0}</div>
<button class="boardSmallBtn" onclick="showBoardDetail('${p.id}')">回答を見る</button>
<button class="boardSmallBtn" onclick="likeBoardPost('${p.id}')">👍役に立った</button>
</div>`;
}
listBox.innerHTML=html;
}catch(e){
console.error(e);
listBox.innerHTML="<p>掲示板の読み込みに失敗しました。</p>";
}
};
window.showBoardPostForm = function(prefill={}){
if(!getLoginUser()){
alert("投稿するにはログインが必要です");
if(window.showSettings) window.showSettings();
return;
}
const panel=document.getElementById("panelArea");
if(!panel) return;
panel.innerHTML = `<h2>💬 質問を投稿</h2>
<div class="boardPost">
<p>1日5件まで投稿できます。</p>
<input id="boardGenreInput" placeholder="分野（例：積分・微分）" value="${escapeHTML(prefill.genre||"")}">
<textarea id="boardQuestionInput" style="width:90%;max-width:680px;height:120px;font-size:18px;border-radius:12px;padding:10px;" placeholder="質問内容">${escapeHTML(prefill.question||"")}</textarea>
<textarea id="boardAnswerInput" style="width:90%;max-width:680px;height:90px;font-size:18px;border-radius:12px;padding:10px;" placeholder="正解・補足（任意）">${escapeHTML(prefill.answer||"")}</textarea>
<br>
<button class="boardSmallBtn" onclick="submitBoardPost()">投稿する</button>
<button class="boardSmallBtn" onclick="showBoardPage()">戻る</button>
</div>`;
if(typeof ensureHomeButton==="function") setTimeout(ensureHomeButton,0);
};
window.submitBoardPost = async function(){
try{
const user=getLoginUser();
if(!user){ alert("投稿するにはログインが必要です"); return; }
const question=(document.getElementById("boardQuestionInput")?.value||"").trim();
const answer=(document.getElementById("boardAnswerInput")?.value||"").trim();
const genre=(document.getElementById("boardGenreInput")?.value||"質問").trim().slice(0,20) || "質問";
if(!question){ alert("質問内容を入力してください"); return; }
await ensureFriendCode(user).catch(()=>{});
const limitId=user.uid + "_" + todayBoardKey();
const limitRef=doc(db,"boardDailyLimit",limitId);
const limitSnap=await getDoc(limitRef);
const count=limitSnap.exists() ? (limitSnap.data().count||0) : 0;
if(count>=5){ alert("今日の投稿上限は5件です"); return; }
const id=boardPostId();
await setDoc(doc(db,"boardPosts",id),{
postId:id,
uid:user.uid,
playerName:getBoardPlayerName(),
genre,
question:question.slice(0,1000),
answer:answer.slice(0,1000),
answerCount:0,
likes:0,
bestAnswerId:"",
createdAtMs:Date.now(),
createdAt:serverTimestamp()
});
await setDoc(limitRef,{uid:user.uid,date:todayBoardKey(),count:count+1,updatedAt:serverTimestamp()},{merge:true});
alert("投稿しました");
showBoardPage();
}catch(e){
console.error(e);
alert("投稿に失敗しました：" + (e.code || e.message || e));
}
};
window.postReviewToBoard = function(i){
if(!getLoginUser()){
alert("復習リストから投稿するにはログインが必要です");
if(window.showSettings) window.showSettings();
return;
}
const bundle=window.getLocalGameData ? window.getLocalGameData() : null;
const list=bundle && bundle.playerData ? (bundle.playerData.reviewList||[]) : [];
const r=list[i];
if(!r){ alert("投稿する問題が見つかりません"); return; }
window.showBoardPostForm({
genre:"復習リスト",
question:r.q || "",
answer:(r.a ? "正解：" + r.a + "\n" : "") + (r.explanation ? "解説：" + r.explanation : "")
});
};
window.showBoardDetail = async function(postId){
const panel=document.getElementById("panelArea");
if(!panel) return;
panel.innerHTML="<h2>読み込み中...</h2>";
try{
const postSnap=await getDoc(doc(db,"boardPosts",postId));
if(!postSnap.exists()){ panel.innerHTML="<p>投稿が見つかりません。</p>"; return; }
const p=postSnap.data();
const ansSnap=await getDocs(query(collection(db,"boardAnswers"), where("postId","==",postId), limit(50)));
let answers=[];
ansSnap.forEach(d=>answers.push({id:d.id,...d.data()}));
answers.sort((a,b)=>(a.createdAtMs||0)-(b.createdAtMs||0));
let html=`<h2>💬 掲示板</h2>
<div class="boardPost">
<h3>【${escapeHTML(p.genre||"質問")}】</h3>
<div class="boardQuestion">${escapeHTML(p.question||"")}</div>
${p.answer?`<p>補足：${escapeHTML(p.answer)}</p>`:""}
<div class="boardMeta">投稿者：${escapeHTML(p.playerName||"名無し")} / 👍 ${p.likes||0}</div>
<button class="boardSmallBtn" onclick="showBoardPage()">一覧へ戻る</button>
<button class="boardSmallBtn" onclick="likeBoardPost('${postId}')">👍役に立った</button>
</div>
<div class="boardPost">
<h3>回答する</h3>
<textarea id="boardAnswerBody" style="width:90%;max-width:680px;height:110px;font-size:18px;border-radius:12px;padding:10px;" placeholder="回答を書く"></textarea><br>
<button class="boardSmallBtn" onclick="submitBoardAnswer('${postId}')">回答を投稿</button>
</div>`;
if(answers.length===0) html += "<p>まだ回答がありません。</p>";
for(const a of answers){
html += `<div class="boardAnswer">
<div>${escapeHTML(a.body||"")}</div>
<div class="boardMeta">回答者：${escapeHTML(a.playerName||"名無し")}${p.bestAnswerId===a.id?" / 🏆ベストアンサー":""}</div>
${p.uid===getLoginUser()?.uid && p.bestAnswerId!==a.id ? `<button class="boardSmallBtn" onclick="selectBestAnswer('${postId}','${a.id}')">ベストアンサーにする</button>`:""}
</div>`;
}
panel.innerHTML=html;
if(typeof ensureHomeButton==="function") setTimeout(ensureHomeButton,0);
}catch(e){
console.error(e);
panel.innerHTML="<p>投稿の読み込みに失敗しました。</p>";
}
};
window.submitBoardAnswer = async function(postId){
const user=getLoginUser();
if(!user){ alert("回答するにはログインが必要です"); return; }
const body=(document.getElementById("boardAnswerBody")?.value||"").trim();
if(!body){ alert("回答を入力してください"); return; }
const id="ans_"+Date.now()+"_"+Math.random().toString(36).slice(2,8);
const postRef=doc(db,"boardPosts",postId);
const postSnap=await getDoc(postRef);
const currentCount=postSnap.exists() ? (postSnap.data().answerCount||0) : 0;
await setDoc(doc(db,"boardAnswers",id),{
answerId:id,postId,uid:user.uid,playerName:getBoardPlayerName(),body:body.slice(0,1000),createdAtMs:Date.now(),createdAt:serverTimestamp()
});
await setDoc(postRef,{answerCount:currentCount+1,updatedAt:serverTimestamp()},{merge:true});
showBoardDetail(postId);
};
window.likeBoardPost = async function(postId){
const user=getLoginUser();
if(!user){ alert("いいねするにはログインが必要です"); return; }
const likeId=postId+"_"+user.uid;
const likeRef=doc(db,"boardLikes",likeId);
const likeSnap=await getDoc(likeRef);
if(likeSnap.exists()){ alert("すでにいいね済みです"); return; }
const postRef=doc(db,"boardPosts",postId);
const postSnap=await getDoc(postRef);
const currentLikes=postSnap.exists() ? (postSnap.data().likes||0) : 0;
await setDoc(likeRef,{postId,uid:user.uid,createdAt:serverTimestamp()});
await setDoc(postRef,{likes:currentLikes+1,updatedAt:serverTimestamp()},{merge:true});
if(document.getElementById("boardList")) loadBoardPosts(); else showBoardDetail(postId);
};
window.selectBestAnswer = async function(postId,answerId){
const user=getLoginUser();
if(!user){ alert("ログインが必要です"); return; }
const postRef=doc(db,"boardPosts",postId);
const postSnap=await getDoc(postRef);
if(!postSnap.exists()) return;
if(postSnap.data().uid !== user.uid){ alert("ベストアンサーは投稿者だけが選べます"); return; }
await setDoc(postRef,{bestAnswerId:answerId,updatedAt:serverTimestamp()},{merge:true});
showBoardDetail(postId);
};
window.getFirebaseDebugInfo = function(){
return {
host: location.hostname,
projectId: firebaseConfig.projectId,
authDomain: firebaseConfig.authDomain,
login: !!auth.currentUser,
uid: auth.currentUser ? auth.currentUser.uid : null
};
};


// Ver3.0.8 robust match vote helpers
window.setMatchVote = async function(roomId, side, genres){
  if(!roomId) throw new Error("room-id-missing");
  const ref = doc(db,"matches",String(roomId).toUpperCase());
  const field = side === "host" ? "hostVote" : "guestVote";
  const safeGenres = Array.isArray(genres) && genres.length ? genres : ["random"];
  const snap = await getDoc(ref);
  if(!snap.exists()) throw new Error("room-not-found");
  await setDoc(ref,{
    [field]: safeGenres,
    voteUpdatedAtText: new Date().toISOString(),
    updatedAt: serverTimestamp()
  },{merge:true});
};
window.finalizeMatchVote = async function(roomId, finalGenre, questions){
  if(!roomId) throw new Error("room-id-missing");
  const ref = doc(db,"matches",String(roomId).toUpperCase());
  const snap = await getDoc(ref);
  if(!snap.exists()) return null;
  const room = snap.data();
  if(room.finalGenre) return room;
  const labels={arithmetic:"四則演算",prime:"素因数分解",factor:"因数分解",expand:"展開",derivative:"微分",integral:"積分",random:"ランダム"};
  const qs = Array.isArray(questions) && questions.length ? questions : (room.questions || []);
  await setDoc(ref,{
    finalGenre: finalGenre || "random",
    finalGenreLabel: labels[finalGenre] || finalGenre || "ランダム",
    questions: qs,
    currentQuestion: qs[0] || room.currentQuestion || null,
    round: 0,
    roundWinner: "",
    finalizingGenre: false,
    updatedAt: serverTimestamp()
  },{merge:true});
  const after = await getDoc(ref);
  return after.exists() ? after.data() : null;
};

console.log("module.js Ver 3.2.0 display/ranking fix loaded");


// Ver3.1.9 ranking / mission / mutual friend helpers
function getDailyKey319(){
  const now=new Date();
  const jp=new Date(now.toLocaleString("en-US",{timeZone:"Asia/Tokyo"}));
  const y=jp.getFullYear();
  const m=String(jp.getMonth()+1).padStart(2,"0");
  const d=String(jp.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function requireLogin319(){
  if(!auth.currentUser) throw new Error("login-required");
  return auth.currentUser;
}
window.saveDailyQuestionCount = async function(delta=1){
  const user=requireLogin319();
  const playerId=getPlayerId();
  const day=getDailyKey319();
  const ref=doc(db,"dailyQuestionRankings",day+"_"+playerId);
  const snap=await getDoc(ref);
  const old=snap.exists()?snap.data():{};
  const bundle=window.getLocalGameData?window.getLocalGameData():{};
  const pp=bundle.playerProfile||{};
  const pd=bundle.playerData||{};
  await setDoc(ref,{
    day, playerId, uid:user.uid,
    name:pp.name||"名無し",
    icon:pp.icon||"",
    title:pd.equippedTitle||"初心者",
    count:(old.count||0)+delta,
    updatedAt:serverTimestamp()
  },{merge:true});
};
window.loadDailyQuestionRanking = async function(){
  const day=getDailyKey319();
  const snap=await getDocs(query(collection(db,"dailyQuestionRankings"), where("day","==",day), limit(100)));
  let list=[]; snap.forEach(d=>list.push(d.data()));
  list.sort((a,b)=>(b.count||0)-(a.count||0));
  return list.slice(0,100);
};
window.loadLevelRanking = async function(){
  const snap=await getDocs(collection(db,"players"));
  let list=[]; snap.forEach(d=>list.push(d.data()));
  const seen=new Set();
  list=list.filter(p=>{ const k=p.playerId||p.friendCode||p.name; if(seen.has(k))return false; seen.add(k); return true; });
  list.sort((a,b)=>((b.level||1)-(a.level||1)) || ((b.exp||0)-(a.exp||0)));
  return list.slice(0,100);
};
const oldSavePlayerPublicData319 = window.savePlayerPublicData;
window.savePlayerPublicData = async function(data){
  if(oldSavePlayerPublicData319) await oldSavePlayerPublicData319(data);
  const playerId=getPlayerId();
  const bundle=window.getLocalGameData?window.getLocalGameData():{};
  const pd=bundle.playerData||{};
  await setDoc(doc(db,"players",playerId),{exp:pd.exp||0,totalQuestions:pd.totalQuestions||0,updatedAt:serverTimestamp()},{merge:true});
  const fc=normalizeFriendCode(localStorage.getItem("friendCode"));
  if(fc) await setDoc(doc(db,"players",fc),{exp:pd.exp||0,totalQuestions:pd.totalQuestions||0,updatedAt:serverTimestamp()},{merge:true});
};
window.contributeGlobalMission = async function(delta=1){
  // Ver3.1.9 fix: 全体ミッションはログイン不要で反映
  const day=getDailyKey319();
  const ref=doc(db,"globalMissions",day);
  const snap=await getDoc(ref);
  const old=snap.exists()?snap.data():{};
  await setDoc(ref,{day,correct:(old.correct||0)+Number(delta||1),updatedAt:serverTimestamp()},{merge:true});
};
window.saveDailyQuestionTotal = async function(totalCount=0){
  const user=requireLogin319();
  const playerId=getPlayerId();
  const day=getDailyKey319();
  const ref=doc(db,"dailyQuestionRankings",day+"_"+playerId);
  const bundle=window.getLocalGameData?window.getLocalGameData():{};
  const pp=bundle.playerProfile||{};
  const pd=bundle.playerData||{};
  await setDoc(ref,{
    day, playerId, uid:user.uid,
    name:pp.name||"名無し",
    icon:pp.icon||"",
    title:pd.equippedTitle||"初心者",
    level:(window.getLevel?window.getLevel():1),
    count:Number(totalCount||0),
    updatedAt:serverTimestamp()
  },{merge:true});
};
window.loadGlobalMission = async function(){
  const day=getDailyKey319();
  const ref=doc(db,"globalMissions",day);
  const snap=await getDoc(ref);
  let data=snap.exists()?snap.data():{day,correct:0};
  if(auth.currentUser){
    const cr=await getDoc(doc(db,"globalMissionClaims",day+"_"+auth.currentUser.uid));
    data.claimed=cr.exists()?(cr.data().claimed||[]):[];
  }else data.claimed=[];
  return data;
};
window.claimGlobalMissionReward = async function(need){
  const user=requireLogin319();
  const day=getDailyKey319();
  const ref=doc(db,"globalMissionClaims",day+"_"+user.uid);
  const snap=await getDoc(ref);
  const old=snap.exists()?snap.data():{claimed:[]};
  const claimed=old.claimed||[];
  if(claimed.includes(String(need))) return false;
  claimed.push(String(need));
  await setDoc(ref,{uid:user.uid,day,claimed,updatedAt:serverTimestamp()},{merge:true});
  return true;
};
window.addMutualFriendCode = async function(friendCode){
  const user=requireLogin319();
  const myCode=await ensureFriendCode(user).catch(()=>normalizeFriendCode(localStorage.getItem("friendCode")));
  const code=normalizeFriendCode(friendCode);
  if(!code || code===myCode) return false;
  const codeSnap=await getDoc(doc(db,"friendCodes",code));
  if(!codeSnap.exists()) return false;
  const targetUid=codeSnap.data().uid;
  const myRef=doc(db,"userProfiles",user.uid);
  const tgRef=doc(db,"userProfiles",targetUid);
  const mySnap=await getDoc(myRef); const tgSnap=await getDoc(tgRef);
  const myFriends=(mySnap.exists()&&Array.isArray(mySnap.data().friends))?mySnap.data().friends:[];
  const tgFriends=(tgSnap.exists()&&Array.isArray(tgSnap.data().friends))?tgSnap.data().friends:[];
  if(!myFriends.some(f=>(typeof f==="string"?f:f.id)===code)) myFriends.push({id:code});
  if(myCode && !tgFriends.some(f=>(typeof f==="string"?f:f.id)===myCode)) tgFriends.push({id:myCode});
  await setDoc(myRef,{friends:myFriends,updatedAt:serverTimestamp()},{merge:true});
  await setDoc(tgRef,{friends:tgFriends,updatedAt:serverTimestamp()},{merge:true});
  return true;
};
window.syncMyCloudFriends = async function(){
  const user=auth.currentUser;
  if(!user) return [];
  const snap=await getDoc(doc(db,"userProfiles",user.uid));
  if(!snap.exists()) return [];
  return Array.isArray(snap.data().friends)?snap.data().friends:[];
};


// Ver3.2.0 final ranking/mission API
(function(){
  function dayKeyV320(){
    const now=new Date();
    const jp=new Date(now.toLocaleString("en-US",{timeZone:"Asia/Tokyo"}));
    return `${jp.getFullYear()}-${String(jp.getMonth()+1).padStart(2,"0")}-${String(jp.getDate()).padStart(2,"0")}`;
  }
  function loggedUserV320(){ return auth.currentUser || null; }
  window.saveDailyQuestionTotal = async function(totalCount=0){
    const user=loggedUserV320();
    if(!user) return false;
    const playerId=getPlayerId();
    const day=dayKeyV320();
    const ref=doc(db,"dailyQuestionRankings",day+"_"+playerId);
    const bundle=window.getLocalGameData?window.getLocalGameData():{};
    const pp=bundle.playerProfile||{};
    const pd=bundle.playerData||{};
    await setDoc(ref,{day,playerId,uid:user.uid,name:pp.name||"名無し",icon:pp.icon||"",title:pd.equippedTitle||"初心者",level:(window.getLevel?window.getLevel():1),count:Number(totalCount||0),updatedAt:serverTimestamp()},{merge:true});
    return true;
  };
  window.saveLevelRankingNow = async function(){
    const user=loggedUserV320();
    if(!user) return false;
    const playerId=getPlayerId();
    const bundle=window.getLocalGameData?window.getLocalGameData():{};
    const pp=bundle.playerProfile||{};
    const pd=bundle.playerData||{};
    const data={playerId,uid:user.uid,name:pp.name||"名無し",playerName:pp.name||"名無し",icon:pp.icon||"",title:pd.equippedTitle||"初心者",level:(window.getLevel?window.getLevel():1),exp:pd.exp||0,totalQuestions:pd.totalQuestions||0,bestRandomScore:pd.bestRandomScore||0,updatedAt:serverTimestamp()};
    await setDoc(doc(db,"players",playerId),data,{merge:true});
    const fc=normalizeFriendCode(localStorage.getItem("friendCode"));
    if(fc) await setDoc(doc(db,"players",fc),{...data,friendCode:fc},{merge:true});
    return true;
  };
  window.loadDailyQuestionRanking = async function(){
    const day=dayKeyV320();
    const snap=await getDocs(query(collection(db,"dailyQuestionRankings"), where("day","==",day), limit(100)));
    let list=[]; snap.forEach(d=>list.push(d.data()));
    list.sort((a,b)=>(b.count||0)-(a.count||0));
    return list.slice(0,100);
  };
  window.loadLevelRanking = async function(){
    const snap=await getDocs(collection(db,"players"));
    let list=[]; snap.forEach(d=>list.push(d.data()));
    const seen=new Set();
    list=list.filter(p=>{const k=p.uid||p.playerId||p.friendCode||p.name; if(seen.has(k))return false; seen.add(k); return true;});
    list.sort((a,b)=>((b.level||1)-(a.level||1))||((b.exp||0)-(a.exp||0)));
    return list.slice(0,100);
  };
  window.subscribeDailyQuestionRanking = function(callback){
    const day=dayKeyV320();
    const qRef=query(collection(db,"dailyQuestionRankings"), where("day","==",day), limit(100));
    return onSnapshot(qRef,(snap)=>{let list=[]; snap.forEach(d=>list.push(d.data())); list.sort((a,b)=>(b.count||0)-(a.count||0)); callback(list.slice(0,100));});
  };
  window.subscribeLevelRanking = function(callback){
    return onSnapshot(collection(db,"players"),(snap)=>{let list=[]; snap.forEach(d=>list.push(d.data())); const seen=new Set(); list=list.filter(p=>{const k=p.uid||p.playerId||p.friendCode||p.name; if(seen.has(k))return false; seen.add(k); return true;}); list.sort((a,b)=>((b.level||1)-(a.level||1))||((b.exp||0)-(a.exp||0))); callback(list.slice(0,100));});
  };
  window.contributeGlobalMission = async function(delta=1){
    const day=dayKeyV320();
    const ref=doc(db,"globalMissions",day);
    const snap=await getDoc(ref);
    const old=snap.exists()?snap.data():{};
    await setDoc(ref,{day,correct:(old.correct||0)+Number(delta||1),updatedAt:serverTimestamp()},{merge:true});
    return true;
  };
  window.subscribeGlobalMission = function(callback){
    const day=dayKeyV320();
    return onSnapshot(doc(db,"globalMissions",day),(snap)=>callback(snap.exists()?snap.data():{day,correct:0}));
  };
})();


window.__rank333_doc = doc;
window.__rank333_setDoc = setDoc;
window.__rank333_serverTimestamp = serverTimestamp;

// Ver3.3.3 emergency: ranking update rollback / account-safe write
(function(){
  if(window.__rankingRollback321SafeLoaded) return;
  window.__rankingRollback321SafeLoaded = true;

  function safeName333(){
    try{
      const bundle = window.getLocalGameData ? window.getLocalGameData() : {};
      const pp = bundle.playerProfile || {};
      const pd = bundle.playerData || {};
      return String(pp.name || pd.profileName || pd.name || "名無し").slice(0,16);
    }catch(e){ return "名無し"; }
  }
  function safeIcon333(){
    try{
      const bundle = window.getLocalGameData ? window.getLocalGameData() : {};
      const pp = bundle.playerProfile || {};
      return pp.icon || "";
    }catch(e){ return ""; }
  }
  function safePlayerData333(){
    try{
      const bundle = window.getLocalGameData ? window.getLocalGameData() : {};
      return bundle.playerData || window.playerData || {};
    }catch(e){ return window.playerData || {}; }
  }
  function level333(exp){
    if(typeof window.getLevel === "function"){
      try{return Number(window.getLevel() || 1);}catch(e){}
    }
    exp = Number(exp || 0);
    let lv = 1, need = 50, used = 0;
    while(exp >= used + need && lv < 999){
      used += need;
      lv++;
      need = Math.floor(50 * lv * 1.15);
    }
    return lv;
  }
  function day333(){
    const now = new Date();
    const jp = new Date(now.toLocaleString("en-US",{timeZone:"Asia/Tokyo"}));
    return `${jp.getFullYear()}-${String(jp.getMonth()+1).padStart(2,"0")}-${String(jp.getDate()).padStart(2,"0")}`;
  }
  function currentUser333(){
    return (window.firebaseAuth && window.firebaseAuth.currentUser) || window.currentUser || null;
  }
  function playerId333(user){
    if(!user || !user.uid) return "";
    return "google_" + user.uid;
  }

  // 重要：localStorageのplayerId/friendCodeではランキングを書かない。
  // 重要：GoogleのdisplayName/email/photoURLはランキングに保存しない。
  window.saveDailyQuestionTotal = async function(totalCount=0){
    const user = currentUser333();
    if(!user || !user.uid) return false;
    const db = window.firebaseDb || window.db;
    if(!db || !window.__rank333_setDoc || !window.__rank333_doc || !window.__rank333_serverTimestamp) return false;
    const pid = playerId333(user);
    const pd = safePlayerData333();
    const ref = window.__rank333_doc(db, "dailyQuestionRankings", day333()+"_"+pid);
    await window.__rank333_setDoc(ref, {
      day: day333(),
      playerId: pid,
      uid: user.uid,
      name: safeName333(),
      playerName: safeName333(),
      icon: safeIcon333(),
      title: pd.equippedTitle || "初心者",
      level: level333(pd.exp || 0),
      count: Number(totalCount || 0),
      updatedAt: window.__rank333_serverTimestamp()
    }, {merge:true});
    return true;
  };

  window.saveLevelRankingNow = async function(){
    const user = currentUser333();
    if(!user || !user.uid) return false;
    const db = window.firebaseDb || window.db;
    if(!db || !window.__rank333_setDoc || !window.__rank333_doc || !window.__rank333_serverTimestamp) return false;
    const pd = safePlayerData333();
    const exp = Number(pd.exp || 0);
    const pid = playerId333(user);
    const data = {
      playerId: pid,
      uid: user.uid,
      name: safeName333(),
      playerName: safeName333(),
      icon: safeIcon333(),
      title: pd.equippedTitle || "初心者",
      level: level333(exp),
      exp: exp,
      totalQuestions: Number(pd.totalQuestions || 0),
      bestRandomScore: Number(pd.bestRandomScore || 0),
      updatedAt: window.__rank333_serverTimestamp()
    };
    await window.__rank333_setDoc(window.__rank333_doc(db, "players", pid), data, {merge:true});
    return true;
  };

  window.savePlayerPublicData = async function(data){
    return window.saveLevelRankingNow();
  };

  console.log("Ver3.3.3 ranking rollback 3.2.1 safe patch loaded");
})();

