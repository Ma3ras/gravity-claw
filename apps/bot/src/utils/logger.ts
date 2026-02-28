type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

function timestamp(): string {
    return new Date().toISOString();
}

function format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const base = `[${timestamp()}] [${level}] ${message}`;
    if (meta && Object.keys(meta).length > 0) {
        return `${base} ${JSON.stringify(meta)}`;
    }
    return base;
}

export const log = {
    info(message: string, meta?: Record<string, unknown>) {
        console.log(format("INFO", message, meta));
    },

    warn(message: string, meta?: Record<string, unknown>) {
        console.warn(format("WARN", message, meta));
    },

    error(message: string, meta?: Record<string, unknown>) {
        console.error(format("ERROR", message, meta));
    },

    debug(message: string, meta?: Record<string, unknown>) {
        if (process.env["DEBUG"]) {
            console.debug(format("DEBUG", message, meta));
        }
    },
};
