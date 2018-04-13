const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const currentConditions = require('./current_conditions');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public/dist')));
app.use(express.static(path.join(__dirname, 'public/historical')));

var port = process.env.PORT || 8080;
var router = express.Router();

function handleError(req, res, err){
    console.log(req.url + err)
    res.send('Error');
}

// API routing ===============================
router.get('/data/all', (req, res) => {
    currentConditions.data_point
    .find( {} )
    .sort(
    {
        "dateTime": -1
    })
    .exec((err, data_points) => {
        if(err) {
            return handleError(req, res, err);
        }
        else {
            res.json(data_points);
        }
    });
});

// Return the current data for all variables 
router.get('/current', (req, res) => {
    res.json(currentConditions.current);
});

// TODO create function to send a csv from all the data points
const MAX_TIME_MS = 1*1000*60*60; // one hour
router.get('/csv/gage_height', (req,res) =>{
    // TODO check the date of the file, make a new one if it's too old
    var p = path.join(__dirname, 'temp/gage_height.csv');
    fs.exists(p, exists => {
        if(exists) {
            fs.stat(p,(err, stats) => {
                if (stats.birthtime - Date.now() > MAX_TIME)
                    makeNewCSV('gage_height');
            });
        }
    });
})

router.get('/csv/gage_height', (req,res) =>{

})


// Add the api routing to the app on the '/api' param
app.use('/api', router);

// Route all other traffic to frontend
app.get('*', (req, res) => {
    console.log('GET: ' + req.url);
    res.sendFile(path.join(__dirname, 'public/dist/index.html'));
});

console.log('port: ' + port);
app.listen(port);
console.log('Listening on port: ' + port);