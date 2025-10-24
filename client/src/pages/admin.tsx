import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Save, Trash2, Play, Settings } from "lucide-react";
import type { Kpi, Season, InsertKpi, InsertSeason } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newKpiOpen, setNewKpiOpen] = useState(false);
  const [newSeasonOpen, setNewSeasonOpen] = useState(false);

  const { data: kpis } = useQuery<Kpi[]>({
    queryKey: ["/api/kpis"],
  });

  const { data: season } = useQuery<Season>({
    queryKey: ["/api/seasons/active"],
  });

  // KPI Mutations
  const createKpiMutation = useMutation({
    mutationFn: async (data: InsertKpi) => {
      return await apiRequest("POST", "/api/kpis", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "KPI created successfully" });
      setNewKpiOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/kpis"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateKpiMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Kpi> }) => {
      return await apiRequest("PATCH", `/api/kpis/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "KPI updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/kpis"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteKpiMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/kpis/${id}`, null);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "KPI deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/kpis"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Season Mutations
  const createSeasonMutation = useMutation({
    mutationFn: async (data: InsertSeason) => {
      return await apiRequest("POST", "/api/seasons", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Season created successfully" });
      setNewSeasonOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const generateMatchupsMutation = useMutation({
    mutationFn: async (week: number) => {
      return await apiRequest("POST", "/api/matchups/generate", { week });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Matchups generated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/matchups"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleKpiSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertKpi = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      unit: formData.get("unit") as string,
      weight: 1.0,
      isActive: true,
      displayOrder: kpis?.length || 0,
    };
    createKpiMutation.mutate(data);
  };

  const handleSeasonSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertSeason = {
      name: formData.get("name") as string,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
      regularSeasonWeeks: parseInt(formData.get("regularSeasonWeeks") as string),
      playoffWeeks: parseInt(formData.get("playoffWeeks") as string),
      currentWeek: 1,
      isActive: true,
    };
    createSeasonMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage KPIs, seasons, and matchups</p>
      </div>

      <Tabs defaultValue="kpis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="kpis" data-testid="tab-kpis">KPIs</TabsTrigger>
          <TabsTrigger value="season" data-testid="tab-season">Season</TabsTrigger>
          <TabsTrigger value="matchups" data-testid="tab-matchups">Matchups</TabsTrigger>
        </TabsList>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl font-bold">KPI Configuration</h2>
            <Dialog open={newKpiOpen} onOpenChange={setNewKpiOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-kpi">
                  <Plus className="h-4 w-4 mr-2" />
                  Add KPI
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New KPI</DialogTitle>
                  <DialogDescription>Add a new performance indicator</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleKpiSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required data-testid="input-kpi-name" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" data-testid="input-kpi-description" />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" name="unit" placeholder="e.g., calls, %, hours" data-testid="input-kpi-unit" />
                  </div>
                  <Button type="submit" className="w-full" data-testid="button-create-kpi">
                    Create KPI
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {kpis?.map((kpi) => (
              <Card key={kpi.id} data-testid={`kpi-card-${kpi.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{kpi.name}</CardTitle>
                      <CardDescription>{kpi.description}</CardDescription>
                      {kpi.unit && <p className="text-sm text-muted-foreground mt-1">Unit: {kpi.unit}</p>}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteKpiMutation.mutate(kpi.id)}
                      data-testid={`button-delete-kpi-${kpi.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`active-${kpi.id}`}>Active</Label>
                    <Switch
                      id={`active-${kpi.id}`}
                      checked={kpi.isActive}
                      onCheckedChange={(checked) =>
                        updateKpiMutation.mutate({ id: kpi.id, data: { isActive: checked } })
                      }
                      data-testid={`switch-active-${kpi.id}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`weight-${kpi.id}`}>Weight: {kpi.weight.toFixed(1)}</Label>
                    <Slider
                      id={`weight-${kpi.id}`}
                      min={0}
                      max={10}
                      step={0.1}
                      value={[kpi.weight]}
                      onValueChange={([value]) =>
                        updateKpiMutation.mutate({ id: kpi.id, data: { weight: value } })
                      }
                      className="mt-2"
                      data-testid={`slider-weight-${kpi.id}`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Season Tab */}
        <TabsContent value="season" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl font-bold">Season Management</h2>
            <Dialog open={newSeasonOpen} onOpenChange={setNewSeasonOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-season">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Season
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Season</DialogTitle>
                  <DialogDescription>Set up a new competition period</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSeasonSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="season-name">Name</Label>
                    <Input id="season-name" name="name" required data-testid="input-season-name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input id="startDate" name="startDate" type="date" required data-testid="input-start-date" />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input id="endDate" name="endDate" type="date" required data-testid="input-end-date" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="regularSeasonWeeks">Regular Season Weeks</Label>
                      <Input
                        id="regularSeasonWeeks"
                        name="regularSeasonWeeks"
                        type="number"
                        defaultValue="10"
                        required
                        data-testid="input-regular-weeks"
                      />
                    </div>
                    <div>
                      <Label htmlFor="playoffWeeks">Playoff Weeks</Label>
                      <Input
                        id="playoffWeeks"
                        name="playoffWeeks"
                        type="number"
                        defaultValue="4"
                        required
                        data-testid="input-playoff-weeks"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" data-testid="button-submit-season">
                    Create Season
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {season && (
            <Card>
              <CardHeader>
                <CardTitle>{season.name}</CardTitle>
                <CardDescription>
                  {new Date(season.startDate).toLocaleDateString()} -{" "}
                  {new Date(season.endDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current Week:</span>{" "}
                    <span className="font-semibold">{season.currentWeek}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Regular Season:</span>{" "}
                    <span className="font-semibold">{season.regularSeasonWeeks} weeks</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Playoffs:</span>{" "}
                    <span className="font-semibold">{season.playoffWeeks} weeks</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <span className="font-semibold">{season.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Matchups Tab */}
        <TabsContent value="matchups" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl font-bold">Matchup Generation</h2>
            <Button
              onClick={() => season && generateMatchupsMutation.mutate(season.currentWeek)}
              disabled={!season || generateMatchupsMutation.isPending}
              data-testid="button-generate-matchups"
            >
              <Play className="h-4 w-4 mr-2" />
              {generateMatchupsMutation.isPending ? "Generating..." : "Generate Matchups"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Automatic Matchup Scheduler</CardTitle>
              <CardDescription>
                Generate random pairings for the current week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Click the button above to automatically create matchups for Week {season?.currentWeek || 1}.
                The system will pair participants randomly and ensure fair competition.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
