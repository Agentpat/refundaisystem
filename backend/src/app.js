import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import refundRoutes from "./routes/refund.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import orderRoutes from "./routes/order.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Refund AI API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/v1/refunds", refundRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/orders", orderRoutes);

export default app;
