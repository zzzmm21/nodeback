const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      maxLength: 50,
    },
    email: {
      type: String,
      trim: true,
      unique: 1,
    },
    password: {
      type: String,
      minLength: 5,
    },
    nickname: {
      type: String,
    },
    gender: {
      type: String,
    },
    date: {
      type: Date,
    },
    role: {
      type: Number,
      default: 0,
    },
    imgpath: {
      contentType: {
        type: String,
      },
      path: {
        type: String,
      },
    },
    token: {
      type: String,
    },
    tokenExp: {
      type: Number,
    },
    postCount: {
      type: Number,
      default: 0,
    },
    bookGoal: {
      type: Number,
      
    },
    notes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notelist',
      },
    ],
  },
  { timestamps: true }
);
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
userSchema.pre('save', function (next) {
  var user = this;
  if (user.isModified('password')) {
    // 비밀번호를 암호화 시킨다.
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) return next(err);

      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

userSchema.methods.comparePassowrd = function (plainPassword, callbackfn) {
  // 입력한 비밀번호와 암호화된 비밀번호를 비교하기위해 입력된 비밀번호도 암호화하여 비교
  bcrypt.compare(plainPassword, this.password, function (err, isMatch) {
    if (err) return callbackfn(err);
    callbackfn(null, isMatch);
  });
};
userSchema.methods.generateToken = function (cb) {
  var user = this;
  // console.log('user._id', user._id)

  // jsonwebtoken을 이용해서 token을 생성하기
  var token = jwt.sign(user._id.toHexString(), 'secretToken');
  // user._id + 'secretToken' = token
  // ->
  // 'secretToken' -> user._id

  user.token = token;
  user.save(function (err, user) {
    if (err) return cb(err);
    cb(null, user);
  });
};
userSchema.statics.findByToken = function (token, cb) {
  var user = this;
  // user._id + ''  = token
  //토큰을 decode 한다.
  jwt.verify(token, 'secretToken', function (err, decoded) {
    //유저 아이디를 이용해서 유저를 찾은 다음에
    //클라이언트에서 가져온 token과 DB에 보관된 토큰이 일치하는지 확인
    user.findOne({ _id: decoded, token: token }, function (err, user) {
      if (err) return cb(err);
      cb(null, user);
    });
  });
};

const User = mongoose.model('User', userSchema);

module.exports = { User };
