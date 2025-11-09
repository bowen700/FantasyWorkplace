import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import type { Matchup, Season, User } from "@shared/schema";

interface MatchupWithPlayers extends Matchup {
  player1?: User;
  player2?: User;
  winner?: User;
}

export default function League() {
  const [selectedWeek, setSelectedWeek] = useState<string>("all");

  const { data: season } = useQuery<Season>({
    queryKey: ["/api/seasons/active"],
  });

  const weekOptions = season
    ? Array.from({ length: season.regularSeasonWeeks + season.playoffWeeks }, (_, i) => i + 1)
    : [];

  // Fetch matchups for the selected week or all weeks
  const { data: matchups, isLoading } = useQuery<MatchupWithPlayers[]>({
    queryKey: selectedWeek === "all" ? ["/api/matchups/all"] : ["/api/matchups", selectedWeek],
    enabled: Boolean(season),
  });

  const getInitials = (user?: User) => {
    if (!user) return "?";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold mb-2">League</h1>
          <p className="text-muted-foreground">Browse all matchups across the season</p>
        </div>
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-40" data-testid="select-week">
            <SelectValue placeholder="Select week" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Weeks</SelectItem>
            {weekOptions.map((week) => (
              <SelectItem key={week} value={week.toString()}>
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
              </div>
            );
          })}
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
    </div>
  );
}
