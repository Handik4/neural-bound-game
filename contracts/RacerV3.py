const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start-btn");
const overlay = document.getElementById("msg-overlay");
const overlayText = document.getElementById("overlay-text");
const sessionScoreDisplay = document.getElementById("currentSessionScore");

let score = 0;
let gameActive = false;
let car = { x: 0, y: 0, w: 30, h: 50 };
let obstacles = [];
let gameSpeed = 5;

// Initialize Canvas Size
function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    car.x = canvas.width / 2 - 15;
    car.y = canvas.height - 70;
}
window.addEventListener('load', resize);

// Controls
let keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

function spawnObstacle() {
    const size = 40;
    obstacles.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        w: size,
        h: size
    });
}

function update() {
    if (!gameActive) return;

    // Move Car
    if (keys["ArrowLeft"] && car.x > 0) car.x -= 7;
    if (keys["ArrowRight"] && car.x < canvas.width - car.w) car.x += 7;

    // Obstacles logic
    if (Math.random() < 0.03) spawnObstacle();

    obstacles.forEach((obj, i) => {
        obj.y += gameSpeed;
        
        // Collision
        if (car.x < obj.x + obj.w && car.x + car.w > obj.x &&
            car.y < obj.y + obj.h && car.y + car.h > obj.y) {
            gameOver();
        }

        if (obj.y > canvas.height) {
            obstacles.splice(i, 1);
            score += 10;
            sessionScoreDisplay.innerText = score;
        }
    });

    gameSpeed += 0.001; // Increase difficulty
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Road lines
    ctx.strokeStyle = "#ffffff33";
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Draw Car (Cyan Neon)
    ctx.fillStyle = "#00f2ff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00f2ff";
    ctx.fillRect(car.x, car.y, car.w, car.h);

    // Draw Obstacles (Pink Neon)
    ctx.fillStyle = "#ff0055";
    ctx.shadowColor = "#ff0055";
    obstacles.forEach(obj => {
        ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
    });
    
    ctx.shadowBlur = 0;
}

function gameLoop() {
    update();
    draw();
    if (gameActive) requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    gameSpeed = 5;
    obstacles = [];
    sessionScoreDisplay.innerText = "0";
    gameActive = true;
    overlay.style.display = "none";
    gameLoop();
}

function gameOver() {
    gameActive = false;
    overlay.style.display = "flex";
    overlayText.innerText = "CRASHED! SCORE: " + score;
    startBtn.innerText = "RETRY";
}

startBtn.addEventListener("click", startGame);