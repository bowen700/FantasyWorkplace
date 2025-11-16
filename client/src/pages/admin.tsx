import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Save, Trash2, Play, Settings, Edit, UserX, Users, RefreshCw, ArrowLeftRight, Shuffle } from "lucide-react";
import type { Kpi, Season, InsertKpi, InsertSeason, User } from "@shared/schema";

interface MatchupWithPlayers {
  id: string;
  seasonId: string;
  week: number;
  player1Id: string;
  player2Id: string;
  player1Score: number | null;
  player2Score: number | null;
  winnerId: string | null;
  isPlayoff: boolean;
  player1?: User;
  player2?: User;
  winner?: User;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newKpiOpen, setNewKpiOpen] = useState(false);
  const [newSeasonOpen, setNewSeasonOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [editSalesRepNumber, setEditSalesRepNumber] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminPasswordError, setAdminPasswordError] = useState<string>("");
  const [currentWeekSlider, setCurrentWeekSlider] = useState<number>(1);
  const [editMatchupOpen, setEditMatchupOpen] = useState(false);
  const [selectedMatchup, setSelectedMatchup] = useState<MatchupWithPlayers | null>(null);
  const [newPlayer1Id, setNewPlayer1Id] = useState<string>("");
  const [newPlayer2Id, setNewPlayer2Id] = useState<string>("");
  const [activeUserSpots, setActiveUserSpots] = useState<number>(8);
  const [tempActiveUserSpots, setTempActiveUserSpots] = useState<number>(8);
  const [seasonShuffleModified, setSeasonShuffleModified] = useState<boolean>(false);
  const [tempRegularSeasonWeeks, setTempRegularSeasonWeeks] = useState<number>(9);
  const [editingSeasonName, setEditingSeasonName] = useState<boolean>(false);
  const [tempSeasonName, setTempSeasonName] = useState<string>("");
  const [newSeasonRegularWeeks, setNewSeasonRegularWeeks] = useState<string>("9");

  const { data: adminAccess, isLoading: adminAccessLoading } = useQuery<{ hasAccess: boolean }>({
    queryKey: ["/api/auth/check-admin-access"],
  });

  const { data: kpis } = useQuery<Kpi[]>({
    queryKey: ["/api/kpis"],
    enabled: adminAccess?.hasAccess === true,
  });

  const { data: season } = useQuery<Season>({
    queryKey: ["/api/seasons/active"],
    enabled: adminAccess?.hasAccess === true,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: adminAccess?.hasAccess === true,
  });

  const { data: allMatchups } = useQuery<MatchupWithPlayers[]>({
    queryKey: ["/api/matchups/all"],
    enabled: adminAccess?.hasAccess === true,
  });

  const verifyAdminPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      return await apiRequest("POST", "/api/auth/verify-admin-password", { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/check-admin-access"] });
      setAdminPasswordError("");
    },
    onError: (error: Error) => {
      setAdminPasswordError(error.message || "Incorrect password. Please try again.");
    },
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

  const updateSeasonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Season> }) => {
      return await apiRequest("PATCH", `/api/seasons/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Current week updated successfully" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/matchups/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matchups"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const shuffleMatchupsMutation = useMutation({
    mutationFn: async (week: number) => {
      return await apiRequest("POST", "/api/matchups/shuffle", { week });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Matchups shuffled successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/matchups/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matchups"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const shuffleSeasonMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/matchups/shuffle-season");
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Season matchups shuffled with minimal repeats" });
      queryClient.invalidateQueries({ queryKey: ["/api/matchups/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matchups"] });
      setSeasonShuffleModified(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMatchupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { player1Id: string; player2Id: string } }) => {
      return await apiRequest("PATCH", `/api/matchups/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Matchup updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/matchups/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matchups"] });
      setEditMatchupOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // User Mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      return await apiRequest("PATCH", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User updated successfully" });
      setEditUserOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matchups"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateActiveSpotsMutation = useMutation({
    mutationFn: async (spots: number) => {
      if (!season) throw new Error("No active season");
      return await apiRequest("PATCH", `/api/seasons/${season.id}`, { activeUserSpots: spots });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Active user spots updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/seasons/active"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/users/${id}`, null);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User deleted successfully" });
      setDeleteUserOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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

  const handleAdminPasswordSubmit = () => {
    verifyAdminPasswordMutation.mutate(adminPassword);
  };

  const handleSaveWeek = () => {
    if (!season) return;
    updateSeasonMutation.mutate({ id: season.id, data: { currentWeek: currentWeekSlider } });
  };

  // Sync slider with season's current week
  useEffect(() => {
    if (season) {
      setCurrentWeekSlider(season.currentWeek);
    }
  }, [season]);

  // Sync activeUserSpots with season data
  useEffect(() => {
    if (season?.activeUserSpots) {
      setActiveUserSpots(season.activeUserSpots);
      setTempActiveUserSpots(season.activeUserSpots);
    }
    if (season?.regularSeasonWeeks) {
      setTempRegularSeasonWeeks(season.regularSeasonWeeks);
    }
    if (season?.name) {
      setTempSeasonName(season.name);
    }
  }, [season]);

  // Show password prompt if access not granted
  if (adminAccessLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!adminAccess?.hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Please enter the admin password to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminPasswordSubmit()}
                placeholder="Enter admin password"
                data-testid="input-admin-password"
              />
              {adminPasswordError && (
                <p className="text-sm text-destructive mt-1">{adminPasswordError}</p>
              )}
            </div>
            <Button
              onClick={handleAdminPasswordSubmit}
              disabled={verifyAdminPasswordMutation.isPending}
              className="w-full"
              data-testid="button-submit-admin-password"
            >
              {verifyAdminPasswordMutation.isPending ? "Verifying..." : "Access Admin Panel"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage KPIs, seasons, and matchups</p>
      </div>

      {/* Season Management Section */}
      <div className="space-y-6">
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
                    <Select value={newSeasonRegularWeeks} onValueChange={setNewSeasonRegularWeeks}>
                      <SelectTrigger id="regularSeasonWeeks" data-testid="select-regular-weeks-create">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 8 }, (_, i) => i + 6).map((weeks) => (
                          <SelectItem key={weeks} value={weeks.toString()}>
                            {weeks} weeks
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="regularSeasonWeeks" value={newSeasonRegularWeeks} />
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
              <div className="flex items-center justify-between gap-2">
                {editingSeasonName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={tempSeasonName}
                      onChange={(e) => setTempSeasonName(e.target.value)}
                      className="flex-1"
                      data-testid="input-season-name"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!season || !tempSeasonName.trim()) return;
                        updateSeasonMutation.mutate({ 
                          id: season.id, 
                          data: { name: tempSeasonName.trim() } 
                        });
                        setEditingSeasonName(false);
                      }}
                      disabled={updateSeasonMutation.isPending || !tempSeasonName.trim()}
                      data-testid="button-save-season-name"
                    >
                      {updateSeasonMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTempSeasonName(season.name);
                        setEditingSeasonName(false);
                      }}
                      data-testid="button-cancel-season-name"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <CardTitle>{season.name}</CardTitle>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingSeasonName(true)}
                      data-testid="button-edit-season-name"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              <CardDescription>
                {new Date(season.startDate).toLocaleDateString()} -{" "}
                {new Date(season.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Week:</span>{" "}
                  <span className="font-semibold">{season.currentWeek}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Regular Season:</span>
                  <Select 
                    value={tempRegularSeasonWeeks.toString()} 
                    onValueChange={(value) => setTempRegularSeasonWeeks(parseInt(value))}
                  >
                    <SelectTrigger className="w-[100px]" data-testid="select-regular-weeks">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 8 }, (_, i) => i + 6).map((weeks) => (
                        <SelectItem key={weeks} value={weeks.toString()}>
                          {weeks} weeks
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tempRegularSeasonWeeks !== season.regularSeasonWeeks && (
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!season) return;
                        updateSeasonMutation.mutate({ id: season.id, data: { regularSeasonWeeks: tempRegularSeasonWeeks } });
                      }}
                      disabled={updateSeasonMutation.isPending}
                      data-testid="button-save-regular-weeks"
                    >
                      {updateSeasonMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  )}
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
              <div className="space-y-4">
                <div>
                  <Label htmlFor="week-slider">Adjust Current Week: {currentWeekSlider}</Label>
                  <Slider
                    id="week-slider"
                    min={1}
                    max={season.regularSeasonWeeks + season.playoffWeeks}
                    step={1}
                    value={[currentWeekSlider]}
                    onValueChange={([value]) => setCurrentWeekSlider(value)}
                    className="mt-2"
                    data-testid="slider-current-week"
                  />
                </div>
                <Button
                  onClick={handleSaveWeek}
                  disabled={updateSeasonMutation.isPending || currentWeekSlider === season.currentWeek}
                  className="w-full"
                  data-testid="button-save-week"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateSeasonMutation.isPending ? "Saving..." : "Save Week"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="kpis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="kpis" data-testid="tab-kpis">KPIs</TabsTrigger>
          <TabsTrigger value="matchups" data-testid="tab-matchups">Matchups</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
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

        {/* Matchups Tab */}
        <TabsContent value="matchups" className="space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold">Matchup Management</h2>
              <p className="text-muted-foreground">View and edit matchups for all weeks</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setSeasonShuffleModified(true)}
                disabled={shuffleSeasonMutation.isPending}
                data-testid="button-shuffle-season"
              >
                Shuffle Season
              </Button>
              {seasonShuffleModified && (
                <Button
                  size="sm"
                  onClick={() => shuffleSeasonMutation.mutate()}
                  disabled={shuffleSeasonMutation.isPending}
                  data-testid="button-save-season-shuffle"
                >
                  {shuffleSeasonMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </div>

          {/* Group matchups by week */}
          {season && Array.from({ length: season.regularSeasonWeeks + season.playoffWeeks }, (_, i) => i + 1).map((week) => {
            const weekMatchups = allMatchups?.filter(m => m.week === week) || [];
            const isPlayoffWeek = week > season.regularSeasonWeeks;
            
            return (
              <Card key={week}>
                <CardHeader>
                  <div>
                    <CardTitle>
                      Week {week} {isPlayoffWeek && "(Playoff)"}
                    </CardTitle>
                    <CardDescription>
                      {weekMatchups.length > 0 
                        ? `${weekMatchups.length} matchup${weekMatchups.length !== 1 ? 's' : ''} scheduled`
                        : "No matchups generated yet"}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {weekMatchups.length > 0 ? (
                    <div className="space-y-3">
                      {weekMatchups.map((matchup) => (
                        <div 
                          key={matchup.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
                          data-testid={`matchup-${matchup.id}`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {/* Player 1 */}
                            <div className="flex items-center gap-2 flex-1">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={matchup.player1?.profileImageUrl || undefined} />
                                <AvatarFallback className="text-xs">
                                  {matchup.player1?.firstName?.charAt(0)}{matchup.player1?.lastName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {matchup.player1?.firstName} {matchup.player1?.lastName}
                                </div>
                                {matchup.player1Score !== null && (
                                  <div className="text-sm text-muted-foreground">
                                    {matchup.player1Score.toFixed(1)} pts
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* VS */}
                            <div className="text-sm font-semibold text-muted-foreground px-4">
                              VS
                            </div>

                            {/* Player 2 */}
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <div className="text-right">
                                <div className="font-medium">
                                  {matchup.player2?.firstName} {matchup.player2?.lastName}
                                </div>
                                {matchup.player2Score !== null && (
                                  <div className="text-sm text-muted-foreground">
                                    {matchup.player2Score.toFixed(1)} pts
                                  </div>
                                )}
                              </div>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={matchup.player2?.profileImageUrl || undefined} />
                                <AvatarFallback className="text-xs">
                                  {matchup.player2?.firstName?.charAt(0)}{matchup.player2?.lastName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>

                          {/* Edit Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedMatchup(matchup);
                              setNewPlayer1Id(matchup.player1Id);
                              setNewPlayer2Id(matchup.player2Id);
                              setEditMatchupOpen(true);
                            }}
                            data-testid={`button-edit-matchup-${matchup.id}`}
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No matchups for this week</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => generateMatchupsMutation.mutate(week)}
                        disabled={generateMatchupsMutation.isPending}
                        data-testid={`button-generate-week-${week}`}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Generate Matchups
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Edit Matchup Dialog */}
          <Dialog open={editMatchupOpen} onOpenChange={setEditMatchupOpen}>
            <DialogContent data-testid="dialog-edit-matchup">
              <DialogHeader>
                <DialogTitle>Edit Matchup</DialogTitle>
                <DialogDescription>
                  Change the participants in this matchup
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-player1">Player 1</Label>
                  <Select value={newPlayer1Id} onValueChange={setNewPlayer1Id}>
                    <SelectTrigger id="edit-player1" data-testid="select-edit-player1">
                      <SelectValue placeholder="Select player 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.filter(u => u.salesRepNumber !== null).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-player2">Player 2</Label>
                  <Select value={newPlayer2Id} onValueChange={setNewPlayer2Id}>
                    <SelectTrigger id="edit-player2" data-testid="select-edit-player2">
                      <SelectValue placeholder="Select player 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.filter(u => u.salesRepNumber !== null).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditMatchupOpen(false)} data-testid="button-cancel-edit-matchup">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedMatchup || !newPlayer1Id || !newPlayer2Id) return;
                    if (newPlayer1Id === newPlayer2Id) {
                      toast({
                        title: "Error",
                        description: "Players must be different",
                        variant: "destructive",
                      });
                      return;
                    }
                    updateMatchupMutation.mutate({
                      id: selectedMatchup.id,
                      data: { player1Id: newPlayer1Id, player2Id: newPlayer2Id },
                    });
                  }}
                  disabled={updateMatchupMutation.isPending}
                  data-testid="button-save-matchup"
                >
                  {updateMatchupMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold">User Management</h2>
            <p className="text-muted-foreground">Manage league participants and waitlist</p>
          </div>

          {/* Active User Spots Slider */}
          <Card>
            <CardHeader>
              <CardTitle>Number of Active User Spots</CardTitle>
              <CardDescription>Adjust the number of users that can be actively matched up (4-14)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label className="min-w-[100px]">{tempActiveUserSpots} Spots</Label>
                  <Slider
                    value={[tempActiveUserSpots]}
                    onValueChange={(value) => setTempActiveUserSpots(value[0])}
                    min={4}
                    max={14}
                    step={2}
                    className="flex-1"
                    data-testid="slider-active-spots"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This controls how many users can be assigned active user numbers. Users beyond this limit will be placed on the waitlist. Must be an even number for matchup pairing.
                </p>
                {tempActiveUserSpots !== activeUserSpots && (
                  <Button
                    onClick={() => {
                      updateActiveSpotsMutation.mutate(tempActiveUserSpots);
                    }}
                    disabled={updateActiveSpotsMutation.isPending}
                    data-testid="button-save-active-spots"
                  >
                    {updateActiveSpotsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sales Rep Number Legend */}
          <Card>
            <CardHeader>
              <CardTitle>User Spots</CardTitle>
              <CardDescription>Track which spots are filled and which are available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: activeUserSpots }, (_, i) => i + 1).map((num) => {
                  const user = users?.find((u) => u.salesRepNumber === num);
                  return (
                    <Badge
                      key={num}
                      variant={user ? "default" : "outline"}
                      className="min-w-[80px] justify-center"
                      data-testid={`badge-rep-${num}`}
                    >
                      {num}: {user ? `${user.firstName} ${user.lastName?.charAt(0)}.` : "Available"}
                    </Badge>
                  );
                })}
              </div>
              {users && users.filter((u) => u.salesRepNumber === null).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Waitlist ({users.filter((u) => u.salesRepNumber === null).length} users):</p>
                  <div className="flex flex-wrap gap-2">
                    {users
                      .filter((u) => u.salesRepNumber === null)
                      .map((u) => (
                        <Badge key={u.id} variant="secondary" data-testid={`badge-waitlist-${u.id}`}>
                          {u.firstName} {u.lastName}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              {users && users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>User #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">
                              {u.firstName} {u.lastName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' || u.role === 'cio' ? 'default' : 'secondary'}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.salesRepNumber !== null ? (
                            <Badge variant="outline">#{u.salesRepNumber}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Waitlist</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.salesRepNumber !== null ? (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(u);
                                setEditRole(u.role || 'employee');
                                setEditSalesRepNumber(u.salesRepNumber?.toString() || '');
                                setEditUserOpen(true);
                              }}
                              data-testid={`button-edit-${u.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(u);
                                setDeleteUserOpen(true);
                              }}
                              data-testid={`button-delete-${u.id}`}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              )}
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
            <DialogContent data-testid="dialog-edit-user">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update role and sales rep assignment for {selectedUser?.firstName} {selectedUser?.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger id="edit-role" data-testid="select-edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cio">CIO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-sales-rep">User Rep Number (or assign to waitlist)</Label>
                  <Select value={editSalesRepNumber || "none"} onValueChange={setEditSalesRepNumber}>
                    <SelectTrigger id="edit-sales-rep" data-testid="select-edit-sales-rep">
                      <SelectValue placeholder="Waitlist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Waitlist</SelectItem>
                      {Array.from({ length: activeUserSpots }, (_, i) => i + 1).map((num) => {
                        const isTaken = users?.some((u) => u.salesRepNumber === num && u.id !== selectedUser?.id);
                        return (
                          <SelectItem key={num} value={num.toString()} disabled={isTaken}>
                            {num} {isTaken ? '(Taken)' : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assigning a number removes user from waitlist. Removing number puts user on waitlist.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUserOpen(false)} data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedUser) return;
                    const data: Partial<User> = {
                      role: editRole as 'employee' | 'admin' | 'cio',
                      salesRepNumber: editSalesRepNumber && editSalesRepNumber !== "none" ? parseInt(editSalesRepNumber) : null,
                    };
                    updateUserMutation.mutate({ id: selectedUser.id, data });
                  }}
                  disabled={updateUserMutation.isPending}
                  data-testid="button-save-edit"
                >
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete User Confirmation */}
          <AlertDialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
            <AlertDialogContent data-testid="dialog-delete-user">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User and All Associated Data?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Are you sure you want to permanently delete {selectedUser?.firstName} {selectedUser?.lastName}?
                  </p>
                  <p className="font-semibold">
                    This will delete:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>User profile</li>
                    <li>All KPI data submissions</li>
                    <li>All matchup records</li>
                    <li>All earned badges</li>
                    <li>AI coach conversation history</li>
                  </ul>
                  <p className="font-semibold text-destructive">
                    This action cannot be undone.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (selectedUser) {
                      deleteUserMutation.mutate(selectedUser.id);
                    }
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  Delete User and All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
