import { useState } from "react";

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

// using the free api key here
const API_KEY = "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";

function App() {
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      message: "Hello, I am ChatGPT!",
      sender: "ChatGPT",
    },
  ]);
  const [systemMessageContent, setSystemMessageContent] = useState("");

  async function handleSend(message) {
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

  return (
    <div>
      <h1>My Sales Coach</h1>
      <h3>Pick a scenario you want to practice</h3>
      <button>Sell a pen</button>
      <div style={{ position: "relative", height: "600px", width: "700px" }}>
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
            />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}

export default App;
