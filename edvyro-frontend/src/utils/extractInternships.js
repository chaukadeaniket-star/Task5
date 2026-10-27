export function extractInternships(response) {
  const data = response?.data ?? response;
  const internships = Array.isArray(data)
    ? data
    : data?.internships ?? data?.items ?? data?.results;

  if (!Array.isArray(internships)) {
    throw new Error("The server returned an unexpected internship format.");
  }

  return internships;
}
