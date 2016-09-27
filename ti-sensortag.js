
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

/*-------------------------------------------------------------------
CUSTOM IMPORTS
-------------------------------------------------------------------*/
//Import custom logger class
const Logger = require('./logger');

/*-------------------------------------------------------------------
CLASS DEFINITION
-------------------------------------------------------------------*/

//'Class' constructor
function TI_SensorTag(UUID, sensorID, sensorName, roomID, roomName, logInterval)
{
    this._UUID = UUID;
    this._sensorID = sensorID;
    this._sensorName = sensorName;
    this._roomId = roomID;
    this._roomName = roomName;

    this._logInterval = logInterval;
    this._logName = sensorID + '_' + sensorName + '.log';
    this._logger = new Logger("./logs");
}

TI_SensorTag.prototype.discover = function()
{
    //SensorTag.discover(this.getTag.bind(this)); 
    console.log('Trying to connect to sensor with UUID: %s', this._UUID);
    SensorTag.discoverById(this._UUID, this.getTag.bind(this));
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
                    //console.log('readIrTemperature');
                    //console.log('\tobject temperature = %d °C', objectTemperature.toFixed(1));
                    //console.log('\tambient temperature = %d °C', ambientTemperature.toFixed(1));

                    callback(null, ambientTemperature);
                });
            }.bind(this),

            function(callback)
            {
                this.tag.readLuxometer(function(error, lux)
                {
                    //console.log('readLuxometer');
                    //console.log('\tlux = %d', lux.toFixed(1));

                    callback(null, lux);
                });
            }.bind(this),

            function(callback)
            {
                this.tag.readHumidity(function(error, temperature, humidity)
                {
                    //console.log('readHumidity');
                    //console.log('\ttemperature = %d °C', temperature.toFixed(1));
                    //console.log('\thumidity = %d %', humidity.toFixed(1));

                    callback(null, humidity);
                });
            }.bind(this)
        ], 

        function(err, data)
        {
            if(data.length == 3)
            {
                var timestamp = moment().utc().format();
                var logString = '{\"sensorID\":\"' + this._sensorID +
                                '\",\"sensorName\":\"' + this._sensorName + 
                                '\",\"roomID\":\"' + this._roomId + 
                                '\",\"roomName\":\"' + this._roomName + 
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

//Enable class to be exported
module.exports = TI_SensorTag;