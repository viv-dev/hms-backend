
/*-------------------------------------------------------------------
SENSOR TAG HANDLING
-------------------------------------------------------------------*/
/*    	The sequence you need to follow in order to successfully
    	read a tag:
    		1) discover the tag
    		2) connect to and set up the tag
    		3) turn on the sensor you want to use (in this case, humidity, temp, and lux)
    		4) turn on notifications for the sensor
    		5) listen for changes from the sensortag

    	Once all callbacks are tied, the sensortag library operates 
    	asynchronously via the callback methods.

*/

//Module defines a set of functions used to setup and manage a TI sensor tag
//The 'tag' object is passed in by the SensorTag.discover() function.


/*-------------------------------------------------------------------
NPM IMPORTS
-------------------------------------------------------------------*/
//Sensor Tag library
const SensorTag = require('sensortag');

//Time formatting module
const moment = require('moment');

// Async module to handle asynchronous callbacks
var async = require('async');

//Import mongoose to manage access to sensordb
const mongoose = require('mongoose');

//Import our own custom sensor model
const sensorModel = require('./models/sensor-model');

/*-------------------------------------------------------------------
CUSTOM IMPORTS
-------------------------------------------------------------------*/
//Import custom logger class
const Logger = require('./logger');

/*-------------------------------------------------------------------
CLASS DEFINITION
-------------------------------------------------------------------*/

//'Class' constructor
function TI_SensorTag(config)
{
    this._config = config;
    this._logName = config.id + '_' + config.sensorName + '.log';
    this._logger = new Logger("./logs");

    this._config
}

TI_SensorTag.prototype.discover = function()
{
    //SensorTag.discover(this.getTag.bind(this)); 
    console.log('Trying to connect to sensor with UUID: %s', this._UUID);
    SensorTag.discoverById(this._config.UUID, this.getTag.bind(this));
};

TI_SensorTag.prototype.getTag = function(tag)
{
    //Make sure we have a valid tag
    if(typeof tag !== 'undefined' && tag)
    {
        this.tag = tag;
        
        //Report when tag is disconnected
        this.tag.on('disconnect', function()
        {
            console.log('Disconnected!');
        });

        this.connectAndSetUp(); 
    } 
    else
    {
        console.log('Tag is undefined!');
    }
};

TI_SensorTag.prototype.connectAndSetUp = function()
{
    //attempt to connect to the tag
    console.log('Sensor tag discovered! Connecting and setting up...');
    
    this.tag.connectAndSetUp(this.enableSensors.bind(this));
    this.tag.notifySimpleKey(this.listenForButton.bind(this));
};

TI_SensorTag.prototype.enableSensors = function()
{
        console.log('Enabling sensors...');

        this.tag.enableHumidity();
        this.tag.enableIrTemperature();
        this.tag.enableLuxometer();

        console.log('Beggining logging...');
        //Wait 2 seconds before trying to read sensor data
        setTimeout(this.readSensors.bind(this),2000);

};

// Call a parallel async flow at a set time interval to handle sensor reading
TI_SensorTag.prototype.readSensors = function()
{
    async.parallel(
        [
            function(callback)
            {
                
                this.tag.readIrTemperature(function(error, objectTemperature, ambientTemperature)
                {
                    callback(null, ambientTemperature);
                });
            }.bind(this),

            function(callback)
            {
                this.tag.readLuxometer(function(error, lux)
                {
                    callback(null, lux);
                });
            }.bind(this),

            function(callback)
            {
                this.tag.readHumidity(function(error, temperature, humidity)
                {
                    callback(null, humidity);
                });
            }.bind(this)
        ], 

        function(err, data)
        {
            if(data.length == 3)
            {
                var timestamp = moment().utc().format();
                var logString = '{\"sensorID\":\"' + this._config.id +
                                '\",\"sensorName\":\"' + this._config._sensorName + 
                                '\",\"roomID\":\"' + this._config._roomId + 
                                '\",\"roomName\":\"' + this._config._roomName + 
                                '\",\"temperature\":\"' + data[0] + 
                                '\",\"temperatureUnit\":\"C' +
                                '\",\"illuminance\":\"' +  data[1] + 
                                '\",\"illuminanceUnit\":\"LUX' +
                                '\",\"humidity\":\"' + data[2] +
                                '\",\"humidityUnit\":\"RH%' +
                                '\",\"@timestamp\":\"' + timestamp + '\"}\n';

                this._logger.logSensorData(this._logName, logString);
            }
            else
            {
                console.log('Error! Wrong number of sensor data elements read!')
            }
        }.bind(this));

    setTimeout(this.readSensors.bind(this), this._logInterval);
}

// Disconnect the sensor tag when both the left and right buttons are pressed
TI_SensorTag.prototype.listenForButton = function()
{
    this.tag.on('simpleKeyChange', function(left,right)
    {
        if( left && right )
        {
            this.tag.disconnect();
        }
    });
}

TI_SensorTag.prototype.disconnect = function()
{
    this.tag.disconnect();
}

TI_SensorTag.prototype.getLoggingEnabled = function()
{
    return this._config.loggingEnabled;
}

TI_SensorTag.prototype.getUUID = function()
{
    return this._config.UUID;
}

TI_SensorTag.prototype.getID = function()
{
    return this._config.id;
}

TI_SensorTag.prototype.getConfig = function()
{
    return this._config;
}

TI_SensorTag.prototype.updateConfig = function(newConfig)
{
    this._config = newConfig;

}

//Enable class to be exported
module.exports = TI_SensorTag;