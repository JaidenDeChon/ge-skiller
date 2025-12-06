import type { Component } from 'svelte';

export interface OrgNode {
    key: string | number;
    type?: string;
    styleClass?: string;
    data?: unknown;
    leaf?: boolean;
    collapsible?: boolean;
    selectable?: boolean;
    children?: OrgNode[];
}

export type TemplateMap = {
    [type: string]: Component<any>;
};
