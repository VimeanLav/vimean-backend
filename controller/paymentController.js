const crypto = require("crypto");

const toReqTime = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
};

const buildTransactionId = () => `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

const allowMockOnFailure =
  process.env.ABA_MOCK_ON_FAILURE === "true" || process.env.NODE_ENV !== "production";

const extractQrValue = (payload) => {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  return (
    payload.qrString ||
    payload.qr_code ||
    payload.checkout_qr_url ||
    payload.abapay_deeplink ||
    payload.data?.qrString ||
    payload.data?.qr_code ||
    payload.data?.checkout_qr_url ||
    payload.data?.abapay_deeplink ||
    ""
  );
};

const pickValue = (payload, keys) => {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  for (const key of keys) {
    if (payload[key]) {
      return payload[key];
    }
    if (payload.data && payload.data[key]) {
      return payload.data[key];
    }
  }

  return "";
};

exports.createAbaPurchase = async (req, res, next) => {
  try {
    const merchantId = process.env.ABA_MERCHANT_ID || "ec474582";
    const apiKey = process.env.ABA_API_KEY || "e531a27ef0eedea6a12cd7656fabc34045e9589a";
    const purchaseUrl =
      process.env.ABA_PURCHASE_URL ||
      "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase";

    if (!merchantId || !apiKey) {
      return res.status(500).json({ message: "ABA configuration is missing" });
    }

    const amount = Number(req.body?.amount || 0);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const shippingInfo = req.body?.shippingInfo || {};

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const reqTime = toReqTime();
    const tranId = buildTransactionId();
    const amountString = amount.toFixed(2);
    const shipping = "0";
    const firstname = shippingInfo.name || "Customer";
    const lastname = shippingInfo.name || "Customer";
    const email = shippingInfo.email || "";
    const rawPhone = String(shippingInfo.phone || "").trim();
    const normalizedPhone = rawPhone.replace(/[^0-9]/g, "");
    const phone = normalizedPhone.length >= 8 ? normalizedPhone : "";
    const type = "purchase";
    const paymentOption = "abapay_khqr_deeplink";
    const currency = "USD";

    const normalizedItems = items.map((item) => ({
      name: item.name || "Item",
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
    }));
    const itemString = Buffer.from(JSON.stringify(normalizedItems), "utf8").toString("base64");

    const returnUrl = process.env.ABA_RETURN_URL || "http://localhost:3000/";
    const cancelUrl = process.env.ABA_CANCEL_URL || returnUrl;
    const continueSuccessUrl =
      process.env.ABA_CONTINUE_SUCCESS_URL ||
      "http://localhost:3000/?view=checkout&state=success";
    const returnParams = JSON.stringify({ source: "digipaper", tranId });
    const returnDeeplink = "";
    const customFields = "";
    const payout = "";
    const lifetime = "";
    const additionalParams = "";
    const googlePayToken = "";
    const skipSuccessPage = "";

    // Official PayWay purchase hash order from API docs.
    const hashBase =
      `${reqTime}${merchantId}${tranId}${amountString}${itemString}${shipping}` +
      `${firstname}${lastname}${email}${phone}${type}${paymentOption}${returnUrl}` +
      `${cancelUrl}${continueSuccessUrl}${returnDeeplink}${currency}${customFields}` +
      `${returnParams}${payout}${lifetime}${additionalParams}${googlePayToken}${skipSuccessPage}`;
    const hash = crypto
      .createHmac("sha512", apiKey)
      .update(hashBase)
      .digest("base64");

    const form = new FormData();
    form.append("req_time", reqTime);
    form.append("merchant_id", merchantId);
    form.append("tran_id", tranId);
    form.append("amount", amountString);
    form.append("items", itemString);
    form.append("shipping", shipping);
    form.append("firstname", firstname);
    form.append("lastname", lastname);
    form.append("email", email);
    form.append("phone", phone);
    form.append("type", type);
    form.append("payment_option", paymentOption);
    form.append("return_url", returnUrl);
    form.append("cancel_url", cancelUrl);
    form.append("continue_success_url", continueSuccessUrl);
    form.append("currency", currency);
    form.append("return_params", returnParams);
    form.append("hash", hash);

    const response = await fetch(purchaseUrl, {
      method: "POST",
      body: form,
    });

    const responseText = await response.text();
    let payload = null;
    try {
      payload = JSON.parse(responseText);
    } catch (_error) {
      payload = { raw: responseText };
    }

    const statusCode = Number(payload?.status?.code);

    if (!response.ok || (!Number.isNaN(statusCode) && statusCode !== 0)) {
      if (allowMockOnFailure) {
        const fallbackQrValue = `MOCK-KHQR|${tranId}|${amountString}`;
        return res.json({
          transactionId: tranId,
          amount: amountString,
          qrValue: fallbackQrValue,
          qrImage: "",
          checkoutQrUrl: "",
          abaDeeplink: "",
          isMock: true,
          warning:
            payload?.status?.message ||
            payload?.message ||
            "ABA gateway unavailable. Using development fallback.",
          payload,
        });
      }

      return res.status(502).json({
        message: payload?.status?.message || payload?.message || "ABA purchase request failed",
        details: payload,
      });
    }

    const qrValue = extractQrValue(payload);
    const qrImage = pickValue(payload, ["qrImage", "qr_image"]);
    const checkoutQrUrl = pickValue(payload, ["checkout_qr_url"]);
    const abaDeeplink = pickValue(payload, ["abapay_deeplink"]);

    return res.json({
      transactionId: tranId,
      amount: amountString,
      qrValue,
      qrImage,
      checkoutQrUrl,
      abaDeeplink,
      payload,
    });
  } catch (error) {
    return next(error);
  }
};
