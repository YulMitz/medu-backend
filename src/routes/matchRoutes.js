// routes/matchRoutes.js
const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const auth = require('../middlewares/authenticationMiddleware');

router.post('/like', auth, matchController.likeUser);
router.post('/dislike', auth, matchController.dislikeUser);
router.get('/friendlist', auth, matchController.getFriendListByUserId);
router.get('/matchcard', auth, matchController.getMatchCardByUserId);

module.exports = router;