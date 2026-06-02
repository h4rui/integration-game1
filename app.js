let i = 0;
let score = 0;
let time = 300;
let timer;
let current;

function rand(min, max){
  return Math.floor(Math.random()*(max-min+1))+min;
}

// ===== 完全ランダム生成 =====
function generateQuestion(){

  let type = rand(1,3);

  // 多項式（不定積分）
  if(type===1){
    let a = rand(-5,5);
    let n = rand(1,4);

    return {
      q:`∫ ${a}x^${n} dx`,
      a:`${a/(n+1)}x^${n+1}`
    };
  }

  // sin
  if(type===2){
    let a = rand(1,5);

    return {
      q:`∫ ${a}sin(x) dx`,
      a:`-${a}cos(x)`
    };
  }

  // 定積分
  let a = rand(1,3);
  let b = rand(2,5);

  let A = rand(1,3);
  let n = rand(1,3);

  let F = (A/(n+1));

  let ans = F*(Math.pow(b,n+1)-Math.pow(a,n+1));

  return {
    q:`∫[${a}→${b}] ${A}x^${n} dx`,
    a:`${ans}`
  };
}

// ===== スタート =====
function start(){
  document.getElementById("bgm").play();
  i=0;
  score=0;
  nextQ();
  startTimer();
}

// ===== タイマー =====
function startTimer(){
  clearInterval(timer);
  time=300;

  timer=setInterval(()=>{
    time--;

    document.getElementById("timer").innerText =
    "⏰ "+Math.floor(time/60)+":"+String(time%60).padStart(2,"0");

    if(time<=0) next();
  },1000);
}

// ===== 問題 =====
function nextQ(){
  current = generateQuestion();

  document.getElementById("q").innerText =
  "問題 "+(i+1)+"/5\n\n"+current.q;

  document.getElementById("ans").value="";
}

// ===== 正規化（x / (x) どっちでもOK）=====
function normalize(str){
  return str
    .replace(/\s/g,"")
    .replace(/\(x\)/g,"x")
    .replace(/x/g,"x");
}

// ===== 回答 =====
function submit(){

  let u = document.getElementById("ans").value;

  if(normalize(u) === normalize(current.a)){
    score++;
    document.getElementById("result").innerText="○ 正解";
  } else {
    document.getElementById("result").innerText="× 不正解\n答え:"+current.a;
  }

  next();
}

// ===== 次 =====
function next(){
  i++;

  if(i>=5){
    document.body.innerHTML =
    `<h2>結果</h2><p>${score}/5</p>`;
  } else {
    nextQ();
    startTimer();
  }
}
function submit(){

  let u = document.getElementById("ans").value;

  if(normalize(u) === normalize(current.a)){

    score++;

    // 🔊 正解音
    document.getElementById("se_correct").play();

    document.getElementById("result").innerText="○ 正解";

  } else {

    // 🔊 不正解音
    document.getElementById("se_wrong").play();

    document.getElementById("result").innerText=
      "× 不正解\n答え:"+current.a;
  }

  next();
}