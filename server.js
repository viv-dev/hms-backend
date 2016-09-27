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

//Import path module for directory crawling/management
const path = require('path');

//Import fs module for file read/write
const fs = require('fs');

//Time formatting module
const moment = require('moment');

//Sensor Tag library
const SensorTag = require('sensortag');

const eol = require('eol')

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

//Log directory
const logDir = path.join(__dirname, 'logs');

//Sensor database directory
const dbDir = 'mongodb://localhost/sensordb';

//Number of sensor tags connected
var totalTags = 0;

/*-------------------------------------------------------------------
                        SENSOR TAG HANDLING
-------------------------------------------------------------------*/

var sensorHandler = function(tag)
{
    //Sensor ID's
    var tempID = "1";
    var humidityID = "2";
    var luxID = "3";

    //Sensor Info
    var UUID = "ABCD";
    var room = "Kitchen";

    //File Names
    var tempFile = tempID + '_' + room + '_Temperature.log';
    var humidityFile = humidityID + '_' + room + '_Humidity.log';
    var luxFile = luxID + '_' + room + '_Lux.log';

    //Measurement Units
    var celsius = "C";
    var rhHumidity = "%RH";
    var lux_u = "LUX";


   
   //Tie callback function to sensortag disconnect
    tag.on('disconnect', function()
    {
        console.log('Disconnected!');
    });

    function connectAndSetUpMe()
    {
        //attempt to connect to the tag
        console.log('connectAndSetUp');
        tag.connectAndSetUp(enableSensors); // when you connect and device is setup, call enableAccelMe
    }

    function enableSensors()
    {
        console.log('Enabling sensors...');

        //Enable temperature sensors and start sensor listeners
        tag.enableHumidity(startHumidity);
        tag.enableLuxometer(startLuxometer);
    }

    function startHumidity()
    {
        // Start the humidity listener
        tag.notifyHumidity(listenForHumidityAndTemp); //Humidity callback includes temperature value
    }

    function startLuxometer()
    {
        tag.notifyLuxometer(listenForLux);
    }

    // When you get a humidity change, print it out:
    function listenForHumidityAndTemp()
    {
        console.log('Logging Temperature data');
        console.log('Logging Humidity data');
        tag.on('humidityChange', function(temperature, humidity)
        {
            logSensorData(tempFile, tempID, room, temperature, "Temperature", celsius);
            logSensorData(humidityFile, humidityID, room, temperature, "Humidity", rhHumidity);
            // console.log('\ttemperature = %d G', temperature.toFixed(1));
            // console.log('\thumidity = %d G', humidity.toFixed(1));
        });
    }

    function listenForLux()
    {
        console.log('Logging Lux Data');
        tag.on('luxometerChange', function(lux)
        {
            logSensorData(luxFile, luxID, room, lux, "Lux", lux_u);
        });
    }
    // Now that you've defined all the functions, start the process:
    connectAndSetUpMe();   
}

/*-------------------------------------------------------------------
                        LOGGING
-------------------------------------------------------------------*/

//Define class functions
function logInit()
{

    if (!directoryExists(logDir))
    {
        fs.mkdirSync(logDir);
    }

    console.log('Logger created logging to: ' + logDir); 
}

function directoryExists(filePath)
{
    try
    {
        return fs.statSync(filePath).isDirectory();
    }
    catch (err)
    {
        return false;
    }
};

function logSensorData(fileName, sensorID, roomName, sensorValue, sensorType, measurementUnit, append = true)
{
    var logPath = path.join(logDir, fileName);
    var timestamp = moment().utc().format();
    var log = '{\"sensorID\":\"' + sensorID + '\",\"roomName\":\"' + roomName + '\",\"sensorType\":\"' + sensorType + '\",\"sensorValue\":\"' + sensorValue + '\",\"measurementUnit\":\"' + measurementUnit + '\",\"@timestamp\":\"' + timestamp + '\"}\n';
    var logcrlf = eol.crlf(log);

    var flags = append ? { flag: 'a' } : {};

    fs.writeFile(logPath, logcrlf, flags, (error) =>
    {
        if (error)
        {
            console.error('Write error to ${logPath} : ${error.message}');
        }
    });
};


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

//Api router
var router = express.Router();

// configure body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//---------------RESTFUL API HANDLING---------------
/*
    This section setups all the express callbacks required
    to handle rest api requests.

*/
router.use(function(req, res, next)
{
    console.log('API successfully called');
    next(); //Make sure to move onto the next router
});

//Sensor API Routes
router.route('/sensors')

    // Add a sensor (accessed at POST http://localhost:8080/api/sensors)
    .post(function(req,res)
    {
        var sensor = new sensorModel();

        console.log(req.body);

        console.log('UUID is ' + req.body.UUID);
        console.log('SensorType is ' + req.body.SensorType);
        console.log('Room is ' + req.body.Room);

        sensor.UUID = req.body.UUID;
        sensor.SensorType = req.body.SensorType;
        sensor.Room = req.body.Room;

        sensor.save(function(err)
        {
            if(err)
                    res.send(err);

            res.json({message: 'Sensor added!'});
        });

    })

    //Returns all sensors from a GET request at http://localhost:8080/api/sensors
    .get(function(req, res)
    {
        sensorModel.find(function(err, sensors)
        {
            if(err)
                res.send(err);

            console.log(sensors);
            res.json(sensors);
        })
    });
//end of /sensors routes


//Modify sensor based on specific sensor id
router.route('/sensors/:sensor_id')

    //Return a specific sensor based on id
    .get(function(req, res)
    {
        sensorModel.findById(req.params.sensor_id, function(err, sensor)
        {
            if(err)
                res.send(err);

            console.log(sensor);
            res.json(sensor);
        });
    })

    //Update a specific sensor based on id
    .put(function(req, res)
    {
        sensorModel.findById(req.params.sensor_id, function(err, sensor)
        {
            if(err)
                res.send(err);

            sensor.UUID = req.body.UUID;
            sensor.SensorType = req.body.SensorType;
            sensor.Room = req.body.Room;

            sensor.save(function(err)
            {
                if(err)
                    res.send(err);

                res.json({message:'Sensor updated!'});
                console.log('Sensor updated!');
                console.log(sensor);
            });
        });
    })

    //Delete a specific sensor based on id
    .delete(function(req,res)
    {
        sensorModel.remove(
        {
            _id: req.params.sensor_id
        }, function(err, sensor)
        {
            if(err)
                res.send(err);

            res.json({ message: 'Successfully deleted'});
        });
    });
//end of /sensors/:sensor_id routes

router.get('/', function(req, res)
{
    res.json(
    {
        message: 'hooray! welcome to our api!'
    });
});

//Registering our routes
app.use('/api', router); //all of the routes will be prefixed with /api


//---------------INDEX HTML---------------

app.get('/', function(req, res)
{
    res.sendFile(__dirname + '/index.html',
    {
        title: 'ICTD Index'
    });
});

//Start web server listening
app.listen(port, function()
{
    console.log('Example app listening on port: ' + port);
});


//---------------LOGGING SETUP---------------
//logInit();
//console.log('Attempting to connect to sensor!');
//SensorTag.discover(sensorHandler);

var ti_sensortag_1 = new TI_SensorTag("1", "ABBCCDD", "Lounge", "Temperature");
//var ti_sensortag_2 = new TI_SensorTag("2", "ABBCCDD", "Lounge", "Temperature");
ti_sensortag_1.discover();
//ti_sensortag_2.discover();