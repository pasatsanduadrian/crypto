// Crypto Screening & Trading System
class CryptoTradingSystem {
    constructor() {
        this.apiKeys = {};
        this.apiEndpoints = {
            helius: "https://api.helius.xyz/v0/",
            moralis: "https://deep-index.moralis.io/api/v2/",
            dexscreener: "https://api.dexscreener.com/latest/",
            coingecko: "https://api.coingecko.com/api/v3/",
            jupiter: "https://lite-api.jup.ag/",
            birdeye: "https://public-api.birdeye.so/",
            openai: "https://api.openai.com/v1/"
        };
        
        this.settings = {
            volumeSpike: 200,
            minLiquidity: 50000,
            maxExposure: 5,
            dailyLossLimit: 20,
            stopLoss: 15,
            takeProfitLevels: [3, 5, 7],
            checkInterval: 5000
        };
        
        this.scannerActive = false;
        this.scannerInterval = null;
        this.positions = [];
        this.signals = [];
        this.tradeHistory = [];
        this.performance = {
            totalPnl: 0,
            winRate: 0,
            totalTrades: 0,
            avgReturn: 0
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.initializeCharts();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Auto-save API keys
        ['helius', 'moralis', 'dexscreener', 'coingecko', 'jupiter', 'birdeye', 'openai'].forEach(api => {
            const input = document.getElementById(`${api}Key`);
            if (input) {
                input.addEventListener('input', () => {
                    this.apiKeys[api] = input.value;
                    this.saveApiKeys();
                });
            }
        });
        
        // Settings inputs
        ['maxExposure', 'dailyLossLimit', 'stopLoss', 'volumeSpike', 'minLiquidity', 'checkInterval'].forEach(setting => {
            const input = document.getElementById(setting);
            if (input) {
                input.addEventListener('change', () => {
                    this.settings[setting] = parseFloat(input.value);
                    this.saveSettings();
                });
            }
        });
    }
    
    switchTab(tabName) {
        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        // Load tab-specific data
        if (tabName === 'analytics') {
            this.updateAnalytics();
        } else if (tabName === 'dashboard') {
            this.updateDashboard();
        }
    }
    
    async testApiConnection(apiName) {
        const key = this.apiKeys[apiName];
        if (!key && apiName !== 'dexscreener') {
            this.showToast(`API Key pentru ${apiName} nu este configurat`, 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            let isConnected = false;
            
            switch (apiName) {
                case 'helius':
                    isConnected = await this.testHeliusConnection(key);
                    break;
                case 'moralis':
                    isConnected = await this.testMoralisConnection(key);
                    break;
                case 'dexscreener':
                    isConnected = await this.testDexScreenerConnection();
                    break;
                case 'coingecko':
                    isConnected = await this.testCoinGeckoConnection(key);
                    break;
                case 'jupiter':
                    isConnected = await this.testJupiterConnection();
                    break;
                case 'birdeye':
                    isConnected = await this.testBirdeyeConnection(key);
                    break;
                case 'openai':
                    isConnected = await this.testOpenAIConnection(key);
                    break;
            }
            
            this.updateApiStatus(apiName, isConnected);
            this.showToast(
                `${apiName} ${isConnected ? 'conectat cu succes' : 'conexiune eșuată'}`,
                isConnected ? 'success' : 'error'
            );
            
        } catch (error) {
            console.error(`Error testing ${apiName}:`, error);
            this.updateApiStatus(apiName, false);
            this.showToast(`Eroare la testarea ${apiName}: ${error.message}`, 'error');
        }
        
        this.showLoading(false);
    }
    
    async testHeliusConnection(apiKey) {
        try {
            const response = await fetch(`${this.apiEndpoints.helius}addresses/So11111111111111111111111111111111111111112/balances?api-key=${apiKey}`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    async testMoralisConnection(apiKey) {
        try {
            const response = await fetch(`${this.apiEndpoints.moralis}erc20/metadata?chain=eth&addresses=0xdac17f958d2ee523a2206206994597c13d831ec7`, {
                headers: {
                    'X-API-Key': apiKey
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    async testDexScreenerConnection() {
        try {
            const response = await fetch(`${this.apiEndpoints.dexscreener}dex/search?q=SOL`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    async testCoinGeckoConnection(apiKey) {
        try {
            const response = await fetch(`${this.apiEndpoints.coingecko}ping`, {
                headers: apiKey ? { 'x-cg-demo-api-key': apiKey } : {}
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    async testJupiterConnection() {
        try {
            const response = await fetch(`${this.apiEndpoints.jupiter}tokens`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    async testBirdeyeConnection(apiKey) {
        try {
            const response = await fetch(`${this.apiEndpoints.birdeye}public/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=50`, {
                headers: {
                    'X-API-KEY': apiKey
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    async testOpenAIConnection(apiKey) {
        try {
            const response = await fetch(`${this.apiEndpoints.openai}models`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    updateApiStatus(apiName, isConnected) {
        const statusElement = document.getElementById(`${apiName}Status`);
        if (statusElement) {
            statusElement.textContent = isConnected ? 'Conectat' : 'Deconectat';
            statusElement.className = `api-status ${isConnected ? 'connected' : ''}`;
        }
        
        this.updateConnectionStatus();
    }
    
    updateConnectionStatus() {
        const connectedApis = document.querySelectorAll('.api-status.connected').length;
        const totalApis = document.querySelectorAll('.api-status').length;
        const statusElement = document.getElementById('connectionStatus');
        
        if (connectedApis === 0) {
            statusElement.textContent = 'Deconectat';
            statusElement.className = 'status-indicator';
        } else if (connectedApis === totalApis) {
            statusElement.textContent = 'Conectat';
            statusElement.className = 'status-indicator connected';
        } else {
            statusElement.textContent = `${connectedApis}/${totalApis} APIs`;
            statusElement.className = 'status-indicator';
        }
    }
    
    async startScanning() {
        if (this.scannerActive) return;
        
        // Check if required APIs are connected
        const requiredApis = ['dexscreener', 'birdeye'];
        const missingApis = requiredApis.filter(api => {
            const status = document.getElementById(`${api}Status`);
            return !status || !status.classList.contains('connected');
        });
        
        if (missingApis.length > 0) {
            this.showToast(`Conectați-vă mai întâi la: ${missingApis.join(', ')}`, 'error');
            return;
        }
        
        this.scannerActive = true;
        document.getElementById('scannerStatus').textContent = 'Activ';
        document.getElementById('scannerStatus').classList.add('active');
        
        this.showToast('Scanner pornit', 'success');
        
        // Start scanning interval
        this.scannerInterval = setInterval(() => {
            this.scanMarket();
        }, this.settings.checkInterval);
        
        // Initial scan
        this.scanMarket();
    }
    
    stopScanning() {
        this.scannerActive = false;
        if (this.scannerInterval) {
            clearInterval(this.scannerInterval);
            this.scannerInterval = null;
        }
        
        document.getElementById('scannerStatus').textContent = 'Oprit';
        document.getElementById('scannerStatus').classList.remove('active');
        
        this.showToast('Scanner oprit', 'info');
    }
    
    async scanMarket() {
        try {
            // Scan DexScreener for trending tokens
            const dexData = await this.scanDexScreener();
            
            // Scan Birdeye for new tokens
            const birdeyeData = await this.scanBirdeye();
            
            // Combine and analyze data
            const allTokens = [...dexData, ...birdeyeData];
            const filteredTokens = this.filterTokens(allTokens);
            
            // Analyze with LLM if available
            for (const token of filteredTokens) {
                if (this.apiKeys.openai) {
                    token.llmScore = await this.analyzeLLM(token);
                }
            }
            
            // Update UI
            this.updateScannerResults(filteredTokens);
            
        } catch (error) {
            console.error('Error scanning market:', error);
            this.showToast(`Eroare la scanare: ${error.message}`, 'error');
        }
    }
    
    async scanDexScreener() {
        try {
            const response = await fetch(`${this.apiEndpoints.dexscreener}dex/tokens/trending`);
            if (!response.ok) throw new Error('DexScreener API error');
            
            const data = await response.json();
            return data.schemaVersion ? data.pairs || [] : [];
        } catch (error) {
            console.error('DexScreener scan error:', error);
            return [];
        }
    }
    
    async scanBirdeye() {
        if (!this.apiKeys.birdeye) return [];
        
        try {
            const response = await fetch(`${this.apiEndpoints.birdeye}public/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=50`, {
                headers: {
                    'X-API-KEY': this.apiKeys.birdeye
                }
            });
            
            if (!response.ok) throw new Error('Birdeye API error');
            
            const data = await response.json();
            return data.data?.tokens || [];
        } catch (error) {
            console.error('Birdeye scan error:', error);
            return [];
        }
    }
    
    filterTokens(tokens) {
        return tokens.filter(token => {
            const liquidity = token.liquidity?.usd || token.liquidityUSD || 0;
            const volume24h = token.volume?.h24 || token.v24hUSD || 0;
            const marketCap = token.marketCap || token.mc || 0;
            
            // Apply filters
            if (liquidity < this.settings.minLiquidity) return false;
            if (marketCap > 1000000) return false; // Max 1M market cap
            if (volume24h === 0) return false;
            
            // Calculate volume/mcap ratio
            const volumeMcapRatio = marketCap > 0 ? volume24h / marketCap : 0;
            if (volumeMcapRatio < 0.5) return false;
            
            return true;
        }).map(token => ({
            symbol: token.symbol || token.baseToken?.symbol,
            name: token.name || token.baseToken?.name,
            address: token.address || token.baseToken?.address,
            price: token.priceUsd || token.price,
            priceChange24h: token.priceChange?.h24 || token.price24hChange,
            volume24h: token.volume?.h24 || token.v24hUSD,
            liquidity: token.liquidity?.usd || token.liquidityUSD,
            marketCap: token.marketCap || token.mc,
            llmScore: 0
        }));
    }
    
    async analyzeLLM(token) {
        if (!this.apiKeys.openai) return 0;
        
        try {
            const prompt = `Analyze this cryptocurrency token for pump potential on a scale of 1-100:
Symbol: ${token.symbol}
Price: $${token.price}
24h Change: ${token.priceChange24h}%
Volume: $${token.volume24h}
Liquidity: $${token.liquidity}
Market Cap: $${token.marketCap}

Consider factors like volume/mcap ratio, price momentum, and liquidity. Respond with only a number 1-100.`;
            
            const response = await fetch(`${this.apiEndpoints.openai}chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.openai}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 10,
                    temperature: 0.1
                })
            });
            
            if (!response.ok) throw new Error('OpenAI API error');
            
            const data = await response.json();
            const score = parseInt(data.choices[0].message.content.trim());
            return isNaN(score) ? 0 : Math.min(100, Math.max(0, score));
            
        } catch (error) {
            console.error('LLM analysis error:', error);
            return 0;
        }
    }
    
    updateScannerResults(tokens) {
        const tbody = document.getElementById('coinsTableBody');
        const detectedCount = document.getElementById('detectedCount');
        
        detectedCount.textContent = tokens.length;
        
        if (tokens.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nu s-au găsit token-uri care îndeplinesc criteriile</td></tr>';
            return;
        }
        
        tbody.innerHTML = tokens.map(token => `
            <tr>
                <td><strong>${token.symbol}</strong></td>
                <td>$${parseFloat(token.price || 0).toFixed(6)}</td>
                <td class="${(token.priceChange24h || 0) >= 0 ? 'price-positive' : 'price-negative'}">
                    ${(token.priceChange24h || 0).toFixed(2)}%
                </td>
                <td>$${this.formatNumber(token.volume24h || 0)}</td>
                <td>$${this.formatNumber(token.liquidity || 0)}</td>
                <td>$${this.formatNumber(token.marketCap || 0)}</td>
                <td>
                    <span class="llm-score ${this.getLLMScoreClass(token.llmScore)}">
                        ${token.llmScore}/100
                    </span>
                </td>
                <td>
                    <button class="action-btn buy" onclick="tradingSystem.quickBuy('${token.address}', '${token.symbol}')">Buy</button>
                    <button class="action-btn analyze" onclick="tradingSystem.analyzeToken('${token.address}')">Analyze</button>
                </td>
            </tr>
        `).join('');
    }
    
    getLLMScoreClass(score) {
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toFixed(0);
    }
    
    async quickBuy(tokenAddress, symbol) {
        if (!tokenAddress) {
            this.showToast('Adresă token invalidă', 'error');
            return;
        }
        
        // In a real implementation, this would execute the trade
        // For now, simulate the order
        const amount = 100; // Default $100
        const order = {
            id: Date.now(),
            type: 'buy',
            symbol: symbol,
            address: tokenAddress,
            amount: amount,
            timestamp: new Date(),
            status: 'pending'
        };
        
        this.showToast(`Plasare ordine BUY pentru ${symbol} ($${amount})`, 'info');
        
        // Simulate order execution
        setTimeout(() => {
            order.status = 'filled';
            this.positions.push({
                ...order,
                currentPrice: Math.random() * 0.001,
                entryPrice: Math.random() * 0.001,
                quantity: amount / (Math.random() * 0.001),
                pnl: 0
            });
            this.updatePositions();
            this.showToast(`Ordine executată pentru ${symbol}`, 'success');
        }, 2000);
    }
    
    async analyzeToken(tokenAddress) {
        this.showLoading(true);
        
        try {
            // Fetch detailed token data
            const tokenData = await this.getTokenDetails(tokenAddress);
            
            if (this.apiKeys.openai) {
                const analysis = await this.getDetailedLLMAnalysis(tokenData);
                this.showTokenAnalysis(tokenData, analysis);
            } else {
                this.showTokenAnalysis(tokenData, 'LLM analysis not available - configure OpenAI API key');
            }
            
        } catch (error) {
            this.showToast(`Eroare la analiza token: ${error.message}`, 'error');
        }
        
        this.showLoading(false);
    }
    
    async getTokenDetails(tokenAddress) {
        // Try to get data from multiple sources
        let tokenData = {};
        
        if (this.apiKeys.birdeye) {
            try {
                const response = await fetch(`${this.apiEndpoints.birdeye}public/token_overview?address=${tokenAddress}`, {
                    headers: { 'X-API-KEY': this.apiKeys.birdeye }
                });
                if (response.ok) {
                    const data = await response.json();
                    tokenData = { ...tokenData, ...data.data };
                }
            } catch (error) {
                console.error('Birdeye token details error:', error);
            }
        }
        
        return tokenData;
    }
    
    async getDetailedLLMAnalysis(tokenData) {
        const prompt = `Provide a detailed analysis of this cryptocurrency token:
        
Name: ${tokenData.name || 'Unknown'}
Symbol: ${tokenData.symbol || 'Unknown'}
Price: $${tokenData.price || 'Unknown'}
Market Cap: $${tokenData.marketCap || 'Unknown'}
Volume 24h: $${tokenData.volume24h || 'Unknown'}
Liquidity: $${tokenData.liquidity || 'Unknown'}

Please analyze:
1. Pump potential (1-100 score)
2. Risk factors
3. Technical indicators
4. Recommended action (Buy/Hold/Avoid)
5. Target price levels

Keep the response concise but informative.`;
        
        try {
            const response = await fetch(`${this.apiEndpoints.openai}chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.openai}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 500,
                    temperature: 0.3
                })
            });
            
            if (!response.ok) throw new Error('OpenAI API error');
            
            const data = await response.json();
            return data.choices[0].message.content;
            
        } catch (error) {
            return `LLM Analysis Error: ${error.message}`;
        }
    }
    
    showTokenAnalysis(tokenData, analysis) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Token Analysis: ${tokenData.symbol || 'Unknown'}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="token-details">
                        <p><strong>Name:</strong> ${tokenData.name || 'Unknown'}</p>
                        <p><strong>Price:</strong> $${tokenData.price || 'Unknown'}</p>
                        <p><strong>Market Cap:</strong> $${this.formatNumber(tokenData.marketCap || 0)}</p>
                        <p><strong>Volume 24h:</strong> $${this.formatNumber(tokenData.volume24h || 0)}</p>
                        <p><strong>Liquidity:</strong> $${this.formatNumber(tokenData.liquidity || 0)}</p>
                    </div>
                    <div class="llm-analysis">
                        <h4>LLM Analysis:</h4>
                        <pre>${analysis}</pre>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add modal styles if not exists
        if (!document.querySelector('#modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1200;
                }
                .modal-content {
                    background: var(--color-surface);
                    border-radius: var(--radius-lg);
                    padding: var(--space-24);
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--space-16);
                    border-bottom: 1px solid var(--color-border);
                    padding-bottom: var(--space-16);
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: var(--font-size-2xl);
                    cursor: pointer;
                    color: var(--color-text-secondary);
                }
                .token-details {
                    margin-bottom: var(--space-16);
                }
                .llm-analysis pre {
                    white-space: pre-wrap;
                    background: var(--color-secondary);
                    padding: var(--space-16);
                    border-radius: var(--radius-base);
                    font-family: var(--font-family-base);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    updatePositions() {
        const positionsList = document.getElementById('positionsList');
        const positionsGrid = document.getElementById('positionsGrid');
        
        if (this.positions.length === 0) {
            positionsList.innerHTML = '<p class="text-secondary">Nu există poziții active</p>';
            positionsGrid.innerHTML = '<p class="text-secondary">Nu există poziții active</p>';
            return;
        }
        
        const positionsHtml = this.positions.map(position => `
            <div class="position-card">
                <div class="position-header">
                    <h4>${position.symbol}</h4>
                    <span class="status ${position.status}">${position.status}</span>
                </div>
                <div class="position-stats">
                    <div class="position-stat">
                        <span class="position-stat-label">Quantity</span>
                        <span class="position-stat-value">${position.quantity?.toFixed(2) || 0}</span>
                    </div>
                    <div class="position-stat">
                        <span class="position-stat-label">Entry Price</span>
                        <span class="position-stat-value">$${position.entryPrice?.toFixed(6) || 0}</span>
                    </div>
                    <div class="position-stat">
                        <span class="position-stat-label">Current Price</span>
                        <span class="position-stat-value">$${position.currentPrice?.toFixed(6) || 0}</span>
                    </div>
                    <div class="position-stat">
                        <span class="position-stat-label">P&L</span>
                        <span class="position-stat-value ${position.pnl >= 0 ? 'text-success' : 'text-error'}">
                            $${position.pnl?.toFixed(2) || 0}
                        </span>
                    </div>
                </div>
                <div class="position-actions">
                    <button class="btn btn--sm btn--secondary" onclick="tradingSystem.sellPosition('${position.id}')">Sell</button>
                    <button class="btn btn--sm btn--outline" onclick="tradingSystem.updateStopLoss('${position.id}')">Set Stop Loss</button>
                </div>
            </div>
        `).join('');
        
        positionsList.innerHTML = positionsHtml;
        positionsGrid.innerHTML = positionsHtml;
    }
    
    updateDashboard() {
        // Update market stats
        document.getElementById('activeCoins').textContent = this.signals.length;
        document.getElementById('totalVolume').textContent = '$' + this.formatNumber(Math.random() * 10000000);
        document.getElementById('activeSignals').textContent = this.signals.length;
        
        // Update account balance
        const balance = this.positions.reduce((sum, pos) => sum + (pos.amount || 0), 0);
        document.getElementById('accountBalance').textContent = '$' + balance.toFixed(2);
        
        this.updatePositions();
    }
    
    updateAnalytics() {
        // Calculate performance metrics
        const totalPnl = this.positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
        const winningTrades = this.tradeHistory.filter(trade => trade.pnl > 0).length;
        const totalTrades = this.tradeHistory.length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0;
        const avgReturn = totalTrades > 0 ? (totalPnl / totalTrades) : 0;
        
        document.getElementById('totalPnl').textContent = '$' + totalPnl.toFixed(2);
        document.getElementById('winRate').textContent = winRate.toFixed(1) + '%';
        document.getElementById('totalTrades').textContent = totalTrades;
        document.getElementById('avgReturn').textContent = avgReturn.toFixed(2) + '%';
        
        this.updatePnlChart();
    }
    
    initializeCharts() {
        const ctx = document.getElementById('pnlChart');
        if (!ctx) return;
        
        this.pnlChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'P&L',
                    data: [],
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    updatePnlChart() {
        if (!this.pnlChart) return;
        
        // Generate sample P&L data
        const labels = [];
        const data = [];
        let cumulative = 0;
        
        for (let i = 0; i < 30; i++) {
            labels.push(`Day ${i + 1}`);
            const change = (Math.random() - 0.5) * 200;
            cumulative += change;
            data.push(cumulative);
        }
        
        this.pnlChart.data.labels = labels;
        this.pnlChart.data.datasets[0].data = data;
        this.pnlChart.update();
    }
    
    refreshMarketData() {
        this.showToast('Actualizare date piață...', 'info');
        this.updateDashboard();
    }
    
    saveSettings() {
        localStorage.setItem('tradingSettings', JSON.stringify(this.settings));
        this.showToast('Setări salvate', 'success');
    }
    
    loadSettings() {
        const saved = localStorage.getItem('tradingSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            
            // Update UI
            Object.keys(this.settings).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = this.settings[key];
                }
            });
            
            this.showToast('Setări încărcate', 'success');
        }
    }
    
    saveApiKeys() {
        localStorage.setItem('apiKeys', JSON.stringify(this.apiKeys));
    }
    
    loadApiKeys() {
        const saved = localStorage.getItem('apiKeys');
        if (saved) {
            this.apiKeys = JSON.parse(saved);
            
            // Update UI
            Object.keys(this.apiKeys).forEach(api => {
                const input = document.getElementById(`${api}Key`);
                if (input) {
                    input.value = this.apiKeys[api];
                }
            });
        }
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
    
    updateUI() {
        this.loadApiKeys();
        this.updateConnectionStatus();
        this.updateDashboard();
    }
}

// Global functions for HTML onclick handlers
function testApiConnection(apiName) {
    tradingSystem.testApiConnection(apiName);
}

function startScanning() {
    tradingSystem.startScanning();
}

function stopScanning() {
    tradingSystem.stopScanning();
}

function refreshMarketData() {
    tradingSystem.refreshMarketData();
}

function saveSettings() {
    tradingSystem.saveSettings();
}

function loadSettings() {
    tradingSystem.loadSettings();
}

function placeBuyOrder() {
    const tokenAddress = document.getElementById('tokenAddress').value;
    const amount = document.getElementById('tradeAmount').value;
    
    if (!tokenAddress) {
        tradingSystem.showToast('Introduceți adresa token-ului', 'error');
        return;
    }
    
    tradingSystem.quickBuy(tokenAddress, 'CUSTOM', parseFloat(amount));
}

function placeSellOrder() {
    tradingSystem.showToast('Funcția de vânzare va fi implementată', 'info');
}

// Initialize the system
let tradingSystem;

document.addEventListener('DOMContentLoaded', () => {
    tradingSystem = new CryptoTradingSystem();
    
    // Show welcome message
    setTimeout(() => {
        tradingSystem.showToast('Crypto Trading System inițializat. Configurați API key-urile pentru a începe.', 'info');
    }, 1000);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptoTradingSystem;
}