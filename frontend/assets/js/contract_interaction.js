// GENLAYER CONTRACT CONFIGURATION
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

/**
 * Handle Connect and Disconnect Toggle
 */
async function handleWalletAction() {
    const connectBtn = document.getElementById('connectBtn');
    
    // IF CONNECTED: Perform Disconnect
    if (signer) {
        signer = null;
        provider = null;
        contract = null;
        
        // Reset UI
        connectBtn.innerText = "CONNECT WALLET";
        const dot = document.getElementById('statusDot');
        if (dot) dot.classList.replace('bg-green-500', 'bg-red-500');
        
        document.getElementById('myScore').innerText = "0";
        document.getElementById('myXP').innerText = "0";
        document.getElementById('myBadge').innerText = "---";
        
        addLog("Wallet disconnected.", "text-yellow-500");
        return;
    }

    // IF NOT CONNECTED: Perform Connect
    if (typeof window.ethereum === 'undefined') {
        addLog("MetaMask not detected!", "text-red-500");
        return;
    }

    try {
        addLog("Connecting...", "text-yellow-400");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            const address = await signer.getAddress();
            
            // Update UI
            connectBtn.innerText = `${address.substring(0, 6)}...${address.substring(38)}`;
            const dot = document.getElementById('statusDot');
            if (dot) dot.classList.replace('bg-red-500', 'bg-green-500');

            contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            addLog("Connected: " + address.substring(0, 10), "text-green-400");
            updateStats();
        }
    } catch (error) {
        addLog("Login failed.", "text-red-500");
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
    } catch (err) {
        addLog("Sync Error.", "text-pink-400");
    }
}

// Attach Event Listeners
document.getElementById('connectBtn').addEventListener('click', handleWalletAction);

// NOTE: Auto-connect on load has been removed to prevent unwanted popups.