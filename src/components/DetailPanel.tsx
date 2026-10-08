'use client';

import {
  Calendar,
  Clock,
  ExternalLink,
  Film,
  Globe,
  Images,
  SearchCheck,
  Star,
  Tag,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { getBangumiSubject, getBangumiSubjectUrl } from '@/lib/bangumi.client';
import { appendSpecialSourceParam } from '@/lib/special-source.client';
import { getTMDBImageUrl } from '@/lib/tmdb.client';
import { processImageUrl } from '@/lib/utils';

import ImageViewer from '@/components/ImageViewer';
import ProxyImage from '@/components/ProxyImage';
import { AppSheet } from '@/components/ui/app-sheet';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  poster?: string;
  doubanId?: number;
  bangumiId?: number;
  isBangumi?: boolean;
  tmdbId?: number;
  type?: 'movie' | 'tv';
  year?: string;
  seasonNumber?: number;
  currentEpisode?: number;
  cmsData?: {
    desc?: string;
    episodes?: string[];
    episodes_titles?: string[];
  };
  sourceId?: string;
  source?: string;
  // 兼容保留：底座已改为响应式（桌面 Dialog / 移动端 AppSheet），
  // 这两个 prop 不再影响渲染，仅为不破坏既有调用方签名
  useDrawer?: boolean;
  drawerWidth?: string;
}

interface DetailData {
  title: string;
  originalTitle?: string;
  year?: string;
  poster?: string;
  rating?: {
    value: number;
    count: number;
  };
  intro?: string;
  genres?: string[];
  directors?: Array<{ name: string; profile_path?: string }>;
  actors?: Array<{ name: string; character?: string; profile_path?: string }>;
  countries?: string[];
  languages?: string[];
  duration?: string;
  episodesCount?: number;
  releaseDate?: string;
  status?: string;
  tagline?: string;
  seasons?: number;
  overview?: string;
  tmdbId?: number;
  mediaType?: 'movie' | 'tv';
  seasonNumber?: number;
  seriesTitle?: string;
}

interface Episode {
  id: number;
  name: string;
  episode_number: number;
  still_path: string | null;
  overview: string;
  air_date: string;
}

interface GalleryImage {
  file_path: string;
  width: number;
  height: number;
  vote_average?: number;
  vote_count?: number;
  iso_639_1?: string | null;
  imageType: 'backdrop' | 'poster';
}

// 从多个 TMDB 搜索结果中挑选最匹配的一个
// 依据媒体类型（单集大概率是电影）与年份辅助打分，无有效线索时降级到第一个
const pickBestTmdbResult = (
  results: any[],
  hints: { mediaTypeHint?: 'movie' | 'tv'; year?: string }
): any => {
  if (!results || results.length === 0) return undefined;
  if (results.length === 1) return results[0];

  const { mediaTypeHint, year } = hints;
  const targetYear = year ? parseInt(year, 10) : NaN;

  const getResultYear = (r: any): number => {
    const date =
      r.media_type === 'movie' ? r.release_date : r.first_air_date;
    return date ? parseInt(String(date).substring(0, 4), 10) : NaN;
  };

  let best = results[0];
  let bestScore = -Infinity;

  results.forEach((r) => {
    let score = 0;

    // 媒体类型匹配（权重最高）
    if (mediaTypeHint && r.media_type === mediaTypeHint) {
      score += 10;
    }

    // 年份匹配：完全一致加分最高，相差 1 年次之
    if (!Number.isNaN(targetYear)) {
      const ry = getResultYear(r);
      if (!Number.isNaN(ry)) {
        const diff = Math.abs(ry - targetYear);
        if (diff === 0) score += 8;
        else if (diff === 1) score += 4;
        else if (diff <= 2) score += 1;
      }
    }

    // 严格大于才更新，保证同分时保留靠前（更相关）的结果
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  });

  return best;
};

