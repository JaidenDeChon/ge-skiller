import { json } from '@sveltejs/kit';
import { timeseries } from '$lib/services/grand-exchange-api-service';
import { TimeSeriesOptionTimestep } from '$lib/models/grand-exchange-protocols';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
    const id = url.searchParams.get('id');
    const timestep = (url.searchParams.get('timestep') ??
        TimeSeriesOptionTimestep.SIX_HOURS) as TimeSeriesOptionTimestep;

    if (!id) {
        return json({ error: 'Missing id parameter' }, { status: 400 });
    }

    try {
        const data = await timeseries({ id, timestep });
        return json(data);
    } catch (error) {
        console.error('Failed to fetch timeseries', error);
        return json({ error: 'Failed to fetch timeseries' }, { status: 500 });
    }
};
