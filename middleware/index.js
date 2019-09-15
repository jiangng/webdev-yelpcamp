var Campground = require("../models/campground");
var Comment = require("../models/comment");

var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next) {
	//is user logged in?
	if (req.isAuthenticated()) {
		Campground.findById(req.params.id, function(err, foundCampground) {
			if (err || !foundCampground) {
				req.flash("error", "Campground not found.");
				res.redirect("back");
			} else {
				//does the user own the campground
				//Note: Cannot use === to compare as they are not the same objects!
				if (foundCampground.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that.");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that.");
		//redirect to the previous page
		res.redirect("back");
	}
};

middlewareObj.checkCommentOwnership = function(req, res, next) {
	//is user logged in?
	if (req.isAuthenticated()) {
		Comment.findById(req.params.comment_id, function(err, foundComment) {
			if (err || !foundComment) {
				res.redirect("back");
			} else {
				//does the user own the campground
				//Note: Cannot use === to compare as they are not the same objects!
				if (foundComment.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that.");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that.");
		//redirect to the previous page
		res.redirect("back");
	}
};

middlewareObj.isLoggedIn = function(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	
	//Saving a message to a key which will be used when req.flash() is called next time; must be written before being redirected
	req.flash("error", "You need to be logged in to do that.");
	res.redirect("/login");
};

module.exports = middlewareObj;