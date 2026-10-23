import { api } from '@/utils/axios';
import { ProfileData, YoutubeVideo } from '@/types/profile';

/**
 * Backend exact video payload shape:
 * {
 *   "title": "Video title",
 *   "videoUrl": "https://www.youtube.com/watch?v=..."
 * }
 */
export interface BackendVideoItem {
  id?: string;
  _id?: string;
  title: string;
  videoUrl: string;
  url?: string;
  [key: string]: any;
}

export interface CustomerVideosResponse {
  statusCode?: number;
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: any;
  video?: any;
  videos?: any;
  youtubeVideos?: any;
  errors?: any;
  [key: string]: any;
}

/**
 * Format single video item with exact backend fields:
 * - 'title'
 * - 'videoUrl'
 */
export const formatSingleVideoPayload = (item: any): { title: string; videoUrl: string } => {
  const videoUrl = (item.videoUrl || item.url || item.link || item.youtubeUrl || '').trim();
  const title = (item.title || item.name || '').trim();
  return {
    title,
    videoUrl,
  };
};

/**
 * Parse backend response into frontend YoutubeVideo[]
 */
export const parseCustomerVideosResponse = (res: any): YoutubeVideo[] => {
  const root = (res as any)?.data != null ? (res as any).data : res;
  let rawList: any[] = [];

  if (Array.isArray(root)) {
    rawList = root;
  } else if (root && typeof root === 'object') {
    if (Array.isArray(root.videos)) rawList = root.videos;
    else if (Array.isArray(root.video)) rawList = root.video;
    else if (Array.isArray(root.youtubeVideos)) rawList = root.youtubeVideos;
    else if (Array.isArray(root.data)) rawList = root.data;
  } else if (Array.isArray((res as any)?.videos)) {
    rawList = (res as any).videos;
  }

  return rawList.map((item: any, idx: number) => {
    if (typeof item === 'string') {
      return {
        id: `vid-${idx}`,
        title: `Video ${idx + 1}`,
        url: item,
        videoUrl: item,
        link: item,
      };
    }

    const actualUrl = item.videoUrl || item.url || item.embedUrl || item.link || item.youtubeUrl || '';
    const embedUrl = item.embedUrl || (item.videoId ? `https://www.youtube.com/embed/${item.videoId}` : '');
    const thumbnailUrl = item.thumbnailUrl || (item.videoId ? `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg` : '');

    return {
      id: item.id || item._id || `vid-${idx}-${Date.now()}`,
      title: item.title || item.name || `Video ${idx + 1}`,
      url: actualUrl,
      videoUrl: actualUrl,
      link: actualUrl,
      embedUrl,
      thumbnailUrl,
      videoId: item.videoId || '',
    };
  });
};

/**
 * GET customers/videos
 */
export const getCustomerVideos = async (): Promise<CustomerVideosResponse> => {
  try {
    const response = await api.get('customers/videos');
    return (response as any)?.data != null ? response.data : response;
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      try {
        const singularRes = await api.get('customers/video');
        return (singularRes as any)?.data != null ? singularRes.data : singularRes;
      } catch {
        const fallback = await api.get('customers/info');
        return (fallback as any)?.data != null ? fallback.data : fallback;
      }
    }
    throw error;
  }
};

/**
 * POST customers/videos
 * Sends { title, videoUrl }
 */
export const createCustomerVideo = async (item: any): Promise<CustomerVideosResponse> => {
  const payload = formatSingleVideoPayload(item);
  const res = await api.post('customers/videos', payload);
  return (res as any)?.data || res;
};

/**
 * PATCH customers/videos/:id
 * Sends { title, videoUrl }
 */
export const updateCustomerVideo = async (
  id: string,
  item: any
): Promise<CustomerVideosResponse> => {
  const payload = formatSingleVideoPayload(item);
  try {
    const res = await api.patch(`customers/videos/${id}`, payload);
    return (res as any)?.data || res;
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.response?.status === 405) {
      const patchGeneral = await api.patch('customers/videos', payload);
      return (patchGeneral as any)?.data || patchGeneral;
    }
    throw err;
  }
};

/**
 * DELETE customers/videos/:id
 */
export const deleteCustomerVideo = async (id: string): Promise<any> => {
  if (!id || String(id).startsWith('vid-') || String(id).startsWith('temp-')) {
    return { success: true };
  }
  try {
    const res = await api.delete(`customers/videos/${id}`);
    return (res as any)?.data || res;
  } catch (err) {
    console.warn(`Could not delete video ${id}:`, err);
    return null;
  }
};

/**
 * Save or update videos adhering to backend validation schema:
 * {
 *   "title": "Video title",
 *   "videoUrl": "https://www.youtube.com/watch?v=..."
 * }
 */
export const saveOrUpdateCustomerVideos = async (
  profileOrList: any
): Promise<CustomerVideosResponse> => {
  const list = Array.isArray(profileOrList)
    ? profileOrList
    : (profileOrList.youtubeVideos || profileOrList.videos || profileOrList.video || []);

  if (list.length === 0) {
    return { success: true, message: 'No YouTube videos to save' };
  }

  const results = await Promise.all(
    list.map(async (item: any) => {
      const payload = formatSingleVideoPayload(item);
      const hasRealId = item.id && !String(item.id).startsWith('vid-') && !String(item.id).startsWith('temp-');

      if (hasRealId) {
        try {
          const patchRes = await api.patch(`customers/videos/${item.id}`, payload);
          return (patchRes as any)?.data || patchRes;
        } catch (patchErr: any) {
          if (patchErr?.response?.status === 404 || patchErr?.response?.status === 405) {
            const postRes = await api.post('customers/videos', payload);
            return (postRes as any)?.data || postRes;
          }
          throw patchErr;
        }
      }

      const res = await api.post('customers/videos', payload);
      return (res as any)?.data || res;
    })
  );

  const last = results[results.length - 1];
  return (last as any)?.data || last || { success: true, message: 'Videos saved successfully' };
};
