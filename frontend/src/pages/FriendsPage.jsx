import { useState, useEffect } from "react";
import friendService from "../services/friendService";
import { Trash2, UserPlus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FriendsPage({ users }) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState(users);

  const removeFriend = async (friendId) => {
    if (window.confirm("Remove this friend?")) {
      try {
        await friendService.removeFriend(friendId);
        setFriends(friends.filter(f => f._id !== friendId));
      } catch (error) {
        alert("Failed to remove friend.");
      }
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} className="ghost-button" style={{ marginBottom: '1rem' }}><ArrowLeft /> Back</button>
      <h2>Friends</h2>
      <div className="user-list">
        {friends.map(friend => (
          <div key={friend._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--line)' }}>
            <span>{friend.name}</span>
            <button onClick={() => removeFriend(friend._id)} className="ghost-button"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
