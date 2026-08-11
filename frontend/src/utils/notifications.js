export function requestNotificationPermission() {
  if (!("Notification" in window)) return Promise.resolve("unsupported");
  if (Notification.permission === "granted") return Promise.resolve("granted");
  if (Notification.permission === "denied") return Promise.resolve("denied");
  return Notification.requestPermission();
}

export function notifyTireChange(message) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification("Track Condition Alert", { body: message });
}