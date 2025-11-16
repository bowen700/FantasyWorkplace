import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Award, Trophy, Target, TrendingUp, Zap, Star, Crown, User, Camera } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import type { Badge, UserBadge } from "@shared/schema";

interface BadgeWithEarned extends Badge {
  earned?: boolean;
  earnedAt?: Date;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || "");

  // Sync state with user data when it changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setProfileImageUrl(user.profileImageUrl || "");
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; profileImageUrl: string }) => {
      return await apiRequest("PATCH", `/api/users/${user?.id}/profile`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    if (!firstName || !lastName) {
      toast({
        title: "Error",
        description: "First name and last name are required",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate({ firstName, lastName, profileImageUrl });
  };

  const { data: allBadges, isLoading: badgesLoading } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
  });

  const { data: userBadges, isLoading: userBadgesLoading } = useQuery<UserBadge[]>({
    queryKey: ["/api/user-badges", user?.id],
    enabled: !!user,
  });

  const badgesWithStatus: BadgeWithEarned[] = allBadges?.map((badge) => {
    const userBadge = userBadges?.find((ub) => ub.badgeId === badge.id);
    return {
      ...badge,
      earned: !!userBadge,
      earnedAt: userBadge?.earnedAt,
    };
  }) || [];

  const getIconComponent = (iconName?: string) => {
    const icons: Record<string, any> = {
      trophy: Trophy,
      award: Award,
      target: Target,
      "trending-up": TrendingUp,
      zap: Zap,
      star: Star,
      crown: Crown,
    };
    const Icon = icons[iconName || "award"] || Award;
    return Icon;
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      performance: "bg-primary/10 text-primary",
      consistency: "bg-secondary/50 text-foreground",
      comeback: "bg-accent/50 text-accent-foreground",
      dominance: "bg-muted/50 text-foreground",
    };
    return colors[category || "performance"] || colors.performance;
  };

  const earnedBadges = badgesWithStatus.filter((b) => b.earned);
  const lockedBadges = badgesWithStatus.filter((b) => !b.earned);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-4xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile and view your achievements
        </p>
      </div>

      {/* Profile Editing Section */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your name and profile picture</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileImageUrl} />
                <AvatarFallback className="text-2xl">
                  {firstName?.charAt(0)}{lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover-elevate">
                <Camera className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="profileImageUrl">Profile Picture URL</Label>
              <Input
                id="profileImageUrl"
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                data-testid="input-profile-image"
              />
              <p className="text-xs text-muted-foreground">Enter a URL to your profile picture</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                data-testid="input-last-name"
              />
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
            data-testid="button-save-profile"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Badges & Achievements Section */}
      <div>
        <h2 className="font-display text-3xl font-bold mb-2">Badges & Achievements</h2>
        <p className="text-muted-foreground">
          Collect badges for your accomplishments throughout the season
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Badges</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{earnedBadges.length}</div>
            <p className="text-xs text-muted-foreground">
              {allBadges?.length ? `${earnedBadges.length}/${allBadges.length} earned` : "Loading..."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">
              {allBadges?.length ? Math.round((earnedBadges.length / allBadges.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Collection progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">
              {earnedBadges.filter((b) => {
                const earnedDate = b.earnedAt ? new Date(b.earnedAt) : null;
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return earnedDate && earnedDate > weekAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Earned this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Earned Badges */}
      <div>
        <h2 className="font-display text-2xl font-bold mb-4">Earned Badges</h2>
        {badgesLoading || userBadgesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : earnedBadges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {earnedBadges.map((badge) => {
              const Icon = getIconComponent(badge.icon);
              return (
                <Card
                  key={badge.id}
                  className="overflow-hidden border-primary/50"
                  data-testid={`badge-earned-${badge.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${getCategoryColor(badge.category)}`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <BadgeUI variant="default" className="text-xs">
                        {badge.category}
                      </BadgeUI>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="mb-2">{badge.name}</CardTitle>
                    <CardDescription className="mb-4">{badge.description}</CardDescription>
                    {badge.earnedAt && (
                      <p className="text-xs text-muted-foreground">
                        Earned {new Date(badge.earnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <CardTitle className="mb-2">No Badges Yet</CardTitle>
              <CardDescription>
                Keep competing in matchups to earn your first badge!
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Locked Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedBadges.map((badge) => {
              const Icon = getIconComponent(badge.icon);
              return (
                <Card
                  key={badge.id}
                  className="opacity-60"
                  data-testid={`badge-locked-${badge.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg bg-muted`}>
                        <Icon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <BadgeUI variant="outline" className="text-xs">
                        {badge.category}
                      </BadgeUI>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="mb-2 text-muted-foreground">{badge.name}</CardTitle>
                    <CardDescription>{badge.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
