#!/usr/bin/env node
// Prints only failed Jest tests from a JSON report file
// Also writes a JSON with failures only for easy consumption by tools/CI
// Usage: node scripts/print-failures.mjs [inputJson] [outputJson]

import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2] || "tests/reports/test-report.json";
const outputPathArg = process.argv[3] || "tests/reports/test-failures.json";
const reportPath = path.resolve(process.cwd(), inputPath);

function stripAnsi(str = "") {
	// Remove ANSI escape sequences without using control-char regex literals
	const s = String(str);
	let out = "";
	for (let i = 0; i < s.length; i++) {
		const code = s.charCodeAt(i);
		// 27 is ESC; pattern ESC [ ... m
		if (code === 27 && s[i + 1] === "[") {
			i += 2; // skip ESC[
			while (i < s.length && s[i] !== "m") i++;
			// loop will increment i further
			continue;
		}
		if (s[i] !== "\r") out += s[i];
	}
	return out.replace(/\n{2,}/g, "\n");
}

function main() {
	if (!fs.existsSync(reportPath)) {
		console.error(`Report not found: ${reportPath}`);
		process.exit(1);
	}

	let data;
	try {
		const raw = fs.readFileSync(reportPath, "utf8");
		data = JSON.parse(raw);
	} catch (err) {
		console.error("Failed to read/parse report:", err?.message || err);
		process.exit(1);
	}

	const failedSuites = data.numFailedTestSuites ?? 0;
	const failedTests = data.numFailedTests ?? 0;
	const totalTests = data.numTotalTests ?? 0;
	const totalSuites = data.numTotalTestSuites ?? 0;
	const startTime = data.startTime ?? null;
	const success = Boolean(data.success);

	const testResults = Array.isArray(data.testResults) ? data.testResults : [];

	const failuresBySuite = [];

	for (const suite of testResults) {
		const suiteName = suite.name || suite.testFilePath || "(unknown suite)";
		const assertions = Array.isArray(suite.assertionResults) ? suite.assertionResults : [];

		const failedAssertions = assertions
			.filter((a) => a.status !== "passed")
			.map((a) => ({
				title: a.title || "(unnamed test)",
				fullName: a.fullName || a.title || "(unnamed test)",
				status: a.status || "failed",
				messages: (a.failureMessages || []).map(stripAnsi),
				location: a.location || null,
				ancestorTitles: a.ancestorTitles || [],
			}));

		// Some suites fail without assertion results (e.g., setup/runtime errors)
		const suiteLevelError = suite.message ? stripAnsi(suite.message) : null;

		if (failedAssertions.length > 0 || suiteLevelError) {
			failuresBySuite.push({
				suiteName,
				path: suite.name || suite.testFilePath || null,
				failedAssertions,
				suiteLevelError,
			});
		}
	}

	if (failuresBySuite.length === 0) {
		console.log("No failed tests found in report.");
		console.log(
			`Summary: ${failedTests}/${totalTests} failed across ${failedSuites}/${totalSuites} suites.`,
		);
		// Still emit an empty JSON for consistency
		const emptyOut = {
			summary: {
				failedSuites,
				totalSuites,
				failedTests,
				totalTests,
				startTime,
				success,
			},
			failedSuites: [],
		};
		try {
			fs.mkdirSync(path.dirname(outputPathArg), { recursive: true });
			fs.writeFileSync(outputPathArg, JSON.stringify(emptyOut, null, 2));
			console.log(`Wrote failure JSON: ${outputPathArg}`);
		} catch (e) {
			console.error("Failed to write failure JSON:", e?.message || e);
		}
		process.exit(0);
	}

	// Build failures-only JSON structure
	const failureJson = {
		summary: {
			failedSuites,
			totalSuites,
			failedTests,
			totalTests,
			startTime,
			success,
		},
		failedSuites: failuresBySuite,
	};

	// Write JSON file
	try {
		fs.mkdirSync(path.dirname(outputPathArg), { recursive: true });
		fs.writeFileSync(outputPathArg, JSON.stringify(failureJson, null, 2));
		console.log(`Wrote failure JSON: ${outputPathArg}`);
	} catch (e) {
		console.error("Failed to write failure JSON:", e?.message || e);
	}

	// Print compact, readable output
	console.log("=== Failed Tests Report ===");
	console.log(
		`Suites: ${failedSuites}/${totalSuites} failed | Tests: ${failedTests}/${totalTests} failed`,
	);
	console.log("");

	for (const entry of failuresBySuite) {
		console.log(`Suite: ${entry.suiteName}`);
		if (entry.suiteLevelError) {
			console.log("  Suite Error:");
			console.log(
				`    ${entry.suiteLevelError
					.split("\n")
					.map((l) => l.trim())
					.join("\n    ")}`,
			);
		}

		for (const fail of entry.failedAssertions) {
			const pathTrail = fail.ancestorTitles?.length ? `${fail.ancestorTitles.join(" > ")} > ` : "";
			console.log(`  ✖ ${pathTrail}${fail.title}`);
			if (fail.location && typeof fail.location.line === "number") {
				console.log(`    at line ${fail.location.line}:${fail.location.column ?? 0}`);
			}
			for (const msg of fail.messages) {
				const trimmed = msg.trim();
				if (!trimmed) continue;
				const firstLine = trimmed.split("\n")[0];
				console.log(`    ${firstLine}`);
				const rest = trimmed.split("\n").slice(1);
				for (const l of rest) console.log(`    ${l}`);
				console.log("");
			}
		}
		console.log("");
	}

	// Optionally echo open handles to help debugging
	if (Array.isArray(data.openHandles) && data.openHandles.length) {
		console.log("Open handles:");
		for (const h of data.openHandles) console.log("  -", h);
	}
}

main();
