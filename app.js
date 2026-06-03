let enemyHP = 10;
let playerHP = 5;
let time = 300;
let timer;
let current;

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
      a:`${a/(n+1)}*x^${n+1}`
    };
  }

  if(type===2){
    let a = rand(1,5);

    return {
      q:`∫ ${a}sin(x) dx`,
      a:`-${a}*cos(x)`
    };
  }

  if(type===3){
    let a = rand(1,5);

    return {
      q:`∫ ${a}e^x dx`,
      a:`${a}*exp(x)`
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
      a:`${ans}`
    };
  }

  if(type===5){
    let a = rand(-10,10);
    let b = rand(-10,10);
    if(b === 0) b = 1;

    let op = rand(1,4);

    if(op===1) return {q:`${a}+${b}`, a:`${a+b}`};
    if(op===2) return {q:`${a}-${b}`, a:`${a-b}`};
    if(op===3) return {q:`${a}×${b}`, a:`${a*b}`};
    return {q:`${a}÷${b}`, a:`${a/b}`};
  }

  let v1 = 1/2;
  let v2 = 1/3;
  let op = rand(1,4);

  if(op===1) return {q:"(∫x dx)+(∫x^2 dx)", a:`${v1+v2}`};
  if(op===2) return {q:"(∫x dx)-(∫x^2 dx)", a:`${v1-v2}`};
  if(op===3) return {q:"(∫x dx)×(∫x^2 dx)", a:`${v1*v2}`};
  return {q:"(∫x dx)÷(∫x^2 dx)", a:`${v1/v2}`};
}

function start(){
  document.getElementById("bgm").volume = 0.2;
  document.getElementById("bgm").play();

  enemyHP = 10;
  playerHP = 5;

  document.getElementById("result").innerText = "";

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

  if(ok){
    enemyHP--;

    let enemy = document.getElementById("enemy");
    let slash = document.getElementById("slash");

    enemy.classList.add("enemyHit");
    slash.innerText = "⚔️";
    slash.classList.add("showSlash");

    setTimeout(()=>{
      enemy.classList.remove("enemyHit");
      slash.classList.remove("showSlash");
    },500);

    document.getElementById("se_correct").play();
    document.getElementById("result").innerText = "○ 攻撃成功！";

  }else{
    playerHP--;

    document.body.classList.add("playerHit");

    setTimeout(()=>{
      document.body.classList.remove("playerHit");
    },400);

    document.getElementById("se_wrong").play();
    document.getElementById("result").innerText = "× ダメージ！";
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
    document.body.innerHTML = "<h1>勝利！</h1>";
    return;
  }

  if(playerHP<=0){
    document.body.innerHTML = "<h1>敗北...</h1>";
    return;
  }

  nextQ();
  startTimer();
}