/**
 * Token lint rule: Forbid hardcoded colors in components
 * Run: grep -R --line-number -E "#[0-9a-fA-F]{3,8}|hsl\\([^v]|rgb\\([^v]" web/components
 */

// This is a placeholder - actual enforcement via CI grep command
// See package.json scripts for "lint:tokens"

module.exports = {
  rules: {
    // Custom rule would go here if using ESLint plugin
  },
};

