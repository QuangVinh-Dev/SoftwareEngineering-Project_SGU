// src/utils/poiImages.js
import { FALLBACK } from './constants';

// Load tất cả ảnh trong src/assets/POI/**/*.{png,jpg,jpeg,webp,avif}
const allImages = import.meta.glob(
  '../assets/POI/**/*.{png,jpg,jpeg,webp,avif}',
  { eager: true, import: 'default' }
);

/**
 * Lấy mảng ảnh của 1 POI theo id.
 * Tự động sort theo số: poi1_1, poi1_2, ... poi1_10
 * Fallback về [FALLBACK] nếu không có ảnh.
 */
export function getPoiImages(poiId) {
  const prefix = `../assets/POI/poi${poiId}/poi${poiId}_`;

  const imgs = Object.entries(allImages)
    .filter(([path]) => path.startsWith(prefix))
    .sort(([a], [b]) => {
      const na = parseInt(a.match(/_(\d+)\./)?.[1] || 0, 10);
      const nb = parseInt(b.match(/_(\d+)\./)?.[1] || 0, 10);
      return na - nb;
    })
    .map(([, url]) => url);

  return imgs.length ? imgs : [FALLBACK];
}