import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { User as UserType } from "@shared/schema";

export function Header() {
  const { user } = useAuth();
  const [showUserSelection, setShowUserSelection] = useState(false);

  const { data: users } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  };

  const handleUserSelect = async (userId: string) => {
    try {
      await apiRequest("POST", "/api/auth/select-user", { userId });
      queryClient.clear();
      window.location.href = "/";
    } catch (error) {
      console.error("Error selecting user:", error);
    }
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-background">
      <SidebarTrigger data-testid="button-sidebar-toggle" />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="button-user-menu">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.email || "User"} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowUserSelection(true)}
            data-testid="button-change-profile"
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Change Profile</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Selection Dialog */}
      <Dialog open={showUserSelection} onOpenChange={setShowUserSelection}>
        <DialogContent className="max-w-2xl" data-testid="dialog-change-profile">
          <DialogHeader>
            <DialogTitle>Select Profile</DialogTitle>
            <DialogDescription>
              Choose which user profile you want to switch to
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {users?.filter(u => u.salesRepNumber !== null).sort((a, b) => (a.salesRepNumber || 0) - (b.salesRepNumber || 0)).map((u) => (
              <Card
                key={u.id}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => handleUserSelect(u.id)}
                data-testid={`card-user-${u.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={u.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-base">
                      {u.firstName} {u.lastName}
                    </CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUserSelection(false)}
              data-testid="button-cancel-change-profile"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
