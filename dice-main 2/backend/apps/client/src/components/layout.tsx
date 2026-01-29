import { Settings, Moon, Sun } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppSidebar } from "@/components/app-sidebar"

interface LayoutProps {
    children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {

    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <main className="flex flex-1 flex-col p-1 bg-white shadow-sm">
                <div className="flex flex-1 flex-col bg-white rounded-lg shadow-lg overflow-hidden">
                    <header className="flex h-14 items-center justify-between px-4 lg:h-[60px] lg:px-6">
                        {/* Left side */}
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="-ml-1" />
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-2">
                            {/* Theme toggle */}
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>

                            {/* Settings */}
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Settings className="h-4 w-4" />
                                <span className="sr-only">Settings</span>
                            </Button>

                            {/* User menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="/avatars/01.png" alt="SN" />
                                            <AvatarFallback>SN</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuItem>
                                        Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        Support
                                    </DropdownMenuItem>
                                    <Separator />
                                    <DropdownMenuItem>
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    <div className="flex-1 p-6">
                        {children}
                    </div>
                </div>
            </main>
        </SidebarProvider>
    )
}