const DetailPanel: React.FC<DetailPanelProps> = ({
  isOpen,
  onClose,
  title,
  poster,
  doubanId,
  bangumiId,
  isBangumi,
  tmdbId,
  type = 'movie',
  year,
  seasonNumber,
  currentEpisode,
  cmsData,
  sourceId,
  source,
}) => {
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seasonData, setSeasonData] = useState<{
    seasons: any[];
    episodes: Episode[];
  } | null>(null);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(
    new Set()
  );
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [seasonsLoaded, setSeasonsLoaded] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [showGallery, setShowGallery] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [galleryScrollTop, setGalleryScrollTop] = useState(0);
  const [galleryViewportHeight, setGalleryViewportHeight] = useState(0);
  const [galleryViewportWidth, setGalleryViewportWidth] = useState(0);
  const galleryScrollRef = React.useRef<HTMLDivElement>(null);

  // TMDB 搜索结果（供纠错切换）
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [showTmdbCorrection, setShowTmdbCorrection] = useState(false);

  // 集数剧照状态
  const [showEpisodeStills, setShowEpisodeStills] = useState(false);
  const [episodeStillsLoading, setEpisodeStillsLoading] = useState(false);
  const [episodeStillsError, setEpisodeStillsError] = useState<string | null>(
    null
  );
  const [episodeStills, setEpisodeStills] = useState<string[]>([]);
  const [episodeStillsTitle, setEpisodeStillsTitle] = useState('');

  // 数据源状态管理
  const [currentSource, setCurrentSource] = useState<
    'douban' | 'bangumi' | 'cms' | 'tmdb'
  >('tmdb');
  const [originalSource, setOriginalSource] = useState<
    'douban' | 'bangumi' | 'cms' | 'tmdb'
  >('tmdb');
  const [isUsingTmdb, setIsUsingTmdb] = useState(false);
  const [originalDetailData, setOriginalDetailData] =
    useState<DetailData | null>(null);

  const getExternalUrl = () => {
    if (currentSource === 'douban' && doubanId) {
      return `https://movie.douban.com/subject/${doubanId}`;
    }

    if (currentSource === 'bangumi') {
      const actualBangumiId = bangumiId || doubanId;
      if (actualBangumiId) {
        return getBangumiSubjectUrl(actualBangumiId);
      }
    }

    if (currentSource === 'tmdb') {
      const actualTmdbId = detailData?.tmdbId || tmdbId;
      const actualMediaType = detailData?.mediaType || type;
      if (actualTmdbId) {
        return `https://www.themoviedb.org/${actualMediaType}/${actualTmdbId}`;
      }
    }

    return null;
  };

  const externalUrl = getExternalUrl();

  // 拖动滚动状态
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const episodesScrollRef = React.useRef<HTMLDivElement>(null);
  const actorsScrollRef = React.useRef<HTMLDivElement>(null);
  const [isActorsDragging, setIsActorsDragging] = useState(false);
  const [isActorsMouseDown, setIsActorsMouseDown] = useState(false);
  const [actorsStartX, setActorsStartX] = useState(0);
  const [actorsScrollLeft, setActorsScrollLeft] = useState(0);

  // 图片点击处理
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageViewer(true);
  };

  // 查看某一集的剧照
  const handleEpisodeStillsClick = async (episode: Episode) => {
    const tmdbId = detailData?.tmdbId;
    if (!tmdbId) return;

    setEpisodeStillsTitle(`第${episode.episode_number}集 剧照`);
    setShowEpisodeStills(true);
    setEpisodeStillsLoading(true);
    setEpisodeStillsError(null);
    setEpisodeStills([]);

    try {
      const response = await fetch(
        `/api/tmdb/episode-images?id=${tmdbId}&season=${selectedSeason}&episode=${episode.episode_number}`
      );

      if (!response.ok) {
        throw new Error('获取剧照失败');
      }

      const data = await response.json();
      const stills: string[] = (data.list || []).map((item: { file_path: string }) =>
        getTMDBImageUrl(item.file_path, 'original')
      );

      // 兜底：接口无剧照时至少展示当前集封面
      if (stills.length === 0 && episode.still_path) {
        stills.push(getTMDBImageUrl(episode.still_path, 'original'));
      }

      setEpisodeStills(stills);
    } catch (err) {
      console.error('获取集数剧照失败:', err);
      setEpisodeStillsError(err instanceof Error ? err.message : '获取剧照失败');
    } finally {
      setEpisodeStillsLoading(false);
    }
  };

  const galleryTmdbId = detailData?.tmdbId || tmdbId;
  const galleryMediaType = detailData?.mediaType || type;
  const canShowGalleryEntry = !!galleryTmdbId && !!galleryMediaType;

  const fetchGalleryImages = async () => {
    if (!galleryTmdbId || !galleryMediaType) return;

    setGalleryLoading(true);
    setGalleryError(null);

    try {
      const response = await fetch(
        `/api/tmdb/images?id=${galleryTmdbId}&type=${galleryMediaType}`
      );

      if (!response.ok) {
        throw new Error('获取照片墙失败');
      }

      const data = await response.json();
      setGalleryImages(data.list || []);
      setGalleryTotal(data.total || 0);
    } catch (err) {
      console.error('获取照片墙失败:', err);
      setGalleryError(err instanceof Error ? err.message : '获取照片墙失败');
    } finally {
      setGalleryLoading(false);
    }
  };

  const openGallery = () => {
    setShowGallery(true);
  };

  useEffect(() => {
    if (!showGallery) {
      setGalleryImages([]);
      setGalleryError(null);
      setGalleryLoading(false);
      setGalleryTotal(0);
      setGalleryScrollTop(0);
      setGalleryViewportHeight(0);
      setGalleryViewportWidth(0);
      return;
    }

    fetchGalleryImages();
  }, [showGallery, galleryTmdbId, galleryMediaType]);

  useEffect(() => {
    if (!showGallery || !galleryScrollRef.current) return;

    const element = galleryScrollRef.current;

    const updateMetrics = () => {
      setGalleryViewportHeight(element.clientHeight);
      setGalleryViewportWidth(element.clientWidth);
      setGalleryScrollTop(element.scrollTop);
    };

    updateMetrics();
    element.addEventListener('scroll', updateMetrics, { passive: true });
    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener('scroll', updateMetrics);
      resizeObserver.disconnect();
    };
  }, [showGallery]);

  useEffect(() => {
    if (!isOpen) {
      setShowGallery(false);
      setShowEpisodeStills(false);
      setShowTmdbCorrection(false);
      setTmdbResults([]);
    }
  }, [isOpen]);

  // 从标题中解析搜索关键词与季度号
  const parseTmdbSearchInfo = () => {
    let searchTitle = title;
    let extractedSeasonNumber = seasonNumber;

    // 匹配各种季度格式: 第一季、第1季、第一部、Season 1、S1等
    const seasonPatterns = [
      /第([一二三四五六七八九十\d]+)[季部]/,
      /Season\s*(\d+)/i,
      /S(\d+)/i,
    ];

    for (const pattern of seasonPatterns) {
      const match = title.match(pattern);
      if (match) {
        searchTitle = title.replace(pattern, '').trim();
        if (!extractedSeasonNumber) {
          const seasonStr = match[1];
          const chineseNumbers: Record<string, number> = {
            一: 1,
            二: 2,
            三: 3,
            四: 4,
            五: 5,
            六: 6,
            七: 7,
            八: 8,
            九: 9,
            十: 10,
          };
          extractedSeasonNumber =
            chineseNumbers[seasonStr] || parseInt(seasonStr) || undefined;
        }
        break;
      }
    }

    return { searchTitle, extractedSeasonNumber };
  };

  // 推断媒体类型：集数是更强的线索（单集大概率是电影，多集为剧集），
  // 无集数信息时降级用调用方传入的 type
  const getMediaTypeHint = (): 'movie' | 'tv' | undefined => {
    const episodesCount = cmsData?.episodes?.length;
    if (typeof episodesCount === 'number' && episodesCount > 0) {
      return episodesCount === 1 ? 'movie' : 'tv';
    }
    return type;
  };

  // 根据指定的搜索结果加载 TMDB 详情
  const applyTmdbResult = async (
    result: any,
    extractedSeasonNumber?: number
  ) => {
    const detailId = result.id;
    const mediaType = result.media_type || type;

    // 获取详情
    const detailResponse = await fetch(
      `/api/tmdb/detail?id=${detailId}&type=${mediaType}`
    );
    if (!detailResponse.ok) {
      throw new Error('获取TMDB详情失败');
    }
    const detailResult = await detailResponse.json();

    // 如果有季度信息,尝试获取季度详情
    let seasonDetail = null;
    if (extractedSeasonNumber && mediaType === 'tv') {
      try {
        const seasonResponse = await fetch(
          `/api/tmdb/episodes?id=${detailId}&season=${extractedSeasonNumber}`
        );
        if (seasonResponse.ok) {
          seasonDetail = await seasonResponse.json();
        }
      } catch (err) {
        console.error('获取季度信息失败', err);
      }
    }

    setDetailData({
      title:
        mediaType === 'movie'
          ? detailResult.title
          : seasonDetail?.name
          ? `${detailResult.name} ${seasonDetail.name}`
          : detailResult.name,
      originalTitle:
        mediaType === 'movie'
          ? detailResult.original_title
          : detailResult.original_name,
      year:
        mediaType === 'movie'
          ? detailResult.release_date?.substring(0, 4)
          : seasonDetail?.air_date?.substring(0, 4) ||
            detailResult.first_air_date?.substring(0, 4),
      poster:
        seasonDetail?.poster_path || detailResult.poster_path
          ? processImageUrl(
              getTMDBImageUrl(
                seasonDetail?.poster_path || detailResult.poster_path,
                'w500'
              )
            )
          : poster,
      rating: detailResult.vote_average
        ? {
            value: detailResult.vote_average,
            count: detailResult.vote_count,
          }
        : undefined,
      intro: seasonDetail?.overview || detailResult.overview,
      genres: detailResult.genres?.map((g: any) => g.name),
      countries: detailResult.production_countries?.map((c: any) => c.name),
      languages: detailResult.spoken_languages?.map((l: any) => l.name),
      duration: detailResult.runtime
        ? `${detailResult.runtime}分钟`
        : undefined,
      episodesCount:
        seasonDetail?.episodes?.length || detailResult.number_of_episodes,
      releaseDate:
        mediaType === 'movie'
          ? detailResult.release_date
          : seasonDetail?.air_date || detailResult.first_air_date,
      status: detailResult.status,
      tagline: detailResult.tagline,
      seasons: detailResult.number_of_seasons,
      overview: detailResult.overview,
      tmdbId: detailId,
      mediaType: mediaType,
      seasonNumber: extractedSeasonNumber,
      seriesTitle: mediaType === 'tv' ? detailResult.name : undefined,
    });
    setCurrentSource('tmdb');
  };

  // 用户从纠错面板中选择某个搜索结果
  const handleSelectTmdbResult = async (result: any) => {
    setShowTmdbCorrection(false);
    setLoading(true);
    setError(null);
    // 重置季度/集数,交给对应 effect 重新加载
    setSeasonData(null);
    setSeasonsLoaded(false);

    try {
      const { extractedSeasonNumber } = parseTmdbSearchInfo();
      await applyTmdbResult(result, extractedSeasonNumber);
    } catch (err) {
      console.error('切换TMDB结果失败:', err);
      setError(err instanceof Error ? err.message : '切换失败');
      setCurrentSource('tmdb');
    } finally {
      setLoading(false);
    }
  };

  // 获取详情数据
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        // 如果正在使用 TMDB 数据，强制使用 TMDB
        if (isUsingTmdb && title) {
          await fetchTmdbData();
          return;
        }

        // 优先使用苹果CMS数据（短剧等）
        // 如果 cmsData 存在但 desc 为空，尝试通过 source-detail API 获取
        if (cmsData) {
          setCurrentSource('cms');
          setOriginalSource('cms');
          if (cmsData.desc) {
            // 有 desc，直接使用
            const data = {
              title: title,
              intro: cmsData.desc,
              episodesCount: cmsData.episodes?.length,
              poster: poster,
            };
            setDetailData(data);
            setOriginalDetailData(data);
            setLoading(false);
            return;
          }

          // cmsData 存在但 desc 为空，尝试通过 API 获取详情
          if (sourceId && source) {
            try {
              const response = await fetch(
                appendSpecialSourceParam(`/api/source-detail?id=${encodeURIComponent(
                  sourceId
                )}&source=${encodeURIComponent(
                  source
                )}&title=${encodeURIComponent(title)}`)
              );
              if (response.ok) {
                const data = await response.json();
                const detailData = {
                  title: data.title || title,
                  intro: data.desc || '',
                  episodesCount:
                    data.episodes?.length || cmsData.episodes?.length,
                  poster: data.poster || poster,
                  year: data.year,
                };
                setDetailData(detailData);
                setOriginalDetailData(detailData);
                setLoading(false);
                return;
              }
            } catch (err) {
              console.error('获取source-detail失败:', err);
              // 继续执行后续逻辑
            }
          }
        }

        // 优先使用 Bangumi ID（因为 isBangumi 为 true 时，doubanId 实际上是 bangumiId）
        if (bangumiId || (isBangumi && doubanId)) {
          setCurrentSource('bangumi');
          setOriginalSource('bangumi');
          const actualBangumiId = bangumiId || doubanId;
          if (!actualBangumiId) {
            throw new Error('Bangumi ID 缺失');
          }
          const data = await getBangumiSubject(actualBangumiId);

          const detailData = {
            title: data.name_cn || data.name,
            originalTitle: data.name,
            year: data.date ? data.date.substring(0, 4) : undefined,
            poster: data.images?.large || poster,
            rating: data.rating
              ? {
                  value: data.rating.score,
                  count: data.rating.total,
                }
              : undefined,
            intro: data.summary,
            genres: data.tags?.map((tag: any) => tag.name).slice(0, 5),
            episodesCount: data.eps,
            releaseDate: data.date,
          };
          setDetailData(detailData);
          setOriginalDetailData(detailData);
          return;
        }

        // 使用豆瓣ID
        if (doubanId && !isBangumi) {
          setCurrentSource('douban');
          setOriginalSource('douban');
          const response = await fetch(`/api/douban/detail?id=${doubanId}`);
          if (!response.ok) {
            throw new Error('获取豆瓣详情失败');
          }
          const data = await response.json();

          const detailData = {
            title: data.title,
            originalTitle: data.original_title,
            year: data.year,
            poster: data.pic?.large || data.pic?.normal || poster,
            rating: data.rating
              ? {
                  value: data.rating.value,
                  count: data.rating.count,
                }
              : undefined,
            intro: data.intro,
            genres: data.genres,
            directors: data.directors,
            actors: data.actors,
            countries: data.countries,
            languages: data.languages,
            duration: data.durations?.[0],
            episodesCount: data.episodes_count,
          };
          setDetailData(detailData);
          setOriginalDetailData(detailData);
          return;
        }

        // 使用 TMDB 搜索
        if (title) {
          setCurrentSource('tmdb');
          setOriginalSource('tmdb');
          await fetchTmdbData();
          return;
        }

        throw new Error('缺少必要的查询参数');
      } catch (err) {
        console.error('获取详情失败:', err);
        setError(err instanceof Error ? err.message : '获取详情失败');
      } finally {
        setLoading(false);
      }
    };

    // 提取 TMDB 数据获取逻辑为独立函数
    const fetchTmdbData = async () => {
      setCurrentSource('tmdb');
      const { searchTitle, extractedSeasonNumber } = parseTmdbSearchInfo();

      const searchResponse = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(searchTitle)}`
      );
      if (!searchResponse.ok) {
        throw new Error('搜索失败');
      }
      const searchData = await searchResponse.json();

      if (searchData.results && searchData.results.length > 0) {
        // 保存全部搜索结果,供纠错切换
        setTmdbResults(searchData.results);
        const best = pickBestTmdbResult(searchData.results, {
          mediaTypeHint: getMediaTypeHint(),
          year,
        });
        await applyTmdbResult(best, extractedSeasonNumber);
        return;
      }

      throw new Error('未找到相关内容');
    };

    fetchDetail();
  }, [
    isOpen,
    doubanId,
    bangumiId,
    isBangumi,
    tmdbId,
    title,
    type,
    year,
    seasonNumber,
    poster,
    cmsData,
    sourceId,
    source,
    isUsingTmdb,
  ]);

  // 切换数据源的函数
  const handleToggleSource = async () => {
    if (currentSource === 'tmdb') {
      // 切换回原始数据源
      if (originalDetailData) {
        setDetailData(originalDetailData);
        setCurrentSource(originalSource);
        setError(null);
      }
    } else {
      // 切换到 TMDB
      // 保存当前数据
      if (detailData && !originalDetailData) {
        setOriginalDetailData(detailData);
      }

      setLoading(true);
      setError(null);
      try {
        await fetchTmdbDataForToggle();
      } catch (err) {
        console.error('切换到TMDB失败:', err);
        setError(err instanceof Error ? err.message : '切换到TMDB失败');
        // 切换失败，但保持 currentSource 为 tmdb，这样可以显示切换回按钮
        setCurrentSource('tmdb');
      } finally {
        setLoading(false);
      }
    }
  };

  // 用于切换时获取 TMDB 数据
  const fetchTmdbDataForToggle = async () => {
    const { searchTitle, extractedSeasonNumber } = parseTmdbSearchInfo();

    const searchResponse = await fetch(
      `/api/tmdb/search?query=${encodeURIComponent(searchTitle)}`
    );
    if (!searchResponse.ok) {
      throw new Error('搜索失败');
    }
    const searchData = await searchResponse.json();

    if (searchData.results && searchData.results.length > 0) {
      // 保存全部搜索结果,供纠错切换
      setTmdbResults(searchData.results);
      const best = pickBestTmdbResult(searchData.results, {
        mediaTypeHint: getMediaTypeHint(),
        year,
      });
      await applyTmdbResult(best, extractedSeasonNumber);
      return;
    }

    throw new Error('未找到相关内容');
  };

  // 异步获取季度和集数详情（仅TMDB）
  useEffect(() => {
    if (
      !detailData?.tmdbId ||
      !detailData?.mediaType ||
      detailData.mediaType !== 'tv' ||
      seasonsLoaded
    ) {
      return;
    }

    const fetchSeasonData = async () => {
      setLoadingSeasons(true);
      try {
        // 获取所有季度
        const seasonsResponse = await fetch(
          `/api/tmdb/seasons?tvId=${detailData.tmdbId}`
        );
        if (!seasonsResponse.ok) return;
        const seasonsData = await seasonsResponse.json();
        const seasons: any[] = seasonsData.seasons || [];

        // 计算默认选中季度：优先用标题提取的季度号，
        // 若该季度号不在实际季度列表中，则降级到第一个有效季度
        const preferredSeason = detailData.seasonNumber || 1;
        const hasPreferred = seasons.some(
          (s: any) => s.season_number === preferredSeason
        );
        const defaultSeason = hasPreferred
          ? preferredSeason
          : seasons[0]?.season_number ?? preferredSeason;
        setSelectedSeason(defaultSeason);

        // 获取默认季度的集数详情
        const episodesResponse = await fetch(
          `/api/tmdb/episodes?id=${detailData.tmdbId}&season=${defaultSeason}`
        );
        const episodesData = episodesResponse.ok
          ? await episodesResponse.json()
          : null;

        // 即使集数获取失败，也保留季度列表，避免整个区块消失
        setSeasonData({
          seasons,
          episodes: episodesData?.episodes || [],
        });
        setSeasonsLoaded(true);
      } catch (err) {
        console.error('获取季度和集数详情失败:', err);
      } finally {
        setLoadingSeasons(false);
      }
    };

    fetchSeasonData();
  }, [
    detailData?.tmdbId,
    detailData?.mediaType,
    detailData?.seasonNumber,
    seasonsLoaded,
  ]);

  // 自动滚动到当前集数
  useEffect(() => {
    if (
      !currentEpisode ||
      !seasonData?.episodes ||
      !episodesScrollRef.current ||
      currentSource !== 'tmdb'
    ) {
      return;
    }

    // 等待 DOM 更新后再滚动
    const timer = setTimeout(() => {
      const episodeElement = document.getElementById(
        `episode-${currentEpisode}`
      );
      if (episodeElement && episodesScrollRef.current) {
        // 计算滚动位置，使当前集数居中显示
        const container = episodesScrollRef.current;
        const elementLeft = episodeElement.offsetLeft;
        const elementWidth = episodeElement.offsetWidth;
        const containerWidth = container.offsetWidth;
        const scrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2;

        container.scrollLeft = scrollLeft;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentEpisode, seasonData?.episodes, currentSource]);

  // 异步获取演职人员信息（仅TMDB）
  useEffect(() => {
    if (
      !detailData?.tmdbId ||
      !detailData?.mediaType ||
      currentSource !== 'tmdb'
    ) {
      return;
    }

    // 如果已经有演员信息，不重复获取
    if (detailData.actors && detailData.actors.length > 0) {
      return;
    }

    const fetchCredits = async () => {
      try {
        const creditsResponse = await fetch(
          `/api/tmdb/credits?id=${detailData.tmdbId}&type=${detailData.mediaType}`
        );
        if (!creditsResponse.ok) return;
        const creditsData = await creditsResponse.json();

        // 更新演员和导演信息
        setDetailData((prev) =>
          prev
            ? {
                ...prev,
                directors:
                  creditsData.crew
                    ?.filter((person: any) => person.job === 'Director')
                    .slice(0, 5)
                    .map((person: any) => ({
                      name: person.name,
                      profile_path: person.profile_path,
                    })) || prev.directors,
                actors:
                  creditsData.cast?.slice(0, 15).map((person: any) => ({
                    name: person.name,
                    character: person.character,
                    profile_path: person.profile_path,
                  })) || prev.actors,
              }
            : null
        );
      } catch (err) {
        console.error('获取演职人员信息失败:', err);
      }
    };

    fetchCredits();
  }, [
    detailData?.tmdbId,
    detailData?.mediaType,
    currentSource,
    detailData?.actors,
  ]);

  // 切换季度时获取集数
  const handleSeasonChange = async (seasonNumber: number) => {
    if (!detailData?.tmdbId || selectedSeason === seasonNumber) return;

    setSelectedSeason(seasonNumber);
    setLoadingSeasons(true);
    try {
      const episodesResponse = await fetch(
        `/api/tmdb/episodes?id=${detailData.tmdbId}&season=${seasonNumber}`
      );
      if (!episodesResponse.ok) return;
      const episodesData = await episodesResponse.json();

      // 从当前 seasonData 中查找季度信息
      const season = seasonData?.seasons.find(
        (s: any) => s.season_number === seasonNumber
      );

      setSeasonData((prev) => ({
        seasons: prev?.seasons || [],
        episodes: episodesData.episodes || [],
      }));

      // 更新季度元信息
      setDetailData((prev) =>
        prev
          ? {
              ...prev,
              title:
                episodesData.name || season?.name
                  ? `${prev.seriesTitle || prev.title} ${
                      episodesData.name || season?.name
                    }`
                  : prev.title,
              intro: episodesData.overview || season?.overview || prev.overview,
              poster: season?.poster_path
                ? getTMDBImageUrl(season.poster_path, 'w500')
                : prev.poster,
              releaseDate:
                episodesData.air_date || season?.air_date || prev.releaseDate,
              year:
                episodesData.air_date?.substring(0, 4) ||
                season?.air_date?.substring(0, 4) ||
                prev.year,
              episodesCount:
                episodesData.episodes?.length ||
                season?.episode_count ||
                prev.episodesCount,
            }
          : null
      );

      setExpandedEpisodes(new Set());
    } catch (err) {
      console.error('获取集数详情失败:', err);
    } finally {
      setLoadingSeasons(false);
    }
  };

  // 拖动滚动处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!episodesScrollRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - episodesScrollRef.current.offsetLeft);
    setScrollLeft(episodesScrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !episodesScrollRef.current) return;

    const x = e.pageX - episodesScrollRef.current.offsetLeft;
    const distance = Math.abs(x - startX);

    // 只有移动超过5px才进入拖动模式
    if (distance > 5 && !isDragging) {
      setIsDragging(true);
      episodesScrollRef.current.style.cursor = 'grabbing';
      episodesScrollRef.current.style.userSelect = 'none';
    }

    if (isDragging) {
      e.preventDefault();
      const walk = (x - startX) * 2; // 滚动速度倍数
      episodesScrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setIsDragging(false);
    if (episodesScrollRef.current) {
      episodesScrollRef.current.style.cursor = 'grab';
      episodesScrollRef.current.style.userSelect = 'auto';
    }
  };

  const handleMouseLeave = () => {
    if (isMouseDown || isDragging) {
      setIsMouseDown(false);
      setIsDragging(false);
      if (episodesScrollRef.current) {
        episodesScrollRef.current.style.cursor = 'grab';
        episodesScrollRef.current.style.userSelect = 'auto';
      }
    }
  };

  // 演员列表拖动滚动处理函数
  const handleActorsMouseDown = (e: React.MouseEvent) => {
    if (!actorsScrollRef.current) return;
    setIsActorsMouseDown(true);
    setActorsStartX(e.pageX - actorsScrollRef.current.offsetLeft);
    setActorsScrollLeft(actorsScrollRef.current.scrollLeft);
  };

  const handleActorsMouseMove = (e: React.MouseEvent) => {
    if (!isActorsMouseDown || !actorsScrollRef.current) return;

    const x = e.pageX - actorsScrollRef.current.offsetLeft;
    const distance = Math.abs(x - actorsStartX);

    // 只有移动超过5px才进入拖动模式
    if (distance > 5 && !isActorsDragging) {
      setIsActorsDragging(true);
      actorsScrollRef.current.style.cursor = 'grabbing';
      actorsScrollRef.current.style.userSelect = 'none';
    }

    if (isActorsDragging) {
      e.preventDefault();
      const walk = (x - actorsStartX) * 2; // 滚动速度倍数
      actorsScrollRef.current.scrollLeft = actorsScrollLeft - walk;
    }
  };

  const handleActorsMouseUp = () => {
    setIsActorsMouseDown(false);
    setIsActorsDragging(false);
    if (actorsScrollRef.current) {
      actorsScrollRef.current.style.cursor = 'grab';
      actorsScrollRef.current.style.userSelect = 'auto';
    }
  };

  const handleActorsMouseLeave = () => {
    if (isActorsMouseDown || isActorsDragging) {
      setIsActorsMouseDown(false);
      setIsActorsDragging(false);
      if (actorsScrollRef.current) {
        actorsScrollRef.current.style.cursor = 'grab';
        actorsScrollRef.current.style.userSelect = 'auto';
      }
    }
  };

  const galleryEntryButton = canShowGalleryEntry ? (
    <button
      onClick={openGallery}
      className='inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition-colors hover:bg-secondary/80'
    >
      <Images size={16} />
      照片墙
    </button>
  ) : null;

  const virtualGalleryLayout = React.useMemo(() => {
    if (galleryImages.length === 0 || galleryViewportWidth <= 0) {
      return {
        visibleItems: [] as Array<
          GalleryImage & {
            top: number;
            left: number;
            renderWidth: number;
            renderHeight: number;
            index: number;
          }
        >,
        totalHeight: 0,
        usedWidth: 0,
      };
    }

    const gap = 4;
    const overscan = 800;
    const horizontalPadding = 32;
    const width = Math.max(galleryViewportWidth - horizontalPadding, 0);
    const columnCount =
      width >= 1280 ? 5 : width >= 1024 ? 4 : width >= 640 ? 3 : 2;
    const columnWidth = Math.floor(
      (width - gap * (columnCount - 1)) / columnCount
    );
    const usedWidth = columnWidth * columnCount + gap * (columnCount - 1);
    const columnHeights = new Array(columnCount).fill(0);

    const items = galleryImages.map((image, index) => {
      let targetColumn = 0;
      for (let i = 1; i < columnCount; i++) {
        if (columnHeights[i] < columnHeights[targetColumn]) {
          targetColumn = i;
        }
      }

      const ratio =
        image.width && image.height
          ? image.height / image.width
          : image.imageType === 'poster'
          ? 1.5
          : 0.5625;
      const renderHeight = Math.max(Math.round(columnWidth * ratio), 80);
      const top = columnHeights[targetColumn];
      const left = targetColumn * (columnWidth + gap);

      columnHeights[targetColumn] += renderHeight + gap;

      return {
        ...image,
        index,
        top,
        left,
        renderWidth: columnWidth,
        renderHeight,
      };
    });

    const totalHeight = Math.max(...columnHeights, 0);
    const minVisibleTop = Math.max(galleryScrollTop - overscan, 0);
    const maxVisibleBottom =
      galleryScrollTop + galleryViewportHeight + overscan;
    const visibleItems = items.filter(
      (item) =>
        item.top + item.renderHeight >= minVisibleTop &&
        item.top <= maxVisibleBottom
    );

    return { visibleItems, totalHeight, usedWidth };
  }, [
    galleryImages,
    galleryScrollTop,
    galleryViewportHeight,
    galleryViewportWidth,
  ]);

  // 响应式底座：桌面端 → Dialog，移动端 → AppSheet
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 768px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const galleryBody = (
    <div
      ref={galleryScrollRef}
      className='flex-1 overflow-y-auto overflow-x-hidden p-4'
    >
      {galleryLoading && (
        <div className='flex items-center justify-center py-20'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-primary'></div>
        </div>
      )}

      {!galleryLoading && galleryError && (
        <div className='text-center py-12 text-destructive'>{galleryError}</div>
      )}

      {!galleryLoading && !galleryError && galleryImages.length === 0 && (
        <div className='text-center py-12 text-muted-foreground'>暂无图片</div>
      )}

      {!galleryLoading && !galleryError && galleryImages.length > 0 && (
        <div
          className='relative mx-auto'
          style={{
            height: virtualGalleryLayout.totalHeight,
            width: virtualGalleryLayout.usedWidth || '100%',
          }}
        >
          {virtualGalleryLayout.visibleItems.map((image) => {
            const imageUrl = getTMDBImageUrl(
              image.file_path,
              image.imageType === 'poster' ? 'w500' : 'original'
            );
            const thumbUrl = getTMDBImageUrl(
              image.file_path,
              image.imageType === 'poster' ? 'w342' : 'w780'
            );

            return (
              <div
                key={`${image.imageType}-${image.file_path}-${image.index}`}
                className='group absolute'
                style={{
                  top: image.top,
                  left: image.left,
                  width: image.renderWidth,
                  height: image.renderHeight,
                }}
              >
                <div
                  className='relative w-full h-full overflow-hidden rounded-md bg-muted cursor-pointer hover:opacity-90 transition-opacity'
                  onClick={() => handleImageClick(imageUrl)}
                >
                  <ProxyImage
                    originalSrc={thumbUrl}
                    alt={`${detailData?.title || title}-gallery-${
                      image.index + 1
                    }`}
                    className='absolute inset-0 w-full h-full object-cover'
                    draggable={false}
                  />
                  <div className='absolute left-2 top-2 px-2 py-0.5 rounded-full text-xs bg-black/60 text-white'>
                    {image.imageType === 'poster' ? '海报' : '剧照'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const galleryDialog = (
    <Dialog
      open={showGallery}
      onOpenChange={(open) => {
        if (!open) setShowGallery(false);
      }}
    >
      <DialogContent
        className='flex max-h-[90vh] max-w-6xl flex-col gap-0 overflow-hidden p-0'
        aria-describedby={undefined}
      >
        <div className='flex shrink-0 items-center justify-between border-b border-border p-4 pr-12'>
          <div>
            <DialogTitle>照片墙</DialogTitle>
            {!galleryLoading && (
              <p className='text-sm text-muted-foreground'>
                共 {galleryTotal} 张
              </p>
            )}
          </div>
        </div>
        {galleryBody}
      </DialogContent>
    </Dialog>
  );

  const episodeStillsBody = (
    <div className='flex-1 overflow-y-auto overflow-x-hidden p-4'>
      {episodeStillsLoading && (
        <div className='flex items-center justify-center py-20'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-primary'></div>
        </div>
      )}

      {!episodeStillsLoading && episodeStillsError && (
        <div className='text-center py-12 text-destructive'>
          {episodeStillsError}
        </div>
      )}

      {!episodeStillsLoading &&
        !episodeStillsError &&
        episodeStills.length === 0 && (
          <div className='text-center py-12 text-muted-foreground'>
            暂无剧照
          </div>
        )}

      {!episodeStillsLoading &&
        !episodeStillsError &&
        episodeStills.length > 0 && (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {episodeStills.map((stillUrl, index) => (
              <div
                key={`${stillUrl}-${index}`}
                className='relative aspect-video overflow-hidden rounded-md bg-muted cursor-pointer hover:opacity-90 transition-opacity'
                onClick={() => handleImageClick(stillUrl)}
              >
                <ProxyImage
                  originalSrc={stillUrl}
                  alt={`${episodeStillsTitle}-${index + 1}`}
                  className='absolute inset-0 w-full h-full object-cover'
                  draggable={false}
                />
              </div>
            ))}
          </div>
        )}
    </div>
  );

  const episodeStillsDialog = (
    <Dialog
      open={showEpisodeStills}
      onOpenChange={(open) => {
        if (!open) setShowEpisodeStills(false);
      }}
    >
      <DialogContent
        className='flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0'
        aria-describedby={undefined}
      >
        <div className='flex shrink-0 items-center justify-between border-b border-border p-4 pr-12'>
          <div>
            <DialogTitle>{episodeStillsTitle || '剧照'}</DialogTitle>
            {!episodeStillsLoading && !episodeStillsError && (
              <p className='text-sm text-muted-foreground'>
                共 {episodeStills.length} 张
              </p>
            )}
          </div>
        </div>
        {episodeStillsBody}
      </DialogContent>
    </Dialog>
  );

  const tmdbCorrectionBody = (
    <div className='flex-1 overflow-y-auto overflow-x-hidden p-4'>
      <div className='flex flex-col gap-2'>
        {tmdbResults.map((result: any) => {
          const resultTitle = result.title || result.name || '未知标题';
          const resultDate = result.release_date || result.first_air_date || '';
          const resultYear = resultDate ? resultDate.substring(0, 4) : '';
          const resultPoster = result.poster_path
            ? getTMDBImageUrl(result.poster_path, 'w92')
            : '';
          const isActive = detailData?.tmdbId === result.id;

          return (
            <div
              key={`${result.media_type}-${result.id}`}
              onClick={() => handleSelectTmdbResult(result)}
              className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? 'bg-accent ring-2 ring-foreground'
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              <div className='relative w-12 h-16 rounded overflow-hidden bg-muted flex-shrink-0'>
                {resultPoster ? (
                  <ProxyImage
                    originalSrc={resultPoster}
                    alt={resultTitle}
                    className='absolute inset-0 w-full h-full object-cover'
                    draggable={false}
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <Film size={20} className='text-muted-foreground' />
                  </div>
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <p className='text-sm font-medium text-foreground truncate'>
                    {resultTitle}
                  </p>
                  <Badge
                    variant='secondary'
                    className='flex-shrink-0 px-1.5 py-0.5 text-micro'
                  >
                    {result.media_type === 'tv' ? '剧集' : '电影'}
                  </Badge>
                </div>
                {resultYear && (
                  <p className='text-sm leading-cjk text-muted-foreground mt-0.5'>
                    {resultYear}
                  </p>
                )}
                {result.overview && (
                  <p className='text-sm leading-cjk text-muted-foreground mt-1 line-clamp-2'>
                    {result.overview}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const tmdbCorrectionDialog = (
    <Dialog
      open={showTmdbCorrection}
      onOpenChange={(open) => {
        if (!open) setShowTmdbCorrection(false);
      }}
    >
      <DialogContent
        className='flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0'
        aria-describedby={undefined}
      >
        <div className='flex shrink-0 items-center justify-between border-b border-border p-4 pr-12'>
          <div>
            <DialogTitle>纠正匹配</DialogTitle>
            <p className='text-sm text-muted-foreground'>选择正确的条目</p>
          </div>
        </div>
        {tmdbCorrectionBody}
      </DialogContent>
    </Dialog>
  );

  // 头部操作按钮（纠错 / 外链），桌面端在 Dialog 头部，移动端在 AppSheet 内容顶部
  const hasHeaderActions =
    (currentSource === 'tmdb' && tmdbResults.length > 1) || !!externalUrl;

  const headerActions = (
    <div className='flex items-center gap-2'>
      {currentSource === 'tmdb' && tmdbResults.length > 1 && (
        <button
          onClick={() => setShowTmdbCorrection(true)}
          className='p-2 rounded-full hover:bg-accent transition-colors duration-150'
          title='匹配错误?点此纠正'
          aria-label='纠正匹配结果'
        >
          <SearchCheck size={18} className='text-muted-foreground' />
        </button>
      )}
      {externalUrl && (
        <button
          onClick={() => window.open(externalUrl, '_blank', 'noopener,noreferrer')}
          className='p-2 rounded-full hover:bg-accent transition-colors duration-150'
          title='打开外部页面'
          aria-label='打开外部页面'
        >
          <ExternalLink size={18} className='text-muted-foreground' />
        </button>
      )}
    </div>
  );

  // 数据源显示和切换（错误态与详情底部共用）
  const sourceSwitchRow = (
    <div className='mt-6 pt-4 border-t border-border'>
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>数据来源:</span>
          <span className='text-sm font-medium text-foreground/80 uppercase'>
            {currentSource === 'douban' && 'Douban'}
            {currentSource === 'bangumi' && 'Bangumi'}
            {currentSource === 'cms' && 'CMS'}
            {currentSource === 'tmdb' && 'TMDB'}
          </span>
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          {galleryEntryButton}
          {currentSource !== 'tmdb' && (
            <button
              onClick={handleToggleSource}
              disabled={loading}
              className='px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              切换到 TMDB
            </button>
          )}
          {currentSource === 'tmdb' &&
            originalSource !== 'tmdb' &&
            originalDetailData && (
              <button
                onClick={handleToggleSource}
                disabled={loading}
                className='px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                切换回{' '}
                {originalSource === 'douban'
                  ? 'Douban'
                  : originalSource === 'bangumi'
                  ? 'Bangumi'
                  : 'CMS'}
              </button>
            )}
        </div>
      </div>
    </div>
  );

  // 详情内容区（桌面 Dialog 与移动 AppSheet 共用）
  const panelContent = (
    <>
      {loading && (
        <div className='flex items-center justify-center py-20'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
        </div>
      )}

      {error && (
        <div className='p-6'>
          <div className='text-center mb-6'>
            <p className='text-destructive'>{error}</p>
          </div>

          {/* 数据源显示和切换 - 错误时也显示 */}
          {sourceSwitchRow}
        </div>
      )}

      {!loading && !error && detailData && (
        <div className='p-6'>
          {/* 海报和基本信息 */}
          <div className='flex gap-6 mb-6'>
            {detailData.poster && (
              <div className='flex flex-col items-start gap-3 flex-shrink-0'>
                <div
                  className='relative w-32 h-48 rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity'
                  onClick={() => handleImageClick(detailData.poster!)}
                >
                  <ProxyImage
                    originalSrc={detailData.poster}
                    alt={detailData.title}
                    className='absolute inset-0 w-full h-full object-cover'
                    draggable={false}
                  />
                </div>
                {galleryEntryButton}
              </div>
            )}
            <div className='flex-1 min-w-0'>
              <h3 className='text-2xl font-bold text-foreground mb-2'>
                {detailData.title}
              </h3>
              {detailData.originalTitle &&
                detailData.originalTitle !== detailData.title && (
                  <p className='text-sm text-muted-foreground mb-3'>
                    {detailData.originalTitle}
                  </p>
                )}

              {/* 评分 */}
              {detailData.rating && (
                <div className='flex items-center gap-2 mb-3'>
                  <Star size={20} className='fill-foreground text-foreground' />
                  <span className='text-lg font-semibold text-foreground'>
                    {detailData.rating.value.toFixed(1)}
                  </span>
                  {detailData.rating.count > 0 && (
                    <span className='text-sm text-muted-foreground'>
                      ({detailData.rating.count} 评价)
                    </span>
                  )}
                </div>
              )}

              {/* 类型标签 */}
              {detailData.genres && detailData.genres.length > 0 && (
                <div className='flex flex-wrap gap-2 mb-3'>
                  {detailData.genres.map((genre, index) => (
                    <Badge key={index} variant='secondary'>
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 年份和时长 */}
              <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
                {detailData.year && (
                  <div className='flex items-center gap-1'>
                    <Calendar size={16} />
                    <span>{detailData.year}</span>
                  </div>
                )}
                {detailData.duration && (
                  <div className='flex items-center gap-1'>
                    <Clock size={16} />
                    <span>{detailData.duration}</span>
                  </div>
                )}
                {detailData.episodesCount && (
                  <div className='flex items-center gap-1'>
                    <Film size={16} />
                    <span>{detailData.episodesCount} 集</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 简介 */}
          {(detailData.intro || detailData.overview) && (
            <div className='mb-6'>
              <h4 className='text-lg font-semibold text-foreground mb-2'>
                简介
              </h4>
              <p className='text-foreground/80 leading-relaxed whitespace-pre-wrap'>
                {detailData.intro || detailData.overview}
              </p>
            </div>
          )}

          {/* 导演和演员 */}
          {detailData.directors && detailData.directors.length > 0 && (
            <div className='mb-4'>
              <h4 className='text-title font-semibold text-foreground mb-2 flex items-center gap-2'>
                <Users size={16} />
                导演
              </h4>
              <p className='text-foreground/80'>
                {detailData.directors.map((d) => d.name).join(', ')}
              </p>
            </div>
          )}

          {detailData.actors && detailData.actors.length > 0 && (
            <div className='mb-4'>
              <h4 className='text-title font-semibold text-foreground mb-2 flex items-center gap-2'>
                <Users size={16} />
                演员
              </h4>
              {currentSource === 'tmdb' ? (
                <div
                  ref={actorsScrollRef}
                  onMouseDown={handleActorsMouseDown}
                  onMouseMove={handleActorsMouseMove}
                  onMouseUp={handleActorsMouseUp}
                  onMouseLeave={handleActorsMouseLeave}
                  className='overflow-x-auto -mx-6 px-6 cursor-grab active:cursor-grabbing'
                  style={{
                    scrollbarWidth: 'thin',
                    scrollBehavior: isActorsDragging ? 'auto' : 'smooth',
                  }}
                >
                  <div className='flex gap-4 pb-2'>
                    {detailData.actors.map((actor, index) => (
                      <div
                        key={index}
                        className='flex flex-col items-center flex-shrink-0'
                        style={{
                          pointerEvents: isActorsDragging ? 'none' : 'auto',
                        }}
                      >
                        {actor.profile_path ? (
                          <div
                            className='relative w-20 h-20 rounded-full overflow-hidden bg-muted mb-2 cursor-pointer hover:opacity-80 transition-opacity'
                            onClick={() =>
                              handleImageClick(
                                getTMDBImageUrl(
                                  actor.profile_path || null,
                                  'w185'
                                )
                              )
                            }
                          >
                            <ProxyImage
                              originalSrc={getTMDBImageUrl(
                                actor.profile_path || null,
                                'w185'
                              )}
                              alt={actor.name}
                              className='absolute inset-0 w-full h-full object-cover'
                              draggable={false}
                            />
                          </div>
                        ) : (
                          <div className='w-20 h-20 rounded-full bg-muted mb-2 flex items-center justify-center'>
                            <Users size={28} className='text-muted-foreground' />
                          </div>
                        )}
                        <a
                          href={`https://baike.baidu.com/item/${encodeURIComponent(
                            actor.name
                          )}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-sm font-medium text-foreground text-center w-20 line-clamp-2 hover:text-foreground/70 transition-colors cursor-pointer'
                          onClick={(e) => e.stopPropagation()}
                        >
                          {actor.name}
                        </a>
                        {actor.character && (
                          <p className='text-xs text-muted-foreground text-center w-20 line-clamp-2'>
                            {actor.character}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className='text-foreground/80'>
                  {detailData.actors
                    .slice(0, 10)
                    .map((a) => a.name)
                    .join(', ')}
                </p>
              )}
            </div>
          )}

          {/* 制作信息 */}
          <div className='grid grid-cols-2 gap-4 text-sm'>
            {detailData.countries && detailData.countries.length > 0 && (
              <div>
                <h4 className='font-semibold text-foreground mb-1 flex items-center gap-1'>
                  <Globe size={14} />
                  国家/地区
                </h4>
                <p className='text-foreground/80'>
                  {detailData.countries.join(', ')}
                </p>
              </div>
            )}

            {detailData.languages && detailData.languages.length > 0 && (
              <div>
                <h4 className='font-semibold text-foreground mb-1 flex items-center gap-1'>
                  <Tag size={14} />
                  语言
                </h4>
                <p className='text-foreground/80'>
                  {detailData.languages.join(', ')}
                </p>
              </div>
            )}

            {detailData.releaseDate && (
              <div>
                <h4 className='font-semibold text-foreground mb-1 flex items-center gap-1'>
                  <Calendar size={14} />
                  上映日期
                </h4>
                <p className='text-foreground/80'>{detailData.releaseDate}</p>
              </div>
            )}

            {detailData.status && (
              <div>
                <h4 className='font-semibold text-foreground mb-1'>状态</h4>
                <p className='text-foreground/80'>{detailData.status}</p>
              </div>
            )}
          </div>

          {/* 季度和集数信息（仅TMDB电视剧） */}
          {detailData.mediaType === 'tv' && (
            <div className='mt-6'>
              {loadingSeasons && (
                <div className='flex items-center justify-center py-4'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                </div>
              )}

              {!loadingSeasons && seasonData && (
                <>
                  {/* 季度列表 */}
                  {seasonData.seasons.length > 0 && (
                    <div className='mb-6'>
                      <h4 className='text-lg font-semibold text-foreground mb-3'>
                        季度
                      </h4>
                      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                        {seasonData.seasons.map((season: any) => (
                          <div
                            key={season.id}
                            onClick={() =>
                              handleSeasonChange(season.season_number)
                            }
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                              selectedSeason === season.season_number
                                ? 'bg-accent ring-2 ring-foreground'
                                : 'bg-muted/50 hover:bg-muted'
                            }`}
                          >
                            {season.poster_path && (
                              <div
                                className='relative w-12 h-16 rounded overflow-hidden bg-muted flex-shrink-0 hover:opacity-80 transition-opacity'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageClick(
                                    getTMDBImageUrl(
                                      season.poster_path,
                                      'w500'
                                    )
                                  );
                                }}
                              >
                                <ProxyImage
                                  originalSrc={getTMDBImageUrl(
                                    season.poster_path,
                                    'w92'
                                  )}
                                  alt={season.name}
                                  className='absolute inset-0 w-full h-full object-cover'
                                  draggable={false}
                                />
                              </div>
                            )}
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-medium text-foreground truncate'>
                                {season.name}
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                {season.episode_count} 集
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 集数列表 */}
                  {seasonData.episodes.length > 0 && (
                    <div>
                      <h4 className='text-lg font-semibold text-foreground mb-3'>
                        {seasonData.seasons.find(
                          (s: any) => s.season_number === selectedSeason
                        )?.name || `第${selectedSeason}季`}
                      </h4>
                      <div
                        ref={episodesScrollRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        className='overflow-x-auto -mx-6 px-6 cursor-grab active:cursor-grabbing'
                        style={{
                          scrollbarWidth: 'thin',
                          scrollBehavior: isDragging ? 'auto' : 'smooth',
                        }}
                      >
                        <div className='flex gap-3 py-2'>
                          {seasonData.episodes.map((episode: Episode) => {
                            const isExpanded = expandedEpisodes.has(
                              episode.id
                            );
                            const isCurrentEpisode =
                              currentEpisode === episode.episode_number;
                            return (
                              <div
                                key={episode.id}
                                id={`episode-${episode.episode_number}`}
                                className={`flex-shrink-0 w-64 p-3 rounded ${
                                  isCurrentEpisode
                                    ? 'bg-accent ring-2 ring-foreground'
                                    : 'bg-muted/50'
                                }`}
                                style={{
                                  pointerEvents: isDragging
                                    ? 'none'
                                    : 'auto',
                                }}
                              >
                                {episode.still_path && (
                                  <div
                                    className='relative w-full h-36 rounded overflow-hidden bg-muted mb-2 cursor-pointer hover:opacity-90 transition-opacity'
                                    onClick={() =>
                                      handleEpisodeStillsClick(episode)
                                    }
                                    title='查看该集剧照'
                                  >
                                    <ProxyImage
                                      originalSrc={getTMDBImageUrl(
                                        episode.still_path,
                                        'w300'
                                      )}
                                      alt={episode.name}
                                      className='absolute inset-0 w-full h-full object-cover'
                                      draggable={false}
                                    />
                                  </div>
                                )}
                                <p className='text-sm font-medium text-foreground mb-1'>
                                  第{episode.episode_number}集:{' '}
                                  {episode.name}
                                </p>
                                {episode.overview && (
                                  <p
                                    onClick={() => {
                                      const newExpanded = new Set(
                                        expandedEpisodes
                                      );
                                      if (isExpanded) {
                                        newExpanded.delete(episode.id);
                                      } else {
                                        newExpanded.add(episode.id);
                                      }
                                      setExpandedEpisodes(newExpanded);
                                    }}
                                    className={`text-xs text-muted-foreground cursor-pointer ${
                                      isExpanded ? '' : 'line-clamp-3'
                                    }`}
                                  >
                                    {episode.overview}
                                  </p>
                                )}
                                {episode.air_date && (
                                  <p className='text-xs text-muted-foreground mt-1'>
                                    {episode.air_date}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 数据源显示和切换 */}
          {sourceSwitchRow}
        </div>
      )}
    </>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <DialogContent
            className='flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0'
            aria-describedby={undefined}
          >
            <div className='flex shrink-0 items-center justify-between border-b border-border p-4 pr-12'>
              <DialogTitle className='text-xl'>详情</DialogTitle>
              {headerActions}
            </div>
            <div className='flex-1 overflow-y-auto'>{panelContent}</div>
          </DialogContent>
        </Dialog>
      ) : (
        <AppSheet
          isOpen={isOpen}
          onClose={onClose}
          title='详情'
          width='w-full'
        >
          {hasHeaderActions && (
            <div className='flex items-center justify-end border-b border-border px-4 py-2'>
              {headerActions}
            </div>
          )}
          {panelContent}
        </AppSheet>
      )}

      {/* 二级弹层（照片墙 / 剧照 / 纠错 / 看图） */}
      {galleryDialog}
      {episodeStillsDialog}
      {tmdbCorrectionDialog}
      {showImageViewer && (
        <ImageViewer
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          imageUrl={selectedImage}
          alt={detailData?.title || title}
        />
      )}
    </>
  );
};

export default DetailPanel;
