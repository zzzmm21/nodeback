const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const http = require('http');
const bodyParser = require('body-parser');
const { User } = require('./models/User');
const { auth } = require('./middleware/auth');
const { Category } = require('./models/Category');
const cors = require('cors');
const socketio = require('socket.io');
const server = http.createServer(app);
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js');
const router = require('./router');

const { Meeting } = require('./models/Meeting');

app.use(router);
app.use(bodyParser.urlencoded({ extended: true }));

const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
});

server.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

io.on('connection', (socket) => {
  console.log('새로운 connection이 발생하였습니다.');
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) return callback({ error: '에러가 발생했어요.' });

    socket.emit('message', {
      user: 'admin',
      text: `${user.name}, ${user.room}에 오신것을 환영합니다.`,
    });
    socket.broadcast.to(user.room).emit('message', {
      user: 'admin',
      text: `${user.name} 님이 가입하셨습니다.`,
    });
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    socket.join(user.room);

    callback();
  });
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit('message', { user: user.name, text: message });
    callback();
  });
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', {
        user: 'Admin',
        text: `${user.name} 님이 방을 나갔습니다.`,
      });
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
    console.log('유저가 떠났어요.');
  });
});
// application/json
app.use(bodyParser.json());
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(cors());
app.get('/', (req, res) => {
  res.send('Hello, Expresasassafs!');
});

app.get('/api/hello', (req, res) => {
  res.send('안녕하세요');
});

const config = require('./config/key');
const mongoose = require('mongoose');
const { Notelist } = require('./models/Notelist');
mongoose.set('strictQuery', true);

mongoose
  .connect(config.mongoURI, {})
  .then(() => console.log('MongoDB Connected...'))
  .catch((arr) => console.log(arr));

const multer = require('multer');

// multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // 파일 저장 경로 설정
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname); // 파일 이름 설정
  },
});
const upload = multer({ storage: storage }).fields([
  { name: 'imgFile', maxCount: 1 },
  { name: 'file', maxCount: 1 },
]);

// upload 함수 내보내기

app.post('/api/users/register', (req, res) => {
  // 파일 업로드 처리
  upload(req, res, (err) => {
    if (err) {
      // 업로드 오류 처리
      if (err instanceof multer.MulterError) {
        return res.json({ success: false, message: '파일 업로드 오류 발생' });
      } else {
        return res.json({ success: false, message: '알 수 없는 오류 발생' });
      }
    }

    // 클라이언트에서 보낸 데이터 추출
    const { name, email, password, nickname, gender, date } = req.body;

    // User 모델 생성
    const user = new User({
      name,
      email,
      password,
      nickname,
      gender,
      date,
    });

    // User 모델 저장
    user.save((err, doc) => {
      if (err) {
        return res.json({ success: false, err });
      }
      res.status(200).json({
        success: true,
      });
    });
  });
});

app.get('/api/category', async (req, res) => {
  try {
    const accounts = await Category.find();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get('/api/notelist', async (req, res) => {
  try {
    const accounts = await Notelist.find();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/notelist/user', auth, async (req, res) => {
  try {
    const user = req.user._id;
    const accounts = await Notelist.find({ author: user });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get('/api/notelist/post', (req, res) => {
  User.find({})
    .sort({ postCount: -1 }) // postCount 기준으로 내림차순 정렬
    .exec((err, users) => {
      if (err) return res.status(400).send(err);
      return res.status(200).json({ success: true, users });
    });
});
app.put('/api/users/:id/bookgoal', (req, res) => {
  const userId = req.params.id;
  const { bookGoal } = req.body;

  User.findByIdAndUpdate(
    userId,
    { bookGoal: bookGoal },
    { new: true },
    (err, updatedUser) => {
      if (err) return res.status(500).send(err);
      return res.status(200).json(updatedUser);
    }
  );
});

app.post('/api/notelist/user', auth, (req, res, next) => {
  const notelist = new Notelist(req.body);

  // 현재 로그인한 유저의 정보를 author로 추가합니다.
  notelist.author = req.user._id;

  notelist.save((err, notelistInfo) => {
    if (err) return res.json({ success: false, err });
    // 노트 리스트 저장 후, POSTCOUNT 값을 업데이트합니다.
    Notelist.countDocuments({ author: req.user._id }, (err, count) => {
      if (err) return next(err);

      User.findOneAndUpdate(
        { _id: req.user._id },
        { postCount: count },
        { new: true },
        (err, userInfo) => {
          if (err) return next(err);
          res.status(200).json({
            success: true,
            userInfo,
          });
        }
      );
    });
  });
});
app.post('/api/category', (req, res) => {
  // 회원가에 필요한 정보들을 클라이언트에서 가져오면 그것들을 데이터베이스에 넣어준다.
  const category = new Category(req.body);

  category.save((err, categoryInfo) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true,
    });
  });
});
app.delete('/api/notelist/:id', (req, res) => {
  const id = req.params.id;

  Notelist.findOneAndDelete({ _id: id }, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: '삭제 실패' });
    } else if (!result) {
      res.status(404).json({ message: '해당하는 노트가 없습니다.' });
    } else {
      console.log('삭제 완료');
      res.json({ message: '삭제 완료' });
    }
  });
});
app.get('/api/user/:id/bookgoal', (req, res) => {
  const id = req.params.id;

  User.findOne({ _id: id }, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: '조회 실패' });
    } else if (!result) {
      res.status(404).json({ message: '해당하는 사용자가 없습니다.' });
    } else {
      console.log('조회 완료');
      res.json(result);
    }
  });
});
app.get('/api/notelist/:id', (req, res) => {
  const id = req.params.id;

  Notelist.findOne({ _id: id }, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: '불러오기 실패!' });
    } else if (!result) {
      res.status(404).json({ message: '해당하는 노트가 없습니다.' });
    } else {
      res.json({ message: '불러오기 완료!', note: result });
    }
  });
});
app.put('/api/notelist/:id', (req, res) => {
  const id = req.params.id;
  const updatedNote = req.body;

  Notelist.findOneAndUpdate(
    { _id: id },
    updatedNote,
    { new: true },
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: '업데이트 실패' });
      } else if (!result) {
        res.status(404).json({ message: '해당하는 노트가 없습니다.' });
      } else {
        console.log('업데이트 완료');
        res.json({ message: '업데이트 완료', updatedNote: result });
      }
    }
  );
});
app.put('/api/notelist/:id/hit', async (req, res) => {
  const id = req.params.id;

  const userId = req.user?.id;
  const ipAddress = req.ip;

  try {
    const note = await Notelist.findById(id);

    if (!note) {
      return res.status(404).json({ message: '해당하는 노트가 없습니다.' });
    }

    const isHitDuplicate = note.hits.some(
      (hit) => hit.userId?.toString() === userId || hit.ipAddress === ipAddress
    );

    if (!isHitDuplicate) {
      note.hits.push({ userId, ipAddress });
      await note.save();

      note.hit += 1;
      await note.save();

      res.json({ message: '조회수 증가 완료!', note });
    } else {
      res.json({ message: '이미 조회한 사용자입니다.', note });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '조회수 증가 실패!' });
  }
});

