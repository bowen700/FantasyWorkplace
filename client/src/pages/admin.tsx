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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Save, Trash2, Play, Settings, Edit, UserX, Users } from "lucide-react";
import type { Kpi, Season, InsertKpi, InsertSeason, User } from "@shared/schema";

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

  const { data: kpis } = useQuery<Kpi[]>({
    queryKey: ["/api/kpis"],
  });

  const { data: season } = useQuery<Season>({
    queryKey: ["/api/seasons/active"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
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

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold">User Management</h2>
            <p className="text-muted-foreground">Manage league participants and waitlist</p>
          </div>

          {/* Sales Rep Number Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Rep Number Availability (1-10)</CardTitle>
              <CardDescription>Track which spots are filled and which are available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
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
                      <TableHead>Sales Rep #</TableHead>
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
                  <Label htmlFor="edit-sales-rep">Sales Rep Number (1-10 or leave empty for waitlist)</Label>
                  <Select value={editSalesRepNumber || "none"} onValueChange={setEditSalesRepNumber}>
                    <SelectTrigger id="edit-sales-rep" data-testid="select-edit-sales-rep">
                      <SelectValue placeholder="Waitlist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Waitlist</SelectItem>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
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
                <AlertDialogTitle>Delete User?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}? 
                  This action cannot be undone. The user will need to sign in again to rejoin.
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
                  data-testid="button-confirm-delete"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
