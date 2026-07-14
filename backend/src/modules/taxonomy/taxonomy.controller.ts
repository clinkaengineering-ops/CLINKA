import { Request, Response } from "express";
import {
  getDisciplines,
  getSkills,
  getServiceAreas,
  getLanguages,
} from "./taxonomy.service";

export async function getDisciplinesHandler(req: Request, res: Response) {
  const disciplines = await getDisciplines();
  res.json(disciplines);
}

export async function getSkillsHandler(req: Request, res: Response) {
  const q = req.query.q as string;
  const skills = await getSkills(q);
  res.json(skills);
}

export async function getServiceAreasHandler(req: Request, res: Response) {
  const q = req.query.q as string;
  const type = req.query.type as string;
  const serviceAreas = await getServiceAreas(q, type);
  res.json(serviceAreas);
}

export async function getLanguagesHandler(req: Request, res: Response) {
  const languages = await getLanguages();
  res.json(languages);
}
