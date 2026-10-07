'use client';

import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings, X } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { AdminConfig } from '@/lib/admin.types';

import { adminButtonStyles, showError, useAdminAlert, useLoadingState } from '@/components/admin/shared';

interface DataSource {
  name: string;
  key: string;
  api: string;
  detail?: string;
  disabled?: boolean;
  from: 'config' | 'custom';
  proxyMode?: boolean;
  weight?: number;
  special?: boolean;
}

export const VideoSourceConfig = ({
  config,
  refreshConfig,
}: {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}) => {
  const { showAlert, alertElement } = useAdminAlert();
  const { isLoading, withLoading } = useLoadingState();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const [newSource, setNewSource] = useState<DataSource>({
    name: '',
    key: '',
    api: '',
    detail: '',
    disabled: false,
    from: 'config',
  });

  // 批量操作相关状态
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set()
  );

  // 使用 useMemo 计算全选状态，避免每次渲染都重新计算
  const selectAll = useMemo(() => {
    return selectedSources.size === sources.length && selectedSources.size > 0;
  }, [selectedSources.size, sources.length]);

  // 确认弹窗状态
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => undefined,
    onCancel: () => undefined,
  });

  // 有效性检测相关状态
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showSpecialSourcesModal, setShowSpecialSourcesModal] = useState(false);
  const [showClientAdSourcesModal, setShowClientAdSourcesModal] = useState(false);
  const [specialSourceDraftApis, setSpecialSourceDraftApis] = useState<string[]>([]);
  const [clientAdSourceDraftApis, setClientAdSourceDraftApis] = useState<string[]>([]);
  const [weightDraftSources, setWeightDraftSources] = useState<DataSource[]>(
    []
  );
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<
    Array<{
      key: string;
      name: string;
      status: 'valid' | 'no_results' | 'invalid' | 'validating';
      message: string;
      resultCount: number;
    }>
  >([]);

  // 一键批量操作的目标源：已禁用的、检测为无效的、检测为无法搜索的
  const disabledSourceKeys = useMemo(
    () => sources.filter((s) => s.disabled).map((s) => s.key),
    [sources]
  );
  const invalidSourceKeys = useMemo(
    () =>
      validationResults.filter((r) => r.status === 'invalid').map((r) => r.key),
    [validationResults]
  );
  const noResultSourceKeys = useMemo(
    () =>
      validationResults
        .filter((r) => r.status === 'no_results')
        .map((r) => r.key),
    [validationResults]
  );

  // dnd-kit 传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 轻微位移即可触发
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // 长按 150ms 后触发，避免与滚动冲突
        tolerance: 5,
      },
    })
  );

  // 初始化
  useEffect(() => {
    if (config?.SourceConfig) {
      setSources(config.SourceConfig);
      // 进入时重置 orderChanged
      setOrderChanged(false);
      // 重置选择状态
      setSelectedSources(new Set());
    }
  }, [config]);

  // 通用 API 请求
  const callSourceApi = async (body: Record<string, any>) => {
    try {
      const resp = await fetch('/api/admin/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `操作失败: ${resp.status}`);
      }

      // 获取响应数据
      const data = await resp.json();

      // 成功后刷新配置
      await refreshConfig();

      // 返回响应数据供调用者使用
      return data;
    } catch (err) {
      showError(err instanceof Error ? err.message : '操作失败');
      throw err; // 向上抛出方便调用处判断
    }
  };

  const handleToggleEnable = (key: string) => {
    const target = sources.find((s) => s.key === key);
    if (!target) return;
    const action = target.disabled ? 'enable' : 'disable';
    withLoading(`toggleSource_${key}`, () =>
      callSourceApi({ action, key })
    ).catch(() => {
      console.error('操作失败', action, key);
    });
  };

  const handleDelete = (key: string) => {
    withLoading(`deleteSource_${key}`, () =>
      callSourceApi({ action: 'delete', key })
    ).catch(() => {
      console.error('操作失败', 'delete', key);
    });
  };

  const handleToggleProxyMode = (key: string) => {
    const target = sources.find((s) => s.key === key);
    if (!target) return;

    // 更新本地状态
    setSources((prev) =>
      prev.map((s) => (s.key === key ? { ...s, proxyMode: !s.proxyMode } : s))
    );

    // 调用API更新
    withLoading(`toggleProxyMode_${key}`, async () => {
      try {
        const response = await fetch('/api/admin/source', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'toggle_proxy_mode',
            key,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `操作失败: ${response.status}`);
        }

        await refreshConfig();
      } catch (error) {
        // 失败时回滚本地状态
        setSources((prev) =>
          prev.map((s) =>
            s.key === key ? { ...s, proxyMode: !s.proxyMode } : s
          )
        );
        showError(
          error instanceof Error ? error.message : '切换代理模式失败'
        );
        throw error;
      }
    }).catch(() => {
      console.error('操作失败', 'toggle_proxy_mode', key);
    });
  };


  const openSpecialSourcesModal = () => {
    setSpecialSourceDraftApis(config?.SpecialSourceApis || []);
    setShowSpecialSourcesModal(true);
  };

  const closeSpecialSourcesModal = () => {
    setShowSpecialSourcesModal(false);
    setSpecialSourceDraftApis([]);
  };

  const doSaveSpecialSources = async () => {
    await withLoading('saveSpecialSources', async () => {
      await callSourceApi({
        action: 'set_special_sources',
        keys: specialSourceDraftApis,
      });
      closeSpecialSourcesModal();
    }).catch(() => {
      console.error('操作失败', 'set_special_sources');
    });
  };

  const openClientAdSourcesModal = () => {
    setClientAdSourceDraftApis(config?.ClientAdSourceApis || []);
    setShowClientAdSourcesModal(true);
  };

  const closeClientAdSourcesModal = () => {
    setShowClientAdSourcesModal(false);
    setClientAdSourceDraftApis([]);
  };

  const handleSaveClientAdSources = async () => {
    await withLoading('saveClientAdSources', async () => {
      await callSourceApi({
        action: 'set_client_ad_sources',
        keys: clientAdSourceDraftApis,
      });
      closeClientAdSourcesModal();
    }).catch(() => {
      console.error('操作失败', 'set_client_ad_sources');
    });
  };

  const handleSaveSpecialSources = async () => {
    const enabledSourceKeys =
      config?.SourceConfig?.filter((source) => !source.disabled).map(
        (source) => source.key
      ) || [];
    const selectedSet = new Set(specialSourceDraftApis);
    const selectedAllEnabledSources =
      enabledSourceKeys.length > 0 &&
      enabledSourceKeys.every((key) => selectedSet.has(key));

    if (selectedAllEnabledSources) {
      setConfirmModal({
        isOpen: true,
        title: '确认设置特殊源',
        message:
          '你已将全部启用的视频源设置为特殊源，未开启特殊源开关的用户可能无法使用搜索。确定要继续保存吗？',
        onConfirm: async () => {
          await doSaveSpecialSources();
          setConfirmModal({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: () => undefined,
            onCancel: () => undefined,
          });
        },
        onCancel: () => {
          setConfirmModal({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: () => undefined,
            onCancel: () => undefined,
          });
        },
      });
      return;
    }

    await doSaveSpecialSources();
  };

  const handleUpdateWeight = (key: string, weight: number) => {
    // 先乐观更新本地状态
    setSources((prev) =>
      prev.map((s) => (s.key === key ? { ...s, weight } : s))
    );

    // 调用API更新
    withLoading(`updateWeight_${key}`, async () => {
      try {
        const response = await fetch('/api/admin/source', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_weight',
            key,
            weight,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `操作失败: ${response.status}`);
        }

        await refreshConfig();
      } catch (error) {
        // 失败时回滚本地状态到配置中的值
        const originalWeight =
          config?.SourceConfig?.find((s) => s.key === key)?.weight ?? 0;
        setSources((prev) =>
          prev.map((s) =>
            s.key === key ? { ...s, weight: originalWeight } : s
          )
        );
        showError(
          error instanceof Error ? error.message : '更新权重失败'
        );
        throw error;
      }
    }).catch(() => {
      console.error('操作失败', 'update_weight', key, weight);
    });
  };

  const handleAddSource = () => {
    if (!newSource.name || !newSource.key || !newSource.api) return;
    withLoading('addSource', async () => {
      await callSourceApi({
        action: 'add',
        key: newSource.key,
        name: newSource.name,
        api: newSource.api,
        detail: newSource.detail,
      });
      setNewSource({
        name: '',
        key: '',
        api: '',
        detail: '',
        disabled: false,
        from: 'custom',
      });
      setShowAddForm(false);
    }).catch(() => {
      console.error('操作失败', 'add', newSource);
    });
  };

  const buildRecommendedWeightMap = useCallback((list: DataSource[]) => {
    const total = list.length;
    return new Map(
      list.map((source, index) => {
        const recommended =
          total <= 1
            ? 40
            : Math.round(((total - index - 1) * 40) / (total - 1));
        return [source.key, recommended];
      })
    );
  }, []);

  const applyRecommendedWeights = useCallback((list: DataSource[]) => {
    const total = list.length;
    return list.map((source, index) => ({
      ...source,
      weight:
        total <= 1 ? 40 : Math.round(((total - index - 1) * 40) / (total - 1)),
    }));
  }, []);

  const openWeightModal = useCallback(() => {
    setWeightDraftSources(sources.map((source) => ({ ...source })));
    setShowWeightModal(true);
  }, [sources]);

  const handleCloseWeightModal = useCallback(() => {
    setShowWeightModal(false);
    setWeightDraftSources([]);
  }, []);

  useEffect(() => {
    if (!showWeightModal) return;

    const isInsideAllowedScroll = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false;
      return !!target.parentElement?.closest('[data-weight-modal-scroll]');
    };

    const preventBackgroundScroll = (event: TouchEvent | WheelEvent) => {
      if (isInsideAllowedScroll(event.target)) return;
      event.preventDefault();
    };

    document.addEventListener('touchmove', preventBackgroundScroll, {
      passive: false,
    });
    document.addEventListener('wheel', preventBackgroundScroll, {
      passive: false,
    });

    return () => {
      document.removeEventListener(
        'touchmove',
        preventBackgroundScroll as EventListener
      );
      document.removeEventListener(
        'wheel',
        preventBackgroundScroll as EventListener
      );
    };
  }, [showWeightModal]);

  const handleWeightDraftChange = useCallback((key: string, weight: number) => {
    setWeightDraftSources((prev) =>
      prev.map((source) =>
        source.key === key ? { ...source, weight } : source
      )
    );
  }, []);

  const handleApplyRecommendedWeights = useCallback(() => {
    setWeightDraftSources((prev) => applyRecommendedWeights(prev));
  }, [applyRecommendedWeights]);

  const handleResetWeightDraft = useCallback(() => {
    setWeightDraftSources(sources.map((source) => ({ ...source })));
  }, [sources]);

  const handleWeightModalDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setWeightDraftSources((prev) => {
        const oldIndex = prev.findIndex((source) => source.key === active.id);
        const newIndex = prev.findIndex((source) => source.key === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return applyRecommendedWeights(arrayMove(prev, oldIndex, newIndex));
      });
    },
    [applyRecommendedWeights]
  );

  const recommendedWeightMap = useMemo(
    () => buildRecommendedWeightMap(weightDraftSources),
    [buildRecommendedWeightMap, weightDraftSources]
  );

  const weightModalChanged = useMemo(() => {
    if (weightDraftSources.length !== sources.length) return false;
    return weightDraftSources.some((source, index) => {
      const current = sources[index];
      return (
        !current ||
        current.key !== source.key ||
        (current.weight ?? 0) !== (source.weight ?? 0)
      );
    });
  }, [sources, weightDraftSources]);

  const handleSaveWeightConfig = useCallback(() => {
    withLoading('saveWeightConfig', async () => {
      await callSourceApi({
        action: 'batch_update_weights',
        weights: weightDraftSources.map((source) => ({
          key: source.key,
          weight: source.weight ?? 0,
        })),
        order: weightDraftSources.map((source) => source.key),
      });
      setSources(weightDraftSources.map((source) => ({ ...source })));
      setOrderChanged(false);
      handleCloseWeightModal();
    }).catch(() => {
      console.error('操作失败', 'batch_update_weights');
    });
  }, [callSourceApi, handleCloseWeightModal, weightDraftSources, withLoading]);

  // 有效性检测函数
  const handleValidateSources = async () => {
    if (!searchKeyword.trim()) {
      showAlert({
        type: 'warning',
        title: '请输入搜索关键词',
        message: '搜索关键词不能为空',
      });
      return;
    }

    await withLoading('validateSources', async () => {
      setIsValidating(true);
      setValidationResults([]); // 清空之前的结果
      setShowValidationModal(false); // 立即关闭弹窗

      // 初始化所有视频源为检测中状态
      const initialResults = sources.map((source) => ({
        key: source.key,
        name: source.name,
        status: 'validating' as const,
        message: '检测中...',
        resultCount: 0,
      }));
      setValidationResults(initialResults);

      try {
        // 使用EventSource接收流式数据
        const eventSource = new EventSource(
          `/api/admin/source/validate?q=${encodeURIComponent(
            searchKeyword.trim()
          )}`
        );

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'start':
                console.log(`开始检测 ${data.totalSources} 个视频源`);
                break;

              case 'source_result':
              case 'source_error':
                // 更新验证结果
                setValidationResults((prev) => {
                  const existing = prev.find((r) => r.key === data.source);
                  if (existing) {
                    return prev.map((r) =>
                      r.key === data.source
                        ? {
                            key: data.source,
                            name:
                              sources.find((s) => s.key === data.source)
                                ?.name || data.source,
                            status: data.status,
                            message:
                              data.status === 'valid'
                                ? '搜索正常'
                                : data.status === 'no_results'
                                ? '无法搜索到结果'
                                : '连接失败',
                            resultCount: data.status === 'valid' ? 1 : 0,
                          }
                        : r
                    );
                  } else {
                    return [
                      ...prev,
                      {
                        key: data.source,
                        name:
                          sources.find((s) => s.key === data.source)?.name ||
                          data.source,
                        status: data.status,
                        message:
                          data.status === 'valid'
                            ? '搜索正常'
                            : data.status === 'no_results'
                            ? '无法搜索到结果'
                            : '连接失败',
                        resultCount: data.status === 'valid' ? 1 : 0,
                      },
                    ];
                  }
                });
                break;

              case 'complete':
                console.log(
                  `检测完成，共检测 ${data.completedSources} 个视频源`
                );
                eventSource.close();
                setIsValidating(false);
                break;
            }
          } catch (error) {
            console.error('解析EventSource数据失败:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('EventSource错误:', error);
          eventSource.close();
          setIsValidating(false);
          showAlert({
            type: 'error',
            title: '验证失败',
            message: '连接错误，请重试',
          });
        };

        // 设置超时，防止长时间等待
        setTimeout(() => {
          if (eventSource.readyState === EventSource.OPEN) {
            eventSource.close();
            setIsValidating(false);
            showAlert({
              type: 'warning',
              title: '验证超时',
              message: '检测超时，请重试',
            });
          }
        }, 60000); // 60秒超时
      } catch (error) {
        setIsValidating(false);
        showAlert({
          type: 'error',
          title: '验证失败',
          message: error instanceof Error ? error.message : '未知错误',
        });
        throw error;
      }
    });
  };

  // 获取有效性状态显示
  const getValidationStatus = (sourceKey: string) => {
    const result = validationResults.find((r) => r.key === sourceKey);
    if (!result) return null;

    switch (result.status) {
      case 'validating':
        return {
          text: '检测中',
          className:
            'bg-muted text-primary',
          icon: '⟳',
          message: result.message,
        };
      case 'valid':
        return {
          text: '有效',
          className:
            'bg-muted text-primary',
          icon: '✓',
          message: result.message,
        };
      case 'no_results':
        return {
          text: '无法搜索',
          className:
            'bg-muted/50 text-muted-foreground',
          icon: '⚠',
          message: result.message,
        };
      case 'invalid':
        return {
          text: '无效',
          className:
            'bg-destructive/10 text-destructive',
          icon: '✗',
          message: result.message,
        };
      default:
        return null;
    }
  };

  const WeightModalInput = memo(
    ({ sourceKey, weight }: { sourceKey: string; weight: number }) => {
      const [localWeight, setLocalWeight] = useState(weight);

      useEffect(() => {
        setLocalWeight(weight);
      }, [weight]);

      const commitWeight = (value: number) => {
        const clampedValue = Math.min(100, Math.max(0, value));
        setLocalWeight(clampedValue);
        handleWeightDraftChange(sourceKey, clampedValue);
      };

      return (
        <div
          className='flex items-center gap-3'
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <input
            type='range'
            min='0'
            max='100'
            value={localWeight}
            onChange={(e) => commitWeight(parseInt(e.target.value) || 0)}
            className='w-full accent-blue-600'
          />
          <input
            type='number'
            inputMode='numeric'
            min='0'
            max='100'
            value={localWeight}
            onChange={(e) => {
              const nextValue = parseInt(e.target.value) || 0;
              const clampedValue = Math.min(100, Math.max(0, nextValue));
              setLocalWeight(clampedValue);
            }}
            onBlur={(e) => commitWeight(parseInt(e.target.value) || 0)}
            className='w-20 px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent'
          />
        </div>
      );
    }
  );

  const WeightModalRow = memo(
    ({
      source,
      index,
      recommendedWeight,
    }: {
      source: DataSource;
      index: number;
      recommendedWeight: number;
    }) => {
      const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: source.key });

      const style = {
        transform: CSS.Transform.toString(transform),
        transition,
      } as React.CSSProperties;

      return (
        <div
          ref={setNodeRef}
          style={style}
          className='grid grid-cols-[88px_minmax(0,1fr)_112px_112px_220px] items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition hover:border-border hover:shadow'
        >
          <div
            className='flex items-center gap-3 text-sm text-muted-foreground cursor-grab'
            style={{ touchAction: 'none' }}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
            <span className='font-medium text-foreground '>
              #{index + 1}
            </span>
          </div>
          <div className='min-w-0'>
            <div className='truncate text-sm font-medium text-foreground '>
              {source.name}
            </div>
            <div className='truncate text-xs text-muted-foreground '>
              {source.key}
            </div>
          </div>
          <div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                source.disabled
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-primary'
              }`}
            >
              {source.disabled ? '已禁用' : '启用中'}
            </span>
          </div>
          <div>
            <span className='inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-primary'>
              {recommendedWeight}
            </span>
          </div>
          <WeightModalInput
            sourceKey={source.key}
            weight={source.weight ?? 0}
          />
        </div>
      );
    }
  );

  const SourceRow = memo(({ source }: { source: DataSource }) => {
    return (
      <tr className='hover:bg-muted/50 transition-colors'>
        <td className='px-2 py-4 text-center'>
          <input
            type='checkbox'
            checked={selectedSources.has(source.key)}
            onChange={(e) => handleSelectSource(source.key, e.target.checked)}
            className='w-4 h-4 text-primary bg-muted border-border rounded focus:ring-ring dark:ring-offset-gray-800 focus:ring-2'
          />
        </td>
        <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground '>
          {source.name}
        </td>
        <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground '>
          {source.key}
        </td>
        <td
          className='px-6 py-4 whitespace-nowrap text-sm text-foreground max-w-[12rem] truncate'
          title={source.api}
        >
          {source.api}
        </td>
        <td
          className='px-6 py-4 whitespace-nowrap text-sm text-foreground max-w-[8rem] truncate'
          title={source.detail || '-'}
        >
          {source.detail || '-'}
        </td>
        <td className='px-6 py-4 whitespace-nowrap max-w-[1rem]'>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              !source.disabled
                ? 'bg-muted text-primary'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {!source.disabled ? '启用中' : '已禁用'}
          </span>
        </td>
        <td className='px-6 py-4 whitespace-nowrap text-center'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleProxyMode(source.key);
            }}
            disabled={isLoading(`toggleProxyMode_${source.key}`)}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
              source.proxyMode
                ? 'bg-primary '
                : 'bg-muted '
            } ${
              isLoading(`toggleProxyMode_${source.key}`)
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
            title={source.proxyMode ? '代理模式已启用' : '代理模式已禁用'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                source.proxyMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </td>
        <td className='px-6 py-4 whitespace-nowrap max-w-[1rem]'>
          {(() => {
            const status = getValidationStatus(source.key);
            if (!status) {
              return (
                <span className='px-2 py-1 text-xs rounded-full bg-muted text-foreground'>
                  未检测
                </span>
              );
            }
            return (
              <span
                className={`px-2 py-1 text-xs rounded-full ${status.className}`}
                title={status.message}
              >
                {status.icon} {status.text}
              </span>
            );
          })()}
        </td>
        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2'>
          <button
            onClick={() => handleToggleEnable(source.key)}
            disabled={isLoading(`toggleSource_${source.key}`)}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
              !source.disabled
                ? adminButtonStyles.roundedDanger
                : adminButtonStyles.roundedSuccess
            } transition-colors ${
              isLoading(`toggleSource_${source.key}`)
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {!source.disabled ? '禁用' : '启用'}
          </button>
          {source.from !== 'config' && (
            <button
              onClick={() => handleDelete(source.key)}
              disabled={isLoading(`deleteSource_${source.key}`)}
              className={`${adminButtonStyles.roundedSecondary} ${
                isLoading(`deleteSource_${source.key}`)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              删除
            </button>
          )}
        </td>
      </tr>
    );
  });

  // 全选/取消全选
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allKeys = sources.map((s) => s.key);
        setSelectedSources(new Set(allKeys));
      } else {
        setSelectedSources(new Set());
      }
    },
    [sources]
  );

  // 单个选择
  const handleSelectSource = useCallback((key: string, checked: boolean) => {
    setSelectedSources((prev) => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(key);
      } else {
        newSelected.delete(key);
      }
      return newSelected;
    });
  }, []);

  // 批量操作
  const handleBatchOperation = async (
    action: 'batch_enable' | 'batch_disable' | 'batch_delete'
  ) => {
    if (selectedSources.size === 0) {
      showAlert({
        type: 'warning',
        title: '请先选择要操作的视频源',
        message: '请选择至少一个视频源',
      });
      return;
    }

    const keys = Array.from(selectedSources);
    let confirmMessage = '';
    let actionName = '';

    switch (action) {
      case 'batch_enable':
        confirmMessage = `确定要启用选中的 ${keys.length} 个视频源吗？`;
        actionName = '批量启用';
        break;
      case 'batch_disable':
        confirmMessage = `确定要禁用选中的 ${keys.length} 个视频源吗？`;
        actionName = '批量禁用';
        break;
      case 'batch_delete':
        confirmMessage = `确定要删除选中的 ${keys.length} 个视频源吗？此操作不可恢复！`;
        actionName = '批量删除';
        break;
    }

    // 显示确认弹窗
    setConfirmModal({
      isOpen: true,
      title: '确认操作',
      message: confirmMessage,
      onConfirm: async () => {
        try {
          const result = await withLoading(`batchSource_${action}`, () =>
            callSourceApi({ action, keys })
          );

          // 根据操作类型和结果显示不同的消息
          if (
            action === 'batch_delete' &&
            result?.deleted !== undefined &&
            result?.skipped !== undefined
          ) {
            const { deleted, skipped } = result;
            if (skipped > 0) {
              showAlert({
                type: 'warning',
                title: '批量删除完成',
                message: `成功删除了 ${deleted} 个视频源，跳过了 ${skipped} 个配置文件中的源（不可删除）`,
                timer: 3000,
              });
            } else if (deleted > 0) {
              showAlert({
                type: 'success',
                title: '批量删除成功',
                message: `成功删除了 ${deleted} 个视频源`,
                timer: 2000,
              });
            } else {
              showAlert({
                type: 'warning',
                title: '无法删除',
                message: '所选视频源均为配置文件中的源，不可删除',
                timer: 3000,
              });
            }
          } else {
            showAlert({
              type: 'success',
              title: `${actionName}成功`,
              message: `${actionName}了 ${keys.length} 个视频源`,
              timer: 2000,
            });
          }

          // 重置选择状态
          setSelectedSources(new Set());
        } catch (err) {
          showAlert({
            type: 'error',
            title: `${actionName}失败`,
            message: err instanceof Error ? err.message : '操作失败',
          });
        }
        setConfirmModal({
          isOpen: false,
          title: '',
          message: '',
          onConfirm: () => undefined,
          onCancel: () => undefined,
        });
      },
      onCancel: () => {
        setConfirmModal({
          isOpen: false,
          title: '',
          message: '',
          onConfirm: () => undefined,
          onCancel: () => undefined,
        });
      },
    });
  };

  // 一键批量：不依赖勾选，直接对给定的 keys 走已有的 batch_enable / batch_disable
  const handleQuickBatch = (
    action: 'batch_enable' | 'batch_disable',
    keys: string[],
    actionName: string,
    emptyMessage: string
  ) => {
    const closeConfirm = () =>
      setConfirmModal({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => undefined,
        onCancel: () => undefined,
      });

    if (keys.length === 0) {
      showAlert({
        type: 'warning',
        title: `没有需要${
          action === 'batch_enable' ? '启用' : '禁用'
        }的视频源`,
        message: emptyMessage,
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: '确认操作',
      message: `确定要${actionName}吗？共 ${keys.length} 个视频源。`,
      onConfirm: async () => {
        try {
          await withLoading(`batchSource_${action}`, () =>
            callSourceApi({ action, keys })
          );
          showAlert({
            type: 'success',
            title: `${actionName}成功`,
            message: `已处理 ${keys.length} 个视频源`,
            timer: 2000,
          });
          setSelectedSources(new Set());
        } catch (err) {
          showAlert({
            type: 'error',
            title: `${actionName}失败`,
            message: err instanceof Error ? err.message : '操作失败',
          });
        }
        closeConfirm();
      },
      onCancel: closeConfirm,
    });
  };

  if (!config) {
    return (
      <div className='text-center text-muted-foreground '>
        加载中...
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 添加视频源表单 */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <h4 className='shrink-0 whitespace-nowrap text-sm font-medium text-foreground '>
          视频源列表
        </h4>
        <div className='flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2'>
          {/* 批量操作按钮 - 移动端显示在下一行，PC端显示在左侧 */}
          {selectedSources.size > 0 && (
            <>
              <div className='flex flex-wrap items-center gap-3 order-2 sm:order-1'>
                <span className='text-sm text-foreground '>
                  <span className='sm:hidden'>已选 {selectedSources.size}</span>
                  <span className='hidden sm:inline'>
                    已选择 {selectedSources.size} 个视频源
                  </span>
                </span>
                <button
                  onClick={() => handleBatchOperation('batch_enable')}
                  disabled={isLoading('batchSource_batch_enable')}
                  className={`px-3 py-1 text-sm ${
                    isLoading('batchSource_batch_enable')
                      ? adminButtonStyles.disabled
                      : adminButtonStyles.success
                  }`}
                >
                  {isLoading('batchSource_batch_enable')
                    ? '启用中...'
                    : '批量启用'}
                </button>
                <button
                  onClick={() => handleBatchOperation('batch_disable')}
                  disabled={isLoading('batchSource_batch_disable')}
                  className={`px-3 py-1 text-sm ${
                    isLoading('batchSource_batch_disable')
                      ? adminButtonStyles.disabled
                      : adminButtonStyles.warning
                  }`}
                >
                  {isLoading('batchSource_batch_disable')
                    ? '禁用中...'
                    : '批量禁用'}
                </button>
                <button
                  onClick={() => handleBatchOperation('batch_delete')}
                  disabled={isLoading('batchSource_batch_delete')}
                  className={`px-3 py-1 text-sm ${
                    isLoading('batchSource_batch_delete')
                      ? adminButtonStyles.disabled
                      : adminButtonStyles.danger
                  }`}
                >
                  {isLoading('batchSource_batch_delete')
                    ? '删除中...'
                    : '批量删除'}
                </button>
              </div>
              <div className='hidden sm:block w-px h-6 bg-muted order-2'></div>
            </>
          )}
          <div className='flex w-full min-w-0 flex-col gap-2 order-1 sm:order-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2'>
            <div className='w-full min-w-0 sm:w-auto'>
              <div className='flex flex-wrap items-center justify-end gap-2'>
                <button
                  onClick={openSpecialSourcesModal}
                  className={`${adminButtonStyles.secondary} flex shrink-0 items-center gap-1.5 whitespace-nowrap`}
                  title='批量选择哪些视频源属于特殊源'
                >
                  <Settings size={14} />
                  <span>特殊源设置</span>
                  {(config?.SpecialSourceApis?.length || 0) > 0 && (
                    <span className='rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive'>
                      {config?.SpecialSourceApis?.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={openWeightModal}
                  className={`${adminButtonStyles.secondary} flex shrink-0 items-center gap-1.5 whitespace-nowrap`}
                  title='拖动排序并批量生成推荐权重'
                >
                  <Settings size={14} />
                  <span>权重设置</span>
                </button>
                <button
                  onClick={openClientAdSourcesModal}
                  className={`${adminButtonStyles.secondary} flex shrink-0 items-center gap-1.5 whitespace-nowrap`}
                  title='选择在手机/电视客户端播放时自动去广告的视频源'
                >
                  <Settings size={14} />
                  <span>客户端广告配置</span>
                  {(config?.ClientAdSourceApis?.length || 0) > 0 && (
                    <span className='rounded-full bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground'>
                      {config?.ClientAdSourceApis?.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className='w-full min-w-0 sm:w-auto'>
              <div className='flex flex-wrap items-center justify-end gap-2'>
                <button
                  onClick={() => setShowValidationModal(true)}
                  disabled={isValidating}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors flex shrink-0 items-center space-x-1 whitespace-nowrap ${
                    isValidating ? adminButtonStyles.disabled : adminButtonStyles.primary
                  }`}
                >
                  {isValidating ? (
                    <>
                      <div className='w-3 h-3 border border-white border-t-transparent rounded-full animate-spin'></div>
                      <span>检测中...</span>
                    </>
                  ) : (
                    '有效性检测'
                  )}
                </button>
                <button
                  onClick={() =>
                    handleQuickBatch(
                      'batch_enable',
                      disabledSourceKeys,
                      '启用全部源',
                      '所有视频源都已处于启用状态'
                    )
                  }
                  disabled={isLoading('batchSource_batch_enable')}
                  className={`${
                    isLoading('batchSource_batch_enable')
                      ? adminButtonStyles.disabled
                      : adminButtonStyles.success
                  } flex shrink-0 items-center gap-1.5 whitespace-nowrap`}
                  title='把所有已禁用的视频源一键启用'
                >
                  <span>
                    {isLoading('batchSource_batch_enable')
                      ? '启用中...'
                      : '启用全部源'}
                  </span>
                  {disabledSourceKeys.length > 0 && (
                    <span className='rounded-full bg-card/20 px-1.5 py-0.5 text-[10px] font-semibold'>
                      {disabledSourceKeys.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() =>
                    handleQuickBatch(
                      'batch_disable',
                      invalidSourceKeys,
                      '禁用无效源',
                      '当前没有检测为无效的视频源，请先执行「有效性检测」'
                    )
                  }
                  disabled={
                    isValidating || isLoading('batchSource_batch_disable')
                  }
                  className={`${
                    isValidating || isLoading('batchSource_batch_disable')
                      ? adminButtonStyles.disabled
                      : adminButtonStyles.danger
                  } flex shrink-0 items-center gap-1.5 whitespace-nowrap`}
                  title='禁用有效性检测中连接失败（无效）的视频源'
                >
                  <span>禁用无效源</span>
                  {invalidSourceKeys.length > 0 && (
                    <span className='rounded-full bg-card/20 px-1.5 py-0.5 text-[10px] font-semibold'>
                      {invalidSourceKeys.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() =>
                    handleQuickBatch(
                      'batch_disable',
                      noResultSourceKeys,
                      '禁用无法搜索源',
                      '当前没有检测为无法搜索的视频源，请先执行「有效性检测」'
                    )
                  }
                  disabled={
                    isValidating || isLoading('batchSource_batch_disable')
                  }
                  className={`${
                    isValidating || isLoading('batchSource_batch_disable')
                      ? adminButtonStyles.disabled
                      : adminButtonStyles.warning
                  } flex shrink-0 items-center gap-1.5 whitespace-nowrap`}
                  title='禁用有效性检测中能连通但搜不到结果的视频源'
                >
                  <span>禁用无法搜索源</span>
                  {noResultSourceKeys.length > 0 && (
                    <span className='rounded-full bg-card/20 px-1.5 py-0.5 text-[10px] font-semibold'>
                      {noResultSourceKeys.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={`${
                    showAddForm ? adminButtonStyles.secondary : adminButtonStyles.success
                  } shrink-0 whitespace-nowrap`}
                >
                  {showAddForm ? '取消' : '添加视频源'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className='p-4 bg-muted/50 rounded-lg border border-border space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <input
              type='text'
              placeholder='名称'
              value={newSource.name}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, name: e.target.value }))
              }
              className='px-3 py-2 border border-border rounded-lg bg-card text-foreground'
            />
            <input
              type='text'
              placeholder='Key'
              value={newSource.key}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, key: e.target.value }))
              }
              className='px-3 py-2 border border-border rounded-lg bg-card text-foreground'
            />
            <input
              type='text'
              placeholder='API 地址'
              value={newSource.api}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, api: e.target.value }))
              }
              className='px-3 py-2 border border-border rounded-lg bg-card text-foreground'
            />
            <input
              type='text'
              placeholder='Detail 地址（选填）'
              value={newSource.detail}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, detail: e.target.value }))
              }
              className='px-3 py-2 border border-border rounded-lg bg-card text-foreground'
            />
          </div>
          <div className='flex justify-end'>
            <button
              onClick={handleAddSource}
              disabled={
                !newSource.name ||
                !newSource.key ||
                !newSource.api ||
                isLoading('addSource')
              }
              className={`w-full sm:w-auto px-4 py-2 ${
                !newSource.name ||
                !newSource.key ||
                !newSource.api ||
                isLoading('addSource')
                  ? adminButtonStyles.disabled
                  : adminButtonStyles.success
              }`}
            >
              {isLoading('addSource') ? '添加中...' : '添加'}
            </button>
          </div>
        </div>
      )}

      {/* 视频源表格 */}
      <div
        className='border border-border rounded-lg max-h-[28rem] overflow-y-auto overflow-x-auto relative'
        data-table='source-list'
      >
        <table className='min-w-full divide-y divide-border '>
          <thead className='bg-muted/50 sticky top-0 z-sticky'>
            <tr>
              <th className='w-12 px-2 py-3 text-center'>
                <input
                  type='checkbox'
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className='w-4 h-4 text-primary bg-muted border-border rounded focus:ring-ring dark:ring-offset-gray-800 focus:ring-2'
                />
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                名称
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Key
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                API 地址
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Detail 地址
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                状态
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                代理模式
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                有效性
              </th>
              <th className='px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                操作
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border '>
            {sources.map((source) => (
              <SourceRow key={source.key} source={source} />
            ))}
          </tbody>
        </table>
      </div>


      {showSpecialSourcesModal &&
        createPortal(
          <div
            className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
            onClick={closeSpecialSourcesModal}
          >
            <div
              className='flex max-h-[84vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex items-start justify-between gap-4 border-b border-border px-6 py-5 '>
                <div>
                  <h3 className='text-xl font-semibold text-foreground '>
                    特殊源设置
                  </h3>
                  <p className='mt-1 text-sm text-foreground '>
                    选中的视频源对普通搜索完全隐藏，只在 /under 入口可用；/under 也不会出现普通源。开关状态见 /sp。
                  </p>
                </div>
                <button
                  onClick={closeSpecialSourcesModal}
                  className='text-2xl leading-none text-muted-foreground transition-colors hover:text-foreground '
                  aria-label='关闭特殊源设置弹窗'
                >
                  ×
                </button>
              </div>

              <div className='min-h-0 flex-1 overflow-y-auto px-6 py-5'>
                <div className='mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4'>
                  <div className='text-sm font-medium text-destructive '>
                    配置说明
                  </div>
                  <p className='mt-1 text-sm text-destructive '>
                    这里维护的是特殊源列表，不是用户权限；TVBox、OrionTV、WebTV 始终不会使用这些特殊源。
                  </p>
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {config?.SourceConfig?.map((source) => (
                    <label
                      key={source.key}
                      className='flex cursor-pointer items-center space-x-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50'
                    >
                      <input
                        type='checkbox'
                        checked={specialSourceDraftApis.includes(source.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSpecialSourceDraftApis((prev) =>
                              prev.includes(source.key) ? prev : [...prev, source.key]
                            );
                          } else {
                            setSpecialSourceDraftApis((prev) =>
                              prev.filter((api) => api !== source.key)
                            );
                          }
                        }}
                        className='rounded border-border text-destructive focus:ring-destructive'
                      />
                      <div className='min-w-0 flex-1'>
                        <div className='truncate text-sm font-medium text-foreground '>
                          {source.name}
                        </div>
                        <div className='truncate text-xs text-muted-foreground '>
                          {source.key}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className='flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/50 px-6 py-4'>
                <div className='flex flex-wrap gap-2'>
                  <button
                    onClick={() => setSpecialSourceDraftApis([])}
                    className={adminButtonStyles.quickAction}
                  >
                    全不选
                  </button>
                  <button
                    onClick={() => {
                      const allApis =
                        config?.SourceConfig?.filter((source) => !source.disabled).map(
                          (source) => source.key
                        ) || [];
                      setSpecialSourceDraftApis(allApis);
                    }}
                    className={adminButtonStyles.quickAction}
                  >
                    全选启用源
                  </button>
                </div>
                <div className='flex items-center gap-3'>
                  <span className='text-sm text-foreground '>
                    已选择：
                    <span className='font-medium text-destructive '>
                      {specialSourceDraftApis.length} 个源
                    </span>
                  </span>
                  <button onClick={closeSpecialSourcesModal} className={adminButtonStyles.secondary}>
                    取消
                  </button>
                  <button
                    onClick={handleSaveSpecialSources}
                    disabled={isLoading('saveSpecialSources')}
                    className={`px-4 py-2 ${
                      isLoading('saveSpecialSources')
                        ? adminButtonStyles.disabled
                        : adminButtonStyles.success
                    }`}
                  >
                    {isLoading('saveSpecialSources') ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {showClientAdSourcesModal &&
        createPortal(
          <div
            className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
            onClick={closeClientAdSourcesModal}
          >
            <div
              className='flex max-h-[84vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex items-start justify-between gap-4 border-b border-border px-6 py-5 '>
                <div>
                  <h3 className='text-xl font-semibold text-foreground '>
                    客户端去广告配置
                  </h3>
                  <p className='mt-1 text-sm text-muted-foreground '>
                    ⚠️客户端已具备本地去广告功能，该功能可能在未来移除
                  </p>
                </div>
                <button
                  onClick={closeClientAdSourcesModal}
                  className='text-2xl leading-none text-muted-foreground transition-colors hover:text-foreground '
                  aria-label='关闭客户端去广告配置弹窗'
                >
                  ×
                </button>
              </div>

              <div className='min-h-0 flex-1 overflow-y-auto px-6 py-5'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {config?.SourceConfig?.map((source) => (
                    <label
                      key={source.key}
                      className='flex cursor-pointer items-center space-x-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50'
                    >
                      <input
                        type='checkbox'
                        checked={clientAdSourceDraftApis.includes(source.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setClientAdSourceDraftApis((prev) =>
                              prev.includes(source.key) ? prev : [...prev, source.key]
                            );
                          } else {
                            setClientAdSourceDraftApis((prev) =>
                              prev.filter((api) => api !== source.key)
                            );
                          }
                        }}
                        className='rounded border-border text-muted-foreground focus:ring-ring'
                      />
                      <div className='min-w-0 flex-1'>
                        <div className='truncate text-sm font-medium text-foreground '>
                          {source.name}
                        </div>
                        <div className='truncate text-xs text-muted-foreground '>
                          {source.key}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className='flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/50 px-6 py-4'>
                <div className='flex flex-wrap gap-2'>
                  <button
                    onClick={() => setClientAdSourceDraftApis([])}
                    className={adminButtonStyles.quickAction}
                  >
                    全不选
                  </button>
                  <button
                    onClick={() => {
                      const allApis =
                        config?.SourceConfig?.filter((source) => !source.disabled).map(
                          (source) => source.key
                        ) || [];
                      setClientAdSourceDraftApis(allApis);
                    }}
                    className={adminButtonStyles.quickAction}
                  >
                    全选启用源
                  </button>
                </div>
                <div className='flex items-center gap-3'>
                  <span className='text-sm text-foreground '>
                    已选择：
                    <span className='font-medium text-muted-foreground '>
                      {clientAdSourceDraftApis.length} 个源
                    </span>
                  </span>
                  <button onClick={closeClientAdSourcesModal} className={adminButtonStyles.secondary}>
                    取消
                  </button>
                  <button
                    onClick={handleSaveClientAdSources}
                    disabled={isLoading('saveClientAdSources')}
                    className={`px-4 py-2 ${
                      isLoading('saveClientAdSources')
                        ? adminButtonStyles.disabled
                        : adminButtonStyles.success
                    }`}
                  >
                    {isLoading('saveClientAdSources') ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {showWeightModal &&
        createPortal(
          <>
            <div
              className='fixed inset-0 bg-black/60 backdrop-blur-sm z-modal'
              onClick={handleCloseWeightModal}
              onTouchMove={(e) => {
                e.preventDefault();
              }}
              onWheel={(e) => {
                e.preventDefault();
              }}
              style={{
                touchAction: 'none',
              }}
            />
            <div
              className='fixed left-1/2 top-1/2 z-modal flex w-[calc(100%-1rem)] max-w-6xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex items-start justify-between gap-4 border-b border-border px-6 py-5'>
                <div>
                  <h3 className='text-xl font-semibold text-foreground '>
                    视频源权重设置
                  </h3>
                </div>
                <button
                  onClick={handleCloseWeightModal}
                  className='text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none'
                  aria-label='关闭权重设置弹窗'
                >
                  ×
                </button>
              </div>

              <div
                className='flex-1 min-h-0 overflow-y-auto px-0 overscroll-contain'
                data-panel-content
                data-weight-modal-scroll
                onTouchMove={(e) => {
                  e.stopPropagation();
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                }}
                style={{
                  touchAction: 'pan-y',
                  overscrollBehavior: 'contain',
                }}
              >
                <div className='flex flex-wrap items-center justify-between gap-3 px-6 py-4'>
                  <div className='text-sm text-foreground '>
                    排序越靠前，推荐权重越高；拖动后再次生成推荐值时，会把当前列表均匀映射到
                    0~40。
                  </div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <button
                      onClick={handleApplyRecommendedWeights}
                      className={adminButtonStyles.primarySmall}
                    >
                      按当前顺序生成推荐权重
                    </button>
                    <button
                      onClick={handleResetWeightDraft}
                      className={adminButtonStyles.secondarySmall}
                    >
                      恢复当前配置
                    </button>
                  </div>
                </div>

                <div className='px-6 pb-6'>
                  <div className='overflow-x-auto'>
                    <div className='grid min-w-[820px] grid-cols-[88px_minmax(0,1fr)_112px_112px_220px] gap-3 px-4 pb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground '>
                      <div>排序</div>
                      <div>视频源</div>
                      <div>状态</div>
                      <div>推荐值</div>
                      <div>生效权重</div>
                    </div>
                    <div className='min-w-[820px] rounded-2xl border border-border bg-muted/50/50 p-3'>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleWeightModalDragEnd}
                        autoScroll={false}
                        modifiers={[
                          restrictToVerticalAxis,
                          restrictToParentElement,
                        ]}
                      >
                        <SortableContext
                          items={weightDraftSources.map((source) => source.key)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className='space-y-3'>
                            {weightDraftSources.map((source, index) => {
                              const recommendedWeight =
                                recommendedWeightMap.get(source.key) ?? 0;
                              return (
                                <WeightModalRow
                                  key={source.key}
                                  source={source}
                                  index={index}
                                  recommendedWeight={recommendedWeight}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-end gap-3 border-t border-border px-6 py-4'>
                <div className='flex items-center gap-3'>
                  <button
                    onClick={handleCloseWeightModal}
                    className={adminButtonStyles.secondary}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveWeightConfig}
                    disabled={
                      !weightModalChanged || isLoading('saveWeightConfig')
                    }
                    className={`px-4 py-2 ${
                      !weightModalChanged || isLoading('saveWeightConfig')
                        ? adminButtonStyles.disabled
                        : adminButtonStyles.success
                    }`}
                  >
                    {isLoading('saveWeightConfig') ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

      {/* 有效性检测弹窗 */}
      {showValidationModal &&
        createPortal(
          <div
            className='fixed inset-0 bg-black/50 flex items-center justify-center z-modal'
            onClick={() => setShowValidationModal(false)}
          >
            <div
              className='bg-card rounded-lg p-6 w-full max-w-md mx-4'
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className='text-lg font-medium text-foreground mb-4'>
                视频源有效性检测
              </h3>
              <p className='text-sm text-foreground mb-4'>
                请输入检测用的搜索关键词
              </p>
              <div className='space-y-4'>
                <input
                  type='text'
                  placeholder='请输入搜索关键词'
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className='w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground'
                  onKeyPress={(e) =>
                    e.key === 'Enter' && handleValidateSources()
                  }
                />
                <div className='flex justify-end space-x-3'>
                  <button
                    onClick={() => setShowValidationModal(false)}
                    className='px-4 py-2 text-foreground hover:text-foreground transition-colors'
                  >
                    取消
                  </button>
                  <button
                    onClick={handleValidateSources}
                    disabled={!searchKeyword.trim()}
                    className={`px-4 py-2 ${
                      !searchKeyword.trim()
                        ? adminButtonStyles.disabled
                        : adminButtonStyles.success
                    }`}
                  >
                    开始检测
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {alertElement}
      {/* 批量操作确认弹窗 */}
      {confirmModal.isOpen &&
        createPortal(
          <div
            className='fixed inset-0 bg-black/50 z-modal flex items-center justify-center p-4'
            onClick={confirmModal.onCancel}
          >
            <div
              className='bg-card rounded-lg shadow-xl max-w-md w-full'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-foreground '>
                    {confirmModal.title}
                  </h3>
                  <button
                    onClick={confirmModal.onCancel}
                    className='text-muted-foreground hover:text-foreground transition-colors'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>

                <div className='mb-6'>
                  <p className='text-sm text-foreground '>
                    {confirmModal.message}
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className='flex justify-end space-x-3'>
                  <button
                    onClick={confirmModal.onCancel}
                    className={`px-4 py-2 text-sm font-medium ${adminButtonStyles.secondary}`}
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    disabled={
                      isLoading('batchSource_batch_enable') ||
                      isLoading('batchSource_batch_disable') ||
                      isLoading('batchSource_batch_delete')
                    }
                    className={`px-4 py-2 text-sm font-medium ${
                      isLoading('batchSource_batch_enable') ||
                      isLoading('batchSource_batch_disable') ||
                      isLoading('batchSource_batch_delete')
                        ? adminButtonStyles.disabled
                        : adminButtonStyles.success
                    }`}
                  >
                    {isLoading('batchSource_batch_enable') ||
                    isLoading('batchSource_batch_disable') ||
                    isLoading('batchSource_batch_delete')
                      ? '操作中...'
                      : '确认'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
