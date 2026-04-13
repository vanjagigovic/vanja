import { useEffect } from 'react';

type UseCalendarKeyboardShortcutsParams = {
  enabled: boolean;
  onCreateEvent: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  );
}

export function useCalendarKeyboardShortcuts({
  enabled,
  onCreateEvent,
  onPrevious,
  onNext,
  onToday,
}: UseCalendarKeyboardShortcutsParams) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      // ignore modifier keys
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      // ignore typing in inputs
      if (isTypingTarget(event.target)) {
        return;
      }

      switch (event.key) {
        case 'c':
        case 'C':
          event.preventDefault();
          onCreateEvent();
          break;

        case 't':
        case 'T':
          event.preventDefault();
          onToday();
          break;

        case 'ArrowLeft':
          event.preventDefault();
          onPrevious();
          break;

        case 'ArrowRight':
          event.preventDefault();
          onNext();
          break;

        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onCreateEvent, onNext, onPrevious, onToday]);
}