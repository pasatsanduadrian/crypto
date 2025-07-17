// Additional classes to be added to crypto-trading-complete.js

// WalletManager Class
class WalletManager {
    constructor(parentSystem) {
        this.parentSystem = parentSystem;
        this.publicKey = null;
        this.isConnected = false;
        this.provider = null;
        this.balance = 0;
    }

    async connect() {
        try {
            // Check for Phantom wallet
            if (window.solana && window.solana.isPhantom) {
                this.provider = window.solana;
                const response = await this.provider.connect();
                this.publicKey = response.publicKey;
                this.isConnected = true;
                
                // Update UI
                this.updateWalletUI();
                
                return { success: true, publicKey: this.publicKey };
            } else {
                // Check for other wallets
                const message = 'Please install Phantom wallet or another Solana wallet';
                return { success: false, error: message };
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            return { success: false, error: error.message };
        }
    }

    async disconnect() {
        try {
            if (this.provider && this.provider.disconnect) {
                await this.provider.disconnect();
            }
            this.publicKey = null;
            this.isConnected = false;
            this.balance = 0;
            this.updateWalletUI();
            return { success: true };
        } catch (error) {
            console.error('Disconnect error:', error);
            return { success: false, error: error.message };
        }
    }

    async getBalance() {
        if (!this.publicKey || !this.parentSystem.connection) {
            return 0;
        }
        
        try {
            const balance = await this.parentSystem.connection.getBalance(this.publicKey);
            this.balance = balance / solanaWeb3.LAMPORTS_PER_SOL;
            return this.balance;
        } catch (error) {
            console.error('Error getting balance:', error);
            return 0;
        }
    }

    async signTransaction(transaction) {
        if (!this.provider || !this.isConnected) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const signedTransaction = await this.provider.signTransaction(transaction);
            return signedTransaction;
        } catch (error) {
            console.error('Transaction signing error:', error);
            throw error;
        }
    }

    updateWalletUI() {
        const connectBtn = document.getElementById('connectWallet');
        const balanceElement = document.querySelector('.wallet-balance');
        
        if (this.isConnected && this.publicKey) {
            connectBtn.textContent = 'Disconnect';
            connectBtn.onclick = () => this.disconnect();
            
            // Update balance display
            this.getBalance().then(balance => {
                if (balanceElement) {
                    balanceElement.textContent = `${balance.toFixed(4)} SOL`;
                }
            });
        } else {
            connectBtn.textContent = 'Connect Wallet';
            connectBtn.onclick = () => this.connect();
            
            if (balanceElement) {
                balanceElement.textContent = '0.0000 SOL';
            }
        }
    }
}

// TradingEngine Class
class TradingEngine {
    constructor(parentSystem) {
        this.parentSystem = parentSystem;
        this.pendingTrades = new Map();
    }

    async executeTrade(params) {
        const { tokenAddress, amount, side, orderType, slippage, priorityFee, stopLoss, takeProfit } = params;
        
        try {
            // Validate parameters
            if (!tokenAddress || !amount || !side) {
                throw new Error('Missing required parameters');
            }

            // Check wallet connection
            if (!this.parentSystem.wallet.isConnected) {
                throw new Error('Wallet not connected');
            }

            // Check balance
            const balance = await this.parentSystem.wallet.getBalance();
            if (balance < amount) {
                throw new Error('Insufficient balance');
            }

            // For now, return a mock response
            // In a real implementation, you would:
            // 1. Get swap quote from Jupiter API
            // 2. Create transaction
            // 3. Sign with wallet
            // 4. Send to blockchain
            
            const mockTransaction = await this.createMockTransaction(params);
            
            // Create position object
            const position = {
                id: Date.now().toString(),
                tokenAddress,
                amount,
                side,
                orderType,
                entryPrice: this.generateMockPrice(),
                quantity: amount,
                stopLoss,
                takeProfit,
                timestamp: new Date(),
                status: 'open'
            };

            return {
                success: true,
                position,
                transactionId: mockTransaction.signature
            };

        } catch (error) {
            console.error('Trade execution error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createMockTransaction(params) {
        // Mock transaction creation
        // In real implementation, use Jupiter API or direct Solana programs
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        return {
            signature: 'mock_signature_' + Date.now(),
            success: true
        };
    }

    generateMockPrice() {
        // Generate a mock price for testing
        return Math.random() * 0.001 + 0.0001;
    }

    async getJupiterQuote(inputMint, outputMint, amount, slippage) {
        try {
            const response = await fetch(
                `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippage * 100}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to get Jupiter quote');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Jupiter quote error:', error);
            throw error;
        }
    }

    async createJupiterTransaction(quote, userPublicKey) {
        try {
            const response = await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: userPublicKey.toString(),
                    wrapAndUnwrapSol: true,
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create Jupiter transaction');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Jupiter transaction error:', error);
            throw error;
        }
    }
}

// Utility functions to be added to crypto-trading-complete.js

// API Testing Functions
async function testHeliusConnection(apiKey) {
    try {
        const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getHealth'
            })
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function testMoralisConnection(apiKey) {
    try {
        const response = await fetch('https://deep-index.moralis.io/api/v2.2/solana/account/mainnet/11111111111111111111111111111111/balance', {
            headers: { 'X-API-Key': apiKey }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function testDexScreenerConnection() {
    try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112');
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function testCoinGeckoConnection(apiKey) {
    try {
        const url = apiKey 
            ? `https://api.coingecko.com/api/v3/ping?x_cg_demo_api_key=${apiKey}`
            : 'https://api.coingecko.com/api/v3/ping';
        const response = await fetch(url);
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function testJupiterConnection() {
    try {
        const response = await fetch('https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&slippageBps=50');
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function testBirdeyeConnection(apiKey) {
    try {
        const response = await fetch('https://public-api.birdeye.so/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=50', {
            headers: { 'X-API-KEY': apiKey }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function testOpenAIConnection(apiKey) {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Additional utility functions
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
    
    // Manual close
    toast.querySelector('.toast-close').onclick = () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    };
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('active', show);
    }
}

function logMessage(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
}

// Tab switching functionality
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked nav tab
    const navTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (navTab) {
        navTab.classList.add('active');
    }
}

// Initialize additional event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Scanner toggle
    const toggleScanner = document.getElementById('toggleScanner');
    if (toggleScanner) {
        toggleScanner.addEventListener('click', function() {
            if (window.tradingSystem) {
                window.tradingSystem.toggleScanner();
            }
        });
    }
    
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Order type toggle
    document.querySelectorAll('input[name="orderType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const limitGroup = document.getElementById('limitPriceGroup');
            if (limitGroup) {
                if (e.target.value === 'limit') {
                    limitGroup.classList.remove('hidden');
                } else {
                    limitGroup.classList.add('hidden');
                }
            }
        });
    });
});

// Export for use in main system
if (typeof window !== 'undefined') {
    window.WalletManager = WalletManager;
    window.TradingEngine = TradingEngine;
    window.showToast = showToast;
    window.showLoading = showLoading;
    window.logMessage = logMessage;
    window.switchTab = switchTab;
}