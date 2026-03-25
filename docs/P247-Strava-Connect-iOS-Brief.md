# P247 Strava Connect — iOS Implementation Brief

**Version:** 1.0
**Date:** 23 March 2026
**Status:** Backend endpoints live on production

---

## 1. What This Does

Adds a "Connect Strava" button in the app's Settings/Connections screen. When tapped, it opens Strava's OAuth authorization page. The athlete logs into Strava, approves P247's access, and Strava redirects back to the app with an auth code. The app sends that code to the backend, which exchanges it for access/refresh tokens and stores them per-user.

Once connected, the backend polls Strava for the athlete's activities and includes training data in their daily briefs (workout names, pace, heart rate zones, distance, training load).

---

## 2. OAuth Flow (Step by Step)

```
┌──────────┐     1. POST /connections/strava/initiate     ┌──────────────┐
│  iOS App  │ ───────────────────────────────────────────▶ │  P247 Backend │
│           │ ◀─────────────────────────────────────────── │              │
│           │     Returns: { authorize_url: "..." }        └──────────────┘
│           │
│           │     2. Open authorize_url in ASWebAuthenticationSession
│           │ ───────────────────────────────────────────▶ ┌──────────────┐
│           │                                              │   Strava.com  │
│           │     3. Athlete logs in + approves             │              │
│           │ ◀─────────────────────────────────────────── │              │
│           │     Redirect to: redirect_uri?code=ABC123    └──────────────┘
│           │
│           │     4. POST /connections/strava/callback
│           │        { "code": "ABC123", "scope": "read,activity:read_all" }
│           │ ───────────────────────────────────────────▶ ┌──────────────┐
│           │                                              │  P247 Backend │
│           │     5. Backend exchanges code for tokens      │  (stores      │
│           │ ◀─────────────────────────────────────────── │   tokens)     │
│           │     Returns: { status: "connected",           └──────────────┘
│           │               athlete_name: "Myles B" }
└──────────┘
```

---

## 3. Backend Endpoints (All Live)

**Base URL:** `https://app.p247.io`
**Auth:** `x-api-key` header on all requests.

### 3.1 List Connections

```
GET /connections/
```

Returns all providers with connection status:

```json
{
  "connections": [
    {
      "provider": "strava",
      "connected": true,
      "athlete_name": "Myles Bruggeling",
      "athlete_id": 39484557,
      "connected_at": "2026-03-23T09:30:00+00:00",
      "last_sync": "2026-03-23T10:00:00+00:00"
    },
    { "provider": "garmin", "connected": false, ... },
    { "provider": "whoop", "connected": false, ... },
    { "provider": "oura", "connected": false, ... }
  ]
}
```

Use this to populate the Connections screen. Show a green checkmark and athlete name for connected providers, and a "Connect" button for disconnected ones. Garmin/Whoop/Oura are placeholders for now (always show as disconnected).

### 3.2 Initiate Strava OAuth

```
POST /connections/strava/initiate
```

Returns:

```json
{
  "authorize_url": "https://www.strava.com/oauth/authorize?client_id=205651&...",
  "redirect_uri": "https://app.p247.io/connections/strava/callback",
  "instructions": "Open authorize_url in ASWebAuthenticationSession..."
}
```

### 3.3 Complete Strava OAuth

```
POST /connections/strava/callback
Content-Type: application/json

{
  "code": "abc123def456",
  "scope": "read,activity:read_all,profile:read_all"
}
```

Returns:

```json
{
  "status": "connected",
  "provider": "strava",
  "athlete_id": 39484557,
  "athlete_name": "Myles Bruggeling",
  "connected_at": "2026-03-23T09:30:00+00:00"
}
```

### 3.4 Disconnect Strava

```
DELETE /connections/strava
```

Returns:

```json
{
  "status": "disconnected",
  "provider": "strava"
}
```

Revokes the token at Strava and removes the connection. Show a confirmation dialog before calling this.

### 3.5 Refresh Token (Backend Use)

```
POST /connections/strava/refresh
```

This is primarily for backend use but the app can call it if needed. Strava access tokens expire every 6 hours. The backend handles refresh automatically during polling.

---

## 4. iOS Implementation Details

### 4.1 Use ASWebAuthenticationSession

Apple's preferred method for OAuth in iOS apps. It handles the web view, shares cookies with Safari (so the athlete may already be logged into Strava), and returns the callback URL to your app.

