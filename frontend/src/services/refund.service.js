import apiClient from "../api/client.js";

/*
|--------------------------------------------------------------------------
| Customers
|--------------------------------------------------------------------------
*/

export const getCustomers = async () => {
  const response = await apiClient.get("/customers");

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Orders
|--------------------------------------------------------------------------
*/

export const getOrders = async () => {
  const response = await apiClient.get("/orders");

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Create Refund Request
|--------------------------------------------------------------------------
*/

export const createRefundRequest = async (payload) => {
  const response = await apiClient.post("/refunds", payload);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| List Refund Requests
|--------------------------------------------------------------------------
*/

export const getRefundRequests = async (params = {}) => {
  const response = await apiClient.get("/refunds", {
    params,
  });

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Get Single Refund Request
|--------------------------------------------------------------------------
*/

export const getRefundRequestById = async (requestId) => {
  const response = await apiClient.get(`/refunds/${requestId}`);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Approve Refund
|--------------------------------------------------------------------------
|
| Support manually approves the refund request.
|
*/

export const approveRefund = async (requestId) => {
  const response = await apiClient.post(`/refunds/${requestId}/action/APPROVE`);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Deny Refund
|--------------------------------------------------------------------------
|
| A reason is required by the backend for a denial.
|
*/

export const denyRefund = async (requestId, reason) => {
  const response = await apiClient.post(`/refunds/${requestId}/action/DENY`, {
    reason,
  });

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Escalate Refund
|--------------------------------------------------------------------------
|
| A reason is required by the backend for escalation.
|
*/

export const escalateRefund = async (requestId, reason) => {
  const response = await apiClient.post(
    `/refunds/${requestId}/action/ESCALATE`,
    {
      reason,
    },
  );

  return response.data;
};
