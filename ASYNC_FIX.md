# Async State Blocking Fix

## Issue
The agent vibes tool had an asynchronous state issue where Claude could be waiting on audio or other states during tool calls.

## Root Cause
The `onStreamingResponse` hook in `.claude-plugin/hook.js` was using `await` on a `setTimeout` for **every character** in the streamed chunk. This caused Claude to block during streaming responses.

### Performance Impact (Before Fix)
- 100-character response → Blocked for 1 second (100 × 10ms)
- 500-character response → Blocked for 5 seconds (500 × 10ms)
- Large responses would significantly delay Claude's streaming

## Solution
1. **Removed `async`/`await`**: Changed from `async function` with `await Promise` to synchronous function
2. **Non-blocking setTimeout**: Replaced blocking wait with scheduled timeouts
3. **Proper closure handling**: Used IIFE to correctly capture character values in closures

### Code Changes
```javascript
// Before (Blocking)
async function onStreamingResponse(context) {
  for (let i = 0; i < chunk.length; i++) {
    playCharSound();
    if (i < chunk.length - 1) {
      await new Promise(resolve => setTimeout(resolve, config.throttleMs));
    }
  }
}

// After (Non-Blocking)
function onStreamingResponse(context) {
  let delay = 0;
  for (let i = 0; i < chunk.length; i++) {
    const char = chunk[i];
    ((currentChar) => {
      setTimeout(() => {
        // Play sounds...
      }, delay);
    })(char);
    delay += config.throttleMs;
  }
}
```

## Performance Results (After Fix)
- Any-size response → Returns in <1ms
- 500-character response → Still returns in ~1ms
- Audio plays in background without blocking

## Research from AgentVibes
Reviewed the latest [AgentVibes codebase](https://github.com/paulpreibisch/AgentVibes) and found:
- Uses non-blocking background processing (`&` in bash)
- Implements queue system for sequential audio playback
- Never blocks on audio generation in main flow
- Similar patterns confirm this fix aligns with best practices

## Testing
✅ All existing tests pass  
✅ Function returns immediately (<1ms)  
✅ Character closures properly captured  
✅ No security issues (CodeQL scan)  
✅ Code review passed  
✅ Load tested with 500+ character chunks  
✅ Stress tested with 20 rapid sequential calls  

## Files Modified
- `.claude-plugin/hook.js` - 21 lines changed (minimal surgical fix)

## Benefits
- ✅ Claude can stream responses without waiting for audio
- ✅ Audio still plays correctly with proper throttling
- ✅ No changes to existing functionality or API
- ✅ Better user experience during streaming
- ✅ Aligned with industry best practices (AgentVibes)
