import { z } from "zod";

const fileSizeLimit = 2 * 1024 * 1024; // 2MB

export const IMAGE_SCHEMA = z
  .instanceof(File)
  .refine(
    (file) =>
      [
        "image/png",
        "image/jpeg",
        "image/jpg",
      ].includes(file.type),
    { message: "Invalid image file type" }
  )
  .refine(
    (file) => 
      [
        "png",
        "jpeg",
        "jpg"
      ].includes(file.name.split('.').pop() || ""),
    { message: "Invalid image file extension" }
  )
  .refine((file) => file.size <= fileSizeLimit, {
    message: "File size should not exceed 2MB",
  });