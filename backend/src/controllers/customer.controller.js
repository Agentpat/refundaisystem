import Customer from "../models/Customer.js";

export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .select("_id customerId firstName lastName email accountStatus")
      .sort({ customerId: 1 });

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customers.",
    });
  }
};
