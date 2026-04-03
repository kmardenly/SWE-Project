const express = require('express');
const { createPost } = require('../controllers/posts.controller');

const router = express.Router();

// POST /posts
router.post('/', createPost);

module.exports = router;