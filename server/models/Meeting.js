const mongoose = require('mongoose');

const meetingSchema = mongoose.Schema(
  {
    autoIncrementField: { type: Number, default: 0 },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    title: {
      type: String,
      // required: true,
    },
    maxNum: {
      type: Number,
      // required: true,
    },
    types: {
      writing: {
        type: Boolean,
        // required: true,
      },
      discussion: {
        type: Boolean,
        // required: true,
      },
    },
    hashtags: {
      type: [String],
      // required: true,
    },
    category: {
      novel: {
        type: Boolean,
        // required: true,
      },
      poem: {
        type: Boolean,
        // required: true,
      },
      science: {
        type: Boolean,
        // required: true,
      },
    },
    genderOpened: {
      type: Boolean,
      default: false,
      // required: true,
    },
    ageOpened: {
      type: Boolean,
      default: false,
      // required: true,
    },
    introduce: {
      type: String,
      // required: true,
    },
    imgFile: {
      type: Buffer,
    },
    order: [
      {
        date: {
          type: String,
        },
        location: {
          type: String,
        },
        attendance: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

meetingSchema.pre('save', async function (next) {
  const doc = this;
  const lastDoc = await Meeting.findOne().sort({ autoIncrementField: -1 });
  if (lastDoc && lastDoc.autoIncrementField) {
    doc.autoIncrementField = lastDoc.autoIncrementField + 1;
  } else {
    doc.autoIncrementField = 1;
  }
  next();
});

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = { Meeting };
