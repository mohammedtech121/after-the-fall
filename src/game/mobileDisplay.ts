/**
 * Safe browser helpers for Full-Screen gameplay and Screen Orientation API
 * landscape requests on mobile devices.
 *
 * Always feature-detected and wrapped in try/catch so unsupported browsers
 * (e.g., iOS Safari without Fullscreen API or desktop browsers) degrade cleanly.
 */

type FullscreenDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape' | 'landscape-primary' | 'any') => Promise<void>;
  unlock?: () => void;
};

export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

export function isFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
}

export async function tryLockLandscapeOrientation(): Promise<boolean> {
  if (typeof screen === 'undefined' || !screen.orientation) return false;
  const orient = screen.orientation as LockableOrientation;
  if (typeof orient.lock !== 'function') return false;
  try {
    await orient.lock('landscape');
    return true;
  } catch {
    // Expected on desktop browsers, non-fullscreen mobile contexts, or iOS Safari
    return false;
  }
}

export async function enterFullscreenAndLandscape(
  target?: HTMLElement | null,
  attemptLandscapeLock = true
): Promise<{ fullscreen: boolean; landscapeLocked: boolean }> {
  let fullscreen = isFullscreenActive();
  if (!fullscreen && typeof document !== 'undefined') {
    const el = (target ?? document.documentElement) as FullscreenElement;
    try {
      if (typeof el.requestFullscreen === 'function') {
        await el.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
        fullscreen = isFullscreenActive();
      } else if (typeof el.webkitRequestFullscreen === 'function') {
        await el.webkitRequestFullscreen();
        fullscreen = isFullscreenActive();
      }
    } catch {
      fullscreen = isFullscreenActive();
    }
  }

  let landscapeLocked = false;
  if (attemptLandscapeLock) {
    landscapeLocked = await tryLockLandscapeOrientation();
  }
  return { fullscreen, landscapeLocked };
}

export async function exitFullscreenSafely(): Promise<void> {
  if (typeof document === 'undefined') return;
  const doc = document as FullscreenDocument;
  try {
    if (doc.fullscreenElement && typeof doc.exitFullscreen === 'function') {
      await doc.exitFullscreen();
    } else if (doc.webkitFullscreenElement && typeof doc.webkitExitFullscreen === 'function') {
      await doc.webkitExitFullscreen();
    }
  } catch {
    // Ignore exit errors
  }
}

export async function toggleFullscreen(
  target?: HTMLElement | null,
  isMobile = false
): Promise<boolean> {
  if (isFullscreenActive()) {
    await exitFullscreenSafely();
    return false;
  }
  const res = await enterFullscreenAndLandscape(target, isMobile);
  return res.fullscreen;
}
