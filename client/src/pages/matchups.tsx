import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trophy, ChevronDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Matchup, Season, User, Kpi, KpiData, InsertKpiData } from "@shared/schema";

interface MatchupWithPlayers extends Matchup {
  player1?: User;
  player2?: User;
  winner?: User;
}

interface KpiInput {
  kpiId: string;
  value: string;
}

interface UserStats {
  wins: number;
  losses: number;
  averageScore: number;
}

export default function Matchups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [kpiInputs, setKpiInputs] = useState<KpiInput[]>([]);
  const lastPopulatedRef = useRef<{ userId: string; week: number } | null>(null);

  const { data: season } = useQuery<Season>({
    queryKey: ["/api/seasons/active"],
  });

  const { data: kpis } = useQuery<Kpi[]>({
    queryKey: ["/api/kpis"],
  });

  // Week selector state - defaults to current week when season loads
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  
  // Set selected week to current week when season loads
  if (season?.currentWeek && !selectedWeek) {
    setSelectedWeek(season.currentWeek.toString());
  }

  const weekKey = selectedWeek || season?.currentWeek?.toString();
  
  const weekOptions = season
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : [];

  const { data: matchups, isLoading: matchupsLoading } = useQuery<MatchupWithPlayers[]>({
    queryKey: ["/api/matchups", weekKey],
    enabled: Boolean(season && weekKey),
  });

  const { data: kpiData, isLoading: kpiDataLoading } = useQuery<KpiData[]>({
    queryKey: ["/api/kpi-data/weekly", weekKey],
    enabled: Boolean(season && weekKey),
  });

  const { data: allMatchups } = useQuery<MatchupWithPlayers[]>({
    queryKey: ["/api/matchups/all"],
  });

  const myMatchup = matchups?.find(
    (m) => m.player1Id === user?.id || m.player2Id === user?.id
  );

  const isPlayer1 = myMatchup?.player1Id === user?.id;
  const myUser = isPlayer1 ? myMatchup?.player1 : myMatchup?.player2;
  const opponentUser = isPlayer1 ? myMatchup?.player2 : myMatchup?.player1;
  const myScore = isPlayer1 ? myMatchup?.player1Score : myMatchup?.player2Score;
  const opponentScore = isPlayer1 ? myMatchup?.player2Score : myMatchup?.player1Score;

  const calculateUserStats = (userId: string | undefined): UserStats => {
    if (!userId || !allMatchups) return { wins: 0, losses: 0, averageScore: 0 };

    let wins = 0;
    let losses = 0;
    let totalScore = 0;
    let matchCount = 0;

    // Only count matchups from previous weeks (exclude current week)
    const currentWeek = season?.currentWeek || 0;
    
    allMatchups.forEach((m) => {
      // Skip matchups from the current week
      if (m.week >= currentWeek) return;
      
      const isP1 = m.player1Id === userId;
      const isP2 = m.player2Id === userId;

      if (isP1 || isP2) {
        if (m.winnerId === userId) wins++;
        else if (m.winnerId && m.winnerId !== userId) losses++;

        const score = isP1 ? m.player1Score : m.player2Score;
        if (score !== null) {
          totalScore += score;
          matchCount++;
        }
      }
    });

    return {
      wins,
      losses,
      averageScore: matchCount > 0 ? totalScore / matchCount : 0,
    };
  };

  const myStats = calculateUserStats(user?.id);
  const opponentStats = calculateUserStats(isPlayer1 ? myMatchup?.player2Id : myMatchup?.player1Id);

  // Helper function to safely evaluate a formula
  const evaluateFormula = (formula: string, value: number): number => {
    try {
      // Replace 'value' in the formula with the actual value
      // Support basic math operations: +, -, *, /, parentheses
      const formulaWithValue = formula.replace(/value/g, value.toString());
      const sanitizedFormula = formulaWithValue.replace(/[^0-9+\-*/().]/g, ''); // Remove any non-math characters
      
      // Use Function constructor for safe evaluation (restricted to math)
      const result = new Function(`return ${sanitizedFormula}`)();
      return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (error) {
      console.error(`Error evaluating formula "${formula}" with value ${value}:`, error);
      return 0;
    }
  };

  const getKpiBreakdown = (userId: string | undefined) => {
    if (!userId || !kpiData || !kpis) return [];

    // Default conversion factors for KPIs without formulas
    const defaultConversionFactors: Record<string, number> = {
      "Sales Gross Profit": 300,    // 300 GP = 1 point
      "Sales Revenue": 3000,         // 3000 revenue = 1 point
      "Leads Talked To": 3,          // 3 leads = 1 point
      "Deals Closed": 1,             // 1 deal = 1 point
    };

    const userKpiData = kpiData.filter((d) => d.userId === userId);
    
    return kpis
      .filter((kpi) => kpi.isActive)
      .map((kpi) => {
        const data = userKpiData.find((d) => d.kpiId === kpi.id);
        const value = data?.value ?? 0;
        
        // Use conversion formula if available, otherwise fall back to default factors
        let points = 0;
        if (kpi.conversionFormula) {
          points = evaluateFormula(kpi.conversionFormula, value);
        } else {
          const conversionFactor = defaultConversionFactors[kpi.name] || 1;
          points = value / conversionFactor;
        }
        
        return {
          name: kpi.name,
          value,
          points,
          weight: kpi.weight,
        };
      });
  };

  const myKpiBreakdown = getKpiBreakdown(user?.id);
  const opponentKpiBreakdown = getKpiBreakdown(
    isPlayer1 ? myMatchup?.player2Id : myMatchup?.player1Id
  );

  const getInitials = (user?: User) => {
    if (!user) return "?";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  };

  const submitKpiMutation = useMutation({
    mutationFn: async (data: InsertKpiData[]) => {
      return await apiRequest("POST", "/api/kpi-data/bulk", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "KPI data uploaded successfully",
      });
      setKpiInputs([]);
      lastPopulatedRef.current = null; // Reset to allow re-population with fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/kpi-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kpi-data/weekly", weekKey] });
      queryClient.invalidateQueries({ queryKey: ["/api/matchups", weekKey] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateKpiInput = (index: number, field: keyof KpiInput, value: string) => {
    const newInputs = [...kpiInputs];
    newInputs[index][field] = value;
    setKpiInputs(newInputs);
  };

  // Pre-populate all KPIs when viewing current week
  useEffect(() => {
    if (!season || !kpis || !user) return;
    
    const isCurrentWeek = parseInt(selectedWeek || "0") === season.currentWeek;
    const currentWeekNum = parseInt(selectedWeek || "0");
    
    // Only re-populate if user or week has changed, or if kpiData has loaded/changed
    const shouldRepopulate = 
      !lastPopulatedRef.current || 
      lastPopulatedRef.current.userId !== user.id ||
      lastPopulatedRef.current.week !== currentWeekNum;
    
    if (isCurrentWeek && kpis.length > 0 && !kpiDataLoading) {
      if (shouldRepopulate) {
        const activeKpis = kpis.filter(k => k.isActive);
        const prepopulatedInputs = activeKpis.map(kpi => {
          const existingData = kpiData?.find(d => d.kpiId === kpi.id && d.userId === user.id);
          return {
            kpiId: kpi.id,
            value: existingData?.value?.toString() || "0",
          };
        });
        setKpiInputs(prepopulatedInputs);
        lastPopulatedRef.current = { userId: user.id, week: currentWeekNum };
      }
    } else if (!isCurrentWeek && kpiInputs.length > 0) {
      setKpiInputs([]);
      lastPopulatedRef.current = null;
    }
  }, [selectedWeek, season, kpis, kpiData, kpiDataLoading, user]);

  const handleSubmit = () => {
    if (!season || !user) return;

    const data: InsertKpiData[] = kpiInputs
      .filter((input) => input.kpiId && input.value)
      .map((input) => ({
        userId: user.id,
        kpiId: input.kpiId,
        seasonId: season.id,
        week: season.currentWeek,
        value: parseFloat(input.value),
      }));

    if (data.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one KPI value",
        variant: "destructive",
      });
      return;
    }

    submitKpiMutation.mutate(data);
  };

  const isLoading = matchupsLoading || kpiDataLoading;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold mb-2">Week {selectedWeek || season?.currentWeek} Matchup</h1>
          <p className="text-muted-foreground">Your head-to-head competition</p>
        </div>
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-40" data-testid="select-week">
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
        <Skeleton className="h-96" />
      ) : myMatchup && myUser && opponentUser ? (
        <Card className="border-primary">
          <CardContent className="p-8">
            <div className="grid grid-cols-3 gap-8 items-center">
              {/* Current User */}
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-32 w-32 border-4 border-primary">
                  <AvatarImage src={myUser.profileImageUrl || undefined} />
                  <AvatarFallback className="text-3xl">{getInitials(myUser)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-xl mb-1">
                    {myUser.firstName} {myUser.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Record: {myStats.wins}-{myStats.losses}</div>
                    <div>Avg: {myStats.averageScore.toFixed(1)} pts</div>
                  </div>
                </div>
                
                <div className="text-6xl font-bold font-display text-primary">
                  {myScore !== null && myScore !== undefined ? myScore.toFixed(1) : "-"}
                </div>

                <div className="w-full space-y-2">
                  {myKpiBreakdown.map((kpi, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{kpi.name}</span>
                      <span className="font-bold">{kpi.points.toFixed(1)} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* VS Badge */}
              <div className="flex flex-col items-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center font-bold text-xl">
                  VS
                </div>
                {myMatchup.winnerId && parseInt(selectedWeek || "0") < (season?.currentWeek || 0) && (
                  <div className="text-center">
                    <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="text-sm font-semibold">
                      {myMatchup.winnerId === user?.id ? "You Win!" : "Opponent Wins"}
                    </div>
                  </div>
                )}
              </div>

              {/* Opponent */}
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-32 w-32 border-4 border-border">
                  <AvatarImage src={opponentUser.profileImageUrl || undefined} />
                  <AvatarFallback className="text-3xl">{getInitials(opponentUser)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-xl mb-1">
                    {opponentUser.firstName} {opponentUser.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Record: {opponentStats.wins}-{opponentStats.losses}</div>
                    <div>Avg: {opponentStats.averageScore.toFixed(1)} pts</div>
                  </div>
                </div>
                
                <div className="text-6xl font-bold font-display">
                  {opponentScore !== null && opponentScore !== undefined ? opponentScore.toFixed(1) : "-"}
                </div>

                <div className="w-full space-y-2">
                  {opponentKpiBreakdown.map((kpi, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{kpi.name}</span>
                      <span className="font-bold">{kpi.points.toFixed(1)} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <CardTitle className="mb-2">No Matchup This Week</CardTitle>
            <CardDescription>
              Your matchup will appear once pairings are generated
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Only show KPI submission on current week */}
      {parseInt(selectedWeek || "0") === season?.currentWeek && (
        <>
          <Separator className="my-8" />

          {/* Manual Entry Section */}
          <Card>
            <CardHeader>
              <CardTitle>Submit/Edit KPI Data</CardTitle>
              <CardDescription>
                Enter your performance metrics for Week {selectedWeek}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
          {/* How the score is calculated */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate p-2 rounded-md w-full" data-testid="button-scoring-info">
              <ChevronDown className="h-4 w-4" />
              <span>How the score is calculated</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-4 rounded-md bg-muted/50 text-sm space-y-2">
              <p className="font-semibold mb-2">Point Conversion System:</p>
              <div className="space-y-1 text-muted-foreground">
                {kpis?.filter((kpi) => kpi.isActive).map((kpi) => (
                  <div key={kpi.id} className="flex justify-between">
                    <span>• {kpi.name}:</span>
                    <span className="font-medium font-mono text-xs">
                      {kpi.conversionFormula || 'No formula set'}
                    </span>
                  </div>
                ))}
                {(!kpis || kpis.filter((kpi) => kpi.isActive).length === 0) && (
                  <div className="text-center py-2 text-muted-foreground">
                    No active KPIs configured
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                Your total score is the sum of points from all KPIs. The player with the higher total score wins the matchup.
              </p>
            </CollapsibleContent>
          </Collapsible>

          {kpiInputs.map((input, index) => {
            const kpi = kpis?.find(k => k.id === input.kpiId);
            return (
              <div key={input.kpiId} className="flex items-end gap-4">
                <div className="flex-1">
                  <Label>{kpi?.name} {kpi?.unit && `(${kpi.unit})`}</Label>
                </div>
                <div className="flex-1">
                  <Input
                    id={`value-${index}`}
                    type="number"
                    step="0.01"
                    value={input.value}
                    onChange={(e) => updateKpiInput(index, "value", e.target.value)}
                    placeholder="Enter value"
                    data-testid={`input-value-${kpi?.id}`}
                  />
                </div>
              </div>
            );
          })}

          <Button
            onClick={handleSubmit}
            disabled={kpiInputs.length === 0 || submitKpiMutation.isPending}
            data-testid="button-submit"
          >
            {submitKpiMutation.isPending ? "Submitting..." : "Submit KPI Values"}
          </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
