#!/bin/bash

# Quick lint fixes for HSpaceX
echo "🔧 Applying quick lint fixes..."

# Fix common unused variable patterns
find src -name "*.tsx" -exec sed -i 's/const \([^,]*\), _\([^=]*\) = /const \1 = /g' {} \;
find src -name "*.tsx" -exec sed -i 's/const _\([^,]*\), \([^=]*\) = /const \2 = /g' {} \;

# Remove common unused imports
find src -name "*.tsx" -exec sed -i '/import.*useEffect.*from.*react/s/useEffect, //g' {} \;

# Fix eslint disable patterns
find src -name "*.tsx" -exec sed -i 's/} catch (error) {/} catch {/g' {} \;
find src -name "*.tsx" -exec sed -i 's/} catch (err) {/} catch {/g' {} \;

echo "✅ Quick fixes applied!"
echo "🔍 Run 'npm run lint' to see remaining issues"