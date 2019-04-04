let collection = {};

function roughSizeOfObject( object ) {

    var objectList = [];
    var stack = [ object ];
    var bytes = 0;

    while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
    }
    return bytes;
}
module.exports = {

    get: function (id) {

        console.log('Cache size',roughSizeOfObject(collection));

        if(collection[id])
            if(collection[id].expirationDate > new Date().getTime())
                return collection[id].data;
            else
                delete collection[id];

        return null;

    },

    set: function (id, data, expTime) {
        collection[id] = { data: data, expirationDate: new Date().getTime() + expTime };
        console.log('Cache size', roughSizeOfObject(collection));
    }

};