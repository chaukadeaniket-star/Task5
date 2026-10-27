import { Link } from "react-router-dom";

function InternshipCard({ internship }) {
  if (!internship || typeof internship !== "object") {
    return null;
  }

  const {
    _id,
    id,
    title,
    company,
    location,
    type,
    description,
    skills,
  } = internship;

  const internshipId = _id ?? id;

  return (
    <article className="internship-card">
      <div className="internship-card-header">
        <div>
          <p className="internship-company">
            {company || "Company not specified"}
          </p>

          <h2 className="internship-title">
            {title || "Untitled internship"}
          </h2>
        </div>

        {type && (
          <span className="internship-badge">
            {type}
          </span>
        )}
      </div>

      {location && (
        <p className="internship-location">
          <span aria-hidden="true">📍</span>{" "}
          {location}
        </p>
      )}

      {description && (
        <p className="internship-description">
          {description}
        </p>
      )}

      {Array.isArray(skills) && skills.length > 0 && (
        <ul className="internship-skills" aria-label="Required skills">
          {skills.slice(0, 8).map((skill, index) => (
            <li key={`${skill}-${index}`}>
              {skill}
            </li>
          ))}
        </ul>
      )}

      {internshipId != null && (
        <Link
          className="button button-primary internship-apply-button"
          to={`/apply?internshipId=${encodeURIComponent(String(internshipId))}`}
        >
          Apply for internship
        </Link>
      )}
    </article>
  );
}

export default InternshipCard;