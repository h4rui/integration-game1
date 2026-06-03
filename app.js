let enemyHP = 10;
let playerHP = 5;
let time = 300;
let timer;
let current;
let history = [];
let usedQuestions = [];
let mode = "integral";
let score = 0;

let playerProfile = {
  name: "名無し",
  icon: ""
};

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

function qPower(p){
  if(p === 1) return "x";
  if(p === 2) return "x²";
  if(p === 3) return "x³";
  if(p === 4) return "x⁴";
  if(p === 5) return "x⁵";
  if(p === 6) return "x⁶";
  return "x^" + p;
}

function xPower(p){
  if(p === 1) return "x";
  return "x^" + p;
}

function term(c,p){
  if(c === 0) return "";
  if(p === 0) return frac(c);
  return coeff(c) + xPower(p);
}

function cleanDisplay(s){
  return s
    .replace(/\+\-/g,"-")
    .replace(/\+\+/g,"+")
    .replace(/^\+/,"")
    .replace(/\+C/g,"+C");
}

function normalize(str){
  return String(str)
    .replace(/\s/g,"")
    .replace(/\*/g,"")
    .replace(/\+C/g,"")
    .replace(/C/g,"")
    .replace(/π/g,"pi")
    .replace(/²/g,"^2")
    .replace(/³/g,"^3")
    .replace(/⁴/g,"^4")
    .replace(/⁵/g,"^5")
    .replace(/⁶/g,"^6");
}

function saveProfile(){
  let name = document.getElementById("playerName").value;
  let file = document.getElementById("iconInput").files[0];

  if(name){
    playerProfile.name = name;
  }

  if(file){
    let reader = new FileReader();

    reader.onload = function(e){
      playerProfile.icon = e.target.result;
      localStorage.setItem("playerProfile", JSON.stringify(playerProfile));
      document.getElementById("profileIcon").src = playerProfile.icon;
      alert("プロフィールを保存したよ");
    };

    reader.readAsDataURL(file);
  }else{
    localStorage.setItem("playerProfile", JSON.stringify(playerProfile));
    alert("プロフィールを保存したよ");
  }
}

function loadProfile(){
  let saved = localStorage.getItem("playerProfile");

  if(saved){
    playerProfile = JSON.parse(saved);
    document.getElementById("playerName").value = playerProfile.name;

    if(playerProfile.icon){
      document.getElementById("profileIcon").src = playerProfile.icon;
    }
  }
}

window.addEventListener("load", loadProfile);

function selectMode(m){
  mode = m;

  document.getElementById("titleScreen").classList.remove("active");
  document.getElementById("gameScreen").classList.add("active");

  let title = "⚔️ 積分バトル ⚔️";
  if(mode === "derivative") title = "⚔️ 微分バトル ⚔️";
  if(mode === "factor") title = "⚔️ 因数分解バトル ⚔️";
  if(mode === "expand") title = "⚔️ 展開バトル ⚔️";
  if(mode === "random") title = "⚔️ ランダム問題 ⚔️";

  document.getElementById("modeTitle").innerText = title;
  start();
}

function backTitle(){
  clearInterval(timer);
  document.getElementById("gameScreen").classList.remove("active");
  document.getElementById("titleScreen").classList.add("active");
  document.getElementById("bgm").pause();
}

function generateQuestion(){
  if(mode === "integral") return generateIntegral();
  if(mode === "derivative") return generateDerivative();
  if(mode === "factor") return generateFactor();
  if(mode === "expand") return generateExpand();

  if(mode === "random"){
    let r = rand(1,4);
    if(r === 1) return generateIntegral();
    if(r === 2) return generateDerivative();
    if(r === 3) return generateFactor();
    if(r === 4) return generateExpand();
  }
}

