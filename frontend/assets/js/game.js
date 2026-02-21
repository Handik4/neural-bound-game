const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Configuration ---
const CONTRACT_ADDRESS = "0xa5Bd5845aa80AF1fB73bCeEc9b044D51aE4D4E32"; 
const ADMIN_KEY = "Moltaphet98$";

let userAddress = null;
const walletBtn = document.getElementById("walletBtn");
const livesCont = document.getElementById("livesCont");
const historyList = document.getElementById("historyList");

const birdSVG = new Image(); birdSVG.src = 'assets/js/balloon-svgrepo-com.svg'; 
const bgImg = new Image(); bgImg.src = 'assets/js/background.jpg'; 

const GRAVITY = 0.14; const JUMP = -3.4; const PIPE_SPEED = 1.1;     
const PIPE_GAP = 195; const PIPE_WIDTH = 55; const PIPE_SPAWN_RATE = 160; 

let bird = { x: 50, y: 150, w: 50, h: 50, velocity: 0 };
let pipes = []; let score = 0; let bestScore = 0; let lives = 3;
let gameActive = false; let frameCount = 0;

// --- UI Log Helper ---
function updateExecutionLogs(text) {
    const li = document.createElement("li");
    li.className = "border-l-2 border-cyan-500 pl-2 py-1 text-[9px] text-gray-400 bg-white/5";
    li.innerHTML = `<span class="text-cyan-600">[${new Date().toLocaleTimeString()}]</span> ${text}`;
    historyList.prepend(li);
}

// --- Blockchain: Fetch DB ---
async function fetchBlockchainLogs() {
    try {
        const stats = await window.genlayer.readContract({
            address: CONTRACT_ADDRESS,
            method: 'get_full_stats',
            args: []
        });
        historyList.innerHTML = "";
        if (stats) {
            Object.values(stats).forEach(logEntry => {
                if (logEntry && logEntry !== "Empty") updateExecutionLogs(`RECORD: ${logEntry}`);
            });
        }
    } catch (err) { console.error(err); }
}

// --- Blockchain: Record Score (ONLY ON GAME OVER) ---
async function recordLogOnChain(finalScore) {
    if (!userAddress || finalScore <= 0) return;
    try {
        updateExecutionLogs("Status: Syncing to GenLayer...");
        // این تنها جایی هست که ولت باز می‌شه، اونم فقط وقتی بازی تموم شد
        await window.genlayer.writeContract({
            address: CONTRACT_ADDRESS,
            method: 'update_leaderboard', 
            args: [1, userAddress.substring(0, 6), finalScore, ADMIN_KEY]
        });
        updateExecutionLogs("Status: Sync Successful");
        setTimeout(fetchBlockchainLogs, 1000);
    } catch (err) { updateExecutionLogs("Chain_Error: Tx_Rejected"); }
}

// --- Game Logic ---
function updateLivesUI() {
    let html = "";
    for (let i = 0; i < 3; i++) {
        html += i < lives ? `<img src="assets/js/heart-full.svg" class="w-5 h-5">` : `<img src="assets/js/heart-empty.svg" class="w-5 h-5 opacity-20">`;
    }
    livesCont.innerHTML = html;
}

function resetGame(fullReset = true) {
    bird = { x: 50, y: 150, w: 50, h: 50, velocity: 0 };
    pipes = []; frameCount = 0;
    if (fullReset) { score = 0; lives = 3; document.getElementById("scoreVal").innerText = "0"; }
    updateLivesUI();
}

// *** مهم: این دکمه دیگه هیچ کدی برای تراکنش یا AUTHORIZING نداره ***
document.getElementById("startBtn").onclick = () => {
    // بازی بلافاصله شروع می‌شه
    if (lives <= 0) resetGame(true); else resetGame(false);
    gameActive = true;
    document.getElementById("overlay").style.display = "none";
    updateExecutionLogs("Engine_Initialized: Offline_Mode");
};

document.getElementById("refreshLogs").onclick = fetchBlockchainLogs;

async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            walletBtn.innerText = userAddress.substring(0,6) + "...";
            updateExecutionLogs("Identity_Linked");
            fetchBlockchainLogs();
        } catch (err) { console.error("Link Denied"); }
    }
}
walletBtn.onclick = () => { if (!userAddress) connectWallet(); else { userAddress = null; walletBtn.innerText = "Connect_Identity"; } };

// --- Engine ---
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
    if (bgImg.complete) ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    pipes.forEach(p => {
        ctx.fillStyle = "rgba(0, 255, 242, 0.2)";
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.y);
        ctx.fillRect(p.x, p.y + PIPE_GAP, PIPE_WIDTH, canvas.height);
    });
    if (birdSVG.complete) ctx.drawImage(birdSVG, bird.x, bird.y, bird.w, bird.h);
}

function gameOver() {
    gameActive = false; lives--; updateLivesUI();
    document.getElementById("overlay").style.display = "flex";
    if (lives <= 0) {
        document.getElementById("msg").innerText = "CRITICAL FAILURE";
        updateExecutionLogs(`Session_End. Score: ${score}`);
        // فقط اینجا تراکنش زده می‌شه اونم اگه کاربر ولت رو وصل کرده باشه
        if(userAddress) recordLogOnChain(score);
        if (score > bestScore) { bestScore = score; document.getElementById("bestVal").innerText = bestScore; }
    } else {
        document.getElementById("msg").innerText = "SYSTEM DAMAGED";
    }
}

function gameLoop() { update(); render(); requestAnimationFrame(gameLoop); }
updateLivesUI(); gameLoop();