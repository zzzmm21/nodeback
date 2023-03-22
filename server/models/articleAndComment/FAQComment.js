const mongoose = require('mongoose');

const faqCommentSchema = mongoose.Schema(
  {
    autoIncrementField: { type: Number, default: 0 },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: {
      type: String,
      // required: true,
    },
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FAQArticle',
      required: true,
    },
  },
  { timestamps: true }
);

faqCommentSchema.pre('save', async function (next) {
  const doc = this;
  const lastDoc = await FAQComment.findOne().sort({ autoIncrementField: -1 });
  if (lastDoc && lastDoc.autoIncrementField) {
    doc.autoIncrementField = lastDoc.autoIncrementField + 1;
  } else {
    doc.autoIncrementField = 1;
  }
  next();
});

const FAQComment = mongoose.model('FAQComment', faqCommentSchema);

module.exports = { FAQComment };
