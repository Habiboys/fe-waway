import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownTrigger,
} from "@heroui/react";
import {
  AlignJustify,
  ChevronsLeft,
  ChevronsRight,
  CircleUserRound,
} from "lucide-react";

export function DashboardNavbar({
  user,
  isDesktopSidebarOpen,
  onToggleMobileSidebar,
  onToggleDesktopSidebar,
  onProfile,
  onLogout,
}) {
  const handleAccountAction = (key) => {
    if (String(key) === "profile") {
      onProfile?.();
      return;
    }

    if (String(key) === "logout") {
      onLogout?.();
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 md:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            className="md:hidden"
            isIconOnly
            variant="flat"
            onPress={onToggleMobileSidebar}
          >
            <AlignJustify size={18} />
          </Button>
          <Button
            className="hidden md:inline-flex"
            isIconOnly
            variant="flat"
            onPress={onToggleDesktopSidebar}
          >
            {isDesktopSidebarOpen ? (
              <ChevronsLeft size={18} />
            ) : (
              <ChevronsRight size={18} />
            )}
          </Button>
          <div>
            <p className="text-sm text-slate-500">Selamat datang kembali</p>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              {user?.name || "User"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Chip color="primary" variant="flat" className="font-semibold">
            {user?.role || "member"}
          </Chip>

          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="flat" aria-label="Account menu">
                <CircleUserRound size={18} />
              </Button>
            </DropdownTrigger>
            <DropdownPopover>
              <DropdownMenu onAction={handleAccountAction}>
                <DropdownItem id="profile">Profile</DropdownItem>
                <DropdownItem id="logout" className="text-danger">
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </DropdownPopover>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
