import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

// এই file অন্য module থেকে import হওয়ার সময় top-level-এ চলে,
// আর সেটা server.ts-এর dotenv.config()-এর আগেই ঘটতে পারে।
// তাই এখানেও env load করে নিই, যাতে নিচের key গুলো পাওয়া যায়।
dotenv.config();

// ১. Cloudinary account-এর credential বসাই (মান আসে .env থেকে)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ২. multer-এর storage — ছবি সরাসরি Cloudinary-তে যাবে,
//    "mistiri" folder-এ, শুধু jpg/png/webp format অনুমোদিত
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "mistiri",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  } as { folder: string; allowed_formats: string[] },
});

// ৩. upload middleware — একটা মাত্র file, field-এর নাম "image"।
//    upload হওয়ার পর req.file.path-এ Cloudinary-র URL পাওয়া যাবে।
export const upload = multer({ storage });

export default cloudinary;
