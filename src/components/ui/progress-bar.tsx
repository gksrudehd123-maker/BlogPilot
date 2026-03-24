'use client';

import { useEffect, useState } from 'react';

export function ProgressBar({ loading }: { loading: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }
    setProgress(30);
    const t1 = setTimeout(() => setProgress(60), 300);
    const t2 = setTimeout(() => setProgress(80), 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed left-0 top-0 z-[100] h-0.5 w-full">
      <div
        className="h-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${loading ? progress : 100}%` }}
      />
    </div>
  );
}
