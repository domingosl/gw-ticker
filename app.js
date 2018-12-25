const mongoose = require('mongoose');
const moment = require('moment');
const tz = require('moment-timezone');
const express = require('express');
const app = express();

const query = require('./query');


const dbUri = "mongodb://localhost:27017/growish-assets";

mongoose.Promise = global.Promise;

const connection = mongoose.connect(dbUri, { useNewUrlParser: true });


connection
    .then(db => {
        console.log("Connected to DB.");
        return db;
    })
    .catch(err => {
        if (err.message.code === 'ETIMEDOUT') {
            console.log('Attempting to re-establish database connection.');
            mongoose.connect(dbUri);
        } else {
            console.log('Error while attempting to connect to database:', err.message);
            process.exit();
        }
    });

const insts = [
    { name: "card_all", query: { _class: "contribution", succeeded : 1, completed : 1 }, target: "amount" },
    { name: "withdrawal_all", query: { _class: "withdrawalContribution", mangopayStatus : "ACCEPTED" }, target: "amount" },
    { name: "cash_all", query: { _class: "cashContribution", state : "completed" }, target: "amount" },
    { name: "new_users", query: { _class: "user" }, target: null },
    { name: "new_wallets", query: { _class: "wallet" }, target: null },
    { name: "new_lists", query: { _class: "listWallet" }, target: null },
];


app.use((req, res, next) => {

    res.resolve = (payload) => {

        let timeObj = moment().tz('Europe/Rome');

        payload.dateTimeIT = {
            hours: timeObj.format('HH'),
            minutes: timeObj.format('mm'),
            seconds: timeObj.format('ss'),
            day: timeObj.format('DD'),
            month: timeObj.format('MM'),
            year: timeObj.format('YYYY')
        };

        //payload.dateTimeIT = timeObj.format('X');

        return res.json(payload);
    };

    next();
});

app.get('/transactions/:range', function (req, res) {

    let n = 0;
    let response = {};

    console.log("Transactions endpoint called.", req.params);

    insts.forEach(inst => {

        query(inst.query, inst.target, req.params.range).then((result) => {

            response[inst.name] = result;

            n++;
            if(n >= insts.length)
                return res.resolve(response);

        }).catch((err) => {
            console.log(err);
        });

    });


});

app.use((req, res) => { res.status(404).json({})});

app.listen(5476, function () {
    console.log('Server running.');
});