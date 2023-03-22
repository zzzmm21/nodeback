const express = require('express');
const router = express.Router();
const { ReviewArticle } = require('../models/articleAndComment/ReviewArticle');
const { ReviewComment } = require('../models/articleAndComment/ReviewComment');
const bodyParser = require('body-parser');
const multer = require('multer');
const uploadmt = multer();

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

module.exports = router;
