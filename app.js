const express = require('express'),
	  app = express(),
	  bodyParser = require('body-parser'),
	  mongoose = require('mongoose'),
	  flash = require('connect-flash'),
	  moment = require('moment'),
	  passport = require('passport'),
	  LocalStrategy = require('passport-local'),
	  expressSession = require('express-session'),
	  methodOverride = require('method-override'),
	  Campground = require('./models/campground'),
	  Comment = require('./models/comment'),
	  User = require('./models/user');
	  //seedDB = require('./seeds');

require('dotenv').config();

const commentsRoutes = require('./routes/comments'),
	  campgroundsRoutes = require('./routes/campgrounds'),
	  indexRoutes = require('./routes/index');

mongoose.connect("mongodb://localhost:27017/yelp_camp", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
app.use(flash());
//seedDB();

//Passport Configuration
app.use(expressSession({
	secret: "This is a secret",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.moment = moment;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use(indexRoutes);
app.use('/campgrounds', campgroundsRoutes);
app.use('/campgrounds/:id/comments', commentsRoutes);

app.listen("3000", () => {
	console.log("Server is running on port 3000!");
});
