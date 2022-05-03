const gameArea = document.querySelector('#game-area');
const marioElem = document.querySelector('#mario-sprites');
const scoreElem = document.querySelector('#score');
const startScreen = document.querySelector('#start-screen');
const gameoverScreen = document.querySelector('#gameover-screen');
const scoreTag = document.querySelector('#score-tag');

const enemySprites = [
  'imgs/KoopaBlueL.gif', 
  'imgs/KoopaGreenL.gif', 
  'imgs/KoopaRedL.gif', 
  'imgs/KoopaYellowL.gif'];

const livesContainer = [
  document.querySelector('#life-1'), 
  document.querySelector('#life-2'),
  document.querySelector('#life-3')
];

const sndPath = [
  "sounds/smw_coin.wav",
  "sounds/smw_fireball.wav",
  "sounds/smw_hit_while_flying.wav",
  "sounds/smw_jump.wav",
  "sounds/smw_lost_a_life.wav",
  "sounds/smw_pause.wav",
]

let sounds = [];
let lastTime;
let score;
let lives;

sndPath.forEach((path) => {
  const audio = new Audio(path);
  sounds.push(audio);
});

window.addEventListener("keydown", (e) => {
  if (e.key === 'Enter') {
    startScreen.classList.add('hide');
    sounds[5].play();
    startGame();
  }
}, { once: true });

function update(time) { 
  if (lastTime == null) {
    lastTime = time;
    window.requestAnimationFrame(update);
    return;
  }
  
  const delta = time - lastTime;
  
  updateGround(delta);
  updateMario(delta);
  updateGroundEnemy(delta);
  updateAirEnemy(delta);
  updateFireball(delta);
  updateCoin(delta);
  updateScore(delta);

  if (checkGameOver() || lives <= 0) return handleGameOver();
  
  lastTime = time;
  window.requestAnimationFrame(update);
}

function startGame() {
  lastTime = null;
  score = 0;
  lives = 3;

  marioElem.src = "/imgs/mario-run-sprite.gif"

  setupGround();
  setupMario();
  setupFireball();
  setupEnemy();
  setupCoin();
  setupLives();

  startScreen.classList.add('hide');
  gameoverScreen.classList.add('hide');

  window.requestAnimationFrame(update);
}



/* condições de colisão */
function checkCollision(rect1, rect2) {
  return (
    rect1.left < rect2.right &&
    rect1.top < rect2.bottom &&
    rect1.right > rect2.left &&
    rect1.bottom > rect2.top
  );
}

function checkGameOver() {
  const marioRect = getMarioRect();
  return getEnemyRects().some(rect => checkCollision(rect, marioRect));
}

function handleGameOver() {
  setMarioLose();
  setupEnemy();
  setupCoin();
  setupFireball();

  sounds[4].cloneNode(true).play();
  scoreTag.textContent = Math.floor(score);
  gameoverScreen.classList.remove('hide');

  setTimeout(() => {
    document.addEventListener("keydown", (e) => {
      if (e.key === 'Enter') {
        startScreen.classList.add('hide');
        startGame();
        sounds[5].cloneNode(true).play();
      }
    }, { once: true });
  }, 3000);
}

function updateScore(delta) {
  score += delta * 0.01; 
  scoreElem.innerText = Math.floor(score);
}

function setupLives() {
  livesContainer.forEach((life) => {
    life.classList.remove('hide');
  })
}

function loseLife() {
  if (lives <= 0) return;

  let life = lives - 1;
  livesContainer[life].classList.add('hide');
  lives -= 1;
}



/* MANIPULAÇÃO DAS PROPRIEDADES CSS */

/* pega valor da propriedade */
function getCustomProperty(elem, prop) {
  return parseFloat(getComputedStyle(elem).getPropertyValue(prop)) || 0;
}

/* define valor da propriedade */
function setCustomProperty(elem, prop, value) {
  elem.style.setProperty(prop, value);
}

/* incrementa o valor da propriedade */
function incrementCustomProperty(elem, prop, inc) {
  setCustomProperty(elem, prop, getCustomProperty(elem, prop) + inc);
}



/* MOVIMENTO DO CHÃO */

