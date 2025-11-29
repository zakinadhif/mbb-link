import { data } from "react-router";
import { StorageService } from "~/services/storage.server";
import type { Route } from "./+types/api.upload";

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return data({ error: "No file provided" }, { status: 400 });
  }

  const storageService = new StorageService(context);
  const key = storageService.generateKey(file.name, "uploads/");
  await storageService.uploadFile(file, key);

  return { url: `/media/${key}` };
}
