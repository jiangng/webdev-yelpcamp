var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//==================
//CAMPGROUNDS routes
//==================

//Index route: Shows all campgrounds
router.get("/", function(req, res) {
	//Get all campgrounds from DB; empty curly brackets mean everything
	Campground.find({}, function(err, allCampgrounds) {
		if (err) {
			console.log(err);
		} else {
			//req.user contains logged-in user's info
			res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds"});
		}
	});
	console.log(req.user)
});

//Create route
router.post("/", middleware.isLoggedIn, function(req, res){
	// get data from form and add to campgrounds array
	var name = req.body.name;
	var image = req.body.image;
	var desc = req.body.description;
	var price = req.body.price;
	var author = {
	  id: req.user._id,
	  username: req.user.username
	}
	geocoder.geocode(req.body.location, function (err, data) {
		if (err || !data.length) {
			req.flash('error', 'Invalid address');
			return res.redirect('back');
		}
		var lat = data[0].latitude;
		var lng = data[0].longitude;
		var location = data[0].formattedAddress;
		var newCampground = {name: name, image: image, price: price, description: desc, author:author, location: location, lat: lat, lng: lng};
		// Create a new campground and save to DB
		Campground.create(newCampground, function(err, newlyCreated){
			if(err){
				console.log(err);
			} else {
				//redirect back to campgrounds page
				res.redirect("/campgrounds");
			}
		});
	});
});

//New route: shows form to create new item
router.get("/new", middleware.isLoggedIn, function(req, res) {
	res.render("campgrounds/new");
});

//SHOW route
router.get("/:id", function(req, res) {
	//find the campground with provided id
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
		//If an ID is technically valid but has no associated campground, there's no err hence need to check if foundCampground is defined or not 
		if (err || !foundCampground) {
			console.log(err);
		} else {
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});

//EDIT route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
	Campground.findById(req.params.id, function(err, foundCampground) {
		//not handling err here cuz middleware already did it
		res.render("campgrounds/edit", {campground: foundCampground});
	});
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
	//Cam be optimised: if location unchanged, skip this step
	geocoder.geocode(req.body.location, function (err, data) {
		if (err || !data.length) {
			req.flash('error', 'Invalid address');
			return res.redirect('back');
		}
		req.body.campground.lat = data[0].latitude;
		req.body.campground.lng = data[0].longitude;
		req.body.campground.location = data[0].formattedAddress;

		Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
			if(err){
				req.flash("error", err.message);
				res.redirect("back");
			} else {
				req.flash("success","Successfully Updated!");
				res.redirect("/campgrounds/" + campground._id);
			}
		});
	});
});

//DELETE route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
	//Not using findByIdAndRemove due to the pre-hook in campground model
	Campground.findById(req.params.id, function(err, campground) {
		if (err) {
			console.log(err);
		} else {
			//campground is a query object, which has deleteOne() method
			campground.deleteOne();
			req.flash("error","Site Deleted!");
		}
		res.redirect("/campgrounds");
	})
});

module.exports = router;