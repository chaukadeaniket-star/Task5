import { Link } from "react-router-dom";

const FEATURES = [
  {
    number: "01",
    title: "Explore Opportunities",
    description:
      "Discover internship opportunities designed to help you develop practical skills and gain industry experience.",
    icon: "◎",
  },
  {
    number: "02",
    title: "Build Your Skills",
    description:
      "Find opportunities that align with your interests, career goals, and professional development.",
    icon: "↗",
  },
  {
    number: "03",
    title: "Apply with Confidence",
    description:
      "Submit your application through a streamlined form with clear validation and submission feedback.",
    icon: "✓",
  },
];

function Home() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="eyebrow">
              YOUR CAREER JOURNEY STARTS HERE
            </span>

            <h1 className="hero-title">
              Turn your potential into{" "}
              <span className="text-accent">
                real opportunities.
              </span>
            </h1>

            <p className="hero-description">
              Explore internship opportunities, discover your strengths,
              and take the next step toward building your professional
              future with EdVyro.
            </p>

            <div className="hero-actions">
              <Link
                to="/internships"
                className="button button-primary"
              >
                Explore internships
                <span aria-hidden="true"> →</span>
              </Link>

              <Link
                to="/apply"
                className="button button-secondary"
              >
                Apply now
              </Link>
            </div>

            <div className="hero-trust">
              <span className="trust-indicator" aria-hidden="true">
                ✓
              </span>

              <p>
                A simple way to discover your next opportunity.
              </p>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-decoration hero-decoration-one" />
            <div className="hero-decoration hero-decoration-two" />

            <div className="opportunity-card">
              <div className="opportunity-card-header">
                <div className="opportunity-icon" aria-hidden="true">
                  E
                </div>

                <span className="opportunity-status">
                  Your next step
                </span>
              </div>

              <p className="opportunity-overline">
                CAREER DEVELOPMENT
              </p>

              <h2>Make your next opportunity count.</h2>

              <p className="opportunity-description">
                Find internships that help turn your knowledge into
                practical experience.
              </p>

              <div className="opportunity-divider" />

              <div className="opportunity-footer">
                <span>Explore. Learn. Grow.</span>

                <span aria-hidden="true">↗</span>
              </div>
            </div>

            <div className="floating-badge floating-badge-top">
              <span aria-hidden="true">✦</span>
              Career growth
            </div>

            <div className="floating-badge floating-badge-bottom">
              <span aria-hidden="true">✓</span>
              Start exploring
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">
              HOW EDVYRO HELPS
            </span>

            <h2>
              Take the next step in your career.
            </h2>

            <p>
              From discovering opportunities to submitting an application,
              focus on building a stronger professional future.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((feature) => (
              <article
                className="feature-card"
                key={feature.number}
              >
                <div className="feature-card-top">
                  <span
                    className="feature-icon"
                    aria-hidden="true"
                  >
                    {feature.icon}
                  </span>

                  <span className="feature-number">
                    {feature.number}
                  </span>
                </div>

                <h3>{feature.title}</h3>

                <p>{feature.description}</p>

                <Link
                  to={
                    feature.number === "03"
                      ? "/apply"
                      : "/internships"
                  }
                  className="feature-link"
                >
                  Learn more
                  <span aria-hidden="true"> →</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta-section">
        <div className="container">
          <div className="home-cta">
            <div>
              <span className="eyebrow">
                READY FOR YOUR NEXT STEP?
              </span>

              <h2>
                Your next opportunity could start today.
              </h2>

              <p>
                Explore available internships and find an opportunity
                that matches your goals.
              </p>
            </div>

            <Link
              to="/internships"
              className="button button-light"
            >
              Discover internships
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
