import { Request, Response } from 'express';
import InventoryTransaction from '../models/Invectory';
import Product from '../models/Product';
import Shop from '../models/Shop';
import ShopOwner from '../models/ShopOwner';
import Employee from '../models/Employee';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

/* =====================================
   HELPERS
===================================== */

const verifyShopAccess = async (userId: string, shopId: string) => {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  // First, look up the ShopOwner by userId to get the correct ownerId
  const shopOwner = await ShopOwner.findOne({ where: { userId } });
  
  // Check if user is the shop owner (compare shopOwner.ownerId with shop.ownerId)
  if (shopOwner && shop.ownerId === shopOwner.ownerId) {
    return shop;
  }

  // Check if user is an active employee of the shop
  const employee = await Employee.findOne({
    where: {
      userId: userId,
      shopId: shopId,
      isActive: true
    }
  });

  if (!employee) {
    throw new ApiError(403, 'Unauthorized - not a shop owner or active employee');
  }

  return shop;
};
export const createInventoryTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { shopId } = (req as any).params;

    if (!userId) throw new ApiError(401, 'Not authenticated');

    await verifyShopAccess(userId, shopId);

    const {
      productId,
      transactionType,
      quantityChange,
      referenceType,
      referenceId,
      unitCost,
      remarks,
    } = req.body;

    if (!productId || !transactionType || !quantityChange) {
      throw new ApiError(400, 'Missing required inventory transaction fields');
    }

    const product = await Product.findByPk(productId);
    if (!product || product.shopId !== shopId) {
      throw new ApiError(400, 'Invalid product');
    }

    const previousStock = product.stockQuantity || 0;
    const newStock = previousStock + Number(quantityChange);

    if (newStock < 0) {
      throw new ApiError(400, 'Insufficient stock for this transaction');
    }

    const totalValue =
      unitCost != null ? Number(unitCost) * Math.abs(quantityChange) : null;

    // Update product stock
    await product.update({ stockQuantity: newStock });

    // Create audit entry
    const transaction = await InventoryTransaction.create({
      shopId,
      productId,
      transactionType,
      quantityChange,
      previousStock,
      newStock,
      referenceType,
      referenceId,
      unitCost,
      performedBy: userId,
      remarks,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        transaction,
        'Inventory transaction recorded successfully',
      ),
    );
  },
);

/* =====================================
   GET SHOP INVENTORY TRANSACTIONS
===================================== */
export const getShopInventoryTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const { shopId } = (req as any).params;

    const transactions = await InventoryTransaction.findAll({
      where: { shopId },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        transactions,
        'Inventory transactions retrieved successfully',
      ),
    );
  },
);

/* =====================================
   GET PRODUCT INVENTORY TRANSACTIONS
===================================== */
export const getProductInventoryTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = (req as any).params;

    const transactions = await InventoryTransaction.findAll({
      where: { productId },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        transactions,
        'Product inventory transactions retrieved successfully',
      ),
    );
  },
);

/* =====================================
   GET SINGLE TRANSACTION
===================================== */
export const getInventoryTransactionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { transactionId } = (req as any).params;

    const transaction = await InventoryTransaction.findByPk(transactionId);
    if (!transaction) throw new ApiError(404, 'Transaction not found');

    return res.status(200).json(
      new ApiResponse(
        200,
        transaction,
        'Inventory transaction retrieved successfully',
      ),
    );
  },
);

/* =====================================
   GET LOW STOCK PRODUCTS
===================================== */
export const getLowStockProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { shopId } = (req as any).params;

    if (!userId) throw new ApiError(401, 'Not authenticated');

    await verifyShopAccess(userId, shopId);

    // Find products where stock is at or below reorder level
    const lowStockProducts = await Product.findAll({
      where: {
        shopId,
        isActive: true,
      },
      attributes: [
        'productId',
        'productName',
        'productCode',
        'stockQuantity',
        'reorderLevel',
        'unit',
        'retailPrice',
        'costPrice',
      ],
    });

    // Filter products below reorder level
    const filteredProducts = lowStockProducts.filter(
      (product) => (product.stockQuantity || 0) <= (product.reorderLevel || 0)
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        filteredProducts,
        'Low stock products retrieved successfully',
      ),
    );
  },
);

/* =====================================
   GET INVENTORY SUMMARY
===================================== */
export const getInventorySummary = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { shopId } = (req as any).params;

    if (!userId) throw new ApiError(401, 'Not authenticated');

    await verifyShopAccess(userId, shopId);

    // Get all products for this shop
    const products = await Product.findAll({
      where: { shopId, isActive: true },
      attributes: [
        'productId',
        'productName',
        'productCode',
        'stockQuantity',
        'reorderLevel',
        'maxStockLevel',
        'costPrice',
        'retailPrice',
        'unit',
      ],
    });

    // Calculate summary
    let totalProducts = products.length;
    let totalStockValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let overStockCount = 0;

    products.forEach((product) => {
      const stock = product.stockQuantity || 0;
      const cost = product.costPrice || 0;
      const retail = product.retailPrice || 0;
      const reorderLevel = product.reorderLevel || 0;
      const maxStockLevel = product.maxStockLevel || 0;

      totalStockValue += stock * cost;
      totalRetailValue += stock * retail;

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= reorderLevel) {
        lowStockCount++;
      } else if (maxStockLevel > 0 && stock > maxStockLevel) {
        overStockCount++;
      }
    });

    // Get recent transactions count
    const recentTransactions = await InventoryTransaction.count({
      where: {
        shopId,
        createdAt: {
          // @ts-ignore
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
        },
      },
    });

    const summary = {
      totalProducts,
      totalStockValue: parseFloat(totalStockValue.toFixed(2)),
      totalRetailValue: parseFloat(totalRetailValue.toFixed(2)),
      lowStockCount,
      outOfStockCount,
      overStockCount,
      recentTransactions,
    };

    return res.status(200).json(
      new ApiResponse(
        200,
        summary,
        'Inventory summary retrieved successfully',
      ),
    );
  },
);
