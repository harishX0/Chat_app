import { Check, CheckCheck } from "lucide-react";
import { useEffect, useRef } from "react";

const formatTime = (value) =>
  new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const renderStatus = (status) => {
  if (status === "seen") {
    return (
      <span className="message-status seen">
        <CheckCheck size={14} />
      </span>
    );
  }

  if (status === "delivered") {
    return (
      <span className="message-status delivered">
        <CheckCheck size={14} />
      </span>
    );
  }

  return (
    <span className="message-status sent">
      <Check size={14} />
    </span>
  );
};

export default function MessageList({ currentUserId, messages, loading, selectedUser, typingUser }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  if (!selectedUser) {
    return (
      <div className="conversation-placeholder">
        <h3>Select a conversation</h3>
        <p>Pick someone from the sidebar and start chatting in real time.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="conversation-placeholder">Loading messages...</div>;
  }

  return (
    <div className="message-list">
      {messages.length ? (
        messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;

          return (
            <div
              key={message._id}
              className={`message-row ${isOwnMessage ? "is-own" : ""} ${message.error ? "has-error" : ""}`}
              style={{ "--message-index": Math.min(index, 8) }}
            >
              <article className="message-bubble">
                <p>{message.message}</p>
                <footer>
                  <time>{formatTime(message.timestamp || message.createdAt)}</time>
                  {isOwnMessage ? renderStatus(message.status) : null}
                </footer>
              </article>
            </div>
          );
        })
      ) : (
        <div className="conversation-placeholder compact">
          <h3>No messages yet</h3>
          <p>Say hello to {selectedUser.name.split(" ")[0]}.</p>
        </div>
      )}

      {typingUser ? (
        <div className="message-row">
          <article className="message-bubble typing-bubble">
            <span />
            <span />
            <span />
          </article>
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
