const mongoose = require('mongoose');

const BCommentSchema = mongoose.Schema(
  {
      content: {
        type: String,

      },
  
    });


const BComment = mongoose.model('BComment', BCommentSchema);


module.exports = { BComment };
