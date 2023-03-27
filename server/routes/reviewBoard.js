const express = require('express');
const router = express.Router();
const { ReviewArticle } = require('../models/articleAndComment/ReviewArticle');
const { ReviewComment } = require('../models/articleAndComment/ReviewComment');
const { Meeting } = require('../models/Meeting');
const multer = require('multer');
const noFileUpload = multer();

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

// 글 작성
router.post(
  '/api/meeting/:no/reviewArticle/create',
  noFileUpload.none(),
  (req, res) => {
    // console.log('요청이 수신되었습니다.');
    const { title, content, creator, hashtags } = req.body;
    const meetingNo = req.params.no;

    Meeting.findOne({ autoIncrementField: meetingNo }, (err, meeting) => {
      if (err) {
        return res.status(500).json({ success: false, err });
      }

      const newReviewArticle = new ReviewArticle({
        title,
        content,
        creator,
        hashtags,
        meeting: meeting._id,
      });

      newReviewArticle.save((err, doc) => {
        if (err) {
          return res.status(500).json({ success: false, err });
        }
        return res.status(200).json({ success: true, doc });
      });
    });
  }
);

// 모임별 전체 reviewArticle 조회(리스트)
router.get('/api/meeting/:no/reviewArticle', async (req, res) => {
  // console.log('요청이 수신되었습니다.');
  try {
    // 페이지네이션
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;

    const meetingNo = req.params.no;
    const meeting = await Meeting.findOne({
      autoIncrementField: meetingNo,
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const reviewArticles = await ReviewArticle.find({ meeting: meeting._id })
      .sort({ createdAt: -1 })
      .populate('creator', 'name')
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const totalArticles = await ReviewArticle.countDocuments({
      meeting: meeting._id,
    });
    const totalPages = Math.ceil(totalArticles / pageSize);

    res
      .status(200)
      .json({ reviewArticles, totalPages, totalArticles, pageSize });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 특정 reviewArticle 조회
router.get('/api/meeting/:no/reviewArticle/:id', async (req, res) => {
  // console.log('요청이 수신되었습니다.'); // 요청 수신 로그 출력
  // console.log(req.body);
  try {
    const articleId = req.params.id;

    const reviewArticle = await ReviewArticle.findById(articleId).populate(
      'creator',
      'name'
    );

    if (!reviewArticle) {
      return res.status(404).json({ message: 'reviewArticle not found' });
    }

    // 조회수 증가
    await ReviewArticle.updateOne(
      { _id: articleId },
      { $inc: { hitCount: 1 } }
    );

    res.status(200).json(reviewArticle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 특정 reviewArticle 삭제
router.delete('/api/meeting/:no/reviewArticle/:id', async (req, res) => {
  console.log('요청이 수신되었습니다.');
  try {
    const articleId = req.params.id;
    const reviewArticle = await ReviewArticle.findById(articleId);

    if (!reviewArticle) {
      return res.status(404).json({ message: 'reviewArticle not found' });
    }

    await ReviewArticle.findByIdAndDelete(articleId);
    res.status(200).json({ message: 'reviewArticle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 특정 reviewArticle 수정
router.patch(
  '/api/meeting/:no/reviewArticle/:id',
  noFileUpload.none(),
  async (req, res) => {
    console.log('요청이 수신되었습니다.');
    s;
    console.log(req.body);
    try {
      const { title, content, hashtags } = req.body;
      const articleId = req.params.id;

      const reviewArticle = await ReviewArticle.findByIdAndUpdate(
        articleId,
        { title, content, hashtags },
        { new: true }
      );

      if (!reviewArticle) {
        return res.status(404).json({ message: 'reviewArticle not found' });
      }

      res.status(200).json({ message: 'reviewArticle updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
