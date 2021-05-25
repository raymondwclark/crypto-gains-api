function balanceController() {
    const GateApi = require('gate-api');
    const axios = require('axios');
    const crypto = require('crypto');
    const qs = require('qs');
    const dbClient = require('../lib/db.client');

    this.getBinanceBalance = async () => {
        const data = {
            recvWindow: 59999,
            timestamp: Date.now()
        }

        const dataQueryString = qs.stringify(data);
        const signature = crypto.createHmac('sha256', process.env.BINANCE_SECRET_KEY).update(dataQueryString).digest('hex');

        try {
            // get wallet contents
            const result = await axios.get(process.env.BINANCE_BASE_URL + `/api/v3/account?${dataQueryString}&signature=${signature}`, {
                headers: {
                    'User-Agent': 'investment-gains-v1.0',
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*', 
                    'X-MBX-APIKEY': process.env.BINANCE_API_KEY
                }
            });

            // get coins held
            let heldCoins = result.data.balances.filter((asset) => {
                return asset.free > 0 && asset.asset !== 'USD';
            });

            await Promise.all(heldCoins.map(async (coin) => {
                try {
                    // get current price of coins
                    const result = await axios.get(process.env.BINANCE_BASE_URL + `/api/v3/avgPrice?${qs.stringify({ symbol: coin.asset + 'USD' })}`, {
                        'User-Agent': 'investment-gains-v1.0',
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*', 
                        'X-MBX-APIKEY': process.env.BINANCE_API_KEY
                    });

                    // total values
                    heldCoins.map((aCoin) => {
                        if (aCoin.asset === coin.asset) {
                            aCoin.totalHeld = aCoin.free * result.data.price;
                        }
                    });

                } catch (err) {
                    throw new Error(err);
                }
            }));

            let totalValue = 0;

            heldCoins.map((coin) => {
                totalValue += coin.totalHeld;
            });

            return totalValue.toFixed(2);
        } catch (err) {
            throw new Error(err);
        }
    }

    // gets balances of alt coins from trust wallet
    this.getAltcoinBalance = (contractAddress, walletAddress, bscApiKey, symbol) => {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await axios.get(`https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${walletAddress}&tag=latest&apikey=${bscApiKey}`);
                let totalCoin = result.data.result * 0.000000001;
    
                if (symbol === 'bonfire') {
                    try {
                        let result = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?slug=${symbol}`, {
                            headers: {
                                'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
                            }
                        })

                        let currentPrice = result.data.data[9522].quote.USD.price;
                        let coinValue = totalCoin * currentPrice;
                        return resolve(coinValue.toFixed(2));
                    } catch (err) {
                        return reject(err);
                    }
                } else {
                    let gateApi = new GateApi.SpotApi();
                    var opts = {
                        'currencyPair': symbol
                    };

                    gateApi.listTickers(opts, (err, data, response) => {
                        if (err) return reject(err);
                        let currentPrice = JSON.parse(response.text)[0].last;
                        
                        let coinValue = totalCoin * currentPrice;
            
                        return resolve(coinValue.toFixed(2));
                    });
                }
            } catch (err) {
                return reject(err);
            }
        });
    };

    // endpoint to return all balances
    this.getBalances = async (req, res) => {
        try {
            let binanceBalance = await this.getBinanceBalance();
            let safemoonBalance = await this.getAltcoinBalance(process.env.SAFEMOON_CONTRACT_ADDRESS, process.env.SAFEMOON_WALLET, process.env.BSC_API_KEY, 'SAFEMOON_USDT');
            let bonfireBalance = await this.getAltcoinBalance(process.env.BONFIRE_CONTRACT_ADDRESS, process.env.BONFIRE_WALLET, process.env.BSC_API_KEY, 'bonfire')

            let total = Number(Number(binanceBalance) + Number(safemoonBalance) + Number(bonfireBalance)).toFixed(2);

            let lastPulledTimestamp = await dbClient.getObject('timestamp');

            res.status(200).send({ balances: 
                {   
                    binance: { last: await dbClient.getObject('binance'), current: binanceBalance },
                    safemoon: { last: await dbClient.getObject('safemoon'), current: safemoonBalance },
                    bonfire: { last: await dbClient.getObject('bonfire'), current: bonfireBalance },
                    total: { last: await dbClient.getObject('total'), current: total }
                },
                lastPulled: lastPulledTimestamp,
            });

            // Only set after it's been 24 hours or no entry
            if (Math.abs(new Date() - lastPulledTimestamp) >= (60 * 60 *24 * 1000) || lastPulledTimestamp === undefined) {
                dbClient.writeObject('binance', binanceBalance);
                dbClient.writeObject('safemoon', safemoonBalance);
                dbClient.writeObject('bonfire', bonfireBalance);
                dbClient.writeObject('total', total);
            }
        } catch (err) {
            return res.status(500).send({ error: err });
        }
    }
}

module.exports = new balanceController();