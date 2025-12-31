const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const PaymentConfig = require('../models/PaymentConfig');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentConfig:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         charge_per_tourist:
 *           type: number
 *         default_max_tourists:
 *           type: number
 *         max_provider_admins:
 *           type: number
 *         config_key:
 *           type: string
 *         product_overview:
 *           type: string
 *         mission_statement:
 *           type: string
 *         vision:
 *           type: string
 *         created_date:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/payment-configs:
 *   get:
 *     summary: Get payment configurations
 *     tags: [Payment Configs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: config_key
 *         schema:
 *           type: string
 *         description: Filter by config key
 *     responses:
 *       200:
 *         description: List of payment configurations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentConfig'
 */
router.get('/', authenticate, authorize('system_admin'), async (req, res) => {
  try {
    const { config_key } = req.query;
    const query = config_key ? { config_key } : {};
    
    const configs = await PaymentConfig.find(query);
    res.json(configs);
  } catch (error) {
    console.error('Error fetching payment configs:', error);
    res.status(500).json({ error: 'Failed to fetch payment configurations' });
  }
});

/**
 * @swagger
 * /api/payment-configs/{id}:
 *   get:
 *     summary: Get payment configuration by ID
 *     tags: [Payment Configs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment config ID
 *     responses:
 *       200:
 *         description: Payment configuration details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentConfig'
 *       404:
 *         description: Payment configuration not found
 */
router.get('/:id', authenticate, authorize('system_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const config = await PaymentConfig.findById(id);
    
    if (!config) {
      return res.status(404).json({ error: 'Payment configuration not found' });
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching payment config:', error);
    res.status(500).json({ error: 'Failed to fetch payment configuration' });
  }
});

/**
 * @swagger
 * /api/payment-configs:
 *   post:
 *     summary: Create a new payment configuration
 *     tags: [Payment Configs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               charge_per_tourist:
 *                 type: number
 *               default_max_tourists:
 *                 type: number
 *               max_provider_admins:
 *                 type: number
 *               config_key:
 *                 type: string
 *               product_overview:
 *                 type: string
 *               mission_statement:
 *                 type: string
 *               vision:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment configuration created successfully
 */
router.post('/', authenticate, authorize('system_admin'), async (req, res) => {
  try {
    const configData = {
      ...req.body,
      created_by: req.user._id
    };
    
    const config = new PaymentConfig(configData);
    await config.save();
    
    res.status(201).json(config);
  } catch (error) {
    console.error('Error creating payment config:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Configuration with this key already exists' });
    }
    res.status(500).json({ error: 'Failed to create payment configuration' });
  }
});

/**
 * @swagger
 * /api/payment-configs/{id}:
 *   put:
 *     summary: Update payment configuration
 *     tags: [Payment Configs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment config ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               charge_per_tourist:
 *                 type: number
 *               default_max_tourists:
 *                 type: number
 *               max_provider_admins:
 *                 type: number
 *               product_overview:
 *                 type: string
 *               mission_statement:
 *                 type: string
 *               vision:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment configuration updated successfully
 */
router.put('/:id', authenticate, authorize('system_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const config = await PaymentConfig.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!config) {
      return res.status(404).json({ error: 'Payment configuration not found' });
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error updating payment config:', error);
    res.status(500).json({ error: 'Failed to update payment configuration' });
  }
});

/**
 * @swagger
 * /api/payment-configs/{id}:
 *   delete:
 *     summary: Delete payment configuration
 *     tags: [Payment Configs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment config ID
 *     responses:
 *       200:
 *         description: Payment configuration deleted successfully
 */
router.delete('/:id', authenticate, authorize('system_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const config = await PaymentConfig.findByIdAndDelete(id);
    
    if (!config) {
      return res.status(404).json({ error: 'Payment configuration not found' });
    }
    
    res.json({ message: 'Payment configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment config:', error);
    res.status(500).json({ error: 'Failed to delete payment configuration' });
  }
});

module.exports = router;