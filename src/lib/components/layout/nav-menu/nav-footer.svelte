<script lang="ts">
    import { SiGithub } from '@icons-pack/svelte-simple-icons';
    import * as Sidebar from '$lib/components/ui/sidebar';
    import * as Tooltip from '$lib/components/ui/tooltip';
    import NavUser from '$lib/components/layout/nav-menu/nav-user.svelte';
    import {buttonVariants} from "$lib/components/ui/button";
    import {toggleMode} from "mode-watcher";
    import { Moon, Sun, Info } from "lucide-svelte";

    const sidebar = Sidebar.useSidebar();
</script>

<Sidebar.Menu>
    <Sidebar.MenuItem>
        <NavUser />
    </Sidebar.MenuItem>
</Sidebar.Menu>

<div class="flex gap-3 mt-3 { sidebar.open ? 'flex-row' : 'flex-col' }">
    <Tooltip.Provider>
        <Tooltip.Root>
            <Tooltip.Trigger class={['flex-1 min-h-10 min-w-10 max-h-10', buttonVariants({ class: 'p-0 text-foreground border border-input rounded-md bg-background/70 hover:bg-muted/55 transition-colors'})]}>
                <a
                    href="/static#"
                    class="h-full w-full flex items-center justify-center"
                >
                    <Info />
                    <span class="sr-only">About</span>
                </a>
            </Tooltip.Trigger>
            <Tooltip.Content>
                <p>About osrs-skillionaire</p>
            </Tooltip.Content>
        </Tooltip.Root>
    </Tooltip.Provider>

    <Tooltip.Provider>
        <Tooltip.Root>
            <Tooltip.Trigger class={['flex-1 min-h-10 min-w-10 max-h-10', buttonVariants({ class: 'p-0 text-foreground border border-input rounded-md bg-background/70 hover:bg-muted/55 transition-colors'})]}>
                <a
                    class="h-full w-full flex items-center justify-center"
                    href="https://github.com/JaidenDeChon/osrs-ge-skiller-v2"
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

    <Tooltip.Provider>
        <Tooltip.Root>
            <Tooltip.Trigger class={['flex-1 min-h-10 min-w-10 max-h-10', buttonVariants({ class: 'p-0 text-foreground border border-input rounded-md bg-background/70 hover:bg-muted/55 transition-colors'})]} onclick={toggleMode}>
                <Sun class="dark:scale-0" />
                <Moon class="absolute scale-0 dark:scale-100" />
                <span class="sr-only">Toggle theme</span>
            </Tooltip.Trigger>
            <Tooltip.Content>
                <p>Toggle theme</p>
            </Tooltip.Content>
        </Tooltip.Root>
    </Tooltip.Provider>
</div>
