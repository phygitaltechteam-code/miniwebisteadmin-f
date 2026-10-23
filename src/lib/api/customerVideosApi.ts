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
 * GET customers/videos OR superAdmin/admin/:adminId/videos
 */
export const getCustomerVideos = async (adminId?: string): Promise<CustomerVideosResponse> => {
  if (adminId) {
    const response = await api.get(`superAdmin/admin/${adminId}/videos`);
    return (response as any)?.data != null ? response.data : response;
  }
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
 * POST customers/videos OR superAdmin/admin/:adminId/videos
 * Sends { title, videoUrl }
 */
export const createCustomerVideo = async (
  item: any,
  adminId?: string
): Promise<CustomerVideosResponse> => {
  const payload = formatSingleVideoPayload(item);
  const endpoint = adminId ? `superAdmin/admin/${adminId}/videos` : 'customers/videos';
  const res = await api.post(endpoint, payload);
  return (res as any)?.data || res;
};

/**
 * PATCH customers/videos/:id OR superAdmin/admin/:adminId/videos/:id
 * Sends { title, videoUrl }
 */
export const updateCustomerVideo = async (
  id: string,
  item: any,
  adminId?: string
): Promise<CustomerVideosResponse> => {
  const payload = formatSingleVideoPayload(item);
  const endpoint = adminId
    ? `superAdmin/admin/${adminId}/videos/${id}`
    : `customers/videos/${id}`;
  try {
    const res = await api.patch(endpoint, payload);
    return (res as any)?.data || res;
  } catch (err: any) {
    if (!adminId && (err?.response?.status === 404 || err?.response?.status === 405)) {
      const patchGeneral = await api.patch('customers/videos', payload);
      return (patchGeneral as any)?.data || patchGeneral;
    }
    throw err;
  }
};

/**
 * DELETE customers/videos/:id OR superAdmin/admin/:adminId/videos/:id
 */
export const deleteCustomerVideo = async (
  id: string,
  adminId?: string
): Promise<any> => {
  if (!id || String(id).startsWith('vid-') || String(id).startsWith('temp-')) {
    return { success: true };
  }
  const endpoint = adminId
    ? `superAdmin/admin/${adminId}/videos/${id}`
    : `customers/videos/${id}`;
  try {
    const res = await api.delete(endpoint);
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
  profileOrList: any,
  adminId?: string
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
          return await updateCustomerVideo(item.id, payload, adminId);
        } catch (patchErr: any) {
          if (patchErr?.response?.status === 404 || patchErr?.response?.status === 405) {
            return await createCustomerVideo(payload, adminId);
          }
          throw patchErr;
        }
      }

      return await createCustomerVideo(payload, adminId);
    })
  );

  const last = results[results.length - 1];
  return (last as any)?.data || last || { success: true, message: 'Videos saved successfully' };
};
