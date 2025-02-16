<script lang="ts">
    import * as Sidebar from '$lib/components/ui/sidebar';
    import * as Collapsible from '$lib/components/ui/collapsible';
    import { Home, Heart, ChartNoAxesColumn, DraftingCompass, MousePointerClick, Anvil } from "lucide-svelte";
    import ChevronRight from "lucide-svelte/icons/chevron-right";

    interface Item {
      title: string;
      url: string;
      // this should be `Component` after lucide-svelte updates types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      icon?: any;
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
        icon: DraftingCompass,
        isActive: false,
      },
      {
        title: 'Fletching',
        url: '#',
        icon: MousePointerClick,
        isActive: false,
      },
      {
        title: 'Smithing',
        url: '#',
        icon: Anvil,
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
                <Collapsible.Root open={skill.isActive} class="group/collapsible">
                    {#snippet child({ props })}
                        <Sidebar.MenuItem {...props}>
                            <Collapsible.Trigger>
                                {#snippet child({ props })}
                                    <Sidebar.MenuButton {...props}>
                                        {#snippet tooltipContent()}
                                            {skill.title}
                                        {/snippet}
                                        {#if skill.icon}
                                            <skill.icon />
                                        {/if}
                                        <span>{skill.title}</span>
                                        <ChevronRight
                                                class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                                        />
                                    </Sidebar.MenuButton>
                                {/snippet}
                            </Collapsible.Trigger>
                            <Collapsible.Content>
                                {#if skill.items}
                                    <Sidebar.MenuSub>
                                        {#each skill.items as subItem (subItem.title)}
                                            <Sidebar.MenuSubItem>
                                                <Sidebar.MenuSubButton>
                                                    {#snippet child({ props })}
                                                        <a href={subItem.url} {...props}>
                                                            <span>{subItem.title}</span>
                                                        </a>
                                                    {/snippet}
                                                </Sidebar.MenuSubButton>
                                            </Sidebar.MenuSubItem>
                                        {/each}
                                    </Sidebar.MenuSub>
                                {/if}
                            </Collapsible.Content>
                        </Sidebar.MenuItem>
                    {/snippet}
                </Collapsible.Root>
            {/each}
        </Sidebar.Menu>
    </Sidebar.GroupContent>
</Sidebar.Group>
