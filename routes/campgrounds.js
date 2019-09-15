var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");

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
	
});

//Create route
router.post("/", middleware.isLoggedIn, function(req, res) {
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var description = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	
	var newCampground = {name: name, price: price, image:image, description: description, author: author};
	
	//Create a new campground and save to DB
	Campground.create(newCampground, function(err, newlyCreated) {
		if (err) {
			console.log(err); 
		} else {
			console.log(newlyCreated);
			//Default is to redirect to GET
			res.redirect("/campgrounds");
		}
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

//UPDATE route
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res) {
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground) {
		if (err) {
			res.redirect("/campgrounds");
		} else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	})
})

//DELETE route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
	//Not using findByIdAndRemove due to the pre-hook in campground model
	Campground.findById(req.params.id, function(err, campground) {
		if (err) {
			console.log(err);
		} else {
			//campground is a query object, which has deleteOne() method
			campground.deleteOne();
		}
		res.redirect("/campgrounds");
	})
});

module.exports = router;