import type { Request, Response } from "express";

// Controller for getting species
export const getAllSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return res.send("Get all species feature");
};

export const filterSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return res.send("Filter species feature");
};

export const getSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return res.send("Get more information about species feature");
};

// Controller for managing species
export const addSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return res.send("Add species feature");
};

export const updateSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return res.send("Update species feature");
};

export const deleteSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  return res.send("Delete species feature");
};
