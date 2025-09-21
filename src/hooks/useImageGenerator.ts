import { useState } from 'react';

interface ImageGenerationOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
}

interface GenerateImageParams {
  type: 'text' | 'math' | 'diagram';
  content: string;
  options?: ImageGenerationOptions;
}

export function useImageGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async ({ type, content, options }: GenerateImageParams): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          content,
          options
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Image generation failed');
      }

      return data.imageUrl;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generate a simple URL for GET-based image generation
  const generateImageUrl = (text: string, type: 'text' | 'diagram' = 'text', width = 400, height = 300): string => {
    const params = new URLSearchParams({
      text,
      type,
      width: width.toString(),
      height: height.toString()
    });
    return `/api/generate-image?${params.toString()}`;
  };

  return {
    generateImage,
    generateImageUrl,
    loading,
    error
  };
}