const mongoose = require('mongoose');
const moment = require('moment');

module.exports = (query, targetProperty, range) => {

    return new Promise((resolve, reject)=>{

        const schema = {};
        schema[targetProperty] = Number;

        const anyModel = mongoose.model('Any' + Math.random(), new mongoose.Schema( schema, { collection: "assets" } ));

        switch (range) {

            case 'today':
                query['updateDate'] = { $gt: moment().startOf('day').toDate(), $lte: moment().endOf('day').toDate() };
                break;
            case 'week':
                query['updateDate'] = { $gt: moment().startOf('isoWeek').toDate(), $lte: moment().endOf('isoWeek').toDate() };
                break;
            case 'month':
                query['updateDate'] = { $gt: moment().startOf('month').toDate(), $lte: moment().endOf('month').toDate() };
                break;
            case 'ytd':
                query['updateDate'] = { $gt: moment().startOf('year').toDate(), $lte: moment().endOf('day').toDate() };
                break;
            case 'all':
                delete query.updateDate;
                break;
            default:
                return reject("Invalid range");

        }

        console.log("Data requested:", JSON.stringify(query));

        anyModel.find(query).then((assets) => {

            let total = 0;

            assets.forEach(asset => {
                total += asset[targetProperty];
            });

            resolve(Math.round(total/100));

        }).catch((err) => {
            reject(err);
        });


    });

};