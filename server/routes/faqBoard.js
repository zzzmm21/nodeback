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
    // console.log('요청이 수신되었습니다.'); // 요청 수신 로그 출력
    // console.log(req.body);
    const { title, content, creator } = req.body;
    const meetingNo = req.params.no;

    Meeting.findOne({ autoIncrementField: meetingNo }, (err, meeting) => {
      if (err) {
        return res.status(500).json({ success: false, err });
      }

      const newFAQArticle = new FAQArticle({
        title,
        content,
        creator,
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

module.exports = router;
