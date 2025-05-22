import React, { useRef, useState } from 'react';

interface ImageData {
  url: string;
  publicId: string;
}

interface ImageUploaderProps {
  currentImage?: ImageData | null;
  onImageUploaded: (imageData: ImageData) => void;
  onImageDeleted?: () => void;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  currentImage, 
  onImageUploaded, 
  onImageDeleted,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('File is too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:5000/api/uploads', {
        method: 'POST',
        headers: {
          // Don't set Content-Type with FormData, browser will set it with boundary
          'Authorization': token || '',
          'x-auth-token': token || '',
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      onImageUploaded({
        url: data.imageUrl,
        publicId: data.publicId,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!currentImage || !onImageDeleted) return;

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/uploads/${currentImage.publicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token || '',
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      onImageDeleted();
    } catch (error) {
      console.error('Error deleting image:', error);
      setUploadError('Failed to delete image. Please try again.');
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {currentImage ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <img 
            src={currentImage.url} 
            alt="Uploaded" 
            className="w-full h-auto"
          />
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-50 transition-opacity">
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Replace
              </button>
              {onImageDeleted && (
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          
          <p className="mt-2 text-sm text-gray-600">
            {isUploading 
              ? 'Uploading...' 
              : 'Click to upload an image or drag and drop'
            }
          </p>
          <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF, or WebP up to 5MB</p>
        </div>
      )}

      {uploadError && (
        <p className="text-red-500 text-sm mt-2">{uploadError}</p>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;