function generateIntegral(){
  let type = rand(1,8);

  if(type===1){
    let a = rand(-6,6);
    if(a===0) a = 1;
    let n = rand(1,5);
    let ans = a/(n+1);

    return{
      q:`∫ ${coeff(a)}${qPower(n)} dx`,
      a:`${ans}*x^${n+1}`,
      display:`${term(ans,n+1)}+C`
    };
  }

  if(type===2){
    let a = rand(-5,5);
    let b = rand(-5,5);
    let c = rand(-5,5);
    if(a===0 && b===0 && c===0) a = 1;

    let display = cleanDisplay(
      `${term(a/3,3)}+${term(b/2,2)}+${term(c,1)}+C`
    );

    return{
      q:`∫ (${coeff(a)}x²${b>=0?"+":""}${coeff(b)}x${c>=0?"+":""}${c}) dx`,
      a:`${a/3}*x^3+${b/2}*x^2+${c}*x`,
      display:display
    };
  }

  if(type===3){
    let l = rand(0,3);
    let r = rand(l+1,l+5);
    let a = rand(1,5);
    let n = rand(1,4);
    let ans = (a/(n+1))*(Math.pow(r,n+1)-Math.pow(l,n+1));

    return{
      q:`∫[${l}→${r}] ${coeff(a)}${qPower(n)} dx`,
      a:`${ans}`,
      display:frac(ans)
    };
  }

  if(type===4){
    let l = rand(0,2);
    let r = rand(l+1,l+4);
    let a = rand(-4,4);
    let b = rand(-4,4);
    let c = rand(-4,4);
    if(a===0 && b===0 && c===0) a = 1;

    let ans =
      (a/3)*(Math.pow(r,3)-Math.pow(l,3))+
      (b/2)*(Math.pow(r,2)-Math.pow(l,2))+
      c*(r-l);

    return{
      q:`∫[${l}→${r}] (${coeff(a)}x²${b>=0?"+":""}${coeff(b)}x${c>=0?"+":""}${c}) dx`,
      a:`${ans}`,
      display:frac(ans)
    };
  }

  if(type===5){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`∫ ${coeff(a)}sin(${k===1?"x":k+"x"}) dx`,
      a:`-${a}*cos(${k}*x)/${k}`,
      display:`-${frac(a/k)}cos(${k===1?"x":k+"x"})+C`
    };
  }

  if(type===6){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`∫ ${coeff(a)}cos(${k===1?"x":k+"x"}) dx`,
      a:`${a}*sin(${k}*x)/${k}`,
      display:`${frac(a/k)}sin(${k===1?"x":k+"x"})+C`
    };
  }

  if(type===7){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`∫ ${coeff(a)}e^(${k===1?"x":k+"x"}) dx`,
      a:`${a}*exp(${k}*x)/${k}`,
      display:`${frac(a/k)}e^(${k===1?"x":k+"x"})+C`
    };
  }

  if(type===8){
    let a = rand(1,5);
    let b = rand(-5,5);
    let n = rand(2,4);
    let bottom = a*(n+1);

    return{
      q:`∫ (${a}x${b>=0?"+":""}${b})${n===2?"²":n===3?"³":"⁴"} dx`,
      a:`(${a}*x+${b})^${n+1}/${bottom}`,
      display:`(${a}x${b>=0?"+":""}${b})^${n+1}/${bottom}+C`
    };
  }
}

