/**
 * 从 src/app/play/page.tsx 抽出的 Artplayer 初始化配置构造器。
 *
 * 该配置对象与播放页大量 state / ref / 回调深度纠缠（HLS 自定义装载、
 * 弹幕插件、字幕引擎、anime4k、跳过配置、各类内联设置弹窗等），
 * 在不改变行为的前提下无法安全地整体抽成状态自持的 hook，
 * 因此本步只把巨型配置字面量抽成纯函数，实例化与生命周期仍留在 page.tsx。
 */

export interface ArtPlayerConfigDeps {
  // page.tsx 注入的全部外部依赖（state / ref / 回调 / 模块级工具），
  // 逐项与 page.tsx 中的同名绑定对应。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export function buildArtPlayerConfig(deps: ArtPlayerConfigDeps) {
  const {
    CustomHlsJsLoader, Hls, QUICK_FORWARD_STORAGE_KEY, SEEK_STEP_STORAGE_KEY,
    anime4kEnabledRef, anime4kModeRef, anime4kScaleRef, artPlayerRef,
    artRef, artplayerPluginAutoThumbnail, artplayerPluginDanmuku, blockAdEnabled,
    blockAdEnabledRef, buildNativeHlsPlaybackUrl, changeAnime4KMode, changeAnime4KScale,
    currentSourceRef, currentXiaoyaUrlRef, danmakuDisplayStateRef, danmakuFilterConfigRef,
    danmakuHeatmapDisabledRef, danmakuHeatmapEnabledRef, danmakuSettingsRef, defaultSubtitle,
    ensureVideoSource, formatQuickForwardDuration, formatTime, getVideoType,
    handleNextEpisode, handleSkipConfigChange, harmonyHlsPlaybackMode, isHarmonyOS,
    isIOS, isInitialLoadRef, isNetdiskNativeHlsActive, isPlaybackThumbnailDisabled,
    isWebkit, mediaCorsFallbackRef, needsPrivateSourceCrossOrigin, normalizeStoredSeconds,
    playSync, quickForwardSecondsRef, refreshXiaoyaUrl, resumeTimeRef,
    savedSubtitleSize, schedulePlayerTimeout, seekQuickForward, seekStepSecondsRef,
    setBlockAdEnabled, setCorsFailedUrl, setDanmakuHeatmapEnabled, setQuickForwardSeconds,
    setSeekStepSeconds, setShowDanmakuFilterSettings, setVideoError, shouldRescueWebkitHls,
    shouldStartLinkRefreshTimer, shouldUseNativeInitialSubtitle, skipConfigRef, startRefreshTimer,
    toggleAnime4K, videoCover, videoQualities, videoUrl,
    webGPUSupported,
  } = deps;

