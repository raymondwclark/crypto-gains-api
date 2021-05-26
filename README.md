# Crypto Gains API
API for tracking all my held cryptocurrency

### Setup
- Download project
- Create a `.env` file at root with the following contents
```
MY_IP=<your router ip address>
PORT=<port || 8000>

BINANCE_BASE_URL=https://api.binance.us
BINANCE_API_KEY=<your api key>
BINANCE_SECRET_KEY=<your secret key>

SAFEMOON_CONTRACT_ADDRESS=<contract for safemoon (find on safemoon.net)>
SAFEMOON_WALLET=<your safemoon wallet address>
BSC_API_KEY=<api key for bscscan.com>

BONFIRE_CONTRACT_ADDRESS=<contract for bonfire>
BONFIRE_WALLET=<your bonfire wallet address>

LIVECOINWATCH_API_KEY=<api key for livecoinwatch.com>
```
- Run `npm install` at project root
- Run `npm run local` for local development or `npm start`