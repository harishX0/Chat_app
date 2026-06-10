import { Check, CheckCheck, Reply, Trash2, Heart } from "lucide-react";
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

export default function MessageList({
  currentUserId,
  messages,
  loading,
  selectedUser,
  typingUser,
  onReply,
  onReact,
  onUnsend,
}) {
  const bottomRef = useRef(null);
  const lastTap = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const handleDoubleTap = (messageId) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      onReact(messageId, "❤️");
    }
    lastTap.current = now;
  };

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
          const repliedMessage = message.replyTo
            ? messages.find((m) => m._id === message.replyTo)
            : null;

          return (
            <div
              key={message._id}
              className={`message-row ${isOwnMessage ? "is-own" : ""} ${
                message.error ? "has-error" : ""
              } ${message.isDeleted ? "is-deleted" : ""}`}
              style={{ "--message-index": Math.min(index, 8) }}
              onClick={() => handleDoubleTap(message._id)}
            >
              <article className="message-bubble">
                {repliedMessage && !message.isDeleted && (
                  <div className="reply-context">
                    <p className="reply-user">Replying to {repliedMessage.senderId === currentUserId ? "yourself" : selectedUser.name}</p>
                    <p className="reply-text">{repliedMessage.message || "Image"}</p>
                  </div>
                )}
                
                {message.image && !message.isDeleted && (
                  <div className="message-image">
                    <img src={message.image} alt="Sent" />
                  </div>
                )}

                <p>{message.message}</p>
                
                {!message.isDeleted && (
                  <div className="message-actions">
                    <button onClick={() => onReply(message)} title="Reply"><Reply size={14} /></button>
                    {isOwnMessage && (
                      <button onClick={() => onUnsend(message._id)} title="Unsend"><Trash2 size={14} /></button>
                    )}
                  </div>
                )}

                <footer>
                  <time>{formatTime(message.timestamp || message.createdAt)}</time>
                  {isOwnMessage ? renderStatus(message.status) : null}
                </footer>

                {message.reactions && message.reactions.length > 0 && (
                  <div className="message-reactions">
                    {message.reactions.map((r, i) => (
                      <span key={i} className="reaction-badge">{r.emoji}</span>
                    ))}
                  </div>
                )}
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
