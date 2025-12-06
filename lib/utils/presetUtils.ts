import { type Preset } from '@/hooks/usePresets';

/**
 * Group presets by folder
 */
export function groupPresetsByFolder(presets: Preset[]): Map<string | null, Preset[]> {
  const grouped = new Map<string | null, Preset[]>();
  
  for (const preset of presets) {
    const folder = preset.folder ?? null;
    if (!grouped.has(folder)) {
      grouped.set(folder, []);
    }
    grouped.get(folder)?.push(preset);
  }
  
  return grouped;
}

/**
 * Group presets by genre
 */
export function groupPresetsByGenre(presets: Preset[]): Map<string | null, Preset[]> {
  const grouped = new Map<string | null, Preset[]>();
  
  for (const preset of presets) {
    const genre = preset.genre ?? null;
    if (!grouped.has(genre)) {
      grouped.set(genre, []);
    }
    grouped.get(genre)?.push(preset);
  }
  
  return grouped;
}

/**
 * Get unique folders from presets
 */
export function getUniqueFolders(presets: Preset[]): string[] {
  const folders = new Set<string>();
  for (const preset of presets) {
    if (preset.folder) {
      folders.add(preset.folder);
    }
  }
  return Array.from(folders).sort();
}

/**
 * Get unique genres from presets
 */
export function getUniqueGenres(presets: Preset[]): string[] {
  const genres = new Set<string>();
  for (const preset of presets) {
    if (preset.genre) {
      genres.add(preset.genre);
    }
  }
  return Array.from(genres).sort();
}

/**
 * Filter presets based on search query
 */
export function filterPresetsBySearch(presets: Preset[], query: string): Preset[] {
  if (!query.trim()) {
    return presets;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  return presets.filter(preset => {
    const nameMatch = preset.name.toLowerCase().includes(lowerQuery);
    const folderMatch = preset.folder?.toLowerCase().includes(lowerQuery) ?? false;
    const genreMatch = preset.genre?.toLowerCase().includes(lowerQuery) ?? false;
    
    return nameMatch || folderMatch || genreMatch;
  });
}

/**
 * Filter presets by folder
 */
export function filterPresetsByFolder(presets: Preset[], folder: string | null): Preset[] {
  if (folder === null || folder === '') {
    return presets;
  }
  
  return presets.filter(preset => preset.folder === folder);
}

/**
 * Filter presets by genre
 */
export function filterPresetsByGenre(presets: Preset[], genre: string | null): Preset[] {
  if (genre === null || genre === '') {
    return presets;
  }
  
  return presets.filter(preset => preset.genre === genre);
}

/**
 * Filter presets by public status
 */
export function filterPresetsByPublic(presets: Preset[], isPublic: boolean | null): Preset[] {
  if (isPublic === null) {
    return presets;
  }
  
  return presets.filter(preset => preset.isPublic === isPublic);
}

/**
 * Sort presets
 */
export type SortField = 'name' | 'createdAt' | 'folder' | 'genre';
export type SortOrder = 'asc' | 'desc';

export function sortPresets(
  presets: Preset[],
  sortBy: SortField,
  sortOrder: SortOrder = 'asc'
): Preset[] {
  const sorted = [...presets];
  
  sorted.sort((a, b) => {
    let aValue: string | number | null;
    let bValue: string | number | null;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'folder':
        aValue = a.folder?.toLowerCase() ?? '';
        bValue = b.folder?.toLowerCase() ?? '';
        break;
      case 'genre':
        aValue = a.genre?.toLowerCase() ?? '';
        bValue = b.genre?.toLowerCase() ?? '';
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  return sorted;
}

/**
 * Format date to Indonesian format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return new Intl.DateTimeFormat('id-ID', options).format(date);
}

/**
 * Format date to relative time (e.g., "2 hari yang lalu")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'Baru saja';
  }
  if (diffMins < 60) {
    return `${diffMins} menit yang lalu`;
  }
  if (diffHours < 24) {
    return `${diffHours} jam yang lalu`;
  }
  if (diffDays < 7) {
    return `${diffDays} hari yang lalu`;
  }
  
  return formatDate(dateString);
}

/**
 * Get next preset in list
 */
export function getNextPreset(
  presets: Preset[],
  currentPresetId: string | null
): Preset | null {
  if (presets.length === 0) {
    return null;
  }
  
  if (!currentPresetId) {
    return presets[0] ?? null;
  }
  
  const currentIndex = presets.findIndex(p => p.id === currentPresetId);
  if (currentIndex === -1) {
    return presets[0] ?? null;
  }
  
  const nextIndex = (currentIndex + 1) % presets.length;
  return presets[nextIndex] ?? null;
}

/**
 * Get previous preset in list
 */
export function getPreviousPreset(
  presets: Preset[],
  currentPresetId: string | null
): Preset | null {
  if (presets.length === 0) {
    return null;
  }
  
  if (!currentPresetId) {
    return presets[presets.length - 1] ?? null;
  }
  
  const currentIndex = presets.findIndex(p => p.id === currentPresetId);
  if (currentIndex === -1) {
    return presets[presets.length - 1] ?? null;
  }
  
  const prevIndex = currentIndex === 0 ? presets.length - 1 : currentIndex - 1;
  return presets[prevIndex] ?? null;
}


