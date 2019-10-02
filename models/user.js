var mongoose = require("mongoose");
//Local is the strategy for auth; this passportLocal package is tailored for Mongoose
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	username: String,
	password: String,
	avatar: String,
	firstName: String,
	lastName: String,
	email: {type: String, unique: true, required: true},
	resetPasswordToken: String,
    resetPasswordExpires: Date,
	isAdmin: {
		type: Boolean,
		default: false
	}
});

//Give functionalities like User.register() to User model
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);