import { apiClient } from '../client'

export type UploadPurpose =
  | 'AVATAR'
  | 'COURSE_COVER'
  | 'LESSON_MEDIA'
  | 'SPEAKING_RESPONSE'

export interface RequestUploadPayload {
  filename: string
  mimeType: string
  sizeBytes: number
  purpose: UploadPurpose
}

export interface PresignedUploadResponse {
  uploadUrl: string
  publicUrl: string
  key: string
  expiresInSeconds: number
}

export const uploadsApi = {
  presignedUrl: async (payload: RequestUploadPayload): Promise<PresignedUploadResponse> => {
    const { data } = await apiClient.post<PresignedUploadResponse>(
      '/uploads/presigned-url',
      payload,
    )
    return data
  },
  delete: async (publicUrl: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<{ success: boolean }>('/uploads/delete', { publicUrl })
    return data
  },
  /** Upload a File to the presigned URL, then return the publicUrl. */
  uploadFile: async (file: File, purpose: UploadPurpose): Promise<string> => {
    const presigned = await uploadsApi.presignedUrl({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      purpose,
    })
    const res = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    return presigned.publicUrl
  },
}
