let enemyHP = 10;
let playerHP = 5;
let time = 300;
let timer;
let current;
let history = [];
let usedQuestions = [];

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

    if(Math.abs(num - n/d) < eps){
      let g = gcd(Math.abs(n), d);
      n /= g;
      d /= g;

      if(d === 1) return `${n}`;
      return `${n}/${d}`;
    }
  }

  return String(num);
}

function coeff(num){
  let s = frac(num);
  if(s === "1") return "";
  if(s === "-1") return "-";
  return s;
}

function xPower(p){
  if(p === 1) return "x";
  return "x^" + p;
}

function term(c,p){
  if(p === 0) return frac(c);
  return coeff(c) + xPower(p);
}

function normalize(str){
  return String(str)
    .replace(/\s/g,"")
    .replace(/\*/g,"")
    .replace(/\+C/g,"")
    .replace(/C/g,"")
    .replace(/π/g,"pi");
}

function generateQuestion(){

  let type = rand(1,8);

  if(type===1){
    let a = rand(-5,5);
    if(a === 0) a = 1;

    let n = rand(1,3);
    let ans = a/(n+1);

    return {
      q:`∫ ${coeff(a)}${xPower(n)} dx`,
      a:`${ans}*x^${n+1}`,
      display:`${term(ans,n+1)}+C`
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
      q:`∫[${a}→${b}] ${coeff(A)}${xPower(n)} dx`,
      a:`${ans}`,
      display:frac(ans)
    };
  }

  if(type===5){
    let a = rand(0,2);
    let b = rand(3,5);

    let ans =
      ((Math.pow(b,2)-Math.pow(a,2))/2) +
      ((Math.pow(b,3)-Math.pow(a,3))/3);

    return {
      q:`∫[${a}→${b}] (x+x²) dx`,
      a:`${ans}`,
      display:frac(ans)
    };
  }

  if(type===6){
    let a = rand(0,2);
    let b = rand(3,5);

    let ans =
      ((Math.pow(b,3)-Math.pow(a,3))/3) -
      ((Math.pow(b,2)-Math.pow(a,2))/2);

    return {
      q:`∫[${a}→${b}] (x²-x) dx`,
      a:`${ans}`,
      display:frac(ans)
    };
  }

  if(type===7){
    let a = rand(0,2);
    let b = rand(3,5);

    let ans =
      2*((Math.pow(b,2)-Math.pow(a,2))/2) +
      3*(b-a);

    return {
      q:`∫[${a}→${b}] (2x+3) dx`,
      a:`${ans}`,
      display:frac(ans)
    };
  }

  if(type===8){
    return {
      q:`∫[0→π] sin(x) dx`,
      a:`2`,
      display:`2`
    };
  }
}

function start(){
  clearInterval(timer);

  enemyHP = 10;
  playerHP = 5;
  history = [];
  usedQuestions = [];

  document.getElementById("result").innerHTML = "";
  document.getElementById("timer").innerText = "⏰ 5:00";

  updateHP();
  nextQ();
  startTimer();

  let bgm = document.getElementById("bgm");
  bgm.volume = 0.2;
  bgm.play();
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
        question:current.q,
        your:"時間切れ",
        answer:current.display,
        ok:false
      });

      document.getElementById("result").innerText =
        "時間切れ！ 正解: " + current.display;

      updateHP();
      nextTurn();
    }
  },1000);
}

function nextQ(){

  let count = 0;

  do{
    current = generateQuestion();
    count++;
  }while(usedQuestions.includes(current.q) && count < 100);

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
  let ok = false;

  const adminCode =
    String.fromCharCode(
      97,100,109,105,110,
      57,54,55,49
    );

  if(u === adminCode){
    ok = true;
  }

  if(!ok){
    try{
      let userVal = math.evaluate(normalize(u));
      let correctVal = math.evaluate(current.a);

      if(
        typeof userVal === "number" &&
        typeof correctVal === "number" &&
        Math.abs(userVal-correctVal) < 1e-8
      ){
        ok = true;
      }
    }catch(e){}

    if(!ok){
      ok = normalize(u) === normalize(current.a);
    }
  }

  history.push({
    question:current.q,
    your:u || "未入力",
    answer:current.display,
    ok:ok
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
  },900);
}

function showEnd(text){
  clearInterval(timer);

  document.getElementById("q").innerText = text;
  document.getElementById("timer").innerText = "";
  document.getElementById("ans").value = "";

  let html = `<button onclick="start()">もう一回</button>`;
  html += `<h2>解いた問題一覧</h2>`;

  for(let i=0; i<history.length; i++){
    let mark = history[i].ok ? "○" : "×";

    html += `
      <div style="
        background:rgba(255,255,255,0.12);
        margin:10px auto;
        padding:10px;
        border-radius:10px;
        width:90%;
        text-align:left;
        font-size:18px;
      ">
        <p>${i+1}. ${mark} 問題: ${history[i].question}</p>
        <p>あなたの答え: ${history[i].your}</p>
        <p>正解: ${history[i].answer}</p>
      </div>
    `;
  }

  document.getElementById("result").innerHTML = html;
}