const GROUND_SPEED = 0.015;
const grounds = document.querySelectorAll(".background");

function setupGround() {
  setCustomProperty(grounds[0], "--left", 0);
  setCustomProperty(grounds[1], "--left", 100);
}

function updateGround(delta) {
  grounds.forEach(ground => {
    incrementCustomProperty(ground, "--left", delta * GROUND_SPEED * -1); 

    if (getCustomProperty(ground, "--left") <= -100) {
      incrementCustomProperty(ground, "--left", 200); 
    }
  });
}



/* PULO */

const marioContainer = document.querySelector('#mario');

const JUMP_SPEED = 0.45;
const GRAVITY = 0.0020;

let isJumping;
let yVelocity;

function setupMario() {
  isJumping = false;
  yVelocity = 0;

  setCustomProperty(marioContainer, "--bottom", 10);
  document.removeEventListener("keydown", onJump); 
  document.addEventListener("keydown", onJump);
  document.addEventListener("keydown", shootFireball);
}

function updateMario(delta) {
  handleJump(delta);
}

function getMarioRect() {
  return marioElem.getBoundingClientRect(); 
}

function setMarioLose() {
  marioElem.src = "imgs/mario-death-sprite.png";
}

function handleJump(delta) {
  if (!isJumping) return;

  incrementCustomProperty(marioContainer, "--bottom", yVelocity * delta);
  marioElem.src = "/imgs/mario-jump-sprite.png";

  if (getCustomProperty(marioContainer, "--bottom") <= 10) {
    setCustomProperty(marioContainer, "--bottom", 10);
    isJumping = false;
    marioElem.src = "/imgs/mario-run-sprite.gif";
  }

  yVelocity -= GRAVITY * delta;
}

function onJump(e) {
  if (e.code !== "Space" || isJumping) return;

  e.preventDefault();
  sounds[3].cloneNode(true).play();
  yVelocity = JUMP_SPEED;
  isJumping = true;
}



/* TIRO */

const FIREBALL_SPEED = 0.03;

function setupFireball() {
  document.querySelectorAll(".fireball").forEach(fireball => {
    fireball.remove(); 
  })
}

function shootFireball(e) {
  if (e.code !== "ArrowRight") return;

  e.preventDefault();
  createFireball();
  sounds[1].cloneNode(true).play();
}

function createFireball() {
  const marioY = parseInt(getCustomProperty(marioElem, '--bottom'));
  const fireballY = marioY + 5;
  const fireball = document.createElement('img');

  fireball.src = 'imgs/fireball.gif';
  fireball.classList.add('fireball');
  setCustomProperty(fireball, "--left", 8);
  setCustomProperty(fireball, "--bottom", fireballY);

  gameArea.appendChild(fireball);
  return fireball;
}

function getFireballRect(fireball) {
  return fireball.getBoundingClientRect(); 
}

function updateFireball(delta) {

  const enemies = document.querySelectorAll('.enemy');

  document.querySelectorAll(".fireball").forEach(fireball => {
    const fireballRect = getFireballRect(fireball);

    incrementCustomProperty(fireball, "--left", delta * FIREBALL_SPEED * +1);

    enemies.forEach((enemy) => {
      const enemyRect = enemy.getBoundingClientRect();

      if (checkCollision(fireballRect, enemyRect)) {
        fireball.remove();
        enemy.remove();

        score += 20;
      }
    })
    
    if (getCustomProperty(fireball, "--left") >= 100) {
      fireball.remove(); 
    }
  })
}



/* ADICIONA INIMIGO TÉRREO */

const GROUND_ENEMY_SPEED = 0.03;
const GROUND_ENEMY_INTERVAL_MIN = 500;
const GROUND_ENEMY_INTERVAL_MAX = 2000;
const AIR_ENEMY_SPEED = 0.06;
const AIR_ENEMY_INTERVAL_MIN = 1000;
const AIR_ENEMY_INTERVAL_MAX = 3000;

let nextGroundEnemyTime;
let nextAirEnemyTime;

