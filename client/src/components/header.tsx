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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { User as UserType } from "@shared/schema";

export function Header() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; email: string }) => {
      return await apiRequest("POST", "/api/auth/create-profile", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Success",
        description: "Profile created successfully",
      });
      setShowCreateProfile(false);
      setNewProfile({ firstName: "", lastName: "", email: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      // Auto-select the newly created user
      if (response.user?.id) {
        handleUserSelect(response.user.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
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
              onClick={() => {
                setShowUserSelection(false);
                setShowCreateProfile(true);
              }}
              data-testid="button-add-profile"
            >
              Add Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Profile Dialog */}
      <Dialog open={showCreateProfile} onOpenChange={setShowCreateProfile}>
        <DialogContent data-testid="dialog-create-profile">
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
            <DialogDescription>
              Enter the details for the new user profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={newProfile.firstName}
                onChange={(e) => setNewProfile({ ...newProfile, firstName: e.target.value })}
                placeholder="Enter first name"
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={newProfile.lastName}
                onChange={(e) => setNewProfile({ ...newProfile, lastName: e.target.value })}
                placeholder="Enter last name"
                data-testid="input-last-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newProfile.email}
                onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })}
                placeholder="Enter email address"
                data-testid="input-email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateProfile(false);
                setNewProfile({ firstName: "", lastName: "", email: "" });
              }}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createProfileMutation.mutate(newProfile)}
              disabled={!newProfile.firstName || !newProfile.lastName || !newProfile.email || createProfileMutation.isPending}
              data-testid="button-submit-create"
            >
              {createProfileMutation.isPending ? "Creating..." : "Create Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
