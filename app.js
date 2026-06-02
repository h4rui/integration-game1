let i = 0;
let score = 0;
let time = 300;
let timer;
let current;

function rand(min,max){
  return Math.floor(Math.random()*(max-min+1))+min;
}

// 数式評価
function evalExpr(str){
  try {
    return math.evaluate(str);
  } catch(e){
    return null;
  }
}

// +C除去
function normalize(str){
  return str.replace(/\s/g,"").replace(/\+C/g,"").replace(/C/g,"");
}

// ===== 問題生成 =====
function generateQuestion(){

  let diff = document.getElementById("difficulty").value;

  let type;

  if(diff==="easy") type = rand(1,2);
  if(diff==="normal") type = rand(1,4);
  if(diff==="hard") type = rand(1,6);

  // 不定積分
  if(type===1){
    let a = rand(-5,5);
    let n = rand(1,3);

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

  // e^x
  if(type===3){
    let a = rand(1,5);
    return {
      q:`∫ ${a}e^x dx`,
      a:`${a}e^x`
    };
  }

  // 定積分
  if(type===4){
    let a = rand(1,3);
    let b = rand(4,8);
    let A = rand(1,3);
    let n = rand(1,2);

    let ans = (A/(n+1))*(Math.pow(b,n+1)-Math.pow(a,n+1));

    return {
      q:`∫[${a}→${b}] ${A}x^${n} dx`,
      a:`${ans}`
    };
  }

  // 四則演算
  if(type===5){
    let a = rand(-10,10);
    let b = rand(-10,10);
    let op = rand(1,4);

    if(op===1) return {q:`${a}+${b}`, a:`${a+b}`};
    if(op===2) return {q:`${a}-${b}`, a:`${a-b}`};
    if(op===3) return {q:`${a}×${b}`, a:`${a*b}`};
    if(op===4) return {q:`${a}÷${b||1}`, a:`${a/(b||1)}`};
  }

  // 積分×四則
  let a = rand(1,3);
  let n = rand(1,2);
  let v = a/(n+1);

  let a2 = rand(1,3);
  let n2 = rand(1,2);
  let v2 = a2/(n2+1);

  let op = rand(1,4);

  if(op===1) return {q:"(∫x dx)+(∫x^2 dx)", a:`${v+v2}`};
  if(op===2) return {q:"(∫x dx)-(∫x^2 dx)", a:`${v-v2}`};
  if(op===3) return {q:"(∫x dx)×(∫x^2 dx)", a:`${v*v2}`};
  return {q:"(∫x dx)÷(∫x^2 dx)", a:`${v/v2}`};
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
    document.getElementById("timer").innerText=
    "⏰ "+Math.floor(time/60)+":"+String(time%60).padStart(2,"0");

    if(time<=0) next();
  },1000);
}

// ===== 出題 =====
function nextQ(){
  current = generateQuestion();
  document.getElementById("q").innerText=
  current.q;
  document.getElementById("ans").value="";
}

// ===== 回答 =====
function submit(){

  let u = document.getElementById("ans").value;

  let userVal = evalExpr(u);
  let correctVal = evalExpr(current.a);

  let ok = false;

  if(userVal!==null && correctVal!==null){
    ok = Math.abs(userVal-correctVal)<1e-8;
  }

  if(!ok){
    ok = normalize(u)===normalize(current.a);
  }

  if(ok){
    score++;
    document.getElementById("se_correct").play();
    document.getElementById("result").innerText="○ 正解";
  } else {
    document.getElementById("se_wrong").play();
    document.getElementById("result").innerText="× 不正解";
  }

  next();
}

// ===== 次 =====
function next(){
  i++;
  if(i>=5){
    document.body.innerHTML=`<h1>結果 ${score}/5</h1>`;
  } else {
    nextQ();
    startTimer();
  }
}