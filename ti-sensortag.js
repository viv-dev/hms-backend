
/*-------------------------------------------------------------------
						SENSOR TAG HANDLING
-------------------------------------------------------------------*/
/*    	The sequence you need to follow in order to successfully
    	read a tag:
    		1) discover the tag
    		2) connect to and set up the tag
    		3) turn on the sensor you want to use (in this case, humidity and temp)
    		4) turn on notifications for the sensor
    		5) listen for changes from the sensortag

    	Once all callbacks are tied, the sensortag library operates 
    	asynchronously via the callback methods.

*/

//Module defines a set of functions used to setup and manage a TI sensor tag
//The 'tag' object is passed in by the SensorTag.discover() function.

//Sensor Tag library
const SensorTag = require('sensortag');

//Import custom logger class
const Logger = require('./logger');

// function TI_SensorTag(sensorID, UUID, room, sensorType)
// {
//     var _sensorID = sensorID;
//     var _UUID = UUID;
//     var _room = room;
//     var _logName = sensorID + '_' + room + '_' + sensorType + '.log';

//     //Make sure log directory exists
//     var logger = new Logger("./logs");

//     this.discover = function()
//     {
//         SensorTag.discover(this.sensorHandler.bind(this)); 

//         console.log('Test Log!');
//         logger.logSensorData(this._logName, this._sensorID, this._room, "Test");
//     };

//     this.sensorHandler = function(tag)
//     {
//         _this = this;
//        //Tie callback function to sensortag disconnect
//         tag.on('disconnect', function()
//         {
//             console.log('Disconnected!');
//         });

//         function connectAndSetUpMe()
//         {
//             //attempt to connect to the tag
//             console.log('connectAndSetUp');
//             tag.connectAndSetUp(enableSensors); // when you connect and device is setup, call enableAccelMe
//         }

//         function enableSensors()
//         {
//             console.log('Enabling sensors...');

//             //Enable temperature sensors and start sensor listeners
//             tag.enableHumidity(startHumidity);
//         }

//         function startHumidity()
//         {
//             // Start the humidity listener
//             tag.notifyHumidity(listenForHumidity);
//         }

//         // When you get a humidity change, print it out:
//         function listenForHumidity()
//         {
//             console.log('Logging Temperature data');
//             tag.on('humidityChange', function(temperature, humidity)
//             {
//                 logSensorData();
//                 //logSensorData(sensorLog, sensorId, roomName, temperature);
//                 // console.log('\ttemperature = %d G', temperature.toFixed(1));
//                 // console.log('\thumidity = %d G', humidity.toFixed(1));
//             });
//         }

//         function logSensorData()
//         {
//             console.log(_this.UUID);
//         }

//         // Now that you've defined all the functions, start the process:
//         connectAndSetUpMe();   
//     }
    
//     //console.log('Test Log!');
//     //this.logger.logSensorData(this.logName, this.sensorID, this.room, "Test");
// };

function TI_SensorTag(sensorID, UUID, room, sensorType)
{
    this._sensorID = sensorID;
    this. _UUID = UUID;
    this._room = room;
    this._logName = sensorID + '_' + room + '_' + sensorType + '.log';
    this.logger = new Logger("./logs");
}

TI_SensorTag.prototype.discover = function()
{
    SensorTag.discover(this.getTag.bind(this)); 

    console.log('Test Log!');
    this.logger.logSensorData("Test", "Test", "Test", "Test");
};

