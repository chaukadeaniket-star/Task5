import { Link, NavLink } from "react-router-dom";

const NAVIGATION_LINKS = [
  {
    label: "Home",
    path: "/",
    end: true,
  },
  {
    label: "Internships",
    path: "/internships",
    end: false,
  },
  {
    label: "Apply Now",
    path: "/apply",
    end: false,
  },
];

function Navbar() {
  return (
    <header className="site-header">
      <nav
        className="navbar container"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          className="navbar-brand"
          aria-label="EdVyro home"
        >
          <span className="navbar-brand-icon" aria-hidden="true">
            E
          </span>

          <span className="navbar-brand-text">
            EdVyro
            <span className="navbar-brand-subtitle">
              Career starts here
            </span>
          </span>
        </Link>

        <div className="navbar-links">
          {NAVIGATION_LINKS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `navbar-link${isActive ? " navbar-link-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <a className="navbar-link" href="/pages/login.html">
            Student login
          </a>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;