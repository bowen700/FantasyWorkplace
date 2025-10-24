import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { User } from "@shared/schema";

interface LeaderboardEntry {
  user: User;
  wins: number;
  losses: number;
  totalPoints: number;
  rank: number;
  trend?: "up" | "down" | "same";
}

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const getInitials = (user: User) => {
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <Badge variant="default" className="gap-1">
          <Trophy className="h-3 w-3" />
          1st
        </Badge>
      );
    } else if (rank === 2) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Medal className="h-3 w-3" />
          2nd
        </Badge>
      );
    } else if (rank === 3) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Medal className="h-3 w-3" />
          3rd
        </Badge>
      );
    }
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  };

  const getTrendIcon = (trend?: "up" | "down" | "same") => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-primary" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
    if (trend === "same") return <Minus className="h-4 w-4 text-muted-foreground" />;
    return null;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-4xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">Season standings and rankings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Season Rankings</CardTitle>
          <CardDescription>Top performers compete for playoff spots</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.user.id}
                  className={`flex items-center gap-4 p-4 rounded-md hover-elevate ${
                    index < 3 ? "border border-primary/20" : "border"
                  }`}
                  data-testid={`leaderboard-entry-${entry.user.id}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-16 text-center">{getRankBadge(entry.rank)}</div>

                    <Avatar className="h-12 w-12">
                      <AvatarImage src={entry.user.profileImageUrl || undefined} />
                      <AvatarFallback>{getInitials(entry.user)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="font-semibold">
                        {entry.user.firstName} {entry.user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">{entry.user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Record</div>
                      <div className="font-semibold">
                        {entry.wins}-{entry.losses}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">Points</div>
                      <div className="font-bold font-display text-lg">{entry.totalPoints.toFixed(1)}</div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">Win %</div>
                      <div className="font-semibold">
                        {entry.wins + entry.losses > 0
                          ? `${((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(0)}%`
                          : "0%"}
                      </div>
                    </div>

                    {entry.trend && (
                      <div className="w-8 flex justify-center">{getTrendIcon(entry.trend)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <CardTitle className="mb-2">No Rankings Yet</CardTitle>
              <CardDescription>Rankings will appear once matchups are completed</CardDescription>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
