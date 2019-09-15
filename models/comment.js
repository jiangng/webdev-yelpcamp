var mongoose = require("mongoose");
 
var commentSchema = new mongoose.Schema({
    text: String,
    author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		//Since username is needed frequently, more efficient to save it in commentSchema
		username: String
	}
});
 
module.exports = mongoose.model("Comment", commentSchema);