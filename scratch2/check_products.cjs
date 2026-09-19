const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const checkList = [
  "Desoxidante - Removedor De Oxido Oxioff",
  "ESMALTE SINTETICO",
  "ESMALTE SINTETICO SATINADO",
  "Canatech Membrana Líquida Impermeabilizante Blanco",
  "PINTURA TECHOS Y PAREDES INTERIORES",
  "Pinceles punta plana para pintura acrilica",
  "PINTURA EN AEROSOL PENNSYLVANIA",
  "PINTURA INTERIOR-EXTERIOR",
  "PINTURA LATEX EXTERIOR RETRACUA",
  "PINTURA LATEX INTERIOR RETRACUA",
  "Pintura De Piso Y Fachadas Pennsylvania",
  "Pintura En Aerosol Negro Satinado 400 Ml Secur",
  "Fungicida Arcal Mata Hongos y Algas",
  "Impermeabilizante Membrana Liquida Canacryl Plus - Pennsylvania",
  "Jimo Cupim Incoloro X Protector De Madera Para Polilla",
  "Membrana Liquida Impermeabilizante 4-20 Kg ESE KALISAY",
  "Membrana Liquida KALIGOMA 4-20 Kg ESE KALISAY",
  "Repuesto Para Rodillo Alta Densidad 5-7-11-16 cm",
  "Repuesto Para Rodillo Pelo Corto 6-10-15 cm Velour",
  "Rodillo Antigoteo Rodex Pelo largo",
  "Tacos Deco Tox 6-8-10-12",
  "Adhesivo De Contacto Novo Tubo-200-500-ml-1-4 lt (cemento)",
  "Cola Vinílica Cola Carpintero Pennsylvania",
  "Repuesto de Rodillo Rodex rojo y gris FOAM 18-25 cm pelo Largo",
  "Rodillo De Espuma Alta Densidad Rodex",
  "Rodillo Pelo Corto 6-10-15 cm Velour",
  "Rodillo Rodex rojo y gris Foam 18-25 cm Pelo Largo",
  "ESCALERAS DE ALUMINIO-SECUR",
  "Wd-40 Aceite Lubricante Multiusos Aerosol"
];

async function main() {
  for (const name of checkList) {
    const p = await prisma.product.findFirst({
      where: { name: { contains: name.trim().split('-')[0].trim(), mode: 'insensitive' } },
      include: { variants: true }
    });
    if (p) {
      console.log(`✅ [${p.variants.length > 0 ? 'VARIABLE' : 'SIMPLE'}] ${p.name} (Variantes: ${p.variants.length})`);
    } else {
      console.log(`❌ NO ENCONTRADO: ${name}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
