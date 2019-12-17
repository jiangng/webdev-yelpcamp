var mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);

//SCHEMA SETUP
var campgroundSchema = new mongoose.Schema({
	name: String,
	price: Number,
	image: String,
	imageId: String, 
	description: String,
	location: String,
	lat: Number,
	lng: Number,
	createdAt: {
		type: Date,
		default: Date.now
	},
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	],
	reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    }
});

const Comment = require('./comment');

module.exports = mongoose.model("Campground", campgroundSchema);