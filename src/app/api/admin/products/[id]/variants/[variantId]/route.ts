import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, sku, price, comparePrice, stock, attributes, active } = body;

    const variant = await prisma.productVariant.update({
      where: { id: params.variantId },
      data: {
        name,
        sku: sku || null,
        price: price !== undefined ? parseFloat(price) : undefined,
        comparePrice: comparePrice !== undefined ? (comparePrice ? parseFloat(comparePrice) : null) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        attributes: attributes ? JSON.stringify(attributes) : undefined,
        active: active !== undefined ? active : undefined,
      },
    });

    return NextResponse.json(variant);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.productVariant.delete({
      where: { id: params.variantId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
