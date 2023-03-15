const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        maxLength: 50
       
    },
     value: {
        type: Number,
        trim: true,
      
    },
  
    
   
})
const Category = mongoose.model('Category', categorySchema)

module.exports = { Category }