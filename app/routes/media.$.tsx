import { data } from "react-router";
import { StorageService } from "~/services/storage.server";
import type { Route } from "./+types/media.$";
import { cloudflareContext } from "~/context";

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const storageService = new StorageService(context);
  const ctx = context.get(cloudflareContext);

  const key = params["*"];

  const parts = key?.split("/") ?? [];
  const variant = parts.at(-1);
  const fileKey = parts.slice(0, -1).join("/");

  if (ctx.cloudflare.env.APP_ENV === "development" && variant === "original") {
    const file = await storageService.fetchFile(fileKey as string);

    if (!file) {
      return data({ error: "File not found" }, { status: 404 });
    }

    return new Response(file.body, {
      headers: {
        "Content-Type": file.httpMetadata?.contentType || "application/octet-stream",
        "Content-Length": file.size.toString(),
        "ETag": file.httpEtag,
        "Last-Modified": new Date(file.uploaded).toUTCString(),
        "Cache-Control": "public, max-age=31536000",
      }
    });
  }

  // if (!variant || !Object.keys(imageVariants).includes(variant)) {
  //   return data({ error: "Invalid variant" }, { status: 400 });
  // }

  const file = await storageService.fetchFile(fileKey as string);

  if (!file) {
    return data({ error: "File not found" }, { status: 404 });
  }

  return new Response(file.body, {
    headers: {
      "Content-Type": file.httpMetadata?.contentType || "application/octet-stream",
      "Content-Length": file.size.toString(),
      "ETag": file.httpEtag,
      "Last-Modified": new Date(file.uploaded).toUTCString(),
      "Cache-Control": "public, max-age=31536000",
    }
  });

  // todo(zndf):
  // hide r2 from public access,
  // use cloudflare r2 binding to request the file directly to r2
  // then use cloudflare image binding to transform the image into the needed variant
  // then return the transformed image
  //
  // this abstraction will allow easier switching when we decide
  // to move fully to paid cloudflare image service which hosts the image in
  // imagedelivery.net domain
  //
  // though still, media will all be served from <worker-address>/media/<fileKey>/<variant>
  // ex. mbb.link/media/1234567890/thumb
  //
  // migration plan:
  // 1. move all media from r2 to cloudflare dedicated image storage
  // 2. create url rewrite rule that overrides this endpoint
  //    (effectively replacing /media/<IMAGE_ID>/<VARIANT> endpoint with
  //    /cdn-cgi/imagedelivery/<ACCOUNT_HASH>/<IMAGE_ID>/<VARIANT> seamlessly)
  // 3. fully deprecate and remove this endpoint

  // const accept = request.headers.get("Accept") ?? "";
  // let format: "image/avif" | "image/webp" | "image/jpeg" = "image/jpeg";
  // if (/image\/avif/.test(accept)) {
  //   format = "image/avif";
  // } else if (/image\/webp/.test(accept)) {
  //   format = "image/webp";
  // }
  
  // const transformedImage = await ctx.cloudflare.env.IMAGES
  //   .input(file.body)
  //   .transform(imageVariants[variant as keyof typeof imageVariants])
  //   .output({ format });

  // return transformedImage.response(); 
}