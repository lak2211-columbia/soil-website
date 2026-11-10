// Shared gradients, grain and blur filters that the drawings in lib/art.js reference by id.
export const svgDefs = `
<svg class="defs" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="wallV" x1="0" y1="0" x2="0.28" y2="1">
      <stop offset="0%" stop-color="#F1EADD"/>
      <stop offset="55%" stop-color="#E7DECF"/>
      <stop offset="100%" stop-color="#D7CCBA"/>
    </linearGradient>
    <radialGradient id="wallGlow" cx="30%" cy="28%" r="80%">
      <stop offset="0%" stop-color="#F9F3E8" stop-opacity="0.85"/>
      <stop offset="60%" stop-color="#F9F3E8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="portBg" cx="46%" cy="34%" r="80%">
      <stop offset="0%" stop-color="#ECE4D5"/>
      <stop offset="70%" stop-color="#DBD1C0"/>
      <stop offset="100%" stop-color="#C8BDAB"/>
    </radialGradient>
    <radialGradient id="jarGrad" cx="40%" cy="33%" r="72%">
      <stop offset="0%" stop-color="#FBF8F2"/>
      <stop offset="55%" stop-color="#EFE8DC"/>
      <stop offset="100%" stop-color="#D3C9B7"/>
    </radialGradient>
    <linearGradient id="surface" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E0D5C1"/>
      <stop offset="100%" stop-color="#CDBFA7"/>
    </linearGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F1EBDF"/>
      <stop offset="100%" stop-color="#E3DBCB"/>
    </linearGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0"/></filter>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="soft2" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="13"/></filter>
    <filter id="soft3" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.4"/></filter>
  </defs>
</svg>
`;
