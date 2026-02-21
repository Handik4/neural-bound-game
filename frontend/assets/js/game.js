const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Configuration ---
const CONTRACT_ADDRESS = "0xa5Bd5845aa80AF1fB73bCeEc9b044D51aE4D4E32"; 
const ADMIN_KEY = "Moltaphet98$";
const WAGER_AMOUNT = "0.001"; 

let userAddress = null;
const walletBtn = document.getElementById("walletBtn");
const historyContainer = document.getElementById("historyContainer");
const historyList = document.getElementById("historyList");
const livesCont = document.getElementById("livesCont");

const birdSVG = new Image(); birdSVG.src = 'assets/js/balloon-svgrepo-com.svg'; 
const bgImg = new Image(); bgImg.src = 'assets/js/background.jpg'; 

const GRAVITY = 0.14; const JUMP = -3.4; const PIPE_SPEED = 1.1;     
const PIPE_GAP = 195; const PIPE_WIDTH = 55; const PIPE_SPAWN_RATE = 160; 

let bird = { x: 50, y: 150, w: 50, h: 50, velocity: 0 };
let pipes = []; let score = 0; let bestScore = 0; let lives = 3;
let gameActive = false; let frameCount = 0;

// --- Smart Contract Sync ---
async function syncScoreToGenLayer(finalScore) {
    if (!userAddress) return;
    try {
        const stats = await window.genlayer.readContract({
            address: CONTRACT_ADDRESS,
            method: 'get_full_stats',
            args: []
        });
        const s1 = stats && stats.top1 ? parseInt(stats.top1.split(': ')[1]) : 0;
        const s2 = stats && stats.top2 ? parseInt(stats.top2.split(': ')[1]) : 0;
        const s3 = stats && stats.top3 ? parseInt(stats.top3.split(': ')[1]) : 0;

        let targetSlot = 0;
        if (finalScore > s1) targetSlot = 1;
        else if (finalScore > s2) targetSlot = 2;
        else if (finalScore > s3) targetSlot = 3;

        if (targetSlot > 0) {
            const name = userAddress.substring(0, 6);
            await window.genlayer.writeContract({
                address: CONTRACT_ADDRESS,
                method: 'update_leaderboard',
                args: [targetSlot, name, finalScore, ADMIN_KEY]
            });
        }
    } catch (err) { console.error("Sync Error:", err); }
}

// --- Game Logic ---
function updateLivesUI() {
    let html = "";
    for (let i = 0; i < 3; i++) {
        html += i < lives ? `<img src="assets/js/heart-full.svg" class="w-5 h-5 heart-glow">` : `<img src="assets/js/heart-empty.svg" class="w-5 h-5 opacity-30">`;
    }
    livesCont.innerHTML = html;
}

function resetGame(fullReset = true) {
    bird = { x: 50, y: 150, w: 50, h: 50, velocity: 0 };
    pipes = []; frameCount = 0;
    if (fullReset) { score = 0; lives = 3; document.getElementById("scoreVal").innerText = "0"; }
    updateLivesUI();
}

// --- Start Game with Mandatory Payment ---
document.getElementById("startBtn").onclick = async (e) => {
    e.stopPropagation();
    if (!userAddress) { alert("Connect Identity First!"); await connectWallet(); return; }

    const btn = document.getElementById("startBtn");
    const originalText = btn.innerText;
    
    try {
        btn.innerText = "AUTHORIZING...";
        btn.disabled = true;

        const valueInWei = (parseFloat(WAGER_AMOUNT) * 1e18).toString(16);
        const txParams = {
            to: CONTRACT_ADDRESS,
            from: userAddress,
            value: '0x' + valueInWei,
        };

        await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [txParams],
        });

        btn.disabled = false;
        btn.innerText = originalText;
        if (lives <= 0) resetGame(true); else resetGame(false);
        gameActive = true;
        document.getElementById("overlay").style.display = "none";

    } catch (err) {
        alert("Transaction Failed! Payment required to execute.");
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// --- Wallet Management ---
async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            updateWalletUI();
        } catch (err) { console.error(err); }
    } else { alert("MetaMask Terminal Not Found!"); }
}

function updateWalletUI() {
    if (userAddress) {
        walletBtn.innerText = userAddress.substring(0,6) + "..." + userAddress.slice(-4);
        historyContainer.classList.remove("hidden");
        displayHistory();
    } else {
        walletBtn.innerText = "CONNECT_IDENTITY";
        historyContainer.classList.add("hidden");
    }
}

walletBtn.onclick = () => { if (!userAddress) connectWallet(); else if(confirm("Disconnect?")) { userAddress = null; updateWalletUI(); } };

function saveToHistory(s) {
    if (!userAddress || s <= 0) return;
    let h = JSON.parse(localStorage.getItem('genbound_' + userAddress)) || [];
    h.unshift({ score: s, date: new Date().toLocaleTimeString() });
    localStorage.setItem('genbound_' + userAddress, JSON.stringify(h.slice(0, 10)));
    displayHistory();
}

function displayHistory() {
    const history = JSON.parse(localStorage.getItem('genbound_' + userAddress)) || [];
    historyList.innerHTML = history.map(i => `<li class="flex justify-between border-b border-white/5 pb-1"><span class="text-pink-500 font-bold">SCORE: ${i.score}</span><span class="text-gray-500 text-[9px]">${i.date}</span></li>`).join('') || "No logs.";
}

// --- Main Engine ---
function flap() { if (gameActive) bird.velocity = JUMP; }
window.addEventListener("keydown", (e) => { if(e.code === "Space") flap(); });
canvas.addEventListener("touchstart", (e) => { if(gameActive) { e.preventDefault(); flap(); } });

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
    if (bgImg.complete) { ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height); ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0,0,canvas.width,canvas.height); }
    pipes.forEach(p => {
        ctx.strokeStyle = "#00fff2"; ctx.lineWidth = 2; ctx.fillStyle = "rgba(0, 255, 242, 0.15)";
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.y); ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.y);
        ctx.fillRect(p.x, p.y + PIPE_GAP, PIPE_WIDTH, canvas.height); ctx.strokeRect(p.x, p.y + PIPE_GAP, PIPE_WIDTH, canvas.height);
    });
    ctx.save(); ctx.translate(bird.x + bird.w/2, bird.y + bird.h/2); ctx.rotate(bird.velocity * 0.1);
    if (birdSVG.complete) ctx.drawImage(birdSVG, -bird.w/2, -bird.h/2, bird.w, bird.h);
    ctx.restore();
}

function gameOver() {
    gameActive = false; lives--; updateLivesUI();
    if (lives > 0) {
        document.getElementById("overlay").style.display = "flex";
        document.getElementById("msg").innerText = `SYSTEM DAMAGED - ${lives} SHIELDS`;
        document.getElementById("startBtn").innerText = "REBOOT SYSTEM";
    } else {
        if (score > bestScore) { bestScore = score; document.getElementById("bestVal").innerText = bestScore; }
        saveToHistory(score); syncScoreToGenLayer(score);
        document.getElementById("overlay").style.display = "flex";
        document.getElementById("msg").innerText = "CRITICAL FAILURE";
        document.getElementById("startBtn").innerText = "NEW EXECUTION";
    }
}

function gameLoop() { update(); render(); requestAnimationFrame(gameLoop); }
updateLivesUI(); gameLoop();