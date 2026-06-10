import { Send, Smile, Image as ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import EmojiPicker from "./EmojiPicker";

export default function MessageComposer({ 
  value, 
  onChange, 
  onSend, 
  disabled,
  replyingTo,
  onCancelReply,
  onImageSelect,
  selectedImage
}) {
  const [showEmojis, setShowEmojis] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [value]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSend();
    setShowEmojis(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      {replyingTo && (
        <div className="reply-preview">
          <div className="reply-preview-info">
            <span className="reply-label">Replying to {replyingTo.message ? "message" : "image"}</span>
            <p className="reply-content">{replyingTo.message || "Image attachment"}</p>
          </div>
          <button onClick={onCancelReply} className="icon-button" type="button">
            <X size={16} />
          </button>
        </div>
      )}

      {selectedImage && (
        <div className="image-preview-container">
          <img src={selectedImage} alt="Selected" className="image-preview" />
          <button onClick={() => onImageSelect(null)} className="remove-image-btn" type="button">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="composer-inner">
        <div className="composer-tools">
          <button
            aria-label="Add image"
            className="icon-button"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <ImageIcon size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            accept="image/*" 
            onChange={handleFileChange} 
          />

          <button
            aria-label="Toggle emoji picker"
            className="icon-button"
            onClick={() => setShowEmojis((open) => !open)}
            type="button"
          >
            <Smile size={18} />
          </button>

          {showEmojis ? <EmojiPicker onSelect={(emoji) => onChange(`${value}${emoji}`)} /> : null}
        </div>

        <textarea
          ref={textareaRef}
          className="composer-input"
          placeholder="Write a message"
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
              setShowEmojis(false);
            }
          }}
          disabled={disabled}
        />

        <button aria-label="Send message" className="send-button" disabled={disabled || (!value.trim() && !selectedImage)} type="submit">
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
