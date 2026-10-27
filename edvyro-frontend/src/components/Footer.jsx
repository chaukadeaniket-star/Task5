import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            EdVyro
          </Link>

          <p>
            Helping students discover opportunities and build practical
            career skills.
          </p>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/internships">Internships</Link>
          <Link to="/apply">Apply</Link>
        </nav>
      </div>

      <div className="container footer-bottom">
        <p>
          © {currentYear} EdVyro. All rights reserved.
        </p>

        <p>Learn. Build. Grow.</p>
      </div>
    </footer>
  );
}

export default Footer;