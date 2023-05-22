const multer = require('multer');
const fs = require('fs');
const { nanoid } = require('nanoid');
const path = require('path');
const asyncHandler = require('./async.middleware');
const errorResponse = require('../utils/error.utils');
const cloudinary = require('cloudinary').v2;
const env = require('dotenv');
env.config();
const logger = require('../utils/winston');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const addImage = (folderPath) =>
  asyncHandler((req, res, next) => {
    const storage = multer.diskStorage({
      destination: (req, file, callback) => {
        callback(null, './' + folderPath);
      },
      filename: (req, file, callback) => {
        const filenameglobal = nanoid() + file.originalname;
        callback(null, filenameglobal);
      },
    });
    const upload = multer({
      storage,
      fileFilter: function (req, file, callback) {
        const ext = path.extname(file.originalname);
        if (
          ext !== '.png' &&
          ext !== '.jpg' &&
          ext !== '.gif' &&
          ext !== '.jpeg'
        ) {
          return next(new errorResponse('Only images are allowed', 400));
          // return callback(new Error('Only images are allowed'));
        }
        callback(null, true);
      },
      limits: {
        fileSize: 1024 * 1024,
      },
    }).any('file');
    upload(req, res, async (err) => {
      if (err) {
        logger.error('Error adding image user: ', err);
        return next(new errorResponse(err.message, 400));
      }
      const results = req.files.map((file) => {
        return {
          mediaName: file.filename,
          origMediaName: file.originalname,
          mediaSource: folderPath + file.filename,
        };
      });
      res.imgres = results;
      next();
    });
  });

const uploadToCloudinary = (folderPath) =>
  asyncHandler(async (req, res, next) => {
    const uploadFile = req.files.file;

    const { brandId, categoryId, modelId } = req.params;

    const uploadedResponse = await cloudinary.uploader.upload(
      uploadFile.tempFilePath,
      {
        public_id: brandId || categoryId || modelId,
        folder: folderPath,
        overwrite: true,
        unique_filename: false,
        invalidate: true,
      }
    );

    fs.unlink(uploadFile.tempFilePath, (err) => {
      if (err) return next(new errorResponse('Error uploading file:', 500));
    });
    res.imgres = uploadedResponse;
    next();
  });

const uploadToUser = (folderPath) =>
  asyncHandler(async (req, res, next) => {
    const uploadFile = req.files.file;
    const uploadedResponse = await cloudinary.uploader.upload(
      uploadFile.tempFilePath,
      {
        public_id: req.user.id.toString(),
        folder: folderPath,
        overwrite: true,
        unique_filename: false,
        invalidate: true,
      }
    );

    fs.unlink(uploadFile.tempFilePath, (err) => {
      if (err) return next(new errorResponse('Error uploading file:', 500));
    });
    res.imgres = uploadedResponse;
    next();
  });

const uploadProductImages = (folderPath) =>
  asyncHandler(async (req, res, next) => {
    const uploadFile = req.files.file;
    const { productId } = req.params;
    let uploadedResponse = [];
    if (!uploadFile.length) {
      uploadedResponse = [
        await cloudinary.uploader.upload(uploadFile.tempFilePath, {
          public_id: `${productId}0`,
          folder: folderPath,
          overwrite: true,
          unique_filename: false,
          invalidate: true,
        }),
      ];
      fs.unlink(uploadFile.tempFilePath, (err) => {
        if (err) return next(new errorResponse('Error uploading file:', 500));
      });
    } else {
      for (let i = 0; i < uploadFile.length; i++) {
        const singleResponse = await cloudinary.uploader.upload(
          uploadFile[i].tempFilePath,
          {
            public_id: `${productId}${i}`,
            folder: folderPath,
            overwrite: true,
            unique_filename: false,
            invalidate: true,
          }
        );
        fs.unlink(uploadFile[i].tempFilePath, (err) => {
          if (err) return next(new errorResponse('Error uploading file:', 500));
        });
        uploadedResponse.push(singleResponse);
      }
    }
    res.imgres = uploadedResponse;
    next();
  });

module.exports = {
  addImage,
  uploadToCloudinary,
  uploadToUser,
  uploadProductImages,
};
