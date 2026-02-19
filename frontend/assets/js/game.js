const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let game = {
    active: false,
    score: 0,
    speed: 0,
    playerX: 300,
    targetX: 300,
    roadOff: 0
};

// Start Game Logic
const startBtn = document.getElementById('start-btn');
const msgOverlay = document.getElementById('msg-overlay');
const sessionScoreDisplay = document.getElementById('currentSessionScore');

if (startBtn) {
    startBtn.onclick = function() {
        game.active = true;
        game.score = 0;
        game.speed = 2;
        if (msgOverlay) msgOverlay.style.display = 'none';
        
        // Use the addLog function from contract_interaction.js if available
        if (typeof addLog === 'function') {
            addLog("Race started!", "text-cyan-400");
        }
    };
}

// Controls
window.onkeydown = function(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') game.targetX -= 50;
    if (e.key === 'ArrowRight' || e.key === 'd') game.targetX += 50;
    
    // Boundary check to keep car on screen
    if (game.targetX < 50) game.targetX = 50;
    if (game.targetX > 550) game.targetX = 550;
};

// Main Animation Loop
function loop() {
    ctx.clearRect(0, 0, 600, 400);
    
    // Smooth player movement
    game.playerX += (game.targetX - game.playerX) * 0.15;

    // Background (Sky/Space)
    ctx.fillStyle = "#111"; 
    ctx.fillRect(0, 0, 600, 400);

    // Road Projection
    ctx.fillStyle = "#222"; 
    ctx.beginPath();
    ctx.moveTo(280, 200); 
    ctx.lineTo(320, 200); 
    ctx.lineTo(600, 400); 
    ctx.lineTo(0, 400); 
    ctx.fill();

    if (game.active) {
        // Road animation
        game.roadOff += 10;
        if (game.roadOff > 40) game.roadOff = 0;
        
        ctx.strokeStyle = "#fff"; 
        ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = -game.roadOff;
        ctx.beginPath(); 
        ctx.moveTo(300, 200); 
        ctx.lineTo(300, 400); 
        ctx.stroke();
        
        // Score logic
        game.score++;
        if (sessionScoreDisplay) {
            sessionScoreDisplay.innerText = game.score;
        }
    }

    // Draw Car (Cyberpunk Cyan)
    ctx.fillStyle = "#0ff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#0ff";
    ctx.fillRect(game.playerX - 20, 340, 40, 25);
    ctx.shadowBlur = 0;

    requestAnimationFrame(loop);
}

// Initialize Loop
loop();