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
 * Main Wallet Controller: Handles Connect & Disconnect
 */
async function toggleWallet() {
    // If already connected, act as Disconnect button
    if (signer) {
        disconnectWallet();
        return;
    }

    if (typeof window.ethereum === 'undefined') {
        addLog("MetaMask not detected!", "text-red-500");
        return;
    }

    try {
        addLog("Requesting secure connection...", "text-yellow-400");
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            const address = await signer.getAddress();
            
            // Update UI Button with shortened address
            const displayAddr = `${address.substring(0, 6)}...${address.substring(38)}`;
            document.getElementById('connectBtn').innerText = displayAddr;
            
            // Status Indicator
            const dot = document.getElementById('statusDot');
            if(dot) dot.classList.replace('bg-red-500', 'bg-green-500');

            contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            
            addLog("Connected: " + address.substring(0, 10), "text-green-400");
            updateStats();
        }
    } catch (error) {
        addLog("Connection Failed.", "text-red-500");
        console.error(error);
    }
}

/**
 * Resets the UI and clears the session
 */
function disconnectWallet() {
    signer = null;
    contract = null;
    provider = null;

    document.getElementById('connectBtn').innerText = "CONNECT WALLET";
    const dot = document.getElementById('statusDot');
    if(dot) dot.classList.replace('bg-green-500', 'bg-red-500');

    // Reset Stats UI
    document.getElementById('myScore').innerText = "0";
    document.getElementById('myXP').innerText = "0";
    document.getElementById('myBadge').innerText = "UNRANKED";

    addLog("Wallet disconnected successfully.", "text-yellow-500");
}

/**
 * Fetches data from GenLayer Smart Contract
 */
async function updateStats() {
    if (!contract || !signer) return;
    
    try {
        const address = await signer.getAddress();
        addLog("Fetching on-chain profile...", "text-cyan-500");
        
        const stats = await contract.get_my_stats(address);
        document.getElementById('myScore').innerText = stats[0].toString();
        document.getElementById('myXP').innerText = stats[1].toString();
        document.getElementById('myBadge').innerText = stats[2] || "ROOKIE";

        const world = await contract.get_world_champion();
        document.getElementById('topScore').innerText = world[1].toString();
        document.getElementById('topAddress').innerText = world[0].toLowerCase();
        
        addLog("Profile Synced.", "text-green-400");
    } catch (err) {
        // This handles the "Blockchain Read Error" seen in your screenshot
        addLog("Sync Error: Check if you are on GenLayer Testnet.", "text-pink-400");
        console.error(err);
    }
}

/**
 * Submits score to the blockchain
 */
async function submitScore() {
    const scoreElement = document.getElementById('currentSessionScore');
    const finalScore = scoreElement ? scoreElement.innerText : "0";
    
    if (!contract || finalScore === "0") {
        addLog("Transaction Blocked: Earn points first!", "text-red-400");
        return;
    }

    try {
        addLog("Initiating GenLayer transaction...", "text-yellow-400");
        const tx = await contract.race_and_compete(finalScore);
        addLog("TX Hash: " + tx.hash.substring(0, 10), "text-cyan-400");
        
        await tx.wait();
        addLog("Score secured on blockchain!", "text-green-500");
        updateStats();
    } catch (err) {
        addLog("Transaction failed.", "text-red-500");
    }
}

// Attach Listeners
document.getElementById('connectBtn').addEventListener('click', toggleWallet);
document.getElementById('submitBtn').addEventListener('click', submitScore);