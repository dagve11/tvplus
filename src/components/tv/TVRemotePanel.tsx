'use client';

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CornerDownLeft,
  Home,
  Keyboard,
  Loader2,
  Menu,
  Monitor,
  Power,
  RefreshCw,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type {
  TVRemoteDevice,
  TVRemoteKey,
  TVRemoteTextMode,
} from '@/lib/tv-remote-types';

type TVRemotePanelProps = {
  isOpen: boolean;
  mounted: boolean;
  onClose: () => void;
};

type SocketResponse<T = unknown> = {
  success: boolean;
  error?: string;
} & T;

function RemoteButton({
  label,
  onPress,
  repeatable = false,
  className = '',
  children,
}: {
  label: string;
  onPress: (repeat?: boolean) => void;
  repeatable?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const delayRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearRepeat = () => {
    if (delayRef.current) window.clearTimeout(delayRef.current);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    delayRef.current = null;
    intervalRef.current = null;
  };

  useEffect(() => clearRepeat, []);

  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      onClick={() => {
        if (!repeatable) onPress(false);
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        if (!repeatable) return;
        onPress(false);
        clearRepeat();
        delayRef.current = window.setTimeout(() => {
          intervalRef.current = window.setInterval(() => onPress(true), 130);
        }, 360);
      }}
      onPointerUp={clearRepeat}
      onPointerCancel={clearRepeat}
      onPointerLeave={clearRepeat}
      className={`flex cursor-pointer items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition hover:border-ring hover:bg-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      {children}
    </button>
  );
}

export default function TVRemotePanel({
  isOpen,
  mounted,
  onClose,
}: TVRemotePanelProps) {
  const [devices, setDevices] = useState<TVRemoteDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [text, setText] = useState('');

  const selectedDevice =
    devices.find((device) => device.deviceId === selectedDeviceId) || null;

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tv-remote/devices', {
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || '无法获取电视端列表');
      }

      const nextDevices = Array.isArray(data.devices) ? data.devices : [];
      setDevices(nextDevices);
      setSelectedDeviceId((current) => {
        if (nextDevices.some((device: TVRemoteDevice) => device.deviceId === current)) {
          return current;
        }
        return nextDevices[0]?.deviceId || '';
      });
      setStatus(nextDevices.length ? '' : '没有在线的 Web 电视端');
    } catch (error) {
      setDevices([]);
      setSelectedDeviceId('');
      setStatus(error instanceof Error ? error.message : '无法获取电视端列表');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    void loadDevices();

    return () => {
      setDevices([]);
      setSelectedDeviceId('');
      setStatus('');
      setLoading(false);
    };
  }, [isOpen, loadDevices]);

  const sendKey = async (key: TVRemoteKey, repeat = false, digit?: string) => {
    if (!selectedDeviceId) return;
    try {
      const response = await fetch('/api/tv-remote/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        deviceId: selectedDeviceId,
        command: { key, repeat, digit },
        }),
      });
      const data: SocketResponse = await response.json().catch(() => ({
        success: false,
        error: '发送失败',
      }));
      if (!response.ok || !data.success) {
        setStatus(data.error || '发送失败');
      }
    } catch {
      setStatus('发送失败');
    }
  };

  const sendText = async (mode: TVRemoteTextMode, value = text) => {
    if (!selectedDeviceId) return;
    try {
      const response = await fetch('/api/tv-remote/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        deviceId: selectedDeviceId,
        command: { mode, text: value },
        }),
      });
      const data: SocketResponse = await response.json().catch(() => ({
        success: false,
        error: '文本发送失败',
      }));
      if (!response.ok || !data.success) {
        setStatus(data.error || '文本发送失败');
      } else if (mode === 'append' || mode === 'replace') {
        setStatus('文本已发送到电视端输入框');
      }
    } catch {
      setStatus('文本发送失败');
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <div
        className='fixed inset-0 z-modal bg-background/70 backdrop-blur-sm'
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        onWheel={(e) => e.preventDefault()}
        style={{ touchAction: 'none' }}
      />
      <div className='fixed inset-x-3 top-1/2 z-popover mx-auto max-h-[94vh] max-w-md -translate-y-1/2 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/30'>
        <div
          className='max-h-[94vh] overflow-y-auto p-5'
          data-panel-content
          onTouchMove={(e) => e.stopPropagation()}
          style={{ touchAction: 'auto' }}
        >
          <div className='mb-4 flex items-start justify-between gap-4'>
            <div>
              <div className='inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-black text-foreground'>
                <Power className='h-4 w-4' />
                TV REMOTE
              </div>
              <h3 className='mt-3 text-2xl font-black text-foreground'>
                电视遥控器
              </h3>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              aria-label='关闭遥控器'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          <div className='mb-4 rounded-2xl border border-border bg-muted p-3'>
            <div className='mb-2 flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2 text-sm font-black text-muted-foreground'>
                <Monitor className='h-4 w-4' />
                在线电视端
              </div>
              <button
                type='button'
                onClick={() => loadDevices()}
                className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground'
                aria-label='刷新电视端列表'
              >
                {loading ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <RefreshCw className='h-4 w-4' />
                )}
              </button>
            </div>

            {devices.length > 0 ? (
              <div className='grid gap-2'>
                {devices.map((device) => (
                  <button
                    key={device.deviceId}
                    type='button'
                    onClick={() => setSelectedDeviceId(device.deviceId)}
                    className={`cursor-pointer rounded-xl border px-3 py-2 text-left transition ${
                      selectedDeviceId === device.deviceId
                        ? 'border-ring bg-accent text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-ring'
                    }`}
                  >
                    <div className='truncate text-sm font-black'>
                      {device.deviceName}
                    </div>
                    <div className='mt-0.5 truncate text-xs opacity-70'>
                      {device.currentPath}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className='rounded-xl border border-dashed border-border bg-card px-3 py-4 text-center text-sm font-semibold text-muted-foreground'>
                {loading ? '正在查找在线电视端...' : '没有在线的 Web 电视端'}
              </div>
            )}
          </div>

          <div className='grid grid-cols-3 gap-3'>
            <RemoteButton label='返回' onPress={() => sendKey('back')} className='h-14'>
              <RotateCcw className='h-6 w-6' />
            </RemoteButton>
            <RemoteButton label='主页' onPress={() => sendKey('home')} className='h-14'>
              <Home className='h-6 w-6' />
            </RemoteButton>
            <RemoteButton label='菜单' onPress={() => sendKey('menu')} className='h-14'>
              <Menu className='h-6 w-6' />
            </RemoteButton>

            <div />
            <RemoteButton label='上' onPress={(repeat) => sendKey('up', repeat)} repeatable className='h-16'>
              <ChevronUp className='h-9 w-9' />
            </RemoteButton>
            <div />

            <RemoteButton label='左' onPress={(repeat) => sendKey('left', repeat)} repeatable className='h-16'>
              <ChevronLeft className='h-9 w-9' />
            </RemoteButton>
            <RemoteButton label='确认' onPress={() => sendKey('ok')} className='h-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90'>
              <CornerDownLeft className='h-8 w-8' />
            </RemoteButton>
            <RemoteButton label='右' onPress={(repeat) => sendKey('right', repeat)} repeatable className='h-16'>
              <ChevronRight className='h-9 w-9' />
            </RemoteButton>

            <div />
            <RemoteButton label='下' onPress={(repeat) => sendKey('down', repeat)} repeatable className='h-16'>
              <ChevronDown className='h-9 w-9' />
            </RemoteButton>
            <div />
          </div>

          <div className='mt-4 grid grid-cols-5 gap-2'>
            {Array.from({ length: 10 }, (_, index) => String((index + 1) % 10)).map((digit) => (
              <button
                key={digit}
                type='button'
                onClick={() => sendKey('digit', false, digit)}
                className='h-11 cursor-pointer rounded-xl border border-border bg-card text-lg font-black text-foreground transition hover:border-ring hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                {digit}
              </button>
            ))}
          </div>

          <div className='mt-4 rounded-2xl border border-border bg-muted p-3'>
            <div className='mb-2 flex items-center gap-2 text-sm font-black text-muted-foreground'>
              <Keyboard className='h-4 w-4' />
              文本输入
            </div>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={3}
              placeholder='输入后发送到电视端当前输入框'
              className='w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20'
            />
            <div className='mt-2 grid grid-cols-4 gap-2'>
              <button
                type='button'
                onClick={() => sendText('replace')}
                className='col-span-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-black text-primary-foreground transition hover:bg-primary/90'
              >
                <Send className='h-4 w-4' />
                发送
              </button>
              <button
                type='button'
                onClick={() => sendText('backspace', '')}
                className='cursor-pointer rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold text-foreground transition hover:border-ring'
              >
                退格
              </button>
              <button
                type='button'
                onClick={() => {
                  setText('');
                  sendText('clear', '');
                }}
                className='cursor-pointer rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold text-foreground transition hover:border-ring'
              >
                清空
              </button>
            </div>
          </div>

          {(status || selectedDevice) && (
            <p className='mt-3 rounded-2xl bg-muted px-3 py-2 text-center text-xs font-semibold text-muted-foreground'>
              {status || `正在控制：${selectedDevice?.deviceName}`}
            </p>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
