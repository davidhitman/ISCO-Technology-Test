export default function Button({
  children,
  onClick,
  type = "button",
  disabled,
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="btn">
      {children}
    </button>
  );
}
