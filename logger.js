//Import path module for directory crawling/management
const path = require('path');

//Import fs module for file read/write
const fs = require('fs');

//Time formatting module
const moment = require('moment');

//Provides OS consistend end of line
const eol = require('eol')

/*-------------------------------------------------------------------
						LOG FUNCTIONS
-------------------------------------------------------------------*/

//Define logger class/constructor
function Logger(logDir)
{
    this.logDir=logDir;

    this.init(logDir);
}

//Define class functions

Logger.prototype.init = function(logDir)
{
    if (!this.directoryExists(logDir))
    {
        fs.mkdirSync(logDir);
    }

    console.log('Logger created logging to: ' + logDir); 
}

Logger.prototype.directoryExists = function(filePath)
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

Logger.prototype.logSensorData = function(fileName, logString, append = true)
{
    var logPath = path.join(this.logDir, fileName);
    var log = eol.crlf(logString);

    var flags = append ? { flag: 'a' } : {};

    fs.writeFile(logPath, log, flags, (error) =>
    {
        if (error)
        {
            console.error('Write error to ${logPath} : ${error.message}');
        }
    });
};


//Enable class to be exported
module.exports = Logger;
