type LogLevel = "log" | "warn" | "error" | "debug"

export class Logger {
    private scope : string;

    constructor(_scope : string){
        this.scope = _scope;
    }

    private format(level: LogLevel, args: any[]) {
        let color = "#4ade80"; // default green
        if (level === "warn") color = "#facc15";   // yellow
        if (level === "error") color = "#f87171";  // red
        if (level === "debug") color = "#60a5fa";  // blue

        const prefix = `%c[${this.scope}]%c`;
        const styleScope = `color: ${color}; font-weight: bold`;
        const styleReset = "color: inherit; font-weight: normal";
    return [prefix, styleScope, styleReset, ...args];
    }

    log(...args: any[]){
        console.log(...this.format("log", args));
    }

    warn(...args: any[]){
        console.warn(...this.format("warn", args));
    }

    error(...args: any[]){
        console.error(...this.format("error", args));
    }

    debug(...args: any[]){
        if (import.meta.env.VITE_NODE_ENV !== "production") { console.debug(...this.format("debug", args)); }
    }
}
