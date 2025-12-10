# MOTOR Engine - Architecture & Design

## 📋 Overview

MOTOR is the core route segmentation and planning engine for CaraColaViajes. It calculates:
- Route segmentation by days
- Distance calculations
- Waypoint handling
- Elevation and terrain analysis
- Weather integration (future)

---

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────────┐
│   API Layer (app/actions.ts)                │
│   - getDirectionsAndCost()                  │
│   - processRoute()                          │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│   Route Engine (Core Logic)                 │
│   - Distance calculation                    │
│   - Day segmentation                        │
│   - Coordinate extraction                   │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│   External APIs                             │
│   - Google Maps Directions API              │
│   - Google Geocoding API                    │
│   - Open-Meteo (Weather)                    │
└─────────────────────────────────────────────┘
```

### Data Flow

```
User Input (route A→B)
    ↓
Geocoding (get coordinates)
    ↓
Google Directions API (get route)
    ↓
Route Analysis:
  - Extract waypoints
  - Calculate total distance
  - Calculate driving time
    ↓
Day Segmentation:
  - Split route into daily segments
  - ~600km per day (configurable)
  - Consider geographical features
    ↓
Output: DailyPlan
  - Array of daily segments
  - Each with: date, distance, coords
```

---

## 📊 DailyPlan Structure

### Example Output

```javascript
{
  date: "2025-12-10",
  day: 1,
  from: "Barcelona, Spain",
  to: "Saint-Jean-de-Luz, France",
  distance: 602,
  isDriving: true,
  coordinates: {
    lat: 43.2965,
    lng: 1.3629
  },
  startCoordinates: {
    lat: 41.3851,
    lng: 2.1734
  },
  waypoints: ["Perpignan", "Bayonne"]
}
```

### Key Fields
| Field | Type | Description |
|-------|------|-------------|
| date | string | ISO date (YYYY-MM-DD) |
| day | number | Day number in itinerary |
| from | string | Origin city |
| to | string | Destination city |
| distance | number | Distance in km |
| isDriving | boolean | Is driving route (vs flying) |
| coordinates | object | End point {lat, lng} |
| startCoordinates | object | Start point {lat, lng} |
| waypoints | array | Intermediate cities |

---

## 🔧 Configuration

### Environment Variables

```bash
# Google Maps API Keys
GOOGLE_MAPS_API_KEY_FIXED=...      # Server-side key (preferred)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...# Browser key (fallback)

# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Route Configuration
MOTOR_DAILY_DISTANCE_KM=600         # Default: 600km/day
MOTOR_MAX_DRIVING_HOURS=10          # Default: 10 hours/day
MOTOR_BATCH_SIZE=100                # Geocoding batch size
```

### Rate Limiting

- **Geocoding:** Exponential backoff (2s → 8s delays)
- **Directions API:** 50 requests/second limit
- **Retries:** 3 attempts with exponential backoff

---

## 🧮 Segmentation Algorithm

### Default Strategy: Distance-Based

1. Calculate total route distance
2. Divide by ~600km per day
3. Create segments based on:
   - Distance thresholds
   - Natural waypoints
   - Geographic features (mountains, coasts)

### Example: Barcelona → Paris (1000km)

```
Day 1: Barcelona → Perpignan → Nimes (600km)
Day 2: Nimes → Lyon → Geneva (400km)
       OR
Day 2: Nimes → Geneva (330km)
Day 3: Geneva → Paris (400km)
```

### Factors Affecting Segmentation

| Factor | Impact |
|--------|--------|
| Distance | Primary (600km target) |
| Terrain | Mountains = slower |
| Waypoints | Natural break points |
| Country borders | Possible break points |
| Coordinates | Validates accuracy |

---

## 🔌 API Integration

### Google Maps Directions API

```javascript
// Request Format
{
  origin: "Barcelona, Spain",
  destination: "Paris, France",
  waypoints: ["Lyon, France"],
  mode: "driving",
  key: GOOGLE_MAPS_API_KEY_FIXED
}

// Response Fields Used
{
  routes[0]: {
    legs[]: {
      distance: { value: 100000 },  // meters
      duration: { value: 3600 }     // seconds
    },
    overview_polyline: { points }   // encoded path
  }
}
```

### Error Handling

```javascript
// Retry Logic
if (error.code === "RATE_LIMIT_EXCEEDED") {
  wait(exponentialBackoff);
  retry();
}

if (error.code === "ZERO_RESULTS") {
  logWarning("No route found");
  return null;
}

