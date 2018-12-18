const mongoose = require('mongoose');
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
    { name: "card_all", query: { _class: "contribution", succeeded : true, completed : true }, target: "amount" },
    { name: "withdrawal_all", query: { _class: "withdrawalContribution", mangopayStatus : "ACCEPTED" }, target: "amount" },
    { name: "cash_all", query: { _class: "cashContribution", state : "completed" }, target: "amount" }
];


app.get('/transactions/:range', function (req, res) {

    let n = 0;
    let response = {};

    insts.forEach(inst => {

        query(inst.query, inst.target, req.params.range).then((result)=>{
            response[inst.name] = result + " EUR";

            n++;
            if(n >= insts.length)
                return res.json(response);

        }).catch((err) => {
            console.log(err);
        });

    });


});

app.use((req, res) => { res.status(404).json({})});

app.listen(5476, function () {
    console.log('Server running.');
});