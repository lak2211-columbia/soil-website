// The drawn fallback illustrations. Each sits under a photo slot and stays visible if no photo
// loads. They use the gradients and filters defined in svgDefs (lib/render/layout.js).

export const art = {
  'moon-jar': `<svg viewBox="0 0 800 560" role="img" aria-label="A white moon jar on a warm shelf, a slender branch and its soft shadow falling across the wall behind it">
          <rect width="800" height="560" fill="url(#wallV)"/>
          <rect width="800" height="560" fill="url(#wallGlow)"/>
          <!-- soft branch shadow -->
          <g filter="url(#soft2)" opacity="0.15" transform="translate(30,42)" fill="none" stroke="#3B322A" stroke-width="6" stroke-linecap="round">
            <path d="M690 20 C640 70 610 130 566 196 C544 230 512 292 470 336"/>
            <path d="M604 120 C620 118 642 96 654 74 M548 214 C566 214 590 196 604 178 M512 268 C528 272 552 258 566 240" stroke-width="4"/>
          </g>
          <g filter="url(#soft2)" opacity="0.15" transform="translate(30,42)" fill="#3B322A">
            <circle cx="654" cy="74" r="7"/><circle cx="604" cy="176" r="7"/><circle cx="566" cy="238" r="6"/><circle cx="690" cy="22" r="6"/>
          </g>
          <!-- shelf -->
          <rect x="150" y="452" width="470" height="8" fill="#D3C9B7"/>
          <rect x="150" y="460" width="470" height="30" fill="#C7BCA8"/>
          <rect x="150" y="460" width="470" height="6" fill="#BCAF98" opacity="0.6"/>
          <!-- jar cast shadow -->
          <ellipse cx="376" cy="452" rx="142" ry="13" fill="#B4A992" opacity="0.55" filter="url(#soft)"/>
          <!-- moon jar -->
          <path d="M372 150 C288 150 230 212 230 300 C230 388 292 452 372 452 C452 452 514 388 514 300 C514 212 456 150 372 150 Z" fill="url(#jarGrad)"/>
          <!-- soft inner shading, right side -->
          <path d="M372 150 C452 150 514 212 514 300 C514 388 452 452 372 452 C424 446 472 390 472 300 C472 210 424 156 372 150 Z" fill="#C6BCA9" opacity="0.4" filter="url(#soft)"/>
          <!-- seam -->
          <path d="M232 306 C300 322 444 322 512 306" fill="none" stroke="#CFC6B4" stroke-width="1.4" opacity="0.7"/>
          <!-- foot ring -->
          <path d="M320 448 C342 458 402 458 424 448" fill="none" stroke="#BFB5A2" stroke-width="2"/>
          <!-- mouth rim -->
          <ellipse cx="372" cy="158" rx="46" ry="12" fill="#F0EADE"/>
          <ellipse cx="372" cy="156" rx="40" ry="8" fill="#DFD6C6"/>
          <!-- highlight -->
          <ellipse cx="330" cy="252" rx="30" ry="60" fill="#FFFFFF" opacity="0.4" filter="url(#soft)"/>
          <!-- speckle -->
          <g fill="#B3A78F" opacity="0.5"><circle cx="360" cy="330" r="1.6"/><circle cx="404" cy="300" r="1.3"/><circle cx="340" cy="382" r="1.4"/><circle cx="432" cy="360" r="1.2"/><circle cx="300" cy="322" r="1.3"/><circle cx="392" cy="400" r="1.2"/></g>
          <!-- real branch -->
          <g fill="none" stroke="#9A8C77" stroke-linecap="round">
            <path d="M772 30 C706 74 668 138 624 204 C600 240 562 300 512 344" stroke-width="3.2"/>
            <path d="M662 126 C680 122 704 98 718 74 M602 222 C622 220 648 200 664 180 M562 278 C580 282 606 266 622 246" stroke-width="2.2"/>
          </g>
          <g fill="#8FA07E"><circle cx="718" cy="72" r="5"/><circle cx="664" cy="178" r="5"/><circle cx="622" cy="244" r="4.5"/><circle cx="772" cy="30" r="4.5"/><circle cx="700" cy="92" r="4"/></g>
          <rect width="800" height="560" filter="url(#grain)" opacity="0.3"/>
        </svg>`,
  'thumb-hanok': `<svg viewBox="0 0 88 88" role="img" aria-label="A hanok roof against soft light">
            <rect width="88" height="88" fill="url(#wallV)"/>
            <ellipse cx="44" cy="82" rx="40" ry="12" fill="#B7AC97" opacity="0.5" filter="url(#soft)"/>
            <path d="M8 46 L44 24 L80 46 Z" fill="#4A6B60" opacity="0.85"/>
            <path d="M4 48 Q44 40 84 48 L84 55 Q44 47 4 55 Z" fill="#3B564D"/>
            <rect x="24" y="53" width="40" height="30" fill="#D6CEBD"/>
            <rect x="30" y="59" width="10" height="24" fill="#C1B6A0"/><rect x="48" y="59" width="10" height="24" fill="#C1B6A0"/>
            <line x1="44" y1="53" x2="44" y2="83" stroke="#B3A992" stroke-width="1.4"/>
          </svg>`,
  'thumb-hangwa': `<svg viewBox="0 0 88 88" role="img" aria-label="Hangwa confections on a dish">
            <rect width="88" height="88" fill="url(#wallV)"/>
            <ellipse cx="44" cy="62" rx="34" ry="11" fill="#B7AC97" opacity="0.45" filter="url(#soft)"/>
            <ellipse cx="44" cy="57" rx="33" ry="10" fill="#EAE2D3"/><ellipse cx="44" cy="55" rx="33" ry="9" fill="#F1EBDD"/>
            <rect x="27" y="40" width="14" height="15" rx="3" fill="#C4964A"/><rect x="45" y="42" width="14" height="13" rx="3" fill="#B85042"/>
            <circle cx="38" cy="35" r="7" fill="#D9A85C"/><circle cx="53" cy="34" r="6" fill="#A07A38"/>
            <path d="M31 42 h9 M31 46 h9" stroke="#9A7330" stroke-width="1"/>
          </svg>`,
  'thumb-onggi': `<svg viewBox="0 0 88 88" role="img" aria-label="Onggi earthenware jars">
            <rect width="88" height="88" fill="url(#wallV)"/>
            <ellipse cx="45" cy="78" rx="30" ry="9" fill="#8A6A4C" opacity="0.4" filter="url(#soft)"/>
            <path d="M30 34 C20 40 20 62 32 70 C40 76 30 76 44 76 C58 76 48 76 56 70 C68 62 68 40 58 34 C50 28 38 28 30 34 Z" fill="#7A5B44"/>
            <path d="M32 36 C24 42 24 60 34 68 C40 72 48 72 54 68 C64 60 64 42 56 36 Z" fill="#8B6A4F"/>
            <ellipse cx="44" cy="52" rx="16" ry="18" fill="#9A7757" opacity="0.5" filter="url(#soft3)"/>
            <ellipse cx="44" cy="34" rx="14" ry="5" fill="#5E4632"/><ellipse cx="44" cy="33" rx="11" ry="3.5" fill="#4A3626"/>
          </svg>`,
  'portrait-min-jin-lee': `<svg viewBox="0 0 160 200" role="img" aria-label="Soft portrait of Min Jin Lee">
            <rect width="160" height="200" fill="url(#portBg)"/>
            <rect width="160" height="200" fill="#4A6B60" opacity="0.05"/>
            <ellipse cx="82" cy="206" rx="82" ry="48" fill="#B0A48F" opacity="0.55" filter="url(#soft2)"/>
            <path d="M40 200 C40 156 58 146 80 146 C102 146 122 156 122 200 Z" fill="#6E7A71"/>
            <path d="M80 146 C102 146 122 156 122 200 L104 200 C104 168 96 150 80 148 Z" fill="#5E6A61" opacity="0.6" filter="url(#soft3)"/>
            <rect x="72" y="128" width="16" height="26" fill="#E6C6A8"/>
            <path d="M52 112 C50 78 110 78 108 112 C112 150 100 170 96 182 L106 182 C114 150 120 96 108 82 C95 64 65 64 52 82 C44 96 46 150 54 182 L64 182 C60 170 48 150 52 112 Z" fill="#2B2521"/>
            <ellipse cx="80" cy="110" rx="25" ry="29" fill="#EACDB2"/>
            <path d="M55 104 C55 80 105 80 105 104 C96 90 90 86 80 86 C70 86 64 90 55 104 Z" fill="#241F1B"/>
            <path d="M69 116 q3 2 7 0 M84 116 q3 2 7 0" stroke="#6E5A48" stroke-width="1.6" fill="none" stroke-linecap="round"/>
            <path d="M74 132 q6 3 12 0" stroke="#B87A62" stroke-width="2" fill="none" stroke-linecap="round"/>
            <ellipse cx="64" cy="120" rx="7" ry="5" fill="#E7A98C" opacity="0.35"/>
            <rect width="160" height="200" filter="url(#grain)" opacity="0.22"/>
          </svg>`,
  'portrait-david-chang': `<svg viewBox="0 0 160 200" role="img" aria-label="Soft portrait of David Chang">
            <rect width="160" height="200" fill="url(#portBg)"/>
            <rect width="160" height="200" fill="#B85042" opacity="0.05"/>
            <ellipse cx="82" cy="206" rx="82" ry="48" fill="#B0A48F" opacity="0.55" filter="url(#soft2)"/>
            <path d="M38 200 C38 154 58 148 80 148 C102 148 122 154 122 200 Z" fill="#8A6357"/>
            <path d="M80 148 C102 148 122 154 122 200 L104 200 C104 166 96 152 80 150 Z" fill="#764F44" opacity="0.6" filter="url(#soft3)"/>
            <rect x="72" y="130" width="16" height="24" fill="#E3C2A2"/>
            <ellipse cx="80" cy="112" rx="26" ry="29" fill="#E4C4A6"/>
            <path d="M52 100 C58 76 102 76 108 100 C108 86 98 74 80 74 C62 74 52 86 52 100 Z" fill="#181512"/>
            <path d="M52 100 q28 -9 56 0 l-2 -6 q-26 -8 -52 0 Z" fill="#100E0C"/>
            <path d="M66 108 q6 2 12 0 M84 108 q6 2 12 0" stroke="#3A2E24" stroke-width="1.6" fill="none" stroke-linecap="round"/>
            <path d="M70 128 q10 4 20 0" stroke="#A05F48" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M62 138 q18 11 36 0 q-5 12 -18 12 q-13 0 -18 -12Z" fill="#37291F" opacity="0.5"/>
            <rect width="160" height="200" filter="url(#grain)" opacity="0.22"/>
          </svg>`,
  'portrait-sandra-oh': `<svg viewBox="0 0 160 200" role="img" aria-label="Soft portrait of Sandra Oh">
            <rect width="160" height="200" fill="url(#portBg)"/>
            <rect width="160" height="200" fill="#4A6B60" opacity="0.05"/>
            <ellipse cx="82" cy="206" rx="82" ry="48" fill="#B0A48F" opacity="0.55" filter="url(#soft2)"/>
            <path d="M40 200 C40 156 58 148 80 148 C102 148 122 156 122 200 Z" fill="#E6DECF"/>
            <path d="M80 148 C102 148 122 156 122 200 L104 200 C104 168 96 152 80 150 Z" fill="#D2C8B6" opacity="0.7" filter="url(#soft3)"/>
            <rect x="72" y="130" width="16" height="24" fill="#E9CDB4"/>
            <path d="M50 104 C50 74 110 74 110 104 C110 150 100 162 92 172 C88 150 96 120 80 120 C64 120 72 150 68 172 C60 162 50 150 50 104 Z" fill="#241E18"/>
            <ellipse cx="80" cy="108" rx="25" ry="29" fill="#EACDB4"/>
            <path d="M56 100 C56 78 104 78 104 100 C95 88 90 84 80 84 C70 84 65 88 56 100 Z" fill="#1B1610"/>
            <circle cx="70" cy="72" r="6" fill="#1B1610"/>
            <path d="M69 114 q3 2 7 0 M84 114 q3 2 7 0" stroke="#6E5A48" stroke-width="1.6" fill="none" stroke-linecap="round"/>
            <path d="M74 130 q6 3 12 0" stroke="#B87A62" stroke-width="2" fill="none" stroke-linecap="round"/>
            <ellipse cx="64" cy="118" rx="7" ry="5" fill="#E7A98C" opacity="0.3"/>
            <rect width="160" height="200" filter="url(#grain)" opacity="0.22"/>
          </svg>`,
  'portrait-jay-park': `<svg viewBox="0 0 160 200" role="img" aria-label="Soft portrait of Jay Park">
            <rect width="160" height="200" fill="url(#portBg)"/>
            <rect width="160" height="200" fill="#C4964A" opacity="0.06"/>
            <ellipse cx="82" cy="206" rx="82" ry="48" fill="#B0A48F" opacity="0.55" filter="url(#soft2)"/>
            <path d="M40 200 C40 156 58 150 80 150 C102 150 122 156 122 200 Z" fill="#3E3B37"/>
            <path d="M80 150 C102 150 122 156 122 200 L104 200 C104 168 96 152 80 152 Z" fill="#2E2B28" opacity="0.6" filter="url(#soft3)"/>
            <rect x="72" y="132" width="16" height="22" fill="#E3C3A2"/>
            <rect x="72" y="150" width="16" height="18" fill="#EDE7DC"/>
            <ellipse cx="80" cy="112" rx="26" ry="29" fill="#E3C3A2"/>
            <path d="M52 98 C58 74 102 74 108 98 C108 82 98 72 80 72 C62 72 52 82 52 98 Z" fill="#141210"/>
            <path d="M52 98 q28 -10 56 0 l-2 -7 q-26 -8 -52 0 Z" fill="#0E0C0A"/>
            <path d="M66 108 q6 2 12 0 M84 108 q6 2 12 0" stroke="#2E241E" stroke-width="1.6" fill="none" stroke-linecap="round"/>
            <path d="M72 130 q8 3 16 0" stroke="#A05F48" stroke-width="2" fill="none" stroke-linecap="round"/>
            <rect width="160" height="200" filter="url(#grain)" opacity="0.22"/>
          </svg>`,
  'hangwa': `<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Hangwa confections on a ceramic dish in soft light">
            <rect width="300" height="400" fill="url(#wallV)"/>
            <rect y="252" width="300" height="148" fill="url(#surface)"/>
            <path d="M0 252 H300 V262 H0 Z" fill="#CFC2AB" opacity="0.5"/>
            <ellipse cx="150" cy="300" rx="118" ry="30" fill="#B4A88F" opacity="0.5" filter="url(#soft)"/>
            <ellipse cx="150" cy="292" rx="118" ry="34" fill="#EAE1D1"/><ellipse cx="150" cy="288" rx="118" ry="32" fill="#F3ECDD"/>
            <ellipse cx="150" cy="286" rx="96" ry="24" fill="#E6DCC9" opacity="0.6"/>
            <rect x="88" y="228" width="52" height="54" rx="7" fill="#C4964A"/>
            <rect x="88" y="228" width="52" height="12" rx="6" fill="#D4A85E"/>
            <rect x="150" y="236" width="50" height="48" rx="7" fill="#B85042"/>
            <rect x="150" y="236" width="50" height="11" rx="6" fill="#C86254"/>
            <path d="M96 236 h38 M96 248 h38 M96 260 h38" stroke="#9A7330" stroke-width="2"/>
            <circle cx="118" cy="194" r="28" fill="#D9A85C"/><circle cx="118" cy="194" r="16" fill="#C68F3E"/>
            <ellipse cx="110" cy="186" rx="7" ry="5" fill="#EACB86" opacity="0.5"/>
            <circle cx="178" cy="200" r="24" fill="#A9803B"/><path d="M160 200 q18 -14 36 0 q-18 13 -36 0Z" fill="#8A6A30"/>
            <rect x="120" y="150" width="60" height="30" rx="15" fill="#B85042" opacity="0.9"/>
            <rect width="300" height="400" filter="url(#grain)" opacity="0.26"/>
          </svg>`,
  'grill': `<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A Korean barbecue grill with cuts of meat and rising steam">
            <rect width="300" height="400" fill="url(#wallV)"/>
            <rect y="250" width="300" height="150" fill="url(#surface)"/>
            <ellipse cx="150" cy="262" rx="130" ry="34" fill="#9A8F7B" opacity="0.4" filter="url(#soft)"/>
            <ellipse cx="150" cy="248" rx="128" ry="46" fill="#37312B"/><ellipse cx="150" cy="244" rx="128" ry="44" fill="#4A423A"/>
            <ellipse cx="150" cy="242" rx="104" ry="34" fill="#2A2622"/>
            <ellipse cx="150" cy="242" rx="104" ry="34" fill="#3A322A" opacity="0.5" filter="url(#soft3)"/>
            <path d="M70 242 q80 -18 160 0" stroke="#726858" stroke-width="4" fill="none"/><path d="M70 230 q80 -18 160 0" stroke="#726858" stroke-width="4" fill="none"/>
            <rect x="94" y="214" width="44" height="26" rx="6" fill="#B85042"/><rect x="94" y="214" width="44" height="8" rx="4" fill="#C86254"/>
            <rect x="150" y="218" width="46" height="24" rx="6" fill="#C25846"/>
            <rect x="102" y="220" width="30" height="6" rx="3" fill="#E6C4B0" opacity="0.7"/>
            <path d="M108 208 q6 -22 0 -38 M150 206 q8 -24 2 -42 M192 210 q6 -20 0 -36" stroke="#EFEAE0" stroke-width="5" fill="none" opacity="0.45" stroke-linecap="round" filter="url(#soft3)"/>
            <rect width="300" height="400" filter="url(#grain)" opacity="0.26"/>
          </svg>`,
  'jangajji': `<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Jars of jangajji preserved vegetables on a shelf">
            <rect width="300" height="400" fill="url(#wallV)"/>
            <rect y="270" width="300" height="130" fill="url(#surface)"/>
            <ellipse cx="102" cy="272" rx="46" ry="14" fill="#9A8F7B" opacity="0.4" filter="url(#soft)"/>
            <ellipse cx="196" cy="272" rx="42" ry="12" fill="#9A8F7B" opacity="0.4" filter="url(#soft)"/>
            <rect x="70" y="146" width="64" height="122" rx="12" fill="#7E8E64" opacity="0.55"/>
            <rect x="70" y="146" width="64" height="122" rx="12" fill="#6E7E54" opacity="0.3"/>
            <rect x="78" y="150" width="14" height="112" rx="7" fill="#F1EBDF" opacity="0.25"/>
            <rect x="68" y="130" width="68" height="20" rx="7" fill="#3B564D"/>
            <path d="M80 178 q14 -8 28 0 M80 208 q18 -6 36 0 M80 234 q12 -6 26 0" stroke="#43614F" stroke-width="4" fill="none" opacity="0.7"/>
            <rect x="162" y="172" width="62" height="96" rx="12" fill="#C4964A" opacity="0.5"/>
            <rect x="162" y="172" width="62" height="96" rx="12" fill="#B08238" opacity="0.28"/>
            <rect x="170" y="176" width="12" height="88" rx="6" fill="#F1EBDF" opacity="0.28"/>
            <rect x="160" y="158" width="66" height="18" rx="7" fill="#8A6A30"/>
            <path d="M170 200 q16 -6 32 0 M170 226 q12 -6 26 0" stroke="#A07A38" stroke-width="4" fill="none" opacity="0.7"/>
            <rect width="300" height="400" filter="url(#grain)" opacity="0.26"/>
          </svg>`,
  'old-kitchen': `<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A neighborhood bakery counter with soft rolls and pastries">
            <rect width="300" height="400" fill="url(#wallV)"/>
            <rect y="150" width="300" height="72" fill="#4A6B60" opacity="0.12"/>
            <rect y="252" width="300" height="148" fill="url(#surface)"/>
            <ellipse cx="150" cy="230" rx="120" ry="18" fill="#9A8F7B" opacity="0.35" filter="url(#soft)"/>
            <rect x="40" y="218" width="220" height="40" fill="#D6CDBA"/><rect x="40" y="210" width="220" height="10" fill="#C6BCA6"/>
            <ellipse cx="86" cy="210" rx="24" ry="13" fill="#C9873F"/><path d="M63 210 q23 -17 46 0Z" fill="#DA9C52"/>
            <ellipse cx="150" cy="212" rx="22" ry="12" fill="#E3C48C"/><circle cx="150" cy="204" r="6" fill="#B85042"/>
            <ellipse cx="214" cy="210" rx="24" ry="13" fill="#B87A44"/><path d="M196 205 q18 -6 36 0" stroke="#8A5A30" stroke-width="2" fill="none"/>
            <rect x="118" y="150" width="64" height="28" rx="5" fill="#EDE7DC"/><path d="M126 176 h48" stroke="#B85042" stroke-width="2"/>
            <rect width="300" height="400" filter="url(#grain)" opacity="0.26"/>
          </svg>`,
  'two-alphabets': `<svg viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Hangul and Latin letters composed on textured paper">
            <rect width="320" height="400" fill="url(#paper)"/>
            <ellipse cx="130" cy="150" rx="120" ry="90" fill="#4A6B60" opacity="0.12" filter="url(#soft2)"/>
            <text x="40" y="150" font-family="'Cormorant Garamond',serif" font-size="150" fill="#4A6B60">한</text>
            <text x="182" y="272" font-family="'Cormorant Garamond',serif" font-size="150" fill="#1A1A1A" opacity="0.82">A</text>
            <text x="46" y="332" font-family="'Cormorant Garamond',serif" font-style="italic" font-size="64" fill="#8B8577">글</text>
            <line x1="40" y1="200" x2="280" y2="200" stroke="#B85042" stroke-width="2"/>
            <line x1="160" y1="64" x2="160" y2="356" stroke="#CFC6B4" stroke-width="1"/>
            <rect width="320" height="400" filter="url(#grain)" opacity="0.24"/>
          </svg>`,
  'root': `<svg viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="The Hangul word for root, with a red seal">
            <rect width="320" height="400" fill="url(#paper)"/>
            <ellipse cx="150" cy="240" rx="120" ry="90" fill="#8A6A30" opacity="0.12" filter="url(#soft2)"/>
            <text x="52" y="184" font-family="'Cormorant Garamond',serif" font-size="132" fill="#1A1A1A">뿌</text>
            <text x="150" y="304" font-family="'Cormorant Garamond',serif" font-size="132" fill="#4A6B60">리</text>
            <rect x="232" y="58" width="56" height="56" rx="6" fill="#B85042"/>
            <rect x="232" y="58" width="56" height="56" rx="6" fill="#000" opacity="0.08"/>
            <text x="244" y="100" font-family="'Cormorant Garamond',serif" font-size="34" fill="#F1EBDF">土</text>
            <line x1="52" y1="332" x2="272" y2="332" stroke="#C4964A" stroke-width="2"/>
            <rect width="320" height="400" filter="url(#grain)" opacity="0.24"/>
          </svg>`,
  'home': `<svg viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="The word Home and the Hangul for house">
            <rect width="320" height="400" fill="url(#paper)"/>
            <ellipse cx="180" cy="300" rx="130" ry="90" fill="#C4964A" opacity="0.14" filter="url(#soft2)"/>
            <text x="30" y="200" font-family="'Cormorant Garamond',serif" font-style="italic" font-size="118" fill="#A07A38">Home</text>
            <text x="72" y="332" font-family="'Cormorant Garamond',serif" font-size="120" fill="#1A1A1A">집</text>
            <line x1="40" y1="230" x2="280" y2="230" stroke="#4A6B60" stroke-width="2"/>
            <circle cx="256" cy="120" r="20" fill="#4A6B60" opacity="0.5"/>
            <rect width="320" height="400" filter="url(#grain)" opacity="0.24"/>
          </svg>`,
};

export const ART_NAMES = Object.keys(art);
