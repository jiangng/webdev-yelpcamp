var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground")
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var emailAddress = "jiang.ng7@gmail.com";

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

	if (req.body.adminCode === "secretCode123") newUser.isAdmin = true;
	if (req.body.adminCode && req.body.adminCode !== "secretCode123") {
		req.flash("error", "Wrong secret code, please try again.");
		return res.redirect("/register_admin");
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

// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});
	
router.post('/forgot', function(req, res, next) {
  //execute callback after callback 
  async.waterfall([
	//Generate a random token
	//Note: done is just a success callback
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
		//by passing token to done, it is accessible in the next callback below
        done(err, token);
      });
    },
	//Retrieve the user and set its token
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
		  //pass token and user to the next callback
          done(err, token, user);
        });
      });
    },
	//Send the password reset email
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: emailAddress,
          pass: process.env.EMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: emailAddress,
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

//GET Password reset form 
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

//Route to change password
router.post('/reset/:token', function(req, res) {
  async.waterfall([
	//Change password
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
	//Send a confirmation email after pwd changed successfully
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: emailAddress,
          pass: process.env.EMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: emailAddress,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
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