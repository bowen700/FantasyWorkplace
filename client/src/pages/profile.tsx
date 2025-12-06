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
import { Award, Trophy, Target, TrendingUp, Zap, Star, Crown, Upload, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect, useRef } from "react";
import type { Badge, UserBadge } from "@shared/schema";

interface BadgeWithEarned extends Badge {
  earned?: boolean;
  earnedAt?: Date | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const response = await fetch(`/api/users/${user?.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch("/api/upload/profile-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload image");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setProfileImageUrl(data.imageUrl);
      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      uploadImageMutation.mutate(file);
    }
  };

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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl md:text-4xl font-bold mb-1 md:mb-2">Profile</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage your profile and view your achievements
        </p>
      </div>

      {/* Profile Editing Section */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Edit Profile</CardTitle>
          <CardDescription className="text-sm">Update your name and profile picture</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
            <div className="relative flex-shrink-0">
              <Avatar className="h-20 w-20 md:h-24 md:w-24">
                <AvatarImage src={profileImageUrl} />
                <AvatarFallback className="text-xl md:text-2xl">
                  {firstName?.charAt(0)}{lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadImageMutation.isPending}
                className="absolute bottom-0 right-0 h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover-elevate disabled:opacity-50"
                data-testid="button-change-avatar"
              >
                {uploadImageMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary-foreground animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary-foreground" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-profile-image-file"
              />
            </div>
            <div className="flex-1 w-full space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadImageMutation.isPending}
                  data-testid="button-upload-image"
                >
                  {uploadImageMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
                {profileImageUrl && (
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                    Image uploaded
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a JPEG, PNG, GIF, or WebP image (max 5MB)
              </p>
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
        <h2 className="font-display text-xl md:text-3xl font-bold mb-1 md:mb-2">Badges & Achievements</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Collect badges for your accomplishments throughout the season
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Badges</CardTitle>
            <Award className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold font-display">{earnedBadges.length}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {allBadges?.length ? `${earnedBadges.length}/${allBadges.length}` : "..."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Complete</CardTitle>
            <Target className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold font-display">
              {allBadges?.length ? Math.round((earnedBadges.length / allBadges.length) * 100) : 0}%
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground">Progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Recent</CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold font-display">
              {earnedBadges.filter((b) => {
                const earnedDate = b.earnedAt ? new Date(b.earnedAt) : null;
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return earnedDate && earnedDate > weekAgo;
              }).length}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Earned Badges */}
      <div>
        <h2 className="font-display text-lg md:text-2xl font-bold mb-3 md:mb-4">Earned Badges</h2>
        {badgesLoading || userBadgesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : earnedBadges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
          <h2 className="font-display text-lg md:text-2xl font-bold mb-3 md:mb-4">Locked Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
