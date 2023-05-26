const textToSpeech = require("@google-cloud/text-to-speech");

require("dotenv").config();

const fs = require("fs");
const util = require("util");

const client = new textToSpeech.TextToSpeechClient();

async function convertTextToMp3(text) {
  // const text = "Hello world";
  const request = {
    input: { text: text },
    voice: {
      languageCode: "en-gb",
      name: "en-GB-Neural2-A",
      ssmlGender: "FEMALE",
    },
    audioConfig: { audioEncoding: "MP3" },
  };

  const [response] = await client.synthesizeSpeech(request);

  const writeFile = util.promisify(fs.writeFile);

  await writeFile("output.mp3", response.audioContent, "binary");

  // console.log("text to speech has completed");
  return response.audioContent;
}

// convertTextToMp3();

module.exports = convertTextToMp3;
