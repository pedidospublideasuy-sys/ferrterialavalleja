import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import slugify from 'slugify';

function extractImageUrls(product: any): string[] {
  const values = [
    ...(Array.isArray(product?.galeria) ? product.galeria : []),
    ...(Array.isArray(product?.gallery) ? product.gallery : []),
    ...(Array.isArray(product?.images) ? product.images : []),
    product?.image_url,
    product?.image,
  ];
  return values
    .map((value: any) => typeof value === 'string' ? value : value?.img ?? value?.url ?? value?.src)
    .filter((value: unknown): value is string => typeof value === 'string' && /^(https?:)?\/\//i.test(value))
    .map(value => value.startsWith('//') ? `https:${value}` : value)
    .filter((value, index, all) => all.indexOf(value) === index);
}

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' || session?.user?.role === 'store_admin';
}

// GET: obtener la config del proveedor
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const settings = await prisma.siteSetting.findMany({
    where: { key: { startsWith: 'sync_' } },
  });

  const config: Record<string, string> = {};
  for (const s of settings) {
    config[s.key] = s.value;
  }

  // Obtener últimas sincronizaciones
  const logs = await prisma.syncLog.findMany({
    where: { apiSourceId: 'provider-api' },
    orderBy: { startedAt: 'desc' },
    take: 20,
  });

  // Contar productos importados
  const importedCount = await prisma.product.count({
    where: { sourceApi: 'provider-api' },
  });

  return NextResponse.json({ config, logs, importedCount });
}

// PUT: guardar config del proveedor
export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { email, token, url } = body;

  const updates = [
    { key: 'sync_email', value: email || '' },
    { key: 'sync_token', value: token || '' },
    { key: 'sync_url', value: url || '' },
  ];

  for (const u of updates) {
    await prisma.siteSetting.upsert({
      where: { key: u.key },
      create: { key: u.key, value: u.value },
      update: { value: u.value },
    });
  }

  return NextResponse.json({ success: true });
}

