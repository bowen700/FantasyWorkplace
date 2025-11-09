// Seed initial data for Fantasy Workplace
import { storage } from "./storage";
import type { InsertBadge, InsertSeason, UpsertUser } from "@shared/schema";

export async function seedInitialData() {
  try {
    // Check if we already have badges
    const existingBadges = await storage.getAllBadges();
    if (existingBadges.length === 0) {
      console.log("Seeding initial badges...");
      
      const badges: InsertBadge[] = [
        {
          name: "First Win",
          description: "Win your first matchup",
          icon: "trophy",
          category: "performance",
        },
        {
          name: "Consistency Champion",
          description: "Submit KPI data for 5 consecutive weeks",
          icon: "target",
          category: "consistency",
        },
        {
          name: "Comeback King",
          description: "Win after being down in the standings",
          icon: "trending-up",
          category: "comeback",
        },
        {
          name: "Dominant Force",
          description: "Win 5 matchups in a row",
          icon: "zap",
          category: "dominance",
        },
        {
          name: "Perfect Week",
          description: "Score maximum points in all KPIs for one week",
          icon: "star",
          category: "performance",
        },
        {
          name: "Season Champion",
          description: "Win the season championship",
          icon: "crown",
          category: "dominance",
        },
      ];
      
      for (const badge of badges) {
        await storage.createBadge(badge);
      }
      
      console.log("✓ Badges seeded successfully");
    }
    
    // Check if we have an active season
    const activeSeason = await storage.getActiveSeason();
    if (!activeSeason) {
      console.log("Creating default season...");
      
      const now = new Date();
      const seasonStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const seasonEnd = new Date(now.getFullYear(), now.getMonth() + 4, 0);
      
      const season: InsertSeason = {
        name: `${now.getFullYear()} Q${Math.floor(now.getMonth() / 3) + 1} Season`,
        startDate: seasonStart,
        endDate: seasonEnd,
        regularSeasonWeeks: 10,
        playoffWeeks: 4,
        currentWeek: 1,
        isActive: true,
      };
      
      await storage.createSeason(season);
      console.log("✓ Default season created successfully");
    }
    
    // Seed test users
    const testUserIds = ["user-maya", "user-ethan", "user-sofia", "user-liam", "user-olivia", "user-noah", "user-ava", "user-lucas", "user-chloe"];
    const existingTestUsers = await Promise.all(testUserIds.map(id => storage.getUser(id)));
    const missingTestUsers = testUserIds.filter((id, index) => !existingTestUsers[index]);
    
    if (missingTestUsers.length > 0) {
      console.log(`Seeding ${missingTestUsers.length} test users...`);
      
      const testUsers: UpsertUser[] = [
        {
          id: "user-maya",
          email: "maya@fantasyworkplace.com",
          firstName: "Maya",
          lastName: "Anderson",
          role: "employee",
        },
        {
          id: "user-ethan",
          email: "ethan@fantasyworkplace.com",
          firstName: "Ethan",
          lastName: "Martinez",
          role: "employee",
        },
        {
          id: "user-sofia",
          email: "sofia@fantasyworkplace.com",
          firstName: "Sofia",
          lastName: "Chen",
          role: "employee",
        },
        {
          id: "user-liam",
          email: "liam@fantasyworkplace.com",
          firstName: "Liam",
          lastName: "Johnson",
          role: "employee",
        },
        {
          id: "user-olivia",
          email: "olivia@fantasyworkplace.com",
          firstName: "Olivia",
          lastName: "Davis",
          role: "employee",
        },
        {
          id: "user-noah",
          email: "noah@fantasyworkplace.com",
          firstName: "Noah",
          lastName: "Wilson",
          role: "employee",
        },
        {
          id: "user-ava",
          email: "ava@fantasyworkplace.com",
          firstName: "Ava",
          lastName: "Taylor",
          role: "employee",
        },
        {
          id: "user-lucas",
          email: "lucas@fantasyworkplace.com",
          firstName: "Lucas",
          lastName: "Brown",
          role: "employee",
        },
        {
          id: "user-chloe",
          email: "chloe@fantasyworkplace.com",
          firstName: "Chloe",
          lastName: "Garcia",
          role: "employee",
        },
      ];
      
      const usersToCreate = testUsers.filter(user => user.id && missingTestUsers.includes(user.id));
      
      for (const user of usersToCreate) {
        await storage.upsertUser(user);
      }
      
      console.log(`✓ ${usersToCreate.length} test users seeded successfully`);
    }
    
    console.log("✓ All initial data seeded");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}
