const express = require('express');
const router = express.Router();
const { Meeting } = require('../models/Meeting');
const bodyParser = require('body-parser');
const multer = require('multer');
const uploadmt = multer();
const mongoose = require('mongoose');

router.use(bodyParser.json());

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
const upload = multer({ storage: storage }).single('imgFile');

router.post('/api/meeting/create', upload, (req, res) => {
  // console.log(req.file); // imgFile 필드의 파일 데이터
  // console.log(req.file); // 모든 파일 데이터
  const meetingData = {
    ...req.body,
    imgFile: req.file.path,
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
router.get('/api/meeting/all', (req, res) => {
  // console.log('요청');
  Meeting.find({})
    .populate('creator')
    .then((meetings) => {
      console.log(meetings);
      const transformedMeetings = meetings.map((meeting) => {
        return {
          ...meeting._doc,
          creatorName: meeting.creator ? meeting.creator.name : 'Unknown',
        };
      });
      // console.log(transformedMeetings);
      res.status(200).json({ success: true, meetings: transformedMeetings });
    })
    .catch((err) => {
      // console.log(err);
      return res.json({ success: false, err });
    });
});

router.get('/api/meeting/allorders', async (req, res) => {
  const filter = {};
  const allOrders = await Meeting.find(filter).select(
    '_id autoIncrementField title order.date'
  );
  const result = allOrders.map((order) => {
    return {
      ...order.toObject(),
      meetingNo: order.autoIncrementField,
      autoIncrementField: undefined,
    };
  });
  res.json(result);
});

// 모임별 정보 조회
router.get('/api/meeting/:no', async (req, res) => {
  try {
    const meetingNo = req.params.no;
    const meeting = await Meeting.findOne({
      autoIncrementField: meetingNo,
    })
      .populate('members.user')
      .populate('creator', 'name');
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// user별 모임 조회(모임제목, 유저 role, meetingStatus, order)
router.get('/api/users/:userId/meetings', async (req, res) => {
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
        imgFile: 1,
        maxNum: 1,
      }
    );
    res.json(meetings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// 모임가입
router.post('/api/meeting/:no/register', uploadmt.none(), (req, res) => {
  const meetingNo = req.params.no;

  // console.log(`meetingNo: ${meetingNo}`);
  // console.log(`userId: ${req.body.userId}`);

  Meeting.findOne({ autoIncrementField: meetingNo }, (err, meeting) => {
    if (err) return res.json({ success: false, err });

    const isMember = meeting.members.some(
      (member) => member.user.toString() === req.body.userId
    );

    if (isMember) {
      // 중복 회원 처리
      return res.status(400).json({
        success: false,
        message: '이미 가입신청 했습니다',
      });
    } else {
      // 회원 가입 처리
      const newMember = {
        user: req.body.userId,
      };

      Meeting.findOneAndUpdate(
        { autoIncrementField: meetingNo },
        { $push: { members: newMember } },
        { new: true },
        (err, result) => {
          if (err) return res.json({ success: false, err });
          return res.status(200).json({
            success: true,
            meetingNo: result._id,
          });
        }
      );
    }
  });
});

// 나이계산
const calculateAge = (birthday) => {
  const ageDifMs = Date.now() - birthday.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// 모임별 members조회
// app.get('/api/meeting/admin/:no/allmembers', async (req, res) => {
router.get('/api/meeting/:no/members', async (req, res) => {
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
      userId: member.user._id,
      role: member.role,
      status: member.status,
      gender: member.user.gender,
      imgpath: member.user.imgpath,
      nickname: member.nickname,
      age: calculateAge(member.user.date),
    }));
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 모임별 order 조회
router.get('/api/meeting/:no/orders', async (req, res) => {
  try {
    const meetingNo = req.params.no;
    const meeting = await Meeting.findOne({
      autoIncrementField: meetingNo,
    });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    const orders = meeting.order.map((order) => ({
      meetingNo: meeting.autoIncrementField,
      title: meeting.title,
      orderNo: order.autoIncrementField,
      date: order.date,
    }));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// host:meeting admin
// member status 관리
// provisional_member->full_member, rejected_member
router.patch('/api/meetings/:no/members/:memberId', async (req, res) => {
  try {
    const { no, memberId } = req.params;
    const { status } = req.body;

    // meetingAutoId를 사용하여 데이터베이스에서 해당 모임의 정보를 찾습니다.
    const meeting = await Meeting.findOne({
      autoIncrementField: no,
    });
    const member = meeting.members.find((m) => m.user.toString() === memberId);
    // console.log(member);

    // status 값을 업데이트합니다.
    member.status = status;

    // 데이터베이스에 변경 사항을 저장합니다.
    await meeting.save();

    res.status(200).send({ message: '멤버 상태가 변경되었습니다.' });
  } catch (error) {
    res.status(500).send({ message: '오류가 발생했습니다.' });
  }
});

// 'title', 'hashtags','introduce' 검색
router.get('/api/meeting-search', async (req, res) => {
  try {
    const { keyword } = req.query;

    // const { keyword } = req.params;

    const meetings = await Meeting.find({
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { hashtags: keyword },
        { introduce: { $regex: keyword, $options: 'i' } },
      ],
    });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
