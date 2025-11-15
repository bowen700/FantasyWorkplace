import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, BarChart3 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function Landing() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { toast } = useToast();

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: showUserSelection,
  });

  const selectUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", "/api/auth/select-user", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleGetStarted = () => {
    setShowPasswordDialog(true);
    setPassword("");
    setPasswordError("");
  };

  const handlePasswordSubmit = async () => {
    try {
      const response = await apiRequest("POST", "/api/auth/verify-password", { password });
      if (response) {
        setShowPasswordDialog(false);
        setShowUserSelection(true);
        setPasswordError("");
      }
    } catch (error: any) {
      setPasswordError(error.message || "Incorrect password. Please try again.");
    }
  };

  const handleUserSelect = (userId: string) => {
    selectUserMutation.mutate(userId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <div className="flex justify-center mb-6">
            <Trophy className="h-20 w-20 text-primary" />
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-4">
            Fantasy Workplace
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Turn employee performance into friendly, gamified competition
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            data-testid="button-get-started"
            className="font-semibold"
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-primary" />
                <CardTitle>Weekly Matchups</CardTitle>
              </div>
              <CardDescription>
                Compete head-to-head against colleagues in weekly KPI challenges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Face off in fantasy sports-style matchups based on your performance metrics. Win your matchups to climb the standings and secure a playoff spot.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-primary" />
                <CardTitle>Playoff Tournament</CardTitle>
              </div>
              <CardDescription>
                Compete for the championship
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Top performers advance to a 3-week playoff tournament. Battle through elimination rounds to claim the ultimate title.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <CardTitle>Fair & Transparent</CardTitle>
              </div>
              <CardDescription>
                Data integrity you can trust
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Voluntary participation with clear rules. Performance data is used for motivation only, not HR decisions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent data-testid="dialog-password">
          <DialogHeader>
            <DialogTitle>Enter Team Password</DialogTitle>
            <DialogDescription>
              Please enter the team password to access Fantasy Workplace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                placeholder="Enter password"
                data-testid="input-password"
              />
              {passwordError && (
                <p className="text-sm text-destructive mt-1">{passwordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} data-testid="button-submit-password">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Selection Dialog */}
      <Dialog open={showUserSelection} onOpenChange={setShowUserSelection}>
        <DialogContent className="max-w-2xl" data-testid="dialog-user-selection">
          <DialogHeader>
            <DialogTitle>Select Your Profile</DialogTitle>
            <DialogDescription>
              Choose which user profile you want to access
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {users?.filter(u => u.salesRepNumber !== null).sort((a, b) => (a.salesRepNumber || 0) - (b.salesRepNumber || 0)).map((user) => (
              <Card
                key={user.id}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => handleUserSelect(user.id)}
                data-testid={`card-user-${user.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-base">
                      {user.firstName} {user.lastName}
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
                setPassword("");
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
