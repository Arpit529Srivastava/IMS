const Product = require("../models/Product");
const Purchase = require("../models/purchase");
const Sales = require("../models/sales");
const Store = require("../models/store");

// Get Dashboard Summary
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get total products count
    const totalProducts = await Product.countDocuments({ userID: userId });
    
    // Get total stores count
    const totalStores = await Store.countDocuments({ userID: userId });
    
    // Get total sales amount
    const salesResult = await Sales.aggregate([
      { $match: { userID: userId } },
      { $group: { _id: null, total: { $sum: "$TotalSaleAmount" } } }
    ]);
    const totalSales = salesResult[0]?.total || 0;
    
    // Get total purchase amount
    const purchaseResult = await Purchase.aggregate([
      { $match: { userID: userId } },
      { $group: { _id: null, total: { $sum: "$TotalPurchaseAmount" } } }
    ]);
    const totalPurchases = purchaseResult[0]?.total || 0;
    
    // Get monthly sales data
    const monthlySales = await Sales.aggregate([
      { $match: { userID: userId } },
      {
        $group: {
          _id: { $month: { $dateFromString: { dateString: "$SaleDate" } } },
          total: { $sum: "$TotalSaleAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get top selling products
    const topProducts = await Sales.aggregate([
      { $match: { userID: userId } },
      {
        $group: {
          _id: "$ProductID",
          totalSold: { $sum: "$StockSold" },
          totalAmount: { $sum: "$TotalSaleAmount" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      }
    ]);

    res.json({
      totalProducts,
      totalStores,
      totalSales,
      totalPurchases,
      monthlySales,
      topProducts
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
};

// Get Low Stock Products
const getLowStockProducts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const threshold = parseInt(req.query.threshold) || 10;
    
    const lowStockProducts = await Product.find({
      userID: userId,
      stock: { $lt: threshold }
    }).sort({ stock: 1 });
    
    res.json(lowStockProducts);
  } catch (error) {
    console.error("Low stock products error:", error);
    res.status(500).json({ error: "Failed to fetch low stock products" });
  }
};

// Get Recent Activities
const getRecentActivities = async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent sales
    const recentSales = await Sales.find({ userID: userId })
      .sort({ SaleDate: -1 })
      .limit(limit)
      .populate("ProductID", "name")
      .populate("StoreID", "name");
    
    // Get recent purchases
    const recentPurchases = await Purchase.find({ userID: userId })
      .sort({ PurchaseDate: -1 })
      .limit(limit)
      .populate("ProductID", "name");
    
    res.json({
      recentSales,
      recentPurchases
    });
  } catch (error) {
    console.error("Recent activities error:", error);
    res.status(500).json({ error: "Failed to fetch recent activities" });
  }
};

module.exports = {
  getDashboardSummary,
  getLowStockProducts,
  getRecentActivities
}; 