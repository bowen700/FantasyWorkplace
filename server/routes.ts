// API routes for Fantasy Workplace
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
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
  insertAiCoachConversationSchema,
  updateUserSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Helper to get current user from session or Replit Auth
const getCurrentUserId = (req: any): string | null => {
  // Check session first
  if (req.session.selectedUserId) {
    return req.session.selectedUserId;
  }
  // Fall back to Replit Auth
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  return null;
};

// Custom authentication middleware
const requireAuth = async (req: any, res: any, next: any) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    // Attach the authenticated user to the request
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.authUser = user;
    req.authUserId = userId;
    next();
  } catch (error) {
    console.error("Error in requireAuth:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Helper to check admin role (must be used after requireAuth)
const isAdmin = (req: any, res: any, next: any) => {
  if (!req.authUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.authUser.role === "admin" || req.authUser.role === "cio") {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

// Middleware to check if admin password has been entered (must be used after requireAuth)
const requireAdminPassword = (req: any, res: any, next: any) => {
  if (!req.authUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.session.adminAccessGranted === true) {
    next();
  } else {
    res.status(403).json({ message: "Admin password required" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ============= Auth Routes =============
  app.post('/api/auth/verify-password', async (req: any, res) => {
    try {
      const { password } = req.body;
      const TEAM_PASSWORD = "$@le$te@m2026";
      
      if (password === TEAM_PASSWORD) {
        req.session.passwordVerified = true;
        await req.session.save();
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Incorrect password" });
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      res.status(500).json({ message: "Failed to verify password" });
    }
  });

  app.post('/api/auth/select-user', async (req: any, res) => {
    try {
      // Check if password was verified OR user is already authenticated (via session or Replit Auth)
      const isPasswordVerified = req.session.passwordVerified === true;
      const currentUserId = getCurrentUserId(req);
      
      if (!isPasswordVerified && !currentUserId) {
        return res.status(401).json({ message: "Password verification required" });
      }
      
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Store the selected user ID in the session
      req.session.selectedUserId = userId;
      // Clear admin access when switching users
      req.session.adminAccessGranted = false;
      await req.session.save();
      
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error selecting user:", error);
      res.status(500).json({ message: "Failed to select user" });
    }
  });

  app.post('/api/auth/create-profile', async (req: any, res) => {
    try {
      // Validate input
      const createProfileSchema = z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email("Valid email is required"),
      });

      const validatedData = createProfileSchema.parse(req.body);

      // Check if email is already taken
      const allUsers = await storage.getAllUsers();
      const emailExists = allUsers.some(u => u.email?.toLowerCase() === validatedData.email.toLowerCase());
      if (emailExists) {
        return res.status(409).json({ message: "Email already in use" });
      }

      // Find next available sales rep number (1-10)
      const takenNumbers = new Set(
        allUsers.map(u => u.salesRepNumber).filter((n): n is number => n !== null)
      );
      
      let salesRepNumber: number | null = null;
      for (let i = 1; i <= 10; i++) {
        if (!takenNumbers.has(i)) {
          salesRepNumber = i;
          break;
        }
      }

      // Create the new user
      const newUser = await storage.upsertUser({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        role: 'employee',
        salesRepNumber,
      });

      res.json({ success: true, user: newUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check if user is selected via session
      if (req.session.selectedUserId) {
        const user = await storage.getUser(req.session.selectedUserId);
        if (user) {
          return res.json(user);
        }
      }
      
      // Fall back to Replit Auth if available
      if (req.user?.claims?.sub) {
        const user = await storage.getUser(req.user.claims.sub);
        if (user) {
          return res.json(user);
        }
      }
      
      res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/logout', async (req: any, res) => {
    try {
      req.session.selectedUserId = null;
      req.session.adminAccessGranted = false;
      await req.session.save();
      res.json({ success: true });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  app.post('/api/auth/verify-admin-password', async (req: any, res) => {
    try {
      const { password } = req.body;
      const ADMIN_PASSWORD = "accessgranted!";
      
      if (password === ADMIN_PASSWORD) {
        req.session.adminAccessGranted = true;
        await req.session.save();
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Incorrect password" });
      }
    } catch (error) {
      console.error("Error verifying admin password:", error);
      res.status(500).json({ message: "Failed to verify password" });
    }
  });

  app.get('/api/auth/check-admin-access', async (req: any, res) => {
    try {
      const hasAccess = req.session.adminAccessGranted === true;
      res.json({ hasAccess });
    } catch (error) {
      console.error("Error checking admin access:", error);
      res.status(500).json({ message: "Failed to check admin access" });
    }
  });

  // ============= User Management Routes =============
  app.get('/api/users', async (req: any, res) => {
    try {
      // Allow access if password is verified OR if user is authenticated
      const isPasswordVerified = req.session.passwordVerified === true;
      const isUserAuth = getCurrentUserId(req) !== null;
      
      if (!isPasswordVerified && !isUserAuth) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // User can update their own profile
  app.patch('/api/users/:id/profile', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Users can only update their own profile
      if (id !== req.authUserId) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      const profileUpdateSchema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        profileImageUrl: z.string().optional(),
      });
      
      const validatedData = profileUpdateSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(id, validatedData);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch('/api/users/:id', requireAuth, requireAdminPassword, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If salesRepNumber is being updated, check for conflicts and validate against activeUserSpots
      if (validatedData.salesRepNumber !== undefined && validatedData.salesRepNumber !== null) {
        // Get the active season to check activeUserSpots
        const activeSeason = await storage.getActiveSeason();
        if (activeSeason && validatedData.salesRepNumber > activeSeason.activeUserSpots) {
          return res.status(400).json({ 
            message: `User number ${validatedData.salesRepNumber} exceeds the maximum of ${activeSeason.activeUserSpots} active spots` 
          });
        }
        
        const allUsers = await storage.getAllUsers();
        const conflictingUser = allUsers.find(
          u => u.salesRepNumber === validatedData.salesRepNumber && u.id !== id
        );
        if (conflictingUser) {
          return res.status(409).json({ 
            message: `User number ${validatedData.salesRepNumber} is already assigned to ${conflictingUser.firstName} ${conflictingUser.lastName}` 
          });
        }
      }
      
      const updatedUser = await storage.updateUser(id, validatedData);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      // Handle unique constraint violation from database
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        return res.status(409).json({ message: "Sales rep number is already assigned to another user" });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', requireAuth, requireAdminPassword, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deleting the last admin
      const allUsers = await storage.getAllUsers();
      const adminCount = allUsers.filter(u => u.role === 'admin' || u.role === 'cio').length;
      if ((existingUser.role === 'admin' || existingUser.role === 'cio') && adminCount <= 1) {
        return res.status(400).json({ message: "Cannot delete the last admin user" });
      }
      
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ============= Season Routes =============
  app.get('/api/seasons/active', requireAuth, async (req, res) => {
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

  app.post('/api/seasons', requireAuth, requireAdminPassword, async (req, res) => {
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

  app.patch('/api/seasons/:id', requireAuth, requireAdminPassword, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSeasonSchema.partial().parse(req.body);
      const season = await storage.updateSeason(id, validatedData);
      res.json(season);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating season:", error);
      res.status(500).json({ message: "Failed to update season" });
    }
  });

  // ============= KPI Routes =============
  app.get('/api/kpis', requireAuth, async (req, res) => {
    try {
      const allKpis = await storage.getAllKpis();
      res.json(allKpis);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  app.post('/api/kpis', requireAuth, requireAdminPassword, async (req, res) => {
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

  app.patch('/api/kpis/:id', requireAuth, requireAdminPassword, async (req, res) => {
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

  app.delete('/api/kpis/:id', requireAuth, requireAdminPassword, async (req, res) => {
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
  app.get('/api/kpi-data/weekly/:week?', requireAuth, async (req: any, res) => {
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

  app.post('/api/kpi-data/bulk', requireAuth, async (req, res) => {
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
  app.get('/api/matchups/all', requireAuth, async (req, res) => {
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

  app.get('/api/matchups/recent', requireAuth, async (req: any, res) => {
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

  app.get('/api/matchups/:week?', requireAuth, async (req, res) => {
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

  app.post('/api/matchups/recalculate', requireAuth, requireAdminPassword, async (req, res) => {
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

  app.post('/api/matchups/generate', requireAuth, requireAdminPassword, async (req, res) => {
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
      
      // Generate matchups based on week type (regular season vs playoffs)
      let matchupsData: InsertMatchup[];
      if (targetWeek > season.regularSeasonWeeks) {
        // Playoff weeks: use bracket generation
        matchupsData = await generatePlayoffBracket(season.id, targetWeek);
      } else {
        // Regular season: use round-robin
        matchupsData = generateRoundRobinMatchups(activeUsers, season.id, targetWeek, season.regularSeasonWeeks);
      }
      
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

  app.post('/api/matchups/shuffle', requireAuth, requireAdminPassword, async (req, res) => {
    try {
      const bodySchema = z.object({ 
        week: z.number()
      });
      const { week } = bodySchema.parse(req.body);
      const season = await storage.getActiveSeason();
      if (!season) {
        return res.status(404).json({ message: "No active season" });
      }
      
      // Get existing matchups for this week
      const existingMatchups = await storage.getMatchupsByWeek(season.id, week);
      if (existingMatchups.length === 0) {
        return res.status(400).json({ message: "No matchups exist for this week to shuffle" });
      }
      
      // Extract all player IDs from the matchups
      const playerIds: string[] = [];
      existingMatchups.forEach(m => {
        playerIds.push(m.player1Id, m.player2Id);
      });
      
      // Remove duplicates and shuffle the array
      const uniquePlayers = Array.from(new Set(playerIds));
      const shuffled = [...uniquePlayers].sort(() => Math.random() - 0.5);
      
      // Update each matchup with new pairings
      for (let i = 0; i < existingMatchups.length; i++) {
        const player1Index = i * 2;
        const player2Index = i * 2 + 1;
        
        if (player1Index < shuffled.length && player2Index < shuffled.length) {
          await storage.updateMatchup(existingMatchups[i].id, {
            player1Id: shuffled[player1Index],
            player2Id: shuffled[player2Index],
          });
        }
      }
      
      // Recalculate scores after shuffling
      await calculateMatchupScores(season.id, week);
      
      // Fetch updated matchups to return
      const updatedMatchups = await storage.getMatchupsByWeek(season.id, week);
      res.json(updatedMatchups);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error shuffling matchups:", error);
      res.status(500).json({ message: "Failed to shuffle matchups" });
    }
  });

  app.post('/api/matchups/shuffle-season', requireAuth, requireAdminPassword, async (req, res) => {
    try {
      const season = await storage.getActiveSeason();
      if (!season) {
        return res.status(404).json({ message: "No active season" });
      }
      
      // Get all active users
      const allUsers = await storage.getAllUsers();
      const activeUsers = allUsers
        .filter(u => u.role !== 'cio' && u.salesRepNumber !== null)
        .sort((a, b) => (a.salesRepNumber || 999) - (b.salesRepNumber || 999));
      
      if (activeUsers.length < 2) {
        return res.status(400).json({ message: "Need at least 2 active users for matchups" });
      }
      
      // Track matchup counts between all player pairs
      const matchupCounts = new Map<string, number>();
      
      const getMatchupKey = (p1: string, p2: string) => {
        return [p1, p2].sort().join('-');
      };
      
      // Shuffle season for regular season weeks only
      for (let week = 1; week <= season.regularSeasonWeeks; week++) {
        // Get existing matchups for this week
        const existingMatchups = await storage.getMatchupsByWeek(season.id, week);
        
        // Find best pairings with minimal repeats
        const availablePlayers = [...activeUsers];
        const weekPairings: { player1: typeof activeUsers[0], player2: typeof activeUsers[0] }[] = [];
        
        // Try to create pairings with minimal repeat matchups
        while (availablePlayers.length >= 2) {
          let bestPair: { player1: typeof activeUsers[0], player2: typeof activeUsers[0], count: number } | null = null;
          let bestIndices: { i: number, j: number } | null = null;
          
          // Find the pair with the fewest previous matchups
          for (let i = 0; i < availablePlayers.length; i++) {
            for (let j = i + 1; j < availablePlayers.length; j++) {
              const key = getMatchupKey(availablePlayers[i].id, availablePlayers[j].id);
              const count = matchupCounts.get(key) || 0;
              
              if (!bestPair || count < bestPair.count) {
                bestPair = { player1: availablePlayers[i], player2: availablePlayers[j], count };
                bestIndices = { i, j };
              }
            }
          }
          
          if (bestPair && bestIndices) {
            weekPairings.push({ player1: bestPair.player1, player2: bestPair.player2 });
            
            // Update matchup count
            const key = getMatchupKey(bestPair.player1.id, bestPair.player2.id);
            matchupCounts.set(key, (matchupCounts.get(key) || 0) + 1);
            
            // Remove paired players (remove higher index first to avoid index shifting)
            availablePlayers.splice(Math.max(bestIndices.i, bestIndices.j), 1);
            availablePlayers.splice(Math.min(bestIndices.i, bestIndices.j), 1);
          } else {
            break;
          }
        }
        
        // Update existing matchups with new pairings
        for (let i = 0; i < Math.min(existingMatchups.length, weekPairings.length); i++) {
          await storage.updateMatchup(existingMatchups[i].id, {
            player1Id: weekPairings[i].player1.id,
            player2Id: weekPairings[i].player2.id,
          });
        }
        
        // Recalculate scores after updating
        await calculateMatchupScores(season.id, week);
      }
      
      res.json({ message: "Season matchups shuffled successfully with minimal repeats" });
    } catch (error) {
      console.error("Error shuffling season:", error);
      res.status(500).json({ message: "Failed to shuffle season matchups" });
    }
  });

  app.patch('/api/matchups/:id', requireAuth, requireAdminPassword, async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = z.object({
        player1Id: z.string(),
        player2Id: z.string(),
      });
      const { player1Id, player2Id } = updateSchema.parse(req.body);

      // Validate that players are different
      if (player1Id === player2Id) {
        return res.status(400).json({ message: "Players must be different" });
      }

      // Get the matchup to update
      const matchup = await storage.getMatchupById(id);
      if (!matchup) {
        return res.status(404).json({ message: "Matchup not found" });
      }

      // Update the matchup with new players
      await storage.updateMatchup(id, {
        player1Id,
        player2Id,
      });

      // Recalculate scores for this matchup's week
      const season = await storage.getActiveSeason();
      if (season) {
        await calculateMatchupScores(season.id, matchup.week);
      }

      const updatedMatchup = await storage.getMatchupById(id);
      res.json(updatedMatchup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating matchup:", error);
      res.status(500).json({ message: "Failed to update matchup" });
    }
  });

  // ============= Leaderboard Route =============
  app.get('/api/leaderboard', requireAuth, async (req, res) => {
    try {
      const season = await storage.getActiveSeason();
      if (!season) {
        return res.json([]);
      }
      
      const allUsers = await storage.getAllUsers();
      const leaderboardData = await Promise.all(
        allUsers.map(async (user) => {
          const userMatchups = await storage.getRecentMatchupsByUser(user.id, season.id, 100);
          
          // Only count matchups from previous weeks (exclude current week)
          const previousWeeksMatchups = userMatchups.filter(m => m.week < season.currentWeek);
          
          const wins = previousWeeksMatchups.filter(m => m.winnerId === user.id).length;
          const losses = previousWeeksMatchups.filter(
            m => m.winnerId && m.winnerId !== user.id && 
            (m.player1Id === user.id || m.player2Id === user.id)
          ).length;
          
          const totalPoints = previousWeeksMatchups.reduce((sum, m) => {
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
  app.get('/api/badges', requireAuth, async (req, res) => {
    try {
      const allBadges = await storage.getAllBadges();
      res.json(allBadges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get('/api/user-badges/:userId', requireAuth, async (req, res) => {
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
  app.post('/api/ai-coach', requireAuth, async (req: any, res) => {
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
  }
  
  // Playoffs handled separately
  return matchups;
}

// Helper function to generate playoff bracket for weeks 10-12 (6-user tournament with top 2 byes)
async function generatePlayoffBracket(seasonId: string, week: number) {
  const matchups: InsertMatchup[] = [];
  
  // Get top 6 seeds based on regular season standings
  const allUsers = await storage.getAllUsers();
  const leaderboardData = await Promise.all(
    allUsers.map(async (user) => {
      const userMatchups = await storage.getRecentMatchupsByUser(user.id, seasonId, 100);
      
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
      
      return { user, wins, losses, totalPoints };
    })
  );
  
  // Sort by wins, then total points
  const seeds = leaderboardData
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.totalPoints - a.totalPoints;
    })
    .slice(0, 6); // Top 6 qualify for playoffs
  
  if (week === 10) {
    // Quarterfinals: Seed 3 vs Seed 6, Seed 4 vs Seed 5 (Seeds 1-2 get byes)
    matchups.push({
      seasonId,
      week,
      player1Id: seeds[2].user.id, // Seed 3
      player2Id: seeds[5].user.id, // Seed 6
      player1Score: null,
      player2Score: null,
      winnerId: null,
      isPlayoff: true,
    });
    matchups.push({
      seasonId,
      week,
      player1Id: seeds[3].user.id, // Seed 4
      player2Id: seeds[4].user.id, // Seed 5
      player1Score: null,
      player2Score: null,
      winnerId: null,
      isPlayoff: true,
    });
  } else if (week === 11) {
    // Semifinals: Need winners from week 10
    const week10Matchups = await storage.getMatchupsByWeek(seasonId, 10);
    
    if (week10Matchups.length < 2 || !week10Matchups[0].winnerId || !week10Matchups[1].winnerId) {
      // Week 10 not complete yet - cannot generate week 11
      return matchups;
    }
    
    // Seed 1 vs Winner(3v6)
    matchups.push({
      seasonId,
      week,
      player1Id: seeds[0].user.id, // Seed 1
      player2Id: week10Matchups[0].winnerId, // Winner of 3v6
      player1Score: null,
      player2Score: null,
      winnerId: null,
      isPlayoff: true,
    });
    
    // Seed 2 vs Winner(4v5)
    matchups.push({
      seasonId,
      week,
      player1Id: seeds[1].user.id, // Seed 2
      player2Id: week10Matchups[1].winnerId, // Winner of 4v5
      player1Score: null,
      player2Score: null,
      winnerId: null,
      isPlayoff: true,
    });
  } else if (week === 12) {
    // Finals: Need winners from week 11
    const week11Matchups = await storage.getMatchupsByWeek(seasonId, 11);
    
    if (week11Matchups.length < 2 || !week11Matchups[0].winnerId || !week11Matchups[1].winnerId) {
      // Week 11 not complete yet - cannot generate week 12
      return matchups;
    }
    
    // Championship: Winner(1 vs W3v6) vs Winner(2 vs W4v5)
    matchups.push({
      seasonId,
      week,
      player1Id: week11Matchups[0].winnerId,
      player2Id: week11Matchups[1].winnerId,
      player1Score: null,
      player2Score: null,
      winnerId: null,
      isPlayoff: true,
    });
  }
  
  return matchups;
}

// Helper function to calculate matchup scores using point-based system
async function calculateMatchupScores(seasonId: string, week: number) {
  const matchups = await storage.getMatchupsByWeek(seasonId, week);
  const allKpis = await storage.getAllKpis();
  const activeKpis = allKpis.filter(k => k.isActive);
  
  if (matchups.length === 0) return;
  
  // Point conversion factors for each KPI
  const kpiConversionFactors: Record<string, number> = {
    "Sales Gross Profit": 300,    // 300 GP = 1 point
    "Sales Revenue": 3000,         // 3000 revenue = 1 point
    "Leads Talked To": 3,          // 3 leads = 1 point
    "Deals Closed": 1,             // 1 deal = 1 point
  };
  
  // Calculate scores for each matchup
  for (const matchup of matchups) {
    const [player1Data, player2Data] = await Promise.all([
      storage.getKpiDataByUserAndWeek(matchup.player1Id, seasonId, week),
      storage.getKpiDataByUserAndWeek(matchup.player2Id, seasonId, week),
    ]);
    
    let player1Score = 0;
    let player2Score = 0;
    
    for (const kpi of activeKpis) {
      const conversionFactor = kpiConversionFactors[kpi.name];
      if (!conversionFactor) continue; // Skip KPIs without conversion factor
      
      const p1Data = player1Data.find(d => d.kpiId === kpi.id);
      const p2Data = player2Data.find(d => d.kpiId === kpi.id);
      
      // Convert KPI value to points
      if (p1Data) {
        player1Score += p1Data.value / conversionFactor;
      }
      if (p2Data) {
        player2Score += p2Data.value / conversionFactor;
      }
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
