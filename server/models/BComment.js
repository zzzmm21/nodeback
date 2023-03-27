const mongoose = require('mongoose');

const BCommentSchema = mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
    },
  
    });


const BComment = mongoose.model('BComment', BCommentSchema);


module.exports = { BComment };
