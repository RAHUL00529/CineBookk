-- -- KEYS: seat keys to release
-- -- ARGV[1]: the hold value ("holdId:userId")
-- -- Deletes only the keys whose value matches ARGV[1].
-- -- Returns how many keys were actually deleted.

-- local released = 0

-- for i = 1, #KEYS do
--   if redis.call('GET', KEYS[i]) == ARGV[1] then
--     redis.call('DEL', KEYS[i])
--     released = released + 1
--   end
-- end

-- return released








-- KEYS: seat keys to release
-- ARGV[1]: the hold value ("holdId:userId")
-- Deletes only the keys whose value matches ARGV[1].
-- Returns the list of keys that were actually deleted.

local released = {}

for i = 1, #KEYS do
  if redis.call('GET', KEYS[i]) == ARGV[1] then
    redis.call('DEL', KEYS[i])
    released[#released + 1] = KEYS[i]
  end
end

return released