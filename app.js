require('dotenv').config();

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var flash = require("connect-flash");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");
var Campground = require("./models/campground");
var Comment = require("./models/comment");
var User = require("./models/user");
var seedDB = require("./seeds");
var session = require('express-session');
var redis = require('redis');
var RedisStore = require('connect-redis')(session);

//requiring routes
var commentRoutes    = require("./routes/comments"),
    reviewRoutes     = require("./routes/reviews"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index")
//Make use of environment variable to set the database, either dev (local db) or production (cloud db)
var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp";
mongoose.connect(url, {
	useNewUrlParser: true,
	useCreateIndex: true
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.set("view engine", "ejs");
//seedDB();

app.locals.moment = require('moment');

//PASSPORT (and redis) CONFIGURATION
//Note that REDIS_URL is None in localhost; only valid on heroku
var client  = redis.createClient(process.env.REDIS_URL); 
var store = new RedisStore({client: client});
app.use(session({
	secret: "Yokata",
	store: store,
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//parameter(s) of app.use() is middleware/callback that will be executed for every request to app
//Every response's local will carry key "currentUser", ie res.render("blah", {currentUser: req.user});
app.use(async function(req, res, next) {
	//if the user not logged in, req.user == undefined
	res.locals.currentUser = req.user;
	if(req.user) {
		try {
			let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
			res.locals.notifications = user.notifications.reverse();
		} catch(err) {
			console.log(err.message);
		}
	}
	
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

//The first argument helps shorten url in the ROUTES files if all routes share common prefix
app.use(indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

const port = process.env.PORT || 3000;
app.listen(port, function() {
	console.log("Yelp Camp Server has started.");
});

