let enemyHP = 10;
let playerHP = 5;
let time = 300;
let timer;
let current;
let history = [];

function rand(min,max){
  return Math.floor(Math.random()*(max-min+1))+min;
}

function normalize(str){
  return String(str)
    .replace(/\s/g,"")
    .replace(/\*/g,"")
    .replace(/\+C/g,"")
    .replace(/C/g,"");
}

function generateQuestion(){

  let diff = document.getElementById("difficulty").value;
  let type;

  if(diff==="easy") type = rand(1,2);
  if(diff==="normal") type = rand(1,4);
  if(diff==="hard") type = rand(1,6);

  if(type===1){
    let a = rand(-5,5);
    if(a === 0) a = 1;
    let n = rand(1,3);

    return {
      q:`∫ ${a}x^${n} dx`,
      a:`${a/(n+1)}*x^${n+1}`,
      display:`${a/(n+1)}x^${n+1}+C`
    };
  }

  if(type===2){
    let a = rand(1,5);

    return {
      q:`∫ ${a}sin(x) dx`,
      a:`-${a}*cos(x)`,
      display:`-${a}cos(x)+C`
    };
  }

  if(type===3){
    let a = rand(1,5);

    return {
      q:`∫ ${a}e^x dx`,
      a:`${a}*exp(x)`,
      display:`${a}e^x+C`
    };
  }

  if(type===4){
    let a = rand(1,3);
    let b = rand(4,8);
    let A = rand(1,3);
    let n = rand(1,2);

    let ans = (A/(n+1))*(Math.pow(b,n+1)-Math.pow(a,n+1));

    return {
      q:`∫[${a}→${b}] ${A}x^${n} dx`,
      a:`${ans}`,
      display:`${ans}`
    };
  }

  if(type===5){
    let a = rand(-10,10);
    let b = rand(-10,10);
    if(b === 0) b = 1;

    let op = rand(1,4);

    if(op===1) return {q:`${a}+${b}`, a:`${a+b}`, display:`${a+b}`};
    if(op===2) return {q:`${a}-${b}`, a:`${a-b}`, display:`${a-b}`};
    if(op===3) return {q:`${a}×${b}`, a:`${a*b}`, display:`${a*b}`};
    return {q:`${a}÷${b}`, a:`${a/b}`, display:`${a/b}`};
  }

  let v1 = 1/2;
  let v2 = 1/3;
  let op = rand(1,4);

  if(op===1) return {
    q:"(∫x dx)+(∫x^2 dx)",
    a:`${v1+v2}`,
    display:`${v1+v2}`
  };

  if(op===2) return {
    q:"(∫x dx)-(∫x^2 dx)",
    a:`${v1-v2}`,
    display:`${v1-v2}`
  };

  if(op===3) return {
    q:"(∫x dx)×(∫x^2 dx)",
    a:`${v1*v2}`,
    display:`${v1*v2}`
  };

  return {
    q:"(∫x dx)÷(∫x^2 dx)",
    a:`${v1/v2}`,
    display:`${v1/v2}`
  };
}

function start(){
  document.getElementById("bgm").volume = 0.2;
  document.getElementById("bgm").play();

  enemyHP = 10;
  playerHP = 5;
  history = [];

  document.getElementById("result").innerText = "";
  document.getElementById("timer").innerText = "⏰ 5:00";

  updateHP();
  nextQ();
  startTimer();
}

function startTimer(){
  clearInterval(timer);
  time = 300;

  timer = setInterval(()=>{
    time--;

    document.getElementById("timer").innerText =
      "⏰ " + Math.floor(time/60) + ":" + String(time%60).padStart(2,"0");

    if(time<=0){
      playerHP--;

      history.push({
        question: current.q,
        your: "時間切れ",
        answer: current.display,
        ok: false
      });

      document.getElementById("result").innerText =
        "時間切れ！ 正解: " + current.display;

      updateHP();
      nextTurn();
    }
  },1000);
}

function nextQ(){
  current = generateQuestion();
  document.getElementById("q").innerText = current.q;
  document.getElementById("ans").value = "";
}

function submit(){

  if(!current) return;

  let u = document.getElementById("ans").value;
  let ok = false;

  try{
    let userVal = math.evaluate(u);
    let correctVal = math.evaluate(current.a);

    if(
      typeof userVal === "number" &&
      typeof correctVal === "number" &&
      Math.abs(userVal - correctVal) < 1e-8
    ){
      ok = true;
    }
  }catch(e){}

  if(!ok){
    ok = normalize(u) === normalize(current.a);
  }

  history.push({
    question: current.q,
    your: u || "未入力",
    answer: current.display,
    ok: ok
  });

  if(ok){
    enemyHP--;

    let enemy = document.getElementById("enemy");
    let slash = document.getElementById("slash");
    let samurai = document.getElementById("samurai");

    enemy.classList.add("enemyHit");
    slash.innerText = "⚔️";
    slash.classList.add("showSlash");

    if(samurai){
      samurai.classList.add("samuraiAttack");
    }

    setTimeout(()=>{
      enemy.classList.remove("enemyHit");
      slash.classList.remove("showSlash");

      if(samurai){
        samurai.classList.remove("samuraiAttack");
      }
    },500);

    document.getElementById("se_correct").play();
    document.getElementById("result").innerText =
      "○ 攻撃成功！ 正解: " + current.display;

  }else{
    playerHP--;

    let samurai = document.getElementById("samurai");

    document.body.classList.add("playerHit");

    if(samurai){
      samurai.classList.add("samuraiDamage");
    }

    setTimeout(()=>{
      document.body.classList.remove("playerHit");

      if(samurai){
        samurai.classList.remove("samuraiDamage");
      }
    },400);

    document.getElementById("se_wrong").play();
    document.getElementById("result").innerText =
      "× ダメージ！ 正解: " + current.display;
  }

  updateHP();
  nextTurn();
}

function updateHP(){
  document.getElementById("ehp").innerText = enemyHP;
  document.getElementById("php").innerText = playerHP;

  document.getElementById("enemyBar").style.width =
    (enemyHP / 10 * 100) + "%";

  document.getElementById("playerBar").style.width =
    (playerHP / 5 * 100) + "%";
}

function nextTurn(){
  clearInterval(timer);

  if(enemyHP<=0){
    showEnd("勝利！");
    return;
  }

  if(playerHP<=0){
    showEnd("敗北...");
    return;
  }

  setTimeout(()=>{
    nextQ();
    startTimer();
  },700);
}

function showEnd(text){
  clearInterval(timer);

  document.getElementById("q").innerText = text;
  document.getElementById("timer").innerText = "";
  document.getElementById("ans").value = "";

  let html = `<button onclick="start()">もう一回</button>`;
  html += `<h2>解いた問題一覧</h2>`;
  html += `<div style="width:90%;margin:20px auto;text-align:left;">`;

  for(let i=0; i<history.length; i++){
    let mark = history[i].ok ? "○" : "×";

    html += `
      <div style="
        background:rgba(255,255,255,0.1);
        margin:10px;
        padding:10px;
        border-radius:10px;
      ">
        <p>${i+1}. ${mark} 問題: ${history[i].question}</p>
        <p>あなたの答え: ${history[i].your}</p>
        <p>正解: ${history[i].answer}</p>
      </div>
    `;
  }

  html += `</div>`;

  document.getElementById("result").innerHTML = html;
}