/// 좋아요
app.put('/api/notelist/:id/like', auth, async (req, res) => {
  const noteId = req.params.id;
  const userId = req.user._id; // 로그인한 사용자의 ID

  try {
    // 노트 조회
    const note = await Notelist.findById(noteId);

    // 중복 좋아요 확인
    if (userId && note.likesBy.includes(userId)) {
      return res.status(400).json({ message: '이미 좋아요를 눌렀습니다.' });
    }

    // 좋아요 증가
    note.likesBy.push(userId);
    note.likes++;
    // 노트 업데이트
    const updatedNote = await note.save();

    res.json({ message: '좋아요가 추가되었습니다.', note: updatedNote });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '좋아요가 안되었요' });
  }
});

app.delete('/api/notelist/:id/unlike', auth, async (req, res) => {
  const noteId = req.params.id;
  const userId = req.user._id; // 로그인한 사용자의 ID

  try {
    // 노트 조회
    const note = await Notelist.findById(noteId);

    // 좋아요 정보 삭제
    if (userId) {
      const index = note.likesBy.indexOf(userId);
      if (index !== -1) {
        note.likesBy.splice(index, 1);
        note.likes--;
      }
    }

    // 노트 업데이트
    const updatedNote = await note.save();

    res.json({ message: '좋아요가 취소되었습니다.', note: updatedNote });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '좋아요 취소가 안되었어요' });
  }
});

app.post('/api/users/login', (req, res) => {
  // 요청된 이메일을 데이터베이스에서 있는지 찾는다.
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: '해당하는 유저가 존재하지 않습니다.',
      });
    }

    // 요청된 이메일이 데이터베이스에 있다면 비밀번호가 일치하는지 확인.
    user.comparePassowrd(req.body.password, (err, isMatch) => {
      if (!isMatch)
        return res.json({
          loginSuccess: false,
          message: '비밀번호가 일치하지 않습니다.',
        });
      // 비밀번호까지 일치하다면 해당 유저 Token 생성.
      user.generateToken((err, user) => {
        res.cookie('x_auth', user.token).status(200).json({
          loginSuccess: true,
          userId: user._id,
          usertoken: user.token,
        });
      });
    });
  });
});

// role 1 어드민    role 2 특정 부서 어드민
// role 0 -> 일반유저   role 0이 아니면  관리자
app.get('/api/users/auth', auth, (req, res) => {
  //여기 까지 미들웨어를 통과해 왔다는 얘기는  Authentication 이 True 라는 말.
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image,
  });
});

app.get('/api/users/logout', auth, (req, res) => {
  // console.log('req.user', req.user)
  User.findOneAndUpdate({ _id: req.user._id }, { token: '' }, (err, user) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({
      success: true,
    });
  });
});

