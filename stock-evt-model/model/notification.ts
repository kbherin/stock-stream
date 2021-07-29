interface AppNotification {
    message : string,
    importance : "ERROR" | "WARNING" | "INFO" | "CRITICAL" | "FAILURE",
    timestamp : Date
}