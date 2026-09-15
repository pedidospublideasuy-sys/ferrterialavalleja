import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

function formatPriceStr(price: number): string {
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);
}

function generatePdfHtml(order: any): string {
  const itemRows = order.items.map((item: any) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">${item.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center;">${item.sku}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">${formatPriceStr(item.price)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;font-weight:600;">${formatPriceStr(item.subtotal)}</td>
    </tr>
  `).join('');

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
  };

  const paymentLabels: Record<string, string> = {
    pending: 'Pendiente',
    paid: 'Pagado',
    failed: 'Fallido',
    refunded: 'Reembolsado',
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pedido ${order.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #e8850c; }
    .logo { font-size: 28px; font-weight: 900; }
    .logo span { color: #e8850c; }
    .doc-info { text-align: right; }
    .doc-info h2 { font-size: 22px; color: #1a1a2e; margin-bottom: 4px; }
    .doc-info p { font-size: 12px; color: #666; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-box { background: #f8f9fa; border-radius: 8px; padding: 16px; }
    .info-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
    .info-box p { font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { background: #1a1a2e; color: white; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    thead th:first-child { border-radius: 6px 0 0 0; text-align: left; }
    thead th:last-child { border-radius: 0 6px 0 0; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-box { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #666; }
    .totals-row.total { border-top: 2px solid #1a1a2e; padding-top: 10px; margin-top: 6px; font-size: 18px; font-weight: 800; color: #1a1a2e; }
    .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-status { background: #e0f2fe; color: #0369a1; }
    .badge-payment { background: #dcfce7; color: #166534; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo"><span>Impo</span>Tech</div>
      <p style="font-size:11px;color:#999;margin-top:4px;">Tecnología e importación</p>
    </div>
    <div class="doc-info">
      <h2>PEDIDO</h2>
      <p style="font-size:16px;font-weight:700;color:#e8850c;margin-bottom:2px;">#${order.orderNumber}</p>
      <p>Fecha: ${new Date(order.createdAt).toLocaleDateString('es-UY', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Cliente</h3>
      <p><strong>${order.user.name}</strong></p>
      <p>${order.user.email}</p>
      ${order.user.phone ? `<p>Tel: ${order.user.phone}</p>` : ''}
      ${order.user.rut ? `<p>RUT: ${order.user.rut}</p>` : ''}
    </div>
    <div class="info-box">
      <h3>Envío y Estado</h3>
      ${order.shippingAddr ? `<p>${order.shippingAddr}</p>` : ''}
      ${order.shippingCity ? `<p>${order.shippingCity}</p>` : ''}
      <p style="margin-top:8px;">
        Estado: <span class="badge badge-status">${statusLabels[order.status] || order.status}</span>
      </p>
      <p style="margin-top:4px;">
        Pago: <span class="badge badge-payment">${paymentLabels[order.paymentStatus] || order.paymentStatus}</span>
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;">Producto</th>
        <th style="text-align:center;">SKU</th>
        <th style="text-align:center;">Cant.</th>
        <th style="text-align:right;">Precio</th>
        <th style="text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${formatPriceStr(order.subtotal)}</span></div>
      ${order.shipping > 0 ? `<div class="totals-row"><span>Envío</span><span>${formatPriceStr(order.shipping)}</span></div>` : ''}
      ${order.tax > 0 ? `<div class="totals-row"><span>IVA</span><span>${formatPriceStr(order.tax)}</span></div>` : ''}
      ${order.discount > 0 ? `<div class="totals-row"><span>Descuento</span><span>-${formatPriceStr(order.discount)}</span></div>` : ''}
      <div class="totals-row total"><span>TOTAL</span><span>${formatPriceStr(order.total)}</span></div>
    </div>
  </div>

  ${order.notes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-bottom:20px;font-size:12px;"><strong>Notas:</strong> ${order.notes}</div>` : ''}

  <div class="footer">
    <p><strong>Ferretería Lavalleja</strong> — Gracias por tu compra</p>
    <p style="margin-top:4px;">Este documento es un comprobante de pedido, no constituye factura fiscal.</p>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: session.user.id as string,
    },
    include: {
      user: {
        select: { name: true, email: true, phone: true, rut: true, company: true },
      },
      items: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  }

  const html = generatePdfHtml(order);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
