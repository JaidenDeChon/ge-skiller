<script lang="ts">
    import type { Snippet } from 'svelte';
    import { MediaQuery } from 'svelte/reactivity';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Drawer from '$lib/components/ui/drawer';

    interface Props {
        trigger: Snippet;
        content: Snippet;
        title?: string;
        description?: string;
        triggerClass?: string;
        contentClass?: string;
    }

    let { trigger, content, title, description, triggerClass, contentClass }: Props = $props();

    let open = $state(false);
    const isDesktopMode = new MediaQuery("(min-width: 1024px)");
</script>

{#if isDesktopMode.current}
    <Dialog.Root bind:open>

        <Dialog.Trigger class={triggerClass}>
            {@render trigger()}
        </Dialog.Trigger>

        <Dialog.Content class={contentClass}>

            {#if title || description}
                <Dialog.Header>
                    <Dialog.Title>{title}</Dialog.Title>
                    <Dialog.Description>{description}</Dialog.Description>
                </Dialog.Header>
            {/if}

            {@render content()}

        </Dialog.Content>

    </Dialog.Root>
{:else}
    <Drawer.Root bind:open>

        <Drawer.Trigger class={triggerClass}>
            {@render trigger()}
        </Drawer.Trigger>

        <Drawer.Content>

            <Drawer.Header class="text-left">
                <Drawer.Title>{title}</Drawer.Title>
                <Drawer.Description>{description}</Drawer.Description>
            </Drawer.Header>

            {@render content()}

        </Drawer.Content>
    </Drawer.Root>
{/if}
