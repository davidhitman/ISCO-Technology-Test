export default function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}) {
  return (
    <label className="label">
      <span className="label-text">{label}</span>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
