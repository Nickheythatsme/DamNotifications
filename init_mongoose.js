const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

var mongo_uri = fs.readFileSync(path.join(__dirname,'mongodb_uri.txt'), {encoding: 'UTF8'});

mongoose.connect(mongo_uri, err => {
    if(err) {
        console.log("Mongo error. Storage is not enabled:");
        console.log(err);
    }
});

mongoose.Promise=global.Promise;
var db = mongoose.connection;
db.on('error', () => {
    console.log('Mongodb error')
});
db.on('open', (err) => {
    if(err) console.log(err);
    else console.log('database open');
});

module.exports = mongoose;