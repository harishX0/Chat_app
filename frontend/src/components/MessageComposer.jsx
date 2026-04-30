import { Send, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import EmojiPicker from "./EmojiPicker";

export default function MessageComposer({ value, onChange, onSend, disabled }) {
  const [showEmojis, setShowEmojis] = useState(false);
  const textareaRef = useRef(null);

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

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer-inner">
        <div className="composer-tools">
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

        <button aria-label="Send message" className="send-button" disabled={disabled || !value.trim()} type="submit">
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
