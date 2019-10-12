var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'jiangdepo', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
	var filter = {};
	var searchTerm = "";
	
	//Check if the search bar is used
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		filter = {name: regex};
		searchTerm = req.query.search;
    }
	
	Campground.find(filter, function(err, allCampgrounds){
	   if(err){
		   console.log(err);
	   } else {
		  res.render("campgrounds/index",{campgrounds:allCampgrounds, searchTerm: searchTerm, page: "campgrounds"});
	   }
	});
	
	//req.user contains logged-in user's info
	//console.log(req.user)
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//Create route
//Note: upload.single('image') refers to name="image" in campgrounds/new.ejs
router.post("/", middleware.isLoggedIn, upload.single('image'), async function(req, res) {
	try {
		let [imageUploadResult, geoData] = await Promise.all([
			//req.file.path comes from multer
			cloudinary.uploader.upload(req.file.path),
			geocoder.geocode(req.body.location)
		]);
		 
		if (!geoData.length) {
			req.flash('error', 'Invalid address');
			return res.redirect('back');
		}
		
		// add cloudinary url for the image to the campground object under image property
		req.body.campground.image = imageUploadResult.secure_url;
		// add author to campground
		req.body.campground.author = {
			id: req.user._id,
			username: req.user.username
		};

		req.body.campground.lat = geoData[0].latitude;
		req.body.campground.lng = geoData[0].longitude;
		req.body.campground.location = geoData[0].formattedAddress;

		let newCampground = await Campground.create(req.body.campground);
		res.redirect('/campgrounds/' + newCampground.id);
	} catch(err) {
		req.flash('error', err.message);
		return res.redirect('back');
	}
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