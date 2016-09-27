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

/*-------------------------------------------------------------------
CUSTOM IMPORTS
-------------------------------------------------------------------*/
//Import sensor tag class
const TI_SensorTag = require('./ti-sensortag');

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

//Sensor API Routes
router.route('/sensors')

    // Add a sensor using HTTP POST (accessed at POST http://localhost:8080/api/sensors)
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
    res.sendFile(__dirname + '/index.html',
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


//******************SENSOR HANDLING******************

// Create a new sensor tag class object
var ti_sensortag_1 = new TI_SensorTag("a0e6f8af5407", "1", "KitchenEnvironment", "1", "Kitchen", 5000);
//var ti_sensortag_2 = new TI_SensorTag("2", "ABBCCDD", "Lounge", "Temperature");

//Set the sensor tag to discover tag with corresponding UUID
ti_sensortag_1.discover();
//ti_sensortag_2.discover();
//Could create array of sensor objects dynamically created based on sensor config in database