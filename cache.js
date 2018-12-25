let collection = {};

module.exports = {



    get: function (id) {

        if(collection[id])
            if(collection[id].expirationDate > new Date().getTime())
                return collection[id].data;
            else
                delete collection[id];

        return null;

    },

    set: function (id, data, expTime) {
        collection[id] = { data: data, expirationDate: new Date().getTime() + expTime };
    }

};