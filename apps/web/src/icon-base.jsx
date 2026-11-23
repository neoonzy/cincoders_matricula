import React from 'react';
export function Icon({ size = 20, children, strokeWidth, ...props }) {
  const dimension = Math.max(16, Number(size) || 20);
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 256 256" width={dimension} height={dimension} fill="currentColor" {...props}>{children}</svg>;
}
