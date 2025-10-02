// Shared type definitions to prevent circular dependencies between diagram-related modules

export interface UserDiagram {
  id: string;
  imageUrl: string;
  filename: string;
  fileSize: number;
  isApproved: boolean;
  isPreferred: boolean;
  description?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface DiagramUploadResult {
  success: boolean;
  data?: UserDiagram;
  error?: string;
}

export interface DiagramListResponse {
  success: boolean;
  data?: UserDiagram[];
  error?: string;
}

export interface DiagramUploadOptions {
  questionId: string;
  userId?: string;
  file: File;
  description?: string;
  mode?: 'add' | 'replace';
}

export interface DiagramServiceInterface {
  getUserDiagrams(questionId: string): Promise<UserDiagram[]>;
  getPreferredDiagram(questionId: string): Promise<UserDiagram | null>;
  uploadDiagram(options: DiagramUploadOptions): Promise<DiagramUploadResult>;
}