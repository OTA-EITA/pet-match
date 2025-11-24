'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { UploadedImage } from './ImageUpload'
import { petsApi } from '@/lib/api'
import { API_CONFIG } from '@/lib/config'

interface ImageGalleryProps {
  petId: string
  images: UploadedImage[]
  onImageDeleted: (imageId: string) => void
  onError: (error: string) => void
  editable?: boolean
}

export default function ImageGallery({ 
  petId, 
  images, 
  onImageDeleted, 
  onError, 
  editable = false 
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (imageId: string) => {
    if (!confirm('この画像を削除しますか？')) {
      return
    }

    setDeleting(imageId)

    try {
      console.log('Deleting image:', imageId, 'for pet:', petId);
      
      // Use petsApi instead of direct fetch
      await petsApi.images.deletePetImage(petId, imageId);
      
      console.log('Delete successful');
      onImageDeleted(imageId)
    } catch (error) {
      console.error('Delete error:', error)
      onError(error instanceof Error ? error.message : '削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p>画像がまだアップロードされていません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedImage(image)}
          >
            <Image
              src={API_CONFIG.buildThumbnailUrl(image.thumbnail_url)}
              alt={image.file_name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            
            {/* Main image badge */}
            {image.is_main && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                メイン
              </div>
            )}

            {/* Delete button for editable mode */}
            {editable && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(image.id)
                }}
                disabled={deleting === image.id}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {deleting === image.id ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
          </div>
        ))}
      </div>

      {/* Modal for full-size image */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <div className="relative">
              <Image
                src={API_CONFIG.buildImageUrl(selectedImage.original_url)}
                alt={selectedImage.file_name}
                width={selectedImage.width}
                height={selectedImage.height}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>

            {/* Image info */}
            <div className="p-4 bg-white">
              <h3 className="font-semibold text-lg mb-2">{selectedImage.file_name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">サイズ:</span> {selectedImage.width} × {selectedImage.height}px
                </div>
                <div>
                  <span className="font-medium">ファイルサイズ:</span> {formatFileSize(selectedImage.file_size)}
                </div>
                <div>
                  <span className="font-medium">形式:</span> {selectedImage.mime_type}
                </div>
                <div>
                  <span className="font-medium">アップロード日:</span> {new Date(selectedImage.uploaded_at).toLocaleDateString('ja-JP')}
                </div>
              </div>
              {selectedImage.is_main && (
                <div className="mt-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    メイン画像
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
