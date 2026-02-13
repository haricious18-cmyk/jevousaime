# 🚀 Je vous aime - Quick Reference Guide

## What Was Just Implemented

### ✅ 1. DATABASE SCHEMA (3 Tables)
**Location**: `scripts/001_create_tables.sql` & `scripts/001_sessions.sql`

```sql
rooms                  -- Session management
room_metadata          -- State storage (JSONB)
room_users             -- Presence tracking
```

Run in Supabase SQL Editor:
1. Copy `001_create_tables.sql` → Run
2. Copy `001_sessions.sql` → Run
3. Enable Realtime for these 3 tables

---

### ✅ 2. SYNCHRONIZATION ENGINE 
**File**: `/hooks/use-game-sync.ts`

The heart of real-time sync. Handles:
- Partner online/offline detection
- Real-time state broadcasting
- Event listeners for phase changes
- Automatic UI updates

**Import & Use**:
```tsx
import { useGameSync } from "@/hooks/use-game-sync"

const { state, updateDoorInput, advanceStage, updateLoveMeter } = 
  useGameSync(roomId, "partner_a")
```

---

### ✅ 3. FOUR GAME ROOMS

#### Door Room 🚪
**File**: `/components/the-door.tsx`
- Synchronized text input
- Both must type "communication"
- Real-time progress visualization

```tsx
<TheDoor
  roomId={roomId}
  role="partner_a"
  partnerName="Emma"
  onUnlock={() => moveToNextRoom()}
/>
```

#### Library Room 📚
**File**: `/components/library-room.tsx`
- 6 asymmetric book matching pairs
- Real-time selection highlighting
- Golden glow on match

```tsx
<LibraryRoom
  roomId={roomId}
  role="partner_a"
  onComplete={() => moveToNextRoom()}
/>
```

#### Heart Room 💗
**File**: `/components/heart-sync.tsx`
- SVG heart that fills 0-100%
- Press & hold synchronization
- Must both press for 10 seconds

```tsx
<HeartSync
  roomId={roomId}
  role="partner_a"
  onComplete={() => moveToNextRoom()}
/>
```

#### Compass Room 🧭
**File**: `/components/values-compass.tsx`
- 3 values: Adventure, Family, Security
- Hidden selection until both lock
- Reveal shows if choices match

```tsx
<ValuesCompass
  roomId={roomId}
  role="partner_a"
  onComplete={() => moveToNextRoom()}
/>
```

---

### ✅ 4. STATUS BAR
**File**: `/components/status-bar-new.tsx`

Persistent top bar showing:
- ✓ Partner online status (green pulse)
- ✓ Love meter (0-100%)
- ✓ Current room name
- ✓ Progress bar

```tsx
<StatusBar
  partnerName="Emma"
  partnerOnline={true}
  loveMeter={50}
  stage={2}
/>
```

---

### ✅ 5. ROMANTIC DESIGN SYSTEM
**File**: `/app/globals.css`

Updated with:
- Light romantic color palette
  - White, Cream, Blush Pink, Valentine Red
- Playfair Display serif for headings
- Inter sans-serif for UI
- Romantic glow effects
- Gentle animations
- Mobile touch optimizations

---

## 🎯 How to Use

### Step 1: Deploy Database
```bash
# In Supabase Dashboard:
# SQL Editor → New Query
# Paste: scripts/001_create_tables.sql → Run
# New Query → paste: scripts/001_sessions.sql → Run
```

### Step 2: Import Components
```tsx
import { useGameSync } from "@/hooks/use-game-sync"
import { StatusBar } from "@/components/status-bar-new"
import { TheDoor } from "@/components/the-door"
import { LibraryRoom } from "@/components/library-room"
import { HeartSync } from "@/components/heart-sync"
import { ValuesCompass } from "@/components/values-compass"
```

