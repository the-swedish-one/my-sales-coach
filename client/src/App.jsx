import { useState, useEffect } from "react";
import "./App.css";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import { Routes, Route, Link } from "react-router-dom";
import "regenerator-runtime";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { ThreeDots } from "./assets/three-dots";
import { SpinningCircles } from "./assets/spinning-circles";
import { MicRed } from "./assets/mic-red";
import { MicBlack } from "./assets/mic-black";
import { TitleImage } from "./assets/title-img";
// import Home from "./pages/Home";
// import About from "./pages/About";

// import the api key here
const chatGptAPI = import.meta.env.VITE_CHAT_GPT_API_KEY;

function App() {
  const [selectButton, setSelectButton] = useState("");
  const [typing, setTyping] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { message: "Hi there!", sender: "ChatGPT" },
  ]); // initial message in the chat window
  const [systemMessageContent, setSystemMessageContent] = useState(""); // system message variable for chatGPT priming

  // import the react speach recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // if the browser doesn't support speech recognition then display this on the page
  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  // Managing the input field taking both text and voice-to-text with this useEffect and handleinputchange
  useEffect(() => {
    handleInputChange();
  }, [transcript]);

  function handleInputChange(event) {
    // console.log(transcript);
    if (transcript !== "" && event) {
      setMessage(event.target.value);
    } else if (transcript !== "") {
      console.log("here");
      setMessage(transcript);
    } else {
      setMessage(event?.target.value);
    }
  }

  async function handleSend() {
    const newMessage = {
      message: message || transcript, // this is the text we're getting from the sender
      sender: "user",
      direction: "outgoing", // when using this library this makes the message show on the right side of the chat window
    };

    const newMessages = [...messages, newMessage]; // create a new array with all the old messages, + the new message
    // console.log(newMessages);

    // update messages state
    setMessages(newMessages);

    // set a typing indicator (e.g. "ChatGPT is typing")
    setTyping(true);

    // clear textarea
    resetTranscript();
    setMessage("");

    await processMessageToChatGPT(newMessages);
  }

  // function to turn the audio response (buffer) into a base64 (so it can be used for an audio file)
  function arrayBufferToBase64(buffer) {
    var binary = "";
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const result = window.btoa(binary);
    // console.log(result);
    return result;
  }

  // large function to process messages to and from chatGPT (with an api call to google texttospeech)
  async function processMessageToChatGPT(newMessages) {
    // Our chat messages object needs to be translated into the format that the chatGPT api will understand:
    // chatMessages looks like this { sender: "user" or "ChatGPT", message: "The message content here"}
    // but apiMessages needs to look like this { role: "user" or "assistant", content: "The message content here"}
    // console.log(messages);

    // filter out any previous audio messages because this makes chatgpt's reply not work after the first one
    const newMessagesFiltered = newMessages.filter(
      (message) => message.message
    );
    // console.log(newMessagesFiltered);

    let apiMessages = newMessagesFiltered.map((messageObject) => {
      // mapping through each chatMessage object and creating a new object to match the object the api is expecting
      let role = "";
      if (messageObject.sender === "ChatGPT") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message };
    });

    // There are 3 types of roles possible:
    // "user" -> a message from the user
    // "assistant" -> a response from chatGPT
    // "system" -> generally one initial message defining HOW we want chatGPT to talk

    // So we can set the system message in order to prime chatGPT with a scenario or persona. Will make this a varibale so we can pass in different scenarios for the user!
    const systemMessage = {
      role: "system",
      content: systemMessageContent, // examples: Explain all concepts like I am 10 years old // Speak like a pirate // Explain to me like I am a software engineer with 10 years experience
    };

    const apiRequestBody = {
      model: "gpt-3.5-turbo",
      messages: [
        systemMessage, // this has to be here in order to prime chatGPT with the system message that we defined above before any other messages are sent over. This makes it respond to you according to that system message.
        ...apiMessages, // these are the chat messages formatted for api [message1,message2,message3,etc]
      ],
    };

    // send the message to chat gpt and get a response back
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + chatGptAPI,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody), // variable created above this function
    });
    const data = await response.json();
    // console.log(data);
    console.log(data.choices[0].message.content); // <<<  This is chatGPT's message back!

    // send chatgpt's text response to the googlecloud text-to-voice api via the backend call to googlecloud
    const audioResponse = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: data.choices[0].message.content }),
    });

    console.log(audioResponse);

    const audio = new Audio();
    const data2 = await audioResponse.json();
    audio.src = "data:audio/mp3;base64," + arrayBufferToBase64(data2.body.data);

    // set the messages with our previous messages plus chatGPT's reply
    setMessages([
      ...newMessages,
      {
        message: data.choices[0].message.content,
        sender: "ChatGPT",
      },
      { audioURL: audio.src, sender: "ChatGPT" },
    ]);
    setTyping(false); // make the typing dots go away now that chatGPT has responded
    audio.play(); // make the audio autoplay on reply
  }

  // buttons for scenarios:
  function sellAPen() {
    setSystemMessageContent(
      "You want to buy a pen from me but you will only agree to buy the pen once I've identified your needs for a pen and matched your needs to the benefits of one of the pens that I sell. Don't prompt me with your needs or tell me which pen you would like to buy."
    );
    setSelectButton("sellAPen");
    // console.log(systemMessageContent);
  }

  function prospectToTheCEO() {
    setSystemMessageContent(
      "Respond to me like you are the CEO of a major tech company and I am reaching out to you without any previous communication."
    );
    setSelectButton("prospectToTheCEO");
  }

  function newChat() {
    setMessages([{ message: "Hi there!", sender: "ChatGPT" }]);
    setSelectButton("");
  }

  return (
    <div className="flex flex-col container">
      {/* Page links */}
      <div>
        {/* <Link to="/">Home</Link>
        <Link to="/about">About</Link> */}
      </div>

      {/* Heading and scenario buttons */}
      <div className="mt-10 block text-center">
        <h1 className="mb-5 text-6xl text-dark-grey">My Sales Coach</h1>
        {/* <div>
          <TitleImage />
        </div> */}
        <h3 className="mb-3 text-2xl text-dark-grey">
          Pick a scenario you want to practice
        </h3>
        <div>
          <button
            className={
              selectButton === "sellAPen"
                ? "mr-2 bg-teal text-white border-ivory"
                : "mr-2 text-dark-grey border-dark-grey"
            }
            onClick={sellAPen}
          >
            Sell a pen
          </button>
          <button
            onClick={prospectToTheCEO}
            className={
              selectButton === "prospectToTheCEO"
                ? "bg-teal text-white border-ivory"
                : "text-dark-grey border-dark-grey"
            }
          >
            Prospect to the CEO
          </button>
        </div>
      </div>
      {/* 
      <div>{transcript}</div> */}

      <div className="mx-auto ">
        {/* Display list of messages */}
        <div className="mt-5 px-5 py-2 h-96 w-96 border rounded border-slate-300	overflow-y-auto overscroll-contain scroll-smooth">
          {messages.map((message, i) => {
            return (
              <div key={i}>
                {/* Messages */}
                <p
                  className={
                    message.sender === "user"
                      ? "text-right text-dark-grey my-2"
                      : "text-left text-dark-grey my-2"
                  }
                >
                  {message.message}
                </p>
                {message.audioURL && (
                  <audio src={message.audioURL} controls className="mb-4" />
                )}
              </div>
            );
          })}
          <div className="px-3 mt-2 text-xs text-dark-grey">
            {typing && <ThreeDots />}
          </div>
        </div>

        <div className="flex items-end">
          <textarea
            className="mt-5 p-2 text-dark-grey font-sans h-28 w-72 border rounded border-slate-300"
            placeholder="Type your message here or record your voice!"
            onChange={handleInputChange}
            value={message || transcript}
          />
          <div className="flex flex-col h-28 justify-between">
            {/* Microphone icon for starting and stopping the recording */}
            <div className="flex justify-center mt-1">
              {listening ? (
                <div onClick={SpeechRecognition.stopListening}>
                  <MicRed />
                </div>
              ) : (
                <div onClick={SpeechRecognition.startListening}>
                  <MicBlack />
                </div>
              )}
            </div>

            {listening && (
              <p className="text-xs text-dark-grey animate-pulse flex justify-center">
                Recording
              </p>
            )}
            <button
              onClick={handleSend}
              id="sendButton"
              className={
                typing
                  ? "text-center mx-2 h-11 text-white bg-teal"
                  : "text-center mx-2 h-11 text-white bg-teal border-transparent hover:border-grey"
              }
            >
              {typing ? <SpinningCircles /> : "Send!"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-2">
        {/* Button to clear the message history so you can start a new chat */}
        <button
          onClick={newChat}
          className="mb-10 h-11 text-slate-500 border-slate-300"
        >
          New chat
        </button>
      </div>

      {/* div containing commented out code for chatgpt components */}
      <div>
        {/* <div style={{ position: "relative", height: "400px", width: "500px" }}>
        <MainContainer>
          <ChatContainer>
            <MessageList
              scrollBehavior="smooth"
              typingIndicator={
                typing ? <TypingIndicator content="ChatGPT is typing" /> : null
              }
            >
              {messages.map((message, i) => {
                // give each message in the array a message componenet
                return <Message key={i} model={message} />; // returns imported component message, model (the message it's looking for) is our current message
              })}
            </MessageList>
            <MessageInput
              placeholder="Type your message here"
              onSend={handleSend}
              value={transcript}
            />
          </ChatContainer>
        </MainContainer>
      </div> */}
      </div>

      {/* <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes> */}
    </div>
  );
}

export default App;
