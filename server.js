/*-------------------------------------------------------------------
*************************MYSTIC SERVER*******************************
Description:    Server back-end for home power and monitoring system. 
                Developed for 48481 ICT Design at UTS 2016.
Author:         Viviana Capote
Last Updated:   18/10/2016
-------------------------------------------------------------------*/
/*-------------------------------------------------------------------
NPM IMPORTS
-------------------------------------------------------------------*/
//Import express library/module
const express = require('express');

//Import bodyparser to process POST data
const bodyParser = require('body-parser');

//Import mongoose to manage access to sensordb
const mongoose = require('mongoose');

//Import our own custom sensor model
const sensorModel = require('./models/sensor-model');

//Time formatting module
const moment = require('moment');

//Import fs module for file read/write
const fs = require('fs');

//Import csv module for file parsing
const parse = require('csv-parse');

/*-------------------------------------------------------------------
CUSTOM IMPORTS
-------------------------------------------------------------------*/
//Import sensor tag class
const TI_SensorTag = require('./ti-sensortag');

//Import custom logger class
const Logger = require('./logger');

/*-------------------------------------------------------------------
GLOBAL VARIABLES
-------------------------------------------------------------------*/

//Sensor database directory
const dbDir = 'mongodb://localhost/sensordb';

//Array to hold dynamically created sensortag objects
var sensorTags = []; 

const MAX_INDEX = 14400;

var powerIndex;

var powerData = {};

const VOLTAGE = 230;
/*-------------------------------------------------------------------
SENSOR OBJECT/CONFIG HANDLING
-------------------------------------------------------------------*/

function verifySensorData()
{
    return;//TO DO
}


function addSensor(sensor)
{
    sensorTags.push(new TI_SensorTag(sensor));

    if (sensor.loggingEnabled == 'true')
        connectSensors();
}

function deleteSensor(sensor)
{
    console.log("Deleting sensor with UUID: " + sensor.UUID);

    for (var i = 0; i < sensorTags.length; i++)
    {
        if ((sensorTags[i].getID() == sensor.id))
        {
            if (sensorTags[i].isConnected())
                sensorTags[i].disconnect();

            console.log('Deleting sensor object at index: %d with UUID: %s', i, sensor.UUID);
            sensorTags.splice(i, 1);
            break;
        }
    }
}

function connectSensors()
{
    console.log("Connecting sensors..");
    for (var i = 0; i < sensorTags.length; i++)
    {
        if ((sensorTags[i].getLoggingEnabled() == 'true') && (sensorTags[i].isConnected() == false))
        {
            console.log("Logging status is: %s", sensorTags[i].getLoggingEnabled());
            sensorTags[i].discover();
        }
    }
}

function disconnectSensors()
{
    console.log("Disconnecting sensors...");
    var num = 0;

    for (var i = 0; i < sensorTags.length; i++)
    {
        if (sensorTags[i].isConnected())
        {
            sensorTags[i].disconnect();
            num++;
        }
    }

    console.log("Disconnected %d sensors.", num);
}

function updateSensor(sensor)
{
    console.log("Update sensor called");

    console.log("Looking for sensor id: %s", sensor.id);
    for (var i = 0; i < sensorTags.length; i++)
    {
        if (sensorTags[i].getID() == sensor.id)
        {
            sensorTags[i].updateConfig(sensor);
            break;
        }
    }
}

function loadSensors()
{
    sensorModel.find(function(err, sensors)
    {
        console.log('Loading sensors...');

        var i = 0;
        for (i; i < sensors.length; i++)
        {
            sensorTags.push(new TI_SensorTag(sensors[i]));
        }

        console.log('Loaded %d sensors', i);

        connectSensors();
    });
}