  return {
          container: artRef.current!,
          url: videoUrl,
          ...(getVideoType(videoUrl) ? { type: getVideoType(videoUrl) } : {}),
          poster: videoCover,
          volume: 0.7,
          isLive: false,
          muted: false,
          autoplay: true,
          pip: true,
          autoSize: false,
          autoMini: false,
          screenshot: true,
          setting: true,
          loop: false,
          flip: true,
          // 观影室房员隐藏倍速设置，由房主同步控制
          playbackRate: !playSync.shouldDisableControls,
          aspectRatio: false,
          fullscreen: !isIOS,  // iOS 禁用原生全屏按钮，避免触发系统播放器
          fullscreenWeb: true,  // 保留网页全屏按钮（所有平台）
          ...(shouldUseNativeInitialSubtitle ? {
            subtitle: {
              url: defaultSubtitle!.url,
              type: 'vtt',
              style: {
                color: '#fff',
                fontSize: savedSubtitleSize,
              },
              encoding: 'utf-8',
            }
          } : {}),
          subtitleOffset: false,
          miniProgressBar: false,
          mutex: true,
          playsInline: true,
          autoPlayback: false,
          airplay: true,
          theme: '#22c55e',
          lang: 'zh-cn',
          hotkey: false,
          // 观影室房员禁用长按加速（会临时改变倍速）
          fastForward: !playSync.shouldDisableControls,
          autoOrientation: true,
          lock: true,
          ...(videoQualities.length > 0 ? {
            quality: videoQualities.map((q: any, index: number) => ({
              default: index === 0,
              html: q.name,
              url: q.url,
            })),
          } : {}),
          moreVideoAttr: {
            playsInline: true,
            'webkit-playsinline': 'true',
            referrerpolicy: 'no-referrer',
            // 私人影库/网盘直链：配合同级 moontvplus-extension 注入 ACAO，供 Anime4K 读帧。
            // 单文件直链（mediaType=file）与网盘挂载原生 HLS 也先乐观 CORS，
            // 无 ACAO 的 CDN 首次播放 error 时一次性回退 no-cors（见 error 处理器）。
            ...(needsPrivateSourceCrossOrigin(currentSourceRef.current) &&
            !mediaCorsFallbackRef.current
              ? { crossOrigin: 'anonymous' }
              : {}),
          } as any,
          // HLS 支持配置
          customType: {
            m3u8: function (video: HTMLVideoElement, url: string) {
              // 网盘挂载原生 HLS：直接把 m3u8 交给浏览器原生播放器（Edge/Safari），
              // 直连网盘 CDN，无需代理与去广告。此时 video 已乐观带上 crossOrigin
              // （配合扩展注入 ACAO 供 Anime4K 读帧）；无 ACAO 时首次播放 error
              // 会触发一次性 no-cors 回退，见 error 处理器。
              if (isNetdiskNativeHlsActive(currentSourceRef.current)) {
                if (video.hls) {
                  video.hls.destroy();
                  delete video.hls;
                }

                video.src = url;
                ensureVideoSource(video, url);
                video.load();
                return;
              }

              if (isHarmonyOS && harmonyHlsPlaybackMode === 'native') {
                if (video.hls) {
                  video.hls.destroy();
                  delete video.hls;
                }

                // 不 attach MediaSource，直接把 m3u8 交给 ArkWeb/浏览器原生播放器。
                // currentSrc 会保留实际播放地址，供浏览器内置投屏功能读取。
                const nativePlaybackUrl = buildNativeHlsPlaybackUrl(url);
                video.src = nativePlaybackUrl;
                ensureVideoSource(video, nativePlaybackUrl);
                video.load();
                return;
              }

              if (!Hls) {
                console.error('HLS.js 未加载');
                return;
              }

              if (video.hls) {
                video.hls.destroy();
              }

              // 每次创建HLS实例时，都读取最新的blockAdEnabled状态
              const shouldUseCustomLoader = blockAdEnabledRef.current;

              // 从localStorage读取缓冲策略
              const bufferStrategy = typeof window !== 'undefined'
                ? localStorage.getItem('bufferStrategy') || 'medium'
                : 'medium';

              // 根据缓冲策略配置不同的缓冲参数
              const getBufferConfig = (strategy: string) => {
                switch (strategy) {
                  case 'low':
                    return {
                      maxBufferLength: 15,
                      backBufferLength: 15,
                      maxBufferSize: 30 * 1000 * 1000, // ~30MB
                    };
                  case 'medium':
                    return {
                      maxBufferLength: 30,
                      backBufferLength: 30,
                      maxBufferSize: 60 * 1000 * 1000, // ~60MB
                    };
                  case 'high':
                    return {
                      maxBufferLength: 60,
                      backBufferLength: 40,
                      maxBufferSize: 120 * 1000 * 1000, // ~120MB
                    };
                  case 'ultra':
                    return {
                      maxBufferLength: 120,
                      backBufferLength: 60,
                      maxBufferSize: 240 * 1000 * 1000, // ~240MB
                    };
                  default:
                    return {
                      maxBufferLength: 30,
                      backBufferLength: 30,
                      maxBufferSize: 60 * 1000 * 1000,
                    };
                }
              };

              const bufferConfig = getBufferConfig(bufferStrategy);

              // 选择合适的 Loader
              let loaderClass;
              if (shouldUseCustomLoader) {
                // 使用自定义广告过滤 Loader
                loaderClass = CustomHlsJsLoader;
              } else {
                // 使用默认 Loader
                loaderClass = Hls.DefaultConfig.loader;
              }

              const hls = new Hls({
                debug: false, // 关闭日志
                enableWorker: true, // WebWorker 解码，降低主线程压力
                // 点播播放不需要 LL-HLS，小缓冲在 Safari 高倍速下更容易抖动。
                lowLatencyMode: false,
                autoStartLoad: true,

                /* 缓冲/内存相关 - 根据用户设置的缓冲策略动态调整 */
                maxBufferLength: bufferConfig.maxBufferLength, // 前向缓冲长度
                backBufferLength: bufferConfig.backBufferLength, // 已播放内容保留长度
                maxBufferSize: bufferConfig.maxBufferSize, // 最大缓冲大小

                /* 自定义loader */
                loader: loaderClass as any,
              });

              const kickStartHlsPlayback = () => {
                try {
                  hls.startLoad(-1);
                } catch (error) {
                  console.warn('[HLS] startLoad failed:', error);
                }

                if (!video.paused) {
                  video.play().catch((error) => {
                    console.warn('[HLS] play after attach failed:', error);
                  });
                }
              };

              hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                kickStartHlsPlayback();
              });

              // 先暴露真实 m3u8 source，供浏览器的投屏/外部播放器在
              // hls.js 将 video.currentSrc 切换为 blob: URL 前完成识别。
              video.hls = hls;
              ensureVideoSource(video, url);
              hls.loadSource(url);
              hls.attachMedia(video);

              if (isWebkit) {
                schedulePlayerTimeout(() => {
                  if (!shouldRescueWebkitHls(video)) {
                    return;
                  }

                  console.warn('[HLS] Safari attach watchdog triggered, forcing reattach');
                  try {
                    hls.detachMedia();
                    hls.attachMedia(video);
                    kickStartHlsPlayback();
                  } catch (error) {
                    console.warn('[HLS] Safari attach reattach failed:', error);
                  }
                }, 3000);
              }

              // 额外确保 iOS 内联播放属性（防止全屏时使用系统播放器）
              video.setAttribute('playsinline', 'true');
              video.setAttribute('webkit-playsinline', 'true');
              (video as any).playsInline = true;
              (video as any).webkitPlaysInline = true;

              // 监听Manifest加载完成事件，启动xiaoya链接定时刷新
              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('[HLS] Manifest解析完成');

                const player = artPlayerRef.current;
                if (video.paused && (player?.option.autoplay || player?.loading)) {
                  try {
                    Promise.resolve(player?.play?.()).catch((error) => {
                      console.warn('[HLS] play after manifest parsed failed:', error);
                    });
                  } catch (error) {
                    console.warn('[HLS] play after manifest parsed failed:', error);
                  }
                }

                // 兜底：若 updateVideoUrl 时尚未启定时器，在 manifest 解析后再启
                // xiaoya：仅 m3u8；openlist：refresh14m 即可（此回调本身已在 HLS 路径）
                if (
                  isInitialLoadRef.current &&
                  currentXiaoyaUrlRef.current &&
                  shouldStartLinkRefreshTimer(url)
                ) {
                  isInitialLoadRef.current = false;
                  startRefreshTimer(hls, video);
                }
              });

              hls.on(Hls.Events.ERROR, function (event: any, data: any) {
                console.error('HLS Error:', event, data);
                if (data.fatal) {
                  switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                      // 检查是否是 manifest 加载错误（通常是 403/404/CORS 错误）
                      if (data.details === 'manifestLoadError') {
                        console.log('Manifest 加载失败：可能是 403/404 或 CORS 错误');

                        const statusCode = data.response?.code || data.response?.status;

                        // 如果是403且是xiaoya源的m3u8，尝试自动刷新
                        if (statusCode === 403 && currentXiaoyaUrlRef.current) {
                          const isM3u8 = url.includes('.m3u8') || url.includes('m3u8');
                          if (isM3u8) {
                            console.log('[HLS错误] 检测到403，尝试刷新链接');
                            refreshXiaoyaUrl(hls, video, false);
                            return; // 不执行后续的错误处理
                          }
                        }

                        // 原有的错误处理逻辑
                        hls.destroy();
                        if (statusCode === 403) {
                          setVideoError('访问被拒绝 (403)');
                        } else if (statusCode === 404) {
                          setVideoError('视频不存在 (404)');
                        } else if (statusCode === 415) {
                          setVideoError('视频格式不兼容 (415)');
                        } else if (statusCode) {
                          setVideoError(`HTTP ${statusCode} 错误`);
                        } else {
                          // CORS 错误或其他网络错误
                          // 如果是直链直连模式（URL 不含代理前缀），记录原始 URL 以便用户一键启用代理
                          if (currentSourceRef.current === 'directplay' && !url.includes('/api/proxy-m3u8') && !url.includes('/api/proxy/vod/m3u8')) {
                            setCorsFailedUrl(url);
                          }
                          setVideoError('无法访问视频源（可能是跨域限制或访问被拒绝）');
                        }
                        return;
                      }
                      // 检查其他 HTTP 错误状态码
                      {
                        const statusCode = data.response?.code || data.response?.status;
                        if (statusCode && statusCode >= 400) {
                          console.log(`HTTP ${statusCode} 错误`);
                          hls.destroy();
                          setVideoError(`HTTP ${statusCode} 错误`);
                          return;
                        }
                      }
                      console.log('网络错误，尝试恢复...');
                      hls.startLoad();
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      console.log('媒体错误，尝试恢复...');
                      hls.recoverMediaError();
                      break;
                    default:
                      console.log('无法恢复的错误');
                      hls.destroy();
                      setVideoError('视频加载错误');
                      break;
                  }
                }
              });
            },
          },
          plugins: [
            ...(isPlaybackThumbnailDisabled()
              ? []
              : [
                  artplayerPluginAutoThumbnail({
                    width: 160,
                    number: 100,
                    scale: 1,
                  }),
                ]),
            artplayerPluginDanmuku({
              danmuku: [],
              speed: danmakuSettingsRef.current.speed,
              opacity: danmakuSettingsRef.current.opacity,
              fontSize: danmakuSettingsRef.current.fontSize,
              color: '#FFFFFF',
              mode: 0,
              margin: [danmakuSettingsRef.current.marginTop, danmakuSettingsRef.current.marginBottom],
              antiOverlap: true,
              synchronousPlayback: danmakuSettingsRef.current.synchronousPlayback,
              emitter: false,
              heatmap: false, // 禁用 artplayer 自带热力图，使用自定义热力图
              // 主题
              theme: 'dark',
              // 根据保存的显示状态设置初始可见性
              visible: danmakuDisplayStateRef.current,
              filter: (danmu: any) => {
                // 应用过滤规则
                const filterConfig = danmakuFilterConfigRef.current;
                if (filterConfig && filterConfig.rules.length > 0) {
                  for (const rule of filterConfig.rules) {
                    // 跳过未启用的规则
                    if (!rule.enabled) continue;

                    try {
                      if (rule.type === 'normal') {
                        // 普通模式：字符串包含匹配
                        if (danmu.text.includes(rule.keyword)) {
                          return false;
                        }
                      } else if (rule.type === 'regex') {
                        // 正则模式：正则表达式匹配
                        if (new RegExp(rule.keyword).test(danmu.text)) {
                          return false;
                        }
                      }
                    } catch (e) {
                      console.error('弹幕过滤规则错误:', e);
                    }
                  }
                }
                return true;
              },
            }),
          ],
          icons: {
            loading:
              '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cGF0aCBkPSJNMjUuMjUxIDYuNDYxYy0xMC4zMTggMC0xOC42ODMgOC4zNjUtMTguNjgzIDE4LjY4M2g0LjA2OGMwLTguMDcgNi41NDUtMTQuNjE1IDE0LjYxNS0xNC42MTVWNi40NjF6IiBmaWxsPSIjMDA5Njg4Ij48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIGF0dHJpYnV0ZVR5cGU9IlhNTCIgZHVyPSIxcyIgZnJvbT0iMCAyNSAyNSIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHRvPSIzNjAgMjUgMjUiIHR5cGU9InJvdGF0ZSIvPjwvcGF0aD48L3N2Zz4=">',
          },
          settings: [
            {
              html: '去广告',
              icon: '<text x="50%" y="50%" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#ffffff">AD</text>',
              tooltip: blockAdEnabled ? '已开启' : '已关闭',
              onClick() {
                const newVal = !blockAdEnabled;
                try {
                  localStorage.setItem('enable_blockad', String(newVal));
                  if (artPlayerRef.current) {
                    resumeTimeRef.current = artPlayerRef.current.currentTime;
                    if (
                      artPlayerRef.current.video &&
                      artPlayerRef.current.video.hls
                    ) {
                      artPlayerRef.current.video.hls.destroy();
                    }
                    artPlayerRef.current.destroy();
                    artPlayerRef.current = null;
                  }
                  setBlockAdEnabled(newVal);
                } catch (_) {
                  // ignore
                }
                return newVal ? '当前开启' : '当前关闭';
              },
            },
            {
              html: '弹幕过滤',
              icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#ffffff"/><path d="M8 12h8" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>',
              tooltip: '配置弹幕过滤规则',
              onClick() {
                // 如果播放器处于全屏状态，先退出全屏
                if (artPlayerRef.current && artPlayerRef.current.fullscreen) {
                  artPlayerRef.current.fullscreen = false;
                  // 延迟一下再显示弹窗，确保全屏退出动画完成
                  setTimeout(() => {
                    setShowDanmakuFilterSettings(true);
                  }, 300);
                } else {
                  setShowDanmakuFilterSettings(true);
                }
                return '打开设置';
              },
            },
            // 热力图开关（仅在未禁用时显示）
            ...(!danmakuHeatmapDisabledRef.current ? [{
              name: '弹幕热力',
              html: '弹幕热力',
              icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" fill="#ffffff"/></svg>',
              switch: danmakuHeatmapEnabledRef.current,
              onSwitch: function (item: any) {
                const newVal = !item.switch;
                try {
                  localStorage.setItem('danmaku_heatmap_enabled', String(newVal));
                  setDanmakuHeatmapEnabled(newVal);
                  console.log('弹幕热力已', newVal ? '开启' : '关闭');
                } catch (err) {
                  console.error('切换弹幕热力失败:', err);
                }
                return newVal;
              },
            }] : []),
            ...(webGPUSupported ? [
              {
                name: 'Anime4K超分',
                html: 'Anime4K超分',
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-4 0-7-3-7-7V9l7-3.5L19 9v4c0 4-3 7-7 7z" fill="#ffffff"/><path d="M10 12l2 2 4-4" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                switch: anime4kEnabledRef.current,
                onSwitch: async function (item: any) {
                  const newVal = !item.switch;
                  await toggleAnime4K(newVal);
                  return newVal;
                },
              },
              {
                name: '超分模式',
                html: '超分模式',
                selector: [
                  {
                    html: 'ModeA (快速)',
                    value: 'ModeA',
                    default: anime4kModeRef.current === 'ModeA',
                  },
                  {
                    html: 'ModeB (平衡)',
                    value: 'ModeB',
                    default: anime4kModeRef.current === 'ModeB',
                  },
                  {
                    html: 'ModeC (质量)',
                    value: 'ModeC',
                    default: anime4kModeRef.current === 'ModeC',
                  },
                  {
                    html: 'ModeAA (增强快速)',
                    value: 'ModeAA',
                    default: anime4kModeRef.current === 'ModeAA',
                  },
                  {
                    html: 'ModeBB (增强平衡)',
                    value: 'ModeBB',
                    default: anime4kModeRef.current === 'ModeBB',
                  },
                  {
                    html: 'ModeCA (最高质量)',
                    value: 'ModeCA',
                    default: anime4kModeRef.current === 'ModeCA',
                  },
                ],
                onSelect: async function (item: any) {
                  await changeAnime4KMode(item.value);
                  return item.html;
                },
              },
              {
                name: '超分倍数',
                html: '超分倍数',
                selector: [
                  {
                    html: '1.5x',
                    value: '1.5',
                    default: anime4kScaleRef.current === 1.5,
                  },
                  {
                    html: '2.0x',
                    value: '2.0',
                    default: anime4kScaleRef.current === 2.0,
                  },
                  {
                    html: '3.0x',
                    value: '3.0',
                    default: anime4kScaleRef.current === 3.0,
                  },
                  {
                    html: '4.0x',
                    value: '4.0',
                    default: anime4kScaleRef.current === 4.0,
                  },
                ],
                onSelect: async function (item: any) {
                  await changeAnime4KScale(parseFloat(item.value));
                  return item.html;
                },
              }
            ] : []),
            {
              name: '跳过片头片尾',
              html: '跳过片头片尾',
              switch: skipConfigRef.current.enable,
              onSwitch: function (item: any) {
                const newConfig = {
                  ...skipConfigRef.current,
                  enable: !item.switch,
                };
                handleSkipConfigChange(newConfig);
                return !item.switch;
              },
            },
            {
              name: '快捷快进配置',
              html: '快捷快进配置',
              icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5v14" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/><path d="m16 17 5-5-5-5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12H9" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>',
              tooltip: `${formatQuickForwardDuration(quickForwardSecondsRef.current)}`,
              onClick: async function () {
                const player = artPlayerRef.current;
                if (player?.fullscreen) {
                  player.fullscreen = false;
                  await new Promise(resolve => setTimeout(resolve, 300));
                }

                const existingDialog = document.querySelector('.quick-forward-settings-dialog');
                existingDialog?.remove();

                const container = document.createElement('div');
                container.className = 'quick-forward-settings-dialog';
                container.style.cssText = `
                  position: fixed;
                  inset: 0;
                  z-index: 10000;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 16px;
                  background: rgba(0, 0, 0, 0.6);
                  backdrop-filter: blur(3px);
                `;
                container.innerHTML = `
                  <div role="dialog" aria-modal="true" style="width: min(360px, 100%); background: #1f2937; color: #fff; border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 20px; box-shadow: 0 16px 48px rgba(0,0,0,.45);">
                    <div style="font-size: 17px; font-weight: 600; margin-bottom: 8px;">快捷快进设置</div>
                    <div style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">设置点击底部按钮或按 P 键时向前跳转的时间。</div>
                    <label for="quick-forward-input" style="display: block; color: #d1d5db; font-size: 13px; margin-bottom: 6px;">快进时长（秒）</label>
                    <input id="quick-forward-input" type="number" min="1" step="1" value="${quickForwardSecondsRef.current}" style="box-sizing: border-box; width: 100%; height: 40px; padding: 0 10px; border: 1px solid #4b5563; border-radius: 6px; background: #111827; color: #fff; font-size: 14px; outline: none;" />
                    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px;">
                      <button type="button" data-action="cancel" style="height: 36px; padding: 0 14px; border: 0; border-radius: 6px; background: #374151; color: #fff; cursor: pointer;">取消</button>
                      <button type="button" data-action="confirm" style="height: 36px; padding: 0 14px; border: 0; border-radius: 6px; background: #0d9488; color: #fff; cursor: pointer;">保存</button>
                    </div>
                  </div>
                `;
                document.body.appendChild(container);

                const input = container.querySelector('#quick-forward-input') as HTMLInputElement;
                const cancelButton = container.querySelector('[data-action="cancel"]');
                const confirmButton = container.querySelector('[data-action="confirm"]');
                const cleanup = () => container.remove();
                const save = () => {
                  const normalizedSeconds = normalizeStoredSeconds(Number(input.value));
                  if (normalizedSeconds === null) {
                    input.focus();
                    if (artPlayerRef.current) {
                      artPlayerRef.current.notice.show = '请输入大于 0 的有效秒数';
                    }
                    return;
                  }

                  setQuickForwardSeconds(normalizedSeconds);
                  quickForwardSecondsRef.current = normalizedSeconds;
                  localStorage.setItem(QUICK_FORWARD_STORAGE_KEY, String(normalizedSeconds));
                  if (artPlayerRef.current) {
                    artPlayerRef.current.notice.show = `快捷快进已设置为${formatQuickForwardDuration(normalizedSeconds)}`;
                  }
                  cleanup();
                };

                cancelButton?.addEventListener('click', cleanup);
                confirmButton?.addEventListener('click', save);
                container.addEventListener('click', (event) => {
                  if (event.target === container) cleanup();
                });
                input.addEventListener('keydown', (event) => {
                  if (event.key === 'Enter') save();
                  if (event.key === 'Escape') cleanup();
                });
                input.focus();
                input.select();
                return '打开设置';
              },
            },
            {
              name: '快进/倒退时间',
              html: '快进/倒退时间',
              icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m4 12 6-6v12l-6-6Z" fill="#ffffff"/><path d="m20 12-6-6v12l6-6Z" fill="#ffffff"/></svg>',
              tooltip: `${formatQuickForwardDuration(seekStepSecondsRef.current)}`,
              onClick: async function () {
                const player = artPlayerRef.current;
                if (player?.fullscreen) {
                  player.fullscreen = false;
                  await new Promise(resolve => setTimeout(resolve, 300));
                }

                const existingDialog = document.querySelector('.seek-step-settings-dialog');
                existingDialog?.remove();

                const container = document.createElement('div');
                container.className = 'seek-step-settings-dialog';
                container.style.cssText = `
                  position: fixed;
                  inset: 0;
                  z-index: 10000;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 16px;
                  background: rgba(0, 0, 0, 0.6);
                  backdrop-filter: blur(3px);
                `;
                container.innerHTML = `
                  <div role="dialog" aria-modal="true" style="width: min(360px, 100%); background: #1f2937; color: #fff; border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 20px; box-shadow: 0 16px 48px rgba(0,0,0,.45);">
                    <div style="font-size: 17px; font-weight: 600; margin-bottom: 8px;">快进/倒退时间</div>
                    <div style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">设置左右方向键快进 / 快退的时间。</div>
                    <label for="seek-step-input" style="display: block; color: #d1d5db; font-size: 13px; margin-bottom: 6px;">时长（秒）</label>
                    <input id="seek-step-input" type="number" min="1" step="1" value="${seekStepSecondsRef.current}" style="box-sizing: border-box; width: 100%; height: 40px; padding: 0 10px; border: 1px solid #4b5563; border-radius: 6px; background: #111827; color: #fff; font-size: 14px; outline: none;" />
                    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px;">
                      <button type="button" data-action="cancel" style="height: 36px; padding: 0 14px; border: 0; border-radius: 6px; background: #374151; color: #fff; cursor: pointer;">取消</button>
                      <button type="button" data-action="confirm" style="height: 36px; padding: 0 14px; border: 0; border-radius: 6px; background: #0d9488; color: #fff; cursor: pointer;">保存</button>
                    </div>
                  </div>
                `;
                document.body.appendChild(container);

                const input = container.querySelector('#seek-step-input') as HTMLInputElement;
                const cancelButton = container.querySelector('[data-action="cancel"]');
                const confirmButton = container.querySelector('[data-action="confirm"]');
                const cleanup = () => container.remove();
                const save = () => {
                  const normalizedSeconds = normalizeStoredSeconds(Number(input.value));
                  if (normalizedSeconds === null) {
                    input.focus();
                    if (artPlayerRef.current) {
                      artPlayerRef.current.notice.show = '请输入大于 0 的有效秒数';
                    }
                    return;
                  }

                  setSeekStepSeconds(normalizedSeconds);
                  seekStepSecondsRef.current = normalizedSeconds;
                  localStorage.setItem(SEEK_STEP_STORAGE_KEY, String(normalizedSeconds));
                  if (artPlayerRef.current) {
                    artPlayerRef.current.notice.show = `快进/倒退时间已设为${formatQuickForwardDuration(normalizedSeconds)}`;
                  }
                  cleanup();
                };

                cancelButton?.addEventListener('click', cleanup);
                confirmButton?.addEventListener('click', save);
                container.addEventListener('click', (event) => {
                  if (event.target === container) cleanup();
                });
                input.addEventListener('keydown', (event) => {
                  if (event.key === 'Enter') save();
                  if (event.key === 'Escape') cleanup();
                });
                input.focus();
                input.select();
                return '打开设置';
              },
            },
            {
              name: '跳过配置',
              html: '跳过配置',
              icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="12" r="2" fill="#ffffff"/><path d="M9 12L15 12" stroke="#ffffff" stroke-width="2"/><circle cx="19" cy="12" r="2" fill="#ffffff"/></svg>',
              tooltip:
                skipConfigRef.current.intro_time === 0 && skipConfigRef.current.outro_time === 0
                  ? '设置跳过配置'
                  : `片头: ${formatTime(skipConfigRef.current.intro_time)} | 片尾: ${formatTime(Math.abs(skipConfigRef.current.outro_time))}`,
              onClick: async function () {
                const player = artPlayerRef.current;
                if (player) {
                  // 如果处于全屏状态，先退出全屏
                  if (player.fullscreen) {
                    player.fullscreen = false;
                    // 等待全屏退出动画完成
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }

                  // 使用 ArtPlayer 的 prompt 功能创建输入弹窗
                  const currentIntro = skipConfigRef.current.intro_time || 0;
                  const currentOutro = Math.abs(skipConfigRef.current.outro_time) || 0;

                  // 创建一个自定义的提示框
                  const container = document.createElement('div');
                  container.style.cssText = `
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  background: rgba(0, 0, 0, 0.9);
                  padding: 20px;
                  border-radius: 8px;
                  z-index: 9999;
                  min-width: 300px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                `;

                  container.innerHTML = `
                  <div style="color: white; margin-bottom: 15px; font-size: 16px; font-weight: bold; border-bottom: 1px solid #444; padding-bottom: 10px;">
                    跳过配置
                  </div>
                  <div style="color: #aaa; font-size: 13px; margin-bottom: 15px; line-height: 1.5;">
                    设置片头片尾跳过时间，到达时间自动跳过
                  </div>
                  <div style="margin-bottom: 10px;">
                    <label style="color: white; display: block; margin-bottom: 5px; font-size: 14px; font-weight: 500;">
                      片头时间 (秒)
                      <span style="color: #888; font-size: 12px; font-weight: normal; margin-left: 8px;">从视频开始跳过的时长</span>
                    </label>
                    <div style="display: flex; gap: 8px;">
                      <input id="intro-input" type="number" min="0" step="1" value="${currentIntro}" placeholder="如: 90"
                             style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid #444; background: #222; color: white; font-size: 14px;" />
                      <button id="set-intro-btn" style="padding: 8px 12px; border-radius: 4px; border: none; background: #007bff; color: white; cursor: pointer; font-size: 14px; white-space: nowrap;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 4px;">
                          <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
                          <path d="M12 6v6l4 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        当前时间
                      </button>
                    </div>
                  </div>
                  <div style="margin-bottom: 15px;">
                    <label style="color: white; display: block; margin-bottom: 5px; font-size: 14px; font-weight: 500;">
                      片尾时间 (秒)
                      <span style="color: #888; font-size: 12px; font-weight: normal; margin-left: 8px;">从视频结尾向前跳过的时长</span>
                    </label>
                    <div style="display: flex; gap: 8px;">
                      <input id="outro-input" type="number" min="0" step="1" value="${currentOutro}" placeholder="如: 120"
                             style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid #444; background: #222; color: white; font-size: 14px;" />
                      <button id="set-outro-btn" style="padding: 8px 12px; border-radius: 4px; border: none; background: #007bff; color: white; cursor: pointer; font-size: 14px; white-space: nowrap;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 4px;">
                          <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
                          <path d="M12 6v6l4 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        当前时间
                      </button>
                    </div>
                  </div>
                  <div style="background: rgba(0, 123, 255, 0.1); border-left: 3px solid #007bff; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
                    <div style="color: #88c0ff; font-size: 12px; line-height: 1.6;">
                      <div style="margin-bottom: 4px;">💡 <strong>提示：</strong></div>
                      <div>• 点击"当前时间"可快速设置为播放位置</div>
                      <div>• 片头90秒表示跳过前1分30秒</div>
                      <div>• 片尾120秒表示跳过最后2分钟</div>
                    </div>
                  </div>
                  <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #444; padding-top: 15px;">
                    <button id="cancel-btn" style="padding: 8px 16px; border-radius: 4px; border: none; background: #444; color: white; cursor: pointer; font-size: 14px; transition: background 0.2s;" onmouseover="this.style.background='#555'" onmouseout="this.style.background='#444'">取消</button>
                    <button id="clear-btn" style="padding: 8px 16px; border-radius: 4px; border: none; background: #d9534f; color: white; cursor: pointer; font-size: 14px; transition: background 0.2s;" onmouseover="this.style.background='#c9302c'" onmouseout="this.style.background='#d9534f'">清除</button>
                    <button id="confirm-btn" style="padding: 8px 16px; border-radius: 4px; border: none; background: #5cb85c; color: white; cursor: pointer; font-size: 14px; transition: background 0.2s;" onmouseover="this.style.background='#4cae4c'" onmouseout="this.style.background='#5cb85c'">确定</button>
                  </div>
                `;

                  document.body.appendChild(container);

                  const introInput = container.querySelector('#intro-input') as HTMLInputElement;
                  const outroInput = container.querySelector('#outro-input') as HTMLInputElement;
                  const setIntroBtn = container.querySelector('#set-intro-btn');
                  const setOutroBtn = container.querySelector('#set-outro-btn');
                  const cancelBtn = container.querySelector('#cancel-btn');
                  const clearBtn = container.querySelector('#clear-btn');
                  const confirmBtn = container.querySelector('#confirm-btn');

                  const cleanup = () => {
                    document.body.removeChild(container);
                  };

                  // 设置片头为当前时间
                  setIntroBtn?.addEventListener('click', () => {
                    const currentTime = player.currentTime || 0;
                    if (currentTime > 0) {
                      introInput.value = Math.floor(currentTime).toString();
                    }
                  });

                  // 设置片尾为当前时间到结束的时长
                  setOutroBtn?.addEventListener('click', () => {
                    if (player.duration && player.currentTime) {
                      const outroTime = player.duration - player.currentTime;
                      if (outroTime > 0) {
                        outroInput.value = Math.floor(outroTime).toString();
                      }
                    }
                  });

                  cancelBtn?.addEventListener('click', cleanup);

                  clearBtn?.addEventListener('click', () => {
                    handleSkipConfigChange({
                      enable: false,
                      intro_time: 0,
                      outro_time: 0,
                    });
                    cleanup();
                  });

                  confirmBtn?.addEventListener('click', () => {
                    const introTime = parseFloat(introInput.value) || 0;
                    const outroTime = parseFloat(outroInput.value) || 0;

                    const newConfig = {
                      ...skipConfigRef.current,
                      intro_time: introTime,
                      outro_time: outroTime > 0 ? -outroTime : 0,
                    };

                    handleSkipConfigChange(newConfig);
                    cleanup();
                  });

                  // 支持 Enter 键确认
                  const handleEnter = (e: KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      confirmBtn?.dispatchEvent(new Event('click'));
                    } else if (e.key === 'Escape') {
                      cancelBtn?.dispatchEvent(new Event('click'));
                    }
                  };

                  introInput.addEventListener('keydown', handleEnter);
                  outroInput.addEventListener('keydown', handleEnter);
                }
                return '';
              },
            },
          ],
          // 控制栏配置
          controls: [
            {
              position: 'left',
              index: 40,
              html: `<i class="art-icon flex quick-forward-control"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m16 17 5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></i>`,
              tooltip: '快捷快进',
              mounted: ($el: HTMLElement) => {
                $el.classList.add('quick-forward-control-wrapper');
                if (!document.getElementById('quick-forward-control-style')) {
                  const style = document.createElement('style');
                  style.id = 'quick-forward-control-style';
                  style.textContent = `
                    @media (max-width: 767px) and (orientation: portrait) {
                      .quick-forward-control-wrapper {
                        display: none !important;
                      }
                    }
                  `;
                  document.head.appendChild(style);
                }
              },
              click: function () {
                seekQuickForward();
              },
            },
            {
              position: 'left',
              index: 13,
              html: '<i class="art-icon flex"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor"/></svg></i>',
              tooltip: '播放下一集',
              click: function () {
                // 房员禁用下一集按钮
                if (playSync.shouldDisableControls) {
                  if (artPlayerRef.current) {
                    artPlayerRef.current.notice.show = '房员无法切换集数，请等待房主操作';
                  }
                  return;
                }
                handleNextEpisode();
              },
            },
            // iOS 设备上添加自定义全屏按钮（横屏和竖屏都显示）
            ...(isIOS ? [{
              position: 'right',
              index: 100,  // 大数字确保在设置按钮右边
              html: '<i class="art-icon ios-portrait-fullscreen"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/></svg></i>',
              tooltip: '全屏',
              style: {
                color: '#fff',
              },
              mounted: function ($el: HTMLElement) {
                // 添加 CSS 样式：横屏和竖屏都显示
                const style = document.createElement('style');
                style.textContent = `
                /* iOS 自定义全屏按钮在所有方向都显示 */
                .ios-portrait-fullscreen {
                  display: inline-flex !important;
                }
                /* iOS 全屏选择对话框样式（遵循项目统一风格） */
                .ios-fullscreen-dialog {
                  position: fixed;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: rgba(0, 0, 0, 0.6);
                  backdrop-filter: blur(4px);
                  z-index: 1000;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 16px;
                }
                .ios-fullscreen-dialog-content {
                  background: white;
                  border-radius: 16px;
                  max-width: 480px;
                  width: 100%;
                  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                  overflow: hidden;
                }
                .dark .ios-fullscreen-dialog-content {
                  background: rgb(31, 41, 55);
                }

                /* 标题栏 */
                .ios-fullscreen-dialog-header {
                  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                  padding: 20px 24px;
                }
                .ios-fullscreen-dialog-title {
                  font-size: 20px;
                  font-weight: 700;
                  color: white;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  margin-bottom: 6px;
                }
                .ios-fullscreen-dialog-title svg {
                  stroke: white;
                }
                .ios-fullscreen-dialog-subtitle {
                  font-size: 14px;
                  color: rgba(255, 255, 255, 0.9);
                  margin: 0;
                }

                /* 选项列表 */
                .ios-fullscreen-dialog-options {
                  padding: 16px;
                  display: flex;
                  flex-direction: column;
                  gap: 12px;
                }
                .ios-fullscreen-option {
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  padding: 16px;
                  background: rgb(249, 250, 251);
                  border: 2px solid transparent;
                  border-radius: 12px;
                  cursor: pointer;
                  transition: all 0.2s;
                  text-align: left;
                }
                .dark .ios-fullscreen-option {
                  background: rgba(55, 65, 81, 0.5);
                }
                .ios-fullscreen-option:hover {
                  background: rgb(243, 244, 246);
                  border-color: #22c55e;
                  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
                }
                .dark .ios-fullscreen-option:hover {
                  background: rgb(55, 65, 81);
                }
                .ios-fullscreen-option:active {
                  transform: scale(0.98);
                }

                /* 推荐选项 */
                .ios-fullscreen-option-recommended {
                  border-color: #22c55e;
                }

                /* 选项图标 */
                .ios-fullscreen-option-icon {
                  flex-shrink: 0;
                  width: 48px;
                  height: 48px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: white;
                  border-radius: 10px;
                  color: #22c55e;
                }
                .dark .ios-fullscreen-option-icon {
                  background: rgb(31, 41, 55);
                }
                .ios-fullscreen-option-recommended .ios-fullscreen-option-icon {
                  background: #22c55e;
                  color: white;
                }

                /* 选项内容 */
                .ios-fullscreen-option-content {
                  flex: 1;
                }
                .ios-fullscreen-option-title {
                  font-size: 16px;
                  font-weight: 600;
                  color: rgb(17, 24, 39);
                  margin-bottom: 4px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
                .dark .ios-fullscreen-option-title {
                  color: white;
                }
                .ios-fullscreen-option-badge {
                  display: inline-block;
                  padding: 2px 8px;
                  background: #22c55e;
                  color: white;
                  font-size: 12px;
                  font-weight: 500;
                  border-radius: 4px;
                }
                .ios-fullscreen-option-desc {
                  font-size: 13px;
                  color: rgb(107, 114, 128);
                  line-height: 1.4;
                }
                .dark .ios-fullscreen-option-desc {
                  color: rgb(156, 163, 175);
                }

                /* 箭头图标 */
                .ios-fullscreen-option-arrow {
                  flex-shrink: 0;
                  color: rgb(209, 213, 219);
                  transition: transform 0.2s;
                }
                .dark .ios-fullscreen-option-arrow {
                  color: rgb(75, 85, 99);
                }
                .ios-fullscreen-option:hover .ios-fullscreen-option-arrow {
                  transform: translateX(4px);
                  color: #22c55e;
                }

                /* 底部提示 */
                .ios-fullscreen-dialog-footer {
                  padding: 16px 24px;
                  background: rgb(249, 250, 251);
                  border-top: 1px solid rgb(229, 231, 235);
                  display: flex;
                  align-items: flex-start;
                  gap: 10px;
                  font-size: 12px;
                  color: rgb(107, 114, 128);
                  line-height: 1.5;
                }
                .dark .ios-fullscreen-dialog-footer {
                  background: rgba(17, 24, 39, 0.5);
                  border-top-color: rgb(55, 65, 81);
                  color: rgb(156, 163, 175);
                }
                .ios-fullscreen-dialog-footer svg {
                  flex-shrink: 0;
                  margin-top: 2px;
                  stroke: currentColor;
                }
              `;
                document.head.appendChild(style);
              },
              click: function () {
                if (!artPlayerRef.current) return;

                // 检测是否在 PWA 模式下
                const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  window.matchMedia('(display-mode: fullscreen)').matches ||
                  (window.navigator as any).standalone === true;

                // 检查是否已经在原生全屏状态
                const isInNativeFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);

                // 如果已经在原生全屏状态，退出原生全屏
                if (isInNativeFullscreen) {
                  const exitFullscreen = (document as any).exitFullscreen ||
                    (document as any).webkitExitFullscreen ||
                    (document as any).mozCancelFullScreen ||
                    (document as any).msExitFullscreen;
                  if (exitFullscreen) {
                    try {
                      const result = exitFullscreen.call(document);
                      if (result && typeof result.catch === 'function') {
                        result.catch((err: Error) => console.error('退出全屏失败:', err));
                      }
                    } catch (err) {
                      console.error('退出全屏失败:', err);
                    }
                  }
                  return;
                }

                // 如果已经在网页全屏状态，退出网页全屏
                if (artPlayerRef.current.fullscreenWeb) {
                  artPlayerRef.current.fullscreenWeb = false;
                  return;
                }

                // 如果在 PWA 模式下，直接使用容器全屏（可以隐藏状态栏）
                if (isPWA) {
                  const container = artPlayerRef.current.template.$container;
                  if (container && container.webkitEnterFullscreen) {
                    container.webkitEnterFullscreen().catch((err: Error) => {
                      console.error('PWA 全屏失败:', err);
                      // 如果失败，降级使用网页全屏
                      artPlayerRef.current.fullscreenWeb = true;
                    });
                  } else {
                    // 不支持原生全屏，使用网页全屏
                    artPlayerRef.current.fullscreenWeb = true;
                  }
                  return;
                }

                // 非 PWA 模式：创建对话框（使用项目统一风格）
                const dialog = document.createElement('div');
                dialog.className = 'ios-fullscreen-dialog';
                dialog.innerHTML = `
                <div class="ios-fullscreen-dialog-content">
                  <!-- 标题栏 -->
                  <div class="ios-fullscreen-dialog-header">
                    <h3 class="ios-fullscreen-dialog-title">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" stroke="currentColor" stroke-width="2" fill="none"/>
                      </svg>
                      选择全屏模式
                    </h3>
                    <p class="ios-fullscreen-dialog-subtitle">
                      由于 iOS 系统限制，原生全屏会使用系统播放器，将无法显示弹幕及使用部分播放器功能。网页全屏可能无法完全占满屏幕，但可保留所有功能。
                    </p>
                  </div>

                  <!-- 选项列表 -->
                  <div class="ios-fullscreen-dialog-options">
                    <!-- 网页全屏选项 -->
                    <button class="ios-fullscreen-option ios-fullscreen-option-recommended" data-action="web">
                      <div class="ios-fullscreen-option-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                          <path d="M7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div class="ios-fullscreen-option-content">
                        <div class="ios-fullscreen-option-title">
                          网页全屏
                          <span class="ios-fullscreen-option-badge">推荐</span>
                        </div>
                        <div class="ios-fullscreen-option-desc">
                          保留弹幕、控制栏等所有功能
                        </div>
                      </div>
                      <svg class="ios-fullscreen-option-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </button>

                    <!-- 原生全屏选项 -->
                    <button class="ios-fullscreen-option" data-action="native">
                      <div class="ios-fullscreen-option-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                      </div>
                      <div class="ios-fullscreen-option-content">
                        <div class="ios-fullscreen-option-title">
                          原生全屏
                        </div>
                        <div class="ios-fullscreen-option-desc">
                          使用系统播放器，部分功能不可用
                        </div>
                      </div>
                      <svg class="ios-fullscreen-option-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </button>
                  </div>

                  <!-- 底部提示 -->
                  <div class="ios-fullscreen-dialog-footer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                      <path d="M12 16v-4m0-4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span>将网站添加到主屏幕（PWA）后，网页全屏可以完全全屏</span>
                  </div>
                </div>
              `;

                // 添加到页面
                document.body.appendChild(dialog);

                // 点击背景关闭
                dialog.addEventListener('click', (e) => {
                  if (e.target === dialog) {
                    document.body.removeChild(dialog);
                  }
                });

                // 按钮点击事件
                const buttons = dialog.querySelectorAll('.ios-fullscreen-option');
                buttons.forEach(button => {
                  button.addEventListener('click', () => {
                    const action = button.getAttribute('data-action');

                    if (action === 'web') {
                      // 网页全屏
                      if (artPlayerRef.current) {
                        artPlayerRef.current.fullscreenWeb = true;
                      }
                    } else if (action === 'native') {
                      // 原生全屏（尝试使用浏览器的全屏 API）
                      if (artPlayerRef.current && artPlayerRef.current.template.$video) {
                        const videoElement = artPlayerRef.current.template.$video;
                        if (videoElement.requestFullscreen) {
                          videoElement.requestFullscreen();
                        } else if ((videoElement as any).webkitEnterFullscreen) {
                          (videoElement as any).webkitEnterFullscreen();
                        }
                      }
                    }

                    // 关闭对话框
                    document.body.removeChild(dialog);
                  });
                });
              },
            }] : []),
          ],
  };
}
