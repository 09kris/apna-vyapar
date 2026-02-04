import { Request, Response } from 'express';
import InventoryTransaction from '../models/Invectory';
import Product from '../models/Product';
import Shop from '../models/Shop';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/AsyncHandler';

/* =====================================
   CREATE INVENTORY TRANSACTION
   (Audit + Stock Update)
===================================== */
export const createInventoryTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { shopId } = (req as any).params;

    if (!userId) throw new ApiError(401, 'Not authenticated');

    const shop = await Shop.findByPk(shopId);
    if (!shop || shop.ownerId !== userId) {
      throw new ApiError(403, 'Unauthorized');
    }

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
