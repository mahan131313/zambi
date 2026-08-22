const canvas =
  document.getElementById("game");

const ctx =
  canvas.getContext("2d");


/* -------------------------
   رابط‌ها
------------------------- */

const healthEl =
  document.getElementById("health");

const ammoEl =
  document.getElementById("ammo");

const scoreEl =
  document.getElementById("score");

const waveEl =
  document.getElementById("wave");

const message =
  document.getElementById("message");

const messageTitle =
  document.getElementById("messageTitle");

const messageText =
  document.getElementById("messageText");

const startBtn =
  document.getElementById("startBtn");

const fireBtn =
  document.getElementById("fireBtn");


/* -------------------------
   تنظیمات
------------------------- */

const W = canvas.width;
const H = canvas.height;

let running = false;

let player;

let bullets = [];

let zombies = [];

let particles = [];

let score = 0;

let ammo = 30;

let health = 100;

let wave = 1;

let zombiesToSpawn = 0;

let spawnTimer = 0;

let lastTime = 0;

let mouse = {
  x: W / 2,
  y: H / 2,

  down: false
};


const keys = {};


/* -------------------------
   شروع بازی
------------------------- */

function startGame() {

  running = true;

  score = 0;

  ammo = 30;

  health = 100;

  wave = 1;

  bullets = [];

  zombies = [];

  particles = [];

  player = {

    x: W / 2,

    y: H / 2,

    radius: 18,

    speed: 260,

    angle: 0,

    fireCooldown: 0
  };


  zombiesToSpawn = 8;

  spawnTimer = 0;

  message.classList.add("hidden");

  updateHUD();

  lastTime = performance.now();

  requestAnimationFrame(gameLoop);
}


/* -------------------------
   پایان بازی
------------------------- */

function gameOver() {

  running = false;

  messageTitle.textContent =
    "💀 بازی تمام شد";

  messageText.textContent =
    `امتیاز شما: ${score} | موج: ${wave}`;

  startBtn.textContent =
    "🔄 دوباره بازی کن";

  message.classList.remove("hidden");
}


/* -------------------------
   HUD
------------------------- */

function updateHUD() {

  healthEl.textContent =
    Math.max(0, Math.floor(health));

  ammoEl.textContent =
    ammo;

  scoreEl.textContent =
    score;

  waveEl.textContent =
    wave;
}


/* -------------------------
   ساخت زامبی
------------------------- */

function spawnZombie() {

  let x;
  let y;

  const side =
    Math.floor(Math.random() * 4);


  if (side === 0) {

    x = Math.random() * W;
    y = -40;

  } else if (side === 1) {

    x = W + 40;
    y = Math.random() * H;

  } else if (side === 2) {

    x = Math.random() * W;
    y = H + 40;

  } else {

    x = -40;
    y = Math.random() * H;
  }


  const boss =
    Math.random() < 0.08 &&
    wave >= 3;


  zombies.push({

    x,
    y,

    radius:
      boss ? 30 : 17,

    speed:
      boss
        ? 45 + wave * 3
        : 55 + wave * 4,

    health:
      boss
        ? 10 + wave * 2
        : 2 + Math.floor(wave / 3),

    maxHealth:
      boss
        ? 10 + wave * 2
        : 2 + Math.floor(wave / 3),

    damage:
      boss ? 25 : 8,

    boss,

    hitFlash: 0
  });
}


/* -------------------------
   شلیک
------------------------- */

function shoot() {

  if (!running) return;

  if (ammo <= 0) return;

  if (player.fireCooldown > 0) return;


  const angle =
    Math.atan2(
      mouse.y - player.y,
      mouse.x - player.x
    );


  player.angle = angle;


  bullets.push({

    x:
      player.x +
      Math.cos(angle) * 25,

    y:
      player.y +
      Math.sin(angle) * 25,

    vx:
      Math.cos(angle) * 650,

    vy:
      Math.sin(angle) * 650,

    radius: 5,

    life: 1
  });


  ammo--;

  player.fireCooldown = 0.18;

  updateHUD();
}


/* -------------------------
   انفجار کوچک
------------------------- */

function createParticles(
  x,
  y,
  amount = 8
) {

  for (
    let i = 0;
    i < amount;
    i++
  ) {

    const angle =
      Math.random() *
      Math.PI * 2;

    const speed =
      50 +
      Math.random() * 140;


    particles.push({

      x,
      y,

      vx:
        Math.cos(angle) * speed,

      vy:
        Math.sin(angle) * speed,

      life:
        .4 +
        Math.random() * .5,

      size:
        2 +
        Math.random() * 4
    });
  }
}


