import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!token || !user) {
      return undefined;
    }

    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
    });

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const handleUserOnline = (userId) => {
      setOnlineUsers((currentUsers) =>
        currentUsers.includes(userId) ? currentUsers : [...currentUsers, userId]
      );
    };

    const handleUserOffline = (userId) => {
      setOnlineUsers((currentUsers) => currentUsers.filter((onlineUserId) => onlineUserId !== userId));
    };

    socketInstance.on("onlineUsers", handleOnlineUsers);
    socketInstance.on("userOnline", handleUserOnline);
    socketInstance.on("userOffline", handleUserOffline);

    setSocket(socketInstance);

    return () => {
      socketInstance.off("onlineUsers", handleOnlineUsers);
      socketInstance.off("userOnline", handleUserOnline);
      socketInstance.off("userOffline", handleUserOffline);
      socketInstance.disconnect();
      setSocket(null);
      setOnlineUsers([]);
    };
  }, [token, user]);

  return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
