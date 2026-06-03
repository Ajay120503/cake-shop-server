/**
 * Generate invoice HTML for an order
 */
export const generateInvoiceHTML = (order) => {
  const itemsRows = order.items
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${idx + 1}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`,
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice ${order.orderNumber || order._id}</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #333; padding: 24px; background: #fafafa;">
    <div style="max-width: 800px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 3px solid #b76e79; padding-bottom: 20px;">
        <div>
          <h1 style="margin: 0; color: #b76e79;">🎂 Cake Shop</h1>
          <p style="margin: 4px 0; color: #777;">Baked with love</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #333;">INVOICE</h2>
          <p style="margin: 4px 0;"><strong>Invoice #:</strong> ${order.orderNumber || order._id}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 24px;">
        <div>
          <h3>Bill To:</h3>
          <p style="margin: 4px 0;">${order.shippingAddress.fullName}</p>
          <p style="margin: 4px 0;">${order.shippingAddress.addressLine1}</p>
          ${order.shippingAddress.addressLine2 ? `<p style="margin: 4px 0;">${order.shippingAddress.addressLine2}</p>` : ''}
          <p style="margin: 4px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
          <p style="margin: 4px 0;">📞 ${order.shippingAddress.phone}</p>
        </div>
        <div style="text-align: right;">
          <h3>Ship To:</h3>
          <p style="margin: 4px 0;">${order.shippingAddress.fullName}</p>
          <p style="margin: 4px 0;">${order.shippingAddress.addressLine1}</p>
          <p style="margin: 4px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 32px;">
        <thead>
          <tr style="background: #b76e79; color: #fff;">
            <th style="padding: 12px; border: 1px solid #b76e79;">#</th>
            <th style="padding: 12px; border: 1px solid #b76e79;">Item</th>
            <th style="padding: 12px; border: 1px solid #b76e79;">Qty</th>
            <th style="padding: 12px; border: 1px solid #b76e79;">Price</th>
            <th style="padding: 12px; border: 1px solid #b76e79;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>

      <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
        <table style="min-width: 280px;">
          <tr><td>Subtotal:</td><td style="text-align: right; padding-left: 24px;">₹${order.itemsPrice.toFixed(2)}</td></tr>
          <tr><td>Tax (GST):</td><td style="text-align: right; padding-left: 24px;">₹${order.taxPrice.toFixed(2)}</td></tr>
          <tr><td>Shipping:</td><td style="text-align: right; padding-left: 24px;">₹${order.shippingPrice.toFixed(2)}</td></tr>
          ${order.discountPrice > 0 ? `<tr><td>Discount:</td><td style="text-align: right; color: green; padding-left: 24px;">-₹${order.discountPrice.toFixed(2)}</td></tr>` : ''}
          <tr style="border-top: 2px solid #b76e79;"><td style="padding-top: 8px;"><strong>Total:</strong></td><td style="text-align: right; padding-top: 8px; padding-left: 24px; color: #b76e79;"><strong>₹${order.totalPrice.toFixed(2)}</strong></td></tr>
        </table>
      </div>

      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
        <p>Payment Method: <strong>${order.paymentMethod}</strong></p>
        <p>Payment Status: <strong>${order.paymentStatus}</strong></p>
        <p style="margin-top: 16px;">Thank you for your business! 🎂</p>
        <p>Cake Shop - contact@cakeshop.com</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

export default generateInvoiceHTML;