function generateDerivative(){
  let type = rand(1,12);

  if(type===1){
    let a = rand(-6,6);
    if(a===0) a = 1;
    let n = rand(2,7);
    let ansC = a*n;

    return{
      q:`d/dx ${coeff(a)}${qPower(n)}`,
      a:`${ansC}*x^${n-1}`,
      display:`${term(ansC,n-1)}`
    };
  }

  if(type===2){
    let a = rand(-5,5);
    let b = rand(-5,5);
    let c = rand(-5,5);
    if(a===0 && b===0) a = 1;

    let display = cleanDisplay(`${term(3*a,2)}+${term(2*b,1)}+${c}`);

    return{
      q:`d/dx (${coeff(a)}x³${b>=0?"+":""}${coeff(b)}x²${c>=0?"+":""}${c}x)`,
      a:`${3*a}*x^2+${2*b}*x+${c}`,
      display:display
    };
  }

  if(type===3){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`d/dx ${coeff(a)}sin(${k===1?"x":k+"x"})`,
      a:`${a*k}*cos(${k}*x)`,
      display:`${coeff(a*k)}cos(${k===1?"x":k+"x"})`
    };
  }

  if(type===4){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`d/dx ${coeff(a)}cos(${k===1?"x":k+"x"})`,
      a:`-${a*k}*sin(${k}*x)`,
      display:`-${coeff(a*k)}sin(${k===1?"x":k+"x"})`
    };
  }

  if(type===5){
    let a = rand(1,6);
    let k = rand(1,4);

    return{
      q:`d/dx ${coeff(a)}e^(${k===1?"x":k+"x"})`,
      a:`${a*k}*exp(${k}*x)`,
      display:`${coeff(a*k)}e^(${k===1?"x":k+"x"})`
    };
  }

  if(type===6){
    let a = rand(2,5);
    let b = rand(-5,5);
    let n = rand(2,4);

    return{
      q:`d/dx (${a}x${b>=0?"+":""}${b})${n===2?"²":n===3?"³":"⁴"}`,
      a:`${n*a}*(${a}*x+${b})^${n-1}`,
      display:`${n*a}(${a}x${b>=0?"+":""}${b})^${n-1}`
    };
  }

  if(type===7){
    return{
      q:`d/dx (x+1)(x-1)`,
      a:`2*x`,
      display:`2x`
    };
  }

  if(type===8){
    let a = rand(1,5);
    let b = rand(1,5);

    return{
      q:`d/dx (x+${a})(x+${b})`,
      a:`2*x+${a+b}`,
      display:`2x+${a+b}`
    };
  }

  if(type===9){
    return{
      q:`d/dx √x`,
      a:`1/(2*sqrt(x))`,
      display:`1/(2√x)`
    };
  }

  if(type===10){
    return{
      q:`d/dx 1/x`,
      a:`-1/x^2`,
      display:`-1/x^2`
    };
  }

  if(type===11){
    let a = rand(1,5);

    return{
      q:`d/dx (${a}x²+1)/2`,
      a:`${a}*x`,
      display:`${coeff(a)}x`
    };
  }

  if(type===12){
    let a = rand(1,5);

    return{
      q:`d/dx ${a}x^(3/2)`,
      a:`${a*3/2}*sqrt(x)`,
      display:`${frac(a*3/2)}√x`
    };
  }
}

function generateFactor(){
  let type = rand(1,4);

  if(type===1){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`x²+${a+b}x+${a*b} を因数分解`,
      a:`(x+${a})*(x+${b})`,
      display:`(x+${a})(x+${b})`
    };
  }

  if(type===2){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`x²-${a+b}x+${a*b} を因数分解`,
      a:`(x-${a})*(x-${b})`,
      display:`(x-${a})(x-${b})`
    };
  }

  if(type===3){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`x²+${b-a}x-${a*b} を因数分解`,
      a:`(x-${a})*(x+${b})`,
      display:`(x-${a})(x+${b})`
    };
  }

  if(type===4){
    let a = rand(2,9);

    return{
      q:`x²-${a*a} を因数分解`,
      a:`(x-${a})*(x+${a})`,
      display:`(x-${a})(x+${a})`
    };
  }
}

function generateExpand(){
  let type = rand(1,4);

  if(type===1){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`(x+${a})(x+${b}) を展開`,
      a:`x^2+${a+b}*x+${a*b}`,
      display:`x^2+${a+b}x+${a*b}`
    };
  }

  if(type===2){
    let a = rand(1,8);
    let b = rand(1,8);

    return{
      q:`(x-${a})(x-${b}) を展開`,
      a:`x^2-${a+b}*x+${a*b}`,
      display:`x^2-${a+b}x+${a*b}`
    };
  }

  if(type===3){
    let a = rand(1,8);

    return{
      q:`(x+${a})² を展開`,
      a:`x^2+${2*a}*x+${a*a}`,
      display:`x^2+${2*a}x+${a*a}`
    };
  }

  if(type===4){
    let a = rand(1,8);

    return{
      q:`(x-${a})² を展開`,
      a:`x^2-${2*a}*x+${a*a}`,
      display:`x^2-${2*a}x+${a*a}`
    };
  }
}