// POST: ejecutar sincronización
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { fecha } = body;

  // Obtener credenciales
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: ['sync_email', 'sync_token', 'sync_url'] } },
  });
  const config: Record<string, string> = {};
  for (const s of settings) config[s.key] = s.value;

  if (!config.sync_url) {
    return NextResponse.json({ error: 'Configurá la URL del web service SOAP del proveedor primero' }, { status: 400 });
  }

  if (!config.sync_email || !config.sync_token) {
    return NextResponse.json({ error: 'Configurá email y token del proveedor primero' }, { status: 400 });
  }

  // Crear log de sync
  const syncLog = await prisma.syncLog.create({
    data: {
      apiSourceId: 'provider-api',
      status: 'running',
      itemsSynced: 0,
      itemsFailed: 0,
    },
  });

  try {
    const syncDate = fecha || '2015-01-01 00:00:00';

    // Construir el envelope SOAP
    const soapXml = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope
    xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:ns1="http://schema.example.com"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
    SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
    <SOAP-ENV:Body>
        <ns1:productos_con_galeria>
            <email xsi:type="xsd:string">${config.sync_email}</email>
            <token xsi:type="xsd:string">${config.sync_token}</token>
            <fecha xsi:type="xsd:string">${syncDate}</fecha>
            <formato xsi:type="xsd:string">json</formato>
        </ns1:productos_con_galeria>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

    // URL del Web Service SOAP del proveedor (configurada desde el panel admin)
    const soapUrl = config.sync_url || process.env.PROVIDER_SOAP_URL;

    if (!soapUrl) {
      throw new Error('URL del web service SOAP no configurada. Ingresá la URL en la configuración del proveedor.');
    }

    const response = await fetch(soapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `${soapUrl}&method=productos_con_galeria`,
      },
      body: soapXml,
    });

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown';
      if (response.status === 405) {
        throw new Error(`La URL del web service rechazó la solicitud (HTTP 405). Verificá que la URL sea correcta y acepte peticiones SOAP POST.`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Acceso denegado (HTTP ${response.status}). Verificá que el email y token sean correctos.`);
      }
      if (response.status === 404) {
        throw new Error(`URL no encontrada (HTTP 404). Verificá que la URL del web service sea correcta.`);
      }
      throw new Error(`Error del servidor SOAP: HTTP ${response.status} - ${statusText}`);
    }

    const responseText = await response.text();

    // Extraer el JSON del envelope SOAP de respuesta
    let productsJson: string;

    // Log para debug: primeros 500 chars de la respuesta
    console.log('[SOAP Response] Status:', response.status);
    console.log('[SOAP Response] First 500 chars:', responseText.substring(0, 500));

    // Detectar respuesta de error SOAP (faultstring)
    const faultMatch = responseText.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/i);
    if (faultMatch) {
      throw new Error(`Error del servidor SOAP: ${faultMatch[1].trim()}`);
    }

    // Detectar respuesta vacía o HTML (redirect, login page, etc.)
    if (!responseText.trim() || responseText.trim().startsWith('<!')) {
      throw new Error(`Respuesta inválida del servidor (posible redirect o página de login). Respuesta: ${responseText.substring(0, 200)}`);
    }

    // Detectar si el servidor devolvió el WSDL
    if (responseText.includes('<wsdl:definitions') || responseText.includes('wsdl:service')) {
      throw new Error('El servidor devolvió el WSDL en vez de procesar la solicitud. Verificá que la URL NO tenga "&wsdl" al final.');
    }

    const returnMatch = responseText.match(/<return[^>]*>([\s\S]*?)<\/return>/i)
      || responseText.match(/<productos_con_galeriaReturn[^>]*>([\s\S]*?)<\/productos_con_galeriaReturn>/i)
      || responseText.match(/<ns\d*:return[^>]*>([\s\S]*?)<\/ns\d*:return>/i);

    if (returnMatch) {
      productsJson = returnMatch[1];
    } else {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        productsJson = jsonMatch[0];
      } else {
        // Mostrar los primeros 300 chars de la respuesta para diagnóstico
        const preview = responseText.substring(0, 300).replace(/\n/g, ' ');
        throw new Error(`No se pudo extraer datos de la respuesta SOAP. Verificá email y token. Respuesta recibida: "${preview}"`);
      }
    }

    // Decodificar entidades HTML
    productsJson = productsJson
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");

    let products: any[];
    try {
      products = JSON.parse(productsJson);
    } catch {
      throw new Error('La respuesta del servidor no es JSON válido. Verificá credenciales.');
    }

    if (!Array.isArray(products)) {
      throw new Error('Respuesta inesperada del servidor');
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Obtener o crear categoría por defecto para productos importados
    let defaultCategory = await prisma.category.findFirst({
      where: { slug: 'importados' },
    });
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          name: 'Importados',
          slug: 'importados',
          description: 'Productos importados desde proveedor',
          active: true,
        },
      });
    }

    // Obtener o crear marca genérica para productos importados
    let defaultBrand = await prisma.brand.findFirst({
      where: { slug: 'importados' },
    });
    if (!defaultBrand) {
      defaultBrand = await prisma.brand.create({
        data: {
          name: 'Importados',
          slug: 'importados',
          active: true,
        },
      });
    }

    for (const product of products) {
      try {
        const codigo = product.codigo?.trim();
        if (!codigo) {
          failed++;
          errors.push('Producto sin código, saltado');
          continue;
        }

        const nombre = product.nombre?.trim() || `Producto ${codigo}`;
        const precio = parseFloat(product.precio) || 0;
        const stock = parseInt(product.stock) || 0;
        const copete = product.copete?.trim() || '';
        const descripcion = product.descripcion?.trim() || '';
        const gtin = product.gtin?.trim() || null;
        const modelo = product.modelo?.trim() || null;
        const nroParte = product.nro_parte?.trim() || null;

        // Construir array de imágenes desde la galería
        const images = extractImageUrls(product);

        // Generar slug único
        let slug = slugify(nombre, { lower: true, strict: true, locale: 'es' });
        if (!slug || slug.length < 2) slug = `producto-${codigo.toLowerCase()}`;

        // Buscar si ya existe por sourceId + sourceApi
        const existing = await prisma.product.findFirst({
          where: {
            sourceId: codigo,
            sourceApi: 'provider-api',
          },
        });

        if (existing) {
          // Actualizar precio, stock e imágenes
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              cost: precio,
              price: precio,
              stock: stock,
              images: JSON.stringify(images),
              description: descripcion || existing.description,
              shortDesc: copete || existing.shortDesc,
              barcode: gtin || existing.barcode,
              updatedAt: new Date(),
            },
          });
        } else {
          // Verificar que el slug no exista
          const slugExists = await prisma.product.findFirst({ where: { slug } });
          if (slugExists) {
            slug = `${slug}-${codigo.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          }

          // Verificar que el SKU no exista
          const skuExists = await prisma.product.findFirst({ where: { sku: codigo } });
          if (skuExists) {
            await prisma.product.update({
              where: { id: skuExists.id },
              data: {
                cost: precio,
                price: precio,
                stock: stock,
                images: JSON.stringify(images),
                description: descripcion || skuExists.description,
                shortDesc: copete || skuExists.shortDesc,
                sourceId: codigo,
                sourceApi: 'provider-api',
                barcode: gtin || skuExists.barcode,
              },
            });
          } else {
            await prisma.product.create({
              data: {
                name: nombre,
                slug,
                sku: codigo,
                description: descripcion,
                shortDesc: copete,
                cost: precio,
                price: precio,
                stock: stock,
                images: JSON.stringify(images),
                barcode: gtin,
                categoryId: defaultCategory.id,
                brandId: defaultBrand.id,
                sourceId: codigo,
                sourceApi: 'provider-api',
                active: stock > 0,
                specs: nroParte || modelo
                  ? JSON.stringify({ modelo: modelo || '', nro_parte: nroParte || '' })
                  : null,
              },
            });
          }
        }

        synced++;
      } catch (err: any) {
        failed++;
        errors.push(`Error en ${product.codigo || '?'}: ${err.message}`);
      }
    }

    // Actualizar log
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: failed === 0 ? 'success' : synced > 0 ? 'partial' : 'error',
        itemsSynced: synced,
        itemsFailed: failed,
        errors: errors.length > 0 ? JSON.stringify(errors.slice(0, 50)) : null,
        finishedAt: new Date(),
      },
    });

    // Guardar última fecha de sync
    await prisma.siteSetting.upsert({
      where: { key: 'sync_last_run' },
      create: { key: 'sync_last_run', value: new Date().toISOString() },
      update: { value: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      totalReceived: products.length,
      synced,
      failed,
      errors: errors.slice(0, 10),
    });

  } catch (error: any) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'error',
        errors: JSON.stringify([error.message]),
        finishedAt: new Date(),
      },
    });

    return NextResponse.json({
      error: error.message || 'Error durante la sincronización',
    }, { status: 500 });
  }
}
