-- KEYS: the seat keys the user believes they hold
-- ARGV[1]: the hold value ("holdId:userId")
-- Returns 1 if EVERY key still holds that value, otherwise 0.

for i = 1, #KEYS do
  if redis.call('GET', KEYS[i]) ~= ARGV[1] then
    return 0
  end
end

return 1