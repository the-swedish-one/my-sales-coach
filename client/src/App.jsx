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
// import { useSpeechSynthesis } from "react-speech-kit";
import Home from "./pages/Home";
import About from "./pages/About";
// import { convertTestToMp3 } from "my-sales-coach/routes/index.js";

// import the api key here
const chatGptAPI = import.meta.env.VITE_CHAT_GPT_API_KEY;
const googleAPI = import.meta.env.VITE_GOOGLE_API_KEY;

function App() {
  const [typing, setTyping] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { message: "Hi there!", sender: "ChatGPT" },
  ]); // initial message in the chat window
  const [systemMessageContent, setSystemMessageContent] = useState(""); // system message varibale for chatGPT priming

  // import the react speach recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // declaring a varible and assigning the value of the react useSpeechSynthesis hook
  // const { speak } = useSpeechSynthesis();

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  // Managing the input field taking both text and voice-to-text with this useEffect and handleinputchange
  useEffect(() => {
    handleInputChange();
  }, [transcript]);

  function handleInputChange(event) {
    // console.log(transcript);
    if (!transcript === "" && event) {
      setMessage(event.target.value);
    } else if (!transcript === "") {
      setMessage(transcript);
    } else {
      setMessage(event?.target.value);
    }
  }

  async function handleSend() {
    // console.log(import.meta.env.VITE_CHAT_GPT_API_KEY);

    const newMessage = {
      message: message || transcript, // this is the text we're getting from the sender
      sender: "user",
      direction: "outgoing", // when using this library this makes the message show on the right side of the chat window
    };

    const newMessages = [...messages, newMessage]; // create a new array with all the old messages, + the new message

    // update messages state
    setMessages(newMessages);

    // set a typing indicator (e.g. ChatGPT is typing)
    setTyping(true);

    // clear textarea
    resetTranscript();
    setMessage("");

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
        Authorization: "Bearer " + chatGptAPI,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody), // varibale created above this function
    });

    const data = await response.json();

    // console.log(data);
    // console.log(data.choices[0].message.content); // This is chatGPT's message back!

    const audioResponse = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: data.choices[0].message.content }),
    });

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
        {/* <button onClick={SpeechRecognition.startListening}>Record</button> */}
        {/* <button onClick={SpeechRecognition.stopListening}>
          Stop recording
        </button> */}
        {/* <button onClick={resetTranscript}>Reset recording</button> */}

        {/* <p>{transcript}</p> */}
      </div>

      <div>
        <MessageList
          style={{ height: "200px", width: "500px" }}
          scrollBehavior="smooth"
          typingIndicator={
            typing ? <TypingIndicator content="ChatGPT is typing" /> : null
          }
        >
          {messages.map((message, i) => {
            // give each message in the array a message componenet
            return <Message key={i} model={message} />; // returns imported component Message, model (the message it's looking for) is our current message
          })}
        </MessageList>
      </div>

      {/* button speaking text using the react useSpeechSynthesis hook */}
      {/* <button onClick={() => speak({ text: "Hello" })}>Play Message</button> */}

      <textarea
        style={{ height: "100px", width: "500px" }}
        placeholder="Type your message here or use the buttons to record your voice!"
        onChange={handleInputChange}
        value={message || transcript}
      />
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 384 512"
          style={{ height: "50px" }}
          onClick={SpeechRecognition.startListening}
        >
          <path d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z" />
        </svg>
        <p>Microphone: {listening ? "on" : "off"}</p>
        <button onClick={handleSend}>Send!</button>
      </div>

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

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}

export default App;