if (error.code === "INVALID_REQUEST") {
  validateInput();
  return null;
}
```

---

## 📈 Performance Metrics

### Benchmarks (33-Route Test)

| Metric | Value |
|--------|-------|
| Total Execution Time | 8-10 seconds |
| Average per Route | ~250ms |
| Geocoding Calls | ~100 |
| Direction Calls | ~33 |
| Success Rate | 100% |

### Optimization Techniques

1. **Batch Processing:** Group geocoding requests
2. **Caching:** Store previous route results
3. **Parallel Requests:** Simultaneous API calls (rate-limited)
4. **Early Exit:** Stop processing if validation fails

---

## ⚠️ Known Limitations

### Distance Accuracy
- ±5-10% variance from actual (due to API variations)
- Real-time traffic not included
- Seasonal route changes not considered

### Route Segmentation
- Assumes consistent driving speed (~80 km/h)
- Doesn't account for:
  - Rest breaks
  - Border crossing delays
  - Mountain passes
  - Ferry routes

### Geographic Coverage
- Best in Europe
- Limited support for:
  - Remote areas (Siberia, deserts)
  - Island hopping
  - Off-road routes

---

## 🚀 Future Enhancements

### Planned Features
1. **Real-time Traffic** - Integration with live traffic data
2. **Weather Integration** - Route optimization based on weather
3. **Accommodation Suggestions** - Hotel/camping suggestions per segment
4. **Activity Recommendations** - POI suggestions based on route
5. **Cost Calculator** - Fuel, tolls, accommodation costs
6. **Accessibility** - Wheelchair accessible routes
7. **Eco-Routing** - Carbon footprint calculations

### Architecture for Extensions

```javascript
// Extensible plugin architecture
class MotorEngine {
  plugins: {
    weather: WeatherPlugin,
    accommodation: AccommodationPlugin,
    activities: ActivityPlugin,
    costs: CostPlugin
  }

  async process(route) {
    let plan = this.segment(route);

    for (let plugin of this.plugins) {
      plan = await plugin.enhance(plan);
    }

    return plan;
  }
}
```

---

## 🧪 Testing Strategy

### Test Coverage

| Category | Routes | Status |
|----------|--------|--------|
| Mountain | 6 | ✅ Tested |
| Cross-Continent | 6 | ✅ Tested |
| Small Towns | 6 | ✅ Tested |
| Extreme | 6 | ✅ Tested |
| Complex | 6 | ✅ Tested |
| Edge Cases | 3 | ✅ Tested |

### Test Metrics
- **Pass Rate:** 100% (33/33)
- **Distance Accuracy:** 95.0% ±2.2%
- **Day Calculation:** 100%
- **Execution Time:** <10 seconds

### Test Scripts

```bash
# Run all tests
npm run test:motor:advanced

# Run specific test
npm run test:motor:direct

# Run simplified tests
npm run test:motor:simple
```

---

## 📚 Code Locations

| Component | Location |
|-----------|----------|
| Main API | `app/actions.ts` |
| Types | `app/types.ts` |
| Hooks | `hooks/` |
| Components | `app/components/TripMap.tsx` |
| Tests | `scripts/test-motor-*.js` |
| Docs | `docs/` |

---

## 🔒 Security Considerations

### API Keys
- ✅ Server-side key in `GOOGLE_MAPS_API_KEY_FIXED`
- ⚠️ Browser key only as fallback
- ✅ Never commit keys to git

### Rate Limiting
- ✅ Implement exponential backoff
- ✅ Cache results to reduce API calls
- ✅ Monitor API quota usage

### Input Validation
- ✅ Validate coordinates (±90°, ±180°)
- ✅ Sanitize location names
- ✅ Reject suspiciously long routes (>5000km)

---

## 📞 Support & Debugging

### Common Issues

**Issue:** "Zero results" error
→ **Solution:** Validate location names, try nearby cities

**Issue:** Slow response
→ **Solution:** Check API quota, enable caching, reduce batch size

**Issue:** Inaccurate distances
→ **Solution:** Verify with Google Maps, check for alternative routes

### Debug Mode

```javascript
// Enable detailed logging
const MOTOR_DEBUG = true;

// Check logs
console.log('[MOTOR]', 'Processing route:', origin, '→', destination);
console.log('[MOTOR]', 'API Response:', response);
console.log('[MOTOR]', 'Final Plan:', dailyPlan);
```

---

**Document Version:** 1.0
**Last Updated:** December 8, 2025
**Status:** Production ✅
