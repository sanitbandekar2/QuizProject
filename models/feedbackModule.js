var mongoose = require("mongoose");

var Schema = mongoose.Schema;

feedBackSchema = new Schema({
  name: String,
  email: String,
  comment: String,
});
const feedBack = mongoose.model("feedback", feedBackSchema);

module.exports = feedBack;
