const mongoose = require('mongoose');

const BookSchema = mongoose.Schema(
    {
        content: {
            type: String,
            trim: true,
        },

        book_title: {
            type: String,
            trim: true,
        },

        book_author: {
            type: String,
            trim: true,
        },

        book_publisher: {
            type: String,
            trim: true,
        },


        book_ISBN: {
            type: String,
            trim: true,
        },


        book_img_url: {
            type: String,
            trim: true,
        },


        book_category_id: {
            type: String,
            trim: true,
        },


    });


const Book = mongoose.model('Book', BookSchema);


module.exports = { Book };
