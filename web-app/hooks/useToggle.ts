import { useState, useCallback } from 'react';

// Custom hook for toggle state
const useToggle = (initialState = false): [boolean, () => void, (state: boolean) => void] => {
  const [state, setState] = useState<boolean>(initialState);

  const toggle = useCallback(() => {
    setState(prevState => !prevState);
  }, []);

  const setToggleState = useCallback((newState: boolean) => {
    setState(newState);
  }, []);

  return [state, toggle, setToggleState];
};

export default useToggle;