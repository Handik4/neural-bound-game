const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let game = {
    active: false,
    score: 0,
    speed: 0,
    playerX: 300,
    targetX: 300,
    roadOff: 0
};

document.getElementById('start-btn').addEventListener('click', () => {
    game.active = true;
    game.score = 0;
    game.speed = 2;
    document.getElementById('msg-overlay').style.display = 'none';
});

window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') game.targetX -= 50;
    if (e.key === 'ArrowRight') game.targetX += 50;
});

function loop() {
    ctx.clearRect(0, 0, 600, 400);
    game.playerX += (game.targetX - game.playerX) * 0.1;

    // Environment
    ctx.fillStyle = "#111"; ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = "#222"; ctx.beginPath();
    ctx.moveTo(280, 200); ctx.lineTo(320, 200); ctx.lineTo(600, 400); ctx.lineTo(0, 400); ctx.fill();

    if (game.active) {
        game.roadOff += 5;
        if (game.roadOff > 40) game.roadOff = 0;
        ctx.strokeStyle = "#fff"; ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = -game.roadOff;
        ctx.beginPath(); ctx.moveTo(300, 200); ctx.lineTo(300, 400); ctx.stroke();
        
        game.score++;
        document.getElementById('currentSessionScore').innerText = game.score;
    }

    // Car
    ctx.fillStyle = "#0ff";
    ctx.fillRect(game.playerX - 20, 340, 40, 25);
    requestAnimationFrame(loop);
}
loop();