const mongoose = require('mongoose');
const moment = require('moment');
const cache = require('./cache');
const crypto = require('crypto');

module.exports = (query, targetProperty, range, timeProperty) => {

    return new Promise((resolve, reject)=>{

        const cacheId = crypto.createHash('md5').update(JSON.stringify(query) + targetProperty + range).digest("hex");
        const cached = cache.get(cacheId);

        if(cached) {
            console.log("Resolving from cache...");
            return resolve(cached);
        }

        console.log("Resolving from DB...");

        const schema = {};

        if(targetProperty)
            schema[targetProperty] = Number;

        const anyModel = mongoose.model('Any' + Math.random(), new mongoose.Schema( schema, { collection: "assets" } ));

        switch (range) {

            case 'today':
                query[timeProperty] = { $gt: moment().startOf('day').toDate(), $lte: moment().endOf('day').toDate() };
                break;
            case 'week':
                query[timeProperty] = { $gt: moment().startOf('isoWeek').toDate(), $lte: moment().endOf('isoWeek').toDate() };
                break;
            case 'month':
                if(moment().isSame(moment().startOf('month'), 'day'))
                    query[timeProperty] = { $gt: moment().subtract(1, 'months').startOf('month').toDate(), $lte: moment().subtract(1, 'months').endOf('month').toDate() };
                else
                    query[timeProperty] = { $gt: moment().startOf('month').toDate(), $lte: moment().endOf('month').toDate() };
                break;
            case 'ytd':
                query[timeProperty] = { $gt: moment().startOf('year').toDate(), $lte: moment().endOf('day').toDate() };
                break;
            case 'all':
                delete query[timeProperty];
                break;
            default:
                return reject("Invalid range");

        }

        console.log("Data requested:", JSON.stringify(query));

        anyModel.find(query).then((assets) => {

            let total = 0;
            let result;

            if(targetProperty) {
                assets.forEach(asset => {
                    total += asset[targetProperty];
                });

                result = Math.round(total / 100);
            } else {
                result = assets.length;
            }

            cache.set(cacheId, result, range === 'today' ? 300000 : 10800000);
            return resolve(result);

        }).catch((err) => {
            reject(err);
        });


    });

};