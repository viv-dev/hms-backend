var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SensorSchema = new Schema(
{
	UUID: String,
	sensorName: String,
	roomID: String,
	roomName: String,
	logInterval: Number, 
	loggingEnabled: String

});

module.exports = mongoose.model('SensorModel', SensorSchema);