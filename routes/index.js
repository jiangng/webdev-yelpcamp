var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground")

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

//show register admin form
router.get("/register_admin", function(req, res) {
	res.render("register_admin", {page: "register"});
});

//handle sign up logic
router.post("/register", function(req, res) {
	var newUser = new User({
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		avatar: req.body.avatar
	});
	if (req.body.adminCode === "secretCode123") {
		newUser.isAdmin = true;
	}
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

//USER PROFILE
router.get("/users/:id", function(req, res) {
	User.findById(req.params.id, function(err, foundUser) {
		if (err) {
			req.flash("error", "Something went wrong.");
			return res.redirect("/");
		}
		
		//Chaining Query object method
		Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds) {
			if (err) {
				req.flash("error", "Something went wrong.");
				return res.redirect("/");
			}
			res.render("users/show", {user: foundUser, campgrounds: campgrounds});
		});
		
		//Usual method to query
		// Campground.find({"author.id": foundUser._id}, function(err, campgrounds) {
		// 	if (err) {
		// 		req.flash("error", "Something went wrong.");
		// 		return res.redirect("/");
		// 	}
		// 	res.render("users/show", {user: foundUser, campgrounds: campgrounds});
		// });
	});
});

module.exports = router;