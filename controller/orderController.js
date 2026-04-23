const Order = require("../models/Order");
const Cart = require("../models/Cart");

const PREMIUM_FREE_BOOK_MIN_SUBTOTAL = 50;

const isPremiumUser = (userDoc) =>
  userDoc?.subscriptionPlan === "premium" &&
  (userDoc?.subscriptionStatus || "active") === "active";

const sendOrderConfirmationMail = async ({ to, orderId, totalPrice, itemCount }) => {
  const nodemailer = require("nodemailer");
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@ecommerce.local";

  if (!host || !user || !pass || !to) {
    console.log("[ORDER MAIL Fallback]", { to, orderId, totalPrice, itemCount });
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = `Order Confirmation - ${orderId}`;
  const text = `Thank you for your purchase.\n\nOrder ID: ${orderId}\nItems: ${itemCount}\nTotal: $${Number(
    totalPrice || 0
  ).toFixed(2)}\n\nYour order is being processed.`;
  const html = `
    <h2>Payment Successful</h2>
    <p>Thank you for your purchase.</p>
    <p><strong>Order ID:</strong> ${orderId}</p>
    <p><strong>Items:</strong> ${itemCount}</p>
    <p><strong>Total:</strong> $${Number(totalPrice || 0).toFixed(2)}</p>
    <p>Your order is being processed.</p>
  `;

  await transporter.sendMail({ from, to, subject, text, html });
  return true;
};

exports.createOrder = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user }).populate("items.book");

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const shippingInfo = req.body?.shippingInfo || {};
    const rawPaymentMethod = req.body?.paymentMethod || "card";
    const paymentMethod = ["aba", "abapay", "abapay_khqr", "abapay_khqr_deeplink"].includes(
      String(rawPaymentMethod).toLowerCase()
    )
      ? "aba"
      : rawPaymentMethod;
    const paymentReference = req.body?.paymentReference || "";
    const isPaid = paymentMethod === "aba";

    if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.address) {
      return res.status(400).json({
        message: "Shipping name, email, and address are required",
      });
    }

    const subtotalPrice = cart.items.reduce((sum, item) => {
      const unitPrice = Number(item.book?.price || 0);
      const quantity = Number(item.quantity || 0);
      return sum + unitPrice * quantity;
    }, 0);

    let discountAmount = 0;
    let freeBookId = null;

    if (isPremiumUser(req.userDoc) && subtotalPrice >= PREMIUM_FREE_BOOK_MIN_SUBTOTAL && cart.freeBookId) {
      const selected = cart.items.find(
        (item) => String(item?.book?._id || item?.book) === String(cart.freeBookId)
      );

      if (selected && Number(selected.quantity || 0) > 0) {
        discountAmount = Number(selected.book?.price || 0);
        freeBookId = selected.book?._id || null;
      }
    }

    const totalPrice = Math.max(0, subtotalPrice - discountAmount);

    const order = new Order({
      user: req.user,
      buyerName: req.userDoc?.name || shippingInfo.name || "",
      buyerEmail: req.userDoc?.email || shippingInfo.email || "",
      items: cart.items,
      subtotalPrice,
      discountAmount,
      freeBookId,
      totalPrice,
      shippingInfo: {
        name: shippingInfo.name,
        email: shippingInfo.email,
        phone: shippingInfo.phone || "",
        address: shippingInfo.address,
        city: shippingInfo.city || "",
        zip: shippingInfo.zip || "",
        country: shippingInfo.country || "",
      },
      paymentMethod,
      paymentReference,
      status: isPaid ? "paid" : "pending",
      paidAt: isPaid ? new Date() : null,
    });

    await order.save();

    let emailSent = false;
    try {
      emailSent = await sendOrderConfirmationMail({
        to: order.shippingInfo?.email,
        orderId: `ORD-${String(order._id).slice(-8).toUpperCase()}`,
        totalPrice: order.totalPrice,
        itemCount: Array.isArray(order.items) ? order.items.length : 0,
      });
    } catch (mailError) {
      console.error("Order confirmation email failed:", mailError.message);
    }

    cart.items = [];
    cart.freeBookId = null;
    await cart.save();

    return res.json({ ...order.toObject(), emailSent });
  } catch (error) {
    return next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user }).sort({ createdAt: -1 }).lean();
    return res.json(orders || []);
  } catch (error) {
    return next(error);
  }
};