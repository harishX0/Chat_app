import { ArrowLeft, UsersRound, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import MessageComposer from "../components/MessageComposer";
import MessageList from "../components/MessageList";
import UserList from "../components/UserList";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import messageService from "../services/messageService";
import userService from "../services/userService";

const upsertMessage = (messages, incomingMessage, tempId) => {
  if (tempId) {
    const existingTempIndex = messages.findIndex((message) => message._id === tempId);

    if (existingTempIndex !== -1) {
      const nextMessages = [...messages];
      nextMessages[existingTempIndex] = incomingMessage;
      return nextMessages;
    }
  }

  if (messages.some((message) => message._id === incomingMessage._id)) {
    return messages;
  }

  return [...messages, incomingMessage];
};

export default function ChatPage() {
  const { user, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [pageError, setPageError] = useState("");
  const [typingUser, setTypingUser] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const selectedUser = users.find((chatUser) => chatUser._id === activeChatId) || null;
  const isSelectedUserOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;

  useEffect(() => {
    let ignore = false;

    const fetchUsers = async () => {
      setLoadingUsers(true);
      setPageError("");

      try {
        const response = await userService.getUsers();

        if (ignore) {
          return;
        }

        setPageError("");
        setUsers(response.users);

        if (!activeChatId && response.users.length) {
          setActiveChatId(response.users[0]._id);
        }

        if (activeChatId && !response.users.some((chatUser) => chatUser._id === activeChatId)) {
          setActiveChatId(response.users[0]?._id || "");
        }
      } catch (requestError) {
        if (!ignore) {
          setPageError(requestError.response?.data?.message || "Unable to load your conversations.");
        }
      } finally {
        if (!ignore) {
          setLoadingUsers(false);
        }
      }
    };

    fetchUsers();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchConversation = async () => {
      if (!activeChatId) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);
      setTypingUser(false);

      try {
        const response = await messageService.getConversation(activeChatId);

        if (ignore) {
          return;
        }

        setPageError("");
        setMessages(response.messages);
        await messageService.markSeen(activeChatId);
        socket?.emit("messageSeen", { conversationUserId: activeChatId });
      } catch (requestError) {
        if (!ignore) {
          setPageError(requestError.response?.data?.message || "Unable to load message history.");
        }
      } finally {
        if (!ignore) {
          setLoadingMessages(false);
        }
      }
    };

    fetchConversation();

    return () => {
      ignore = true;
    };
  }, [activeChatId, socket]);

  useEffect(() => {
    if (!socket || !user) {
      return undefined;
    }

    const handleReceiveMessage = (incomingMessage) => {
      const relatedUserId =
        incomingMessage.senderId === user._id ? incomingMessage.receiverId : incomingMessage.senderId;

      if (relatedUserId === activeChatId) {
        setMessages((currentMessages) => upsertMessage(currentMessages, incomingMessage));

        if (incomingMessage.senderId === activeChatId) {
          socket.emit("messageSeen", { conversationUserId: activeChatId });
        }
      }
    };

    const handleMessageSent = ({ tempId, message }) => {
      if (message.senderId !== user._id || message.receiverId !== activeChatId) {
        return;
      }

      setMessages((currentMessages) => upsertMessage(currentMessages, message, tempId));
    };

    const handleMessageSeen = ({ seenBy, conversationUserId, messageIds = [] }) => {
      if (seenBy !== activeChatId && conversationUserId !== activeChatId) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) => {
          if (
            messageIds.includes(message._id) ||
            (message.senderId === user._id && message.receiverId === seenBy)
          ) {
            return { ...message, status: "seen" };
          }

          return message;
        })
      );
    };

    const handleTypingStart = ({ senderId }) => {
      if (senderId === activeChatId) {
        setTypingUser(true);
      }
    };

    const handleTypingStop = ({ senderId }) => {
      if (senderId === activeChatId) {
        setTypingUser(false);
      }
    };

    const handleMessageReaction = ({ messageId, reactions }) => {
      setMessages((currentMessages) =>
        currentMessages.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
      );
    };

    const handleMessageDeleted = ({ messageId, isDeleted }) => {
      setMessages((currentMessages) =>
        currentMessages.map((msg) =>
          msg._id === messageId
            ? { ...msg, isDeleted, message: "This message was unsent", image: null, reactions: [] }
            : msg
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageSent", handleMessageSent);
    socket.on("messageSeen", handleMessageSeen);
    socket.on("typingStart", handleTypingStart);
    socket.on("typingStop", handleTypingStop);
    socket.on("messageReaction", handleMessageReaction);
    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageSent", handleMessageSent);
      socket.off("messageSeen", handleMessageSeen);
      socket.off("typingStart", handleTypingStart);
      socket.off("typingStop", handleTypingStop);
      socket.off("messageReaction", handleMessageReaction);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [activeChatId, socket, user]);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (!socket || !isTypingRef.current || !activeChatId) {
        return;
      }

      socket.emit("typingStop", { receiverId: activeChatId });
      isTypingRef.current = false;
      clearTimeout(typingTimeoutRef.current);
    };
  }, [activeChatId, socket]);

  const updateTypingState = (value) => {
    setDraft(value);

    if (!socket || !activeChatId) {
      return;
    }

    if (value.trim()) {
      if (!isTypingRef.current) {
        socket.emit("typingStart", { receiverId: activeChatId });
        isTypingRef.current = true;
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typingStop", { receiverId: activeChatId });
        isTypingRef.current = false;
      }, 1200);
      return;
    }

    if (isTypingRef.current) {
      socket.emit("typingStop", { receiverId: activeChatId });
      isTypingRef.current = false;
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = draft.trim();

    if ((!trimmedMessage && !selectedImage) || !socket || !selectedUser || !user) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: user._id,
      receiverId: selectedUser._id,
      message: trimmedMessage,
      image: selectedImage,
      replyTo: replyingTo?._id || null,
      status: onlineUsers.includes(selectedUser._id) ? "delivered" : "sent",
      timestamp: new Date().toISOString(),
    };

    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);
    setDraft("");
    setSelectedImage(null);
    setReplyingTo(null);
    setTypingUser(false);

    if (isTypingRef.current) {
      socket.emit("typingStop", { receiverId: selectedUser._id });
      isTypingRef.current = false;
    }

    socket.emit(
      "sendMessage",
      {
        receiverId: selectedUser._id,
        message: trimmedMessage,
        image: selectedImage,
        replyTo: replyingTo?._id || null,
        tempId,
      },
      (response) => {
        if (!response?.error) {
          return;
        }

        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message._id === tempId ? { ...message, error: true, status: "sent" } : message
          )
        );
      }
    );
  };

  if (loadingUsers) {
    return <div className="screen-center">Loading conversations...</div>;
  }

  return (
    <div className="chat-shell">
      <UserList
        currentUser={user}
        users={users}
        activeChatId={activeChatId}
        onSelect={setActiveChatId}
        onLogout={logout}
        onlineUsers={onlineUsers}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <section className="chat-stage">
        {selectedUser ? (
          <>
            <header className="conversation-header">
              <div className="conversation-heading">
                <button
                  aria-label="Open chats"
                  className="ghost-button mobile-back"
                  onClick={() => setMobileOpen(true)}
                  type="button"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="avatar large">{selectedUser.name.charAt(0)}</div>

                <div>
                  <h2>{selectedUser.name}</h2>
                  <p>
                    {isSelectedUserOnline ? (
                      <>
                        <Wifi size={14} />
                        <span>Online now</span>
                      </>
                    ) : (
                      <>
                        <WifiOff size={14} />
                        <span>Offline</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="conversation-actions">
                <span className="connection-pill">
                  <UsersRound size={15} />
                  {onlineUsers.length} online
                </span>
              </div>
            </header>

            {pageError ? <div className="banner-error">{pageError}</div> : null}

            <MessageList
              currentUserId={user._id}
              messages={messages}
              loading={loadingMessages}
              selectedUser={selectedUser}
              typingUser={typingUser}
              onReply={setReplyingTo}
              onReact={async (messageId, emoji) => {
                try {
                  await messageService.reactToMessage(messageId, emoji);
                } catch (err) {
                  console.error("Failed to react", err);
                }
              }}
              onUnsend={async (messageId) => {
                try {
                  await messageService.unsendMessage(messageId);
                } catch (err) {
                  console.error("Failed to unsend", err);
                }
              }}
            />

            <MessageComposer
              value={draft}
              onChange={updateTypingState}
              onSend={handleSendMessage}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              onImageSelect={setSelectedImage}
              selectedImage={selectedImage}
            />
          </>
        ) : (
          <div className="conversation-placeholder">
            <h3>No teammates yet</h3>
            <p>Register a second account and the conversation list will light up here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
