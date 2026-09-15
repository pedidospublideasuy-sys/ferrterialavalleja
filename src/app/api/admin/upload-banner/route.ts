import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

async function isAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === 'admin' || session?.user?.role === 'store_admin';
}

export async function POST(req: NextRequest) {
    if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo no permitido. Usá PNG, JPG, WEBP o GIF.' }, { status: 400 });
        }
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'El archivo no puede superar 5MB' }, { status: 400 });
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const key = `banner-${Date.now()}`;
        const filename = `${key}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        // Intentar guardar en filesystem (funciona en servidor propio)
        try {
            const uploadDir = path.join(process.cwd(), 'public', 'banners');
            if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
            await writeFile(path.join(uploadDir, filename), buffer);
            return NextResponse.json({ url: `/banners/${filename}`, success: true });
        } catch {
            // Filesystem read-only (Vercel) → guardar en DB y servir via API
            const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
            await prisma.siteSetting.upsert({
                where: { key: `file_${key}` },
                update: { value: dataUrl },
                create: { key: `file_${key}`, value: dataUrl },
            });
            return NextResponse.json({ url: `/api/file/${key}`, success: true });
        }
    } catch (err) {
        console.error('Error subiendo banner:', err);
        return NextResponse.json({ error: 'Error interno al subir el archivo' }, { status: 500 });
    }
}
