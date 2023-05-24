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
import Home from "./pages/Home";
import About from "./pages/About";

// using the free api key here
const API_KEY = "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";

function App() {
  const [typing, setTyping] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      message: "Hi there!",
      sender: "ChatGPT",
    },
  ]);
  const [systemMessageContent, setSystemMessageContent] = useState("");
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  function handleInputChange(event) {
    if (transcript) {
      setMessage(transcript);
    } else {
      setMessage(event.target.value);
    }
  }

  async function handleSend() {
    const newMessage = {
      message: message, // this is the text we're getting from the sender
      sender: "user",
      direction: "outgoing", // when using this library this makes the message show on the right side of the chat window
    };

    const newMessages = [...messages, newMessage]; // create a new array with all the old messages, + the new message

    // update messages state
    setMessages(newMessages);

    // set a typing indicator (e.g. ChatGPT is typing)
    setTyping(true);

    await processMessageToChatGPT(newMessages);
  }

  async function processMessageToChatGPT(chatMessages) {
    // Our chat messages object needs to be translated into the format that the chatGPT api will understand:
    // chatMessages looks like this { sender: "user" or "ChatGPT", message: "The message content here"}
    // but apiMessages needs to look like this { role: "user" or "assistant", content: "The message content here"}

    let apiMessages = chatMessages.map((messageObject) => {
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody), // varibale created above this function
    });

    const data = await response.json();

    // console.log(data);
    // console.log(data.choices[0].message.content); // This is chatGPT's message back!

    setMessages([
      ...chatMessages,
      {
        message: data.choices[0].message.content,
        sender: "ChatGPT",
      },
    ]);
    setTyping(false); // make the typing dots go away now that chatGPT has responded
  }

  // buttons for scenarios:

  function sellAPen() {
    setSystemMessageContent(
      "Respond to me like you want to buy a pen from me. Agree to the sale only once I've identified your needs for a pen and matched your needs to the benefits of one of the pens that I sell but don't prompt me with your needs or which pen you would like to."
    );
    // console.log(systemMessageContent);
  }

  function prospectToTheCEO() {
    setSystemMessageContent(
      "Respond to me like you are the CEO of a major tech company and I am reaching out to you without any previous communication."
    );
  }

  return (
    <div>
      <div>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </div>
      <h1>My Sales Coach</h1>
      <h3>Pick a scenario you want to practice</h3>
      <button onClick={sellAPen}>Sell a pen</button>
      <button onClick={prospectToTheCEO}>Prospect to the CEO</button>

      <div>
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
      </div>

      <textarea
        style={{ height: "50px", width: "300px" }}
        placeholder="Type your message here or use the buttons below to record your voice!"
        onChange={handleInputChange}
      />

      <div>
        <p>Microphone: {listening ? "on" : "off"}</p>
        <button onClick={SpeechRecognition.startListening}>
          Start recording
        </button>
        <button onClick={SpeechRecognition.stopListening}>
          Stop recording
        </button>
        <button onClick={resetTranscript}>Reset recording</button>
        <button onClick={handleSend}>Send!</button>
        <p>{transcript}</p>
      </div>

      {/* <div style={{ position: "relative", height: "600px", width: "700px" }}>
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

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}

export default App;
