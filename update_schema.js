const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Add new Enums after WithdrawalRequestStatus
const newEnums = `
enum AvailabilityStatus {
  AVAILABLE_NOW
  OPEN_TO_WORK
  AVAILABLE_NEXT_WEEK
  AVAILABLE_NEXT_MONTH
  UNAVAILABLE
}

enum PortfolioProjectStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum PortfolioFileType {
  IMAGE
  PDF
  LINK
}

enum ProfileVisibility {
  PUBLIC
  PRIVATE
  HIDDEN
}

enum VerificationLevel {
  BASIC
  COMPLETE
  VERIFIED
  TOP_ENGINEER
}
`;
schema = schema.replace('enum WithdrawalRequestStatus {', newEnums + '\nenum WithdrawalRequestStatus {');

// 2. Replace PortfolioItem with PortfolioProject
const portfolioProjectReplacement = `model PortfolioProject {
  id             Int                    @id @default(autoincrement())
  engineerId     Int
  title          String?
  description    String
  coverImageUrl  String?                @map("imageUrl") // Map old imageUrl
  disciplineId   Int?
  status         PortfolioProjectStatus @default(PUBLISHED)
  year           Int?
  clientName     String?
  country        String?
  createdAt      DateTime               @default(now())

  engineer       EngineerProfile        @relation(fields: [engineerId], references: [id])
  discipline     Discipline?            @relation(fields: [disciplineId], references: [id])
  skills         PortfolioProjectSkill[]
  files          PortfolioFile[]

  @@map("PortfolioItem")
}`;

schema = schema.replace(/model PortfolioItem \{[\s\S]*?\n\}/, portfolioProjectReplacement);

// 3. Update EngineerProfile
const engineerProfileReplacement = `model EngineerProfile {
  id                 Int                @id @default(autoincrement())
  userId             Int                @unique
  specialty          EngineerSpecialty
  nationality        String?
  bio                String?
  coverImageUrl      String?
  verificationStatus VerificationStatus @default(PENDING)
  nationalId         String? /// Egyptian national ID (14 digits) — required for Paymob payouts

  collegeIdUrl     String?
  certificateUrl   String?
  syndicateCardUrl String?

  averageRating Float    @default(0)
  totalReviews  Int      @default(0)
  createdAt     DateTime @default(now())

  // --- New Professional Profile Extensions ---
  slug                    String?             @unique
  coverBannerUrl          String?
  professionalHeadline    String?
  currentPosition         String?
  currentCompany          String?
  about                   String?
  yearsOfExperience       Int?
  hourlyRateUSD           Decimal?            @db.Decimal(18, 2)
  startingProjectPriceUSD Decimal?            @db.Decimal(18, 2)
  availabilityStatus      AvailabilityStatus?
  expectedStartDate       DateTime?
  acceptsInvitations      Boolean             @default(true)
  acceptsDirectMessages   Boolean             @default(true)
  acceptsConsultations    Boolean             @default(true)
  linkedinUrl             String?
  websiteUrl              String?
  profileCompletion       Int                 @default(0)
  verificationLevel       VerificationLevel   @default(BASIC)
  profileVisibility       ProfileVisibility   @default(PUBLIC)

  user             User      @relation(fields: [userId], references: [id])
  engineerPayments Payment[] @relation("EngineerPayments")

  portfolio      PortfolioProject[]
  bids           Bid[]
  reviews        Review[]

  specializations ProfileSpecialization[]
  skills          ProfileSkill[]
  serviceAreas    ProfileServiceArea[]
  languages       ProfileLanguage[]
  certifications  ProfileCertification[]
  analytics       ProfileAnalytics?
}`;

schema = schema.replace(/model EngineerProfile \{[\s\S]*?\n\}/, engineerProfileReplacement);