/*-------------------------------------------------------------------
FAKE POWER MONITORING
-------------------------------------------------------------------*/
function calculateIndex()
{
    console.log("Hours: %d Minutes: %d Seconds: %d", moment().hours(), moment().minutes(), moment().seconds());

    var value1 = moment().hours() * 600;
    var value2 = moment().minutes() * 10;
    var value3 = moment().seconds()/6;

    var index = value1 + value2 + value3 + 1;

    console.log("Index calculate: " + index);

    return Math.round(index);

}   

function readCSVFile()
{
    fs.readFile('./csv/24-hr-power.csv', function(err, data)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            console.log("File successfully read!");

            parse(data, {columns : ['Time', 'Total', 'Kettle', 'Toaster', 'Fridge', 'Oven', 'Hot Water', 'TV', 'Home Entertainment', 'Computer', 'Air Con']}, 
            function(err, output){
                powerData = output;
                powerIndex = calculateIndex();
                logSpoofedPower();
            });
        }
    });
}


function logSpoofedPower()
{
    var timestamp = moment().utc().format();

    var logString = '{\"deviceID\":\"0' +
                    '\",\"deviceName\":\"Total' + 
                    '\",\"roomID\":\"0' +  
                    '\",\"roomName\":\"Household'+ 
                    '\",\"voltage\":\"'+ VOLTAGE +
                    '\",\"voltageUnit\":\"V' +
                    '\",\"current\":\"'+ powerData[powerIndex]['Total']/VOLTAGE + 
                    '\",\"currentUnit\":\"A' +
                    '\",\"power\":\"' + powerData[powerIndex]['Total'] +
                    '\",\"powerUnit\":\"W' +
                    '\",\"timestamp\":\"' + timestamp + '\"}\n';

    logger.logSensorData('0_Total.log', logString);

    logString = '{\"deviceID\":\"1' +
                    '\",\"deviceName\":\"Kettle' + 
                    '\",\"roomID\":\"1' +  
                    '\",\"roomName\":\"Kitchen'+ 
                    '\",\"voltage\":\"'+ VOLTAGE +
                    '\",\"voltageUnit\":\"V' +
                    '\",\"current\":\"'+ powerData[powerIndex]['Kettle']/VOLTAGE + 
                    '\",\"currentUnit\":\"A' +
                    '\",\"power\":\"' + powerData[powerIndex]['Kettle'] +
                    '\",\"powerUnit\":\"W' +
                    '\",\"timestamp\":\"' + timestamp + '\"}\n';

    logger.logSensorData('1_KitchenKettle.log', logString);

    logString = '{\"deviceID\":\"2' +
                    '\",\"deviceName\":\"Toaster' + 
                    '\",\"roomID\":\"1' +  
                    '\",\"roomName\":\"Kitchen'+ 
                    '\",\"voltage\":\"'+ VOLTAGE + 
                    '\",\"voltageUnit\":\"V' +
                    '\",\"current\":\"'+ powerData[powerIndex]['Toaster']/VOLTAGE +
                    '\",\"currentUnit\":\"A' +
                    '\",\"power\":\"' + powerData[powerIndex]['Toaster'] +
                    '\",\"powerUnit\":\"W' +
                    '\",\"timestamp\":\"' + timestamp + '\"}\n';

    logger.logSensorData('2_KitchenToaster.log', logString);

    logString = '{\"deviceID\":\"3' +
                    '\",\"deviceName\":\"Fridge' + 
                    '\",\"roomID\":\"0' +  
                    '\",\"roomName\":\"Kitchen'+ 
                    '\",\"voltage\":\"'+ VOLTAGE + 
                    '\",\"voltageUnit\":\"V' +
                    '\",\"current\":\"'+ powerData[powerIndex]['Fridge']/VOLTAGE +
                    '\",\"currentUnit\":\"A' +
                    '\",\"power\":\"' + powerData[powerIndex]['Fridge'] +
                    '\",\"powerUnit\":\"W' +
                    '\",\"timestamp\":\"' + timestamp + '\"}\n';

    logger.logSensorData('3_KitchenFridge.log', logString);

    logString = '{\"deviceID\":\"4' +
                    '\",\"deviceName\":\"Oven' + 
                    '\",\"roomID\":\"1' +  
                    '\",\"roomName\":\"Kitchen'+ 
                    '\",\"voltage\":\"'+ VOLTAGE +
                    '\",\"voltageUnit\":\"V' +
                    '\",\"current\":\"'+ powerData[powerIndex]['Oven']/VOLTAGE +
                    '\",\"currentUnit\":\"A' +
                    '\",\"power\":\"' + powerData[powerIndex]['Oven'] +
                    '\",\"powerUnit\":\"W' +
                    '\",\"timestamp\":\"' + timestamp + '\"}\n';

    logger.logSensorData('4_KitchenOven.log', logString);

    logString = '{\"deviceID\":\"5' +
                    '\",\"deviceName\":\"TV' + 
                    '\",\"roomID\":\"2' +  
                    '\",\"roomName\":\"Lounge'+ 
                    '\",\"voltage\":\"'+ VOLTAGE + 
                    '\",\"voltageUnit\":\"V' +
                    '\",\"current\":\"'+ powerData[powerIndex]['Lounge']/VOLTAGE +
                    '\",\"currentUnit\":\"A' +
                    '\",\"power\":\"' + powerData[powerIndex]['Lounge'] +
                    '\",\"powerUnit\":\"W' +
                    '\",\"timestamp\":\"' + timestamp + '\"}\n';

    logger.logSensorData('5_LoungeTV.log', logString);

    logString = '{\"deviceID\":\"6' +
                    '\",\"deviceName\":\"Home Entertainment' + 
                    '\",\"roomID\":\"1' +  
                    '\",\"roomName\":\"Lounge'+ 
                    '\",\"voltage\":\"'+ VOLTAGE + 
                    '\",\"voltageUnit\":\"V' +
                    '\",\"current\":\"'+ powerData[powerIndex]['Home Entertainment']/VOLTAGE +
                    '\",\"currentUnit\":\"A' +
                    '\",\"power\":\"' + powerData[powerIndex]['Home Entertainment'] +
                    '\",\"powerUnit\":\"W' +
                    '\",\"timestamp\":\"' + timestamp + '\"}\n';

    logger.logSensorData('6_LoungeHomeEntertainment.log', logString);

    logString = '{\"deviceID\":\"7' +
                    '\",\"deviceName\":\"Computer' + 
                    '\",\"roomID\":\"4' +  
                    '\",\"roomName\":\"Office'+ 
                    '\",\"voltage\":\"'+ VOLTAGE + 
                    '\",\"voltageUnit\":\"V' +
                    '\",\"current\":\"'+ powerData[powerIndex]['Computer']/VOLTAGE +
                    '\",\"currentUnit\":\"A' +
                    '\",\"power\":\"' + powerData[powerIndex]['Computer'] +
                    '\",\"powerUnit\":\"W' +
                    '\",\"timestamp\":\"' + timestamp + '\"}\n';

    logger.logSensorData('7_OfficeComputer.log', logString);

    powerIndex++;

    if(powerIndex == MAX_INDEX)
        powerIndex = 0;

    setTimeout(logSpoofedPower, 6000);
}
/*-------------------------------------------------------------------
SCRIPT START
-------------------------------------------------------------------*/

