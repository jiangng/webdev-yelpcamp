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

//requiring routes
var indexRoutes = require("./routes/index"),
	campgroundRoutes = require("./routes/campgrounds"),
	commentRoutes = require("./routes/comments");
mongoose.connect("mongodb://localhost/yelp_camp", {useNewUrlParser: true});
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.set("view engine", "ejs");
//seedDB();

//PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "Yokata",
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
app.use(function(req, res, next) {
	//if the user not logged in, req.user == undefined
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

//The first argument helps shorten url in the ROUTES files if all routes share common prefix
app.use(indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

app.listen(3000, function() {
	console.log("Yelp Camp Server has started.");
});
