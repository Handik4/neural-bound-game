const CONTRACT_ADDRESS = "0xC269A4F7A3394A22eeE9cA441e2D62bd72D6d5a9";
const ABI = [
    "function race_and_compete(uint256 score_input) public",
    "function get_world_champion() public view returns (address champion, uint256 record_score)",
    "function get_my_stats(address player) public view returns (uint256 my_score, uint256 my_xp, string my_badge)"
];

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

// Fixed Disconnect Logic
function doDisconnect() {
    signer = null;
    provider = null;
    contract = null;
    document.getElementById('connectBtn').innerText = "CONNECT WALLET";
    document.getElementById('statusDot').classList.replace('bg-green-500', 'bg-red-500');
    document.getElementById('myScore').innerText = "0";
    document.getElementById('myXP').innerText = "0";
    document.getElementById('myBadge').innerText = "UNRANKED";
    addLog("Wallet Disconnected.", "text-yellow-500");
}

async function handleConnection() {
    if (signer) {
        doDisconnect();
        return;
    }

    if (!window.ethereum) {
        addLog("MetaMask not found.", "text-red-500");
        return;
    }

    try {
        addLog("Connecting...", "text-cyan-400");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        const addr = await signer.getAddress();
        
        document.getElementById('connectBtn').innerText = `${addr.substring(0,6)}...${addr.substring(38)}`;
        document.getElementById('statusDot').classList.replace('bg-red-500', 'bg-green-500');
        
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        addLog("Wallet Linked.", "text-green-500");
        fetchData(addr);
    } catch (err) {
        addLog("Auth Denied.", "text-red-500");
    }
}

async function fetchData(addr) {
    if (!contract) return;
    try {
        const stats = await contract.get_my_stats(addr);
        document.getElementById('myScore').innerText = stats[0];
        document.getElementById('myXP').innerText = stats[1];
        document.getElementById('myBadge').innerText = stats[2] || "ROOKIE";
    } catch (e) { addLog("Sync Error.", "text-red-400"); }
}

async function submitScore() {
    const score = document.getElementById('currentSessionScore').innerText;
    if (!contract || score === "0") {
        addLog("Connect Wallet & Play first.", "text-pink-500");
        return;
    }
    try {
        addLog("Broadcasting Score...", "text-yellow-400");
        const tx = await contract.race_and_compete(score);
        await tx.wait();
        addLog("Transaction Success!", "text-green-500");
    } catch (e) { addLog("TX Failed.", "text-red-500"); }
}

document.getElementById('connectBtn').addEventListener('click', handleConnection);
document.getElementById('submitBtn').addEventListener('click', submitScore);