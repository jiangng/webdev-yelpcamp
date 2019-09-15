var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

//root route
router.get("/", function(req, res) {
	res.render("landing");
});


//==============
//AUTH routes
//==============

//show register form
router.get("/register", function(req, res) {
	res.render("register", {page: "register"});
});

//handle sign up logic
router.post("/register", function(req, res) {
	var newUser = new User({username: req.body.username});
	User.register(newUser, req.body.password, function(err, user) {
		if (err) {
			req.flash("error", err.message);
			return res.redirect("/register");
		} 
		//this is supposed to log the new user in (not sure how it works yet)
		passport.authenticate("local")(req, res, function() {
			req.flash("success", "Welcome to YelpCamp, " + user.username);
			res.redirect("/campgrounds");
		});
	});
});

//Show login form
router.get("/login", function(req, res) {
	res.render("login", {page: "login"});
})

router.post("/login", passport.authenticate("local", {
	successRedirect: "/campgrounds",
	failureRedirect: "/login"
}), function(req, res) {
	//empty callback; can be removed
});

//logout route
router.get("/logout", function(req, res) {
	req.logout();
	req.flash("success", "Logged You Out!")
	res.redirect("/campgrounds");
});

module.exports = router;