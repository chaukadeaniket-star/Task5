import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

import { submitApplication, getInternships } from "../services/api";
import { extractInternships } from "../utils/extractInternships";
import { validateApplication } from "../utils/validators";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  internshipId: "",
  skills: "",
  coverLetter: "",
};

function Apply() {
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    internshipId: searchParams.get("internshipId") || "",
  }));

  const [internships, setInternships] = useState([]);
  const [internshipsLoading, setInternshipsLoading] = useState(true);
  const [internshipsError, setInternshipsError] = useState("");
  const [internshipsRetryCount, setInternshipsRetryCount] = useState(0);

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadInternships() {
      try {
        setInternshipsLoading(true);
        setInternshipsError("");

        const response = await getInternships({}, {
          signal: controller.signal,
        });

        if (active) {
          setInternships(extractInternships(response));
        }
      } catch (error) {
        if (active && error?.code !== "REQUEST_CANCELLED") {
          setInternshipsError(
            error?.message || "Unable to load internships."
          );
        }
      } finally {
        if (active) {
          setInternshipsLoading(false);
        }
      }
    }

    loadInternships();

    return () => {
      active = false;
      controller.abort();
    };
  }, [internshipsRetryCount]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setSubmitError("");
    setSuccessMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!window.localStorage.getItem("internboard.sessionToken")) {
      const applicationRoute = `/current.html#/apply${
        form.internshipId
          ? `?internshipId=${encodeURIComponent(form.internshipId)}`
          : ""
      }`;
      window.location.href = `/pages/login.html?returnTo=${encodeURIComponent(applicationRoute)}`;
      return;
    }

    const validationErrors = validateApplication(form);

    setErrors(validationErrors);
    setSubmitError("");
    setSuccessMessage("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const selectedInternship = internships.find(
      (internship) =>
        String(internship._id ?? internship.id) === form.internshipId
    );

    if (!selectedInternship) {
      setErrors({
        internshipId: "Please select an available internship.",
      });

      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        internshipId: form.internshipId,
        skills: form.skills.trim(),
        coverLetter: form.coverLetter.trim(),
      };

      await submitApplication(payload);

      setSuccessMessage(
        "Your application was submitted successfully."
      );

      setForm(INITIAL_FORM);
      setErrors({});
    } catch (error) {
      if (error?.fields && Object.keys(error.fields).length > 0) {
        setErrors(error.fields);
      }
      setSubmitError(
        error?.message ||
          "We could not submit your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="apply-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">TAKE THE NEXT STEP</span>

          <h1>Apply for an internship</h1>

          <p>
            Tell us about yourself and the opportunity you're interested in.
          </p>
        </div>
      </section>

      <section className="apply-section container">
        <div className="apply-layout">
          <aside className="apply-sidebar">
            <h2>Your next chapter starts here.</h2>

            <p>
              Complete the application form accurately. We'll submit your
              details securely to the EdVyro application API.
            </p>

            <ul className="apply-benefits">
              <li>Provide accurate contact information.</li>
              <li>Choose an available internship.</li>
              <li>Highlight your skills and interests.</li>
              <li>Review your details before submitting.</li>
            </ul>

            <Link to="/internships" className="text-link">
              ← Browse internships
            </Link>
          </aside>

          <div className="apply-form-card">
            <div className="apply-form-heading">
              <span className="eyebrow">APPLICATION FORM</span>
              <h2>Applicant details</h2>
              <p>Fields marked with * are required.</p>
            </div>

            {internshipsLoading && (
              <Loading message="Loading available internships..." />
            )}

            {!internshipsLoading && internshipsError && (
              <ErrorMessage
                title="Internships unavailable"
                message={internshipsError}
                onRetry={() => setInternshipsRetryCount((count) => count + 1)}
              />
            )}

            {successMessage && (
              <div className="success-message" role="status">
                <strong>Application submitted</strong>
                <p>{successMessage}</p>
              </div>
            )}

            {submitError && (
              <ErrorMessage
                title="Submission failed"
                message={submitError}
              />
            )}

            {!internshipsLoading && !internshipsError && (
              <form
                className="application-form"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="form-field">
                  <label htmlFor="fullName">
                    Full name <span aria-hidden="true">*</span>
                  </label>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    value={form.fullName}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={
                      errors.fullName ? "fullName-error" : undefined
                    }
                    required
                  />

                  {errors.fullName && (
                    <p id="fullName-error" className="field-error">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="email">
                    Email address <span aria-hidden="true">*</span>
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={form.email}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? "email-error" : undefined
                    }
                    required
                  />

                  {errors.email && (
                    <p id="email-error" className="field-error">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="phone">
                    Phone number <span aria-hidden="true">*</span>
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={20}
                    value={form.phone}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={
                      errors.phone ? "phone-error" : undefined
                    }
                    required
                  />

                  {errors.phone && (
                    <p id="phone-error" className="field-error">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="internshipId">
                    Select internship <span aria-hidden="true">*</span>
                  </label>

                  <select
                    id="internshipId"
                    name="internshipId"
                    value={form.internshipId}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.internshipId)}
                    aria-describedby={
                      errors.internshipId
                        ? "internshipId-error"
                        : undefined
                    }
                    required
                  >
                    <option value="">Choose an internship</option>

                    {internships.map((internship) => {
                      const id = internship._id ?? internship.id;

                      if (id == null) {
                        return null;
                      }

                      return (
                        <option key={id} value={String(id)}>
                          {internship.title || "Untitled internship"}
                          {internship.company
                            ? ` — ${internship.company}`
                            : ""}
                        </option>
                      );
                    })}
                  </select>

                  {errors.internshipId && (
                    <p id="internshipId-error" className="field-error">
                      {errors.internshipId}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="skills">Skills</label>

                  <textarea
                    id="skills"
                    name="skills"
                    rows={3}
                    maxLength={1000}
                    placeholder="For example: React, JavaScript, Node.js"
                    value={form.skills}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.skills)}
                    aria-describedby={
                      errors.skills ? "skills-error" : undefined
                    }
                  />

                  {errors.skills && (
                    <p id="skills-error" className="field-error">
                      {errors.skills}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="coverLetter">Cover letter</label>

                  <textarea
                    id="coverLetter"
                    name="coverLetter"
                    rows={5}
                    maxLength={3000}
                    placeholder="Tell us why you're interested in this opportunity."
                    value={form.coverLetter}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.coverLetter)}
                    aria-describedby={
                      errors.coverLetter
                        ? "coverLetter-error"
                        : undefined
                    }
                  />

                  {errors.coverLetter && (
                    <p id="coverLetter-error" className="field-error">
                      {errors.coverLetter}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="button button-primary application-submit"
                  disabled={submitting || internships.length === 0}
                >
                  {submitting
                    ? "Submitting application..."
                    : "Submit application"}
                </button>

                {internships.length === 0 && (
                  <p className="form-note">
                    Applications are unavailable because no internships
                    are currently listed.
                  </p>
                )}

                <p className="form-note">
                  Your information will be sent to the configured EdVyro
                  backend for validation and processing.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Apply;