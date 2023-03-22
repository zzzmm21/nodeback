const mongoose = require('mongoose');

const articleSchema = mongoose.Schema(
  {
    autoIncrementField: { type: Number, default: 0 },
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
    hitCount: {
      type: Number,
      // required: true,
    },
    hashtags: {
      type: [String],
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

articleSchema.pre('save', async function (next) {
  const doc = this;
  const lastDoc = await Article.findOne().sort({ autoIncrementField: -1 });
  if (lastDoc && lastDoc.autoIncrementField) {
    doc.autoIncrementField = lastDoc.autoIncrementField + 1;
  } else {
    doc.autoIncrementField = 1;
  }
  next();
});

const Article = mongoose.model('Article', articleSchema);

module.exports = { Article };