function expressionsEqual(user, correct){
  try{
    let u = normalize(user);
    let c = normalize(correct);

    let values = [-3,-2,-1,0,1,2,3,4];

    for(let x of values){
      let uv = math.evaluate(u,{x:x});
      let cv = math.evaluate(c,{x:x});

      if(Math.abs(uv-cv)>1e-8){
        return false;
      }
    }

    return true;
  }catch(e){
    return false;
  }
}

function start(){
  clearInterval(timer);

  enemyHP = 10;
  playerHP = 5;
  history = [];
  usedQuestions = [];
  score = 0;

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

      if(mode === "random"){
        finishRandom();
        return;
      }

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
    ok = expressionsEqual(u,current.a);
  }

  if(!ok){
    ok = normalize(u) === normalize(current.display);
  }

  history.push({
    question:current.q,
    your:u || "未入力",
    answer:current.display,
    ok:ok
  });

  if(ok){
    score++;
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
    if(mode === "random"){
      finishRandom();
      return;
    }

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

async function finishRandom(){
  clearInterval(timer);

  document.getElementById("result").innerText =
    "記録送信中...";

  try{
    await saveWorldScore({
      name:playerProfile.name,
      icon:playerProfile.icon,
      score:score,
      mode:"random"
    });
  }catch(e){
    console.log(e);
  }

  showEnd("終了！");
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

  if(mode !== "random"){
    if(enemyHP<=0){
      showEnd("勝利！");
      return;
    }

    if(playerHP<=0){
      showEnd("敗北...");
      return;
    }
  }

  setTimeout(()=>{
    nextQ();
    startTimer();
  },900);
}

async function showEnd(text){
  clearInterval(timer);

  document.getElementById("q").innerText = text;
  document.getElementById("timer").innerText = "";
  document.getElementById("ans").value = "";

  let html = `<button onclick="start()">もう一回</button>`;
  html += `<button onclick="backTitle()">タイトルへ</button>`;

  if(mode === "random"){
    html += `<h2>スコア：${score}問</h2>`;
    html += `<h2>週間世界ランキング</h2>`;

    try{
      let ranking = await loadWorldRanking();

      for(let i=0; i<ranking.length; i++){
        html += `
          <div class="rankItem">
            ${i+1}位
            ${ranking[i].icon ? `<img class="rankIcon" src="${ranking[i].icon}">` : ""}
            ${ranking[i].admin ? "👑 " : ""}
            ${ranking[i].name}：${ranking[i].score}問
          </div>
        `;
      }
    }catch(e){
      html += `<p>ランキング取得に失敗</p>`;
    }
  }

  html += `<h2>解いた問題一覧</h2>`;

  for(let i=0; i<history.length; i++){
    let mark = history[i].ok ? "○" : "×";

    html += `
      <div class="rankItem">
        <p>${i+1}. ${mark} 問題: ${history[i].question}</p>
        <p>あなたの答え: ${history[i].your}</p>
        <p>正解: ${history[i].answer}</p>
      </div>
    `;
  }

  document.getElementById("result").innerHTML = html;
}

async function showWorldRanking(){
  let box = document.getElementById("titleRanking");
  box.innerHTML = "<h2>読み込み中...</h2>";

  try{
    let ranking = await loadWorldRanking();

    let html = "<h2>週間世界ランキング</h2>";

    for(let i=0; i<ranking.length; i++){
      html += `
        <div class="rankItem">
          ${i+1}位
          ${ranking[i].icon ? `<img class="rankIcon" src="${ranking[i].icon}">` : ""}
          ${ranking[i].admin ? "👑 " : ""}
          ${ranking[i].name}：${ranking[i].score}問
        </div>
      `;
    }

    box.innerHTML = html;
  }catch(e){
    box.innerHTML = "<p>ランキングを読み込めませんでした</p>";
  }
}