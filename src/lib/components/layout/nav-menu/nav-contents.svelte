<script lang="ts">
    import * as Sidebar from '$lib/components/ui/sidebar';
    import { Home, Heart, ChartNoAxesColumn, LayoutDashboard, DraftingCompass, MousePointerClick, Anvil } from "lucide-svelte";

    interface Item {
      title: string;
      url: string;
      // Use if providing an icon with Lucide.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      icon?: any;
      // Use if using a custom image a san icon.
      iconString?: string;
      isActive?: boolean;
      items?: Item[]
    }

    const primaryMenuItems: Item[] = [
        {
            title: 'Home',
            url: '#',
            icon: Home,
            isActive: true,
        },
        {
            title: 'Dashboard',
            url: '#',
            icon: LayoutDashboard,
        },
        {
            title: 'Favorite Items',
            url: '#',
            icon: Heart,
            isActive: true,
        },
        {
            title: 'Skill levels',
            url: '#',
            icon: ChartNoAxesColumn,
            isActive: true,
        }
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
      }
    ];
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
