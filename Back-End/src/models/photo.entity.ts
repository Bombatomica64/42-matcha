export interface Photo {
  id: string;
  user_uuid: string;
  filename: string;
  original_filename?: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  is_primary: boolean;
  display_order: number;
  created_at: Date;
}

export type CreatePhotoData = Omit<Photo, 'id' | 'created_at'>;
export type UpdatePhotoData = Partial<Omit<Photo, 'id' | 'user_uuid' | 'created_at'>>;
