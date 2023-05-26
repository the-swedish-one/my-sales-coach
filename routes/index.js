var express = require("express");
var router = express.Router();
const convertTextToMp3 = require("./texttospeech");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send({ title: "Express" });
});

// API call to the google cloud api for text to speech via the function saved in texttospeech.js
router.post("/", async function (req, res, next) {
  const { text } = req.body;
  const body = await convertTextToMp3(text);
  res.send({ message: "mp3 created", body });
});

module.exports = router;
