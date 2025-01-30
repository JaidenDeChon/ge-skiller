<script lang="ts">
    import type { Snippet } from 'svelte';
    import { MediaQuery } from 'svelte/reactivity';
    import * as Dialog from '@/components/ui/dialog';
    import * as Drawer from '@/components/ui/drawer';

    interface Props {
      title: string;
      description?: string;
      trigger: Snippet;
      content: Snippet;
      triggerClass?: string;
    }

    let { title, description, trigger, content, triggerClass }: Props = $props();

    let open = $state(false);
    const isDesktopMode = new MediaQuery("(min-width: 1024px)");
</script>

{#if isDesktopMode.current}
    <Dialog.Root bind:open>

        <Dialog.Trigger class={triggerClass}>
            {@render trigger()}
        </Dialog.Trigger>

        <Dialog.Content>

            <Dialog.Header>
                <Dialog.Title>{title}</Dialog.Title>
                <Dialog.Description>{description}</Dialog.Description>
            </Dialog.Header>

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
