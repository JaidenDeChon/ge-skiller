const PNG_MAGIC = 'iVBOR';
const GIF_MAGIC = 'R0lG';
const JPEG_MAGIC = '/9j/';

/**
 * Normalizes an icon string (raw base64 or already data URI) into a data URI suitable for <img src>.
 */
export function iconToDataUri(icon?: string | null): string {
    if (!icon) return '';
    if (icon.startsWith('data:')) return icon;

    if (icon.startsWith(PNG_MAGIC)) return `data:image/png;base64,${icon}`;
    if (icon.startsWith(GIF_MAGIC)) return `data:image/gif;base64,${icon}`;
    if (icon.startsWith(JPEG_MAGIC)) return `data:image/jpeg;base64,${icon}`;

    // Default to PNG if unrecognized.
    return `data:image/png;base64,${icon}`;
}

export default iconToDataUri;
