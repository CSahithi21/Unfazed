
const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const Payment = require("../models/Payment");
const Client = require("../models/Client");
const auth = require("../middleware/auth");
const razorpay = require("../config/razorpay");

router.use(auth);

// CREATE RAZORPAY ORDER
router.post("/create-order", async (req, res) => {
  try {
    const { clientId, amount, packageName } = req.body;
    const numericAmount = Number(amount);

    if (
      !clientId ||
      !Number.isSafeInteger(numericAmount) ||
      numericAmount < 1 ||
      numericAmount > 100000
    ) {
      return res.status(400).json({
        message: "Enter a valid client and amount.",
      });
    }

    const client = await Client.findOne({
      _id: clientId,
      therapist: req.userId,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
      });
    }

    const order = await razorpay.orders.create({
      amount: numericAmount * 100,
      currency: "INR",
      receipt: `unfazed_${crypto.randomUUID()}`,
    });

    const payment = await Payment.create({
      therapist: req.userId,
      client: client._id,
      amount: numericAmount,
      currency: "INR",
      packageName: packageName || "Single Session",
      razorpayOrderId: order.id,
      status: "pending",
    });

    res.status(201).json({
      message: "Razorpay order created.",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Order creation error:", error);

    res.status(500).json({
      message: "Could not create payment order.",
    });
  }
});

// VERIFY SIGNATURE AND CONFIRM CAPTURE
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Payment verification details are missing.",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      therapist: req.userId,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found.",
      });
    }

    if (payment.status === "paid") {
      return res.json({
        message: "Payment was already confirmed.",
        verified: true,
        status: "paid",
      });
    }

    // Verify the checkout signature.
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const received = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(generatedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        message: "Invalid payment signature.",
      });
    }

    // Fetch payment directly from Razorpay.
    const razorpayPayment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    // Ensure this payment belongs to our order.
    if (
      razorpayPayment.order_id !== razorpay_order_id ||
      razorpayPayment.amount !== payment.amount * 100 ||
      razorpayPayment.currency !== payment.currency
    ) {
      return res.status(400).json({
        message: "Payment details do not match the order.",
      });
    }

    // Only mark paid when Razorpay confirms capture.
    if (razorpayPayment.status !== "captured") {
      return res.status(202).json({
        message: "Payment is not captured yet.",
        verified: true,
        status: razorpayPayment.status,
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = "paid";
    payment.verifiedAt = new Date();

    await payment.save();

    res.json({
      message: "Payment successfully verified and captured.",
      verified: true,
      status: "paid",
      payment,
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);

    res.status(500).json({
      message: "Could not verify payment with Razorpay.",
    });
  }
});

// GET PAYMENT HISTORY
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find({
      therapist: req.userId,
    })
      .populate("client", "name email")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch payments.",
    });
  }
});

module.exports = router;
