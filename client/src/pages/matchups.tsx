import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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

export default function Matchups() {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState<string>("current");

  const { data: season } = useQuery<Season>({
    queryKey: ["/api/seasons/active"],
  });

  const { data: matchups, isLoading } = useQuery<MatchupWithPlayers[]>({
    queryKey: ["/api/matchups", selectedWeek === "current" ? season?.currentWeek : selectedWeek],
    enabled: !!season,
  });

  const weekOptions = season
    ? Array.from({ length: season.regularSeasonWeeks + season.playoffWeeks }, (_, i) => i + 1)
    : [];

  const getInitials = (user?: User) => {
    if (!user) return "?";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold mb-2">Matchups</h1>
          <p className="text-muted-foreground">Head-to-head competition results</p>
        </div>
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-40" data-testid="select-week">
            <SelectValue placeholder="Select week" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Week</SelectItem>
            {weekOptions.map((week) => (
              <SelectItem key={week} value={week.toString()}>
                Week {week}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : matchups && matchups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matchups.map((matchup) => (
            <Card
              key={matchup.id}
              className={`overflow-hidden ${
                (matchup.player1Id === user?.id || matchup.player2Id === user?.id)
                  ? "border-primary"
                  : ""
              }`}
              data-testid={`matchup-card-${matchup.id}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Week {matchup.week}</CardTitle>
                  {matchup.isPlayoff && (
                    <Badge variant="default">Playoff</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Player 1 */}
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-16 w-16 mb-2">
                      <AvatarImage src={matchup.player1?.profileImageUrl || undefined} />
                      <AvatarFallback>{getInitials(matchup.player1)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium text-sm">
                      {matchup.player1?.firstName} {matchup.player1?.lastName}
                    </div>
                    <div className="text-3xl font-bold font-display mt-2">
                      {matchup.player1Score !== null ? matchup.player1Score.toFixed(1) : "-"}
                    </div>
                  </div>

                  {/* VS Badge */}
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                      VS
                    </div>
                    {matchup.winnerId && (
                      <Trophy className="h-6 w-6 text-primary mt-2" />
                    )}
                  </div>

                  {/* Player 2 */}
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-16 w-16 mb-2">
                      <AvatarImage src={matchup.player2?.profileImageUrl || undefined} />
                      <AvatarFallback>{getInitials(matchup.player2)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium text-sm">
                      {matchup.player2?.firstName} {matchup.player2?.lastName}
                    </div>
                    <div className="text-3xl font-bold font-display mt-2">
                      {matchup.player2Score !== null ? matchup.player2Score.toFixed(1) : "-"}
                    </div>
                  </div>
                </div>

                {matchup.winnerId && (
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    Winner:{" "}
                    <span className="font-semibold text-foreground">
                      {matchup.winner?.firstName} {matchup.winner?.lastName}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
