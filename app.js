let i = 0;
let score = 0;
let time = 300;
let timer;
let current;

function rand(min, max){
  return Math.floor(Math.random()*(max-min+1))+min;
}

// 数式評価（分数・小数・√対応用）
function evalExpr(str){
  try {
    return math.evaluate(str);
  } catch(e){
    return null;
  }
}

// +C削除など
function normalize(str){
  return str
    .replace(/\s/g,"")
    .replace(/\+C/g,"")
    .replace(/C/g,"");
}

// ===== 問題生成（完全ランダム）=====
function generateQuestion(){

  let type = rand(1,5);

  // ① 不定積分
  if(type === 1){
    let a = rand(-5,5);
    let n = rand(1,3);

    return {
      q:`∫ ${a}x^${n} dx`,
      a:`${a/(n+1)}x^${n+1}`
    };
  }

  // ② sin
  if(type === 2){
    let a = rand(1,5);

    return {
      q:`∫ ${a}sin(x) dx`,
      a:`-${a}cos(x)`
    };
  }

  // ③ e^x
  if(type === 3){
    let a = rand(1,5);

    return {
      q:`∫ ${a}e^x dx`,
      a:`${a}e^x`
    };
  }

  // ④ 定積分
  if(type === 4){
    let a = rand(1,3);
    let b = rand(4,8);
    let A = rand(1,3);
    let n = rand(1,2);

    let ans =
      (A/(n+1))*(Math.pow(b,n+1)-Math.pow(a,n+1));

    return {
      q:`∫[${a}→${b}] ${A}x^${n} dx`,
      a:`${ans}`
    };
  }

  // ⑤ 四則演算
  let a = rand(-10,10);
  let b = rand(-10,10);
  let op = rand(1,4);

  let q, ans;

  if(op === 1){
    q = `${a} + ${b}`;
    ans = a + b;
  }

  if(op === 2){
    q = `${a} - ${b}`;
    ans = a - b;
  }

  if(op === 3){
    q = `${a} × ${b}`;
    ans = a * b;
  }

  if(op === 4){
    if(b === 0) b = 1;
    q = `${a} ÷ ${b}`;
    ans = a / b;
  }

  return {
    q: q,
    a: String(ans)
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

// ===== 問題出題 =====
function nextQ(){
  current = generateQuestion();

  document.getElementById("q").innerText =
  "問題 "+(i+1)+"/5\n\n"+current.q;

  document.getElementById("ans").value="";
}

// ===== 回答 =====
function submit(){

  let u = document.getElementById("ans").value;

  let userVal = evalExpr(u);
  let correctVal = evalExpr(current.a);

  let ok = false;

  if(userVal !== null && correctVal !== null){
    ok = Math.abs(userVal - correctVal) < 1e-8;
  }

  if(!ok){
    ok = normalize(u) === normalize(current.a);
  }

  if(ok){
    score++;
    document.getElementById("se_correct").play();
    document.getElementById("result").innerText="○ 正解";
  } else {
    document.getElementById("se_wrong").play();
    document.getElementById("result").innerText=
    "× 不正解\n答え:"+current.a;
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
function flash(color){
  document.body.style.boxShadow = `0 0 80px ${color}`;

  setTimeout(()=>{
    document.body.style.boxShadow = "none";
  },200);
}
function start(){
  document.getElementById("bgm").play();

  i=0;
  score=0;

  nextQ();
  startTimer();
}