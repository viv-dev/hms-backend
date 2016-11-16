
/*-------------------------------------------------------------------
*************************TI-SENSORTAG*******************************
Description:    Sensor tag 'class' that allows multiple sensor tag objects
                to be created with individual config.
Author:         Viviana Capote
Last Updated:   18/10/2016
-------------------------------------------------------------------*/

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
    this._isConnected = false;
}

TI_SensorTag.prototype.discover = function()
{
    //SensorTag.discover(this.getTag.bind(this)); 
    console.log('Trying to connect to sensor with UUID: %s', this._config.UUID);
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
            console.log('Disconnected from sensor UUID: %s', this._config.UUID);
            this._isConnected = false;

        }.bind(this));

        if(this._config.loggingEnabled == 'true')
            this.connectAndSetUp(); 
        //else
            //this.disconnect();
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
    this._isConnected = true;

    this.tag.connectAndSetUp(this.enableSensors.bind(this));
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
                                '\",\"sensorName\":\"' + this._config.sensorName + 
                                '\",\"roomID\":\"' + this._config.roomID + 
                                '\",\"roomName\":\"' + this._config.roomName + 
                                '\",\"temperature\":\"' + data[0] + 
                                '\",\"temperatureUnit\":\"C' +
                                '\",\"illuminance\":\"' +  data[1] + 
                                '\",\"illuminanceUnit\":\"LUX' +
                                '\",\"humidity\":\"' + data[2] +
                                '\",\"humidityUnit\":\"RH%' +
                                '\",\"timestamp\":\"' + timestamp + '\"}\n';

                this._logger.logSensorData(this._logName, logString);
            }
            else
            {
                console.log('Error! Wrong number of sensor data elements read!')
            }
        }.bind(this));

    setTimeout(this.readSensors.bind(this), this._config.logInterval);
}


TI_SensorTag.prototype.deleteTag = function()
{
    delete this.tag;
}

TI_SensorTag.prototype.disconnect = function()
{
    if(this._isConnected)
        this.tag.disconnect();
}

TI_SensorTag.prototype.isConnected = function()
{
    return this._isConnected;
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
    var oldEnabled = this._config.loggingEnabled;

    this._config = newConfig;

      console.log("Old enable: " + oldEnabled + " New enable: " + this._config.loggingEnabled);

    if((this._config.loggingEnabled == 'false') && (oldEnabled == 'true'))
    {
        console.log('Disconnecting sensor...');
        this.disconnect();
    }
    else if((this._config.loggingEnabled == 'true') && (oldEnabled == 'false'))
    {
        console.log('Connecting sensor...');
        this.discover();
    }

    // if(oldInterval=='false' && this._config.logInterval == 'true')
    //     this.discover();
    // else if(oldInterval =='true' && this._config.logInterval =='false')
    //     this.disconnect();

}

//Enable class to be exported
module.exports = TI_SensorTag;