-- KEYS: one Redis key per seat, e.g. lock:show:<showId>:seat:D9
-- ARGV[1]: the hold value to store ("holdId:userId")
-- ARGV[2]: lock lifetime in milliseconds
-- Returns: an empty list on success, or the list of keys that were already taken.

local conflicts = {}

-- Pass 1: only look. Do not change anything yet.
for i = 1, #KEYS do
  if redis.call('EXISTS', KEYS[i]) == 1 then
    conflicts[#conflicts + 1] = KEYS[i]
  end
end

if #conflicts > 0 then
  return conflicts
end

-- Pass 2: nothing was taken, so lock every seat with the same expiry.
for i = 1, #KEYS do
  redis.call('SET', KEYS[i], ARGV[1], 'PX', ARGV[2])
end

return conflicts