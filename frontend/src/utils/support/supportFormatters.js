export const formatCurrency = (amount, currency = "USD") => {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-US")}`;
  }
};

export const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDateTime = (date) => {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const getCustomerName = (customer) => {
  if (!customer) {
    return "Unknown customer";
  }

  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ");

  return fullName || customer.name || customer.customerId || "Unknown customer";
};

export const getInitials = (customer) => {
  if (!customer) {
    return "?";
  }

  const first = customer.firstName?.[0] || "";
  const last = customer.lastName?.[0] || "";

  const initials = `${first}${last}`.toUpperCase();

  if (initials) {
    return initials;
  }

  if (customer.name) {
    return customer.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return customer.customerId?.slice(-2)?.toUpperCase() || "?";
};

export const truncate = (value, length = 100) => {
  if (!value) {
    return "No reason provided.";
  }

  const text = String(value);

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length).trim()}…`;
};

export const normalizeAiStatus = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "SKIPPED_SECURITY" || normalized === "SKIPPED") {
    return "SKIPPED";
  }

  if (normalized === "AVAILABLE") {
    return "AVAILABLE";
  }

  if (normalized === "UNAVAILABLE") {
    return "UNAVAILABLE";
  }

  if (normalized === "PENDING") {
    return "PENDING";
  }

  return null;
};

export const getRequestDecision = (request) => {
  return request?.status || "PENDING";
};

export const normalizeCollection = (response) => {
  const root = response?.data ?? response;

  if (Array.isArray(root)) {
    return root;
  }

  if (Array.isArray(root?.data)) {
    return root.data;
  }

  if (Array.isArray(root?.customers)) {
    return root.customers;
  }

  if (Array.isArray(root?.orders)) {
    return root.orders;
  }

  if (Array.isArray(root?.requests)) {
    return root.requests;
  }

  return [];
};

export const normalizeListResponse = (response) => {
  const root = response?.data ?? response;

  if (Array.isArray(root)) {
    return root;
  }

  if (Array.isArray(root?.data)) {
    return root.data;
  }

  if (Array.isArray(root?.requests)) {
    return root.requests;
  }

  return [];
};

export const normalizeDetailResponse = (response) => {
  const root = response?.data ?? response;

  if (root?.request) {
    return root;
  }

  if (root?.data?.request) {
    return root.data;
  }

  if (root?.data?._id) {
    return {
      request: root.data,
    };
  }

  if (root?._id) {
    return {
      request: root,
    };
  }

  return null;
};
