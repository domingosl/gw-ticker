const mongoose = require('mongoose');
const moment = require('moment');
const tz = require('moment-timezone');
const express = require('express');
const app = express();
const cors = require('cors');
const twoHundredCrowd = require('./twohundred-crowd');
const bodyParser = require('body-parser');

const query = require('./query');


const dbUri = "mongodb://localhost:27017/growish-assets";

mongoose.Promise = global.Promise;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
            //process.exit();
        }
    });

const insts = [
    { name: "card_all", query: { _class: "contribution", succeeded : 1, completed : 1 }, target: "amount", timeProperty: "updateDate" },
    { name: "withdrawal_all", query: { _class: "withdrawalContribution", mangopayStatus : "ACCEPTED" }, target: "amount", timeProperty: "updateDate" },
    { name: "cash_all", query: { _class: "cashContribution", state : "completed" }, target: "amount", timeProperty: "updateDate" },
    { name: "new_users", query: { _class: "user" }, target: null, timeProperty: "creationDate" },
    { name: "new_wallets", query: { _class: "wallet" }, target: null, timeProperty: "creationDate" },
    { name: "new_lists", query: { _class: "listWallet" }, target: null, timeProperty: "creationDate" },
];

app.use(cors());

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

        query(inst.query, inst.target, req.params.range, inst.timeProperty).then((result) => {

            response[inst.name] = result;

            n++;
            if(n >= insts.length)
                return res.resolve(response);

        }).catch((err) => {
            console.log(err);
        });

    });


});

app.get('/200crowd', function (req, res) {

    twoHundredCrowd().then((response) => {
        return res.json(response);
    }).catch(() => {
        return res.status(500).send();
    });

});


let investorsMessage = "";

app.post('/slack-hook/investors-message/', function (req, res) {


    const authUsers = ['U51009S4A', 'U53S51SJZ'];

    if(authUsers.indexOf(req.body.user_id) < 0)
        return res.send("Utente non autorizzato al invio di messaggi");

    if(req.body.text.length < 5 || req.body.text.length > 300)
        return res.send("Il messaggio non può essere inferiore a 5 caratteri o superiore a 300");


    investorsMessage = req.body.text;

    res.send("Messaggio inviato agli investors!");


});

app.get('/lametric', function (req, res) {

    let n = 0;
    let response = {};

    insts.forEach(inst => {

        query(inst.query, inst.target, 'month', inst.timeProperty).then((result) => {

            response[inst.name] = result;

            n++;
            if(n >= insts.length)
                return res.json({
                    "frames": [
                        {
                            icon: "a2147",
                            text: 'Transato',
                            duration: 1000
                        },
                        {
                            icon: "a2147",
                            text: String(response['card_all'] + response['withdrawal_all'] + response['cash_all'])
                        },
                        {
                            icon: null,
                            text: 'Pagamenti',
                            duration: 1000
                        },
                        {
                            icon: null,
                            text: "soon!"
                        },
                        {
                            icon: "i5337",
                            text: 'Utenti',
                            duration: 1000
                        },
                        {
                            icon: "i5337",
                            text: String(response['new_users']),
                            duration: 5000
                        },
                        {
                            text: investorsMessage || "GROWISH",
                            icon: "i27913"
                        },
                        {
                            icon: null,
                            text: 'Partners',
                            duration: 1000
                        },
                        {
                            icon: null,
                            text: "soon!"
                        },
                    ]
                })

        }).catch((err) => {
            console.log(err);
        });

    });

});

app.use((req, res) => { res.status(404).json({})});

app.listen(5476, function () {
    console.log('Server running.');
});