//Connect to mongoose database
mongoose.connect(dbDir);

//---------------WEBSERVER SETUP---------------
//Set port
var port = process.env.PORT || 8080;

//Set up express
const app = express();

//API router
var router = express.Router();

// Configure body parser to be able to parse POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded(
{
    extended: true
}));

//******************REST API HANDLING******************
/*
    This section setups all the express callbacks required
    to handle rest api requests.

*/

// Middleware function called everytime a request to the router is made
router.use(function(req, res, next)
{
    console.log('API successfully called');
    next(); //Make sure to move onto the next router
});

// Make sure that cross-site requests are accepted
router.use(function(req, res, next)
{

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');

    // Pass to next layer of middleware
    next();
});

//Sensor API Routes
router.route('/sensors')

// ***** CREATE *******/
// Add a sensor using HTTP POST (accessed at POST http://localhost:8080/api/sensors)
.post(function(req, res)
{
    var sensor = new sensorModel();

    console.log(req.body);

    sensor.UUID = req.body.UUID;
    sensor.sensorName = req.body.roomName + 'Environment';
    sensor.roomID = req.body.roomID;
    sensor.roomName = req.body.roomName;
    sensor.logInterval = req.body.logInterval;
    sensor.loggingEnabled = req.body.loggingEnabled;


    sensor.save(function(err)
    {
        if (err)
            res.send(err);

        res.json(
        {
            message: 'Sensor added!'
        });

        //Once successfully saved create a new sensorhandler object
        addSensor(sensor);
    });

})