TI_SensorTag.prototype.getTag = function(tag)
{
    if(typeof tag !== 'undefined' && tag)
    {
        this.tag = tag;
        
        // Now that you've defined all the functions, start the process:
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
    console.log('connectAndSetUp');
    this.tag.connectAndSetUp(this.enableSensors.bind(this)); // when you connect and device is setup, call enableAccelMe
};

TI_SensorTag.prototype.enableSensors = function()
{
        console.log('Enabling sensors...');

        //Enable temperature sensors and start sensor listeners
        //tag.enableIrTemperature(startTemp);
        this.tag.enableHumidity(this.startHumidity.bind(this));
};

TI_SensorTag.prototype.startHumidity = function()
{
    // Start the humidity listener
    this.tag.notifyHumidity(this.listenForHumidity.bind(this));
};

// When you get an temperature change, print it out:
TI_SensorTag.prototype.listenForHumidity = function()
{
    var _this = this;

    console.log('Logging Temperature data');

    this.tag.on('humidityChange', function(temperature, humidity)
    {
        this.logger.logSensorData(this._logName, this._sensorID, this._room, temperature);
        console.log('\ttemperature = %d C', temperature.toFixed(1));
        // console.log('\thumidity = %d G', humidity.toFixed(1));
    }.bind(this));
};

TI_SensorTag.prototype.sensorHandler = function(tag)
{
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
    }

    function startHumidity()
    {
        // Start the humidity listener
        tag.notifyHumidity(listenForHumidity);
    }

    // When you get a humidity change, print it out:
    function listenForHumidity()
    {
        console.log('Logging Temperature data');
        tag.on('humidityChange', function(temperature, humidity)
        {
            logSensorData();
            //logSensorData(sensorLog, sensorId, roomName, temperature);
            // console.log('\ttemperature = %d G', temperature.toFixed(1));
            // console.log('\thumidity = %d G', humidity.toFixed(1));
        });
    }

    function logSensorData()
    {
        console.log(_this.UUID);
    }

    // Now that you've defined all the functions, start the process:
    connectAndSetUpMe();   
}



//Enable class to be exported
module.exports = TI_SensorTag;

// function sensorTagModule(tag)
// {
//     sensorId = 0;
//     roomName = "Kitchen";
//     sensorLog = "";

//     //Tie callback function to sensortag disconnect
//     tag.on('disconnect', function()
//     {
//         console.log('Disconnected!');
//         sensorId = 0;
//         totalTags--;
//     });

//     function connectAndSetUpMe()
//     {
//         //attempt to connect to the tag
//         console.log('connectAndSetUp');
//         tag.connectAndSetUp(enableSensors); // when you connect and device is setup, call enableAccelMe
//         totalTags++;
//         sensorId = totalTags;
//         sensorLog = "sensor" + sensorId + "_log.log";
//     }

//     function enableSensors()
//     {
//         console.log('Enabling sensors...');

//         //Enable temperature sensors and start sensor listeners
//         //tag.enableIrTemperature(startTemp);
//         tag.enableHumidity(startHumidity);
//     }

//     function startTemp()
//     {
//         // Start the temperature listener
//         tag.notifyIrTemperature(listenForTemp);
//     }

//     function startHumidity()
//     {
//         // Start the humidity listener
//         tag.notifyHumidity(listenForHumidity);
//     }

//     // When you get an temperature change, print it out:
//     function listenForTemp()
//     {
//         tag.on('irTemperatureChange', function(objectTemperature, ambientTemperature)
//         {
//             // console.log('\tobjectTemperature = %d G', objectTemperature.toFixed(1));
//             // console.log('\tambientTemperature = %d G', ambientTemperature.toFixed(1));
//         });
//     }

//     // When you get a humidity change, print it out:
//     function listenForHumidity()
//     {
//         console.log('Logging Temperature data');
//         tag.on('humidityChange', function(temperature, humidity)
//         {
//             logSensorData(sensorLog, sensorId, roomName, temperature);
//             // console.log('\ttemperature = %d G', temperature.toFixed(1));
//             // console.log('\thumidity = %d G', humidity.toFixed(1));
//         });
//     }

//     // Now that you've defined all the functions, start the process:
//     connectAndSetUpMe();
// };

//SensorTag.discover(sensorTagModule); replace as loop for no. of saved sensors