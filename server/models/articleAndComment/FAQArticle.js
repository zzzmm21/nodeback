const mongoose = require('mongoose');

const faqArticleSchema = mongoose.Schema(
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
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FAQArticle',
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
  },
  { timestamps: true }
);

faqArticleSchema.pre('save', async function (next) {
  const doc = this;
  const lastDoc = await FAQArticle.findOne().sort({ autoIncrementField: -1 });
  if (lastDoc && lastDoc.autoIncrementField) {
    doc.autoIncrementField = lastDoc.autoIncrementField + 1;
  } else {
    doc.autoIncrementField = 1;
  }
  next();
});

const FAQArticle = mongoose.model('FAQArticle', faqArticleSchema);

module.exports = { FAQArticle };
