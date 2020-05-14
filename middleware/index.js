const middlewareObj = {},
	  Campground = require('../models/campground'),
	  Comment = require('../models/comment');

middlewareObj.checkCampgroundOwnership = function(req, res, next) {
	if (req.isAuthenticated()){
		Campground.findById(req.params.id, (err, campground) => {
			if (err || !campground) {
				req.flash("error", "Campground not found.");
				res.redirect("back");
			} else {
				if (campground.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash("error", "Permission Denied.")
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You must log in first.");
		res.redirect("back");
	}
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
	if (req.isAuthenticated()){
		Comment.findById(req.params.comment_id, (err, comment) => {
			if (err || !comment) {
				req.flash("error", "Comment not found.");
				res.redirect("back");
			} else {
				if (comment.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash("error", "Permission Denied.")
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You must log in first.");
	}
}

middlewareObj.isLoggedIn = function(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	req.flash("error", "You must log in first.");
	res.redirect('/login');
}

module.exports = middlewareObj;