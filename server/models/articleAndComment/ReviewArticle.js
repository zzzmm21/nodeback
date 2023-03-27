const mongoose = require('mongoose');

const reviewArticleSchema = mongoose.Schema(
  {
    autoIncrementField: { type: Number, default: 0 },
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      // required: true,
    },
    content: {
      type: String,
      // required: true,
    },
    hashtags: {
      type: [String],
      // required: true,
    },
    hitCount: {
      type: Number,
      default: 0,
      // required: true,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
  },
  { timestamps: true }
);

reviewArticleSchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew) {
    const lastDoc = await ReviewArticle.findOne().sort({
      autoIncrementField: -1,
    });
    if (lastDoc && lastDoc.autoIncrementField) {
      doc.autoIncrementField = lastDoc.autoIncrementField + 1;
    } else {
      doc.autoIncrementField = 1;
    }
  }
  next();
});

const ReviewArticle = mongoose.model('ReviewArticle', reviewArticleSchema);

module.exports = { ReviewArticle };
