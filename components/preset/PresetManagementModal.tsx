"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Search, Filter, ChevronLeft, ChevronRight, Edit, Trash2, Folder, Music, Globe, Lock, CheckSquare, Square, ChevronUp, ChevronDown } from 'lucide-react';
import { usePresets, type Preset } from '@/hooks/usePresets';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { getUniqueFolders, getUniqueGenres, formatDate, type SortField, type SortOrder } from '@/lib/utils/presetUtils';
import { fetchWithCSRF } from '@/lib/apiClient';
import { useDebounce } from '@/hooks/useDebounce';

interface PresetManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset?: (preset: Preset) => void;
  onEditPreset?: (preset: Preset) => void;
}

export function PresetManagementModal({ isOpen, onClose, onSelectPreset, onEditPreset }: PresetManagementModalProps) {
  const { user } = useAuth();
  const { presets, isLoading, error, bulkDeletePresets, renameFolder, deleteFolder, mutate } = usePresets();
  
  // State untuk search dan filter
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce 300ms
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedPublic, setSelectedPublic] = useState<boolean | null>(null);
  
  // State untuk sorting
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // State untuk bulk selection
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State untuk folder management
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);

  // Filter presets berdasarkan user (hanya preset milik user)
  const myPresets = useMemo(() => {
    return presets.filter(p => p.userId === user?.id);
  }, [presets, user?.id]);

  // Filter dan sort presets
  const filteredAndSortedPresets = useMemo(() => {
    let filtered = [...myPresets];

    // Search filter (gunakan debounced query untuk mengurangi re-render)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.folder?.toLowerCase().includes(query) ||
        p.genre?.toLowerCase().includes(query)
      );
    }

    // Folder filter
    if (selectedFolder !== null) {
      if (selectedFolder === '__null__') {
        filtered = filtered.filter(p => p.folder === null);
      } else {
        filtered = filtered.filter(p => p.folder === selectedFolder);
      }
    }

    // Genre filter
    if (selectedGenre !== null) {
      filtered = filtered.filter(p => p.genre === selectedGenre);
    }

    // Public filter
    if (selectedPublic !== null) {
      filtered = filtered.filter(p => p.isPublic === selectedPublic);
    }

    // Sort
    filtered.sort((a, b) => {
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

    return filtered;
  }, [myPresets, debouncedSearchQuery, selectedFolder, selectedGenre, selectedPublic, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPresets.length / itemsPerPage);
  const paginatedPresets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedPresets.slice(start, end);
  }, [filteredAndSortedPresets, currentPage, itemsPerPage]);

  // Get unique folders and genres
  const uniqueFolders = useMemo(() => getUniqueFolders(myPresets), [myPresets]);
  const uniqueGenres = useMemo(() => getUniqueGenres(myPresets), [myPresets]);

  // Handle sort
  const handleSort = useCallback((field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  }, [sortBy, sortOrder]);

  // Handle bulk selection
  const togglePresetSelection = useCallback((presetId: string) => {
    setSelectedPresetIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(presetId)) {
        newSet.delete(presetId);
      } else {
        newSet.add(presetId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedPresetIds.size === paginatedPresets.length) {
      setSelectedPresetIds(new Set());
    } else {
      setSelectedPresetIds(new Set(paginatedPresets.map(p => p.id)));
    }
  }, [selectedPresetIds.size, paginatedPresets]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedPresetIds.size === 0) return;

    const confirmMessage = `Apakah Anda yakin ingin menghapus ${selectedPresetIds.size} preset? Tindakan ini tidak dapat dibatalkan.`;
    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      await bulkDeletePresets(Array.from(selectedPresetIds));
      setSelectedPresetIds(new Set());
      setCurrentPage(1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus preset');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedPresetIds, bulkDeletePresets]);

  // Handle folder rename
  const handleRenameFolder = useCallback(async (oldFolder: string) => {
    const newName = prompt(`Ubah nama folder "${oldFolder}" menjadi:`, oldFolder);
    if (!newName || newName.trim() === oldFolder) return;

    try {
      await renameFolder(oldFolder, newName.trim());
      setRenamingFolder(null);
      setNewFolderName('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah nama folder');
    }
  }, [renameFolder]);

  // Handle folder delete
  const handleDeleteFolder = useCallback(async (folder: string) => {
    const action = confirm(
      `Hapus folder "${folder}"?\n\n` +
      `Klik OK untuk menghapus semua preset di folder.\n` +
      `Klik Cancel untuk memindahkan preset ke "No Folder".`
    );

    try {
      await deleteFolder(folder, action ? 'delete' : 'move');
      setDeletingFolder(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus folder');
    }
  }, [deleteFolder]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedFolder(null);
    setSelectedGenre(null);
    setSelectedPublic(null);
    setCurrentPage(1);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h2 className="text-2xl font-semibold text-zinc-100">Kelola Preset</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-zinc-700 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari preset berdasarkan nama, folder, atau genre..."
              className="w-full bg-zinc-700 text-zinc-100 px-10 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedFolder ?? ''}
              onChange={(e) => {
                setSelectedFolder(e.target.value || null);
                setCurrentPage(1);
              }}
              className="bg-zinc-700 text-zinc-100 px-3 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Semua Folder</option>
              <option value="__null__">Tanpa Folder</option>
              {uniqueFolders.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>

            <select
              value={selectedGenre ?? ''}
              onChange={(e) => {
                setSelectedGenre(e.target.value || null);
                setCurrentPage(1);
              }}
              className="bg-zinc-700 text-zinc-100 px-3 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Semua Genre</option>
              {uniqueGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            <select
              value={selectedPublic === null ? '' : selectedPublic ? 'true' : 'false'}
              onChange={(e) => {
                setSelectedPublic(e.target.value === '' ? null : e.target.value === 'true');
                setCurrentPage(1);
              }}
              className="bg-zinc-700 text-zinc-100 px-3 py-2 rounded-lg border border-zinc-600 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Semua Status</option>
              <option value="true">Public</option>
              <option value="false">Private</option>
            </select>

            <button
              onClick={resetFilters}
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg border border-zinc-600 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPresetIds.size > 0 && (
          <div className="px-6 py-3 bg-cyan-900/20 border-b border-cyan-700/50 flex items-center justify-between">
            <span className="text-cyan-400">
              {selectedPresetIds.size} preset dipilih
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Hapus {selectedPresetIds.size} Preset
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">Error: {error}</p>
            </div>
          ) : paginatedPresets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">Tidak ada preset yang ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left p-3">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100"
                      >
                        {selectedPresetIds.size === paginatedPresets.length ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100"
                      >
                        Nama
                        {sortBy === 'name' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3">
                      <button
                        onClick={() => handleSort('folder')}
                        className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100"
                      >
                        Folder
                        {sortBy === 'folder' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3">
                      <button
                        onClick={() => handleSort('genre')}
                        className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100"
                      >
                        Genre
                        {sortBy === 'genre' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100"
                      >
                        Tanggal Dibuat
                        {sortBy === 'createdAt' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left p-3 text-zinc-300">Status</th>
                    <th className="text-left p-3 text-zinc-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPresets.map(preset => (
                    <tr
                      key={preset.id}
                      className="border-b border-zinc-700/50 hover:bg-zinc-700/30 transition-colors"
                    >
                      <td className="p-3">
                        <button
                          onClick={() => togglePresetSelection(preset.id)}
                          className="text-zinc-400 hover:text-zinc-100"
                        >
                          {selectedPresetIds.has(preset.id) ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => onSelectPreset?.(preset)}
                          className="text-zinc-100 hover:text-cyan-400 transition-colors text-left"
                        >
                          {preset.name}
                        </button>
                      </td>
                      <td className="p-3 text-zinc-300">
                        {preset.folder ? (
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4" />
                            {preset.folder}
                          </div>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="p-3 text-zinc-300">
                        {preset.genre ? (
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            {preset.genre}
                          </div>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="p-3 text-zinc-400 text-sm">
                        {formatDate(preset.createdAt)}
                      </td>
                      <td className="p-3">
                        {preset.isPublic ? (
                          <span className="flex items-center gap-1 text-cyan-400">
                            <Globe className="w-4 h-4" />
                            Public
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-zinc-500">
                            <Lock className="w-4 h-4" />
                            Private
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEditPreset?.(preset)}
                            className="text-zinc-400 hover:text-cyan-400 transition-colors p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-zinc-400 text-sm">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedPresets.length)} dari {filteredAndSortedPresets.length} preset
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-zinc-700 text-zinc-100 px-3 py-1 rounded-lg border border-zinc-600 focus:outline-none focus:border-cyan-500 text-sm"
            >
              <option value={10}>10 per halaman</option>
              <option value={25}>25 per halaman</option>
              <option value={50}>50 per halaman</option>
              <option value={100}>100 per halaman</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-3 py-1 rounded-lg border border-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-zinc-400 text-sm">
              Halaman {currentPage} dari {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-3 py-1 rounded-lg border border-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

