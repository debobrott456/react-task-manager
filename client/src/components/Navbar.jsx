const NAV_ITEMS = [
  { label: 'All Tasks',    filter: 'all' },
  { label: 'Pending',      filter: 'pending' },
  { label: 'In Progress',  filter: 'in-progress' },
  { label: 'Completed',    filter: 'completed' },
  { label: 'About',        filter: 'about' },
];

function Navbar({ activeFilter, onFilterChange, counts }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">✅ TaskFlow</div>
      <ul className="navbar-links">
        {NAV_ITEMS.map(({ label, filter }) => (
          <li key={filter}>
            <button
              className={activeFilter === filter ? 'nav-btn active' : 'nav-btn'}
              onClick={() => onFilterChange(filter)}
            >
              {label}
              {counts[filter] !== undefined && (
                <span className="nav-badge">{counts[filter]}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;
