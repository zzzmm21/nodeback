const express = require('express');
const router = express.Router();
const { FAQArticle } = require('../models/articleAndComment/FAQArticle');
const { Meeting } = require('../models/Meeting');
const multer = require('multer');
const noFileUpload = multer();

// 글 작성
router.post(
  '/api/meeting/:no/faqArticle/create',
  noFileUpload.none(),
  (req, res) => {
    const { title, content, creator, hashtags } = req.body;
    const meetingNo = req.params.no;

    Meeting.findOne({ autoIncrementField: meetingNo }, (err, meeting) => {
      if (err) {
        return res.status(500).json({ success: false, err });
      }

      const newFAQArticle = new FAQArticle({
        title,
        content,
        creator,
        hashtags,
        meeting: meeting._id,
      });

      newFAQArticle.save((err, doc) => {
        if (err) {
          return res.status(500).json({ success: false, err });
        }
        return res.status(200).json({ success: true, doc });
      });
    });
  }
);

// 전체 게시글 조회(리스트)
router.get('/api/meeting/:no/faqArticle', async (req, res) => {
  try {
    const meetingNo = req.params.no;
    const meeting = await Meeting.findOne({
      autoIncrementField: meetingNo,
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const faqArticles = await FAQArticle.find({ meeting: meeting._id })
      .sort({ createdAt: -1 })
      .populate('creator', 'name');
    res.status(200).json(faqArticles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 특정 게시글 조회
router.get('/api/meeting/:no/faqArticle/:id', async (req, res) => {
  // console.log('요청이 수신되었습니다.'); // 요청 수신 로그 출력
  // console.log(req.body);
  try {
    const articleId = req.params.id;

    const faqArticle = await FAQArticle.findById(articleId).populate(
      'creator',
      'name'
    );

    if (!faqArticle) {
      return res.status(404).json({ message: 'FAQ article not found' });
    }

    // 조회수 증가
    await FAQArticle.updateOne({ _id: articleId }, { $inc: { hitCount: 1 } });

    res.status(200).json(faqArticle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 특정 게시글 삭제
router.delete('/api/meeting/:no/faqArticle/:id', async (req, res) => {
  try {
    const articleId = req.params.id;
    const faqArticle = await FAQArticle.findById(articleId);

    if (!faqArticle) {
      return res.status(404).json({ message: 'FAQ article not found' });
    }

    await FAQArticle.findByIdAndDelete(articleId);
    res.status(200).json({ message: 'FAQ article deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 특정 게시글 수정
router.patch('/api/meeting/:no/faqArticle/:id', async (req, res) => {
  try {
    const { title, content, hashtags } = req.body;
    const articleId = req.params.id;

    const faqArticle = await FAQArticle.findByIdAndUpdate(
      articleId,
      { title, content, hashtags },
      { new: true }
    );

    if (!faqArticle) {
      return res.status(404).json({ message: 'FAQ article not found' });
    }

    res.status(200).json({ message: 'FAQ article updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