/* -------------------------
   آپدیت بازی
------------------------- */

function update(dt) {

  if (!player) return;


  /* حرکت بازیکن */

  let dx = 0;
  let dy = 0;


  if (
    keys["w"] ||
    keys["arrowup"]
  ) {
    dy--;
  }


  if (
    keys["s"] ||
    keys["arrowdown"]
  ) {
    dy++;
  }


  if (
    keys["a"] ||
    keys["arrowleft"]
  ) {
    dx--;
  }


  if (
    keys["d"] ||
    keys["arrowright"]
  ) {
    dx++;
  }


  if (dx || dy) {

    const length =
      Math.hypot(dx, dy);

    dx /= length;
    dy /= length;


    player.x +=
      dx *
      player.speed *
      dt;

    player.y +=
      dy *
      player.speed *
      dt;
  }


  /* محدود کردن بازیکن */

  player.x =
    Math.max(
      player.radius,
      Math.min(
        W - player.radius,
        player.x
      )
    );


  player.y =
    Math.max(
      player.radius,
      Math.min(
        H - player.radius,
        player.y
      )
    );


  /* هدف */

  player.angle =
    Math.atan2(
      mouse.y - player.y,
      mouse.x - player.x
    );


  /* شلیک با موس */

  if (
    mouse.down &&
    player.fireCooldown <= 0
  ) {

    shoot();
  }


  player.fireCooldown -= dt;


  /* زامبی‌ها */

  for (
    let i = zombies.length - 1;
    i >= 0;
    i--
  ) {

    const z =
      zombies[i];


    const angle =
      Math.atan2(
        player.y - z.y,
        player.x - z.x
      );


    z.x +=
      Math.cos(angle) *
      z.speed *
      dt;

    z.y +=
      Math.sin(angle) *
      z.speed *
      dt;


    z.hitFlash -= dt;


    const distance =
      Math.hypot(
        player.x - z.x,
        player.y - z.y
      );


    /* برخورد زامبی با بازیکن */

    if (
      distance <
      player.radius +
      z.radius
    ) {

      health -=
        z.damage * dt;

      createParticles(
        player.x,
        player.y,
        1
      );


      if (health <= 0) {

        health = 0;

        updateHUD();

        gameOver();

        return;
      }
    }
  }


  /* گلوله‌ها */

  for (
    let i = bullets.length - 1;
    i >= 0;
    i--
  ) {

    const b =
      bullets[i];


    b.x +=
      b.vx * dt;

    b.y +=
      b.vy * dt;

    b.life -= dt;


    let removeBullet =
      b.life <= 0 ||
      b.x < -30 ||
      b.x > W + 30 ||
      b.y < -30 ||
      b.y > H + 30;


    /* برخورد گلوله با زامبی */

    for (
      let j = zombies.length - 1;
      j >= 0;
      j--
    ) {

      const z =
        zombies[j];


      const distance =
        Math.hypot(
          b.x - z.x,
          b.y - z.y
        );


      if (
        distance <
        b.radius +
        z.radius
      ) {

        z.health--;

        z.hitFlash = .1;

        removeBullet = true;


        createParticles(
          b.x,
          b.y,
          5
        );


        if (z.health <= 0) {

          score +=
            z.boss
              ? 100
              : 10;


          createParticles(
            z.x,
            z.y,
            z.boss ? 25 : 12
          );


          zombies.splice(
            j,
            1
          );
        }


        break;
      }
    }


    if (removeBullet) {

      bullets.splice(
        i,
        1
      );
    }
  }


  /* ذرات */

  for (
    let i = particles.length - 1;
    i >= 0;
    i--
  ) {

    const p =
      particles[i];


    p.x +=
      p.vx * dt;

    p.y +=
      p.vy * dt;

    p.life -= dt;

    p.vx *= .96;
    p.vy *= .96;


    if (p.life <= 0) {

      particles.splice(
        i,
        1
      );
    }
  }


  /* تولید زامبی */

  if (
    zombiesToSpawn > 0
  ) {

    spawnTimer -= dt;


    if (spawnTimer <= 0) {

      spawnZombie();

      zombiesToSpawn--;

      spawnTimer =
        Math.max(
          .25,
          .9 - wave * .04
        );
    }

  } else if (
    zombies.length === 0
  ) {

    wave++;

    zombiesToSpawn =
      7 + wave * 3;

    ammo += 15;

    health =
      Math.min(
        100,
        health + 15
      );

    updateHUD();
  }


  updateHUD();
}


