import { cloudflareContext, type ContextProvider } from '~/context';

/**
 * Service for handling file uploads to Cloudflare R2
 */
export class StorageService {
  private r2: R2Bucket;

  constructor(context: ContextProvider) {
    const ctx = context.get(cloudflareContext);
    this.r2 = ctx.cloudflare.env.R2;
  }

  /**
   * Uploads a file to R2 storage
   * @param file The file to upload
   * @param key The key to store the file under (e.g., 'images/profile/user-123.jpg')
   * @returns The URL of the uploaded file
   */
  async uploadFile(file: File, key: string): Promise<R2Object | null> {
    return await this.r2.put(key, file);
  }

  /**
   * Deletes a file from R2 storage
   * @param key The key of the file to delete
   */
  async deleteFile(key: string): Promise<void> {
    await this.r2.delete(key);
  }

  async fetchFile(key: string): Promise<R2ObjectBody | null> {
    return await this.r2.get(key);
  }

  /**
   * Generates a unique key for a file
   * @param fileName The original file name
   * @param prefix An optional prefix for the key (e.g., 'listings/')
   * @returns A unique key for the file
   */
  generateKey(fileName: string, prefix: string = ''): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const extension = fileName.split('.').pop();
    
    return `${prefix}${timestamp}-${randomString}.${extension}`;
  }
}