const mongoose = require('mongoose');

const notelistSchema = mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    no: {
      type: Number,
      trim: true,
    },
    category:{
      type: String,
    },
    title: {
      type: String,
      maxLength: 50,
    },
    content: {
      type: String,
      trim: true,
    },
    cr_date: {
      type: Date,
      maxLength: 50,
    },
    hit: {
      type: Number,
      default: 0,
    },
    hits: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        ipAddress: {
          type: String,
        },
      },
    ],
    thumbnail: {
      type: String,
    },
    url: {
      type: String,
    },
    bookcontents: {
      type: String,
    },
    booktitle: {
      type: String,
    },
    publisher: {
      type: String,
    },

    authors: {
      type: Array,
    },
    bookdatetime: {
      type: Date,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likesBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);
notelistSchema.statics.searchByTitle = async function (keyword) {
  const result = await this.find({ title: { $regex: keyword, $options: 'i' } });
  return result;
};

const Notelist = mongoose.model('Notelist', notelistSchema);

module.exports = { Notelist };
notelistSchema.pre('save', async function (next) {
  const note = this;

  try {
    // 노트 작성자의 postCount 값을 1 증가시킴
    await User.updateOne({ _id: note.author }, { $inc: { postCount: 1 } });
    next();
  } catch (err) {
    next(err);
  }
});
