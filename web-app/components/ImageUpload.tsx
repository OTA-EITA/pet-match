'use client'

import React, { useState, useCallback, useRef } from 'react'

export interface UploadedImage {
  id: string
  pet_id: string
  file_name: string
  original_url: string
  thumbnail_url: string
  file_size: number
  mime_type: string
  width: number
  height: number
  is_main: boolean
  uploaded_at: string
}

interface ImageUploadProps {
  petId: string
  onImageUploaded: (image: UploadedImage) => void
  onError: (error: string) => void
  disabled?: boolean
}

export default function ImageUpload({ petId, onImageUploaded, onError, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('画像ファイルを選択してください')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError('ファイルサイズは10MB以下にしてください')
      return
    }

    // Validate file format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      onError('JPEG、JPG、PNG形式のファイルのみ対応しています')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('is_main', 'false')

      const response = await fetch(`http://localhost:18081/pets/${petId}/images`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData, let browser set it
          'Authorization': 'Bearer DEV_TOKEN', // Fixed: Use DEV_TOKEN instead of mock-jwt-token
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'アップロードに失敗しました')
      }

      const result = await response.json()
      onImageUploaded(result.image)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      onError(error instanceof Error ? error.message : 'アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }, [petId, onImageUploaded, onError])

  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={disabled || uploading ? undefined : openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileInput}
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">アップロード中...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium">クリックして画像を選択</p>
              <p>またはドラッグ&ドロップ</p>
            </div>
            <p className="text-xs text-gray-500">
              JPEG, PNG形式 (最大10MB)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
