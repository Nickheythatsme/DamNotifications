const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const currentConditions = require('./current_conditions');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public/')));
app.use(express.static(path.join(__dirname, 'public/data')));

var port = process.env.PORT || 8080;
var router = express.Router();

function handleError(req, res, err, message){
    console.log('Error param: ' + req.url + ':\n' + '\tMessage: ' + message + '\n\tError message: ' + err);
    res.send(message)
}

// API routing ===============================
router.get('/data', (req, res) => {
    // Find the variable. No variable means all variables 
    // Viable options ATM are: discharge, gage_height
    let variable = {};
    if (req.query.variable)
        variable.variable = req.query.variable;

    // Get the hours past from the query. Finds the data after X hours before now.
    var time = 0
    if (req.query.time) {
        time = Date.now() - (Number(req.query.time) * 60 * 60 * 1000) // Hours -> miliseconds
    }

    // Execute and define the query with the above parameters
    currentConditions.data_point
        .find(variable)
        .where("dateTime").gt(time)
        .sort({"dateTime": -1 })
        .exec((err, data) => {
            if (err) 
                handleError(req, res, err, 'Error retrieving variable data for ' + req.query.variable);
            else res.json(data);
        });
});

// Return the current data for a variables. No variable query sends all variables
router.get('/current', (req, res) => {
    let result = currentConditions.current;
    if(req.query.variable){
        for(obj in currentConditions.current) {
            if(currentConditions.current[obj].variable == req.query.variable) {
                result = currentConditions.current[obj];
            }
        }
    }
    res.send(result);
});

// TODO create function to send a csv from all the data points
const MAX_TIME_MS = 1*1000*60*60; // one hour
router.get('/csv/gage_height', (req,res) =>{
    // TODO check the date of the file, make a new one if it's too old
    /*
    var p = path.join(__dirname, 'temp/gage_height.csv');
    fs.exists(p, exists => {
        if(exists) {
            fs.stat(p,(err, stats) => {
                if (stats.birthtime - Date.now() > MAX_TIME)
                    makeNewCSV('gage_height');
            });
        }
    });
    */
    res.send('not implemened yet!');
})

// Add the api routing to the app on the '/api' param
app.use('/api', router);

// Route all other traffic to frontend
app.get('*', (req, res) => {
    res.redirect('/');
    console.log('GET: ' + req.url);
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

console.log('port: ' + port);
app.listen(port);
console.log('Listening on port: ' + port);