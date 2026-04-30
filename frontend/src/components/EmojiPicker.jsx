const EMOJIS = [
  "\u{1F600}",
  "\u{1F602}",
  "\u{1F60D}",
  "\u{1F525}",
  "\u{1F44D}",
  "\u{1F64C}",
  "\u{1F389}",
  "\u{1F91D}",
  "\u{1F4AC}",
  "\u{2764}\u{FE0F}",
  "\u{1F60E}",
  "\u{1F914}",
];

export default function EmojiPicker({ onSelect }) {
  return (
    <div className="emoji-picker">
      {EMOJIS.map((emoji) => (
        <button key={emoji} className="emoji-button" onClick={() => onSelect(emoji)} type="button">
          {emoji}
        </button>
      ))}
    </div>
  );
}
