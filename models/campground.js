const mongoose = require("mongoose"),
	  Comment = require("./comment"),
	  User = require("./user");

let campgroundSchema = new mongoose.Schema({
	name: String,
	price: String,
	address: String,
	image: String,
	imageId: String,
	description: String,
	createdAt: {type: Date,  default: Date.now},
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String,
		firstName: String,
		lastName: String,
		phoneNumber: String,
		email: String
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	],
	likes: Number
});

campgroundSchema.pre('remove', async function() {
	await Comment.remove({
		_id: {$in: this.comments}
	});
	
});

module.exports = mongoose.model("Campground", campgroundSchema);