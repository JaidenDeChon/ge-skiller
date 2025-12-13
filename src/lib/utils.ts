import { base } from '$app/paths';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function resolvePath(pathname: string) {
    if (!pathname) return pathname;

    return pathname.startsWith('/') ? `${base}${pathname}` : pathname;
}
