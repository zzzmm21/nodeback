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
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['host', 'member'],
          default: 'member',
        },
        status: {
          type: String,
          enum: [
            'host',
            'provisional_member',
            'full_member',
            'rejected_member',
          ],
          default: 'provisional_member',
        },
      },
    ],
    title: {
      type: String,
      // required: true,
    },
    meetingStatus: {
      type: String,
      enum: ['recruiting', 'in_progress', 'completed'],
      default: 'recruiting',
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
      type: String,
    },
    order: [
      {
        autoIncrementField: { type: Number, default: 0 },
        date: {
          type: String,
        },
        location: {
          type: String,
        },
        attendance: [
          {
            autoIncrementField: { type: Number, default: 0 },
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          { timestamps: true },
        ],
      },
      { timestamps: true },
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
