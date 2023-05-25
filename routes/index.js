var express = require("express");
var router = express.Router();

const textToSpeech = require("@google-cloud/text-to-speech");

require("dotenv").config();

const fs = require("fs");
const util = require("util");

const client = new textToSpeech.TextToSpeechClient();

async function convertTestToMp3() {
  const text = "Hello world! I'm converting text to speech";

  const request = {
    input: { text: text },
    voice: {
      languageCode: "en-gb",
      name: "en-GB-Wavenet-A",
      ssmlGender: "FEMALE",
    },
    audioConfig: { audioEncoding: "MP3" },
  };

  const [response] = await client.synthesizeSpeech(request);

  const writeFile = util.promisify(fs.writeFile);

  await writeFile("output.mp3", response.audioContent, "binary");

  console.log("text to speech has completed");
}

convertTestToMp3();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send({ title: "Express" });
});

module.exports = router;
