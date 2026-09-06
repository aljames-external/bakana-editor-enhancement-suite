import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import "../setup.js";
import { Logger, VERBOSITY_LEVELS } from "../../src/lib/logger.js";

describe("Logger Library", () => {
    let logger;

    beforeEach(() => {
        logger = new Logger();
        logger.setVerbosity("debug");
    });

    it("handles verbosity settings correctly", () => {
        logger.setVerbosity("error");
        assert.equal(logger.getVerbosityLevel(), VERBOSITY_LEVELS.error);

        logger.setVerbosity("warn");
        assert.equal(logger.getVerbosityLevel(), VERBOSITY_LEVELS.warn);

        logger.setVerbosity("info");
        assert.equal(logger.getVerbosityLevel(), VERBOSITY_LEVELS.info);

        logger.setVerbosity("debug");
        assert.equal(logger.getVerbosityLevel(), VERBOSITY_LEVELS.debug);
    });

    it("executes log methods without throwing", () => {
        assert.doesNotThrow(() => {
            logger.error("Test error");
            logger.warn("Test warn");
            logger.info("Test info");
            logger.debug("Test debug");
        });
    });

    it("handles console groups cleanly", () => {
        assert.doesNotThrow(() => {
            logger.group("Test group");
            logger.info("Group child message");
            logger.groupEnd();
        });
    });

    it("enqueues debounced toast notifications", () => {
        assert.doesNotThrow(() => {
            logger.notify.info("Info toast");
            logger.notify.warn("Warn toast");
            logger.notify.error("Error toast");
        });
    });
});
