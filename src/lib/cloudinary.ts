import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET || 'your-api-secret',
  secure: true
})

export interface UploadResult {
  public_id: string
  url: string
  secure_url: string
  format: string
  resource_type: string
  bytes: number
  width?: number
  height?: number
}

export class CloudinaryService {
  /**
   * Upload a file to Cloudinary
   */
  static async uploadFile(
    file: File,
    folder: string = 'general',
    resourceType: 'image' | 'raw' | 'video' = 'raw'
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false
      }

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(new Error(`Upload failed: ${error.message}`))
          } else if (result) {
            resolve({
              public_id: result.public_id,
              url: result.url,
              secure_url: result.secure_url,
              format: result.format,
              resource_type: result.resource_type,
              bytes: result.bytes,
              width: result.width,
              height: result.height
            })
          } else {
            reject(new Error('Upload failed: No result returned'))
          }
        }
      ).end(file)
    })
  }

  /**
   * Upload KYC document
   */
  static async uploadKYCDocument(
    file: File,
    userId: string,
    documentType: string
  ): Promise<UploadResult> {
    const folder = `kyc-documents/${userId}`
    const publicId = `${documentType}-${Date.now()}`
    
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        public_id: publicId,
        resource_type: 'raw' as const,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        access_mode: 'authenticated' // Only accessible with authentication
      }

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(new Error(`KYC document upload failed: ${error.message}`))
          } else if (result) {
            resolve({
              public_id: result.public_id,
              url: result.url,
              secure_url: result.secure_url,
              format: result.format,
              resource_type: result.resource_type,
              bytes: result.bytes
            })
          } else {
            reject(new Error('KYC document upload failed: No result returned'))
          }
        }
      ).end(file)
    })
  }

  /**
   * Upload profile image
   */
  static async uploadProfileImage(
    file: File,
    userId: string
  ): Promise<UploadResult> {
    const folder = `profile-images/${userId}`
    const publicId = `profile-${Date.now()}`
    
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        public_id: publicId,
        resource_type: 'image' as const,
        use_filename: true,
        unique_filename: true,
        overwrite: true,
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      }

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(new Error(`Profile image upload failed: ${error.message}`))
          } else if (result) {
            resolve({
              public_id: result.public_id,
              url: result.url,
              secure_url: result.secure_url,
              format: result.format,
              resource_type: result.resource_type,
              bytes: result.bytes,
              width: result.width,
              height: result.height
            })
          } else {
            reject(new Error('Profile image upload failed: No result returned'))
          }
        }
      ).end(file)
    })
  }

  /**
   * Delete a file from Cloudinary
   */
  static async deleteFile(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(new Error(`Delete failed: ${error.message}`))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Get file info
   */
  static async getFileInfo(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.api.resource(publicId, (error, result) => {
        if (error) {
          reject(new Error(`Get file info failed: ${error.message}`))
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Generate authenticated URL for private files
   */
  static getAuthenticatedUrl(publicId: string, expiresIn: number = 3600): string {
    return cloudinary.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn
    })
  }

  /**
   * Generate optimized image URL
   */
  static getOptimizedImageUrl(
    publicId: string,
    options: {
      width?: number
      height?: number
      quality?: number
      crop?: string
      gravity?: string
    } = {}
  ): string {
    const transformations = []

    if (options.width || options.height) {
      transformations.push({
        width: options.width,
        height: options.height,
        crop: options.crop || 'fill',
        gravity: options.gravity || 'auto'
      })
    }

    if (options.quality) {
      transformations.push({
        quality: options.quality,
        fetch_format: 'auto'
      })
    }

    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true
    })
  }
}

export default CloudinaryService
