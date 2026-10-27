function SearchBar({
  value,
  onChange,
  placeholder = "Search internships...",
  label = "Search internships",
}) {
  return (
    <div className="search-bar">
      <label
        className="search-bar-label"
        htmlFor="internship-search"
      >
        {label}
      </label>

      <div className="search-bar-control">
        <span aria-hidden="true" className="search-bar-icon">
          ⌕
        </span>

        <input
          id="internship-search"
          type="search"
          className="search-bar-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />

        {value && (
          <button
            type="button"
            className="search-bar-clear"
            onClick={() => onChange("")}
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;