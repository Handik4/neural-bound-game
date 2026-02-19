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

/**
 * System Logger
 */
function addLog(msg, color = "text-gray-400") {
    const logDiv = document.getElementById('log');
    if (logDiv) {
        const timestamp = new Date().toLocaleTimeString([], { hour12: false });
        logDiv.innerHTML += `<p class="${color}">[${timestamp}] > ${msg}</p>`;
        logDiv.scrollTop = logDiv.scrollHeight;
    }
}

/**
 * Disconnect Logic: Resets all variables and UI elements
 */
function disconnectWallet() {
    signer = null;
    provider = null;
    contract = null;

    // Reset UI Button
    const btn = document.getElementById('connectBtn');
    if (btn) btn.innerText = "CONNECT WALLET";

    // Reset Status Dot
    const dot = document.getElementById('statusDot');
    if (dot) {
        dot.classList.remove('bg-green-500');
        dot.classList.add('bg-red-500', 'animate-pulse');
    }

    // Clear Stats Display
    if (document.getElementById('myScore')) document.getElementById('myScore').innerText = "0";
    if (document.getElementById('myXP')) document.getElementById('myXP').innerText = "0";
    if (document.getElementById('myBadge')) document.getElementById('myBadge').innerText = "---";

    addLog("Session closed. Wallet disconnected.", "text-yellow-500");
}

/**
 * Connect Logic: Initiates MetaMask handshake
 */
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        addLog("Error: MetaMask extension not found.", "text-red-500");
        return;
    }

    try {
        addLog("Requesting account access...", "text-yellow-400");
        
        // This line opens the MetaMask popup
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            const address = await signer.getAddress();

            // Update UI Button
            const shortAddr = `${address.substring(0, 6)}...${address.substring(38)}`;
            document.getElementById('connectBtn').innerText = shortAddr;

            // Update Status Dot
            const dot = document.getElementById('statusDot');
            if (dot) {
                dot.classList.remove('bg-red-500', 'animate-pulse');
                dot.classList.add('bg-green-500');
            }

            contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            addLog("Successfully connected: " + address.substring(0, 10), "text-green-400");
            
            // Sync initial data
            updateStats();
        }
    } catch (error) {
        addLog("Connection rejected or failed.", "text-red-500");
        console.error(error);
    }
}

/**
 * Smart Toggle: Connects or Disconnects based on state
 */
function handleWalletToggle() {
    if (signer) {
        disconnectWallet();
    } else {
        connectWallet();
    }
}

/**
 * Data Sync: Fetch on-chain information
 */
async function updateStats() {
    if (!contract || !signer) return;
    try {
        const address = await signer.getAddress();
        const stats = await contract.get_my_stats(address);
        
        if (document.getElementById('myScore')) document.getElementById('myScore').innerText = stats[0].toString();
        if (document.getElementById('myXP')) document.getElementById('myXP').innerText = stats[1].toString();
        if (document.getElementById('myBadge')) document.getElementById('myBadge').innerText = stats[2] || "ROOKIE";
    } catch (err) {
        addLog("Data sync failed. Check network.", "text-pink-400");
    }
}

/**
 * Transaction Submission
 */
async function submitScore() {
    const scoreElement = document.getElementById('currentSessionScore');
    const scoreVal = scoreElement ? scoreElement.innerText : "0";

    if (!contract || scoreVal === "0") {
        addLog("Action denied: Finish a race first.", "text-red-400");
        return;
    }

    try {
        addLog("Broadcasting score to blockchain...", "text-yellow-400");
        const tx = await contract.race_and_compete(scoreVal);
        addLog("TX Pending: " + tx.hash.substring(0, 12), "text-cyan-400");
        
        await tx.wait();
        addLog("Score verified on-chain!", "text-green-500");
        updateStats();
    } catch (err) {
        addLog("Transaction cancelled.", "text-red-500");
    }
}

// Attach Listeners
document.getElementById('connectBtn').addEventListener('click', handleWalletToggle);
if (document.getElementById('submitBtn')) {
    document.getElementById('submitBtn').addEventListener('click', submitScore);
}

// NOTE: No 'window.onload' or auto-connect triggers here.
// The app will wait for a manual click on 'connectBtn'.