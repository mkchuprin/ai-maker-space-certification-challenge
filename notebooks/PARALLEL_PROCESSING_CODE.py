# ============================================
# PARALLELIZED EVENT PROCESSING CODE
# ============================================
# Replace the sequential loop in your notebook with this code

# Parallelize event processing for faster extraction
# Using ThreadPoolExecutor for I/O-bound API calls
# Limit concurrent requests to avoid rate limits (8 concurrent is safe for OpenAI)

def process_event(row_tuple):
    """Wrapper function for parallel processing."""
    idx, row = row_tuple
    try:
        result = extract_baby_friendly(row['title'], row['long_description'])
        return idx, result
    except Exception as e:
        print(f"Error processing event {idx} ({row['title']}): {e}")
        return idx, {
            "baby_friendly": False,
            "indoor_or_outdoor": "indoor",
            "clean_summary": f"{row['title']}. {row['long_description'][:200]}..."
        }

# Prepare data for parallel processing
event_rows = [(idx, row) for idx, row in df.iterrows()]

# Process events in parallel with progress bar
print(f"Processing {len(event_rows)} events in parallel...")
print("Using 8 concurrent workers (adjust if you hit rate limits)\n")

baby_friendly_flags = [None] * len(df)
indoor_outdoor_flags = [None] * len(df)
clean_summaries = [None] * len(df)

# Use ThreadPoolExecutor for parallel API calls
with ThreadPoolExecutor(max_workers=8) as executor:
    # Submit all tasks
    future_to_idx = {executor.submit(process_event, row_tuple): row_tuple[0] 
                     for row_tuple in event_rows}
    
    # Process completed tasks with progress bar
    for future in tqdm(as_completed(future_to_idx), total=len(event_rows), desc="Processing events"):
        idx, result = future.result()
        baby_friendly_flags[idx] = result['baby_friendly']
        indoor_outdoor_flags[idx] = result['indoor_or_outdoor']
        clean_summaries[idx] = result['clean_summary']

# Add to dataframe
df['baby_friendly'] = baby_friendly_flags
df['indoor_or_outdoor'] = indoor_outdoor_flags
df['clean_summary'] = clean_summaries

print(f"\n✅ Processing complete!")
print(f"Baby-friendly events: {sum(baby_friendly_flags)} out of {len(df)} ({sum(baby_friendly_flags)/len(df)*100:.1f}%)")
print(f"\nIndoor/Outdoor breakdown:")
print(f"  Indoor: {indoor_outdoor_flags.count('indoor')}")
print(f"  Outdoor: {indoor_outdoor_flags.count('outdoor')}")
print(f"  Both: {indoor_outdoor_flags.count('both')}")

# ============================================
# PERFORMANCE NOTES:
# ============================================
# - Sequential: ~3.36s per event = ~5 minutes for 90 events
# - Parallel (8 workers): ~0.5-1s per event = ~1-2 minutes for 90 events
# - Speedup: ~3-5x faster depending on API response times
# 
# If you hit rate limits, reduce max_workers to 5 or add a small delay:
#   time.sleep(0.05)  # Inside process_event function

