// Turns an axios error into a message safe to show the user
export function getErrorMessage(err) {
  return (
    err.response?.data?.error ?? "Cannot reach the server. Please try again."
  );
}
