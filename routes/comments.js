var express = require("express");
//Use mergeParams in order to access ":id" in app.js 
var router = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Notification = require("../models/notification");
var User = require("../models/user");
var middleware = require("../middleware");

//================
//COMMENT routes
//These are nested routes!
//================
router.get("/new", middleware.isLoggedIn, function(req, res) {
	Campground.findById(req.params.id, function(err, campground) {
		if (err) {
			console.log(err);
		} else {
			res.render("comments/new", {campground: campground});
		}
	});
});

router.post("/", middleware.isLoggedIn, async function(req, res) {
	try {
		let [campground, newComment] = await Promise.all([
			Campground.findById(req.params.id),
			Comment.create(req.body.comment)
		]);
		
		//add username and id to comment
		newComment.author.id = req.user._id;
		newComment.author.username = req.user.username;
		campground.comments.push(newComment);
		
		//Create a notification and push it to the campground author
		let [newNotification, campgroundAuthor] = await Promise.all([
			Notification.create({
				username: req.user.username,
				campgroundId: campground.id,
				campgroundName: campground.name,
				info: "wrote a comment"
			}),
			User.findById(campground.author.id)
		]);
		campgroundAuthor.notifications.push(newNotification);
	
		await Promise.all([
			newComment.save(),
			campground.save(),
			campgroundAuthor.save()
		]);
		
		req.flash("success", "Succcessfully added comment.");
		res.redirect('/campgrounds/' + campground._id);
	} catch (err) {
		req.flash('error', err.message);
    	res.redirect('back');
	}	
});

//COMMENT EDIT route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res) {
	Comment.findById(req.params.comment_id, function(err, foundComment) {
		if (err) {
			res.redirect("back");
		} else {
			res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
		}
	});
});

//COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment) {
		if (err) {
			res.redirect("back");
		} else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
})

//COMMENT DESTROY route
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
	Comment.findByIdAndRemove(req.params.comment_id, function(err) {
		if (err) {
			res.redirect("back");
		} else {
			Campground.findByIdAndUpdate(req.params.id, {$pull: {comments: req.params.comment_id}}, function() {
				req.flash("success", "Comment deleted.");
				res.redirect("/campgrounds/" + req.params.id);
			});
		}
	});
});

module.exports = router;