var mongoose = require("mongoose");

var notificationSchema = new mongoose.Schema({
	//this is the user that triggers this notification
	username: String, 
	campgroundId: String,
	campgroundName: String,
	info: String,
	isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model("Notification", notificationSchema);