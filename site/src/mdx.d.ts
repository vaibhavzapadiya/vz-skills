declare module '*.mdx' {
  import type { ComponentType } from 'react';
  const MDXComponent: ComponentType<Record<string, unknown>>;
  export default MDXComponent;
}

declare module '*.mdx?raw' {
  const src: string;
  export default src;
}
