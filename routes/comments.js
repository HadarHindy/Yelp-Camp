const express = require('express'),
	  router = express.Router({mergeParams: true}),
	  Campground = require('../models/campground'),
	  Comment = require('../models/comment'),
	  middleware = require('../middleware');

//COMMENTS NEW ROUTE
router.get("/new", middleware.isLoggedIn, (req, res) => {
	Campground.findById(req.params.id, (err, campground) => {
		if (err|| !campground) {
			req.flash("error", "Campground not found.");
			res.redirect("back");
		} else {
			res.render("comments/new", {campground: campground});
		}
	});
});

//COMMENTS CREATE ROUTE
router.post("/", middleware.isLoggedIn, (req, res) => {
	Campground.findById(req.params.id, (err, campground) => {
		if (err) {
			console.log(err);
		} else {
			Comment.create(req.body.comment, (err, createdComment) => {
				if (err) {
					req.flash("error", "Oops, Something went wrong!");
					console.log(err);
				} else {
					createdComment.author.id = req.user._id;
					createdComment.author.username = req.user.username;
					createdComment.save();
					campground.comments.push(createdComment);
					campground.save();
					req.flash("success", "Comment added successfully!");
					res.redirect("/campgrounds/" + campground._id);
				}
			});
		}
	});
});

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
	Campground.findById(req.params.id, (err, foundCampground) => {
		if (err || !foundCampground) {
			req.flash("error", "Campground not found.");
			return res.redirect("back");
		}
		Comment.findById(req.params.comment_id, (err, foundComment) => {
			if (err) {
				res.redirect("back");
			} else {
				res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
			}
		});	
	});
});

// COMMENT UPDATE ROUTE
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) => {
		if (err) {
			res.redirect("back");
		} else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
	Comment.findByIdAndRemove(req.params.comment_id, (err) => {
		if (err) {
			res.redirect("back");
		} else {
			Campground.findByIdAndUpdate(req.params.id, {$pull: {comments: req.params.comment_id}}, (err, data) => {
				if (err) {
					console.log(err);
				} else {
					req.flash("success", "Comment deleted.");
					res.redirect("/campgrounds/" + req.params.id);
				}
			});		
		}
	});
});

module.exports = router;