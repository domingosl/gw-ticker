const cheerio = require('cheerio');
const request = require('request');
const cache = require('./cache');

const cacheId = "twoHundredCrowd";

module.exports = () => {
    return new Promise((resolve, reject)=>{

        const cached = cache.get(cacheId);

        if(cached) {
            console.log("200Crowd Resolving from cache...");
            return resolve(cached);
        }

        console.log("200Crowd Resolving from webpage...");

        request('https://200crowd.com/campaign/details/growishpay', function (error, response, body) {

            if(error)
                return reject();

            if(response.statusCode !== 200)
                return reject();

            const $ = cheerio.load(body);

            const collected = parseInt(($($('.campaign-info .funding-info').find('.number')[0]).text()).replace(" €","").replace(".","").split(",")[0]);

            if(!collected || isNaN(collected))
                return res.status(500).send();


            const _response = {
                collected: collected
            };

            cache.set(cacheId, _response, 300000);

            resolve(_response);

        });
    });
};