### Step 3: Build Your Game Flow
```tsx
export default function GamePage({ roomId, userRole }) {
  const { state, advanceStage, updateLoveMeter } = useGameSync(roomId, userRole)

  const onRoomComplete = () => {
    updateLoveMeter(25) // +25 points per room
    advanceStage()
  }

  return (
    <>
      <StatusBar
        partnerOnline={state.partnerOnline}
        loveMeter={state.loveMeter || 0}
        stage={state.currentStage}
      />

      {state.currentStage === 0 && <TheDoor ... onUnlock={onRoomComplete} />}
      {state.currentStage === 1 && <LibraryRoom ... onComplete={onRoomComplete} />}
      {state.currentStage === 2 && <HeartSync ... onComplete={onRoomComplete} />}
      {state.currentStage === 3 && <ValuesCompass ... onComplete={onRoomComplete} />}
    </>
  )
}
```

---

## 🎨 Color Palette Reference

```
White:         #FFFFFF
Cream:         #FFFDD0
Blush Pink:    #FFD1DC
Valentine Red: #E63946
Dark Red:      #C1121F (for accents)
```

Use in Tailwind:
```tsx
className="text-primary"        // Valentine Red
className="bg-secondary"        // Blush Pink
className="bg-card"             // Cream
className="text-foreground"     // Red-dark
```

---

## 🔄 Real-Time Sync Flow

```
User A Types    →  useGameSync.updateDoorInput()
                →  Supabase room_metadata.door_state updates
                →  Realtime broadcasts to User B
                →  User B's component re-renders

Both Update     →  All changes in parallel
                →  Sub-100ms latency typical
```

---

## 📱 Mobile Support

All components support:
- Touch events (onTouchStart, onTouchEnd)
- Mobile-first design
- Responsive grids
- No scroll during interactions

---

## 🧪 Testing

Open 2 browser tabs with same roomId:

1. **Door**: Type in both, watch progress bars sync
2. **Library**: Click book in Tab A, watch highlight in Tab B
3. **Heart**: Press in both, watch fill together
4. **Compass**: Select value in Tab A, see "?" in Tab B

---

## 📚 Files Summary

| File | Purpose | Status |
|------|---------|--------|
| use-game-sync.ts | Real-time engine | ✅ New |
| the-door.tsx | Synchronized door | ✅ New |
| heart-sync.tsx | Heart press game | ✅ New |
| library-room.tsx | Book matching | ✅ New |
| values-compass.tsx | Interactive compass | ✅ New |
| status-bar-new.tsx | Live status | ✅ New |
| 001_create_tables.sql | Database | ✅ Updated |
| 001_sessions.sql | RLS/Realtime | ✅ Updated |
| globals.css | Romantic design | ✅ Updated |

---

## 🎯 Next Steps

1. ✅ Database migrations (run SQL)
2. ✅ Import components in your app
3. ✅ Wire up room flow with stage tracking
4. ✅ Test real-time sync
5. ⭕ Add confetti celebration on completion
6. ⭕ Add time capsule message feature
7. ⭕ Add sound effects

---

## 💡 Key Features

- **Real-time**: Supabase Realtime for instant sync
- **Asymmetric**: Library room with different views
- **Mobile**: Touch-friendly press & hold
- **Romantic**: Gradient backgrounds, glow effects
- **Stateful**: Persists across reconnects
- **Scalable**: JSONB allows easy feature expansion

---

## 🆘 Troubleshooting

**Components not updating?**
- Check Realtime is enabled in Supabase
- Verify RLS policies exist
- Check browser console for errors

**Mobile press not working?**
- Ensure `touch-action: none` on container
- Test `onTouchStart`/`onTouchEnd` firing

**Sync delay?**
- Normal 100-500ms latency
- Add optimistic UI updates if needed

---

## 📖 Documentation Files

For detailed info, see:
- `IMPLEMENTATION_AUDIT.md` - Complete audit
- `MISSING_FILES_CHECKLIST.md` - Full checklist

---

Created with 💕 for long-distance couples.
