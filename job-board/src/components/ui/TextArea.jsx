export default function TextArea({
  label,
  value,
  onChange,
  placeholder,
  required,
}) {
  return (
    <label className="label">
      <span className="label-text">{label}</span>
      <textarea
        className="textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
