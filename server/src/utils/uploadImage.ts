import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import fs from "fs/promises";
import path from "path";

import cloudinary from "../config/cloudinary.js";

const uploadConfig: UploadApiOptions = {
  use_filename: true,
  folder: process.env.CLOUDINARY_FOLDER || "ocean-species",
  overwrite: true,
  resource_type: "image",
};

export const uploadImage = async (path: string): Promise<UploadApiResponse> => {
  try {
    const response = await cloudinary.uploader.upload(path, uploadConfig);
    console.log("🌅 Upload image successfully");
    return response;
  } catch (error) {
    throw error;
  } finally {
    await fs.rm(path);
  }
};
export const destroyImage = async (url: string): Promise<UploadApiResponse> => {
  try {
    // Extract public_id
    const imageExt = ["jpeg", "png", "jpg", "webp"];
    const startIndexOfPublicId = url.indexOf("ocean-species");
    let endIndexOfPublicId;

    for (let ext of imageExt) {
      if (url.includes(ext)) {
        endIndexOfPublicId = url.indexOf(ext) - 1;
        break;
      }
    }

    const public_id = url.slice(startIndexOfPublicId, endIndexOfPublicId);

    const response = await cloudinary.uploader.destroy(public_id, uploadConfig);
    console.log("🌅 Delete image successfully");
    return response;
  } catch (error) {
    throw error;
  }
};
