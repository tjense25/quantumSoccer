var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/login', function(req, res, next) {
  res.sendFile('login.html', {root: "public"});
});

module.exports = router;
