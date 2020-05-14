const mongoose = require('mongoose'),
	  passportLocalMongoose = require('passport-local-mongoose');

let UserSchema = new mongoose.Schema({
	username: String,
	password: String,
	avatar: String,
	avatarId: String,
	firstName: String,
	lastName: String,
	phoneNumber: String,
	email: String,
	gender: String,
	birthday: String,
	country: String,
	favoritePlace: String,
	createdAt: { type: Date, default: Date.now},
	isAdmin: {type: Boolean, default: false},
	likedCampgrounds: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Campground"
		}
	]
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);