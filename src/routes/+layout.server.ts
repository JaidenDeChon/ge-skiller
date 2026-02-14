import { shouldShowDevControls } from '$lib/helpers/should-show-dev-controls';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
    return {
        showDevControls: shouldShowDevControls(),
        baseUrl: url.origin,
    };
};
