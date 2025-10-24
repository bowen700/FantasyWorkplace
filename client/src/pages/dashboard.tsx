import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp, Target, Award } from "lucide-react";
import type { Matchup, Season, KpiData, UserBadge } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: season, isLoading: seasonLoading } = useQuery<Season>({
    queryKey: ["/api/seasons/active"],
  });

  const { data: recentMatchups, isLoading: matchupsLoading } = useQuery<Matchup[]>({
    queryKey: ["/api/matchups/recent"],
    enabled: !!user && !!season,
  });

  const { data: weeklyKpiData, isLoading: kpiLoading } = useQuery<KpiData[]>({
    queryKey: ["/api/kpi-data/weekly", season?.currentWeek],
    enabled: !!user && !!season,
  });

  const { data: userBadges, isLoading: badgesLoading } = useQuery<UserBadge[]>({
    queryKey: ["/api/user-badges", user?.id],
    enabled: !!user,
  });

  // Calculate user's record
  const userRecord = recentMatchups?.reduce(
    (acc, matchup) => {
      if (matchup.winnerId === user?.id) {
        acc.wins++;
      } else if (matchup.player1Id === user?.id || matchup.player2Id === user?.id) {
        acc.losses++;
      }
      return acc;
    },
    { wins: 0, losses: 0 }
  );

  if (seasonLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div>
        <h1 className="font-display text-4xl font-bold mb-2">
          Welcome back, {user?.firstName || "Player"}!
        </h1>
        <p className="text-muted-foreground">
          {season?.name} - Week {season?.currentWeek} of {season ? season.regularSeasonWeeks + season.playoffWeeks : 0}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Season Record</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {matchupsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold font-display">
                {userRecord?.wins || 0} - {userRecord?.losses || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {userRecord && userRecord.wins + userRecord.losses > 0
                ? `${((userRecord.wins / (userRecord.wins + userRecord.losses)) * 100).toFixed(0)}% win rate`
                : "No matchups yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly KPIs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {kpiLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-display">{weeklyKpiData?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Submitted this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {badgesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold font-display">{userBadges?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Total achievements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Season Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {seasonLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold font-display">
                {season?.currentWeek || 0}/{season ? season.regularSeasonWeeks + season.playoffWeeks : 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Weeks completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Matchups */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Matchups</CardTitle>
          <CardDescription>Your latest head-to-head results</CardDescription>
        </CardHeader>
        <CardContent>
          {matchupsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : recentMatchups && recentMatchups.length > 0 ? (
            <div className="space-y-4">
              {recentMatchups.slice(0, 3).map((matchup) => (
                <div
                  key={matchup.id}
                  className="flex items-center justify-between p-4 border rounded-md"
                  data-testid={`matchup-${matchup.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">Week {matchup.week}</div>
                    <div className="font-medium">
                      {matchup.player1Score !== null && matchup.player2Score !== null ? (
                        <span className={matchup.winnerId === user?.id ? "text-primary font-semibold" : ""}>
                          {matchup.player1Score.toFixed(1)} - {matchup.player2Score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </div>
                  </div>
                  {matchup.winnerId === user?.id && (
                    <Trophy className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No matchups yet. Check back when the season starts!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
