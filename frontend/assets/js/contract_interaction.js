const CONTRACT_ADDRESS = "0xC269A4F7A3394A22eeE9cA441e2D62bd72D6d5a9";
const ABI = [
    "function race_and_compete(uint256 score_input) public",
    "function get_world_champion() public view returns (address champion, uint256 record_score)",
    "function get_my_stats(address player) public view returns (uint256 my_score, uint256 my_xp, string my_badge)"
];

// Use 'let' to allow full cleanup on disconnect
let provider = null;
let signer = null;
let contract = null;

function addLog(msg, color = "text-gray-400") {
    const logDiv = document.getElementById('log');
    if (!logDiv) return;
    const p = document.createElement('p');
    p.className = color;
    p.innerText = `[${new Date().toLocaleTimeString()}] > ${msg}`;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
}

// FULL RESET LOGIC
function doDisconnect() {
    // 1. Clear variables
    signer = null;
    provider = null;
    contract = null;

    // 2. Reset UI elements
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) connectBtn.innerText = "CONNECT WALLET";

    const statusDot = document.getElementById('statusDot');
    if (statusDot) {
        statusDot.classList.remove('bg-green-500');
        statusDot.classList.add('bg-red-500', 'animate-pulse');
    }

    // 3. Clear data displays
    document.getElementById('myScore').innerText = "0";
    document.getElementById('myXP').innerText = "0";
    document.getElementById('myBadge').innerText = "UNRANKED";

    addLog("Session terminated. Wallet disconnected.", "text-yellow-500");
}

async function handleConnection() {
    // Toggle: If already connected, then disconnect
    if (signer) {
        doDisconnect();
        return;
    }

    if (!window.ethereum) {
        addLog("MetaMask not found.", "text-red-500");
        return;
    }

    try {
        addLog("Requesting account access...", "text-cyan-400");
        
        // Manual trigger for MetaMask
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            const addr = await signer.getAddress();
            
            // Update Button
            document.getElementById('connectBtn').innerText = `${addr.substring(0,6)}...${addr.substring(38)}`;
            
            // Update Status Dot
            const statusDot = document.getElementById('statusDot');
            if (statusDot) {
                statusDot.classList.remove('bg-red-500', 'animate-pulse');
                statusDot.classList.add('bg-green-500');
            }
            
            contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            addLog("Successfully linked.", "text-green-500");
            fetchData(addr);
        }
    } catch (err) {
        addLog("Connection rejected.", "text-red-500");
    }
}

async function fetchData(addr) {
    if (!contract) return;
    try {
        const stats = await contract.get_my_stats(addr);
        document.getElementById('myScore').innerText = stats[0];
        document.getElementById('myXP').innerText = stats[1];
        document.getElementById('myBadge').innerText = stats[2] || "ROOKIE";
    } catch (e) { 
        addLog("Data sync failed.", "text-red-400"); 
    }
}

async function submitScore() {
    const scoreVal = document.getElementById('currentSessionScore').innerText;
    if (!contract || scoreVal === "0") {
        addLog("Action denied: No score or wallet not linked.", "text-pink-500");
        return;
    }
    try {
        addLog("Broadcasting to GenLayer...", "text-yellow-400");
        const tx = await contract.race_and_compete(scoreVal);
        await tx.wait();
        addLog("Score secured on blockchain!", "text-green-500");
    } catch (e) { 
        addLog("Transaction failed.", "text-red-500"); 
    }
}

// ATTACH EVENTS MANUALLY
document.getElementById('connectBtn').onclick = handleConnection;
document.getElementById('submitBtn').onclick = submitScore;

// CRITICAL: Ensure NO window.onload or other auto-triggers exist here.