function setupEnemy() {
  nextGroundEnemyTime = GROUND_ENEMY_INTERVAL_MIN;
  nextAirEnemyTime = AIR_ENEMY_INTERVAL_MIN;
  document.querySelectorAll(".enemy").forEach(enemy => {
    enemy.remove(); 
  })
}

function updateGroundEnemy(delta) {
  document.querySelectorAll(".koopa").forEach(enemy => {
    incrementCustomProperty(enemy, "--left", delta * GROUND_ENEMY_SPEED * -1);
    if (getCustomProperty(enemy, "--left") <= 0) {
      enemy.remove(); 
      loseLife();
      sounds[2].cloneNode(true).play();
    }
  })

  if (nextGroundEnemyTime <= 0) {
    createGroundEnemy();
    nextGroundEnemyTime = randomizer(GROUND_ENEMY_INTERVAL_MIN, GROUND_ENEMY_INTERVAL_MAX);
  }

  nextGroundEnemyTime -= delta;
}

function updateAirEnemy(delta) {
  document.querySelectorAll(".banzai-bill").forEach(enemy => {
    incrementCustomProperty(enemy, "--left", delta * AIR_ENEMY_SPEED * -1);
    if (getCustomProperty(enemy, "--left") <= -10) {
      enemy.remove(); 
      loseLife();
      sounds[2].cloneNode(true).play();
    }
  })

  if (nextAirEnemyTime <= 0) {
    createAirEnemy();
    nextAirEnemyTime = randomizer(AIR_ENEMY_INTERVAL_MIN, AIR_ENEMY_INTERVAL_MAX);
  }

  nextAirEnemyTime -= delta;
}

function createGroundEnemy() {
  const ENEMY_SPRITE = enemySprites[Math.floor(Math.random() * enemySprites.length)];

  const enemy = document.createElement("img");
  enemy.src = ENEMY_SPRITE;
  enemy.classList.add("enemy");
  enemy.classList.add("koopa");
  setCustomProperty(enemy, "--left", 100);
  gameArea.append(enemy); 
}

function createAirEnemy() {
  const enemy = document.createElement("img");
  enemy.src = 'imgs/BanzaiBillL.png';
  enemy.classList.add("enemy");
  enemy.classList.add("banzai-bill");
  setCustomProperty(enemy, "--left", 100);
  setCustomProperty(enemy, "--bottom", randomizer(40, 65));
  gameArea.append(enemy); 
}

function getEnemyRects() {
  return [...document.querySelectorAll(".enemy")].map(enemy => {
    return enemy.getBoundingClientRect(); 
  })
}




/* ADICIONA MOEDAS */

const COIN_SPEED = 0.03;
const COIN_INTERVAL_MIN = 1000;
const COIN_INTERVAL_MAX = 3000;

let nextCoinTime;

function setupCoin() {
  nextCoinTime = COIN_INTERVAL_MIN;
  document.querySelectorAll(".coin").forEach(coin => {
    coin.remove(); 
  })
}

function updateCoin(delta) {

  const marioRect = getMarioRect();

  document.querySelectorAll(".coin").forEach(coin => {
    const coinRect = coin.getBoundingClientRect();

    incrementCustomProperty(coin, "--left", delta * COIN_SPEED * -1);

    if (checkCollision(marioRect, coinRect)) {
      score += 50;
      sounds[0].cloneNode(true).play();
      coin.remove();
    }

    if (getCustomProperty(coin, "--left") <= -100) {
      coin.remove(); 
    }
  })

  if (nextCoinTime <= 0) {
    createCoin();
    nextCoinTime = randomizer(COIN_INTERVAL_MIN, COIN_INTERVAL_MAX);
  }

  nextCoinTime -= delta;
}

function createCoin() {
  const coin = document.createElement("img");
  coin.src = "imgs/Coin.gif";
  coin.classList.add("coin");
  setCustomProperty(coin, "--left", 100);
  setCustomProperty(coin, "--bottom", randomizer(30, 75));
  gameArea.append(coin); 
}

function getCoinRects() {
  return [...document.querySelectorAll(".coin")].map(coin => {
    return coin.getBoundingClientRect(); 
  })
}

function randomizer(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min); /* escolhe um número entre o mínimo e o máximo */
}

