const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const cachePath = path.join(__dirname, 'public', 'uploads', 'certifications', 'domain_cache.json');
  
  if (!fs.existsSync(cachePath)) {
    console.log('Cache file not found.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const entries = Object.entries(data);
  
  console.log(`Found ${entries.length} certifications in domain_cache.json. Inserting into database...`);

  let count = 0;
  for (const [filename, content] of entries) {
    let rawText = '';
    let translatedText = '';

    if (typeof content === 'string') {
      rawText = content;
    } else if (typeof content === 'object') {
      rawText = content.raw || '';
      translatedText = content.translated || '';
    }

    const name = filename.replace('.pdf', '').replace(/_/g, ' ');
    const pdfPath = `/uploads/certifications/${filename}`;

    // Simple heuristic for institution and category
    let institution = "Certiport";
    if (name.includes("Adobe") || name.includes("AC_PRO") || name.includes("Photoshop") || name.includes("Illustrator")) {
      institution = "Adobe";
    } else if (name.includes("Microsoft") || name.includes("MOS") || name.includes("AZ-") || name.includes("MB-")) {
      institution = "Microsoft";
    } else if (name.includes("Apple")) {
      institution = "Apple";
    } else if (name.includes("Unity")) {
      institution = "Unity";
    } else if (name.includes("Cisco") || name.includes("CCST")) {
      institution = "Cisco";
    } else if (name.includes("ITS")) {
      institution = "IT Specialist";
    } else if (name.includes("ACU") || name.includes("Autodesk")) {
      institution = "Autodesk";
    } else if (name.includes("Intuit")) {
      institution = "Intuit";
    }

    try {
      // Check if exists
      const existing = await prisma.certification.findFirst({ where: { name } });
      if (!existing) {
        await prisma.certification.create({
          data: {
            name,
            institution,
            category: "Certification",
            description: `Certification for ${name}`,
            pdfPath,
            rawText,
            translatedText
          }
        });
        count++;
      }
    } catch (e) {
      console.error(`Failed to insert ${name}:`, e.message);
    }
  }

  console.log(`Successfully inserted ${count} new certifications into the database!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
