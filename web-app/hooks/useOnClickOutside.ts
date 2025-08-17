import { useEffect, useRef } from 'react';

// Custom hook for handling clicks outside of an element
const useOnClickOutside = <T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);

  return ref;
};

export default useOnClickOutside;
