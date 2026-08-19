import { HeartPulse, LogOut, Menu, Search, X, UserPlus, Check, Trash2, Clock, Newspaper, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import friendService from "../services/friendService";

const sortUsers = (users, onlineUsers) =>
  [...users].sort((firstUser, secondUser) => {
    const firstOnline = onlineUsers.includes(firstUser._id);
    const secondOnline = onlineUsers.includes(secondUser._id);

    if (firstOnline === secondOnline) {
      return (firstUser.name || "").localeCompare(secondUser.name || "");
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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResult, setSearchResult] = useState([]);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [friendRequests, setFriendRequests] = useState([]);

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const response = await friendService.getRequests();
      setFriendRequests(response.data.requests);
    } catch (error) {
      console.error("Failed to fetch requests", error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!localSearchQuery.trim()) return;
    try {
      const response = await friendService.searchUsers(localSearchQuery);
      setSearchResult(response.data.users);
    } catch (error) {
      console.error("Search failed", error);
    }
  };

  const sendRequest = async (id) => {
    try {
      await friendService.sendRequest(id);
      setSearchResult(searchResult.filter(u => u._id !== id));
      alert("Friend request sent!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send request");
    }
  };

  const acceptRequest = async (id) => {
    try {
      await friendService.acceptRequest(id);
      setFriendRequests(friendRequests.filter(r => r.user._id !== id));
      window.location.reload(); 
    } catch (error) {
      alert("Failed to accept request");
    }
  };

  const declineRequest = async (id) => {
    try {
      await friendService.declineRequest(id);
      setFriendRequests(friendRequests.filter(r => r.user._id !== id));
    } catch (error) {
      alert("Failed to decline request");
    }
  };

  const filteredUsers = sortUsers(users, onlineUsers).filter((chatUser) => {
    const searchValue = searchQuery.trim().toLowerCase();
    if (!searchValue) return true;
    return (
      chatUser.name.toLowerCase().includes(searchValue) ||
      (chatUser.username && chatUser.username.toLowerCase().includes(searchValue.replace('@', '')))
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
              <span>HeartLink</span>
            </div>
            <p>
              <strong style={{ display: 'block' }}>{currentUser?.name}</strong>
              <small style={{ opacity: 0.7 }}>@{currentUser?.username}</small>
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

        <div className="sidebar-actions" style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.5rem' }}>
        </div>

        {friendRequests.length > 0 && (
          <div className="friend-requests" style={{ padding: '0 1rem 1rem' }}>
            <small style={{ opacity: 0.6, display: 'block', marginBottom: '0.5rem' }}>Friend Requests</small>
            {friendRequests.map(req => (
              <div key={req.user._id} className="request-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem' }}>{req.user.name}</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button onClick={() => acceptRequest(req.user._id)} className="ghost-button" title="Accept"><Check size={16} color="green" /></button>
                  <button onClick={() => declineRequest(req.user._id)} className="ghost-button" title="Decline"><Trash2 size={16} color="red" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name or @"
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
                  <div className="avatar">{(chatUser.name || "U").charAt(0)}</div>
                  <div className="user-copy">
                    <div className="user-row">
                      <strong>{chatUser.name}</strong>
                      <span className={`presence-dot ${isOnline ? "online" : "offline"}`} />
                    </div>
                    <span>@{chatUser.username || "user"}</span>
                  </div>
                  <button 
                    className="ghost-button" 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`Remove ${chatUser.name} from friends?`)) {
                        try {
                          await friendService.removeFriend(chatUser._id);
                          window.location.reload();
                        } catch (error) {
                          alert("Failed to remove friend.");
                        }
                      }
                    }}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </button>
              );
            })
          ) : (
            <div className="empty-mini">No friends yet.</div>
          )}
        </div>

        <button className="logout-button" onClick={onLogout} type="button">
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </aside>

      {showSearchModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '400px', color: 'black', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <button onClick={() => setShowSearchModal(false)} className="ghost-button" style={{ padding: '0.5rem' }}><ArrowLeft size={20} /></button>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Find People</h2>
            </div>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Search by @username or name..." 
                value={localSearchQuery} 
                onChange={(e) => setLocalSearchQuery(e.target.value)} 
                style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '999px', border: '1px solid #ddd', outline: 'none' }}
              />
              <button type="submit" style={{ padding: '0.6rem 1.2rem', borderRadius: '999px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}>Search</button>
            </form>
            <div className="search-results" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {searchResult.map(u => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>{u.name.charAt(0)}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '500' }}>{u.name}</span>
                      <small style={{ opacity: 0.6 }}>@{u.username}</small>
                    </div>
                  </div>
                  <button onClick={() => sendRequest(u._id)} className="ghost-button" style={{ color: '#3b82f6' }} title="Add Friend"><UserPlus size={18} /></button>
                </div>
              ))}
              {searchResult.length === 0 && localSearchQuery && <p style={{ textAlign: 'center', opacity: 0.6, marginTop: '2rem' }}>No users found.</p>}
              {!localSearchQuery && <p style={{ textAlign: 'center', opacity: 0.6, marginTop: '2rem' }}>Type a name or @username to search</p>}
            </div>
          </div>
        </div>
      )}

      {mobileOpen ? <button className="sidebar-overlay" onClick={() => setMobileOpen(false)} type="button" /> : null}
    </>
  );
}
