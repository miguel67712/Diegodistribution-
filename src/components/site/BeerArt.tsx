/**
 * Lightweight, dependency-free "bière pression" illustrations.
 *
 * The project has no way to pull in licensed stock photography, so these
 * hand-drawn SVGs stand in as the visual placeholder: an amber pint with
 * foam and rising bubbles, in the site's own brand/gold palette. Swap the
 * `<img>` usages for real product photography later without touching the
 * layout — every usage site just renders one of these components.
 */

/** Large, soft background glass used behind the hero copy. */
export function BeerGlassBackdrop({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 480" aria-hidden="true" className={className} fill="none">
      <defs>
        <linearGradient id="beerAmber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* glass body */}
      <path
        d="M96 120h208l-22 300a24 24 0 0 1-24 22H142a24 24 0 0 1-24-22L96 120Z"
        fill="url(#beerAmber)"
        opacity="0.18"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      {/* liquid fill */}
      <path
        d="M108 176h184l-18 240a16 16 0 0 1-16 14H142a16 16 0 0 1-16-14l-18-240Z"
        fill="url(#beerAmber)"
        opacity="0.5"
      />
      {/* foam */}
      <path
        d="M92 118c0-18 16-30 32-24 8-20 40-20 48 0 10-16 42-16 50 2 18-8 40 6 38 26-2 14-16 20-28 20H118c-14 0-26-8-26-24Z"
        fill="currentColor"
        opacity="0.35"
      />
      {/* handle */}
      <path
        d="M304 168c34-4 58 20 58 52s-24 58-58 54"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* bubbles */}
      {[
        [150, 400, 5],
        [178, 340, 4],
        [206, 420, 6],
        [232, 300, 3],
        [164, 260, 3.5],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="currentColor" opacity="0.3" />
      ))}
    </svg>
  );
}

/** Small keg glyph used as a per-brand placeholder "photo". */
export function BeerKegGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className} fill="none">
      <defs>
        <linearGradient id="kegAmber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--brand)" />
        </linearGradient>
      </defs>
      <rect x="14" y="10" width="36" height="46" rx="10" fill="url(#kegAmber)" opacity="0.9" />
      <rect x="14" y="26" width="36" height="8" fill="black" opacity="0.12" />
      <circle cx="32" cy="20" r="4" fill="white" opacity="0.55" />
      <path
        d="M20 12c4-6 20-6 24 0"
        stroke="white"
        strokeOpacity="0.4"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
