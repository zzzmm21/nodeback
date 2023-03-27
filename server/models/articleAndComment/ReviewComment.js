const mongoose = require('mongoose');

const reviewCommentSchema = mongoose.Schema(
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

reviewCommentSchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew) {
    const lastDoc = await ReviewComment.findOne().sort({
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

const ReviewComment = mongoose.model('ReviewComment', reviewCommentSchema);

module.exports = { ReviewComment };
