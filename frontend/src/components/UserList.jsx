import { HeartPulse, LogOut, Menu, Search, X } from "lucide-react";

const sortUsers = (users, onlineUsers) =>
  [...users].sort((firstUser, secondUser) => {
    const firstOnline = onlineUsers.includes(firstUser._id);
    const secondOnline = onlineUsers.includes(secondUser._id);

    if (firstOnline === secondOnline) {
      return firstUser.name.localeCompare(secondUser.name);
    }

    return Number(secondOnline) - Number(firstOnline);
  });

export default function UserList({
  currentUser,
  users,
  activeChatId,
  onSelect,
  onLogout,
  onlineUsers,
  searchQuery,
  setSearchQuery,
  mobileOpen,
  setMobileOpen,
}) {
  const filteredUsers = sortUsers(users, onlineUsers).filter((chatUser) => {
    const searchValue = searchQuery.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    return (
      chatUser.name.toLowerCase().includes(searchValue) ||
      chatUser.email.toLowerCase().includes(searchValue)
    );
  });

  return (
    <>
      <button
        aria-label="Open chats"
        className="mobile-menu-button"
        onClick={() => setMobileOpen(true)}
        type="button"
      >
        <Menu size={18} />
        <span>Chats</span>
      </button>

      <aside className={`chat-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="sidebar-header">
          <div>
            <div className="brand-mark">
              <HeartPulse size={18} />
              <span>HeartLink Chat</span>
            </div>
            <p>
              <span>{currentUser?.name}</span>
              <span className="sidebar-presence">{onlineUsers.length} online</span>
            </p>
          </div>

          <button
            aria-label="Close chats"
            className="ghost-button sidebar-close"
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search people"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="user-list">
          {filteredUsers.length ? (
            filteredUsers.map((chatUser) => {
              const isActive = activeChatId === chatUser._id;
              const isOnline = onlineUsers.includes(chatUser._id);

              return (
                <button
                  key={chatUser._id}
                  className={`user-list-item ${isActive ? "is-active" : ""}`}
                  onClick={() => {
                    onSelect(chatUser._id);
                    setMobileOpen(false);
                  }}
                  type="button"
                >
                  <div className="avatar">{chatUser.name.charAt(0)}</div>
                  <div className="user-copy">
                    <div className="user-row">
                      <strong>{chatUser.name}</strong>
                      <span className={`presence-dot ${isOnline ? "online" : "offline"}`} />
                    </div>
                    <span>{isOnline ? "Online now" : chatUser.email}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="empty-mini">No matches yet.</div>
          )}
        </div>

        <button className="logout-button" onClick={onLogout} type="button">
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </aside>

      {mobileOpen ? <button className="sidebar-overlay" onClick={() => setMobileOpen(false)} type="button" /> : null}
    </>
  );
}
