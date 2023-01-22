var mongoose = require("mongoose");
var Schema = mongoose.Schema;

resultSchema = new Schema({
  quiz_id: String,
  score: String,
  questionLimit: String,
  userId: String,
  section: String,
  percentage: Number,
});
const result = mongoose.model("result", resultSchema);

module.exports = result;
