require('dotenv').config();
const pjson = require('pjson');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors(
    {
        origin: ['http://localhost:3000', `http://${process.env.MY_IP}:3000`]
    }
))
app.use(bodyParser.json());

app.listen(process.env.PORT, process.env.MY_IP, () => {
    console.log(`App ${pjson.name} started on port ${process.env.PORT}`);
});

require('./api/routes')(app);