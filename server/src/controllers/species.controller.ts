import { type Request, type Response } from "express";
import fs from "fs/promises";
import { type QueryResult } from "pg";

import { client } from "../config/db.js";
import { uploadImage, destroyImage } from "../utils/uploadImage.js";

interface ISpecies {
  name: string;
  group_species?: string;
  classis?: string;
  familia?: string;
  genus?: string;
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
  "name",
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

const table = process.env.PG_SPECIES_TB;

// Controller for getting species
export const getAllSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const species: QueryResult<ISpecies> = await client.query({
      name: "fetch-all-species",
      text: `SELECT * FROM ${table}`,
    });

    return res.status(200).json({
      message: "Get all species successfully",
      species: species.rows,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(
        "❌ An error occurred while fetching species: ",
        error.message
      );
    } else {
      console.log("❌ An error occurred while fetching species: ", error);
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
          whereClauses.push(`${key} LIKE $${paramIndex}`);
          queryValues.push(`%${subValue}%`);
          paramIndex++;
        }
      } else {
        whereClauses.push(`${key} LIKE $${paramIndex}`);
        queryValues.push(`%${value}%`);
        paramIndex++;
      }
    }

    if (whereClauses.length === 0) {
      return res.status(400).json({ message: "Missing query parameters" });
    }

    const queryText = `SELECT * FROM ${table} WHERE ${whereClauses.join(
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
      console.log(
        "❌ An error occurred while filtering species: ",
        error.message
      );
    } else {
      console.log("❌ An error occurred while filtering species: ", error);
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const nameOfSpecies = req.params.name;

    const species: QueryResult<ISpecies> = await client.query({
      name: "fetch-species",
      text: `SELECT * FROM ${table} WHERE name = $1`,
      values: [nameOfSpecies],
    });

    return res.status(200).json({
      message: "Get species successfully",
      species: species.rows[0],
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(
        "❌ An error occurred while getting species: ",
        error.message
      );
    } else {
      console.log("❌ An error occurred while getting species: ", error);
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
      return res.status(400).json({
        message: "Name, author, characteristic and image fields are required",
      });
    }
    // Test the viability of the species
    const species: QueryResult<ISpecies> = await client.query({
      name: "check-species",
      text: `SELECT 1 FROM ${table} WHERE name = $1`,
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

    const insertQuery = `INSERT INTO ${table} (${columns.join(
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
      console.log("❌ An error occurred while adding species: ", error.message);
    } else {
      console.log("❌ An error occurred while adding species: ", error);
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const nameOfSpecies = req.params.name;
    const { name, characteristic } = req.body;
    const image = req.file;

    if (name === "" || characteristic === "") {
      image && (await fs.rm(image.path));
      return res
        .status(400)
        .json({ message: "Name and Characteristic fields are required" });
    }

    // ensure name of species is unique
    if (name !== nameOfSpecies) {
      const isExistSpecies: QueryResult<ISpecies> = await client.query({
        name: "find-species",
        text: `SELECT image_url FROM ${table} WHERE name = $1`,
        values: [name],
      });

      if (isExistSpecies.rowCount !== null && isExistSpecies.rowCount > 0) {
        image && (await fs.rm(image.path));
        return res.status(404).json({
          message: "Species name already exists",
        });
      }
    }

    // test the viability of the species
    const species: QueryResult<ISpecies> = await client.query({
      name: "find-species",
      text: `SELECT image_url FROM ${table} WHERE name = $1`,
      values: [nameOfSpecies],
    });

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
    const queryValues: Array<string> = [];
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

    queryValues.push(nameOfSpecies!);

    const updateQuery = `UPDATE species SET ${sets.join(
      ", "
    )} WHERE name = $${paramIndex} RETURNING *`;

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
      console.log(
        "❌ An error occurred while updating species: ",
        error.message
      );
    } else {
      console.log("❌ An error occurred while updating species: ", error);
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteSpecies = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const nameOfSpecies = req.params.name;

    // test the viability of the species
    const species: QueryResult<ISpecies> = await client.query({
      name: "find-species",
      text: `SELECT image_url FROM ${table} WHERE name = $1`,
      values: [nameOfSpecies],
    });

    // Delete old image
    let oldImageUrl: string | undefined = species.rows[0]?.image_url;
    oldImageUrl && (await destroyImage(oldImageUrl));

    await client.query({
      name: "delete-species",
      text: `DELETE FROM ${table} WHERE name = $1`,
      values: [nameOfSpecies],
    });

    return res.status(200).json({ message: "Delete species successfully" });
  } catch (error) {
    if (error instanceof Error) {
      console.log("❌ An error occurred while adding species: ", error.message);
    } else {
      console.log("❌ An error occurred while adding species: ", error);
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
