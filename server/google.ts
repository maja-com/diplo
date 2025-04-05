import { storage } from "./storage";
import { Express } from "express";
import { google } from "googleapis";

// Create OAuth2 client
const createOAuth2Client = (redirectUri: string) => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || "",
    process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri
  );
};

export function setupGoogleCalendar(app: Express) {
  // Google OAuth login
  app.get("/api/auth/google", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Determine the callback URL based on host
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers.host;
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    const oauth2Client = createOAuth2Client(redirectUri);
    
    // Generate a URL for requesting calendar permissions
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar"],
      prompt: "consent",
    });
    
    res.json({ authUrl });
  });
  
  // Handle OAuth callback
  app.get("/api/auth/google/callback", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect("/auth?error=Not%20authenticated");
    }
    
    const code = req.query.code as string;
    if (!code) {
      return res.redirect("/settings?error=Authorization%20failed");
    }
    
    // Determine the callback URL based on host (must match the one used for auth)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers.host;
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
    
    try {
      const oauth2Client = createOAuth2Client(redirectUri);
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.refresh_token) {
        return res.redirect("/settings?error=No%20refresh%20token%20received");
      }
      
      // Update the user with Google ID and refresh token
      await storage.updateUserGoogleData(
        req.user!.id,
        "google-user", // Placeholder since we don't get user ID from token
        tokens.refresh_token
      );
      
      res.redirect("/settings?success=Calendar%20connected");
    } catch (error) {
      console.error("Error with Google OAuth:", error);
      res.redirect("/settings?error=Authorization%20failed");
    }
  });
  
  // List upcoming events
  app.get("/api/calendar/events", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = req.user!;
    if (!user.googleRefreshToken) {
      return res.status(400).json({ error: "Google Calendar not connected" });
    }
    
    // Create OAuth2 client and set credentials
    const oauth2Client = createOAuth2Client("");
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken
    });
    
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    try {
      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
      });
      
      res.json(response.data.items);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });
  
  // Create a new event in Google Calendar
  app.post("/api/calendar/events", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = req.user!;
    if (!user.googleRefreshToken) {
      return res.status(400).json({ error: "Google Calendar not connected" });
    }
    
    const { title, description, start, end, location } = req.body;
    
    if (!title || !start) {
      return res.status(400).json({ error: "Title and start date are required" });
    }
    
    // Create OAuth2 client and set credentials
    const oauth2Client = createOAuth2Client("");
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken
    });
    
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    try {
      const event = {
        summary: title,
        description,
        location,
        start: {
          dateTime: start,
          timeZone: "UTC",
        },
        end: {
          dateTime: end || new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString(), // Default to 1 hour
          timeZone: "UTC",
        },
      };
      
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });
      
      // Also create the event in our system
      const newEvent = await storage.createEvent({
        title,
        description,
        startDate: new Date(start),
        endDate: end ? new Date(end) : undefined,
        location,
        userId: user.id,
        familyId: req.body.familyId,
        isPublic: req.body.isPublic || false,
        googleEventId: response.data.id,
        notifyUserIds: req.body.notifyUserIds || [],
      });
      
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });
}
