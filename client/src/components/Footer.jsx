import React from 'react';
import { BRAND } from '../branding.js';

export default function Footer() {

  return (
    <footer className="mt-16 border-t border-amber-300/30 bg-amber-800 text-amber-100">
      <div className="relative">
        {/* soft gradient accent */}
        <div className="pointer-events-none absolute inset-x-0 -top-16 h-24 bg-gradient-to-b from-amber-300/20 to-transparent" />

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-3">
                <img src={BRAND.logoUrl} alt="Logo" className="h-10 w-auto rounded-sm" />
                <div className="text-xl font-bold tracking-wide">{BRAND.name}</div>
              </div>
              <p className="mt-3 text-amber-100/80 max-w-sm">{BRAND.tagline}</p>
              <div className="mt-4 flex gap-3">
                <SocialIcon href="https://x.com/" label="X/Twitter">
                  {/* X icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M18.243 3H21l-6.56 7.496L22 21h-6.657l-4.27-5.16L5.9 21H3.142l7.02-8.02L2 3h6.82l3.85 4.7L18.243 3Zm-2.33 16.2h1.843L8.17 4.7H6.2l9.713 14.5Z"/></svg>
                </SocialIcon>
                <SocialIcon href="https://www.linkedin.com/" label="LinkedIn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M4.983 3.5C4.983 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.483 1.12 2.483 2.5ZM.5 8.25h4V23h-4V8.25Zm7.5 0h3.833v2.01h.055c.534-1.013 1.837-2.078 3.78-2.078 4.045 0 4.79 2.663 4.79 6.125V23H15.5v-6.5c0-1.55-.027-3.54-2.156-3.54-2.159 0-2.49 1.68-2.49 3.42V23H8V8.25Z"/></svg>
                </SocialIcon>
                <SocialIcon href="https://www.instagram.com/" label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.056 1.97.24 2.427.403.61.212 1.047.465 1.507.925.46.46.713.897.925 1.507.163.457.347 1.257.403 2.427.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.056 1.17-.24 1.97-.403 2.427a3.59 3.59 0 0 1-.925 1.507 3.59 3.59 0 0 1-1.507.925c-.457.163-1.257.347-2.427.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.056-1.97-.24-2.427-.403a3.59 3.59 0 0 1-1.507-.925 3.59 3.59 0 0 1-.925-1.507c-.163-.457-.347-1.257-.403-2.427C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.056-1.17.24-1.97.403-2.427.212-.61.465-1.047.925-1.507.46-.46.897-.713 1.507-.925.457-.163 1.257-.347 2.427-.403C8.416 2.175 8.796 2.163 12 2.163Zm0 1.622c-3.155 0-3.526.012-4.768.069-1.027.047-1.584.218-1.953.362-.492.191-.843.418-1.213.788-.37.37-.597.72-.788 1.213-.144.37-.315.926-.362 1.953-.057 1.242-.069 1.613-.069 4.768s.012 3.526.069 4.768c.047 1.027.218 1.584.362 1.953.191.492.418.843.788 1.213.37.37.72.597 1.213.788.37.144.926.315 1.953.362 1.242.057 1.613.069 4.768.069s3.526-.012 4.768-.069c1.027-.047 1.584-.218 1.953-.362.492-.191.843-.418 1.213-.788.37-.37.72-.597 1.213-.788.37-.144.926-.315 1.953-.362 1.242-.057 1.613-.069 4.768-.069s3.526.012 4.768.069c1.027.047 1.584.218 1.953.362.492.191.843.418 1.213.788.37.37.72.597 1.213.788.37.144.926.315 1.953.362 1.242.057 1.613.069 4.768.069Z"/><path d="M12 5.838A6.162 6.162 0 1 0 12 18.162 6.162 6.162 0 1 0 12 5.838Zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z"/></svg>
                </SocialIcon>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-amber-300/20 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-amber-100/80">
            <div>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-amber-900/40 hover:bg-amber-900 text-amber-100"
    >
      {children}
    </a>
  );
}
