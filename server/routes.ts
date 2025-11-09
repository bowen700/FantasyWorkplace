// API routes for Fantasy Workplace
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { getAICoachFeedback } from "./openai";
import type { User, InsertKpi, InsertSeason, InsertKpiData, InsertMatchup, Matchup } from "@shared/schema";

interface MatchupWithPlayers extends Matchup {
  player1?: User;
  player2?: User;
  winner?: User | null;
}
import { 
  insertSeasonSchema, 
  insertKpiSchema, 
  insertKpiDataSchema, 
  insertMatchupSchema,
  insertAiCoachConversationSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Helper to check admin role
const isAdmin = (req: any, res: any, next: any) => {
  const userId = req.user?.claims?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  storage.getUser(userId).then((user) => {
    if (user?.role === "admin" || user?.role === "cio") {
      next();
    } else {
      res.status(403).json({ message: "Admin access required" });
    }
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ============= Auth Routes =============
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============= Season Routes =============
  app.get('/api/seasons/active', isAuthenticated, async (req, res) => {
    try {
      const season = await storage.getActiveSeason();
      if (!season) {
        return res.status(404).json({ message: "No active season found" });
      }
      res.json(season);
    } catch (error) {
      console.error("Error fetching active season:", error);
      res.status(500).json({ message: "Failed to fetch active season" });
    }
  });

  app.post('/api/seasons', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertSeasonSchema.parse(req.body);
      const season = await storage.createSeason(validatedData);
      res.json(season);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating season:", error);
      res.status(500).json({ message: "Failed to create season" });
    }
  });

  // ============= KPI Routes =============
  app.get('/api/kpis', isAuthenticated, async (req, res) => {
    try {
      const allKpis = await storage.getAllKpis();
      res.json(allKpis);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  app.post('/api/kpis', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertKpiSchema.parse(req.body);
      const kpi = await storage.createKpi(validatedData);
      res.json(kpi);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating KPI:", error);
      res.status(500).json({ message: "Failed to create KPI" });
    }
  });

  app.patch('/api/kpis/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertKpiSchema.partial().parse(req.body);
      const kpi = await storage.updateKpi(id, validatedData);
      res.json(kpi);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating KPI:", error);
      res.status(500).json({ message: "Failed to update KPI" });
    }
  });

  app.delete('/api/kpis/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteKpi(id);
      res.json({ message: "KPI deleted successfully" });
    } catch (error) {
      console.error("Error deleting KPI:", error);
      res.status(500).json({ message: "Failed to delete KPI" });
    }
  });

  // ============= KPI Data Routes =============
  app.get('/api/kpi-data/weekly/:week?', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const season = await storage.getActiveSeason();
      if (!season) {
        return res.status(404).json({ message: "No active season" });
      }
      
      const week = req.params.week ? parseInt(req.params.week) : season.currentWeek;
      const data = await storage.getKpiDataByUserAndWeek(userId, season.id, week);
      res.json(data);
    } catch (error) {
      console.error("Error fetching KPI data:", error);
      res.status(500).json({ message: "Failed to fetch KPI data" });
    }
  });

  app.post('/api/kpi-data/bulk', isAuthenticated, async (req, res) => {
    try {
      const bulkSchema = z.array(insertKpiDataSchema);
      const validatedData = bulkSchema.parse(req.body);
      const inserted = await storage.bulkInsertKpiData(validatedData);
      
      // After inserting KPI data, calculate scores for matchups
      if (inserted.length > 0) {
        const userId = inserted[0].userId;
        const seasonId = inserted[0].seasonId;
        const week = inserted[0].week;
        await calculateMatchupScores(seasonId, week);
      }
      
      res.json(inserted);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error inserting KPI data:", error);
      res.status(500).json({ message: "Failed to insert KPI data" });
    }
  });

  // ============= Matchup Routes =============
  app.get('/api/matchups/all', isAuthenticated, async (req, res) => {
    try {
      const season = await storage.getActiveSeason();
      if (!season) {
        return res.json([]);
      }
      
      // Fetch all matchups for the active season
      const allMatchups: MatchupWithPlayers[] = [];
      const totalWeeks = season.regularSeasonWeeks + season.playoffWeeks;
      
      for (let week = 1; week <= totalWeeks; week++) {
        const weekMatchups = await storage.getMatchupsByWeek(season.id, week);
        
        // Populate player data for each matchup
        const withPlayers = await Promise.all(
          weekMatchups.map(async (matchup) => {
            const [player1, player2, winner] = await Promise.all([
              storage.getUser(matchup.player1Id),
              storage.getUser(matchup.player2Id),
              matchup.winnerId ? storage.getUser(matchup.winnerId) : null,
            ]);
            
            return {
              ...matchup,
              player1,
              player2,
              winner,
            };
          })
        );
        
        allMatchups.push(...withPlayers);
      }
      
      res.json(allMatchups);
    } catch (error) {
      console.error("Error fetching all matchups:", error);
      res.status(500).json({ message: "Failed to fetch all matchups" });
    }
  });

  app.get('/api/matchups/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const season = await storage.getActiveSeason();
      if (!season) {
        return res.json([]);
      }
      
      const matchups = await storage.getRecentMatchupsByUser(userId, season.id, 10);
      res.json(matchups);
    } catch (error) {
      console.error("Error fetching recent matchups:", error);
      res.status(500).json({ message: "Failed to fetch matchups" });
    }
  });

  app.get('/api/matchups/:week?', isAuthenticated, async (req, res) => {
    try {
      const season = await storage.getActiveSeason();
      if (!season) {
        return res.json([]);
      }
      
      const week = req.params.week ? parseInt(req.params.week) : season.currentWeek;
      const matchups = await storage.getMatchupsByWeek(season.id, week);
      
      // Populate player data
      const matchupsWithPlayers = await Promise.all(
        matchups.map(async (matchup) => {
          const [player1, player2, winner] = await Promise.all([
            storage.getUser(matchup.player1Id),
            storage.getUser(matchup.player2Id),
            matchup.winnerId ? storage.getUser(matchup.winnerId) : null,
          ]);
          
          return {
            ...matchup,
            player1,
            player2,
            winner,
          };
        })
      );
      
      res.json(matchupsWithPlayers);
    } catch (error) {
      console.error("Error fetching matchups:", error);
      res.status(500).json({ message: "Failed to fetch matchups" });
    }
  });

  app.post('/api/matchups/recalculate', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const bodySchema = z.object({ week: z.number().optional() });
      const { week } = bodySchema.parse(req.body);
      const season = await storage.getActiveSeason();
      if (!season) {
        return res.status(404).json({ message: "No active season" });
      }
      
      const targetWeek = week || season.currentWeek;
      await calculateMatchupScores(season.id, targetWeek);
      
      res.json({ message: `Scores recalculated for week ${targetWeek}` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error recalculating scores:", error);
      res.status(500).json({ message: "Failed to recalculate scores" });
    }
  });

  app.post('/api/matchups/generate', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const bodySchema = z.object({ 
        week: z.number().optional(),
        overwrite: z.boolean().optional()
      });
      const { week, overwrite } = bodySchema.parse(req.body);
      const season = await storage.getActiveSeason();
      if (!season) {
        return res.status(404).json({ message: "No active season" });
      }
      
      const targetWeek = week || season.currentWeek;
      
      // Check if matchups already exist for this week
      const existing = await storage.getMatchupsByWeek(season.id, targetWeek);
      if (existing.length > 0) {
        if (!overwrite) {
          return res.status(400).json({ 
            message: "Matchups already exist for this week. Use overwrite flag to regenerate." 
          });
        }
        // Delete existing matchups before creating new ones
        await storage.deleteMatchupsByWeek(season.id, targetWeek);
      }
      
      // Get all active users
      const allUsers = await storage.getAllUsers();
      const activeUsers = allUsers
        .filter(u => u.role !== 'cio')
        .sort((a, b) => (a.salesRepNumber || 999) - (b.salesRepNumber || 999));
      
      const matchupsData = generateRoundRobinMatchups(activeUsers, season.id, targetWeek, season.regularSeasonWeeks);
      
      const created = await storage.bulkCreateMatchups(matchupsData);
      
      // Automatically calculate scores after generating matchups
      await calculateMatchupScores(season.id, targetWeek);
      
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error generating matchups:", error);
      res.status(500).json({ message: "Failed to generate matchups" });
    }
  });

  // ============= Leaderboard Route =============
  app.get('/api/leaderboard', isAuthenticated, async (req, res) => {
    try {
      const season = await storage.getActiveSeason();
      if (!season) {
        return res.json([]);
      }
      
      const allUsers = await storage.getAllUsers();
      const leaderboardData = await Promise.all(
        allUsers.map(async (user) => {
          const userMatchups = await storage.getRecentMatchupsByUser(user.id, season.id, 100);
          
          const wins = userMatchups.filter(m => m.winnerId === user.id).length;
          const losses = userMatchups.filter(
            m => m.winnerId && m.winnerId !== user.id && 
            (m.player1Id === user.id || m.player2Id === user.id)
          ).length;
          
          const totalPoints = userMatchups.reduce((sum, m) => {
            if (m.player1Id === user.id) return sum + (m.player1Score || 0);
            if (m.player2Id === user.id) return sum + (m.player2Score || 0);
            return sum;
          }, 0);
          
          return {
            user,
            wins,
            losses,
            totalPoints,
          };
        })
      );
      
      // Sort by wins then total points
      const sorted = leaderboardData
        .sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return b.totalPoints - a.totalPoints;
        })
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
      
      res.json(sorted);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // ============= Badge Routes =============
  app.get('/api/badges', isAuthenticated, async (req, res) => {
    try {
      const allBadges = await storage.getAllBadges();
      res.json(allBadges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get('/api/user-badges/:userId', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const userBadges = await storage.getUserBadges(userId);
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // ============= AI Coach Route =============
  app.post('/api/ai-coach', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const season = await storage.getActiveSeason();
      if (!season) {
        return res.status(404).json({ message: "No active season" });
      }
      
      const user = await storage.getUser(userId);
      const kpiDataArray = await storage.getKpiDataByUserAndWeek(userId, season.id, season.currentWeek);
      const allKpis = await storage.getAllKpis();
      
      const kpiData = kpiDataArray.map(data => {
        const kpi = allKpis.find(k => k.id === data.kpiId);
        return {
          name: kpi?.name || "Unknown KPI",
          value: data.value,
          unit: kpi?.unit ?? undefined,
        };
      });
      
      const userMatchups = await storage.getRecentMatchupsByUser(userId, season.id, 100);
      const wins = userMatchups.filter(m => m.winnerId === userId).length;
      const losses = userMatchups.filter(
        m => m.winnerId && m.winnerId !== userId && 
        (m.player1Id === userId || m.player2Id === userId)
      ).length;
      
      const feedback = await getAICoachFeedback(kpiData, {
        name: `${user?.firstName} ${user?.lastName}`,
        record: `${wins}-${losses}`,
      });
      
      await storage.saveConversation({
        userId,
        seasonId: season.id,
        week: season.currentWeek,
        userMessage: null,
        aiResponse: feedback,
      });
      
      res.json({ feedback });
    } catch (error) {
      console.error("Error generating AI coach feedback:", error);
      res.status(500).json({ message: "Failed to generate AI feedback" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate round-robin matchups using circle method
function generateRoundRobinMatchups(
  users: User[], 
  seasonId: string, 
  week: number, 
  regularSeasonWeeks: number
): InsertMatchup[] {
  const matchups: InsertMatchup[] = [];
  
  if (users.length < 2) return matchups;
  
  // For even number of players, use circle method
  // Fix player 0 in position, rotate others
  const n = users.length;
  
  // Regular season: use round-robin (weeks 1-9 for 10 players)
  if (week <= Math.min(9, regularSeasonWeeks)) {
    // Circle method: fix first player, rotate others
    const rotation = (week - 1) % (n - 1);
    const positions = [users[0]]; // Anchor player
    
    // Rotate the rest
    for (let i = 1; i < n; i++) {
      const index = ((i - 1 + rotation) % (n - 1)) + 1;
      positions.push(users[index]);
    }
    
    // Create pairings: positions[i] vs positions[n-1-i]
    for (let i = 0; i < Math.floor(n / 2); i++) {
      matchups.push({
        seasonId,
        week,
        player1Id: positions[i].id,
        player2Id: positions[n - 1 - i].id,
        player1Score: null,
        player2Score: null,
        winnerId: null,
        isPlayoff: false,
      });
    }
  } else if (week === 10 && week <= regularSeasonWeeks) {
    // Week 10: Rivalry week (rematch of week 1)
    const week1Matchups = generateRoundRobinMatchups(users, seasonId, 1, regularSeasonWeeks);
    return week1Matchups.map(m => ({ ...m, week: 10 }));
  } else {
    // Playoffs: For now, use simple pairing by current standings
    // This should be enhanced with bracket logic based on seeding
    for (let i = 0; i < users.length - 1; i += 2) {
      matchups.push({
        seasonId,
        week,
        player1Id: users[i].id,
        player2Id: users[i + 1].id,
        player1Score: null,
        player2Score: null,
        winnerId: null,
        isPlayoff: true,
      });
    }
  }
  
  return matchups;
}

// Helper function to calculate matchup scores with normalized KPI values
async function calculateMatchupScores(seasonId: string, week: number) {
  const matchups = await storage.getMatchupsByWeek(seasonId, week);
  const allKpis = await storage.getAllKpis();
  const activeKpis = allKpis.filter(k => k.isActive);
  
  if (matchups.length === 0) return;
  
  // Get all participants for this week
  const userIds = new Set<string>();
  matchups.forEach(m => {
    userIds.add(m.player1Id);
    userIds.add(m.player2Id);
  });
  
  // Fetch all KPI data for the week
  const allUserData = await Promise.all(
    Array.from(userIds).map(userId => 
      storage.getKpiDataByUserAndWeek(userId, seasonId, week)
    )
  );
  
  // Calculate min/max for each KPI across all participants
  const kpiStats = new Map<string, { min: number; max: number }>();
  for (const kpi of activeKpis) {
    const values: number[] = [];
    allUserData.forEach(userData => {
      const kpiValue = userData.find(d => d.kpiId === kpi.id);
      if (kpiValue) values.push(kpiValue.value);
    });
    
    if (values.length > 0) {
      kpiStats.set(kpi.id, {
        min: Math.min(...values),
        max: Math.max(...values),
      });
    }
  }
  
  // Calculate scores for each matchup
  for (const matchup of matchups) {
    const [player1Data, player2Data] = await Promise.all([
      storage.getKpiDataByUserAndWeek(matchup.player1Id, seasonId, week),
      storage.getKpiDataByUserAndWeek(matchup.player2Id, seasonId, week),
    ]);
    
    let player1Score = 0;
    let player2Score = 0;
    
    // Normalize total weight to 1.0
    const totalWeight = activeKpis.reduce((sum, kpi) => sum + kpi.weight, 0);
    if (totalWeight === 0) {
      // No active KPIs with weight - skip scoring
      continue;
    }
    
    for (const kpi of activeKpis) {
      const stats = kpiStats.get(kpi.id);
      if (!stats) continue;
      
      const p1Data = player1Data.find(d => d.kpiId === kpi.id);
      const p2Data = player2Data.find(d => d.kpiId === kpi.id);
      
      // Normalize KPI values to 0-1 range
      const normalizeValue = (value: number | undefined) => {
        if (value === undefined) return 0;
        const range = stats.max - stats.min;
        if (range === 0) return 0.5; // All players have same value
        return Math.max(0, Math.min(1, (value - stats.min) / range));
      };
      
      const p1Normalized = normalizeValue(p1Data?.value);
      const p2Normalized = normalizeValue(p2Data?.value);
      
      // Apply weight (normalized to 0-1) and scale to 100-point baseline
      const weightDecimal = kpi.weight / totalWeight;
      player1Score += p1Normalized * weightDecimal * 100;
      player2Score += p2Normalized * weightDecimal * 100;
    }
    
    const winnerId = player1Score > player2Score ? matchup.player1Id : 
                      player2Score > player1Score ? matchup.player2Id : null;
    
    await storage.updateMatchup(matchup.id, {
      player1Score,
      player2Score,
      winnerId,
    });
  }
}
