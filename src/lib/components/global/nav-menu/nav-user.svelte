<script lang="ts">
    import * as Avatar from '$lib/components/ui/avatar';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import * as Sidebar from '$lib/components/ui/sidebar';
    import { ChevronsUpDown, Heart, BadgeCheck, CreditCard, Bell, LogOut } from 'lucide-svelte';

    const sidebar = Sidebar.useSidebar();

    const user = {
      name: 'Jaiden DeChon',
      email: 'me@jaiden.foo',
      avatar: '/npc-images/zanik.png',
    };
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger>
        {#snippet child({ props })}
            <Sidebar.MenuButton
                    size="lg"
                    class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    {...props}
            >
                <Avatar.Root class="h-8 w-8 rounded-lg">
                    <Avatar.Image src={user.avatar} alt={user.name} />
                    <Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
                </Avatar.Root>
                <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{user.name}</span>
                    <span class="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown class="ml-auto size-4" />
            </Sidebar.MenuButton>
        {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content
            class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg"
            side={sidebar.isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
    >
        <DropdownMenu.Label class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar.Root class="h-8 w-8 rounded-lg">
                    <Avatar.Image src={user.avatar} alt={user.name} />
                    <Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
                </Avatar.Root>
                <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{user.name}</span>
                    <span class="truncate text-xs">{user.email}</span>
                </div>
            </div>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
            <DropdownMenu.Item>
                <Heart />
                Buy me a coffee
            </DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
            <DropdownMenu.Item>
                <BadgeCheck />
                Account
            </DropdownMenu.Item>
            <DropdownMenu.Item>
                <Bell />
                Notifications
            </DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>
            <LogOut />
            Log out
        </DropdownMenu.Item>
    </DropdownMenu.Content>
</DropdownMenu.Root>
