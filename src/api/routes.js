module.exports = async (app) => {
    const balanceController = require('../controllers/balance.controller');

    app.get('/api/balances', await balanceController.getBalances);
}