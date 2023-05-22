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
            <MessageInput />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}

export default App;
