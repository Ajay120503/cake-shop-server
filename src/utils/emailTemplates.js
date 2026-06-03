export const orderConfirmationTemplate = (order) => {
  const itemsList = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Order Confirmation</title></head>
    <body style="font-family: Arial, sans-serif; background: #f7f3ee; padding: 24px; color: #333;">
      <div style="max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #b76e79 0%, #8e3b46 100%); color: #fff; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎂 Order Confirmed!</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Thank you for your order</p>
        </div>
        <div style="padding: 32px;">
          <p>Hi <strong>${order.shippingAddress.fullName}</strong>,</p>
          <p>Your order has been placed successfully. Here are the details:</p>
          <p><strong>Order ID:</strong> #${order.orderNumber || order._id}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Expected Delivery:</strong> ${new Date(order.deliveryDate).toLocaleDateString()}</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
            <thead>
              <tr style="background: #f7f3ee;">
                <th style="padding: 12px; text-align: left;">Item</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Price</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsList}</tbody>
          </table>
          <div style="margin-top: 24px; text-align: right;">
            <p>Subtotal: ₹${order.itemsPrice.toFixed(2)}</p>
            <p>Tax: ₹${order.taxPrice.toFixed(2)}</p>
            <p>Shipping: ₹${order.shippingPrice.toFixed(2)}</p>
            ${order.discountPrice > 0 ? `<p style="color: green;">Discount: -₹${order.discountPrice.toFixed(2)}</p>` : ''}
            <h3 style="color: #b76e79;">Total: ₹${order.totalPrice.toFixed(2)}</h3>
          </div>
        </div>
        <div style="background: #f7f3ee; padding: 16px; text-align: center; color: #777; font-size: 12px;">
          <p>🎂 Cake Shop - Baked with love</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const orderStatusTemplate = (order, newStatus) => {
  const statusMessages = {
    Processing: '⏳ Your order is being prepared in our kitchen.',
    Confirmed: '✅ Your order has been confirmed by our team.',
    Shipped: '🚚 Your order is on the way!',
    Out_for_Delivery: '🛵 Your order is out for delivery.',
    Delivered: '🎉 Your order has been delivered. Enjoy!',
    Cancelled: '❌ Your order has been cancelled.',
    Refunded: '💰 Your refund has been processed.',
  };

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #f7f3ee; padding: 24px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px;">
        <h2 style="color: #b76e79;">Order Status Update</h2>
        <p>Your order <strong>#${order.orderNumber || order._id}</strong> status has been updated to:</p>
        <h3 style="background: #b76e79; color: #fff; padding: 12px; border-radius: 8px; text-align: center;">
          ${newStatus.replace(/_/g, ' ').toUpperCase()}
        </h3>
        <p>${statusMessages[newStatus] || ''}</p>
        <p style="margin-top: 24px; color: #777;">Thank you for shopping with Cake Shop! 🎂</p>
      </div>
    </body>
    </html>
  `;
};

export const passwordResetTemplate = (resetUrl, name) => {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #f7f3ee; padding: 24px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px;">
        <h2 style="color: #b76e79;">Password Reset Request</h2>
        <p>Hi ${name || 'there'},</p>
        <p>You requested to reset your password. Click the button below to reset it. This link will expire in 10 minutes.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #b76e79; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
        </p>
        <p>If the button doesn't work, copy and paste this link:</p>
        <p style="word-break: break-all; color: #b76e79;">${resetUrl}</p>
        <p style="color: #777; margin-top: 32px;">If you didn't request this, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;
};

export const welcomeTemplate = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #f7f3ee; padding: 24px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; text-align: center;">
        <h1 style="color: #b76e79;">🎂 Welcome to Cake Shop!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining our sweet family! We're excited to bring freshly baked happiness to your doorstep.</p>
        <p style="margin-top: 24px;">Use code <strong style="background: #b76e79; color: #fff; padding: 6px 12px; border-radius: 4px;">WELCOME10</strong> for 10% off your first order!</p>
        <p style="margin-top: 32px; color: #777;">Happy Baking! 🎂</p>
      </div>
    </body>
    </html>
  `;
};

export const contactReplyTemplate = (name, message) => {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #f7f3ee; padding: 24px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px;">
        <h2 style="color: #b76e79;">Thanks for reaching out, ${name}!</h2>
        <p>We have received your message and our team will get back to you within 24 hours.</p>
        <p style="background: #f7f3ee; padding: 12px; border-radius: 8px; margin-top: 16px;">"${message}"</p>
        <p style="margin-top: 24px; color: #777;">— Cake Shop Team 🎂</p>
      </div>
    </body>
    </html>
  `;
};