```swift
import AuthenticationServices

func connectStrava() {
    // 1. Call backend to get authorize URL
    let initiateURL = URL(string: "https://app.p247.io/connections/strava/initiate")!
    var request = URLRequest(url: initiateURL)
    request.httpMethod = "POST"
    request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
    
    URLSession.shared.dataTask(with: request) { data, _, _ in
        guard let data = data,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let authorizeURLString = json["authorize_url"] as? String,
              let authorizeURL = URL(string: authorizeURLString) else { return }
        
        // 2. Open Strava auth in ASWebAuthenticationSession
        let session = ASWebAuthenticationSession(
            url: authorizeURL,
            callbackURLScheme: "https"  // or your custom scheme
        ) { callbackURL, error in
            guard let callbackURL = callbackURL, error == nil else { return }
            
            // 3. Extract code from callback URL
            let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)
            let code = components?.queryItems?.first(where: { $0.name == "code" })?.value
            let scope = components?.queryItems?.first(where: { $0.name == "scope" })?.value
            
            guard let code = code else { return }
            
            // 4. Send code to backend
            self.completeStravaAuth(code: code, scope: scope)
        }
        
        session.presentationContextProvider = self
        session.prefersEphemeralWebBrowserSession = false  // Share Safari cookies
        
        DispatchQueue.main.async {
            session.start()
        }
    }.resume()
}

func completeStravaAuth(code: String, scope: String?) {
    let callbackURL = URL(string: "https://app.p247.io/connections/strava/callback")!
    var request = URLRequest(url: callbackURL)
    request.httpMethod = "POST"
    request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body: [String: Any] = ["code": code, "scope": scope ?? ""]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)
    
    URLSession.shared.dataTask(with: request) { data, _, _ in
        // Handle success: update UI to show connected state
        // Refresh the connections list
    }.resume()
}
```

### 4.2 Callback URL Handling

The `redirect_uri` is set to `https://app.p247.io/connections/strava/callback`. For `ASWebAuthenticationSession` to intercept this:

**Option A: Universal Links (recommended)**
- Register `app.p247.io` as an associated domain in your app
- Add an `apple-app-site-association` file at `https://app.p247.io/.well-known/apple-app-site-association`
- The redirect will open directly in your app

**Option B: Custom URL Scheme**
- Register a custom scheme like `p247://`
- Change `STRAVA_REDIRECT_URI` on the backend to `p247://strava/callback`
- Update Strava API settings to allow this redirect URI

Option A is cleaner for App Store review. Option B is faster to implement. Either works.

**Important:** The redirect URI must be registered in Strava's API settings at https://www.strava.com/settings/api. Add the chosen URI to the "Authorization Callback Domain" field.

### 4.3 UI Design

**Connections Screen (in Settings/Profile):**

```
┌─────────────────────────────────────┐
│  Connected Services                  │
│                                      │
│  🟠 Strava          [Connect]        │
│  ⚪ Garmin           Coming Soon     │
│  ⚪ Whoop            Coming Soon     │
│  ⚪ Oura             Coming Soon     │
└─────────────────────────────────────┘
```

After connecting:

```
┌─────────────────────────────────────┐
│  Connected Services                  │
│                                      │
│  🟢 Strava     Myles Bruggeling     │
│     Connected 23 Mar 2026            │
│     Last sync: 2 min ago             │
│                        [Disconnect]  │
│                                      │
│  ⚪ Garmin           Coming Soon     │
│  ⚪ Whoop            Coming Soon     │
│  ⚪ Oura             Coming Soon     │
└─────────────────────────────────────┘
```

### 4.4 Error Handling

| Scenario | Action |
|---|---|
| Athlete denies Strava permission | Show "Strava connection cancelled. You can connect later from Settings." |
| Token exchange fails (400 from backend) | Show "Could not connect to Strava. Please try again." |
| Network error during OAuth | Show "Connection failed. Check your internet and try again." |
| Athlete connects a different Strava account | Backend overwrites the previous connection (one Strava per P247 user). |

---

## 5. Strava API Settings

The following must be configured in Strava's API settings (https://www.strava.com/settings/api):

- **Application Name:** P247
- **Category:** Training & Analysis
- **Website:** https://p247.io
- **Authorization Callback Domain:** `app.p247.io` (or your custom scheme domain)
- **Scopes requested:** `read`, `activity:read_all`, `profile:read_all`

The Strava API app is already registered (Client ID: 205651). The callback domain may need updating to include the production redirect URI.

---

## 6. What Happens After Connection

Once the backend has tokens:

1. Backend polls Strava for activities every 30 minutes (using the stored access/refresh tokens)
2. New activities are merged into the athlete's training data
3. The daily brief includes Strava activity details (workout names, pace, HR, training load)
4. The coaching agent sees Strava data in its context

The athlete doesn't need to do anything else. Data flows automatically.

---

## 7. Testing

1. Tap "Connect" on the Strava row
2. Strava auth page opens (may auto-login if already signed into Strava in Safari)
3. Tap "Authorize" on Strava's permission screen
4. Redirect back to app
5. Connections screen shows green indicator + athlete name
6. `GET /connections/` confirms `"connected": true`
7. Next brief generation includes Strava training data
