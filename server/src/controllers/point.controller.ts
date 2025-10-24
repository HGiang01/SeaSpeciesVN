import { type Request, type Response } from "express";
import { type QueryResult } from "pg";

import { client } from "../lib/db.js";

interface IPoint {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

const TABLE = process.env.PG_POINTS_TB;

const isValidLatLng = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

export const getPoints = async (
  req: Request<{ speciesId: string }>,
  res: Response
): Promise<Response> => {
  try {
    const speciesId = Number(req.params.speciesId);

    if (!Number.isInteger(speciesId)) {
      return res.status(400).json({ message: "Invalid SpeciesId" });
    }

    const points: QueryResult<IPoint> = await client.query({
      name: "get-all-points",
      text: `SELECT id, lat, lng FROM ${TABLE} WHERE species_id = $1`,
      values: [speciesId],
    });

    return res.status(200).json({
      message: "Get all species distribution points successfully",
      points: points.rows,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(
        "❌ An error occurred while getting species distribution points: ",
        error.message
      );
    } else {
      console.log(
        "❌ An error occurred while getting species distribution points: ",
        error
      );
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createPoint = async (
  req: Request<
    { speciesId: string },
    unknown,
    { lat: number | string; lng: number | string }
  >,
  res: Response
): Promise<Response> => {
  try {
    const speciesId = Number(req.params.speciesId);
    const latNum = Number(req.body?.lat);
    const lngNum = Number(req.body?.lng);

    if (!Number.isInteger(speciesId)) {
      return res.status(400).json({ message: "Invalid SpeciesId" });
    }

    if (!isValidLatLng(latNum, lngNum)) {
      return res.status(400).json({ message: "Invalid lat/lng" });
    }

    const point: QueryResult<IPoint> = await client.query({
      name: "create-points",
      text: `INSERT INTO ${TABLE} (species_id, lat, lng) VALUES ($1, $2, $3) RETURNING *`,
      values: [speciesId, latNum, lngNum],
    });

    return res.status(201).json({
      message: "Create species distribution points successfully",
      point: point.rows[0],
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(
        "❌ An error occurred while creating species distribution points: ",
        error.message
      );
    } else {
      console.log(
        "❌ An error occurred while creating species distribution points: ",
        error
      );
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePoint = async (
  req: Request<
    { id: string },
    unknown,
    { lat: number | string; lng: number | string }
  >,
  res: Response
): Promise<Response> => {
  try {
    const idNum = Number(req.params.id);
    const latNum = Number(req.body?.lat);
    const lngNum = Number(req.body?.lng);

    if (!Number.isInteger(idNum)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    if (!isValidLatLng(latNum, lngNum)) {
      return res.status(400).json({ message: "Invalid lat/lng" });
    }

    const point: QueryResult<IPoint> = await client.query({
      name: "update-points",
      text: `UPDATE ${TABLE} SET lat = $1, lng = $2 WHERE id = $3 RETURNING *`,
      values: [latNum, lngNum, idNum],
    });

    if (point.rowCount === 0) {
      return res.status(404).json({ message: "Point not found" });
    }

    return res.status(200).json({
      message: "Update species distribution points successfully",
      point: point.rows[0],
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(
        "❌ An error occurred while updating species distribution points: ",
        error.message
      );
    } else {
      console.log(
        "❌ An error occurred while updating species distribution points: ",
        error
      );
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deletePoint = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const point: QueryResult<IPoint> = await client.query({
      name: "delete-points",
      text: `DELETE FROM ${TABLE} WHERE id = $1`,
      values: [idNum],
    });

    if (point.rowCount === 0) {
      return res.status(404).json({ message: "Point not found" });
    }

    return res.status(200).json({
      message: "Delete species distribution points successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(
        "❌ An error occurred while deleting species distribution points: ",
        error.message
      );
    } else {
      console.log(
        "❌ An error occurred while deleting species distribution points: ",
        error
      );
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
