'use client';

import { AlertCircle } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '@/lib/cn';

/* 初始化加载动画：轨道环（Orbit Ring）。
 *
 * 一套标记服务三种场合——整页加载、播放器蒙层（onDark）、失败态：
 *   · 细环：底圈用 border 色，进度弧用 currentColor，弧长 = 真实阶段进度，
 *     靠 SVG stroke-dashoffset 过渡，阶段推进时是「长出来」而不是跳变；
 *   · 扫描弧：一圈匀速自转的短虚线，负责「还在动」的体感，不干扰进度读数；
 *   · 环心：当前阶段的图标，轻微呼吸；失败态换成警告图标、整环转 destructive；
 *   · 环下：阶段点阵（已完成/进行中/未到）+ 一行文案（整页另有细进度条）。
 *
 * 全部数值由 props 推出，不含随机数与 Date——服务端渲染与客户端水合逐字一致。
 * 动效在 globals.css 里集中定义，并已被 prefers-reduced-motion 统一关掉。
 */

export interface LoadingStep {
  label: string;
  icon: ReactNode;
}

/** 环半径与周长：viewBox 100×100、r=44，2πr ≈ 276.46 */
const R = 44;
const CIRCUMFERENCE = 2 * Math.PI * R;

interface CommonProps {
  /** 阶段条，按顺序排开；activeStepIdx 那一格为「进行中」，之前的算「已完成」 */
  steps: LoadingStep[];
  activeStepIdx: number;
  /** 播放器蒙层是深色底：这一款在里面固定走亮色，不跟站点明暗 */
  onDark?: boolean;
}

interface LoadingStyleProps extends CommonProps {
  /** 纯中文的阶段文案，不带 emoji */
  message: string;
}

/** 阶段最多亮到 steps.length，越界时夹住，免得 steps[idx] 取空 */
const clampIdx = (idx: number, len: number) =>
  Math.min(Math.max(idx, 0), Math.max(len - 1, 0));

/** 进度：按当前所在格在序列里的序号等分（两格时首格正好 50%）。 */
const progressAt = (idx: number, len: number) =>
  len < 1 ? 1 : (idx + 1) / len;

const Ring = ({
  progress,
  error = false,
}: {
  progress: number;
  error?: boolean;
}) => (
  <svg className='mtv-ring' viewBox='0 0 100 100' aria-hidden='true'>
    <circle className='mtv-ring-track' cx='50' cy='50' r={R} />
    <circle
      className='mtv-ring-arc'
      cx='50'
      cy='50'
      r={R}
      strokeDasharray={CIRCUMFERENCE}
      strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
    />
    {/* 失败态停掉扫描：环还在动会读成「还在试」，与「到此为止」矛盾 */}
    {!error && (
      <circle
        className='mtv-ring-scan'
        cx='50'
        cy='50'
        r={R}
        strokeDasharray='3 26'
      />
    )}
  </svg>
);

/** 加载中：轨道环 + 阶段点阵 + 文案 */
export default function LoadingStyle({
  steps,
  activeStepIdx,
  message,
  onDark = false,
}: LoadingStyleProps) {
  const idx = clampIdx(activeStepIdx, steps.length);
  const progress = progressAt(idx, steps.length);

  return (
    <div
      className={cn('mtv-load', onDark && 'mtv-on-dark')}
      role='status'
      aria-live='polite'
    >
      <div className='mtv-load-ring'>
        <Ring progress={progress} />
        {/* key 换阶段时重挂载，图标与文案的入场动画才会重播 */}
        <div key={idx} className='mtv-ring-core'>
          {steps[idx]?.icon}
        </div>
      </div>

      <p className='mtv-load-msg'>{message}</p>

      {steps.length > 1 && (
        <div className='mtv-load-steps' aria-hidden='true'>
          {steps.map((step, i) => (
            <i
              key={step.label}
              className={cn(
                i < idx && 'done',
                i === idx && 'cur',
                i > idx && 'todo'
              )}
            />
          ))}
        </div>
      )}

      {/* 只有整页加载才有进度条。播放器蒙层是换源/换集的短暂过渡，
          「初始化 → 播放」两步之间跨了 90%，摆个进度条是个假指标。 */}
      {!onDark && (
        <div className='mtv-load-bar'>
          <i style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </div>
  );
}

interface LoadingErrorStyleProps extends CommonProps {
  /** 失败原因，交给对话框；这里只负责环与文案的失败态 */
  message: string;
}

/** 失败态：环停在当前阶段、转 destructive，环心换成警告图标 */
export function LoadingErrorStyle({
  steps,
  activeStepIdx,
  message,
  onDark = false,
}: LoadingErrorStyleProps) {
  const idx = clampIdx(activeStepIdx, steps.length);
  const progress = progressAt(idx, steps.length);

  return (
    <div
      className={cn('mtv-load mtv-load-err', onDark && 'mtv-on-dark')}
      role='alert'
    >
      <div className='mtv-load-ring'>
        <Ring progress={progress} error />
        <div className='mtv-ring-core'>
          <AlertCircle />
        </div>
      </div>

      <p className='mtv-load-msg'>{message}</p>

      {steps.length > 1 && (
        <div className='mtv-load-steps' aria-hidden='true'>
          {steps.map((step, i) => (
            <i
              key={step.label}
              className={cn(i < idx && 'done', i === idx && 'cur-err')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
