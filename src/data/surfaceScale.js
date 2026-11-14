import { eagleReconstructionArt } from './eagleArt.js';
import { PIXEL_EQUIPMENT } from './pixelEquipment.js';

/**
 * Human-relative dimensions for the artistic surface scenes.
 * NASA reference data: Apollo descent stage 3.23 m, Apollo LRV ~1.5 m,
 * Spirit/Opportunity ~1.5 m, Sojourner ~0.30 m, Ingenuity ~0.49 m.
 * Surveyor, ALSEP and Phoenix heights are approximate presentation values.
 * The source illustrations are isometric interpretations, not scale CAD models.
 */
export const ASTRONAUT_HEIGHT_METERS = 1.75;
export const LUNAR_PIXELS_PER_METER = 34;
export const SURFACE_HEIGHTS_METERS = Object.freeze({
  eagle: 6.95, // Visualized complete module only; surviving descent hardware ~3.23 m.
  rover: 1.5,
  surveyor: 3.0,
  alsep: 0.95,
  sojourner: 0.3,
  twins: 1.5,
  spirit: 1.5,
  opportunity: 1.5,
  ingenuity: 0.49,
  phoenix: 2.05,
});

// Preview deployments do not copy binary project assets. Use the versioned
// public repository artwork there, while local builds load their own files.
export const surfaceSpriteUrl = id => {
  if(id === 'eagle') return eagleReconstructionArt;
  if(id === 'spirit' || id === 'opportunity') return PIXEL_EQUIPMENT.twins;
  // Prefer the sharp pixel remasters instead of browser-filtered WebP images.
  // Artifact perspective and meter ratios are preserved from the original scenes.
  if (PIXEL_EQUIPMENT[id]) return PIXEL_EQUIPMENT[id];
  return `/assets/surface/${id}-pixel.png`;
};
