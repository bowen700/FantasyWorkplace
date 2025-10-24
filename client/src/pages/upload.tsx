import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Download, Plus, Trash2 } from "lucide-react";
import type { Season, Kpi, InsertKpiData } from "@shared/schema";

interface KpiInput {
  kpiId: string;
  value: string;
}

export default function UploadPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [kpiInputs, setKpiInputs] = useState<KpiInput[]>([]);

  const { data: season } = useQuery<Season>({
    queryKey: ["/api/seasons/active"],
  });

  const { data: kpis } = useQuery<Kpi[]>({
    queryKey: ["/api/kpis"],
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/kpi-data"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addKpiInput = () => {
    setKpiInputs([...kpiInputs, { kpiId: "", value: "" }]);
  };

  const removeKpiInput = (index: number) => {
    setKpiInputs(kpiInputs.filter((_, i) => i !== index));
  };

  const updateKpiInput = (index: number, field: keyof KpiInput, value: string) => {
    const newInputs = [...kpiInputs];
    newInputs[index][field] = value;
    setKpiInputs(newInputs);
  };

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

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          // Simple CSV parsing (assuming format: KPI Name, Value)
          const lines = text.split("\n").filter((line) => line.trim());
          const newInputs: KpiInput[] = [];

          lines.forEach((line, index) => {
            if (index === 0) return; // Skip header
            const [kpiName, value] = line.split(",").map((s) => s.trim());
            const kpi = kpis?.find((k) => k.name.toLowerCase() === kpiName.toLowerCase());
            if (kpi && value) {
              newInputs.push({ kpiId: kpi.id, value });
            }
          });

          setKpiInputs(newInputs);
          toast({
            title: "File Loaded",
            description: `Loaded ${newInputs.length} KPI values from file`,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to parse CSV file",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    },
    [kpis, toast]
  );

  const downloadTemplate = () => {
    const csvContent = "KPI Name,Value\n" + (kpis?.map((kpi) => `${kpi.name},`).join("\n") || "");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kpi_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-4xl font-bold mb-2">Upload KPI Data</h1>
        <p className="text-muted-foreground">
          Submit your performance metrics for Week {season?.currentWeek}
        </p>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload from File</CardTitle>
          <CardDescription>Upload KPI data from a CSV file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label
              htmlFor="file-upload"
              className="flex-1 flex items-center justify-center gap-2 h-32 border-2 border-dashed rounded-md cursor-pointer hover-elevate"
              data-testid="upload-zone"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload CSV file
              </span>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </Label>
          </div>
          <Button variant="outline" onClick={downloadTemplate} data-testid="button-download-template">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Entry</CardTitle>
          <CardDescription>Enter KPI values manually</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {kpiInputs.map((input, index) => (
            <div key={index} className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor={`kpi-${index}`}>KPI</Label>
                <Select
                  value={input.kpiId}
                  onValueChange={(value) => updateKpiInput(index, "kpiId", value)}
                >
                  <SelectTrigger id={`kpi-${index}`} data-testid={`select-kpi-${index}`}>
                    <SelectValue placeholder="Select KPI" />
                  </SelectTrigger>
                  <SelectContent>
                    {kpis?.filter((kpi) => kpi.isActive).map((kpi) => (
                      <SelectItem key={kpi.id} value={kpi.id}>
                        {kpi.name} {kpi.unit && `(${kpi.unit})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor={`value-${index}`}>Value</Label>
                <Input
                  id={`value-${index}`}
                  type="number"
                  step="0.01"
                  value={input.value}
                  onChange={(e) => updateKpiInput(index, "value", e.target.value)}
                  placeholder="Enter value"
                  data-testid={`input-value-${index}`}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeKpiInput(index)}
                data-testid={`button-remove-${index}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-4">
            <Button variant="outline" onClick={addKpiInput} data-testid="button-add-kpi">
              <Plus className="h-4 w-4 mr-2" />
              Add KPI
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={kpiInputs.length === 0 || submitKpiMutation.isPending}
              data-testid="button-submit"
            >
              {submitKpiMutation.isPending ? "Submitting..." : "Submit KPI Data"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
