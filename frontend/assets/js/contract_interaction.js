// GENLAYER CONTRACT CONFIGURATION
const CONTRACT_ADDRESS = "0xC269A4F7A3394A22eeE9cA441e2D62bd72D6d5a9";
const ABI = [
    "function race_and_compete(uint256 score_input) public",
    "function get_world_champion() public view returns (address champion, uint256 record_score)",
    "function get_my_stats(address player) public view returns (uint256 my_score, uint256 my_xp, string my_badge)"
];

let provider, signer, contract;

function addLog(msg, color = "text-gray-400") {
    const logDiv = document.getElementById('log');
    if (logDiv) {
        const timestamp = new Date().toLocaleTimeString([], { hour12: false });
        logDiv.innerHTML += `<p class="${color}">[${timestamp}] > ${msg}</p>`;
        logDiv.scrollTop = logDiv.scrollHeight;
    }
}

/**
 * Validates and Connects to MetaMask
 */
async function connect() {
    if (typeof window.ethereum === 'undefined') {
        addLog("Critical: MetaMask not detected!", "text-red-500");
        alert("Please install MetaMask extension to play.");
        return;
    }

    try {
        addLog("Initializing secure handshake...", "text-yellow-400");
        
        // Force MetaMask to open the account selection screen
        const accounts = await window.ethereum.request({ 
            method: 'wallet_requestPermissions', 
            params: [{ eth_accounts: {} }] 
        });

        if (accounts) {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            const address = await signer.getAddress();
            
            // Update UI
            const displayAddr = `${address.substring(0, 6)}...${address.substring(38)}`;
            document.getElementById('connectBtn').innerText = displayAddr;
            
            const dot = document.getElementById('statusDot');
            dot.classList.replace('bg-red-500', 'bg-green-500');
            dot.classList.remove('animate-pulse');

            contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            
            addLog("Authorization Successful: " + address.substring(0, 10), "text-green-400");
            updateStats();
        }
    } catch (error) {
        if (error.code === 4001) {
            addLog("User rejected the connection request.", "text-pink-500");
        } else {
            addLog("Connection Error: " + error.code, "text-red-500");
            console.error(error);
        }
    }
}

/**
 * Update UI with Blockchain Data
 */
async function updateStats() {
    if (!contract || !signer) return;
    
    try {
        const address = await signer.getAddress();
        addLog("Syncing with GenLayer nodes...", "text-cyan-600");
        
        const stats = await contract.get_my_stats(address);
        document.getElementById('myScore').innerText = stats[0].toString();
        document.getElementById('myXP').innerText = stats[1].toString();
        document.getElementById('myBadge').innerText = stats[2] || "ROOKIE";

        const world = await contract.get_world_champion();
        document.getElementById('topScore').innerText = world[1].toString();
        document.getElementById('topAddress').innerText = world[0].toLowerCase();
        
        addLog("Sync Complete.", "text-gray-500");
    } catch (err) {
        addLog("Blockchain Read Error.", "text-red-400");
    }
}

/**
 * Handle Transaction Submission
 */
async function submitScore() {
    const finalScore = document.getElementById('currentSessionScore').innerText;
    
    if (!contract || finalScore === "0") {
        addLog("Action Denied: Connect wallet and finish a race.", "text-red-500");
        return;
    }

    try {
        addLog("Broadcasting score to GenLayer...", "text-yellow-400");
        const tx = await contract.race_and_compete(finalScore);
        addLog("TX Pending: " + tx.hash.substring(0, 12), "text-cyan-500");
        
        await tx.wait();
        addLog("Score permanently recorded on-chain!", "text-green-500");
        updateStats();
    } catch (err) {
        addLog("Transaction failed or cancelled.", "text-red-500");
    }
}

// Event Listeners
document.getElementById('connectBtn').addEventListener('click', connect);
document.getElementById('submitBtn').addEventListener('click', submitScore);

// Check if already connected on load
window.addEventListener('load', async () => {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            addLog("Existing session detected. Resuming...", "text-cyan-500");
            connect();
        }
    }
});