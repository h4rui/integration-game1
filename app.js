let enemyHP = 10;
let playerHP = 5;
let time = 300;
let timer;
let current;
let history = [];

function rand(min,max){
  return Math.floor(Math.random()*(max-min+1))+min;
}

function fixInput(str){
  return String(str)
    .replace(/sinx/g,"sin(x)")
    .replace(/cosx/g,"cos(x)")
    .replace(/tanx/g,"tan(x)")
    .replace(/π/g,"pi")
    .replace(/√/g,"sqrt");
}

function normalize(str){
  return String(str)
    .replace(/\s/g,"")
    .replace(/\*/g,"")
    .replace(/\+C/g,"")
    .replace(/C/g,"")
    .replace(/sin\(/g,"sin")
    .replace(/cos\(/g,"cos")
    .replace(/tan\(/g,"tan")
    .replace(/\)/g,"");
}

function isCorrect(user, correct){
  user = fixInput(user);
  correct = fixInput(correct);

  try{
    let userVal = math.evaluate(user);
    let correctVal = math.evaluate(correct);
    if(typeof userVal==="number" && typeof correctVal==="number"){
      if(Math.abs(userVal-correctVal)<1e-8) return true;
    }
  }catch(e){}

  try{
    let diff = math.simplify("(" + user + ")-(" + correct + ")");
    if(diff.toString()==="0") return true;
  }catch(e){}

  try{
    if(math.simplify(user).toString() === math.simplify(correct).toString()){
      return true;
    }
  }catch(e){}

  return normalize(user) === normalize(correct);
}

function generateQuestion(){
  let type = rand(1,8);

  if(type===1){
    let a = rand(2,5);
    let b = rand(-5,5);
    let c = rand(-5,5);
    return {
      q:`∫ (${a}x²+${b}x+${c}) dx`,
      a:`${a/3}*x^3+${b/2}*x^2+${c}*x`,
      display:`${a}/3x³+${b}/2x²+${c}x+C`
    };
  }

  if(type===2){
    let a = rand(2,6);
    return {
      q:`∫ ${a}/x dx`,
      a:`${a}*log(x)`,
      display:`${a}log(x)+C`
    };
  }

  if(type===3){
    let a = rand(1,5);
    let b = rand(1,5);
    return {
      q:`∫ (${a}sin(x)+${b}cos(x)) dx`,
      a:`-${a}*cos(x)+${b}*sin(x)`,
      display:`-${a}cos(x)+${b}sin(x)+C`
    };
  }

  if(type===4){
    let a = rand(1,4);
    let b = rand(1,4);
    return {
      q:`∫ (${a}e^x+${b}x²) dx`,
      a:`${a}*exp(x)+${b/3}*x^3`,
      display:`${a}e^x+${b}/3x³+C`
    };
  }

  if(type===5){
    let A = rand(1,4);
    let B = rand(-5,5);
    let C = rand(-5,5);
    let a = rand(0,2);
    let b = rand(3,6);
    let F = (x)=> A/3*x**3 + B/2*x**2 + C*x;
    let ans = F(b)-F(a);
    return {
      q:`∫[${a}→${b}] (${A}x²+${B}x+${C}) dx`,
      a:`${ans}`,
      display:`${ans}`
    };
  }

  if(type===6){
    let a = rand(1,4);
    let n = rand(2,4);
    return {
      q:`∫ ${a}x(x²+1)^${n} dx`,
      a:`${a/(2*(n+1))}*(x^2+1)^${n+1}`,
      display:`${a}/${2*(n+1)}(x²+1)^${n+1}+C`
    };
  }

  if(type===7){
    let a = rand(1,5);
    return {
      q:`∫ ${a}x e^x dx`,
      a:`${a}*(x-1)*exp(x)`,
      display:`${a}(x-1)e^x+C`
    };
  }

  let a = rand(1,4);
  return {
    q:`∫[0→pi] ${a}sin(x) dx`,
    a:`${2*a}`,
    display:`${2*a}`
  };
}

function start(){
  clearInterval(timer);
  enemyHP = 10;
  playerHP = 5;
  history = [];

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
      history.push({question:current.q,your:"時間切れ",answer:current.display,ok:false});
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
  let ok = isCorrect(u, current.a);

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
    samurai.classList.add("samuraiAttack");

    setTimeout(()=>{
      enemy.classList.remove("enemyHit");
      slash.classList.remove("showSlash");
      samurai.classList.remove("samuraiAttack");
    },500);

    document.getElementById("se_correct").play();
    document.getElementById("result").innerText =
      "○ 攻撃成功！ 正解: " + current.display;

  }else{
    playerHP--;

    let samurai = document.getElementById("samurai");

    document.body.classList.add("playerHit");
    samurai.classList.add("samuraiDamage");

    setTimeout(()=>{
      document.body.classList.remove("playerHit");
      samurai.classList.remove("samuraiDamage");
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
  document.getElementById("enemyBar").style.width = (enemyHP/10*100) + "%";
  document.getElementById("playerBar").style.width = (playerHP/5*100) + "%";
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
  },800);
}

function showEnd(text){
  clearInterval(timer);
  document.getElementById("q").innerText = text;
  document.getElementById("timer").innerText = "";
  document.getElementById("ans").value = "";

  let html = `<button onclick="start()">もう一回</button>`;
  html += `<h2>解いた問題一覧</h2>`;

  for(let i=0;i<history.length;i++){
    let mark = history[i].ok ? "○" : "×";
    html += `
      <div style="background:rgba(255,255,255,0.12);margin:10px auto;padding:10px;border-radius:10px;width:90%;text-align:left;font-size:18px;">
        <p>${i+1}. ${mark} 問題: ${history[i].question}</p>
        <p>あなたの答え: ${history[i].your}</p>
        <p>正解: ${history[i].answer}</p>
      </div>
    `;
  }

  document.getElementById("result").innerHTML = html;
}