import axios from "axios";

const DEFAULT_API_URL = import.meta.env.PROD
  ? "/api/v1"
  : "http://127.0.0.1:5000/api/v1";
const API_TIMEOUT = 10000;

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("internboard.sessionToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class ApiError extends Error {
  constructor(message, status = null, code = null, fields = {}) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function getSafeErrorMessage(status) {
  const messages = {
    400: "The request contains invalid information.",
    401: "Authentication is required to continue.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource could not be found.",
    409: "This request conflicts with existing information.",
    422: "Some submitted information could not be processed.",
    429: "Too many requests. Please wait before trying again.",
  };

  if (messages[status]) {
    return messages[status];
  }

  if (status >= 500) {
    return "The server encountered a problem. Please try again later.";
  }

  return "The request could not be completed. Please try again.";
}

function normalizeApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isCancel(error)) {
    return new ApiError(
      "The request was cancelled.",
      null,
      "REQUEST_CANCELLED"
    );
  }

  if (
    error.code === "ECONNABORTED" ||
    error.code === "ETIMEDOUT"
  ) {
    return new ApiError(
      "The request timed out. Please try again.",
      null,
      "REQUEST_TIMEOUT"
    );
  }

  if (!error.response) {
    return new ApiError(
      "Unable to connect to the server. Check your connection and try again.",
      null,
      "NETWORK_ERROR"
    );
  }

  return new ApiError(
    getSafeErrorMessage(error.response.status),
    error.response.status,
    "HTTP_ERROR",
    error.response.data?.fields &&
      typeof error.response.data.fields === "object" &&
      !Array.isArray(error.response.data.fields)
      ? Object.fromEntries(
          Object.entries(error.response.data.fields).filter(
            ([key, value]) =>
              ["fullName", "email", "phone", "internshipId", "skills", "coverLetter"].includes(key) &&
              typeof value === "string"
          )
        )
      : {}
  );
}

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error))
);

export async function getHealth(config = {}) {
  const response = await api.get("/health", config);

  return response.data;
}

export async function getInternships(params = {}, config = {}) {
  const response = await api.get("/internships", {
    ...config,
    params,
  });

  return response.data;
}

export async function submitApplication(applicationData, config = {}) {
  const response = await api.post(
    "/applications",
    applicationData,
    config
  );

  return response.data;
}

export default api;