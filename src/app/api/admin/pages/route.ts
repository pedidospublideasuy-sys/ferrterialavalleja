import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'store_admin')) return null
  return session
}

// GET /api/admin/pages - lista todas las páginas
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const pages = await prisma.page.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      published: true,
      showInMenu: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(pages)
}

// POST /api/admin/pages - crear página
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { slug, title, content, metaTitle, metaDesc, published, showInMenu } = body

  if (!slug || !title) {
    return NextResponse.json({ error: 'slug y title son requeridos' }, { status: 400 })
  }

  // Validar slug (solo letras, números y guiones)
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (!slugRegex.test(slug)) {
    return NextResponse.json(
      { error: 'El slug solo puede contener letras minúsculas, números y guiones' },
      { status: 400 }
    )
  }

  // Verificar duplicado
  const existing = await prisma.page.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Ya existe una página con ese slug' }, { status: 409 })
  }

  const page = await prisma.page.create({
    data: {
      slug,
      title,
      content: content || '',
      metaTitle: metaTitle || null,
      metaDesc: metaDesc || null,
      published: published !== undefined ? published : true,
      showInMenu: showInMenu || false,
    },
  })

  return NextResponse.json(page, { status: 201 })
}

// PUT /api/admin/pages - actualizar página
export async function PUT(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { id, slug, title, content, metaTitle, metaDesc, published, showInMenu } = body

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  // Verificar que no haya otro con el mismo slug
  if (slug) {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'El slug solo puede contener letras minúsculas, números y guiones' },
        { status: 400 }
      )
    }
    const existing = await prisma.page.findFirst({ where: { slug, NOT: { id } } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe otra página con ese slug' }, { status: 409 })
    }
  }

  const page = await prisma.page.update({
    where: { id },
    data: {
      ...(slug !== undefined && { slug }),
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(metaTitle !== undefined && { metaTitle: metaTitle || null }),
      ...(metaDesc !== undefined && { metaDesc: metaDesc || null }),
      ...(published !== undefined && { published }),
      ...(showInMenu !== undefined && { showInMenu }),
    },
  })

  return NextResponse.json(page)
}

// DELETE /api/admin/pages?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  await prisma.page.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
