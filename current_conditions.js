const fs = require('fs');
const path = require('path');
var events = require('events');
const https = require('https');
const mongoose = require('./init_mongoose');
const sleep = require('system-sleep');

// USGS json URL
const data_uri = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=14220500&parameterCd=00060,00065&siteStatus=all";

class ValueUpdater {

    constructor(uri = data_uri) {
        this.current = null;
        this.uri = uri;
        this.frequency = 15 * 1000 * 60; // 15 minutes

        this.emitter = new events.EventEmitter();

        // Create new schemas
        this.data_point = mongoose.model(
            'data_point', new mongoose.Schema({
                    variable: String,
                    value: Number,
                    dateTime: Date
                })
            );

        this.data_info = mongoose.model('data_info', new mongoose.Schema({
            site_info: {
                name: String,
                location: {
                    latitude: Number,
                    longitude: Number
                }
            },
            values: {
                gage_height:{
                    units: String,
                },
                discharge:{
                    units: String,
                }
            }
        }));
    }

    get site_info() {
        return this.current.site_info;
    }

    // Wrapper for the parseValues function
    parseValues(json) {
        return [
            this.parseValuesImp(json, 1),
            this.parseValuesImp(json, 0)
        ]
    }

    // Parse VALUE info from a variable (either is gage height or not)
    parseValuesImp(json, is_gage_height) {
        let to_ret = null;
        try{
            to_ret = {
                'variable': is_gage_height ? 'gage_height' : 'discharge', // set the variable name
                'value' : json['value']['timeSeries'][is_gage_height]['values'][0]['value'][0]['value'],
                'dateTime' : json['value']['timeSeries'][is_gage_height]['values'][0]['value'][0]['dateTime'],
                'units' : json['value']['timeSeries'][is_gage_height]['variable']['unit']['unitCode']
            }
        } catch(e) {
            console.log('Error parsing value: (is gage_height: ' + is_gage_height + '): ' + e);
            to_ret = 'Parse error'
        }
        return to_ret;
    }

    // Parse SITE info from the json
    parseSiteInfo(json) {
        let to_ret = null;
        try{ 
            to_ret =  {
                'name': json['value']['timeSeries'][0]['sourceInfo']['siteName'],
                'location': {
                    latitude: json['value']['timeSeries'][0]['sourceInfo']['geoLocation']['geogLocation']['latitude'],
                    longitude: json['value']['timeSeries'][0]['sourceInfo']['geoLocation']['geogLocation']['longitude'],
                }
            }
        } catch (e){
            console.log('Error parsing site info: ' + e);
            to_ret = 'Parse error';
        }
        return to_ret;
    }

    // Make the request to the uri
    makeRequest(callback) {
        https.get(data_uri, res => {
            res.setEncoding('utf8');
            let body = "";

            // Add new data from the buffer into the body
            res.on('data', data => {
                body += data;
            });

            // Catch the data after it's finished downloading
            res.on('end', () => {
                body = JSON.parse(body);
                callback(null, body);
            });

            res.on('error', (err) => {
                console.log(err);
                body = 'error';
                callback(new Error(err), null);
            });
        });
    }

    // Log values to current.json and on mongodb
    logValue(value, callback) {

        // Create new data point on mongodb
        var new_point = new this.data_point();
        
        new_point.variable = value.variable;
        new_point.value = value.value;
        new_point.dateTime = value.dateTime;

        new_point.save( err => { // Save the new data point, make the callback
            if(err) console.log('Error adding new data point: ' + new_point);
            callback(err, new_point);
        });
    }

    // Commence the update
    update() {
        this.makeRequest( (err, body) => {
            if (err) console.log(err);
            else {
                let values = this.parseValues(body); // Add functions here to expand to different variable types
                this.current = values; // Set the current
                for(var i=0; i < values.length; ++i) {
                    this.logValue(values[i], (err, value) => {
                        if(err) console.log(err);
                        else console.log('Added data point for ' + value.variable);
                    });
                    this.emitter.emit('updateLoop');
                }
            }
        });
    }

    // Wrapper for update function
    updateLoop() {
        setTimeout( () => {
           this.update();
        }, this.frequency);
    }

    // Call the update function, listen for the update call
    doUpdate(bool=true) {
        if(bool == false)
            this.emitter.removeAllListeners('updateLoop');
        else {
            this.emitter.addListener('updateLoop', () => {
                this.updateLoop();
            });
            this.update();
        }
    }
}



var updater = new ValueUpdater();
updater.doUpdate();

setTimeout( () => {
    updater.doUpdate(false);
}, 6000);

module.exports = updater;