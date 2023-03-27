const mongoose = require('mongoose');

const meetingCommentSchema = mongoose.Schema(
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

meetingCommentSchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew) {
    const lastDoc = await MeetingComment.findOne().sort({
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

const MeetingComment = mongoose.model('MeetingComment', meetingCommentSchema);

module.exports = { MeetingComment };
