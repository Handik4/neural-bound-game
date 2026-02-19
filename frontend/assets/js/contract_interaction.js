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
    if (logDiv) {
        const timestamp = new Date().toLocaleTimeString([], { hour12: false });
        logDiv.innerHTML += `<p class="${color}">[${timestamp}] > ${msg}</p>`;
        logDiv.scrollTop = logDiv.scrollHeight;
    }
}

async function toggleWallet() {
    const btn = document.getElementById('connectBtn');
    
    // DISCONNECT LOGIC
    if (signer) {
        signer = null; provider = null; contract = null;
        btn.innerText = "CONNECT WALLET";
        const dot = document.getElementById('statusDot');
        dot.classList.replace('bg-green-500', 'bg-red-500');
        dot.classList.add('animate-pulse');
        addLog("Disconnected.", "text-yellow-500");
        return;
    }

    // CONNECT LOGIC
    if (typeof window.ethereum === 'undefined') {
        addLog("MetaMask not found.", "text-red-500");
        return;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        btn.innerText = `${address.substring(0, 6)}...${address.substring(38)}`;
        const dot = document.getElementById('statusDot');
        dot.classList.replace('bg-red-500', 'bg-green-500');
        dot.classList.remove('animate-pulse');

        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        addLog("Connected to " + address.substring(0, 8), "text-green-400");
        updateStats();
    } catch (err) {
        addLog("Auth failed.", "text-red-500");
    }
}

async function updateStats() {
    if (!contract || !signer) return;
    try {
        const address = await signer.getAddress();
        const stats = await contract.get_my_stats(address);
        document.getElementById('myScore').innerText = stats[0].toString();
        document.getElementById('myXP').innerText = stats[1].toString();
        document.getElementById('myBadge').innerText = stats[2] || "ROOKIE";
        
        const world = await contract.get_world_champion();
        document.getElementById('topScore').innerText = world[1].toString();
        document.getElementById('topAddress').innerText = world[0].toLowerCase();
    } catch (e) { console.error("Stats sync error"); }
}

async function submitToChain() {
    const score = document.getElementById('currentSessionScore').innerText;
    if (!contract || score === "0") {
        addLog("Connect wallet & play first!", "text-pink-500");
        return;
    }
    try {
        addLog("Sending to GenLayer...", "text-yellow-400");
        const tx = await contract.race_and_compete(score);
        await tx.wait();
        addLog("Blockchain Updated!", "text-green-500");
        updateStats();
    } catch (err) { addLog("TX Failed.", "text-red-500"); }
}

document.getElementById('connectBtn').addEventListener('click', toggleWallet);
document.getElementById('submitBtn').addEventListener('click', submitToChain);