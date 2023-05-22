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

function App() {
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      message: "Hello, I am ChatGPT!",
      sender: "ChatGPT",
    },
  ]);

  async function handleSend(message) {
    const newMessage = {
      message: message, // this is the text we're getting from the sender
      sender: "user",
      direction: "outgoing", // when using this library this makes the message show on the right side of the chat window
    };

    const newMessages = [...messages, newMessage]; // create a new array with all the old messages, + the new message

    // update messages state
    setMessages(newMessages);
  }

  return (
    <div>
      <div style={{ position: "relative", height: "600px", width: "700px" }}>
        <MainContainer>
          <ChatContainer>
            <MessageList>
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
