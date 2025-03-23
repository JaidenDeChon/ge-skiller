<script lang="ts">
    import { page } from '$app/state';
    import * as Sidebar from '$lib/components/ui/sidebar';
    import { Home, Heart, ChartNoAxesColumn, Sword } from 'lucide-svelte';

    interface Item {
        title: string;
        url: string;
        // Use if providing an icon with Lucide.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        icon?: any;
        // Use if using a custom image a san icon.
        iconString?: string;
        isActive?: boolean;
        items?: Item[];
    }

    const primaryMenuItems: Item[] = [
        {
            title: 'Home',
            url: '/',
            icon: Home,
            isActive: true,
        },
        {
            title: 'Browse items',
            url: '/items',
            icon: Sword,
        },
        {
            title: 'Favorites',
            url: '/favorites',
            icon: Heart,
            isActive: true,
        },
        {
            title: 'Character stats',
            url: '#',
            icon: ChartNoAxesColumn,
            isActive: true,
        },
    ];

    const skills: Item[] = [
        {
            title: 'Crafting',
            url: '#',
            iconString: '/skill-images/crafting.png',
            isActive: false,
        },
        {
            title: 'Fletching',
            url: '#',
            iconString: '/skill-images/fletching.png',
            isActive: false,
        },
        {
            title: 'Smithing',
            url: '#',
            iconString: '/skill-images/smithing.png',
            isActive: false,
        },
    ];

    const currentPage = $derived(page.route || '');
</script>

<Sidebar.Group>
    <Sidebar.GroupContent>
        <Sidebar.Menu>
            {#each primaryMenuItems as item}
                <Sidebar.MenuItem>
                    <Sidebar.MenuButton>
                        {#snippet tooltipContent()}
                            {item.title}
                        {/snippet}
                        {#snippet child({ props })}
                            <a href={item.url} {...props}>
                                <item.icon />
                                <span>{item.title}</span>
                                {#if item.url === currentPage.id}
                                    <div class="active-route-indicator size-3 bg-foreground ml-auto rounded-full opacity-10"></div>
                                {/if}
                            </a>
                        {/snippet}
                    </Sidebar.MenuButton>
                </Sidebar.MenuItem>
            {/each}
        </Sidebar.Menu>
    </Sidebar.GroupContent>
</Sidebar.Group>

<Sidebar.Group>
    <Sidebar.GroupLabel>Item trees</Sidebar.GroupLabel>
    <Sidebar.GroupContent>
        <Sidebar.Menu>
            {#each skills as skill (skill.title)}
                <Sidebar.MenuItem>
                    <Sidebar.MenuButton>
                        {#snippet tooltipContent()}
                            {skill.title}
                        {/snippet}
                        {#if skill.icon}
                            <skill.icon />
                        {:else if skill.iconString}
                            <img src={skill.iconString} alt="skill icon" class="w-4 h-4" />
                        {/if}
                        <span>{skill.title}</span>
                    </Sidebar.MenuButton>
                </Sidebar.MenuItem>
            {/each}
        </Sidebar.Menu>
    </Sidebar.GroupContent>
</Sidebar.Group>

<style>
    .active-route-indicator {
        view-transition-name: active-route-indicator;
    }
</style>
