import db from '../src/config/db';

async function main() {
  console.log("Seeding Taxonomy Data...");

  // 1. Disciplines & Specializations
  const civil = await db.discipline.upsert({
    where: { name: 'Civil Engineering' },
    update: {},
    create: {
      name: 'Civil Engineering',
      sortOrder: 1,
      specializations: {
        create: [
          { name: 'Structural Design', sortOrder: 1 },
          { name: 'Concrete Structures', sortOrder: 2 },
          { name: 'Steel Structures', sortOrder: 3 },
          { name: 'Bridge Engineering', sortOrder: 4 },
        ]
      }
    }
  });

  const architecture = await db.discipline.upsert({
    where: { name: 'Architecture' },
    update: {},
    create: {
      name: 'Architecture',
      sortOrder: 2,
      specializations: {
        create: [
          { name: 'Architectural Design', sortOrder: 1 },
          { name: 'Urban Planning', sortOrder: 2 },
          { name: 'Interior Design', sortOrder: 3 },
          { name: 'Landscape Architecture', sortOrder: 4 },
        ]
      }
    }
  });

  const mep = await db.discipline.upsert({
    where: { name: 'MEP Engineering' },
    update: {},
    create: {
      name: 'MEP Engineering',
      sortOrder: 3,
      specializations: {
        create: [
          { name: 'Mechanical Engineering', sortOrder: 1 },
          { name: 'Electrical Engineering', sortOrder: 2 },
          { name: 'Plumbing', sortOrder: 3 },
          { name: 'HVAC', sortOrder: 4 },
          { name: 'Fire Protection', sortOrder: 5 },
        ]
      }
    }
  });

  const projectManagement = await db.discipline.upsert({
    where: { name: 'Project Management' },
    update: {},
    create: {
      name: 'Project Management',
      sortOrder: 4,
      specializations: {
        create: [
          { name: 'Quantity Surveying', sortOrder: 1 },
          { name: 'Project Controls', sortOrder: 2 },
          { name: 'Cost Estimation', sortOrder: 3 },
        ]
      }
    }
  });

  // 2. Skill Categories & Skills
  const softwareCat = await db.skillCategory.upsert({
    where: { name: 'Software' },
    update: {},
    create: { name: 'Software', sortOrder: 1 }
  });

  const softwareSkills = [
    'AutoCAD', 'Revit', 'ETABS', 'SAFE', 'SAP2000', 'Civil 3D', 'Tekla', 'Primavera', 'MS Project', 'Navisworks', 'Bluebeam', 'STAAD.Pro'
  ];

  for (const s of softwareSkills) {
    await db.skill.upsert({
      where: { name: s },
      update: { categoryId: softwareCat.id, isOfficial: true },
      create: { name: s, categoryId: softwareCat.id, isOfficial: true, popularity: 100 }
    });
  }

  const designCat = await db.skillCategory.upsert({
    where: { name: 'Design & Analysis' },
    update: {},
    create: { name: 'Design & Analysis', sortOrder: 2 }
  });

  const designSkills = [
    'Structural Design', 'BIM', 'Seismic Analysis', 'Wind Analysis', 'BOQ Preparation'
  ];

  for (const s of designSkills) {
    await db.skill.upsert({
      where: { name: s },
      update: { categoryId: designCat.id, isOfficial: true },
      create: { name: s, categoryId: designCat.id, isOfficial: true, popularity: 90 }
    });
  }

  // 3. Languages
  const languages = [
    { name: 'English', code: 'en' },
    { name: 'Arabic', code: 'ar' },
    { name: 'French', code: 'fr' },
    { name: 'German', code: 'de' },
    { name: 'Spanish', code: 'es' },
  ];

  for (const l of languages) {
    await db.language.upsert({
      where: { name: l.name },
      update: { code: l.code },
      create: { name: l.name, code: l.code }
    });
  }

  // 4. Service Areas
  await db.serviceArea.upsert({
    where: { type_name: { type: 'REMOTE', name: 'Remote Worldwide' } },
    update: {},
    create: { type: 'REMOTE', name: 'Remote Worldwide' }
  });

  await db.serviceArea.upsert({
    where: { type_name: { type: 'COUNTRY', name: 'Egypt' } },
    update: {},
    create: { type: 'COUNTRY', name: 'Egypt' }
  });

  await db.serviceArea.upsert({
    where: { type_name: { type: 'COUNTRY', name: 'Saudi Arabia' } },
    update: {},
    create: { type: 'COUNTRY', name: 'Saudi Arabia' }
  });

  await db.serviceArea.upsert({
    where: { type_name: { type: 'COUNTRY', name: 'United Arab Emirates' } },
    update: {},
    create: { type: 'COUNTRY', name: 'United Arab Emirates' }
  });

  console.log("Taxonomy Data Seeded!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  // process.exit(0);
});
