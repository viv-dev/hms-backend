var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SensorSchema = new Schema(
{
	UUID: String,
	SensorType: String,
	Room: String
});

module.exports = mongoose.model('SensorModel', SensorSchema);