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

//Local tunnel to expose pi server
//var localtunnel = require('localtunnel');

/*-------------------------------------------------------------------
CUSTOM IMPORTS
-------------------------------------------------------------------*/
//Import sensor tag class
const TI_SensorTag = require('./ti-sensortag');

/*-------------------------------------------------------------------
GLOBAL VARIABLES
-------------------------------------------------------------------*/

//Sensor database directory
const dbDir = 'mongodb://localhost/sensordb';

//Array to hold dynamically created sensortag objects
var sensorTags = [];

//Local tunnel config
var opts = { subdomain : "hmps"};

/*-------------------------------------------------------------------
SENSOR OBJECT/CONFIG HANDLING
-------------------------------------------------------------------*/

function verifySensorData()
{
    //TO DO
}


function addSensor(sensor)
{
    sensorTags.push(new TI_SensorTag(sensor));

    if(sensor.loggingEnabled == 'true')
        connectSensors();
}

function deleteSensor(sensor)
{
    console.log("Deleting sensor with UUID: " + sensor.UUID);
    
    for(var i=0; i < sensorTags.length; i++)
    {
        if((sensorTags[i].getID() == sensor.id))
        {
            if(sensorTags[i].isConnected())
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
    for(var i=0; i < sensorTags.length; i++)
    {
        if((sensorTags[i].getLoggingEnabled() == 'true') && (sensorTags[i].isConnected() == false))
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

    for(var i=0; i < sensorTags.length; i++)
    {
        if(sensorTags[i].isConnected())
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
    for(var i=0; i < sensorTags.length; i++)
    {
        if(sensorTags[i].getID() == sensor.id)
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
        for(i; i < sensors.length; i++)
        {
            sensorTags.push(new TI_SensorTag(sensors[i]));
        }

        console.log('Loaded %d sensors', i);

        connectSensors();
    });
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
app.use(bodyParser.urlencoded({ extended: true }));

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
router.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    //res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

//Sensor API Routes
router.route('/sensors')
    
    // ***** CREATE *******/
    // Add a sensor using HTTP POST (accessed at POST http://localhost:8080/api/sensors)
    .post(function(req,res)
    {
        var sensor = new sensorModel();

        console.log(req.body);

        // console.log('UUID is ' + req.body.UUID);
        // console.log('sensorID is ' + req.body.sensorID);
        // console.log('sensorName is ' + req.body.sensorName);
        // console.log('roomID is ' + req.body.roomID);
        // console.log('roomName is ' + req.body.roomName);
        // console.log('logInterval is ' + req.body.logInterval);
        // console.log('loggingEnabled is ' + req.body.loggingEnabled);

        sensor.UUID = req.body.UUID;
        sensor.sensorName = req.body.roomName + 'Environment';
        sensor.roomID = req.body.roomID;
        sensor.roomName = req.body.roomName;
        sensor.logInterval = req.body.logInterval;
        sensor.loggingEnabled = req.body.loggingEnabled;


        sensor.save(function(err)
        {
            if(err)
                res.send(err);

            res.json({message: 'Sensor added!'});

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
            if(err)
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
            if(err)
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
            if(err)
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
                if(err)
                    res.send(err);

                res.json({message:'Sensor updated!'});
                console.log('Sensor updated!');
            });

        });
    })

    // ***** DELETE ONE *******/
    //Delete a specific sensor based on id
    .delete(function(req,res)
    {
        sensorModel.findById(req.params.sensor_id, function(err, sensor)
        {
            if(err)
                res.send(err);

            deleteSensor(sensor);

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

//******************LOCAL TUNNEL******************
/*var tunnel = localtunnel(port, opts, function(err, tunnel)
{
    console.log('Received localtunnel URL: %s', tunnel.url);
});*/

//******************SENSOR HANDLING******************

// Load and create objects for all sensors configured in the database
loadSensors();


//All other software functionality is handled by the REST API function calls