router.get('/search', async (req, res) => {
  const { keyword } = req.query;
  try {
    const result = await Notelist.find({
      title: { $regex: keyword, $options: 'i' },
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// const multer = require("multer"); // (1)
// const {v4:uuid} = require("uuid");
// const mime = require("mime-types");
// const dotenv = require("dotenv");
// const storage = multer.diskStorage({ // (2)
//   destination: (req, file, cb) => { // (3)
//     cb(null, "images");
//   },
//   filename: (req, file, cb) => { // (4)
//     cb(null, `${uuid()}.${mime.extension(file.mimetype)}`); // (5)
//   },
// });

// const upload = multer({ // (6)
//   storage,
//   fileFilter: (req, file, cb) => {
//       if (["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype))
//           cb(null, true);
//       else
//           cb(new Error("해당 파일의 형식을 지원하지 않습니다."), false);
//       }
//   ,
//   limits: {
//       fileSize: 1024 * 1024 * 5
//   }
// });

// app.post("/api/upload", upload.single("file"), (req, res) => { // (7)
//   res.status(200).json(req.file);
// });

// app.use("/images", express.static(path.join(__dirname, "/images")));

console.log('--------------------------------------------------------');

const uploadmt = multer();

app.post('/api/meeting/create', upload, (req, res) => {
  // console.log(req.file); // imgFile 필드의 파일 데이터
  console.log(req.files); // 모든 파일 데이터
  const meetingData = {
    ...req.body,
    imgFile: req.files.imgFile[0].path,
    members: [
      {
        user: req.body.creator,
        role: 'host',
        status: 'host',
      },
    ],
  };
  const meeting = new Meeting(meetingData);
  // console.log(meetingData);
  meeting.save((err, doc) => {
    // console.dir(err);
    if (err) {
      return res.json({ success: false, message: err.message });
    }

    const firstMeeting = {
      date: req.body.firstDate,
      location: req.body.location,
      attendance: [],
    };

    Meeting.findByIdAndUpdate(
      doc._id,
      { $push: { order: firstMeeting } },
      { new: true },
      (err, result) => {
        if (err) {
          return res.json({ success: false, err });
        }
        return res.status(200).json({
          success: true,
          meetingId: result._id,
          result: result,
        });
      }
    );
  });
});

// 모든 모임 조회
app.get('/api/meeting/all', (req, res) => {
  Meeting.find({})
    .populate('creator')
    .then((meetings) => {
      const transformedMeetings = meetings.map((meeting) => {
        return {
          ...meeting._doc,
          creatorName: meeting.creator.name,
        };
      });
      res.status(200).json({ success: true, meetings: transformedMeetings });
    })
    .catch((err) => {
      console.log(err);
      return res.json({ success: false, err });
    });
});

app.get('/api/meeting/allorders', async (req, res) => {
  console.log(req);
  const filter = {};
  const allOrders = await Meeting.find(filter).select(
    '_id autoIncrementField title order.date'
  );
  res.json(allOrders);
});

// 모임 1개 조회
app.get('/api/meeting/:no', async (req, res) => {
  try {
    const meetingNo = req.params.no;
    const meeting = await Meeting.findOne({
      autoIncrementField: meetingNo,
    }).populate('members.user');
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    const members = meeting.members.map((member) => ({
      name: member.user.name,
      role: member.role,
      status: member.status,
      gender: member.gender,
      file: member.file,
      nickname: member.nickname,
      age: calculateAge(member.user.date),
    }));
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// user별 모임 조회(모임제목, 유저 role, meetingStatus, order)
app.get('/api/meetings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const meetings = await Meeting.find(
      { 'members.user': userId },
      {
        autoIncrementField: 1,
        title: 1,
        'members.$': 1,
        meetingStatus: 1,
        order: 1,
      }
    );
    res.json(meetings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/api/meeting/:no/register', uploadmt.none(), (req, res) => {
  const meetingNo = req.params.no;
  console.log(meetingNo);
  const newMember = {
    user: req.body.userId,
  };

  console.log(req.body);
  Meeting.findOneAndUpdate(
    { autoIncrementField: meetingNo }, // 쿼리 객체
    { $push: { members: newMember } }, // 업데이트 객체
    { new: true },
    (err, result) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).json({
        success: true,
        meetingNo: result._id,
      });
    }
  );
});

// 나이계산
const calculateAge = (birthday) => {
  const ageDifMs = Date.now() - birthday.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

app.get('/api/meeting/admin/:no/allmembers', async (req, res) => {
  try {
    const meetingNo = req.params.no;
    const meeting = await Meeting.findOne({
      autoIncrementField: meetingNo,
    }).populate('members.user');
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    const members = meeting.members.map((member) => ({
      name: member.user.name,
      role: member.role,
      status: member.status,
      gender: member.gender,
      file: member.file,
      nickname: member.nickname,
      age: calculateAge(member.user.date),
    }));
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 모임별 order 조회
app.get('/api/meeting/:no/orders', async (req, res) => {
  try {
    const meetingNo = req.params.no;
    const meeting = await Meeting.findOne({
      autoIncrementField: meetingNo,
    });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    const orders = meeting.order.map((order) => ({
      title: meeting.title,
      orderNo: order.autoIncrementField,
      date: order.date,
    }));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
