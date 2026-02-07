/**
 * search bar idk xd
 * 
 * TODO: add keyboard shortcut to focus search maybe
 * TODO: add clear (×) button when input is not empty maybe
 * TODO: highlight matching text in page titles (maybe this prob really hard)
 * TODO: show "no results" state when filter matches nothing
 * TODO: add accessibility labels (aria-label, role="search")
 */
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
export function SearchBar({ value, onChange, placeholder = "Search pages..." }: SearchBarProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ marginBottom: "8px", width: "80%"}}
    />
  );
}