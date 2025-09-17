import { logger } from "../server";

/**
 * Create a logger with automatic caller information
 * This captures the file and line number where the log is called
 */
export const createCallerLogger = (filename: string) => {
	const getCallerInfo = () => {
		const stack = new Error().stack;
		if (!stack) return filename;
		
		const lines = stack.split('\n');
		// Find the first line that contains our source code (not node_modules)
		const callerLine = lines.find(line => 
			line.includes('/src/') && 
			!line.includes('logger.helper.ts')
		);
		
		if (callerLine) {
			// Extract file and line number from stack trace
			const match = callerLine.match(/\/src\/(.+):(\d+):\d+/);
			if (match) {
				const [, file, line] = match;
				return `${file}:${line}`;
			}
		}
		
		return filename;
	};

	return {
		info: (msg: string, data?: object) => {
			logger.info({ caller: getCallerInfo(), ...data }, msg);
		},
		error: (msg: string, data?: object) => {
			logger.error({ caller: getCallerInfo(), ...data }, msg);
		},
		warn: (msg: string, data?: object) => {
			logger.warn({ caller: getCallerInfo(), ...data }, msg);
		},
		debug: (msg: string, data?: object) => {
			logger.debug({ caller: getCallerInfo(), ...data }, msg);
		}
	};
};

/**
 * Simple helper to add caller info to any log
 */
export const logWithCaller = (level: 'info' | 'error' | 'warn' | 'debug', msg: string, data?: object) => {
	const stack = new Error().stack;
	let caller = 'unknown';
	
	if (stack) {
		const lines = stack.split('\n');
		const callerLine = lines.find(line => 
			line.includes('/src/') && 
			!line.includes('logger.helper.ts')
		);
		
		if (callerLine) {
			const match = callerLine.match(/\/src\/(.+):(\d+):\d+/);
			if (match) {
				const [, file, line] = match;
				caller = `${file}:${line}`;
			}
		}
	}
	
	logger[level]({ caller, ...data }, msg);
};