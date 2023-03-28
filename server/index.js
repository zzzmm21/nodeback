const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const http = require('http');
const bodyParser = require('body-parser');
const { User } = require('./models/User');
const { auth } = require('./middleware/auth');
const { Category } = require('./models/Category');
const { BComment } = require('./models/BComment');
const { Book } = require('./models/Book');
const cors = require('cors');
const socketio = require('socket.io');
const server = http.createServer(app);
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js');
const router = require('./router');

const bcommentRouter = require('./routes/bcomment');
app.use(bcommentRouter);

const meetingRoutes = require('./routes/meeting');
app.use(meetingRoutes);

const faqRoutes = require('./routes/faqBoard');
app.use(faqRoutes);

const meetingBoardRoutes = require('./routes/meetingBoard');
app.use(meetingBoardRoutes);

const reviewRoutes = require('./routes/reviewBoard');
app.use(reviewRoutes);

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
      text: `${user.name} 모임방에 오신것을 환영합니다.`,
    });
    socket.broadcast.to(user.room).emit('message', {
      user: 'admin',
      text: `${user.name} 님이 입장하셨습니다.`,
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
const path = require('path');

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
const upload = multer({ storage: storage }).single('file');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
      imgpath: {
        contentType: req.file.mimetype,
        path: req.file.path,
      },
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

app.put('/api/users/me', auth, (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      // 업로드 오류 처리
      if (err instanceof multer.MulterError) {
        return res.json({ success: false, message: '파일 업로드 오류 발생' });
      } else {
        return res.json({ success: false, message: '알 수 없는 오류 발생' });
      }
    }

    const { name, email, password, nickname, gender, date } = req.body;

    // 새로운 비밀번호가 입력된 경우 해싱하여 저장

    User.findByIdAndUpdate(
      req.user._id,
      {
        name: name,
        email: email,
        password: password,
        nickname: nickname,
        gender: gender,
        date: date,
        imgpath: {
          contentType: req.file.mimetype,
          path: req.file.path,
        },
      },
      { new: true },
      (err, user) => {
        if (err) {
          console.error(err);
          return res.status(500).send({ message: '서버 오류 발생' });
        }

        res.send({ message: '사용자 정보가 업데이트 되었습니다.', user });
      }
    );
  });
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

app.delete('/api/notelist/:id', (req, res) => {
  const id = req.params.id;

  Notelist.findOneAndDelete({ _id: id }, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to delete' });
    } else if (!result) {
      res.status(404).json({ message: 'There is no such note.' });
    } else {
      console.log('Delete complete');

      // Find the corresponding user and update the postCount field by subtracting 1
      User.findByIdAndUpdate(
        result.author,
        { $inc: { postCount: -1 } },
        { new: true },
        (err, updatedUser) => {
          if (err) return res.status(500).send(err);
          res.json({ message: 'Delete complete', user: updatedUser });
        }
      );
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
    nickname: req.user.nickname,
    role: req.user.role,
    imgpath: req.user.imgpath,
    password: req.user.password,
    date: req.user.date,
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

app.get('/search', auth, async (req, res) => {
  const { keyword } = req.query;
  const userId = req.user._id; // get the authenticated user's ID

  try {
    const result = await Notelist.find({
      title: { $regex: keyword, $options: 'i' },
      author: userId, // add filter to only return notes by the authenticated user
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/category', auth, (req, res) => {
  const userId = req.user._id;
  try {
    Notelist.aggregate(
      [
        { $match: { author: userId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        {
          $group: {
            _id: null,
            categories: { $push: { category: '$_id', count: '$count' } },
            totalCount: { $sum: '$count' },
          },
        },
        { $unwind: '$categories' },
        {
          $project: {
            _id: 0,
            category: '$categories.category',
            count: '$categories.count',
            percentage: {
              $multiply: [
                { $divide: ['$categories.count', '$totalCount'] },
                100,
              ],
            },
          },
        },
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ message: 'Internal server error' });
        } else {
          res.json(result);
          console.log(result);
        }
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});



//// 댓글


app.post('/api/Bcomments', (req, res) => {
  console.log(req.body);

  // extract the data sent by the client
  const { content } = req.body;

  const newComment = new BComment({
    content
  });

  newComment.save((err, doc) => {
    if (err) {
      return res.json({ success: false, err });
    }
    res.status(200).json({
      success: true
    });
  });
});
app.get('/api/Bcomments', async (req, res) => {
  try {
    const accounts = await BComment.find();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.delete('/api/comments/:id', (req, res) => {
  const id = req.params.id;

  // 데이터베이스에서 해당 ID의 댓글을 삭제하는 작업 수행
  Comment.findByIdAndDelete(id)
    .then(() => {
      res.send({ message: '댓글이 성공적으로 삭제되었습니다.' });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send({ message: '댓글 삭제에 실패하였습니다.' });
    });
});


/// Book

app.get('/api/Book', async (req, res) => {
  try {
    const accounts = await Book.find();
    res.json(accounts);
    console.log(accounts)
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
