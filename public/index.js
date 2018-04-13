console.log('test');

// var base_href = 'http://localhost:8080/'
var base_href = 'http://dam-notifications.appspot.com/';


// Old compatibility code, no longer needed.
var httpRequest;
if (window.XMLHttpRequest) { // Mozilla, Safari, IE7+ ...
    httpRequest = new XMLHttpRequest();
} else if (window.ActiveXObject) { // IE 6 and older
    httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
}

var hours = 200;
function makeRequest() {
    httpRequest = new XMLHttpRequest();

    if (!httpRequest) {
        alert('Giving up :( Cannot create an XMLHTTP instance');
        return false;
    }
    httpRequest.onloadend = makeDischargeGraph;
    httpRequest.open('GET', url + 'api/data?variable=discharge&time='+hours);
    httpRequest.send();

}

function makeDischargeGraph() {
    var res = JSON.parse(httpRequest.responseText);
    var layout = {
        title: 'Discharge',
        xaxis: {
            title: 'Hours before now'
        },
        yaxis:{
            title: 'ft3/sec'
        }
    };
    makeGraph('discharge', layout, res);

    httpRequest = new XMLHttpRequest();
    httpRequest.onloadend = makeGageHeightGraph;
    httpRequest.open('GET', url + 'api/data?variable=gage_height&time='+hours);
    httpRequest.send();
}

function makeGageHeightGraph() {
    var res = JSON.parse(httpRequest.responseText);
    var layout = {
        title: 'Gage Height',
        xaxis: {
            title: 'Hours before now'
        },
        yaxis:{
            title: 'ft'
        }

    };
    makeGraph('gage_height', layout, res);
}


// Calculate the number of hours since now
function hoursSinceNow(now, timeString){
    var a = new Date(timeString).getTime();
    var diff = a - now;
    return diff / 1000 / 60 / 60; // miliseconds -> hours
}

// Make a graph from a variable from the JSON data, and put it in the div matching the id
function makeGraph(id, layout, data) {

    var values_x = [];
    var values_y = [];

    var now = Date.now();

    for(i in data){
        values_y.push(data[i].value);
        values_x.push(
            hoursSinceNow(now, data[i].dateTime)
        );
    }
    var data = {
        x: values_x, 
        y: values_y, 
    };
    Plotly.newPlot(id, [data], layout);
}

window.onresize = function() {
    Plotly.Plots.resize(document.getElementById('gage_height'));
    Plotly.Plots.resize(document.getElementById('discharge'));

    // Currently a bug where window does not resize
};


makeRequest();