import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Matchup, Season, User } from "@shared/schema";

interface LeaderboardEntry {
  user: User;
  wins: number;
  losses: number;
  totalPoints: number;
  rank: number;
  trend?: "up" | "down" | "same";
}

interface MatchupWithPlayers extends Matchup {
  player1?: User;
  player2?: User;
  winner?: User;
}

export default function League() {
  const { data: season } = useQuery<Season>({
    queryKey: ["/api/seasons/active"],
  });

  const [selectedWeek, setSelectedWeek] = useState<string>("");
  
  // Set selected week to current week when season loads
  if (season?.currentWeek && !selectedWeek) {
    setSelectedWeek(season.currentWeek.toString());
  }

  const weekOptions = season
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : [];

  // Fetch matchups for the selected week
  const { data: matchups, isLoading } = useQuery<MatchupWithPlayers[]>({
    queryKey: ["/api/matchups", selectedWeek],
    enabled: Boolean(season),
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const getInitials = (user?: User) => {
    if (!user) return "?";
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

  // Group matchups by week (should only be one week, but keeping structure for consistency)
  const groupedByWeek = matchups?.reduce((acc, matchup) => {
    const week = matchup.week;
    if (!acc[week]) acc[week] = [];
    acc[week].push(matchup);
    return acc;
  }, {} as Record<number, MatchupWithPlayers[]>) || {};

  const sortedWeeks = Object.keys(groupedByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-4xl font-bold mb-1 md:mb-2">League</h1>
          <p className="text-sm md:text-base text-muted-foreground">Browse all matchups across the season</p>
        </div>
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-32 md:w-40" data-testid="select-week">
            <SelectValue placeholder="Select week" />
          </SelectTrigger>
          <SelectContent>
            {weekOptions.map((week) => (
              <SelectItem key={week} value={week.toString()} className={week === season?.currentWeek ? "font-bold" : ""}>
                Week {week}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-48" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : sortedWeeks.length > 0 ? (
        <div className="space-y-8">
          {sortedWeeks.map((week) => {
            const weekMatchups = groupedByWeek[week];
            const isPlayoffWeek = season && week > season.regularSeasonWeeks;
            
            return (
              <div key={week} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl font-bold">Week {week}</h2>
                  {isPlayoffWeek && (
                    <Badge variant="default">Playoffs</Badge>
                  )}
                </div>
                
                {/* Playoff bracket visualization for weeks 10-12 */}
                {isPlayoffWeek ? (
                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                        {/* Column 1: Quarterfinals (Week 10) or Seed 1 Bracket (Week 11+) */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-center mb-4">
                            {week === 10 ? "Quarterfinals" : "Seed 1 Bracket"}
                          </h3>
                          {week === 10 ? (
                            <>
                              {/* Seed 3 vs Seed 6 */}
                              {weekMatchups[0] && (
                                <Card className="border-primary/30" data-testid="bracket-quarterfinal-1">
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-xs">Seed 3</Badge>
                                          <span className="text-sm font-medium">
                                            {weekMatchups[0].player1?.firstName} {weekMatchups[0].player1?.lastName}
                                          </span>
                                        </div>
                                        <span className="font-bold font-display">
                                          {weekMatchups[0].player1Score?.toFixed(1) || "-"}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-xs">Seed 6</Badge>
                                          <span className="text-sm font-medium">
                                            {weekMatchups[0].player2?.firstName} {weekMatchups[0].player2?.lastName}
                                          </span>
                                        </div>
                                        <span className="font-bold font-display">
                                          {weekMatchups[0].player2Score?.toFixed(1) || "-"}
                                        </span>
                                      </div>
                                      {weekMatchups[0].winnerId && (
                                        <div className="text-center pt-2 border-t">
                                          <Trophy className="h-4 w-4 inline mr-1 text-primary" />
                                          <span className="text-xs text-muted-foreground">Winner advances</span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </>
                          ) : (
                            /* Week 11+: Show Seed 1 matchup */
                            weekMatchups[0] && (
                              <Card className="border-primary/30">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default" className="text-xs">Seed 1</Badge>
                                        <span className="text-sm font-medium">
                                          {weekMatchups[0].player1?.firstName} {weekMatchups[0].player1?.lastName}
                                        </span>
                                      </div>
                                      <span className="font-bold font-display">
                                        {weekMatchups[0].player1Score?.toFixed(1) || "-"}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">Winner</Badge>
                                        <span className="text-sm font-medium">
                                          {weekMatchups[0].player2?.firstName} {weekMatchups[0].player2?.lastName}
                                        </span>
                                      </div>
                                      <span className="font-bold font-display">
                                        {weekMatchups[0].player2Score?.toFixed(1) || "-"}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          )}
                        </div>

                        {/* Column 2: Center - Seed 4 vs Seed 5 (Week 10) or Championship (Week 12) */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-center mb-4">
                            {week === 10 ? "Quarterfinals" : week === 12 ? "Championship" : "Seed 2 Bracket"}
                          </h3>
                          {week === 10 ? (
                            <>
                              {/* Seed 4 vs Seed 5 */}
                              {weekMatchups[1] && (
                                <Card className="border-primary/30">
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-xs">Seed 4</Badge>
                                          <span className="text-sm font-medium">
                                            {weekMatchups[1].player1?.firstName} {weekMatchups[1].player1?.lastName}
                                          </span>
                                        </div>
                                        <span className="font-bold font-display">
                                          {weekMatchups[1].player1Score?.toFixed(1) || "-"}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-xs">Seed 5</Badge>
                                          <span className="text-sm font-medium">
                                            {weekMatchups[1].player2?.firstName} {weekMatchups[1].player2?.lastName}
                                          </span>
                                        </div>
                                        <span className="font-bold font-display">
                                          {weekMatchups[1].player2Score?.toFixed(1) || "-"}
                                        </span>
                                      </div>
                                      {weekMatchups[1].winnerId && (
                                        <div className="text-center pt-2 border-t">
                                          <Trophy className="h-4 w-4 inline mr-1 text-primary" />
                                          <span className="text-xs text-muted-foreground">Winner advances</span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </>
                          ) : week === 12 ? (
                            /* Week 12: Championship */
                            weekMatchups[0] && (
                              <Card className="border-primary">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-center flex items-center justify-center gap-2">
                                    <Trophy className="h-5 w-5 text-primary" />
                                    Championship
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                                      <span className="font-medium">
                                        {weekMatchups[0].player1?.firstName} {weekMatchups[0].player1?.lastName}
                                      </span>
                                      <span className="font-bold font-display text-lg">
                                        {weekMatchups[0].player1Score?.toFixed(1) || "-"}
                                      </span>
                                    </div>
                                    <div className="text-center text-xs text-muted-foreground">vs</div>
                                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                                      <span className="font-medium">
                                        {weekMatchups[0].player2?.firstName} {weekMatchups[0].player2?.lastName}
                                      </span>
                                      <span className="font-bold font-display text-lg">
                                        {weekMatchups[0].player2Score?.toFixed(1) || "-"}
                                      </span>
                                    </div>
                                    {weekMatchups[0].winnerId && (
                                      <div className="text-center pt-3 border-t">
                                        <Trophy className="h-6 w-6 inline text-primary mb-1" />
                                        <div className="font-bold text-primary">Champion!</div>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          ) : (
                            /* Week 11: Show Seed 2 matchup */
                            weekMatchups[1] && (
                              <Card className="border-primary/30">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default" className="text-xs">Seed 2</Badge>
                                        <span className="text-sm font-medium">
                                          {weekMatchups[1].player1?.firstName} {weekMatchups[1].player1?.lastName}
                                        </span>
                                      </div>
                                      <span className="font-bold font-display">
                                        {weekMatchups[1].player1Score?.toFixed(1) || "-"}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">Winner</Badge>
                                        <span className="text-sm font-medium">
                                          {weekMatchups[1].player2?.firstName} {weekMatchups[1].player2?.lastName}
                                        </span>
                                      </div>
                                      <span className="font-bold font-display">
                                        {weekMatchups[1].player2Score?.toFixed(1) || "-"}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          )}
                        </div>

                        {/* Column 3: Byes (Week 10) or empty for now */}
                        {week === 10 && (
                          <div className="space-y-4">
                            <h3 className="font-semibold text-center mb-4">First Round Byes</h3>
                            <Card className="border-primary">
                              <CardContent className="p-4 text-center">
                                <Badge variant="default" className="mb-2">Seed 1</Badge>
                                <div className="text-sm text-muted-foreground">Bye to Week 11</div>
                              </CardContent>
                            </Card>
                            <Card className="border-primary">
                              <CardContent className="p-4 text-center">
                                <Badge variant="default" className="mb-2">Seed 2</Badge>
                                <div className="text-sm text-muted-foreground">Bye to Week 11</div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  /* Regular season matchup grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {weekMatchups.map((matchup) => (
                      <Card
                        key={matchup.id}
                        className="overflow-hidden"
                        data-testid={`matchup-card-${matchup.id}`}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between gap-2">
                            {/* Player 1 */}
                            <div className="flex flex-col items-center text-center flex-1">
                              <Avatar className="h-12 w-12 mb-2">
                                <AvatarImage src={matchup.player1?.profileImageUrl || undefined} />
                                <AvatarFallback>{getInitials(matchup.player1)}</AvatarFallback>
                              </Avatar>
                              <div className="font-medium text-xs truncate w-full">
                                {matchup.player1?.firstName} {matchup.player1?.lastName}
                              </div>
                              <div className="text-2xl font-bold font-display mt-1">
                                {matchup.player1Score !== null ? matchup.player1Score.toFixed(1) : "-"}
                              </div>
                            </div>

                            {/* VS Badge */}
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                                VS
                              </div>
                              {matchup.winnerId && (
                                <Trophy className="h-4 w-4 text-primary mt-1" />
                              )}
                            </div>

                            {/* Player 2 */}
                            <div className="flex flex-col items-center text-center flex-1">
                              <Avatar className="h-12 w-12 mb-2">
                                <AvatarImage src={matchup.player2?.profileImageUrl || undefined} />
                                <AvatarFallback>{getInitials(matchup.player2)}</AvatarFallback>
                              </Avatar>
                              <div className="font-medium text-xs truncate w-full">
                                {matchup.player2?.firstName} {matchup.player2?.lastName}
                              </div>
                              <div className="text-2xl font-bold font-display mt-1">
                                {matchup.player2Score !== null ? matchup.player2Score.toFixed(1) : "-"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {season && selectedWeek && parseInt(selectedWeek) > season.regularSeasonWeeks ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl font-bold">Week {selectedWeek}</h2>
                <Badge variant="default">Playoffs</Badge>
              </div>
              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <CardTitle className="mb-2">Playoff Matchups Not Generated Yet</CardTitle>
                  <CardDescription>
                    {parseInt(selectedWeek) === 10
                      ? "Week 10 Quarterfinal matchups (top 6 seeds) will be generated by your admin after the regular season ends."
                      : parseInt(selectedWeek) === 11
                      ? "Week 11 Semifinal matchups will be generated after Week 10 winners are determined."
                      : "Week 12 Championship matchup will be generated after Week 11 winners are determined."}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <CardTitle className="mb-2">No Matchups Yet</CardTitle>
                <CardDescription>
                  Matchups will appear here once the season starts and pairings are generated
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Separator className="my-8" />

      {/* Leaderboard Section */}
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">Leaderboard</h2>
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Season Rankings</CardTitle>
            <CardDescription className="text-sm">Top performers compete for playoff spots</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            {leaderboardLoading ? (
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
                    className={`flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-3 md:p-4 rounded-md hover-elevate ${
                      index < 3 ? "border border-primary/20" : "border"
                    }`}
                    data-testid={`leaderboard-entry-${entry.user.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 md:w-16 text-center">{getRankBadge(entry.rank)}</div>

                      <Avatar className="h-10 w-10 md:h-12 md:w-12">
                        <AvatarImage src={entry.user.profileImageUrl || undefined} />
                        <AvatarFallback>{getInitials(entry.user)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm md:text-base truncate">
                          {entry.user.firstName} {entry.user.lastName}
                        </div>
                        <div className="hidden md:block text-sm text-muted-foreground">{entry.user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 text-center pl-12 md:pl-0">
                      <div>
                        <div className="text-xs md:text-sm text-muted-foreground">Record</div>
                        <div className="font-semibold text-sm md:text-base">
                          {entry.wins}-{entry.losses}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs md:text-sm text-muted-foreground">Points</div>
                        <div className="font-bold font-display text-base md:text-lg">{entry.totalPoints.toFixed(1)}</div>
                      </div>

                      <div>
                        <div className="text-xs md:text-sm text-muted-foreground">Win %</div>
                        <div className="font-semibold text-sm md:text-base">
                          {entry.wins + entry.losses > 0
                            ? `${((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(0)}%`
                            : "0%"}
                        </div>
                      </div>

                      {entry.trend && (
                        <div className="w-6 md:w-8 flex justify-center">{getTrendIcon(entry.trend)}</div>
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
    </div>
  );
}
