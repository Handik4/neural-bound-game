const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// assets
const birdImg = new Image(); birdImg.src = 'assets/js/balloon-svgrepo-com.svg';
const bgImg = new Image(); bgImg.src = 'assets/js/background.jpg';

// constants
const GRAVITY = 0.15; const JUMP = -3.5; const PIPE_SPEED = 1.3;
const PIPE_GAP = 180; const PIPE_WIDTH = 55; const PIPE_SPAWN_RATE = 140;

// state
let bird = { x: 50, y: 150, w: 45, h: 45, velocity: 0 };
let pipes = []; let score = 0; let bestScore = 0; let lives = 3;
let gameActive = false; let frameCount = 0;

function addLog(text) {
    const li = document.createElement("li");
    li.className = "log-entry";
    li.innerHTML = `> ${text}`;
    const list = document.getElementById("historyList");
    list.prepend(li);
}

function updateLivesUI() {
    let html = "";
    for (let i = 0; i < 3; i++) {
        html += i < lives ? "◆" : "<span style='color:#222'>◇</span>";
    }
    document.getElementById("livesCont").innerHTML = html;
}

function resetGame(fullReset = true) {
    bird = { x: 50, y: 150, w: 45, h: 45, velocity: 0 };
    pipes = []; frameCount = 0;
    if (fullReset) { score = 0; lives = 3; document.getElementById("scoreVal").innerText = "0"; }
    updateLivesUI();
}

document.getElementById("startBtn").onclick = (e) => {
    e.preventDefault();
    if (lives <= 0) resetGame(true); else resetGame(false);
    gameActive = true;
    document.getElementById("overlay").style.display = "none";
    addLog("Neural Link: Established");
};

function update() {
    if (!gameActive) return;
    bird.velocity += GRAVITY; bird.y += bird.velocity;
    if (bird.y + bird.h > canvas.height || bird.y < 0) gameOver();
    
    if (frameCount % PIPE_SPAWN_RATE === 0) {
        let topH = Math.floor(Math.random() * (canvas.height - PIPE_GAP - 100)) + 50;
        pipes.push({ x: canvas.width, y: topH, passed: false });
    }
    
    for (let i = pipes.length - 1; i >= 0; i--) {
        let p = pipes[i]; p.x -= PIPE_SPEED;
        if (bird.x < p.x + PIPE_WIDTH && bird.x + bird.w > p.x && (bird.y < p.y || bird.y + bird.h > p.y + PIPE_GAP)) gameOver();
        if (!p.passed && bird.x > p.x + PIPE_WIDTH) { score++; p.passed = true; document.getElementById("scoreVal").innerText = score; }
        if (p.x + PIPE_WIDTH < 0) pipes.splice(i, 1);
    }
    frameCount++;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgImg.complete) ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    
    pipes.forEach(p => {
        ctx.fillStyle = "rgba(0, 255, 242, 0.15)";
        ctx.strokeStyle = "rgba(0, 255, 242, 0.5)";
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.y);
        ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.y);
        ctx.fillRect(p.x, p.y + PIPE_GAP, PIPE_WIDTH, canvas.height);
        ctx.strokeRect(p.x, p.y + PIPE_GAP, PIPE_WIDTH, canvas.height);
    });
    
    if (birdImg.complete) ctx.drawImage(birdImg, bird.x, bird.y, bird.w, bird.h);
}

function gameOver() {
    gameActive = false; lives--; updateLivesUI();
    document.getElementById("overlay").style.display = "flex";
    if (lives <= 0) {
        document.getElementById("msg").innerText = "Connection_Lost";
        if (score > bestScore) { bestScore = score; document.getElementById("bestVal").innerText = bestScore; }
        addLog("Critical Failure. Peak Score: " + score);
    } else {
        document.getElementById("msg").innerText = "Shield_Damaged";
        addLog("Warning: Integrity Breach");
    }
}

function gameLoop() { update(); render(); requestAnimationFrame(gameLoop); }
window.addEventListener("keydown", (e) => { if(e.code === "Space") bird.velocity = JUMP; });
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); if(gameActive) bird.velocity = JUMP; });

addLog("System Booting... OK");
updateLivesUI(); gameLoop();