/* -------------------------
   رسم پس‌زمینه
------------------------- */

function drawBackground() {

  ctx.fillStyle =
    "#10161d";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /* شبکه */

  ctx.strokeStyle =
    "#ffffff08";

  ctx.lineWidth = 1;


  const grid = 40;


  for (
    let x = 0;
    x < W;
    x += grid
  ) {

    ctx.beginPath();

    ctx.moveTo(x, 0);

    ctx.lineTo(x, H);

    ctx.stroke();
  }


  for (
    let y = 0;
    y < H;
    y += grid
  ) {

    ctx.beginPath();

    ctx.moveTo(0, y);

    ctx.lineTo(W, y);

    ctx.stroke();
  }


  /* نقاط محیط */

  ctx.fillStyle =
    "#26313d";


  for (
    let i = 0;
    i < 35;
    i++
  ) {

    const x =
      (i * 173) % W;

    const y =
      (i * 97) % H;


    ctx.fillRect(
      x,
      y,
      4,
      4
    );
  }
}


/* -------------------------
   رسم بازیکن
------------------------- */

function drawPlayer() {

  ctx.save();

  ctx.translate(
    player.x,
    player.y
  );

  ctx.rotate(
    player.angle
  );


  /* اسلحه */

  ctx.fillStyle =
    "#8d99a6";

  ctx.fillRect(
    5,
    -5,
    30,
    10
  );


  ctx.fillStyle =
    "#cfd8dc";

  ctx.fillRect(
    25,
    -3,
    14,
    6
  );


  /* بدن */

  ctx.fillStyle =
    "#42a5f5";

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    player.radius,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* سر */

  ctx.fillStyle =
    "#ffccbc";

  ctx.beginPath();

  ctx.arc(
    5,
    -5,
    10,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* چشم */

  ctx.fillStyle =
    "#263238";

  ctx.beginPath();

  ctx.arc(
    9,
    -8,
    2,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.restore();
}


/* -------------------------
   رسم زامبی
------------------------- */

function drawZombie(z) {

  ctx.save();

  ctx.translate(
    z.x,
    z.y
  );


  /* سایه */

  ctx.fillStyle =
    "#00000040";

  ctx.beginPath();

  ctx.ellipse(
    0,
    z.radius * .8,
    z.radius,
    z.radius * .35,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* بدن */

  ctx.fillStyle =
    z.hitFlash > 0
      ? "#ffffff"
      : z.boss
        ? "#7b1fa2"
        : "#43a047";


  ctx.beginPath();

  ctx.arc(
    0,
    0,
    z.radius,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* چشم‌ها */

  ctx.fillStyle =
    "#ffeb3b";


  ctx.beginPath();

  ctx.arc(
    -6,
    -5,
    4,
    0,
    Math.PI * 2
  );

  ctx.arc(
    6,
    -5,
    4,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* دهان */

  ctx.strokeStyle =
    "#263238";

  ctx.lineWidth = 3;

  ctx.beginPath();

  ctx.arc(
    0,
    4,
    8,
    0,
    Math.PI
  );

  ctx.stroke();


  /* نوار جان */

  const barWidth =
    z.radius * 2;


  ctx.fillStyle =
    "#00000080";

  ctx.fillRect(
    -barWidth / 2,
    -z.radius - 10,
    barWidth,
    5
  );


  ctx.fillStyle =
    "#ef5350";

  ctx.fillRect(
    -barWidth / 2,
    -z.radius - 10,
    barWidth *
      (z.health / z.maxHealth),
    5
  );


  if (z.boss) {

    ctx.font =
      "16px sans-serif";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "👹",
      0,
      -z.radius - 16
    );
  }


  ctx.restore();
}


/* -------------------------
   رسم گلوله
------------------------- */

function drawBullet(b) {

  ctx.fillStyle =
    "#ffd54f";

  ctx.shadowColor =
    "#ff9800";

  ctx.shadowBlur = 10;


  ctx.beginPath();

  ctx.arc(
    b.x,
    b.y,
    b.radius,
    0,
    Math.PI * 2
  );

  ctx.fill();


  ctx.shadowBlur = 0;
}


/* -------------------------
   رسم ذرات
------------------------- */

function drawParticles() {

  for (
    const p of particles
  ) {

    ctx.globalAlpha =
      Math.max(
        0,
        p.life
      );


    ctx.fillStyle =
      "#ff7043";


    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      p.size,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  ctx.globalAlpha = 1;
}


/* -------------------------
   رسم همه چیز
------------------------- */

function draw() {

  drawBackground();


  for (
    const b of bullets
  ) {

    drawBullet(b);
  }


  for (
    const z of zombies
  ) {

    drawZombie(z);
  }


  drawPlayer();

  drawParticles();
}


/* -------------------------
   حلقه بازی
------------------------- */

function gameLoop(time) {

  if (!running) return;


  let dt =
    (time - lastTime) / 1000;


  dt =
    Math.min(
      dt,
      .05
    );


  lastTime = time;


  update(dt);

  draw();


  requestAnimationFrame(
    gameLoop
  );
}


/* -------------------------
   موس
------------------------- */

canvas.addEventListener(
  "pointermove",
  e => {

    const rect =
      canvas.getBoundingClientRect();


    mouse.x =
      (e.clientX - rect.left) *
      (W / rect.width);


    mouse.y =
      (e.clientY - rect.top) *
      (H / rect.height);
  }
);


canvas.addEventListener(
  "pointerdown",
  e => {

    if (
      e.pointerType === "mouse"
    ) {

      mouse.down = true;

      shoot();
    }
  }
);


window.addEventListener(
  "pointerup",
  e => {

    if (
      e.pointerType === "mouse"
    ) {

      mouse.down = false;
    }
  }
);


/* -------------------------
   کیبورد
------------------------- */

document.addEventListener(
  "keydown",
  e => {

    keys[
      e.key.toLowerCase()
    ] = true;


    if (
      e.key.startsWith("Arrow") ||
      e.key === " "
    ) {

      e.preventDefault();
    }


    if (
      e.key === " " &&
      running
    ) {

      shoot();
    }
  }
);


document.addEventListener(
  "keyup",
  e => {

    keys[
      e.key.toLowerCase()
    ] = false;
  }
);


/* -------------------------
   کنترل موبایل
------------------------- */

const mobileDirections = {

  up: ["w", "arrowup"],

  down: ["s", "arrowdown"],

  left: ["a", "arrowleft"],

  right: ["d", "arrowright"]

};


document
  .querySelectorAll(
    "[data-key]"
  )
  .forEach(btn => {

    const key =
      btn.dataset.key;


    btn.addEventListener(
      "pointerdown",
      e => {

        e.preventDefault();

        const keysToUse =
          mobileDirections[key];


        if (!keysToUse) return;


        keysToUse.forEach(
          k => {
            keys[k] = true;
          }
        );
      }
    );


    btn.addEventListener(
      "pointerup",
      e => {

        e.preventDefault();

        const keysToUse =
          mobileDirections[key];


        keysToUse.forEach(
          k => {
            keys[k] = false;
          }
        );
      }
    );


    btn.addEventListener(
      "pointercancel",
      () => {

        const keysToUse =
          mobileDirections[key];


        keysToUse.forEach(
          k => {
            keys[k] = false;
          }
        );
      }
    );

  });


/* -------------------------
   شلیک موبایل
------------------------- */

fireBtn.addEventListener(
  "pointerdown",
  e => {

    e.preventDefault();

    if (!running) return;

    mouse.down = true;

    shoot();
  }
);


fireBtn.addEventListener(
  "pointerup",
  e => {

    e.preventDefault();

    mouse.down = false;
  }
);


fireBtn.addEventListener(
  "pointercancel",
  () => {

    mouse.down = false;
  }
);


/* -------------------------
   دکمه شروع
------------------------- */

startBtn.addEventListener(
  "click",
  startGame
);


/* -------------------------
   جلوگیری از اسکرول موبایل
------------------------- */

document.addEventListener(
  "touchmove",
  e => {

    if (
      e.target.closest(
        ".mobile-controls"
      ) ||
      e.target === canvas
    ) {

      e.preventDefault();
    }

  },
  {
    passive: false
  }
);


/* -------------------------
   نمایش اولیه
------------------------- */

ctx.fillStyle =
  "#10161d";

ctx.fillRect(
  0,
  0,
  W,
  H
);
