function dbClient() {
    const db = require('croxydb');
    this.writeObject = async (balanceName, balance) => {
        try {
            db.set(`balances.${balanceName}`, balance);
            db.set('balances.timestamp', new Date());
            return;
        } catch (err) {
            throw new Error(err);
        }
    };

    this.getObject = async (balanceName) => {
        try {
            return db.get(`balances.${balanceName}`);
        } catch (err) {
            throw new Error(err);
        }
    };
}

module.exports = new dbClient();

