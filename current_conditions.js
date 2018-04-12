const fs = require('fs');
const path = require('path');
const https = require('https');
const mongoose = require('./init_mongoose');

const data_uri = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=14220500&parameterCd=00060,00065&siteStatus=all";

class ValueUpdater {

    constructor(uri = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=14220500&parameterCd=00060,00065&siteStatus=all") {
        this.current = null;
        this.uri = uri;
        this.updateFrequency = 15 * 1000 * 60; // 15 minutes

        // Create new schemas
        this.data_point = mongoose.model('data_point', new mongoose.Schema({
            gage_height: {
                value: Number,
                dateTime: Date
            },
            discharge: {
                value: Number,
                dateTime: Date
            }
        }));

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

    set frequency(minutes) {
        this.updateFrequency = minutes * 1000 * 60;
    }

    get site_info() {
        return this.current.site_info;
    }

    // Wrapper for the parseValues function
    parseValues(json){
        return {
            gage_height: this.parseValuesImp(json, 1),
            discharge: this.parseValuesImp(json, 0)
        }
    }

    // Parse VALUE info from a variable (either is gage height or not)
    parseValuesImp(json, is_gage_height) {
        let to_ret = null;
        try{
            to_ret = {
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
                fs.writeFileSync( 
                    path.join(
                        __dirname, 
                        'public/data/current.json'), 
                        String(body));
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
    logValues(values, callback) {
        this.current = values;

        // Create new data point on mongodb
        this.data_point.create(
            {
                gage_height: {
                    value: values.gage_height.value,
                    dateTime: values.gage_height.dateTime
                },
                discharge: {
                    value: values.discharge.value,
                    dateTime: values.discharge.dateTime
                }
            },
            (err) => {
                if(err) console.log(err);
                else console.log('created new data pont');
                callback(err, values);
            }
        )
    }

    update(callback) {
        this.makeRequest( (err, body) => {
            if (err) {
                callback(err, null);
            }
            else {
                let values = this.parseValues(body);
                this.logValues(values, callback);
            }
        });
    }
}


var updater = new ValueUpdater();
updater.update( (err, values) => {
    if (err) console.log(err);
    else console.log(values)
});

module.exports = {
    current : {gage_height:'7ft', discharge:'2000ft^3/sec'}
}