import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import multer from "multer";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

//for small 5mb images enough, otherwise streaming would be better
export async function handleCloudUpload(file: Express.Multer.File):Promise<UploadApiResponse> {

    const imageStringBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    
      const res = await cloudinary.uploader.upload(imageStringBase64, {
        resource_type: "auto",
      });
      return res;
}

export async function deleteCloudAsset(url: string): Promise<void> {
  
  const publicId = url
    .split("/")
    .slice(-1)[0]
    .split(".")[0];

  await cloudinary.uploader.destroy(publicId, { resource_type: "image" })
  
}

export const upload = multer({ storage:multer.memoryStorage() });