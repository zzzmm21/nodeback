
const express = require('express');
const router = express.Router();
const { BComment } = require('../models/BComment');

router.post('/api/Bcomments', (req, res) => {
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

  module.exports = router;
