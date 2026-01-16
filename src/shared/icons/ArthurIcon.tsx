import * as React from 'react';

export type MustacheIconProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

export function MustacheIcon({ title, ...props }: MustacheIconProps) {
  const titleId = React.useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 256"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-labelledby={title ? titleId : undefined}
      focusable="false"
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <path
        fill="currentColor"
        d="M64 128c36-44 92-62 142-54 23 4 41 16 50 33 9-17 27-29 50-33 50-8 106 10 142 54 8 10 11 23 7 36-7 23-34 42-68 44-39 3-81-18-111-56-7 6-15 9-20 9s-13-3-20-9c-30 38-72 59-111 56-34-2-61-21-68-44-4-13-1-26 7-36Zm55 26c3 10 18 18 37 19 30 2 64-15 87-45 9-12 26-14 38-5 8 6 16 9 20 9s12-3 20-9c12-9 29-7 38 5 23 30 57 47 87 45 19-1 34-9 37-19 1-4 0-8-2-11-26-32-67-46-103-40-17 3-29 11-33 23-5 15-16 25-34 25s-29-10-34-25c-4-12-16-20-33-23-36-6-77 8-103 40-2 3-3 7-2 11Z"
      />
    </svg>
  );
}

export default MustacheIcon;
