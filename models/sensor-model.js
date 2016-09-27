var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SensorSchema = new Schema(
{
	UUID: String,
	sensorID: String,
	sensorName: String,
	roomID: String,
	roomName: String,
	logInterval: Number

});

module.exports = mongoose.model('SensorModel', SensorSchema);