// ***** RETRIEVE ALL *******/
//Returns all sensors from a GET request at http://localhost:8080/api/sensors
.get(function(req, res)
{
    sensorModel.find(function(err, sensors)
    {
        if (err)
            res.send(err);

        //console.log(sensors);
        res.json(sensors);
    })
});
//end of /sensors routes


//Modify sensor based on specific sensor id
router.route('/sensors/:sensor_id')

// ***** RETRIEVE ONE *******/
//Return a specific sensor based on id
.get(function(req, res)
{
    sensorModel.findById(req.params.sensor_id, function(err, sensor)
    {
        if (err)
            res.send(err);

        //console.log(sensor);
        res.json(sensor);
    });
})

// ***** UPDATE ONE *******/
//Update a specific sensor based on id
.put(function(req, res)
{
    sensorModel.findById(req.params.sensor_id, function(err, sensor)
    {
        if (err)
            res.send(err);

        var prevLoggingEnabled = sensor.loggingEnabled;
        var prevConnected = sensor.connected;

        console.log('loggingEnabled is ' + req.body.loggingEnabled);
        sensor.logInterval = req.body.logInterval;
        sensor.loggingEnabled = req.body.loggingEnabled;

        //Once successfully saved update sensor handler object
        updateSensor(sensor);

        sensor.save(function(err)
        {
            if (err)
                res.send(err);

            res.json(
            {
                message: 'Sensor updated!'
            });
            console.log('Sensor updated!');
        });

    });
})

// ***** DELETE ONE *******/
//Delete a specific sensor based on id
.delete(function(req, res)
{
    sensorModel.findById(req.params.sensor_id, function(err, sensor)
    {
        if (err)
            res.send(err);

        deleteSensor(sensor);

        sensorModel.remove(
        {
            _id: req.params.sensor_id
        }, function(err, sensor)
        {
            if (err)
                res.send(err);

            res.json(
            {
                message: 'Successfully deleted'
            });
        });

    });


});
//end of /sensors/:sensor_id routes


// Return a JSON success message when accessing API root URL
router.get('/', function(req, res)
{
    res.json(
    {
        message: 'Hooray! Welcome to our API!'
    });
});

// Set the root URL for the route to be /api
app.use('/api', router); //all of the routes will be prefixed with /api


//******************INDEX HTML HANDLING******************

//HTTP GET requests to the root URL return the index.html page to let people know the server is running
app.get('/', function(req, res)
{
    res.sendFile(__dirname + '/html/index.html',
    {
        title: 'Mystic Index'
    });
});

//******************SERVER LISTENING******************

// Set server to listen on configured port
app.listen(port, function()
{
    console.log('Server app listening on port: ' + port);
});

//******************HANDLE GRACEFUL DISCONNECT******************
process.on('SIGINT', function()
{
    disconnectSensors();
    process.exit();
});

//******************SENSOR HANDLING******************
var logger = new Logger("./logs");

readCSVFile();


// Load and create objects for all sensors configured in the database
loadSensors();


//All other software functionality is handled by the REST API function calls