// 4. Add new relational models at the end
const newModels = `

// ─── NEW RELATIONAL MODELS ───────────────────────────────────────────────────

model Discipline {
  id        Int              @id @default(autoincrement())
  name      String           @unique
  icon      String?
  sortOrder Int              @default(0)
  
  specializations  Specialization[]
  portfolioProjects PortfolioProject[]
}

model Specialization {
  id           Int        @id @default(autoincrement())
  disciplineId Int
  name         String
  sortOrder    Int        @default(0)

  discipline   Discipline @relation(fields: [disciplineId], references: [id], onDelete: Cascade)
  profiles     ProfileSpecialization[]
}

model SkillCategory {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  icon      String?
  sortOrder Int      @default(0)
  
  skills    Skill[]
}

model Skill {
  id          Int            @id @default(autoincrement())
  name        String         @unique
  categoryId  Int?
  isOfficial  Boolean        @default(false)
  popularity  Int            @default(0)

  category    SkillCategory? @relation(fields: [categoryId], references: [id])
  profiles    ProfileSkill[]
  portfolios  PortfolioProjectSkill[]
}

model ServiceArea {
  id                 Int      @id @default(autoincrement())
  type               String   // "COUNTRY", "CITY", "REMOTE"
  name               String
  
  profiles           ProfileServiceArea[]

  @@unique([type, name])
}

model Language {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  code      String?  @unique
  
  profiles  ProfileLanguage[]
}

model Certification {
  id                  Int      @id @default(autoincrement())
  name                String
  issuingOrganization String?
  isOfficial          Boolean  @default(false)

  profiles            ProfileCertification[]
}

// ─── JOIN TABLES ─────────────────────────────────────────────────────────────

model ProfileSpecialization {
  engineerId       Int
  specializationId Int

  engineer       EngineerProfile @relation(fields: [engineerId], references: [id], onDelete: Cascade)
  specialization Specialization  @relation(fields: [specializationId], references: [id], onDelete: Cascade)

  @@id([engineerId, specializationId])
}

model ProfileSkill {
  engineerId Int
  skillId    Int

  engineer   EngineerProfile @relation(fields: [engineerId], references: [id], onDelete: Cascade)
  skill      Skill           @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([engineerId, skillId])
}

model ProfileServiceArea {
  engineerId    Int
  serviceAreaId Int

  engineer    EngineerProfile @relation(fields: [engineerId], references: [id], onDelete: Cascade)
  serviceArea ServiceArea     @relation(fields: [serviceAreaId], references: [id], onDelete: Cascade)

  @@id([engineerId, serviceAreaId])
}

model ProfileLanguage {
  engineerId  Int
  languageId  Int
  proficiency String? // e.g., "Native", "Fluent", "Intermediate"

  engineer EngineerProfile @relation(fields: [engineerId], references: [id], onDelete: Cascade)
  language Language        @relation(fields: [languageId], references: [id], onDelete: Cascade)

  @@id([engineerId, languageId])
}

model ProfileCertification {
  id              Int      @id @default(autoincrement())
  engineerId      Int
  certificationId Int
  year            Int?

  engineer      EngineerProfile @relation(fields: [engineerId], references: [id], onDelete: Cascade)
  certification Certification   @relation(fields: [certificationId], references: [id], onDelete: Cascade)
}

// ─── EXTENDED PORTFOLIO ──────────────────────────────────────────────────────

model PortfolioProjectSkill {
  portfolioProjectId Int
  skillId            Int

  project PortfolioProject @relation(fields: [portfolioProjectId], references: [id], onDelete: Cascade)
  skill   Skill            @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([portfolioProjectId, skillId])
}

model PortfolioFile {
  id                 Int               @id @default(autoincrement())
  portfolioProjectId Int
  fileUrl            String
  fileType           PortfolioFileType @default(IMAGE)
  title              String?
  sortOrder          Int               @default(0)

  project PortfolioProject @relation(fields: [portfolioProjectId], references: [id], onDelete: Cascade)
}

model ProfileAnalytics {
  engineerId        Int @id
  views             Int @default(0)
  searchImpressions Int @default(0)
  invitations       Int @default(0)
  clicks            Int @default(0)

  engineer EngineerProfile @relation(fields: [engineerId], references: [id], onDelete: Cascade)
}
`;

schema += newModels;
fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Schema updated successfully.');
