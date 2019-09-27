var mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);

//SCHEMA SETUP
var campgroundSchema = new mongoose.Schema({
	name: String,
	price: String,
	image: String,
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
	]
});

const Comment = require('./comment');
//Called before campground.remove() is called in the DELETE route
campgroundSchema.pre('deleteOne', async function() {
	try {
		await Comment.remove({
			_id: {
				$in: this.comments
			}
		});
	} catch(err) {
		console.log(err);
	}
});

module.exports = mongoose.model("Campground", campgroundSchema);