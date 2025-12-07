import { shouldShowDevControls } from '$lib/helpers/should-show-dev-controls';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
    return {
        showDevControls: shouldShowDevControls(),
    };
};
