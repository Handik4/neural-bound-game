const canvas = document.getElementById('gameCanvas'); // Fixed ID to match HTML
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 400;

let gameState = {
    isRacing: false,
    score: 0,
    speed: 0,
    roadOffset: 0,
    playerX: 300,
    targetX: 300
};

// UI Elements
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('msg-overlay');
const scoreDisplay = document.getElementById('currentSessionScore');

if (startBtn) {
    startBtn.addEventListener('click', () => {
        gameState.isRacing = true;
        gameState.score = 0;
        gameState.speed = 100;
        overlay.style.display = 'none';
        addLog("Engine Initialized. Racing...", "text-cyan-400");
    });
}

window.addEventListener('keydown', e => {
    if (e.key === 'a' || e.key === 'ArrowLeft') gameState.targetX -= 40;
    if (e.key === 'd' || e.key === 'ArrowRight') gameState.targetX += 40;
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    gameState.playerX += (gameState.targetX - gameState.playerX) * 0.1;

    // Background
    ctx.fillStyle = "#151518"; ctx.fillRect(0, 0, 600, 400); 
    ctx.fillStyle = "#0d3d0d"; ctx.fillRect(0, 200, 600, 200); 

    // Draw Road
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.moveTo(280, 200); ctx.lineTo(320, 200);
    ctx.lineTo(550, 400); ctx.lineTo(50, 400); ctx.fill();

    if (gameState.isRacing) {
        gameState.roadOffset += gameState.speed / 5;
        if (gameState.roadOffset > 40) gameState.roadOffset = 0;
        
        ctx.strokeStyle = "#fff"; ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = -gameState.roadOffset;
        ctx.beginPath(); ctx.moveTo(300, 200); ctx.lineTo(300, 400); ctx.stroke();

        gameState.score += 1;
        if (scoreDisplay) scoreDisplay.innerText = gameState.score;
        if (gameState.speed < 220) gameState.speed += 0.05;
    }

    // Draw Car
    ctx.fillStyle = "#ff0055";
    ctx.shadowBlur = 15; ctx.shadowColor = "#ff0055";
    ctx.fillRect(gameState.playerX - 25, 330, 50, 30);
    ctx.shadowBlur = 0;

    requestAnimationFrame(draw);
}
draw();