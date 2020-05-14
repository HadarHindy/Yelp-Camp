const express = require('express'),
	  router = express.Router(),
	  Campground = require('../models/campground'),
	  User = require('../models/user'),
	  middleware = require('../middleware'),
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

// INDEX ROUTE - show all campgrounds.
router.get("/", (req, res) => {
	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Campground.find({name: regex}, (err, campgrounds) => {
		// for more search options, can write the following:
			//{$or: [{name: regex}, {location: regex}, {"author.username":regex}]}
			if (err) {
				console.log(err);
			} else {
				if (campgrounds.length < 1) {
					req.flash("error", "Cannot find campgrounds with the given keywords.");
					return res.redirect("back");
				}
				res.render("campgrounds/index", {campgrounds: campgrounds, page: 'campgrounds'});
			}
		});	
	}
	else {
		Campground.find({}, (err, campgrounds) => {
			if (err) {
				console.log(err);
			} else {
				res.render("campgrounds/index", {campgrounds: campgrounds, page: 'campgrounds'});
			}
		});	
	}
});

// CREATE ROUTE - add new campground to the DB
router.post("/", middleware.isLoggedIn, upload.single('image'), (req, res) => {
	cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
		if (err) {
			req.flash("error", "Error while uploading the image. Please try again.");
			res.redirect("back");
		} else {
			// add cloudinary url for the image to the campground object under image property
			req.body.campground.image = result.secure_url;
			// add image's public id to campground object
			req.body.campground.imageId = result.public_id;
			// add author to campground
			req.body.campground.author = {
			id: req.user._id,
			username: req.user.username,
			firstName: req.user.firstName,
			lastName: req.user.lastName,
			phoneNumber: req.user.phoneNumber,
			email: req.user.email };
			//initializing likes counter
			req.body.campground.likes = 0;
			Campground.create(req.body.campground, (err, createdCampground) => {
				if (err) {
					req.flash('error', err.message);
					return res.redirect('back');
				 }
				res.redirect('/campgrounds/' + createdCampground.id);
			});
		}	
	});
});

// NEW ROUTE - show form to create a campground
router.get("/new", middleware.isLoggedIn, (req, res) => {
	res.render("campgrounds/new");
});

// SHOW ROUTE - show more info about one campground
router.get("/:id", (req, res) => {
	Campground.findById(req.params.id).populate("comments").exec((err, foundCampground) => {
		if (err || !foundCampground) {
			req.flash("error", "Campground not found.");
			res.redirect("back");
		} else {
			res.render("campgrounds/show", {campground: foundCampground});
		}
	});	
});

//EDIT ROUTE
router.get('/:id/edit', middleware.checkCampgroundOwnership, (req, res) => {
	Campground.findById(req.params.id, (err, campground) => {
			res.render('campgrounds/edit', {campground: campground});
	});
});

//UPDATE ROUTE
router.put('/:id', middleware.checkCampgroundOwnership,  upload.single('image'), (req, res) => {
	Campground.findById(req.params.id,  async function(err, campground) {
		if (err) {
			req.flash("error", err.message);
			res.redirect('/campgrounds');
		} else {
			if (req.file) {
				try {
					await cloudinary.v2.uploader.destroy(campground.imageId);	
					let result = await cloudinary.v2.uploader.upload(req.file.path);
					campground.image = result.secure_url;
					campground.imageId = result.public_id;
				} catch(err) {
					req.flash("error", err.message);
					return res.redirect('/campgrounds');
				}
			}
			campground.name = req.body.campground.name;
			campground.price = req.body.campground.price;
			campground.address = req.body.campground.address;
			campground.description = req.body.campground.description;
			campground.save();
			req.flash("success", "Campground Successfully Updated!");
			res.redirect('/campgrounds/' + req.params.id);
		}
	});
});	

//DESTROY ROUTE
router.delete('/:id', middleware.checkCampgroundOwnership, (req, res) => {
	Campground.findById(req.params.id, async function(err, campground) {
		if (err) {
			req.flash("error", err.message)
			return res.redirect('/campgrounds');
		} 
		try {
			//deleting campground image
			await cloudinary.v2.uploader.destroy(campground.imageId);
			//deleting users likes of the specific campground
			User.find({}, (err, allUsers) => {
				if (err) { console.log (err); }
				else {
					for (let user of allUsers) {
						for (let i = 0; i < user.likedCampgrounds.length; i++) {
							if (user.likedCampgrounds[i].equals(campground._id)) {
								user.likedCampgrounds.splice(i, 1);	
								user.save();
							}
						}
					}
				}
			});
			
			campground.remove();
			req.flash('success', 'Campground deleted successfully!');
			res.redirect('/campgrounds');	
		} catch(err) {
			req.flash("error", err.message);
			return res.redirect('/campgrounds');
		}
	});
});

// Likes Route
router.post('/:id/like', middleware.isLoggedIn, (req, res) => {
	Campground.findById(req.params.id, (err, foundCampground) => {
		if (err) {
			req.flash("error", err.message);
			res.redirect('/campgrounds');
		} else {
			for(let i = 0; i < req.user.likedCampgrounds.length; i++) {
				if (req.user.likedCampgrounds[i]._id.equals(foundCampground._id)){
					req.user.likedCampgrounds.splice(i, 1);
					req.user.save();
					foundCampground.likes = foundCampground.likes - 1;
					foundCampground.save();
					return res.redirect('/campgrounds/' + req.params.id);
				}
			}
			
			req.user.likedCampgrounds.push(foundCampground);
			req.user.save();
			foundCampground.likes = foundCampground.likes + 1;
			foundCampground.save();
			res.redirect('/campgrounds/' + req.params.id);
		}
	});	
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;