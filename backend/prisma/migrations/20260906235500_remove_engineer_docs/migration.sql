/*
  Warnings:

  - You are about to drop the column `certificateUrl` on the `EngineerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `collegeIdUrl` on the `EngineerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `syndicateCardUrl` on the `EngineerProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EngineerProfile" DROP COLUMN "certificateUrl",
DROP COLUMN "collegeIdUrl",
DROP COLUMN "syndicateCardUrl";
