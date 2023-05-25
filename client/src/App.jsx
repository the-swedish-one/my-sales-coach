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

// import the api key here
const chatGptAPI = import.meta.env.VITE_CHAT_GPT_API_KEY;
const googleAPI = import.meta.env.VITE_GOOGLE_API_KEY;

function App() {
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

    // send the message to chat gpt and get a response back
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
    // console.log(data.choices[0].message.content); // <<<  This is chatGPT's message back!

    // send chatgpt's text response to the googlecloud text-to-voice api via the backend call to googlecloud
    const audioResponse = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: data.choices[0].message.content }),
    });

    // set the messages with our previous messages plus chatGPT's reply
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

      <textarea
        style={{ height: "100px", width: "500px" }}
        placeholder="Type your message here or use the buttons to record your voice!"
        onChange={handleInputChange}
        value={message || transcript}
      />

      {/* Microphone icon for starting and stopping the recording */}
      <div>
        {/* <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 384 512"
          style={{ height: "50px" }}
          onClick={SpeechRecognition.startListening}
        >
          <path d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z" />
        </svg> */}
        {listening ? (
          <svg
            onClick={SpeechRecognition.stopListening}
            style={{ height: "50px" }}
            xmlns="http://www.w3.org/2000/svg"
            // xmlns:xlink="http://www.w3.org/1999/xlink"
            width="1080"
            zoomAndPan="magnify"
            viewBox="0 0 810 809.999993"
            height="1080"
            preserveAspectRatio="xMidYMid meet"
            version="1.0"
          >
            <path
              fill="#e80303"
              d="M 404.859375 436.980469 C 438.515625 436.980469 465.890625 409.75 465.890625 376.089844 L 465.890625 249.5625 C 465.890625 215.90625 438.515625 188.535156 404.859375 188.535156 C 371.203125 188.535156 343.96875 215.90625 343.96875 249.5625 L 343.96875 376.089844 C 343.96875 409.609375 371.203125 436.980469 404.859375 436.980469 Z M 404.859375 436.980469 "
              // fill-opacity="1"
              // fill-rule="nonzero"
            />
            <path
              fill="#e80303"
              d="M 405 0 C 181.273438 0 0 181.273438 0 405 C 0 628.726562 181.273438 810 405 810 C 628.726562 810 810 628.726562 810 405 C 810 181.273438 628.726562 0 405 0 Z M 302.074219 249.5625 C 302.074219 192.722656 348.160156 146.636719 404.859375 146.636719 C 461.558594 146.636719 507.785156 192.863281 507.785156 249.5625 L 507.785156 376.089844 C 507.785156 432.792969 461.558594 478.878906 404.859375 478.878906 C 348.160156 478.878906 302.074219 432.792969 302.074219 376.089844 Z M 425.808594 530.132812 L 425.808594 621.464844 L 473.429688 621.464844 C 485.023438 621.464844 494.378906 630.824219 494.378906 642.414062 C 494.378906 654.003906 485.023438 663.363281 473.429688 663.363281 L 336.429688 663.363281 C 324.839844 663.363281 315.480469 654.003906 315.480469 642.414062 C 315.480469 630.824219 324.839844 621.464844 336.429688 621.464844 L 383.910156 621.464844 L 383.910156 530.132812 C 308.078125 519.796875 249.5625 454.855469 249.5625 376.089844 C 249.5625 364.5 258.921875 355.144531 270.511719 355.144531 C 282.101562 355.144531 291.460938 364.5 291.460938 376.089844 C 291.460938 438.796875 342.292969 489.769531 404.859375 489.769531 C 467.425781 489.769531 518.539062 438.796875 518.539062 376.089844 C 518.539062 364.5 527.894531 355.144531 539.488281 355.144531 C 551.078125 355.144531 560.4375 364.5 560.4375 376.089844 C 560.4375 454.71875 501.640625 519.796875 425.808594 530.132812 Z M 425.808594 530.132812 "
              // fill-opacity="1"
              // fill-rule="nonzero"
            />
          </svg>
        ) : (
          <svg
            onClick={SpeechRecognition.startListening}
            style={{ height: "50px" }}
            xmlns="http://www.w3.org/2000/svg"
            // xmlns:xlink="http://www.w3.org/1999/xlink"
            width="1080"
            zoomAndPan="magnify"
            viewBox="0 0 810 809.999993"
            height="1080"
            preserveAspectRatio="xMidYMid meet"
            version="1.0"
          >
            <path
              fill="#000000"
              d="M 404.859375 436.980469 C 438.515625 436.980469 465.890625 409.75 465.890625 376.089844 L 465.890625 249.5625 C 465.890625 215.90625 438.515625 188.535156 404.859375 188.535156 C 371.203125 188.535156 343.96875 215.90625 343.96875 249.5625 L 343.96875 376.089844 C 343.96875 409.609375 371.203125 436.980469 404.859375 436.980469 Z M 404.859375 436.980469 "
              // fill-opacity="1"
              // fill-rule="nonzero"
            />
            <path
              fill="#000000"
              d="M 405 0 C 181.273438 0 0 181.273438 0 405 C 0 628.726562 181.273438 810 405 810 C 628.726562 810 810 628.726562 810 405 C 810 181.273438 628.726562 0 405 0 Z M 302.074219 249.5625 C 302.074219 192.722656 348.160156 146.636719 404.859375 146.636719 C 461.558594 146.636719 507.785156 192.863281 507.785156 249.5625 L 507.785156 376.089844 C 507.785156 432.792969 461.558594 478.878906 404.859375 478.878906 C 348.160156 478.878906 302.074219 432.792969 302.074219 376.089844 Z M 425.808594 530.132812 L 425.808594 621.464844 L 473.429688 621.464844 C 485.023438 621.464844 494.378906 630.824219 494.378906 642.414062 C 494.378906 654.003906 485.023438 663.363281 473.429688 663.363281 L 336.429688 663.363281 C 324.839844 663.363281 315.480469 654.003906 315.480469 642.414062 C 315.480469 630.824219 324.839844 621.464844 336.429688 621.464844 L 383.910156 621.464844 L 383.910156 530.132812 C 308.078125 519.796875 249.5625 454.855469 249.5625 376.089844 C 249.5625 364.5 258.921875 355.144531 270.511719 355.144531 C 282.101562 355.144531 291.460938 364.5 291.460938 376.089844 C 291.460938 438.796875 342.292969 489.769531 404.859375 489.769531 C 467.425781 489.769531 518.539062 438.796875 518.539062 376.089844 C 518.539062 364.5 527.894531 355.144531 539.488281 355.144531 C 551.078125 355.144531 560.4375 364.5 560.4375 376.089844 C 560.4375 454.71875 501.640625 519.796875 425.808594 530.132812 Z M 425.808594 530.132812 "
              // fill-opacity="1"
              // fill-rule="nonzero"
            />
          </svg>
        )}
      </div>
      <p>Microphone: {listening ? "on" : "off"}</p>
      <button onClick={handleSend}>Send!</button>

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

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}

export default App;
