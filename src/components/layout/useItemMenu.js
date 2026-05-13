import { useEffect, useRef, useState } from "react";

export function useItemMenu() {
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return undefined;
    function onMouseDown() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function openAt(event) {
    event.preventDefault();
    event.stopPropagation();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: Math.max(4, rect.right - 164) });
    }
    setOpen(true);
  }

  return { buttonRef, open, pos, setOpen, openAt };
}
