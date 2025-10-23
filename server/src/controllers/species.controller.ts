import { type Request, type Response } from "express";
import fs from "fs/promises";
import { type QueryResult } from "pg";

import { client } from "../config/db.js";
import { uploadImage, destroyImage } from "../utils/uploadImage.js";

interface ISpecies {
  id: number;
  name: string;
  en_name: string;
  scientific_name: string;
  group_species?: number;
  classis?: number;
  familia?: number;
  genus?: number;
  author: string;
  image_url: string;
  characteristic: string;
  distribution?: string;
  detailed?: string;
  references_text?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Whitelisted columns for filtering/creating/updating
const ALLOWED_COLUMNS = [
  "id",
  "name",
  "en_name",
  "scientific_name",
  "group_species",
  "classis",
  "familia",
  "genus",
  "author",
  "characteristic",
  "distribution",
  "detailed",
  "references_text",
];

const TABLE = process.env.PG_SPECIES_TB;

// Controller for getting species
export const getAllSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const species: QueryResult<ISpecies> = await client.query({
      name: "fetch-all-species",
      text: `SELECT id, name, image_url, group_species FROM ${TABLE}`,
    });

    return res.status(200).json({
      message: "Get all species successfully",
      species: species.rows,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log("An error occurred while fetching species: ", error.message);
    } else {
      console.log("An error occurred while fetching species: ", error);
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const filterSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // The query below use query parameters to get species
    const whereClauses: string[] = [];
    const queryValues: string[] = [];

    let paramIndex = 1;
    for (const key in req.query) {
      if (!ALLOWED_COLUMNS.includes(key)) continue;

      const value = req.query[key];
      if (Array.isArray(value) && value.length > 1) {
        for (const subValue of value) {
          whereClauses.push(`${key} ILIKE $${paramIndex}`);
          queryValues.push(`%${subValue}%`);
          paramIndex++;
        }
      } else {
        whereClauses.push(`${key} ILIKE $${paramIndex}`);
        queryValues.push(`%${value}%`);
        paramIndex++;
      }
    }

    if (whereClauses.length === 0) {
      return res.status(400).json({ message: "Missing query parameters" });
    }

    const queryText = `SELECT id, name, image_url, group_species FROM ${TABLE} WHERE ${whereClauses.join(
      " AND "
    )}`;

    const species: QueryResult<ISpecies> = await client.query({
      text: queryText,
      values: queryValues,
    });

    return res.status(200).json({
      message: "Filter species successfully",
      species: species.rows,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log("An error occurred while filtering species: ", error.message);
    } else {
      console.log("An error occurred while filtering species: ", error);
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSpecies = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid Id" });
    }

    const species: QueryResult<ISpecies> = await client.query({
      name: "fetch-species",
      text: `SELECT * FROM ${TABLE} WHERE id = $1`,
      values: [id],
    });

    return res.status(200).json({
      message: "Get species successfully",
      species: species.rows[0],
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log("An error occurred while getting species: ", error.message);
    } else {
      console.log("An error occurred while getting species: ", error);
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Controller for managing species
export const addSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { name, author, characteristic } = req.body;
    const image = req.file;

    if (!name || !author || !characteristic || !image) {
      image && (await fs.rm(image.path));
      return res.status(400).json({
        message: "Name, author, characteristic and image fields are required",
      });
    }
    // Test the viability of the species
    const species: QueryResult<ISpecies> = await client.query({
      name: "check-species-name",
      text: `SELECT 1 FROM ${TABLE} WHERE name = $1`,
      values: [name],
    });

    if (species.rowCount !== null && species.rowCount > 0) {
      image && (await fs.rm(image.path));
      return res.status(404).json({
        message: "Species already exists, Do you want to update instead ?",
      });
    }

    // Upload image to cloudinary
    const response = await uploadImage(image.path);

    // Create query string
    const columns: string[] = [];
    let placeholders: string[] = [];
    const queryValues: string[] = [];
    let paramIndex = 1;

    for (const key in req.body) {
      if (!ALLOWED_COLUMNS.includes(key)) continue;

      const value = req.body[key];
      columns.push(key);
      queryValues.push(value);
      placeholders.push(`$${paramIndex}`);
      paramIndex++;
    }

    // add image_url
    columns.push("image_url");
    queryValues.push(response.secure_url);
    placeholders.push(`$${paramIndex}`);

    const insertQuery = `INSERT INTO ${TABLE} (${columns.join(
      ", "
    )}) VALUES (${placeholders.join(", ")}) RETURNING *`;

    const addSpeciesRes: QueryResult<ISpecies> = await client.query({
      text: insertQuery,
      values: queryValues,
    });

    return res.status(201).json({
      message: "Add species successfully",
      species: addSpeciesRes.rows[0],
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log("An error occurred while adding species: ", error.message);
    } else {
      console.log("An error occurred while adding species: ", error);
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateSpecies = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> => {
  try {
    const id = Number(req.params.id);
    
    const { name, characteristic } = req.body;
    const image = req.file;
    
    if (!Number.isInteger(id)) {
      image && (await fs.rm(image.path));
      return res.status(400).json({ message: "Invalid Id" });
    }

    if (name === "" || characteristic === "") {
      image && (await fs.rm(image.path));
      return res
        .status(400)
        .json({ message: "Name and Characteristic fields are required" });
    }

    // Test the viability of the species
    const species: QueryResult<ISpecies> = await client.query({
      name: "find-old-species",
      text: `SELECT name, image_url FROM ${TABLE} WHERE id = $1`,
      values: [id],
    });

    if (species.rowCount === 0) {
      image && (await fs.rm(image.path));
      return res.status(404).json({
        message: "Species not found",
      });
    }

    // Ensure name of species is unique
    if (name !== species.rows[0]?.name) {
      const isExistSpecies: QueryResult<ISpecies> = await client.query({
        name: "check-species-name",
        text: `SELECT 1 FROM ${TABLE} WHERE name = $1`,
        values: [name],
      });

      if (isExistSpecies.rowCount !== null && isExistSpecies.rowCount > 0) {
        image && (await fs.rm(image.path));
        return res.status(404).json({
          message: "Species name already exists",
        });
      }
    }

    // Delete old image
    const oldImageUrl: string | undefined = species.rows[0]?.image_url;
    oldImageUrl && (await destroyImage(oldImageUrl));

    let newImageUrl;
    if (image) {
      // Upload image to cloudinary
      const response = await uploadImage(image.path);
      newImageUrl = response.secure_url;
    }

    // Create query string
    let paramIndex = 1;
    const sets: Array<string> = [];
    const queryValues: Array<string | number> = [];
    for (const key in req.body) {
      if (!ALLOWED_COLUMNS.includes(key)) continue;

      const value = req.body[key];
      sets.push(`${key} = $${paramIndex}`);
      queryValues.push(value);
      paramIndex++;
    }

    if (newImageUrl) {
      sets.push(`image_url = $${paramIndex}`);
      queryValues.push(newImageUrl);
      paramIndex++;
    }

    queryValues.push(id);

    const updateQuery = `UPDATE species SET ${sets.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING *`;

    const updateSpeciesResponse: QueryResult<ISpecies> = await client.query({
      text: updateQuery,
      values: queryValues,
    });

    return res.status(200).json({
      message: "Update species successfully",
      species: updateSpeciesResponse.rows[0],
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log("An error occurred while updating species: ", error.message);
    } else {
      console.log("An error occurred while updating species: ", error);
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteSpecies = async (
  req: Request<{ id: number }>,
  res: Response
): Promise<Response> => {
  try {
    let { id } = req.params;

    id = Number(id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid Id" });
    }

    // Get old image url
    const species: QueryResult<ISpecies> = await client.query({
      name: "find-old-species-img-url",
      text: `SELECT image_url FROM ${TABLE} WHERE id = $1`,
      values: [id],
    });

    // Delete old image
    let oldImageUrl: string | undefined = species.rows[0]?.image_url;
    oldImageUrl && (await destroyImage(oldImageUrl));

    await client.query({
      name: "delete-species",
      text: `DELETE FROM ${TABLE} WHERE id = $1`,
      values: [id],
    });

    return res.status(200).json({ message: "Delete species successfully" });
  } catch (error) {
    if (error instanceof Error) {
      console.log("An error occurred while adding species: ", error.message);
    } else {
      console.log("An error occurred while adding species: ", error);
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
