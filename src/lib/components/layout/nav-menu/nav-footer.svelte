<script lang="ts">
    import { SiGithub } from '@icons-pack/svelte-simple-icons';
    import * as Sidebar from '$lib/components/ui/sidebar';
    import * as Tooltip from '$lib/components/ui/tooltip';
    import NavUser from '$lib/components/layout/nav-menu/nav-user.svelte';
    import { Button, buttonVariants } from '$lib/components/ui/button';
    import { toggleMode } from 'mode-watcher';
    import { Moon, Sun, Info } from 'lucide-svelte';

    const sidebar = Sidebar.useSidebar();
</script>

<Sidebar.Menu class="mb-3">
    <Sidebar.MenuItem>
        <!-- Todo - Add authentication and stuff -->
        <!-- <NavUser /> -->
    </Sidebar.MenuItem>
</Sidebar.Menu>

{#if sidebar.open || sidebar.isMobile}
    <div class="flex flex-col gap-2">
        <div class="grid grid-cols-2 gap-2">
            <Tooltip.Provider>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class={[
                            'w-full min-h-10 min-w-10 max-h-10',
                            buttonVariants({
                                class: 'p-0 text-foreground border border-input rounded-md bg-background/70 hover:bg-muted/55 transition-colors',
                            }),
                        ]}
                    >
                        <a href="/" class="h-full w-full flex items-center justify-center">
                            <Info />
                            <span class="sr-only">About</span>
                        </a>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <p>About ge-skiller</p>
                    </Tooltip.Content>
                </Tooltip.Root>
            </Tooltip.Provider>

            <Tooltip.Provider>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class={[
                            'w-full min-h-10 min-w-10 max-h-10',
                            buttonVariants({
                                class: 'p-0 text-foreground border border-input rounded-md bg-background/70 hover:bg-muted/55 transition-colors',
                            }),
                        ]}
                    >
                        <a
                            class="h-full w-full flex items-center justify-center"
                            href="https://github.com/JaidenDeChon/ge-skiller"
                            target="_blank"
                        >
                            <SiGithub />
                            <span class="sr-only">View source on Github</span>
                        </a>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <p>View source on GitHub</p>
                    </Tooltip.Content>
                </Tooltip.Root>
            </Tooltip.Provider>
        </div>

        <Tooltip.Provider>
            <Tooltip.Root>
                <Tooltip.Trigger
                    class={[
                        'w-full min-h-10 min-w-10 max-h-10',
                        buttonVariants({
                            class: 'p-0 text-foreground border border-input rounded-md bg-background/70 hover:bg-muted/55 transition-colors',
                        }),
                    ]}
                    onclick={toggleMode}
                >
                    <div class="flex items-center justify-center gap-2 w-full">
                        <span class="flex h-5 w-5 items-center justify-center shrink-0 relative">
                            <Sun class="block transition-opacity dark:hidden" />
                            <Moon class="block transition-opacity hidden dark:block" />
                        </span>
                        <span class="text-sm">Toggle theme</span>
                    </div>
                    <span class="sr-only">Toggle theme</span>
                </Tooltip.Trigger>
                <Tooltip.Content>
                    <p>Toggle theme</p>
                </Tooltip.Content>
            </Tooltip.Root>
        </Tooltip.Provider>
    </div>
{:else if !sidebar.open}
    <Tooltip.Provider>
        <Tooltip.Root>
            <Tooltip.Trigger>
                <Button variant="outline" class="h-9 w-9" onclick={toggleMode}>
                    <span class="flex h-5 w-5 items-center justify-center shrink-0 relative">
                        <Sun class="block transition-opacity dark:hidden" />
                        <Moon class="block transition-opacity hidden dark:block" />
                    </span>
                    <span class="sr-only">Toggle theme</span>
                </Button>
            </Tooltip.Trigger>
            <Tooltip.Content side="right">Toggle theme</Tooltip.Content>
        </Tooltip.Root>
    </Tooltip.Provider>
{/if}
