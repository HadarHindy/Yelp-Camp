const express = require('express'),
	  router = express.Router(),
	  passport = require('passport'),
	  moment = require('moment'),
	  User = require('../models/user'),
	  Campground = require('../models/campground'),
	  Comment = require('../models/comment'),
	  multer = require('multer'),
	  cloudinary = require('cloudinary');

// MULTER CONFIG
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter});

// CLOUDINARY CONFIG
cloudinary.config({ 
  cloud_name: 'hhadar', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.get("/", (req, res) => {
	res.render("landing");
});

// AUTH ROUTES

router.get('/register', (req, res) => {
	res.render('register', {page: 'register'});
});

router.post('/register', upload.single('avatar'), (req, res) => {
	let str = req.body.year + '-' +  req.body.month + "-" + req.body.day;
	let date = moment(str).format("YYYY MMMM DD");
	cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
		if (err) {
			req.flash("error", "Error while uploading the image. Please try again.");
			res.redirect("back");
		} else {
			let newUser = new User({username: req.body.username, avatar: result.secure_url, avatarId:  result.public_id, firstName: req.body.firstName, lastName: req.body.lastName, phoneNumber: req.body.phoneNumber, email: req.body.email, gender: req.body.gender, birthday: date, country: req.body.country, favoritePlace: req.body.favoritePlace, isAdmin: false});
			User.register(newUser, req.body.password, (err, user) => {
				if (err) {
					console.log(err);
					req.flash("error", err.message);
					return res.redirect('/register');
				}
				passport.authenticate("local")(req, res, () => {	
					req.flash("Success", "Welcome to Yelp Camp " + user.username);
					res.redirect('/campgrounds');
				});
			});
		}
	});	
});	

// ====================================
// LOGIN ROUTES

router.get('/login', (req, res) => {
	res.render('login', {page: 'login'});
});

router.post('/login', passport.authenticate("local", 
	{
		successRedirect: "/campgrounds",
		failureRedirect: "/login",
		successFlash: "Welcome Back To Yelp Camp!",
		failureFlash: true
	}), (req, res) => {
});

// ====================================
// LOGOUT ROUTE

router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/campgrounds');
});


// USER PROFILE ROUTE
router.get('/users/:id', (req, res) => {
	User.findById(req.params.id, (err, foundUser) => {
		if (err) {
			req.flash("error", "Something went wrong.");
			return res.redirect("back");
		}
		Campground.find().where("author.id").equals(foundUser._id).exec((err, campgrounds) => {
			if (err) {
				req.flash("error", "Something went wrong.");
				return res.redirect("back");
			}
			Comment.find().where("author.id").equals(foundUser._id).exec((err, comments) => {
				if (err) {
					req.flash("error", "Something went wrong.");
					return res.redirect("back");
				}
				res.render("users/show", {user: foundUser, campgrounds: campgrounds, comments: comments});
			});	
		});	
	});	
});


module.exports = router;