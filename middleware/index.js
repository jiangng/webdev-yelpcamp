var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");

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
				if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
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
				if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
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

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id).populate("reviews").exec(function (err, foundCampground) {
            if (err || !foundCampground) {
                req.flash("error", "Campground not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundCampground.reviews
                var foundUserReview = foundCampground.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/campgrounds/" + foundCampground._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
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

/*
Use this when login is a possible action in the page of the current route
*/
middlewareObj.saveCurrentUrl = (req, res, next) => {
	//save the url of the current page so can redirect back after users login
	req.session.current_url = req.originalUrl;
	next();
}

module.exports = middlewareObj;