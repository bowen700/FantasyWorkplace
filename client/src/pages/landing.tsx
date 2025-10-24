import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, BarChart3, Award, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <div className="flex justify-center mb-6">
            <Trophy className="h-20 w-20 text-primary" />
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-4">
            Fantasy Workplace
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Turn employee performance into friendly, gamified competition
          </p>
          <Button
            size="lg"
            onClick={() => (window.location.href = "/api/login")}
            data-testid="button-login"
            className="font-semibold"
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-primary" />
                <CardTitle>Weekly Matchups</CardTitle>
              </div>
              <CardDescription>
                Compete head-to-head against colleagues in weekly KPI challenges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Face off in fantasy sports-style matchups based on your performance metrics. Win your matchups to climb the standings and secure a playoff spot.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <CardTitle>Track Your Progress</CardTitle>
              </div>
              <CardDescription>
                Visualize your KPI trends and performance analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor your performance with beautiful charts and real-time leaderboards. See how you stack up against the competition throughout the season.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-6 w-6 text-primary" />
                <CardTitle>Earn Badges</CardTitle>
              </div>
              <CardDescription>
                Unlock achievements for your accomplishments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Collect badges for consistency, comebacks, and dominance. Showcase your achievements and compete for the championship trophy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-6 w-6 text-primary" />
                <CardTitle>AI Coach</CardTitle>
              </div>
              <CardDescription>
                Get personalized performance insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Receive AI-powered coaching to improve your KPIs. Get actionable suggestions tailored to your performance data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-primary" />
                <CardTitle>Playoff Tournament</CardTitle>
              </div>
              <CardDescription>
                Compete for the championship
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Top performers advance to a 4-week playoff tournament. Battle through elimination rounds to claim the ultimate title.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <CardTitle>Fair & Transparent</CardTitle>
              </div>
              <CardDescription>
                Data integrity you can trust
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Voluntary participation with clear rules. Performance data is used for motivation only, not HR decisions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/50 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Join the Competition?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Make performance tracking fun, engaging, and motivating for your entire team
          </p>
          <Button
            size="lg"
            onClick={() => (window.location.href = "/api/login")}
            data-testid="button-login-cta"
          >
            Sign In to Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
