// seed-pages.js - Crea páginas de contenido por defecto
// Ejecutar: node seed-pages.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const defaultPages = [
  {
    slug: 'contacto',
    title: 'Contacto',
    showInFooter: true,
    content: `<h2>Contactate con nosotros</h2>
<p>Estamos disponibles para responder todas tus consultas. No dudes en comunicarte con nosotros por cualquiera de los medios disponibles.</p>

<h3>Teléfonos</h3>
<ul>
  <li>📞 +598 2XXX XXXX (Oficina)</li>
  <li>📱 +598 9XX XXX XXX (WhatsApp)</li>
</ul>

<h3>Email</h3>
<ul>
  <li>📧 ventas@ferreterialavalleja.com</li>
  <li>📧 soporte@ferreterialavalleja.com</li>
</ul>

<h3>Horario de atención</h3>
<p>Lunes a Viernes: 9:00 - 18:00 hs<br>Sábados: 9:00 - 13:00 hs</p>

<h3>Ubicación</h3>
<p>Montevideo, Uruguay</p>`,
  },
  {
    slug: 'terminos-y-condiciones',
    title: 'Términos y Condiciones',
    showInFooter: true,
    content: `<h2>Términos y Condiciones de Uso</h2>
<p>Al utilizar nuestro sitio web y realizar compras en ImpoTech, usted acepta los siguientes términos y condiciones.</p>

<h3>1. Aceptación de los Términos</h3>
<p>El uso de este sitio web implica la aceptación plena de los presentes términos y condiciones. Si no está de acuerdo con estos términos, le recomendamos no utilizar nuestros servicios.</p>

<h3>2. Información de Productos</h3>
<p>Nos esforzamos por mantener la información de los productos actualizada y precisa. Sin embargo, nos reservamos el derecho de modificar precios, descripciones y disponibilidad sin previo aviso.</p>

<h3>3. Precios</h3>
<p>Todos los precios están expresados en pesos uruguayos (UYU) e incluyen IVA según corresponda. Los precios pueden variar sin previo aviso.</p>

<h3>4. Disponibilidad de Stock</h3>
<p>Los productos están sujetos a disponibilidad de stock. En caso de no contar con el producto solicitado, nos comunicaremos con usted para informarle.</p>

<h3>5. Modificaciones</h3>
<p>ImpoTech se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigencia al momento de su publicación en el sitio.</p>`,
  },
  {
    slug: 'proceso-de-compra',
    title: 'Proceso de Compra',
    showInFooter: true,
    content: `<h2>¿Cómo comprar en ImpoTech?</h2>
<p>Comprar en nuestra tienda es fácil y seguro. Seguí estos pasos para realizar tu pedido.</p>

<h3>Paso 1 - Elegí tu producto</h3>
<p>Navegá por nuestro catálogo y encontrá el producto que estás buscando. Podés filtrar por categoría, marca o utilizar el buscador.</p>

<h3>Paso 2 - Agregá al carrito</h3>
<p>Hacé clic en "Agregar al carrito". Podés seguir comprando o ir directamente al checkout.</p>

<h3>Paso 3 - Revisá tu pedido</h3>
<p>En el carrito verificá los productos, cantidades y precios antes de continuar.</p>

<h3>Paso 4 - Completá tus datos</h3>
<p>Ingresá tu información de contacto y dirección de entrega.</p>

<h3>Paso 5 - Elegí tu forma de pago</h3>
<p>Seleccioná entre nuestras opciones disponibles: transferencia bancaria, efectivo, tarjeta u otros medios.</p>

<h3>Paso 6 - Confirmá tu pedido</h3>
<p>Recibirás un email con la confirmación de tu pedido y los datos para el pago.</p>

<h3>Paso 7 - Acreditación y envío</h3>
<p>Una vez confirmado el pago, preparamos tu pedido y lo enviamos. Te notificaremos cuando esté en camino.</p>`,
  },
  {
    slug: 'garantia',
    title: 'Políticas de Garantía',
    showInFooter: true,
    content: `<h2>Políticas de Garantía</h2>
<p>En ImpoTech queremos que tengas la mejor experiencia con tus compras. Por eso contamos con políticas de garantía claras y transparentes.</p>

<h3>Garantía de productos</h3>
<p>Todos nuestros productos cuentan con garantía del fabricante. El período de garantía varía según el producto y la marca.</p>

<h3>¿Qué cubre la garantía?</h3>
<ul>
  <li>Defectos de fabricación</li>
  <li>Fallas técnicas no causadas por el usuario</li>
  <li>Problemas de funcionamiento bajo uso normal</li>
</ul>

<h3>¿Qué NO cubre la garantía?</h3>
<ul>
  <li>Daños por caídas, golpes o líquidos</li>
  <li>Daños causados por uso inadecuado</li>
  <li>Modificaciones no autorizadas</li>
  <li>Desgaste normal por uso</li>
</ul>

<h3>Proceso de garantía</h3>
<p>Para hacer efectiva la garantía, contáctanos con tu número de pedido y una descripción del problema. Te indicaremos los pasos a seguir.</p>

<h3>Tiempo de resolución</h3>
<p>El tiempo de resolución depende del fabricante y el tipo de problema. Nos comprometemos a mantenerte informado durante todo el proceso.</p>`,
  },
  {
    slug: 'politicas-de-ventas',
    title: 'Políticas de Ventas',
    showInFooter: false,
    content: `<h2>Políticas de Ventas</h2>

<h3>Métodos de pago</h3>
<p>Aceptamos los siguientes métodos de pago:</p>
<ul>
  <li>Transferencia bancaria</li>
  <li>Efectivo (retiro en local)</li>
  <li>Tarjetas de crédito y débito</li>
  <li>Mercado Pago</li>
</ul>

<h3>Envíos</h3>
<p>Realizamos envíos a todo Uruguay. El costo y tiempo de entrega varía según la ubicación. Para Montevideo el plazo habitual es de 24-48 horas hábiles.</p>

<h3>Retiro en local</h3>
<p>También podés retirar tu pedido en nuestra oficina sin costo adicional. Te avisaremos cuando esté listo para retirar.</p>

<h3>Cambios y devoluciones</h3>
<p>Aceptamos cambios y devoluciones dentro de los 7 días hábiles de recibido el producto, siempre que se encuentre en perfecto estado y con su embalaje original.</p>

<h3>Facturación</h3>
<p>Emitimos factura por todas nuestras ventas. Si necesitás factura a empresa, indicalo al momento de realizar el pedido.</p>`,
  },
  {
    slug: 'empresa',
    title: 'Sobre Nosotros',
    showInFooter: false,
    content: `<h2>¿Quiénes somos?</h2>
<p>ImpoTech es una empresa uruguaya dedicada a la importación y comercialización de tecnología. Contamos con años de experiencia ofreciendo productos de calidad al mejor precio del mercado.</p>

<h3>Nuestra misión</h3>
<p>Acercar la mejor tecnología a precios accesibles, con la atención personalizada que cada cliente merece.</p>

<h3>Nuestros valores</h3>
<ul>
  <li><strong>Transparencia</strong>: Precios claros y sin sorpresas</li>
  <li><strong>Calidad</strong>: Productos originales con garantía</li>
  <li><strong>Servicio</strong>: Atención personalizada antes y después de la compra</li>
  <li><strong>Confianza</strong>: Años de trayectoria en el mercado</li>
</ul>

<h3>¿Por qué elegirnos?</h3>
<p>Trabajamos directamente con importadores y distribuidores oficiales, lo que nos permite ofrecer los mejores precios del mercado con la garantía de productos originales.</p>`,
  },
  {
    slug: 'ubicacion',
    title: 'Ubicación',
    showInFooter: false,
    content: `<h2>¿Dónde estamos?</h2>
<p>Nuestras oficinas se encuentran en Montevideo, Uruguay.</p>

<h3>Dirección</h3>
<p>📍 Calle Ejemplo 1234, Montevideo, Uruguay</p>

<h3>Cómo llegar</h3>
<p>Estamos a pocos metros de la principal avenida. Podés llegar en transporte público o en auto. Contamos con estacionamiento cercano.</p>

<h3>Horarios</h3>
<p>
  Lunes a Viernes: 9:00 - 18:00 hs<br>
  Sábados: 9:00 - 13:00 hs<br>
  Domingos: Cerrado
</p>

<h3>Contacto</h3>
<p>
  📞 +598 2XXX XXXX<br>
  📱 +598 9XX XXX XXX (WhatsApp)<br>
  📧 info@ferreterialavalleja.com
</p>`,
  },
]

async function main() {
  console.log('Creando páginas por defecto...')

  for (const page of defaultPages) {
    const existing = await prisma.page.findUnique({ where: { slug: page.slug } })
    if (existing) {
      console.log(`  - Ya existe: ${page.slug} (omitida)`)
      continue
    }

    await prisma.page.create({
      data: {
        slug: page.slug,
        title: page.title,
        content: page.content,
        published: true,
        showInFooter: page.showInFooter,
      },
    })
    console.log(`  + Creada: ${page.slug}`)
  }

  console.log('\nListo! Páginas creadas.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
