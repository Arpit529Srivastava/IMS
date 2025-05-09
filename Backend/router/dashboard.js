const express = require("express");
const app = express();
const dashboard = require("../controller/dashboard");

// Get Dashboard Summary
app.get("/summary/:userId", dashboard.getDashboardSummary);

// Get Low Stock Products
app.get("/low-stock/:userId", dashboard.getLowStockProducts);

// Get Recent Activities
app.get("/recent-activities/:userId", dashboard.getRecentActivities);

module.exports = app; 