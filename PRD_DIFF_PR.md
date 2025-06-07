diff --git a/api/index.js b/api/index.js
index 4926ada..2ed2414 100644
--- a/api/index.js
+++ b/api/index.js
@@ -1,53 +1,86 @@
-// Simple Vercel serverless function handler
+// Clean Vercel serverless function handler
+// Bypasses complex build system to avoid Rollup/Vite dependency issues
+
 import { initializeApp } from '../build/server-out/server/app.js';
 
-// Initialize the Express app once
+// Initialize the Express app once and reuse across requests
 let appInstance = null;
-let appPromise = null;
+let isInitializing = false;
 
-const getApp = async () => {
+async function getApp() {
+  // If app is already initialized, return it
   if (appInstance) {
     return appInstance;
   }
   
-  if (!appPromise) {
-    appPromise = initializeApp();
+  // If currently initializing, wait for it
+  if (isInitializing) {
+    while (isInitializing) {
+      await new Promise(resolve => setTimeout(resolve, 10));
+    }
+    return appInstance;
   }
   
-  appInstance = await appPromise;
-  return appInstance;
-};
+  // Start initialization
+  isInitializing = true;
+  
+  try {
+    console.log('🚀 Initializing Express app for serverless...');
+    appInstance = await initializeApp();
+    console.log('✅ Express app initialized successfully');
+    return appInstance;
+  } catch (error) {
+    console.error('❌ Failed to initialize Express app:', error);
+    throw error;
+  } finally {
+    isInitializing = false;
+  }
+}
 
+// Main serverless handler
 export default async function handler(req, res) {
-  // Add comprehensive logging for debugging
-  console.log(`🔍 API Request: ${req.method} ${req.url}`);
-  console.log(`🔍 VERCEL_ENV: ${process.env.VERCEL_ENV}`);
-  console.log(`🔍 NODE_ENV: ${process.env.NODE_ENV}`);
+  const startTime = Date.now();
+  
+  // Log request for debugging
+  console.log(`🔍 ${req.method} ${req.url} - Headers: ${JSON.stringify(req.headers, null, 2)}`);
   
   try {
+    // Get the Express app instance
     const app = await getApp();
     
     if (!app) {
-      console.error('❌ Express app is null or undefined');
-      return res.status(500).json({ 
-        message: 'Express app initialization failed',
-        error: 'App instance is null'
+      console.error('❌ Express app instance is null');
+      return res.status(500).json({
+        success: false,
+        message: 'Server initialization failed',
+        error: 'Express app instance is null'
       });
     }
     
-    console.log(`✅ Express app initialized, processing ${req.method} ${req.url}`);
-    
-    // Convert Vercel request/response to Express format
+    // Convert Vercel request/response to Express format and handle the request
     app(req, res);
+    
+    // Log completion time
+    const duration = Date.now() - startTime;
+    console.log(`✅ Request ${req.method} ${req.url} completed in ${duration}ms`);
+    
   } catch (error) {
-    console.error('❌ Handler error:', error);
+    const duration = Date.now() - startTime;
+    console.error(`❌ Handler error for ${req.method} ${req.url} after ${duration}ms:`, error);
     console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
     
-    res.status(500).json({ 
-      message: 'Internal server error',
-      error: error instanceof Error ? error.message : 'Unknown error',
-      timestamp: new Date().toISOString(),
-      requestId: req.headers['x-vercel-id'] || 'unknown'
-    });
+    // Ensure we don't send response twice
+    if (!res.headersSent) {
+      res.status(500).json({
+        success: false,
+        message: 'Internal server error',
+        error: error instanceof Error ? error.message : 'Unknown error',
+        timestamp: new Date().toISOString(),
+        requestId: req.headers['x-vercel-id'] || 'unknown'
+      });
+    }
   }
-} 
\ No newline at end of file
+}
+
+// Named export for compatibility
+export { handler }; 
\ No newline at end of file
diff --git a/client/src/lib/websocket.ts b/client/src/lib/websocket.ts
index e318101..9bd1715 100644
--- a/client/src/lib/websocket.ts
+++ b/client/src/lib/websocket.ts
@@ -13,10 +13,8 @@ class WebSocketService {
   }
 
   private checkWebSocketAvailability(): boolean {
-    // Check if we're in development mode
-    const isDevelopment = window.location.hostname === 'localhost' || 
-                         window.location.hostname === '127.0.0.1' ||
-                         window.location.hostname.includes('localhost');
+    // Check if we're in development mode using Vite's environment variables
+    const isDevelopment = import.meta.env.DEV;
     
     // Check if WebSocket is available (not on serverless)
     const hasWebSocketSupport = typeof WebSocket !== 'undefined';
@@ -24,6 +22,7 @@ class WebSocketService {
     // Log the decision for debugging
     console.log('WebSocket availability check:', {
       isDevelopment,
+      mode: import.meta.env.MODE,
       hasWebSocketSupport,
       hostname: window.location.hostname,
       enabled: isDevelopment && hasWebSocketSupport
diff --git a/package-lock.json b/package-lock.json
index a036193..5266e85 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -69,6 +69,8 @@
         "nodemailer": "^7.0.2",
         "passport": "^0.7.0",
         "passport-local": "^1.0.0",
+        "pino": "^9.7.0",
+        "pino-http": "^10.5.0",
         "postgres": "^3.4.5",
         "react": "^18.3.1",
         "react-day-picker": "^8.10.1",
@@ -119,8 +121,11 @@
         "dotenv": "^16.4.5",
         "drizzle-kit": "^0.20.14",
         "esbuild": "^0.25.4",
+        "eslint": "^9.28.0",
+        "eslint-plugin-import": "^2.31.0",
         "jsdom": "^24.0.0",
         "msw": "^2.2.1",
+        "pino-pretty": "^13.0.0",
         "postcss": "^8.4.47",
         "sqlite3": "^5.1.7",
         "supertest": "^6.3.4",
@@ -1576,6 +1581,245 @@
         "node": ">=18"
       }
     },
+    "node_modules/@eslint-community/eslint-utils": {
+      "version": "4.7.0",
+      "resolved": "https://registry.npmjs.org/@eslint-community/eslint-utils/-/eslint-utils-4.7.0.tgz",
+      "integrity": "sha512-dyybb3AcajC7uha6CvhdVRJqaKyn7w2YKqKyAN37NKYgZT36w+iRb0Dymmc5qEJ549c/S31cMMSFd75bteCpCw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "eslint-visitor-keys": "^3.4.3"
+      },
+      "engines": {
+        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/eslint"
+      },
+      "peerDependencies": {
+        "eslint": "^6.0.0 || ^7.0.0 || >=8.0.0"
+      }
+    },
+    "node_modules/@eslint-community/eslint-utils/node_modules/eslint-visitor-keys": {
+      "version": "3.4.3",
+      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-3.4.3.tgz",
+      "integrity": "sha512-wpc+LXeiyiisxPlEkUzU6svyS1frIO3Mgxj1fdy7Pm8Ygzguax2N3Fa/D/ag1WqbOprdI+uY6wMUl8/a2G+iag==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/eslint"
+      }
+    },
+    "node_modules/@eslint-community/regexpp": {
+      "version": "4.12.1",
+      "resolved": "https://registry.npmjs.org/@eslint-community/regexpp/-/regexpp-4.12.1.tgz",
+      "integrity": "sha512-CCZCDJuduB9OUkFkY2IgppNZMi2lBQgD2qzwXkEia16cge2pijY/aXi96CJMquDMn3nJdlPV1A5KrJEXwfLNzQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": "^12.0.0 || ^14.0.0 || >=16.0.0"
+      }
+    },
+    "node_modules/@eslint/config-array": {
+      "version": "0.20.0",
+      "resolved": "https://registry.npmjs.org/@eslint/config-array/-/config-array-0.20.0.tgz",
+      "integrity": "sha512-fxlS1kkIjx8+vy2SjuCB94q3htSNrufYTXubwiBFeaQHbH6Ipi43gFJq2zCMt6PHhImH3Xmr0NksKDvchWlpQQ==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "dependencies": {
+        "@eslint/object-schema": "^2.1.6",
+        "debug": "^4.3.1",
+        "minimatch": "^3.1.2"
+      },
+      "engines": {
+        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
+      }
+    },
+    "node_modules/@eslint/config-array/node_modules/brace-expansion": {
+      "version": "1.1.11",
+      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.11.tgz",
+      "integrity": "sha512-iCuPHDFgrHX7H2vEI/5xpz07zSHB00TpugqhmYtVmMO6518mCuRMoOYFldEBl0g187ufozdaHgWKcYFb61qGiA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "balanced-match": "^1.0.0",
+        "concat-map": "0.0.1"
+      }
+    },
+    "node_modules/@eslint/config-array/node_modules/minimatch": {
+      "version": "3.1.2",
+      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
+      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
+      "dev": true,
+      "license": "ISC",
+      "dependencies": {
+        "brace-expansion": "^1.1.7"
+      },
+      "engines": {
+        "node": "*"
+      }
+    },
+    "node_modules/@eslint/config-helpers": {
+      "version": "0.2.2",
+      "resolved": "https://registry.npmjs.org/@eslint/config-helpers/-/config-helpers-0.2.2.tgz",
+      "integrity": "sha512-+GPzk8PlG0sPpzdU5ZvIRMPidzAnZDl/s9L+y13iodqvb8leL53bTannOrQ/Im7UkpsmFU5Ily5U60LWixnmLg==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
+      }
+    },
+    "node_modules/@eslint/core": {
+      "version": "0.14.0",
+      "resolved": "https://registry.npmjs.org/@eslint/core/-/core-0.14.0.tgz",
+      "integrity": "sha512-qIbV0/JZr7iSDjqAc60IqbLdsj9GDt16xQtWD+B78d/HAlvysGdZZ6rpJHGAc2T0FQx1X6thsSPdnoiGKdNtdg==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "dependencies": {
+        "@types/json-schema": "^7.0.15"
+      },
+      "engines": {
+        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
+      }
+    },
+    "node_modules/@eslint/eslintrc": {
+      "version": "3.3.1",
+      "resolved": "https://registry.npmjs.org/@eslint/eslintrc/-/eslintrc-3.3.1.tgz",
+      "integrity": "sha512-gtF186CXhIl1p4pJNGZw8Yc6RlshoePRvE0X91oPGb3vZ8pM3qOS9W9NGPat9LziaBV7XrJWGylNQXkGcnM3IQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ajv": "^6.12.4",
+        "debug": "^4.3.2",
+        "espree": "^10.0.1",
+        "globals": "^14.0.0",
+        "ignore": "^5.2.0",
+        "import-fresh": "^3.2.1",
+        "js-yaml": "^4.1.0",
+        "minimatch": "^3.1.2",
+        "strip-json-comments": "^3.1.1"
+      },
+      "engines": {
+        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/eslint"
+      }
+    },
+    "node_modules/@eslint/eslintrc/node_modules/ajv": {
+      "version": "6.12.6",
+      "resolved": "https://registry.npmjs.org/ajv/-/ajv-6.12.6.tgz",
+      "integrity": "sha512-j3fVLgvTo527anyYyJOGTYJbG+vnnQYvE0m5mmkc1TK+nxAppkCLMIL0aZ4dblVCNoGShhm+kzE4ZUykBoMg4g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "fast-deep-equal": "^3.1.1",
+        "fast-json-stable-stringify": "^2.0.0",
+        "json-schema-traverse": "^0.4.1",
+        "uri-js": "^4.2.2"
+      },
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/epoberezkin"
+      }
+    },
+    "node_modules/@eslint/eslintrc/node_modules/brace-expansion": {
+      "version": "1.1.11",
+      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.11.tgz",
+      "integrity": "sha512-iCuPHDFgrHX7H2vEI/5xpz07zSHB00TpugqhmYtVmMO6518mCuRMoOYFldEBl0g187ufozdaHgWKcYFb61qGiA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "balanced-match": "^1.0.0",
+        "concat-map": "0.0.1"
+      }
+    },
+    "node_modules/@eslint/eslintrc/node_modules/globals": {
+      "version": "14.0.0",
+      "resolved": "https://registry.npmjs.org/globals/-/globals-14.0.0.tgz",
+      "integrity": "sha512-oahGvuMGQlPw/ivIYBjVSrWAfWLBeku5tpPE2fOPLi+WHffIWbuh2tCjhyQhTBPMf5E9jDEH4FOmTYgYwbKwtQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/@eslint/eslintrc/node_modules/json-schema-traverse": {
+      "version": "0.4.1",
+      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-0.4.1.tgz",
+      "integrity": "sha512-xbbCH5dCYU5T8LcEhhuh7HJ88HXuW3qsI3Y0zOZFKfZEHcpWiHU/Jxzk629Brsab/mMiHQti9wMP+845RPe3Vg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@eslint/eslintrc/node_modules/minimatch": {
+      "version": "3.1.2",
+      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
+      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
+      "dev": true,
+      "license": "ISC",
+      "dependencies": {
+        "brace-expansion": "^1.1.7"
+      },
+      "engines": {
+        "node": "*"
+      }
+    },
+    "node_modules/@eslint/eslintrc/node_modules/strip-json-comments": {
+      "version": "3.1.1",
+      "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-3.1.1.tgz",
+      "integrity": "sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=8"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/@eslint/js": {
+      "version": "9.28.0",
+      "resolved": "https://registry.npmjs.org/@eslint/js/-/js-9.28.0.tgz",
+      "integrity": "sha512-fnqSjGWd/CoIp4EXIxWVK/sHA6DOHN4+8Ix2cX5ycOY7LG0UY8nHCU5pIp2eaE1Mc7Qd8kHspYNzYXT2ojPLzg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
+      },
+      "funding": {
+        "url": "https://eslint.org/donate"
+      }
+    },
+    "node_modules/@eslint/object-schema": {
+      "version": "2.1.6",
+      "resolved": "https://registry.npmjs.org/@eslint/object-schema/-/object-schema-2.1.6.tgz",
+      "integrity": "sha512-RBMg5FRL0I0gs51M/guSAj5/e14VQ4tpZnQNWwuDT66P14I43ItmPfIZRhO9fUVIPOAQXU47atlywZ/czoqFPA==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
+      }
+    },
+    "node_modules/@eslint/plugin-kit": {
+      "version": "0.3.1",
+      "resolved": "https://registry.npmjs.org/@eslint/plugin-kit/-/plugin-kit-0.3.1.tgz",
+      "integrity": "sha512-0J+zgWxHN+xXONWIyPWKFMgVuJoZuGiIFu8yxk7RJjxkzpGmyja5wRFqZIVtjDVOQpV+Rw0iOAjYPE2eQyjr0w==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "dependencies": {
+        "@eslint/core": "^0.14.0",
+        "levn": "^0.4.1"
+      },
+      "engines": {
+        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
+      }
+    },
     "node_modules/@faker-js/faker": {
       "version": "8.4.1",
       "resolved": "https://registry.npmjs.org/@faker-js/faker/-/faker-8.4.1.tgz",
@@ -1682,6 +1926,72 @@
         "react-hook-form": "^7.0.0"
       }
     },
+    "node_modules/@humanfs/core": {
+      "version": "0.19.1",
+      "resolved": "https://registry.npmjs.org/@humanfs/core/-/core-0.19.1.tgz",
+      "integrity": "sha512-5DyQ4+1JEUzejeK1JGICcideyfUbGixgS9jNgex5nqkW+cY7WZhxBigmieN5Qnw9ZosSNVC9KQKyb+GUaGyKUA==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": ">=18.18.0"
+      }
+    },
+    "node_modules/@humanfs/node": {
+      "version": "0.16.6",
+      "resolved": "https://registry.npmjs.org/@humanfs/node/-/node-0.16.6.tgz",
+      "integrity": "sha512-YuI2ZHQL78Q5HbhDiBA1X4LmYdXCKCMQIfw0pw7piHJwyREFebJUvrQN4cMssyES6x+vfUbx1CIpaQUKYdQZOw==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "dependencies": {
+        "@humanfs/core": "^0.19.1",
+        "@humanwhocodes/retry": "^0.3.0"
+      },
+      "engines": {
+        "node": ">=18.18.0"
+      }
+    },
+    "node_modules/@humanfs/node/node_modules/@humanwhocodes/retry": {
+      "version": "0.3.1",
+      "resolved": "https://registry.npmjs.org/@humanwhocodes/retry/-/retry-0.3.1.tgz",
+      "integrity": "sha512-JBxkERygn7Bv/GbN5Rv8Ul6LVknS+5Bp6RgDC/O8gEBU/yeH5Ui5C/OlWrTb6qct7LjjfT6Re2NxB0ln0yYybA==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": ">=18.18"
+      },
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/nzakas"
+      }
+    },
+    "node_modules/@humanwhocodes/module-importer": {
+      "version": "1.0.1",
+      "resolved": "https://registry.npmjs.org/@humanwhocodes/module-importer/-/module-importer-1.0.1.tgz",
+      "integrity": "sha512-bxveV4V8v5Yb4ncFTT3rPSgZBOpCkjfK0y4oVVVJwIuDVBRMDXrPyXRL988i5ap9m9bnyEEjWfm5WkBmtffLfA==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": ">=12.22"
+      },
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/nzakas"
+      }
+    },
+    "node_modules/@humanwhocodes/retry": {
+      "version": "0.4.3",
+      "resolved": "https://registry.npmjs.org/@humanwhocodes/retry/-/retry-0.4.3.tgz",
+      "integrity": "sha512-bV0Tgo9K4hfPCek+aMAn81RppFKv2ySDQeMoSZuvTASywNTnVJCArCZE2FWqpvIatKu7VMRLWlR1EazvVhDyhQ==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": ">=18.18"
+      },
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/nzakas"
+      }
+    },
     "node_modules/@inquirer/confirm": {
       "version": "5.1.12",
       "resolved": "https://registry.npmjs.org/@inquirer/confirm/-/confirm-5.1.12.tgz",
@@ -3832,6 +4142,13 @@
         "win32"
       ]
     },
+    "node_modules/@rtsao/scc": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/@rtsao/scc/-/scc-1.1.0.tgz",
+      "integrity": "sha512-zt6OdqaDoOnJ1ZYsCYGt9YmWzDXl4vQdKTyJev62gFhRGKdx7mcT54V9KIjg+d2wi9EXsPvAPKe7i7WjfVWB8g==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/@sinclair/typebox": {
       "version": "0.33.22",
       "resolved": "https://registry.npmjs.org/@sinclair/typebox/-/typebox-0.33.22.tgz",
@@ -4441,6 +4758,13 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/@types/json5": {
+      "version": "0.0.29",
+      "resolved": "https://registry.npmjs.org/@types/json5/-/json5-0.0.29.tgz",
+      "integrity": "sha512-dRLjCWHYg4oaA77cxO64oO+7JwCwnIzkZPdrrC71jQmQtlhM556pwKo5bUzqvZndkVbeFLIIi+9TC40JNF5hNQ==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/@types/methods": {
       "version": "1.1.4",
       "resolved": "https://registry.npmjs.org/@types/methods/-/methods-1.1.4.tgz",
@@ -5291,6 +5615,16 @@
         "acorn": "^8"
       }
     },
+    "node_modules/acorn-jsx": {
+      "version": "5.3.2",
+      "resolved": "https://registry.npmjs.org/acorn-jsx/-/acorn-jsx-5.3.2.tgz",
+      "integrity": "sha512-rq9s+JNhf0IChjtDXxllJ7g41oZk5SlXtp0LHwyA5cejwn7vKmKp4pPri6YEePv2PU65sAsegbXtIinmDFDXgQ==",
+      "dev": true,
+      "license": "MIT",
+      "peerDependencies": {
+        "acorn": "^6.0.0 || ^7.0.0 || ^8.0.0"
+      }
+    },
     "node_modules/acorn-walk": {
       "version": "8.3.4",
       "resolved": "https://registry.npmjs.org/acorn-walk/-/acorn-walk-8.3.4.tgz",
@@ -5460,6 +5794,13 @@
       "integrity": "sha512-PYjyFOLKQ9y57JvQ6QLo8dAgNqswh8M1RMJYdQduT6xbWSgK36P/Z/v+p888pM69jMMfS8Xd8F6I1kQ/I9HUGg==",
       "license": "MIT"
     },
+    "node_modules/argparse": {
+      "version": "2.0.1",
+      "resolved": "https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz",
+      "integrity": "sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q==",
+      "dev": true,
+      "license": "Python-2.0"
+    },
     "node_modules/aria-hidden": {
       "version": "1.2.6",
       "resolved": "https://registry.npmjs.org/aria-hidden/-/aria-hidden-1.2.6.tgz",
@@ -5505,35 +5846,150 @@
       "integrity": "sha512-PCVAQswWemu6UdxsDFFX/+gVeYqKAod3D3UVm91jHwynguOwAvYPhx8nNlM++NqRcK6CxxpUafjmhIdKiHibqg==",
       "license": "MIT"
     },
-    "node_modules/asap": {
-      "version": "2.0.6",
-      "resolved": "https://registry.npmjs.org/asap/-/asap-2.0.6.tgz",
-      "integrity": "sha512-BSHWgDSAiKs50o2Re8ppvp3seVHXSRM44cdSsT9FfNEUUZLOGWVCsiWaRPWM1Znn+mqZ1OfVZ3z3DWEzSp7hRA==",
+    "node_modules/array-includes": {
+      "version": "3.1.9",
+      "resolved": "https://registry.npmjs.org/array-includes/-/array-includes-3.1.9.tgz",
+      "integrity": "sha512-FmeCCAenzH0KH381SPT5FZmiA/TmpndpcaShhfgEN9eCVjnFBqq3l1xrI42y8+PPLI6hypzou4GXw00WHmPBLQ==",
       "dev": true,
-      "license": "MIT"
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.8",
+        "call-bound": "^1.0.4",
+        "define-properties": "^1.2.1",
+        "es-abstract": "^1.24.0",
+        "es-object-atoms": "^1.1.1",
+        "get-intrinsic": "^1.3.0",
+        "is-string": "^1.1.1",
+        "math-intrinsics": "^1.1.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
     },
-    "node_modules/assertion-error": {
-      "version": "2.0.1",
-      "resolved": "https://registry.npmjs.org/assertion-error/-/assertion-error-2.0.1.tgz",
-      "integrity": "sha512-Izi8RQcffqCeNVgFigKli1ssklIbpHnCYc6AknXGYoB6grJqyeby7jv12JUQgmTAnIDnbck1uxksT4dzN3PWBA==",
+    "node_modules/array.prototype.findlastindex": {
+      "version": "1.2.6",
+      "resolved": "https://registry.npmjs.org/array.prototype.findlastindex/-/array.prototype.findlastindex-1.2.6.tgz",
+      "integrity": "sha512-F/TKATkzseUExPlfvmwQKGITM3DGTK+vkAsCZoDc5daVygbJBnjEUCbgkAvVFsgfXfX4YIqZ/27G3k3tdXrTxQ==",
       "dev": true,
       "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.8",
+        "call-bound": "^1.0.4",
+        "define-properties": "^1.2.1",
+        "es-abstract": "^1.23.9",
+        "es-errors": "^1.3.0",
+        "es-object-atoms": "^1.1.1",
+        "es-shim-unscopables": "^1.1.0"
+      },
       "engines": {
-        "node": ">=12"
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
       }
     },
-    "node_modules/async-listen": {
-      "version": "3.0.0",
-      "resolved": "https://registry.npmjs.org/async-listen/-/async-listen-3.0.0.tgz",
-      "integrity": "sha512-V+SsTpDqkrWTimiotsyl33ePSjA5/KrithwupuvJ6ztsqPvGv6ge4OredFhPffVXiLN/QUWvE0XcqJaYgt6fOg==",
+    "node_modules/array.prototype.flat": {
+      "version": "1.3.3",
+      "resolved": "https://registry.npmjs.org/array.prototype.flat/-/array.prototype.flat-1.3.3.tgz",
+      "integrity": "sha512-rwG/ja1neyLqCuGZ5YYrznA62D4mZXg0i1cIskIUKSiqF3Cje9/wXAls9B9s1Wa2fomMsIv8czB8jZcPmxCXFg==",
       "dev": true,
       "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.8",
+        "define-properties": "^1.2.1",
+        "es-abstract": "^1.23.5",
+        "es-shim-unscopables": "^1.0.2"
+      },
       "engines": {
-        "node": ">= 14"
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
       }
     },
-    "node_modules/async-sema": {
-      "version": "3.1.1",
+    "node_modules/array.prototype.flatmap": {
+      "version": "1.3.3",
+      "resolved": "https://registry.npmjs.org/array.prototype.flatmap/-/array.prototype.flatmap-1.3.3.tgz",
+      "integrity": "sha512-Y7Wt51eKJSyi80hFrJCePGGNo5ktJCslFuboqJsbf57CCPcm5zztluPlc4/aD8sWsKvlwatezpV4U1efk8kpjg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.8",
+        "define-properties": "^1.2.1",
+        "es-abstract": "^1.23.5",
+        "es-shim-unscopables": "^1.0.2"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
+    "node_modules/arraybuffer.prototype.slice": {
+      "version": "1.0.4",
+      "resolved": "https://registry.npmjs.org/arraybuffer.prototype.slice/-/arraybuffer.prototype.slice-1.0.4.tgz",
+      "integrity": "sha512-BNoCY6SXXPQ7gF2opIP4GBE+Xw7U+pHMYKuzjgCN3GwiaIR09UUeKfheyIry77QtrCBlC0KK0q5/TER/tYh3PQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "array-buffer-byte-length": "^1.0.1",
+        "call-bind": "^1.0.8",
+        "define-properties": "^1.2.1",
+        "es-abstract": "^1.23.5",
+        "es-errors": "^1.3.0",
+        "get-intrinsic": "^1.2.6",
+        "is-array-buffer": "^3.0.4"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
+    "node_modules/asap": {
+      "version": "2.0.6",
+      "resolved": "https://registry.npmjs.org/asap/-/asap-2.0.6.tgz",
+      "integrity": "sha512-BSHWgDSAiKs50o2Re8ppvp3seVHXSRM44cdSsT9FfNEUUZLOGWVCsiWaRPWM1Znn+mqZ1OfVZ3z3DWEzSp7hRA==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/assertion-error": {
+      "version": "2.0.1",
+      "resolved": "https://registry.npmjs.org/assertion-error/-/assertion-error-2.0.1.tgz",
+      "integrity": "sha512-Izi8RQcffqCeNVgFigKli1ssklIbpHnCYc6AknXGYoB6grJqyeby7jv12JUQgmTAnIDnbck1uxksT4dzN3PWBA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      }
+    },
+    "node_modules/async-function": {
+      "version": "1.0.0",
+      "resolved": "https://registry.npmjs.org/async-function/-/async-function-1.0.0.tgz",
+      "integrity": "sha512-hsU18Ae8CDTR6Kgu9DYf0EbCr/a5iGL0rytQDobUcdpYOKokk8LEjVphnXkDkgpi0wYVsqrXuP0bZxJaTqdgoA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 0.4"
+      }
+    },
+    "node_modules/async-listen": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/async-listen/-/async-listen-3.0.0.tgz",
+      "integrity": "sha512-V+SsTpDqkrWTimiotsyl33ePSjA5/KrithwupuvJ6ztsqPvGv6ge4OredFhPffVXiLN/QUWvE0XcqJaYgt6fOg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 14"
+      }
+    },
+    "node_modules/async-sema": {
+      "version": "3.1.1",
       "resolved": "https://registry.npmjs.org/async-sema/-/async-sema-3.1.1.tgz",
       "integrity": "sha512-tLRNUXati5MFePdAk8dw7Qt7DpxPB60ofAgn8WRhW6a2rcimZnYBP9oxHiv0OHy+Wz7kPMG+t4LGdt31+4EmGg==",
       "dev": true,
@@ -5545,6 +6001,15 @@
       "integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q==",
       "license": "MIT"
     },
+    "node_modules/atomic-sleep": {
+      "version": "1.0.0",
+      "resolved": "https://registry.npmjs.org/atomic-sleep/-/atomic-sleep-1.0.0.tgz",
+      "integrity": "sha512-kNOjDqAh7px0XWNI+4QbzoiR/nTkHAWNud2uvnJquD1/x5a7EQZMJT0AczqK0Qn67oY/TTQ1LbUKajZpp3I9tQ==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=8.0.0"
+      }
+    },
     "node_modules/autoprefixer": {
       "version": "10.4.21",
       "resolved": "https://registry.npmjs.org/autoprefixer/-/autoprefixer-10.4.21.tgz",
@@ -6033,6 +6498,16 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/callsites": {
+      "version": "3.1.0",
+      "resolved": "https://registry.npmjs.org/callsites/-/callsites-3.1.0.tgz",
+      "integrity": "sha512-P8BjAsXvZS+VIDUI11hHCQEv74YT67YUi5JJFNWIqL235sBmjX4+qx9Muvls5ivyNENctx46xQLQ3aTuE7ssaQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=6"
+      }
+    },
     "node_modules/camelcase": {
       "version": "7.0.1",
       "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-7.0.1.tgz",
@@ -6320,6 +6795,13 @@
         "color-support": "bin.js"
       }
     },
+    "node_modules/colorette": {
+      "version": "2.0.20",
+      "resolved": "https://registry.npmjs.org/colorette/-/colorette-2.0.20.tgz",
+      "integrity": "sha512-IfEDxwoWIjkeXL1eXcDiow4UbKjhLdq6/EuSVR9GMN7KVH3r9gQ83e73hsz1Nd1T3ijd5xv1wcWRYO+D6kCI2w==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/colorjs.io": {
       "version": "0.5.2",
       "resolved": "https://registry.npmjs.org/colorjs.io/-/colorjs.io-0.5.2.tgz",
@@ -6855,6 +7337,60 @@
         "node": ">=18"
       }
     },
+    "node_modules/data-view-buffer": {
+      "version": "1.0.2",
+      "resolved": "https://registry.npmjs.org/data-view-buffer/-/data-view-buffer-1.0.2.tgz",
+      "integrity": "sha512-EmKO5V3OLXh1rtK2wgXRansaK1/mtVdTUEiEI0W8RkvgT05kfxaH29PliLnpLP73yYO6142Q72QNa8Wx/A5CqQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bound": "^1.0.3",
+        "es-errors": "^1.3.0",
+        "is-data-view": "^1.0.2"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
+    "node_modules/data-view-byte-length": {
+      "version": "1.0.2",
+      "resolved": "https://registry.npmjs.org/data-view-byte-length/-/data-view-byte-length-1.0.2.tgz",
+      "integrity": "sha512-tuhGbE6CfTM9+5ANGf+oQb72Ky/0+s3xKUpHvShfiz2RxMFgFPjsXuRLBVMtvMs15awe45SRb83D6wH4ew6wlQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bound": "^1.0.3",
+        "es-errors": "^1.3.0",
+        "is-data-view": "^1.0.2"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/inspect-js"
+      }
+    },
+    "node_modules/data-view-byte-offset": {
+      "version": "1.0.1",
+      "resolved": "https://registry.npmjs.org/data-view-byte-offset/-/data-view-byte-offset-1.0.1.tgz",
+      "integrity": "sha512-BS8PfmtDGnrgYdOonGZQdLZslWIeCGFP9tpan0hi1Co2Zr2NKADsvGYA8XxuG/4UWgJ6Cjtv+YJnB6MM69QGlQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bound": "^1.0.2",
+        "es-errors": "^1.3.0",
+        "is-data-view": "^1.0.1"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/date-fns": {
       "version": "3.6.0",
       "resolved": "https://registry.npmjs.org/date-fns/-/date-fns-3.6.0.tgz",
@@ -6865,6 +7401,16 @@
         "url": "https://github.com/sponsors/kossnocorp"
       }
     },
+    "node_modules/dateformat": {
+      "version": "4.6.3",
+      "resolved": "https://registry.npmjs.org/dateformat/-/dateformat-4.6.3.tgz",
+      "integrity": "sha512-2P0p0pFGzHS5EMnhdxQi7aJN+iMheud0UhG4dlE1DLAlvL8JHjJJTX/CSm4JXwV0Ka5nGk3zC5mcb5bUQUxxMA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": "*"
+      }
+    },
     "node_modules/debug": {
       "version": "4.4.1",
       "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.1.tgz",
@@ -6978,6 +7524,13 @@
         "node": ">=4.0.0"
       }
     },
+    "node_modules/deep-is": {
+      "version": "0.1.4",
+      "resolved": "https://registry.npmjs.org/deep-is/-/deep-is-0.1.4.tgz",
+      "integrity": "sha512-oIPzksmTg4/MriiaYGO+okXDT7ztn/w3Eptv/+gSIdMdKsJo0u4CfYNFJPy+4SKMuCqGw2wxnA+URMg3t8a/bQ==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/define-data-property": {
       "version": "1.1.4",
       "resolved": "https://registry.npmjs.org/define-data-property/-/define-data-property-1.1.4.tgz",
@@ -7118,6 +7671,19 @@
       "integrity": "sha512-+HlytyjlPKnIG8XuRG8WvmBP8xs8P71y+SKKS6ZXWoEgLuePxtDoUEiH7WkdePWrQ5JBpE6aoVqfZfJUQkjXwA==",
       "license": "MIT"
     },
+    "node_modules/doctrine": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/doctrine/-/doctrine-2.1.0.tgz",
+      "integrity": "sha512-35mSku4ZXK0vfCuHEDAwt55dg2jNajHZ1odvF+8SSr82EsZY4QmXfuWso8oEd8zRhVObSN18aM0CjSdoBX7zIw==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "dependencies": {
+        "esutils": "^2.0.2"
+      },
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
     "node_modules/dom-accessibility-api": {
       "version": "0.5.16",
       "resolved": "https://registry.npmjs.org/dom-accessibility-api/-/dom-accessibility-api-0.5.16.tgz",
@@ -7962,6 +8528,75 @@
       "license": "MIT",
       "optional": true
     },
+    "node_modules/es-abstract": {
+      "version": "1.24.0",
+      "resolved": "https://registry.npmjs.org/es-abstract/-/es-abstract-1.24.0.tgz",
+      "integrity": "sha512-WSzPgsdLtTcQwm4CROfS5ju2Wa1QQcVeT37jFjYzdFz1r9ahadC8B8/a4qxJxM+09F18iumCdRmlr96ZYkQvEg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "array-buffer-byte-length": "^1.0.2",
+        "arraybuffer.prototype.slice": "^1.0.4",
+        "available-typed-arrays": "^1.0.7",
+        "call-bind": "^1.0.8",
+        "call-bound": "^1.0.4",
+        "data-view-buffer": "^1.0.2",
+        "data-view-byte-length": "^1.0.2",
+        "data-view-byte-offset": "^1.0.1",
+        "es-define-property": "^1.0.1",
+        "es-errors": "^1.3.0",
+        "es-object-atoms": "^1.1.1",
+        "es-set-tostringtag": "^2.1.0",
+        "es-to-primitive": "^1.3.0",
+        "function.prototype.name": "^1.1.8",
+        "get-intrinsic": "^1.3.0",
+        "get-proto": "^1.0.1",
+        "get-symbol-description": "^1.1.0",
+        "globalthis": "^1.0.4",
+        "gopd": "^1.2.0",
+        "has-property-descriptors": "^1.0.2",
+        "has-proto": "^1.2.0",
+        "has-symbols": "^1.1.0",
+        "hasown": "^2.0.2",
+        "internal-slot": "^1.1.0",
+        "is-array-buffer": "^3.0.5",
+        "is-callable": "^1.2.7",
+        "is-data-view": "^1.0.2",
+        "is-negative-zero": "^2.0.3",
+        "is-regex": "^1.2.1",
+        "is-set": "^2.0.3",
+        "is-shared-array-buffer": "^1.0.4",
+        "is-string": "^1.1.1",
+        "is-typed-array": "^1.1.15",
+        "is-weakref": "^1.1.1",
+        "math-intrinsics": "^1.1.0",
+        "object-inspect": "^1.13.4",
+        "object-keys": "^1.1.1",
+        "object.assign": "^4.1.7",
+        "own-keys": "^1.0.1",
+        "regexp.prototype.flags": "^1.5.4",
+        "safe-array-concat": "^1.1.3",
+        "safe-push-apply": "^1.0.0",
+        "safe-regex-test": "^1.1.0",
+        "set-proto": "^1.0.0",
+        "stop-iteration-iterator": "^1.1.0",
+        "string.prototype.trim": "^1.2.10",
+        "string.prototype.trimend": "^1.0.9",
+        "string.prototype.trimstart": "^1.0.8",
+        "typed-array-buffer": "^1.0.3",
+        "typed-array-byte-length": "^1.0.3",
+        "typed-array-byte-offset": "^1.0.4",
+        "typed-array-length": "^1.0.7",
+        "unbox-primitive": "^1.1.0",
+        "which-typed-array": "^1.1.19"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/es-define-property": {
       "version": "1.0.1",
       "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
@@ -8035,6 +8670,37 @@
         "node": ">= 0.4"
       }
     },
+    "node_modules/es-shim-unscopables": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/es-shim-unscopables/-/es-shim-unscopables-1.1.0.tgz",
+      "integrity": "sha512-d9T8ucsEhh8Bi1woXCf+TIKDIROLG5WCkxg8geBCbvk22kzwC5G2OnXVMO6FUsvQlgUUXQ2itephWDLqDzbeCw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "hasown": "^2.0.2"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      }
+    },
+    "node_modules/es-to-primitive": {
+      "version": "1.3.0",
+      "resolved": "https://registry.npmjs.org/es-to-primitive/-/es-to-primitive-1.3.0.tgz",
+      "integrity": "sha512-w+5mJ3GuFL+NjVtJlvydShqE1eN3h3PbI7/5LAsYJP/2qtuMXjfL2LpHSRqo4b4eSF5K/DH1JXKUAHSB2UW50g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "is-callable": "^1.2.7",
+        "is-date-object": "^1.0.5",
+        "is-symbol": "^1.0.4"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/es5-ext": {
       "version": "0.10.64",
       "resolved": "https://registry.npmjs.org/es5-ext/-/es5-ext-0.10.64.tgz",
@@ -8501,55 +9167,389 @@
       "integrity": "sha512-NiSupZ4OeuGwr68lGIeym/ksIZMJodUGOSCZ/FSnTxcrekbvqrgdUxlJOMpijaKZVjAJrWrGs/6Jy8OMuyj9ow==",
       "license": "MIT"
     },
-    "node_modules/esniff": {
-      "version": "2.0.1",
-      "resolved": "https://registry.npmjs.org/esniff/-/esniff-2.0.1.tgz",
-      "integrity": "sha512-kTUIGKQ/mDPFoJ0oVfcmyJn4iBDRptjNVIzwIFR7tqWXdVI9xfA2RMwY/gbSpJG3lkdWNEjLap/NqVHZiJsdfg==",
+    "node_modules/escape-string-regexp": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz",
+      "integrity": "sha512-TtpcNJ3XAzx3Gq8sWRzJaVajRs0uVxA2YAkdb1jm2YkPz4G6egUFAyA3n5vtEIZefPk5Wa4UXbKuS5fKkJWdgA==",
       "dev": true,
-      "license": "ISC",
-      "dependencies": {
-        "d": "^1.0.1",
-        "es5-ext": "^0.10.62",
-        "event-emitter": "^0.3.5",
-        "type": "^2.7.2"
+      "license": "MIT",
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/eslint": {
+      "version": "9.28.0",
+      "resolved": "https://registry.npmjs.org/eslint/-/eslint-9.28.0.tgz",
+      "integrity": "sha512-ocgh41VhRlf9+fVpe7QKzwLj9c92fDiqOj8Y3Sd4/ZmVA4Btx4PlUYPq4pp9JDyupkf1upbEXecxL2mwNV7jPQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@eslint-community/eslint-utils": "^4.2.0",
+        "@eslint-community/regexpp": "^4.12.1",
+        "@eslint/config-array": "^0.20.0",
+        "@eslint/config-helpers": "^0.2.1",
+        "@eslint/core": "^0.14.0",
+        "@eslint/eslintrc": "^3.3.1",
+        "@eslint/js": "9.28.0",
+        "@eslint/plugin-kit": "^0.3.1",
+        "@humanfs/node": "^0.16.6",
+        "@humanwhocodes/module-importer": "^1.0.1",
+        "@humanwhocodes/retry": "^0.4.2",
+        "@types/estree": "^1.0.6",
+        "@types/json-schema": "^7.0.15",
+        "ajv": "^6.12.4",
+        "chalk": "^4.0.0",
+        "cross-spawn": "^7.0.6",
+        "debug": "^4.3.2",
+        "escape-string-regexp": "^4.0.0",
+        "eslint-scope": "^8.3.0",
+        "eslint-visitor-keys": "^4.2.0",
+        "espree": "^10.3.0",
+        "esquery": "^1.5.0",
+        "esutils": "^2.0.2",
+        "fast-deep-equal": "^3.1.3",
+        "file-entry-cache": "^8.0.0",
+        "find-up": "^5.0.0",
+        "glob-parent": "^6.0.2",
+        "ignore": "^5.2.0",
+        "imurmurhash": "^0.1.4",
+        "is-glob": "^4.0.0",
+        "json-stable-stringify-without-jsonify": "^1.0.1",
+        "lodash.merge": "^4.6.2",
+        "minimatch": "^3.1.2",
+        "natural-compare": "^1.4.0",
+        "optionator": "^0.9.3"
+      },
+      "bin": {
+        "eslint": "bin/eslint.js"
       },
       "engines": {
-        "node": ">=0.10"
+        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
+      },
+      "funding": {
+        "url": "https://eslint.org/donate"
+      },
+      "peerDependencies": {
+        "jiti": "*"
+      },
+      "peerDependenciesMeta": {
+        "jiti": {
+          "optional": true
+        }
       }
     },
-    "node_modules/estree-walker": {
-      "version": "3.0.3",
-      "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-3.0.3.tgz",
-      "integrity": "sha512-7RUKfXgSMMkzt6ZuXmqapOurLGPPfgj6l9uRZ7lRGolvk0y2yocc35LdcxKC5PQZdn2DMqioAQ2NoWcrTKmm6g==",
+    "node_modules/eslint-import-resolver-node": {
+      "version": "0.3.9",
+      "resolved": "https://registry.npmjs.org/eslint-import-resolver-node/-/eslint-import-resolver-node-0.3.9.tgz",
+      "integrity": "sha512-WFj2isz22JahUv+B788TlO3N6zL3nNJGU8CcZbPZvVEkBPaJdCV4vy5wyghty5ROFbCRnm132v8BScu5/1BQ8g==",
       "dev": true,
       "license": "MIT",
       "dependencies": {
-        "@types/estree": "^1.0.0"
+        "debug": "^3.2.7",
+        "is-core-module": "^2.13.0",
+        "resolve": "^1.22.4"
       }
     },
-    "node_modules/etag": {
-      "version": "1.8.1",
-      "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
-      "integrity": "sha512-aIL5Fx7mawVa300al2BnEE4iNvo1qETxLrPI/o05L7z6go7fCw1J6EQmbK4FmJ2AS7kgVF/KEZWufBfdClMcPg==",
+    "node_modules/eslint-import-resolver-node/node_modules/debug": {
+      "version": "3.2.7",
+      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
+      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ms": "^2.1.1"
+      }
+    },
+    "node_modules/eslint-module-utils": {
+      "version": "2.12.0",
+      "resolved": "https://registry.npmjs.org/eslint-module-utils/-/eslint-module-utils-2.12.0.tgz",
+      "integrity": "sha512-wALZ0HFoytlyh/1+4wuZ9FJCD/leWHQzzrxJ8+rebyReSLk7LApMyd3WJaLVoN+D5+WIdJyDK1c6JnE65V4Zyg==",
+      "dev": true,
       "license": "MIT",
+      "dependencies": {
+        "debug": "^3.2.7"
+      },
       "engines": {
-        "node": ">= 0.6"
+        "node": ">=4"
+      },
+      "peerDependenciesMeta": {
+        "eslint": {
+          "optional": true
+        }
       }
     },
-    "node_modules/event-emitter": {
-      "version": "0.3.5",
-      "resolved": "https://registry.npmjs.org/event-emitter/-/event-emitter-0.3.5.tgz",
-      "integrity": "sha512-D9rRn9y7kLPnJ+hMq7S/nhvoKwwvVJahBi2BPmx3bvbsEdK3W9ii8cBSGjP+72/LnM4n6fo3+dkCX5FeTQruXA==",
+    "node_modules/eslint-module-utils/node_modules/debug": {
+      "version": "3.2.7",
+      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
+      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
       "dev": true,
       "license": "MIT",
       "dependencies": {
-        "d": "1",
-        "es5-ext": "~0.10.14"
+        "ms": "^2.1.1"
       }
     },
-    "node_modules/eventemitter3": {
-      "version": "4.0.7",
-      "resolved": "https://registry.npmjs.org/eventemitter3/-/eventemitter3-4.0.7.tgz",
+    "node_modules/eslint-plugin-import": {
+      "version": "2.31.0",
+      "resolved": "https://registry.npmjs.org/eslint-plugin-import/-/eslint-plugin-import-2.31.0.tgz",
+      "integrity": "sha512-ixmkI62Rbc2/w8Vfxyh1jQRTdRTF52VxwRVHl/ykPAmqG+Nb7/kNn+byLP0LxPgI7zWA16Jt82SybJInmMia3A==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@rtsao/scc": "^1.1.0",
+        "array-includes": "^3.1.8",
+        "array.prototype.findlastindex": "^1.2.5",
+        "array.prototype.flat": "^1.3.2",
+        "array.prototype.flatmap": "^1.3.2",
+        "debug": "^3.2.7",
+        "doctrine": "^2.1.0",
+        "eslint-import-resolver-node": "^0.3.9",
+        "eslint-module-utils": "^2.12.0",
+        "hasown": "^2.0.2",
+        "is-core-module": "^2.15.1",
+        "is-glob": "^4.0.3",
+        "minimatch": "^3.1.2",
+        "object.fromentries": "^2.0.8",
+        "object.groupby": "^1.0.3",
+        "object.values": "^1.2.0",
+        "semver": "^6.3.1",
+        "string.prototype.trimend": "^1.0.8",
+        "tsconfig-paths": "^3.15.0"
+      },
+      "engines": {
+        "node": ">=4"
+      },
+      "peerDependencies": {
+        "eslint": "^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9"
+      }
+    },
+    "node_modules/eslint-plugin-import/node_modules/brace-expansion": {
+      "version": "1.1.11",
+      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.11.tgz",
+      "integrity": "sha512-iCuPHDFgrHX7H2vEI/5xpz07zSHB00TpugqhmYtVmMO6518mCuRMoOYFldEBl0g187ufozdaHgWKcYFb61qGiA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "balanced-match": "^1.0.0",
+        "concat-map": "0.0.1"
+      }
+    },
+    "node_modules/eslint-plugin-import/node_modules/debug": {
+      "version": "3.2.7",
+      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
+      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ms": "^2.1.1"
+      }
+    },
+    "node_modules/eslint-plugin-import/node_modules/minimatch": {
+      "version": "3.1.2",
+      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
+      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
+      "dev": true,
+      "license": "ISC",
+      "dependencies": {
+        "brace-expansion": "^1.1.7"
+      },
+      "engines": {
+        "node": "*"
+      }
+    },
+    "node_modules/eslint-scope": {
+      "version": "8.3.0",
+      "resolved": "https://registry.npmjs.org/eslint-scope/-/eslint-scope-8.3.0.tgz",
+      "integrity": "sha512-pUNxi75F8MJ/GdeKtVLSbYg4ZI34J6C0C7sbL4YOp2exGwen7ZsuBqKzUhXd0qMQ362yET3z+uPwKeg/0C2XCQ==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "dependencies": {
+        "esrecurse": "^4.3.0",
+        "estraverse": "^5.2.0"
+      },
+      "engines": {
+        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/eslint"
+      }
+    },
+    "node_modules/eslint-visitor-keys": {
+      "version": "4.2.0",
+      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-4.2.0.tgz",
+      "integrity": "sha512-UyLnSehNt62FFhSwjZlHmeokpRK59rcz29j+F1/aDgbkbRTk7wIc9XzdoasMUbRNKDM0qQt/+BJ4BrpFeABemw==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/eslint"
+      }
+    },
+    "node_modules/eslint/node_modules/ajv": {
+      "version": "6.12.6",
+      "resolved": "https://registry.npmjs.org/ajv/-/ajv-6.12.6.tgz",
+      "integrity": "sha512-j3fVLgvTo527anyYyJOGTYJbG+vnnQYvE0m5mmkc1TK+nxAppkCLMIL0aZ4dblVCNoGShhm+kzE4ZUykBoMg4g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "fast-deep-equal": "^3.1.1",
+        "fast-json-stable-stringify": "^2.0.0",
+        "json-schema-traverse": "^0.4.1",
+        "uri-js": "^4.2.2"
+      },
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/epoberezkin"
+      }
+    },
+    "node_modules/eslint/node_modules/brace-expansion": {
+      "version": "1.1.11",
+      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.11.tgz",
+      "integrity": "sha512-iCuPHDFgrHX7H2vEI/5xpz07zSHB00TpugqhmYtVmMO6518mCuRMoOYFldEBl0g187ufozdaHgWKcYFb61qGiA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "balanced-match": "^1.0.0",
+        "concat-map": "0.0.1"
+      }
+    },
+    "node_modules/eslint/node_modules/json-schema-traverse": {
+      "version": "0.4.1",
+      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-0.4.1.tgz",
+      "integrity": "sha512-xbbCH5dCYU5T8LcEhhuh7HJ88HXuW3qsI3Y0zOZFKfZEHcpWiHU/Jxzk629Brsab/mMiHQti9wMP+845RPe3Vg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/eslint/node_modules/minimatch": {
+      "version": "3.1.2",
+      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
+      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
+      "dev": true,
+      "license": "ISC",
+      "dependencies": {
+        "brace-expansion": "^1.1.7"
+      },
+      "engines": {
+        "node": "*"
+      }
+    },
+    "node_modules/esniff": {
+      "version": "2.0.1",
+      "resolved": "https://registry.npmjs.org/esniff/-/esniff-2.0.1.tgz",
+      "integrity": "sha512-kTUIGKQ/mDPFoJ0oVfcmyJn4iBDRptjNVIzwIFR7tqWXdVI9xfA2RMwY/gbSpJG3lkdWNEjLap/NqVHZiJsdfg==",
+      "dev": true,
+      "license": "ISC",
+      "dependencies": {
+        "d": "^1.0.1",
+        "es5-ext": "^0.10.62",
+        "event-emitter": "^0.3.5",
+        "type": "^2.7.2"
+      },
+      "engines": {
+        "node": ">=0.10"
+      }
+    },
+    "node_modules/espree": {
+      "version": "10.3.0",
+      "resolved": "https://registry.npmjs.org/espree/-/espree-10.3.0.tgz",
+      "integrity": "sha512-0QYC8b24HWY8zjRnDTL6RiHfDbAWn63qb4LMj1Z4b076A4une81+z03Kg7l7mn/48PUTqoLptSXez8oknU8Clg==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "dependencies": {
+        "acorn": "^8.14.0",
+        "acorn-jsx": "^5.3.2",
+        "eslint-visitor-keys": "^4.2.0"
+      },
+      "engines": {
+        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/eslint"
+      }
+    },
+    "node_modules/esquery": {
+      "version": "1.6.0",
+      "resolved": "https://registry.npmjs.org/esquery/-/esquery-1.6.0.tgz",
+      "integrity": "sha512-ca9pw9fomFcKPvFLXhBKUK90ZvGibiGOvRJNbjljY7s7uq/5YO4BOzcYtJqExdx99rF6aAcnRxHmcUHcz6sQsg==",
+      "dev": true,
+      "license": "BSD-3-Clause",
+      "dependencies": {
+        "estraverse": "^5.1.0"
+      },
+      "engines": {
+        "node": ">=0.10"
+      }
+    },
+    "node_modules/esrecurse": {
+      "version": "4.3.0",
+      "resolved": "https://registry.npmjs.org/esrecurse/-/esrecurse-4.3.0.tgz",
+      "integrity": "sha512-KmfKL3b6G+RXvP8N1vr3Tq1kL/oCFgn2NYXEtqP8/L3pKapUA4G8cFVaoF3SU323CD4XypR/ffioHmkti6/Tag==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "dependencies": {
+        "estraverse": "^5.2.0"
+      },
+      "engines": {
+        "node": ">=4.0"
+      }
+    },
+    "node_modules/estraverse": {
+      "version": "5.3.0",
+      "resolved": "https://registry.npmjs.org/estraverse/-/estraverse-5.3.0.tgz",
+      "integrity": "sha512-MMdARuVEQziNTeJD8DgMqmhwR11BRQ/cBP+pLtYdSTnf3MIO8fFeiINEbX36ZdNlfU/7A9f3gUw49B3oQsvwBA==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "engines": {
+        "node": ">=4.0"
+      }
+    },
+    "node_modules/estree-walker": {
+      "version": "3.0.3",
+      "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-3.0.3.tgz",
+      "integrity": "sha512-7RUKfXgSMMkzt6ZuXmqapOurLGPPfgj6l9uRZ7lRGolvk0y2yocc35LdcxKC5PQZdn2DMqioAQ2NoWcrTKmm6g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@types/estree": "^1.0.0"
+      }
+    },
+    "node_modules/esutils": {
+      "version": "2.0.3",
+      "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
+      "integrity": "sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
+    "node_modules/etag": {
+      "version": "1.8.1",
+      "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
+      "integrity": "sha512-aIL5Fx7mawVa300al2BnEE4iNvo1qETxLrPI/o05L7z6go7fCw1J6EQmbK4FmJ2AS7kgVF/KEZWufBfdClMcPg==",
+      "license": "MIT",
+      "engines": {
+        "node": ">= 0.6"
+      }
+    },
+    "node_modules/event-emitter": {
+      "version": "0.3.5",
+      "resolved": "https://registry.npmjs.org/event-emitter/-/event-emitter-0.3.5.tgz",
+      "integrity": "sha512-D9rRn9y7kLPnJ+hMq7S/nhvoKwwvVJahBi2BPmx3bvbsEdK3W9ii8cBSGjP+72/LnM4n6fo3+dkCX5FeTQruXA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "d": "1",
+        "es5-ext": "~0.10.14"
+      }
+    },
+    "node_modules/eventemitter3": {
+      "version": "4.0.7",
+      "resolved": "https://registry.npmjs.org/eventemitter3/-/eventemitter3-4.0.7.tgz",
       "integrity": "sha512-8guHBZCwKnFhYdHr2ysuRWErTwhoN2X8XELRlrRwpmfeY2jjuUN4taQMsULKUVo1K4DvZl+0pgfyoysHxvmvEw==",
       "license": "MIT"
     },
@@ -8714,6 +9714,13 @@
         "type": "^2.7.2"
       }
     },
+    "node_modules/fast-copy": {
+      "version": "3.0.2",
+      "resolved": "https://registry.npmjs.org/fast-copy/-/fast-copy-3.0.2.tgz",
+      "integrity": "sha512-dl0O9Vhju8IrcLndv2eU4ldt1ftXMqqfgN4H1cpmGV7P6jeB9FwpN9a2c8DPGE1Ys88rNUJVYDHq73CGAGOPfQ==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/fast-deep-equal": {
       "version": "3.1.3",
       "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
@@ -8758,6 +9765,29 @@
         "node": ">= 6"
       }
     },
+    "node_modules/fast-json-stable-stringify": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz",
+      "integrity": "sha512-lhd/wF+Lk98HZoTCtlVraHtfh5XYijIjalXck7saUtuanSDyLMxnHhSXEDJqHxD7msR8D0uCmqlkwjCV8xvwHw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/fast-levenshtein": {
+      "version": "2.0.6",
+      "resolved": "https://registry.npmjs.org/fast-levenshtein/-/fast-levenshtein-2.0.6.tgz",
+      "integrity": "sha512-DCXu6Ifhqcks7TZKY3Hxp3y6qphY5SJZmrWMDrKcERSOXWQdMhU9Ig/PYrzyw/ul9jOIyh0N4M0tbC5hodg8dw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/fast-redact": {
+      "version": "3.5.0",
+      "resolved": "https://registry.npmjs.org/fast-redact/-/fast-redact-3.5.0.tgz",
+      "integrity": "sha512-dwsoQlS7h9hMeYUq1W++23NDcBLV4KqONnITDV9DjfS3q1SgDGVrBdvvTLUotWtPSD7asWDV9/CmsZPy8Hf70A==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=6"
+      }
+    },
     "node_modules/fast-safe-stringify": {
       "version": "2.1.1",
       "resolved": "https://registry.npmjs.org/fast-safe-stringify/-/fast-safe-stringify-2.1.1.tgz",
@@ -8781,6 +9811,19 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/file-entry-cache": {
+      "version": "8.0.0",
+      "resolved": "https://registry.npmjs.org/file-entry-cache/-/file-entry-cache-8.0.0.tgz",
+      "integrity": "sha512-XXTUwCvisa5oacNGRP9SfNtYBNAMi+RPwBFmblZEF7N7swHYQS6/Zfk7SRwx4D5j3CH211YNRco1DEMNVfZCnQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "flat-cache": "^4.0.0"
+      },
+      "engines": {
+        "node": ">=16.0.0"
+      }
+    },
     "node_modules/file-uri-to-path": {
       "version": "1.0.0",
       "resolved": "https://registry.npmjs.org/file-uri-to-path/-/file-uri-to-path-1.0.0.tgz",
@@ -8833,6 +9876,37 @@
       "integrity": "sha512-Tpp60P6IUJDTuOq/5Z8cdskzJujfwqfOTkrwIwj7IRISpnkJnT6SyJ4PCPnGMoFjC9ddhal5KVIYtAt97ix05A==",
       "license": "MIT"
     },
+    "node_modules/find-up": {
+      "version": "5.0.0",
+      "resolved": "https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz",
+      "integrity": "sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "locate-path": "^6.0.0",
+        "path-exists": "^4.0.0"
+      },
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/flat-cache": {
+      "version": "4.0.1",
+      "resolved": "https://registry.npmjs.org/flat-cache/-/flat-cache-4.0.1.tgz",
+      "integrity": "sha512-f7ccFPK3SXFHpx15UIGyRJ/FJQctuKZ0zVuN3frBo4HnK3cay9VEW0R6yPYFHC0AgqhukPzKjq22t5DmAyqGyw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "flatted": "^3.2.9",
+        "keyv": "^4.5.4"
+      },
+      "engines": {
+        "node": ">=16"
+      }
+    },
     "node_modules/flatted": {
       "version": "3.3.3",
       "resolved": "https://registry.npmjs.org/flatted/-/flatted-3.3.3.tgz",
@@ -9030,6 +10104,27 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/function.prototype.name": {
+      "version": "1.1.8",
+      "resolved": "https://registry.npmjs.org/function.prototype.name/-/function.prototype.name-1.1.8.tgz",
+      "integrity": "sha512-e5iwyodOHhbMr/yNrc7fDYG4qlbIvI5gajyzPnb5TCwyhjApznQh1BMFou9b30SevY43gCJKXycoCBjMbsuW0Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.8",
+        "call-bound": "^1.0.3",
+        "define-properties": "^1.2.1",
+        "functions-have-names": "^1.2.3",
+        "hasown": "^2.0.2",
+        "is-callable": "^1.2.7"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/functions-have-names": {
       "version": "1.2.3",
       "resolved": "https://registry.npmjs.org/functions-have-names/-/functions-have-names-1.2.3.tgz",
@@ -9081,7 +10176,6 @@
       "version": "2.0.5",
       "resolved": "https://registry.npmjs.org/get-caller-file/-/get-caller-file-2.0.5.tgz",
       "integrity": "sha512-DyFP3BM/3YHTQOCUL/w0OZHR0lpKeGrxotcHWcqNEdnltqFwXVfhEBQ94eIo34AfQpo0rGki4cyIiftY06h2Fg==",
-      "dev": true,
       "license": "ISC",
       "engines": {
         "node": "6.* || 8.* || >= 10.*"
@@ -9133,6 +10227,24 @@
         "node": ">= 0.4"
       }
     },
+    "node_modules/get-symbol-description": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/get-symbol-description/-/get-symbol-description-1.1.0.tgz",
+      "integrity": "sha512-w9UMqWwJxHNOvoNzSJ2oPF5wvYcvP7jUvYzhp67yEhTi17ZDBBC1z9pTdGuzjD+EFIqLSYRweZjqfiPzQ06Ebg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bound": "^1.0.3",
+        "es-errors": "^1.3.0",
+        "get-intrinsic": "^1.2.6"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/get-tsconfig": {
       "version": "4.10.1",
       "resolved": "https://registry.npmjs.org/get-tsconfig/-/get-tsconfig-4.10.1.tgz",
@@ -9209,6 +10321,23 @@
         "node": ">=4"
       }
     },
+    "node_modules/globalthis": {
+      "version": "1.0.4",
+      "resolved": "https://registry.npmjs.org/globalthis/-/globalthis-1.0.4.tgz",
+      "integrity": "sha512-DpLKbNU4WylpxJykQujfCcwYWiV/Jhm50Goo0wrVILAv5jOr9d+H+UR3PhSCD2rCCEIg0uc+G+muBTwD54JhDQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "define-properties": "^1.2.1",
+        "gopd": "^1.0.1"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/gopd": {
       "version": "1.2.0",
       "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
@@ -9285,6 +10414,22 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/has-proto": {
+      "version": "1.2.0",
+      "resolved": "https://registry.npmjs.org/has-proto/-/has-proto-1.2.0.tgz",
+      "integrity": "sha512-KIL7eQPfHQRC8+XluaIw7BHUwwqL19bQn4hzNgdr+1wXoU0KKj6rufu47lhY7KbJR2C6T6+PfyN0Ea7wkSS+qQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "dunder-proto": "^1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/has-symbols": {
       "version": "1.1.0",
       "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
@@ -9353,6 +10498,13 @@
         "node": ">=18.0.0"
       }
     },
+    "node_modules/help-me": {
+      "version": "5.0.0",
+      "resolved": "https://registry.npmjs.org/help-me/-/help-me-5.0.0.tgz",
+      "integrity": "sha512-7xgomUX6ADmcYzFik0HzAxh/73YlKR9bmFzf51CZwR+b6YtzU2m0u49hQCqV6SvlqIqsaxovfwdvbnsw3b/zpg==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/hono": {
       "version": "4.7.10",
       "resolved": "https://registry.npmjs.org/hono/-/hono-4.7.10.tgz",
@@ -9488,13 +10640,49 @@
       ],
       "license": "BSD-3-Clause"
     },
+    "node_modules/ignore": {
+      "version": "5.3.2",
+      "resolved": "https://registry.npmjs.org/ignore/-/ignore-5.3.2.tgz",
+      "integrity": "sha512-hsBTNUqQTDwkWtcdYI2i06Y/nUBEsNEDJKjWdigLvegy8kDuJAS8uRlpkkcQpyEXL0Z/pjDy5HBmMjRCJ2gq+g==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 4"
+      }
+    },
+    "node_modules/import-fresh": {
+      "version": "3.3.1",
+      "resolved": "https://registry.npmjs.org/import-fresh/-/import-fresh-3.3.1.tgz",
+      "integrity": "sha512-TR3KfrTZTYLPB6jUjfx6MF9WcWrHL9su5TObK4ZkYgBdWKPOFoSoQIdEuTuR82pmtxH2spWG9h6etwfr1pLBqQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "parent-module": "^1.0.0",
+        "resolve-from": "^4.0.0"
+      },
+      "engines": {
+        "node": ">=6"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/import-fresh/node_modules/resolve-from": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/resolve-from/-/resolve-from-4.0.0.tgz",
+      "integrity": "sha512-pb/MYmXstAkysRFx8piNI1tGFNQIFA3vkE3Gq4EuA1dF6gHp/+vgZqsCGJapvy8N3Q+4o7FwvquPJcnZ7RYy4g==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=4"
+      }
+    },
     "node_modules/imurmurhash": {
       "version": "0.1.4",
       "resolved": "https://registry.npmjs.org/imurmurhash/-/imurmurhash-0.1.4.tgz",
       "integrity": "sha512-JmXMZ6wuvDmLiHEml9ykzqO6lwFbof0GG4IkcGaENdCRDDmMVnny7s5HsIgHCbaq0w2MyPhDqkhTUgS2LU2PHA==",
       "dev": true,
       "license": "MIT",
-      "optional": true,
       "engines": {
         "node": ">=0.8.19"
       }
@@ -9634,6 +10822,26 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/is-async-function": {
+      "version": "2.1.1",
+      "resolved": "https://registry.npmjs.org/is-async-function/-/is-async-function-2.1.1.tgz",
+      "integrity": "sha512-9dgM/cZBnNvjzaMYHVoxxfPj2QXt22Ev7SuuPrs+xav0ukGB0S6d4ydZdEiM48kLx5kDV+QBPrpVnFyefL8kkQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "async-function": "^1.0.0",
+        "call-bound": "^1.0.3",
+        "get-proto": "^1.0.1",
+        "has-tostringtag": "^1.0.2",
+        "safe-regex-test": "^1.1.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/is-bigint": {
       "version": "1.1.0",
       "resolved": "https://registry.npmjs.org/is-bigint/-/is-bigint-1.1.0.tgz",
@@ -9707,6 +10915,24 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/is-data-view": {
+      "version": "1.0.2",
+      "resolved": "https://registry.npmjs.org/is-data-view/-/is-data-view-1.0.2.tgz",
+      "integrity": "sha512-RKtWF8pGmS87i2D6gqQu/l7EYRlVdfzemCJN/P3UOs//x1QE7mfhvzHIApBTRf7axvT6DMGwSwBXYCT0nfB9xw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bound": "^1.0.2",
+        "get-intrinsic": "^1.2.6",
+        "is-typed-array": "^1.1.13"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/is-date-object": {
       "version": "1.1.0",
       "resolved": "https://registry.npmjs.org/is-date-object/-/is-date-object-1.1.0.tgz",
@@ -9733,6 +10959,22 @@
         "node": ">=0.10.0"
       }
     },
+    "node_modules/is-finalizationregistry": {
+      "version": "1.1.1",
+      "resolved": "https://registry.npmjs.org/is-finalizationregistry/-/is-finalizationregistry-1.1.1.tgz",
+      "integrity": "sha512-1pC6N8qWJbWoPtEjgcL2xyhQOP491EQjeUo3qTKcmV8YSDDJrOepfG8pcC7h/QgnQHYSv0mJ3Z/ZWxmatVrysg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bound": "^1.0.3"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/is-fullwidth-code-point": {
       "version": "3.0.0",
       "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
@@ -9742,6 +10984,25 @@
         "node": ">=8"
       }
     },
+    "node_modules/is-generator-function": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/is-generator-function/-/is-generator-function-1.1.0.tgz",
+      "integrity": "sha512-nPUB5km40q9e8UfN/Zc24eLlzdSf9OfKByBw9CIdw4H1giPMeA0OIJvbchsCu4npfI2QcMVBsGEBHKZ7wLTWmQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bound": "^1.0.3",
+        "get-proto": "^1.0.0",
+        "has-tostringtag": "^1.0.2",
+        "safe-regex-test": "^1.1.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/is-glob": {
       "version": "4.0.3",
       "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
@@ -9762,10 +11023,23 @@
       "license": "MIT",
       "optional": true
     },
-    "node_modules/is-map": {
+    "node_modules/is-map": {
+      "version": "2.0.3",
+      "resolved": "https://registry.npmjs.org/is-map/-/is-map-2.0.3.tgz",
+      "integrity": "sha512-1Qed0/Hr2m+YqxnM09CjA2d/i6YZNfF6R2oRAOj36eUdS6qIV/huPJNSEpKbupewFs+ZsJlxsjjPbc0/afW6Lw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
+    "node_modules/is-negative-zero": {
       "version": "2.0.3",
-      "resolved": "https://registry.npmjs.org/is-map/-/is-map-2.0.3.tgz",
-      "integrity": "sha512-1Qed0/Hr2m+YqxnM09CjA2d/i6YZNfF6R2oRAOj36eUdS6qIV/huPJNSEpKbupewFs+ZsJlxsjjPbc0/afW6Lw==",
+      "resolved": "https://registry.npmjs.org/is-negative-zero/-/is-negative-zero-2.0.3.tgz",
+      "integrity": "sha512-5KoIu2Ngpyek75jXodFvnafB6DJgr3u8uuK0LEZJjrU19DrMD3EVERaR8sjz8CCGgpZvxPl9SuE1GMVPFHx1mw==",
       "dev": true,
       "license": "MIT",
       "engines": {
@@ -9905,6 +11179,22 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/is-typed-array": {
+      "version": "1.1.15",
+      "resolved": "https://registry.npmjs.org/is-typed-array/-/is-typed-array-1.1.15.tgz",
+      "integrity": "sha512-p3EcsicXjit7SaskXHs1hA91QxgTw46Fv6EFKKGS5DRFLD8yKnohjF3hxoju94b/OcMZoQukzpPpBE9uLVKzgQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "which-typed-array": "^1.1.16"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/is-weakmap": {
       "version": "2.0.2",
       "resolved": "https://registry.npmjs.org/is-weakmap/-/is-weakmap-2.0.2.tgz",
@@ -9918,6 +11208,22 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/is-weakref": {
+      "version": "1.1.1",
+      "resolved": "https://registry.npmjs.org/is-weakref/-/is-weakref-1.1.1.tgz",
+      "integrity": "sha512-6i9mGWSlqzNMEqpCp93KwRS1uUOodk2OJ6b+sq7ZPDSy2WuI5NFIxp/254TytR8ftefexkWn5xNiHUNpPOfSew==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bound": "^1.0.3"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/is-weakset": {
       "version": "2.0.4",
       "resolved": "https://registry.npmjs.org/is-weakset/-/is-weakset-2.0.4.tgz",
@@ -10068,12 +11374,35 @@
         "jiti": "bin/jiti.js"
       }
     },
+    "node_modules/joycon": {
+      "version": "3.1.1",
+      "resolved": "https://registry.npmjs.org/joycon/-/joycon-3.1.1.tgz",
+      "integrity": "sha512-34wB/Y7MW7bzjKRjUKTa46I2Z7eV62Rkhva+KkopW7Qvv/OSWBqvkSY7vusOPrNuZcUG3tApvdVgNB8POj3SPw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=10"
+      }
+    },
     "node_modules/js-tokens": {
       "version": "4.0.0",
       "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
       "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
       "license": "MIT"
     },
+    "node_modules/js-yaml": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/js-yaml/-/js-yaml-4.1.0.tgz",
+      "integrity": "sha512-wpxZs9NoxZaJESJGIZTyDEaYpl0FKSA+FB9aJiyemKhMwkxQg63h4T1KJgUGHpTqPDNRcmmYLugrRjJlBtWvRA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "argparse": "^2.0.1"
+      },
+      "bin": {
+        "js-yaml": "bin/js-yaml.js"
+      }
+    },
     "node_modules/jsbn": {
       "version": "1.1.0",
       "resolved": "https://registry.npmjs.org/jsbn/-/jsbn-1.1.0.tgz",
@@ -10160,6 +11489,13 @@
         "node": ">=6"
       }
     },
+    "node_modules/json-buffer": {
+      "version": "3.0.1",
+      "resolved": "https://registry.npmjs.org/json-buffer/-/json-buffer-3.0.1.tgz",
+      "integrity": "sha512-4bV5BfR2mqfQTJm+V5tPPdf+ZpuhiIvTuAB5g8kcrXOZpTT/QwwVRWBywX1ozr6lEuPdbHxwaJlm9G6mI2sfSQ==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/json-diff": {
       "version": "0.9.0",
       "resolved": "https://registry.npmjs.org/json-diff/-/json-diff-0.9.0.tgz",
@@ -10196,6 +11532,13 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/json-stable-stringify-without-jsonify": {
+      "version": "1.0.1",
+      "resolved": "https://registry.npmjs.org/json-stable-stringify-without-jsonify/-/json-stable-stringify-without-jsonify-1.0.1.tgz",
+      "integrity": "sha512-Bdboy+l7tA3OGW6FjyFHWkP5LuByj1Tk33Ljyq0axyzdk9//JSi2u3fP1QSmd1KNwq6VOKYGlAu87CisVir6Pw==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/json5": {
       "version": "2.2.3",
       "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.3.tgz",
@@ -10232,6 +11575,30 @@
       "integrity": "sha512-Tpp60P6IUJDTuOq/5Z8cdskzJujfwqfOTkrwIwj7IRISpnkJnT6SyJ4PCPnGMoFjC9ddhal5KVIYtAt97ix05A==",
       "license": "MIT"
     },
+    "node_modules/keyv": {
+      "version": "4.5.4",
+      "resolved": "https://registry.npmjs.org/keyv/-/keyv-4.5.4.tgz",
+      "integrity": "sha512-oxVHkHR/EJf2CNXnWxRLW6mg7JyCCUcG0DtEGmL2ctUo1PNTin1PUil+r/+4r5MpVgC/fn1kjsx7mjSujKqIpw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "json-buffer": "3.0.1"
+      }
+    },
+    "node_modules/levn": {
+      "version": "0.4.1",
+      "resolved": "https://registry.npmjs.org/levn/-/levn-0.4.1.tgz",
+      "integrity": "sha512-+bT2uH4E5LGE7h/n3evcS/sQlJXCpIp6ym8OWJ5eV6+67Dsql/LaaT7qJBAt2rzfoa/5QBGBhxDix1dMt2kQKQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "prelude-ls": "^1.2.1",
+        "type-check": "~0.4.0"
+      },
+      "engines": {
+        "node": ">= 0.8.0"
+      }
+    },
     "node_modules/lilconfig": {
       "version": "3.1.3",
       "resolved": "https://registry.npmjs.org/lilconfig/-/lilconfig-3.1.3.tgz",
@@ -10250,6 +11617,22 @@
       "integrity": "sha512-7ylylesZQ/PV29jhEDl3Ufjo6ZX7gCqJr5F7PKrqc93v7fzSymt1BpwEU8nAUXs8qzzvqhbjhK5QZg6Mt/HkBg==",
       "license": "MIT"
     },
+    "node_modules/locate-path": {
+      "version": "6.0.0",
+      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
+      "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "p-locate": "^5.0.0"
+      },
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/lodash": {
       "version": "4.17.21",
       "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
@@ -10918,6 +12301,13 @@
       "devOptional": true,
       "license": "MIT"
     },
+    "node_modules/natural-compare": {
+      "version": "1.4.0",
+      "resolved": "https://registry.npmjs.org/natural-compare/-/natural-compare-1.4.0.tgz",
+      "integrity": "sha512-OWND8ei3VtNC9h7V60qff3SVobHr996CTwgxubgyQYEpg290h9J0buyECNNJexkFm5sOajh5G116RYA1c8ZMSw==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/negotiator": {
       "version": "0.6.3",
       "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-0.6.3.tgz",
@@ -11332,12 +12722,74 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/object.fromentries": {
+      "version": "2.0.8",
+      "resolved": "https://registry.npmjs.org/object.fromentries/-/object.fromentries-2.0.8.tgz",
+      "integrity": "sha512-k6E21FzySsSK5a21KRADBd/NGneRegFO5pLHfdQLpRDETUNJueLXs3WCzyQ3tFRDYgbq3KHGXfTbi2bs8WQ6rQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.7",
+        "define-properties": "^1.2.1",
+        "es-abstract": "^1.23.2",
+        "es-object-atoms": "^1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
+    "node_modules/object.groupby": {
+      "version": "1.0.3",
+      "resolved": "https://registry.npmjs.org/object.groupby/-/object.groupby-1.0.3.tgz",
+      "integrity": "sha512-+Lhy3TQTuzXI5hevh8sBGqbmurHbbIjAi0Z4S63nthVLmLxfbj4T54a4CfZrXIrt9iP4mVAPYMo/v99taj3wjQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.7",
+        "define-properties": "^1.2.1",
+        "es-abstract": "^1.23.2"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      }
+    },
+    "node_modules/object.values": {
+      "version": "1.2.1",
+      "resolved": "https://registry.npmjs.org/object.values/-/object.values-1.2.1.tgz",
+      "integrity": "sha512-gXah6aZrcUxjWg2zR2MwouP2eHlCBzdV4pygudehaKXSGW4v2AsRQUK+lwwXhii6KFZcunEnmSUoYp5CXibxtA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.8",
+        "call-bound": "^1.0.3",
+        "define-properties": "^1.2.1",
+        "es-object-atoms": "^1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/obuf": {
       "version": "1.1.2",
       "resolved": "https://registry.npmjs.org/obuf/-/obuf-1.1.2.tgz",
       "integrity": "sha512-PX1wu0AmAdPqOL1mWhqmlOd8kOIZQwGZw6rh7uby9fTc5lhaOWFLX3I6R1hrF9k3zUY40e6igsLGkDXK92LJNg==",
       "license": "MIT"
     },
+    "node_modules/on-exit-leak-free": {
+      "version": "2.1.2",
+      "resolved": "https://registry.npmjs.org/on-exit-leak-free/-/on-exit-leak-free-2.1.2.tgz",
+      "integrity": "sha512-0eJJY6hXLGf1udHwfNftBqH+g73EU4B504nZeKpz1sYRKafAghwxEJunB2O7rDZkL4PGfsMVnTXZ2EjibbqcsA==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=14.0.0"
+      }
+    },
     "node_modules/on-finished": {
       "version": "2.4.1",
       "resolved": "https://registry.npmjs.org/on-finished/-/on-finished-2.4.1.tgz",
@@ -11368,6 +12820,24 @@
         "wrappy": "1"
       }
     },
+    "node_modules/optionator": {
+      "version": "0.9.4",
+      "resolved": "https://registry.npmjs.org/optionator/-/optionator-0.9.4.tgz",
+      "integrity": "sha512-6IpQ7mKUxRcZNLIObR0hz7lxsapSSIYNZJwXPGeF0mTVqGKFIXj1DQcMoT22S3ROcLyY/rz0PWaWZ9ayWmad9g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "deep-is": "^0.1.3",
+        "fast-levenshtein": "^2.0.6",
+        "levn": "^0.4.1",
+        "prelude-ls": "^1.2.1",
+        "type-check": "^0.4.0",
+        "word-wrap": "^1.2.5"
+      },
+      "engines": {
+        "node": ">= 0.8.0"
+      }
+    },
     "node_modules/outvariant": {
       "version": "1.4.3",
       "resolved": "https://registry.npmjs.org/outvariant/-/outvariant-1.4.3.tgz",
@@ -11375,6 +12845,56 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/own-keys": {
+      "version": "1.0.1",
+      "resolved": "https://registry.npmjs.org/own-keys/-/own-keys-1.0.1.tgz",
+      "integrity": "sha512-qFOyK5PjiWZd+QQIh+1jhdb9LpxTF0qs7Pm8o5QHYZ0M3vKqSqzsZaEB6oWlxZ+q2sJBMI/Ktgd2N5ZwQoRHfg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "get-intrinsic": "^1.2.6",
+        "object-keys": "^1.1.1",
+        "safe-push-apply": "^1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
+    "node_modules/p-limit": {
+      "version": "3.1.0",
+      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
+      "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "yocto-queue": "^0.1.0"
+      },
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/p-locate": {
+      "version": "5.0.0",
+      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz",
+      "integrity": "sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "p-limit": "^3.0.2"
+      },
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/p-map": {
       "version": "4.0.0",
       "resolved": "https://registry.npmjs.org/p-map/-/p-map-4.0.0.tgz",
@@ -11398,6 +12918,19 @@
       "integrity": "sha512-UEZIS3/by4OC8vL3P2dTXRETpebLI2NiI5vIrjaD/5UtrkFX/tNbwjTSRAGC/+7CAo2pIcBaRgWmcBBHcsaCIw==",
       "license": "BlueOak-1.0.0"
     },
+    "node_modules/parent-module": {
+      "version": "1.0.1",
+      "resolved": "https://registry.npmjs.org/parent-module/-/parent-module-1.0.1.tgz",
+      "integrity": "sha512-GQ2EWRpQV8/o+Aw8YqtfZZPfNRWZYkbidE9k5rpl/hC3vtHHBfGm2Ifi6qWV+coDGkrUKZAxE3Lot5kcsRlh+g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "callsites": "^3.0.0"
+      },
+      "engines": {
+        "node": ">=6"
+      }
+    },
     "node_modules/parse-ms": {
       "version": "2.1.0",
       "resolved": "https://registry.npmjs.org/parse-ms/-/parse-ms-2.1.0.tgz",
@@ -11474,6 +13007,16 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/path-exists": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
+      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/path-is-absolute": {
       "version": "1.0.1",
       "resolved": "https://registry.npmjs.org/path-is-absolute/-/path-is-absolute-1.0.1.tgz",
@@ -11747,6 +13290,93 @@
         "node": ">=0.10.0"
       }
     },
+    "node_modules/pino": {
+      "version": "9.7.0",
+      "resolved": "https://registry.npmjs.org/pino/-/pino-9.7.0.tgz",
+      "integrity": "sha512-vnMCM6xZTb1WDmLvtG2lE/2p+t9hDEIvTWJsu6FejkE62vB7gDhvzrpFR4Cw2to+9JNQxVnkAKVPA1KPB98vWg==",
+      "license": "MIT",
+      "dependencies": {
+        "atomic-sleep": "^1.0.0",
+        "fast-redact": "^3.1.1",
+        "on-exit-leak-free": "^2.1.0",
+        "pino-abstract-transport": "^2.0.0",
+        "pino-std-serializers": "^7.0.0",
+        "process-warning": "^5.0.0",
+        "quick-format-unescaped": "^4.0.3",
+        "real-require": "^0.2.0",
+        "safe-stable-stringify": "^2.3.1",
+        "sonic-boom": "^4.0.1",
+        "thread-stream": "^3.0.0"
+      },
+      "bin": {
+        "pino": "bin.js"
+      }
+    },
+    "node_modules/pino-abstract-transport": {
+      "version": "2.0.0",
+      "resolved": "https://registry.npmjs.org/pino-abstract-transport/-/pino-abstract-transport-2.0.0.tgz",
+      "integrity": "sha512-F63x5tizV6WCh4R6RHyi2Ml+M70DNRXt/+HANowMflpgGFMAym/VKm6G7ZOQRjqN7XbGxK1Lg9t6ZrtzOaivMw==",
+      "license": "MIT",
+      "dependencies": {
+        "split2": "^4.0.0"
+      }
+    },
+    "node_modules/pino-http": {
+      "version": "10.5.0",
+      "resolved": "https://registry.npmjs.org/pino-http/-/pino-http-10.5.0.tgz",
+      "integrity": "sha512-hD91XjgaKkSsdn8P7LaebrNzhGTdB086W3pyPihX0EzGPjq5uBJBXo4N5guqNaK6mUjg9aubMF7wDViYek9dRA==",
+      "license": "MIT",
+      "dependencies": {
+        "get-caller-file": "^2.0.5",
+        "pino": "^9.0.0",
+        "pino-std-serializers": "^7.0.0",
+        "process-warning": "^5.0.0"
+      }
+    },
+    "node_modules/pino-pretty": {
+      "version": "13.0.0",
+      "resolved": "https://registry.npmjs.org/pino-pretty/-/pino-pretty-13.0.0.tgz",
+      "integrity": "sha512-cQBBIVG3YajgoUjo1FdKVRX6t9XPxwB9lcNJVD5GCnNM4Y6T12YYx8c6zEejxQsU0wrg9TwmDulcE9LR7qcJqA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "colorette": "^2.0.7",
+        "dateformat": "^4.6.3",
+        "fast-copy": "^3.0.2",
+        "fast-safe-stringify": "^2.1.1",
+        "help-me": "^5.0.0",
+        "joycon": "^3.1.1",
+        "minimist": "^1.2.6",
+        "on-exit-leak-free": "^2.1.0",
+        "pino-abstract-transport": "^2.0.0",
+        "pump": "^3.0.0",
+        "secure-json-parse": "^2.4.0",
+        "sonic-boom": "^4.0.1",
+        "strip-json-comments": "^3.1.1"
+      },
+      "bin": {
+        "pino-pretty": "bin.js"
+      }
+    },
+    "node_modules/pino-pretty/node_modules/strip-json-comments": {
+      "version": "3.1.1",
+      "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-3.1.1.tgz",
+      "integrity": "sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=8"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/pino-std-serializers": {
+      "version": "7.0.0",
+      "resolved": "https://registry.npmjs.org/pino-std-serializers/-/pino-std-serializers-7.0.0.tgz",
+      "integrity": "sha512-e906FRY0+tV27iq4juKzSYPbUj2do2X2JX4EzSca1631EB2QJQUqGbDuERal7LCtOpxl6x3+nvo9NPZcmjkiFA==",
+      "license": "MIT"
+    },
     "node_modules/pirates": {
       "version": "4.0.7",
       "resolved": "https://registry.npmjs.org/pirates/-/pirates-4.0.7.tgz",
@@ -12008,6 +13638,16 @@
         "node": ">=10"
       }
     },
+    "node_modules/prelude-ls": {
+      "version": "1.2.1",
+      "resolved": "https://registry.npmjs.org/prelude-ls/-/prelude-ls-1.2.1.tgz",
+      "integrity": "sha512-vkcDPrRZo1QZLbn5RLGPpg/WmIQ65qoWWhcGKf/b5eplkkarX0m9z8ppCat4mlOqUsWpyNuYgO3VRyrYHSzX5g==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 0.8.0"
+      }
+    },
     "node_modules/pretty-format": {
       "version": "27.5.1",
       "resolved": "https://registry.npmjs.org/pretty-format/-/pretty-format-27.5.1.tgz",
@@ -12052,6 +13692,22 @@
         "url": "https://github.com/sponsors/sindresorhus"
       }
     },
+    "node_modules/process-warning": {
+      "version": "5.0.0",
+      "resolved": "https://registry.npmjs.org/process-warning/-/process-warning-5.0.0.tgz",
+      "integrity": "sha512-a39t9ApHNx2L4+HBnQKqxxHNs1r7KF+Intd8Q/g1bUh6q0WIp9voPXJ/x0j+ZL45KF1pJd9+q2jLIRMfvEshkA==",
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/fastify"
+        },
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/fastify"
+        }
+      ],
+      "license": "MIT"
+    },
     "node_modules/promise-inflight": {
       "version": "1.0.1",
       "resolved": "https://registry.npmjs.org/promise-inflight/-/promise-inflight-1.0.1.tgz",
@@ -12193,6 +13849,12 @@
       ],
       "license": "MIT"
     },
+    "node_modules/quick-format-unescaped": {
+      "version": "4.0.4",
+      "resolved": "https://registry.npmjs.org/quick-format-unescaped/-/quick-format-unescaped-4.0.4.tgz",
+      "integrity": "sha512-tYC1Q1hgyRuHgloV/YXs2w15unPVh8qfu/qCTfhTYamaw7fyhumKa2yGpdSo87vY32rIclj+4fWYQXUMs9EHvg==",
+      "license": "MIT"
+    },
     "node_modules/random-bytes": {
       "version": "1.0.0",
       "resolved": "https://registry.npmjs.org/random-bytes/-/random-bytes-1.0.0.tgz",
@@ -12508,7 +14170,16 @@
         "picomatch": "^2.2.1"
       },
       "engines": {
-        "node": ">=8.10.0"
+        "node": ">=8.10.0"
+      }
+    },
+    "node_modules/real-require": {
+      "version": "0.2.0",
+      "resolved": "https://registry.npmjs.org/real-require/-/real-require-0.2.0.tgz",
+      "integrity": "sha512-57frrGM/OCTLqLOAh0mhVA9VBMHd+9U7Zb2THMGdBUoZVOtGbJzjxsYGDJ3A9AYYCP4hn6y1TVbaOfzWtm5GFg==",
+      "license": "MIT",
+      "engines": {
+        "node": ">= 12.13.0"
       }
     },
     "node_modules/recharts": {
@@ -12563,6 +14234,29 @@
         "node": ">=8"
       }
     },
+    "node_modules/reflect.getprototypeof": {
+      "version": "1.0.10",
+      "resolved": "https://registry.npmjs.org/reflect.getprototypeof/-/reflect.getprototypeof-1.0.10.tgz",
+      "integrity": "sha512-00o4I+DVrefhv+nX0ulyi3biSHCPDe+yLv5o/p6d/UVlirijB8E16FtfwSAi4g3tcqrQ4lRAqQSoFEZJehYEcw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.8",
+        "define-properties": "^1.2.1",
+        "es-abstract": "^1.23.9",
+        "es-errors": "^1.3.0",
+        "es-object-atoms": "^1.0.0",
+        "get-intrinsic": "^1.2.7",
+        "get-proto": "^1.0.1",
+        "which-builtin-type": "^1.2.1"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/regexp.prototype.flags": {
       "version": "1.5.4",
       "resolved": "https://registry.npmjs.org/regexp.prototype.flags/-/regexp.prototype.flags-1.5.4.tgz",
@@ -12826,6 +14520,26 @@
         "tslib": "^2.1.0"
       }
     },
+    "node_modules/safe-array-concat": {
+      "version": "1.1.3",
+      "resolved": "https://registry.npmjs.org/safe-array-concat/-/safe-array-concat-1.1.3.tgz",
+      "integrity": "sha512-AURm5f0jYEOydBj7VQlVvDrjeFgthDdEF5H1dP+6mNpoXOMo1quQqJ4wvJDyRZ9+pO3kGWoOdmV08cSv2aJV6Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.8",
+        "call-bound": "^1.0.2",
+        "get-intrinsic": "^1.2.6",
+        "has-symbols": "^1.1.0",
+        "isarray": "^2.0.5"
+      },
+      "engines": {
+        "node": ">=0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/safe-buffer": {
       "version": "5.2.1",
       "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
@@ -12846,6 +14560,23 @@
       ],
       "license": "MIT"
     },
+    "node_modules/safe-push-apply": {
+      "version": "1.0.0",
+      "resolved": "https://registry.npmjs.org/safe-push-apply/-/safe-push-apply-1.0.0.tgz",
+      "integrity": "sha512-iKE9w/Z7xCzUMIZqdBsp6pEQvwuEebH4vdpjcDWnyzaI6yl6O9FHvVpmGelvEHNsoY6wGblkxR6Zty/h00WiSA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "es-errors": "^1.3.0",
+        "isarray": "^2.0.5"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/safe-regex-test": {
       "version": "1.1.0",
       "resolved": "https://registry.npmjs.org/safe-regex-test/-/safe-regex-test-1.1.0.tgz",
@@ -12864,6 +14595,15 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/safe-stable-stringify": {
+      "version": "2.5.0",
+      "resolved": "https://registry.npmjs.org/safe-stable-stringify/-/safe-stable-stringify-2.5.0.tgz",
+      "integrity": "sha512-b3rppTKm9T+PsVCBEOUR46GWI7fdOs00VKZ1+9c1EWDaDMvjQc6tUwuFyIprgGgTcWoVHSKrU8H31ZHA2e0RHA==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=10"
+      }
+    },
     "node_modules/safer-buffer": {
       "version": "2.1.2",
       "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
@@ -12892,6 +14632,13 @@
         "loose-envify": "^1.1.0"
       }
     },
+    "node_modules/secure-json-parse": {
+      "version": "2.7.0",
+      "resolved": "https://registry.npmjs.org/secure-json-parse/-/secure-json-parse-2.7.0.tgz",
+      "integrity": "sha512-6aU+Rwsezw7VR8/nyvKTx8QpWH9FrcYiXXlqC4z5d5XQBDRqtbfsRjnwGyqbi3gddNtWHuEk9OANUotL26qKUw==",
+      "dev": true,
+      "license": "BSD-3-Clause"
+    },
     "node_modules/semver": {
       "version": "6.3.1",
       "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
@@ -13004,6 +14751,21 @@
         "node": ">= 0.4"
       }
     },
+    "node_modules/set-proto": {
+      "version": "1.0.0",
+      "resolved": "https://registry.npmjs.org/set-proto/-/set-proto-1.0.0.tgz",
+      "integrity": "sha512-RJRdvCo6IAnPdsvP/7m6bsQqNnn1FCBX5ZNtFL98MmFF/4xAIJTIg1YbHW5DC2W5SKZanrC6i4HsJqlajw/dZw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "dunder-proto": "^1.0.1",
+        "es-errors": "^1.3.0",
+        "es-object-atoms": "^1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      }
+    },
     "node_modules/setprototypeof": {
       "version": "1.2.0",
       "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
@@ -13248,6 +15010,15 @@
         "node": ">= 10"
       }
     },
+    "node_modules/sonic-boom": {
+      "version": "4.2.0",
+      "resolved": "https://registry.npmjs.org/sonic-boom/-/sonic-boom-4.2.0.tgz",
+      "integrity": "sha512-INb7TM37/mAcsGmc9hyyI6+QR3rR1zVRu36B0NeGXKnOOLiZOfER5SA+N7X7k3yUYRzLWafduTDvJAfDswwEww==",
+      "license": "MIT",
+      "dependencies": {
+        "atomic-sleep": "^1.0.0"
+      }
+    },
     "node_modules/source-map": {
       "version": "0.6.1",
       "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
@@ -13423,6 +15194,65 @@
         "node": ">=8"
       }
     },
+    "node_modules/string.prototype.trim": {
+      "version": "1.2.10",
+      "resolved": "https://registry.npmjs.org/string.prototype.trim/-/string.prototype.trim-1.2.10.tgz",
+      "integrity": "sha512-Rs66F0P/1kedk5lyYyH9uBzuiI/kNRmwJAR9quK6VOtIpZ2G+hMZd+HQbbv25MgCA6gEffoMZYxlTod4WcdrKA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.8",
+        "call-bound": "^1.0.2",
+        "define-data-property": "^1.1.4",
+        "define-properties": "^1.2.1",
+        "es-abstract": "^1.23.5",
+        "es-object-atoms": "^1.0.0",
+        "has-property-descriptors": "^1.0.2"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
+    "node_modules/string.prototype.trimend": {
+      "version": "1.0.9",
+      "resolved": "https://registry.npmjs.org/string.prototype.trimend/-/string.prototype.trimend-1.0.9.tgz",
+      "integrity": "sha512-G7Ok5C6E/j4SGfyLCloXTrngQIQU3PWtXGst3yM7Bea9FRURf1S42ZHlZZtsNque2FN2PoUhfZXYLNWwEr4dLQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.8",
+        "call-bound": "^1.0.2",
+        "define-properties": "^1.2.1",
+        "es-object-atoms": "^1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
+    "node_modules/string.prototype.trimstart": {
+      "version": "1.0.8",
+      "resolved": "https://registry.npmjs.org/string.prototype.trimstart/-/string.prototype.trimstart-1.0.8.tgz",
+      "integrity": "sha512-UXSH262CSZY1tfu3G3Secr6uGLCFVPMhIqHjlgCUtCCcgihYc/xKs9djMTMUOb2j1mVSeU8EU6NWc/iQKU6Gfg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.7",
+        "define-properties": "^1.2.1",
+        "es-object-atoms": "^1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/strip-ansi": {
       "version": "6.0.1",
       "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
@@ -13448,6 +15278,16 @@
         "node": ">=8"
       }
     },
+    "node_modules/strip-bom": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/strip-bom/-/strip-bom-3.0.0.tgz",
+      "integrity": "sha512-vavAMRXOgBVNF6nyEEmL3DBK19iRpDcoIwW+swQ+CbGiu7lju6t+JklA1MHweoWtadgt4ISVUsXLyDq34ddcwA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=4"
+      }
+    },
     "node_modules/strip-indent": {
       "version": "3.0.0",
       "resolved": "https://registry.npmjs.org/strip-indent/-/strip-indent-3.0.0.tgz",
@@ -13875,6 +15715,15 @@
         "node": ">=0.8"
       }
     },
+    "node_modules/thread-stream": {
+      "version": "3.1.0",
+      "resolved": "https://registry.npmjs.org/thread-stream/-/thread-stream-3.1.0.tgz",
+      "integrity": "sha512-OqyPZ9u96VohAyMfJykzmivOrY2wfMSf3C5TtFJVgN+Hm6aj+voFhlK+kZEIv2FBh1X6Xp3DlnCOfEQ3B2J86A==",
+      "license": "MIT",
+      "dependencies": {
+        "real-require": "^0.2.0"
+      }
+    },
     "node_modules/time-span": {
       "version": "4.0.0",
       "resolved": "https://registry.npmjs.org/time-span/-/time-span-4.0.0.tgz",
@@ -14145,6 +15994,32 @@
       "dev": true,
       "license": "Apache-2.0"
     },
+    "node_modules/tsconfig-paths": {
+      "version": "3.15.0",
+      "resolved": "https://registry.npmjs.org/tsconfig-paths/-/tsconfig-paths-3.15.0.tgz",
+      "integrity": "sha512-2Ac2RgzDe/cn48GvOe3M+o82pEFewD3UPbyoUHHdKasHwJKjds4fLXWf/Ux5kATBKN20oaFGu+jbElp1pos0mg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@types/json5": "^0.0.29",
+        "json5": "^1.0.2",
+        "minimist": "^1.2.6",
+        "strip-bom": "^3.0.0"
+      }
+    },
+    "node_modules/tsconfig-paths/node_modules/json5": {
+      "version": "1.0.2",
+      "resolved": "https://registry.npmjs.org/json5/-/json5-1.0.2.tgz",
+      "integrity": "sha512-g1MWMLBiz8FKi1e4w0UyVL3w+iJceWAFBAaBnnGKOpNa5f8TLktkbre1+s6oICydWAm+HRUGTmI+//xv2hvXYA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "minimist": "^1.2.0"
+      },
+      "bin": {
+        "json5": "lib/cli.js"
+      }
+    },
     "node_modules/tslib": {
       "version": "2.8.1",
       "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
@@ -14200,6 +16075,19 @@
       "dev": true,
       "license": "ISC"
     },
+    "node_modules/type-check": {
+      "version": "0.4.0",
+      "resolved": "https://registry.npmjs.org/type-check/-/type-check-0.4.0.tgz",
+      "integrity": "sha512-XleUoc9uwGXqjWwXaUTZAmzMcFZ5858QA2vvx1Ur5xIcixXIP+8LnFDgRplU30us6teqdlskFfu+ae4K79Ooew==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "prelude-ls": "^1.2.1"
+      },
+      "engines": {
+        "node": ">= 0.8.0"
+      }
+    },
     "node_modules/type-fest": {
       "version": "4.41.0",
       "resolved": "https://registry.npmjs.org/type-fest/-/type-fest-4.41.0.tgz",
@@ -14226,6 +16114,84 @@
         "node": ">= 0.6"
       }
     },
+    "node_modules/typed-array-buffer": {
+      "version": "1.0.3",
+      "resolved": "https://registry.npmjs.org/typed-array-buffer/-/typed-array-buffer-1.0.3.tgz",
+      "integrity": "sha512-nAYYwfY3qnzX30IkA6AQZjVbtK6duGontcQm1WSG1MD94YLqK0515GNApXkoxKOWMusVssAHWLh9SeaoefYFGw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bound": "^1.0.3",
+        "es-errors": "^1.3.0",
+        "is-typed-array": "^1.1.14"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      }
+    },
+    "node_modules/typed-array-byte-length": {
+      "version": "1.0.3",
+      "resolved": "https://registry.npmjs.org/typed-array-byte-length/-/typed-array-byte-length-1.0.3.tgz",
+      "integrity": "sha512-BaXgOuIxz8n8pIq3e7Atg/7s+DpiYrxn4vdot3w9KbnBhcRQq6o3xemQdIfynqSeXeDrF32x+WvfzmOjPiY9lg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.8",
+        "for-each": "^0.3.3",
+        "gopd": "^1.2.0",
+        "has-proto": "^1.2.0",
+        "is-typed-array": "^1.1.14"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
+    "node_modules/typed-array-byte-offset": {
+      "version": "1.0.4",
+      "resolved": "https://registry.npmjs.org/typed-array-byte-offset/-/typed-array-byte-offset-1.0.4.tgz",
+      "integrity": "sha512-bTlAFB/FBYMcuX81gbL4OcpH5PmlFHqlCCpAl8AlEzMz5k53oNDvN8p1PNOWLEmI2x4orp3raOFB51tv9X+MFQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "available-typed-arrays": "^1.0.7",
+        "call-bind": "^1.0.8",
+        "for-each": "^0.3.3",
+        "gopd": "^1.2.0",
+        "has-proto": "^1.2.0",
+        "is-typed-array": "^1.1.15",
+        "reflect.getprototypeof": "^1.0.9"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
+    "node_modules/typed-array-length": {
+      "version": "1.0.7",
+      "resolved": "https://registry.npmjs.org/typed-array-length/-/typed-array-length-1.0.7.tgz",
+      "integrity": "sha512-3KS2b+kL7fsuk/eJZ7EQdnEmQoaho/r6KUef7hxvltNA5DR8NAUM+8wJMbJyZ4G9/7i3v5zPBIMN5aybAh2/Jg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind": "^1.0.7",
+        "for-each": "^0.3.3",
+        "gopd": "^1.0.1",
+        "is-typed-array": "^1.1.13",
+        "possible-typed-array-names": "^1.0.0",
+        "reflect.getprototypeof": "^1.0.6"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/typescript": {
       "version": "5.6.3",
       "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.6.3.tgz",
@@ -14252,6 +16218,25 @@
         "node": ">= 0.8"
       }
     },
+    "node_modules/unbox-primitive": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/unbox-primitive/-/unbox-primitive-1.1.0.tgz",
+      "integrity": "sha512-nWJ91DjeOkej/TA8pXQ3myruKpKEYgqvpw9lz4OPHj/NWFNluYrjbz9j01CJ8yKQd2g4jFoOkINCTW2I5LEEyw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bound": "^1.0.3",
+        "has-bigints": "^1.0.2",
+        "has-symbols": "^1.1.0",
+        "which-boxed-primitive": "^1.1.1"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/undici": {
       "version": "5.28.4",
       "resolved": "https://registry.npmjs.org/undici/-/undici-5.28.4.tgz",
@@ -14787,6 +16772,34 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/which-builtin-type": {
+      "version": "1.2.1",
+      "resolved": "https://registry.npmjs.org/which-builtin-type/-/which-builtin-type-1.2.1.tgz",
+      "integrity": "sha512-6iBczoX+kDQ7a3+YJBnh3T+KZRxM/iYNPXicqk66/Qfm1b93iu+yOImkg0zHbj5LNOcNv1TEADiZ0xa34B4q6Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bound": "^1.0.2",
+        "function.prototype.name": "^1.1.6",
+        "has-tostringtag": "^1.0.2",
+        "is-async-function": "^2.0.0",
+        "is-date-object": "^1.1.0",
+        "is-finalizationregistry": "^1.1.0",
+        "is-generator-function": "^1.0.10",
+        "is-regex": "^1.2.1",
+        "is-weakref": "^1.0.2",
+        "isarray": "^2.0.5",
+        "which-boxed-primitive": "^1.1.0",
+        "which-collection": "^1.0.2",
+        "which-typed-array": "^1.1.16"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/which-collection": {
       "version": "1.0.2",
       "resolved": "https://registry.npmjs.org/which-collection/-/which-collection-1.0.2.tgz",
@@ -14854,6 +16867,16 @@
         "string-width": "^1.0.2 || 2 || 3 || 4"
       }
     },
+    "node_modules/word-wrap": {
+      "version": "1.2.5",
+      "resolved": "https://registry.npmjs.org/word-wrap/-/word-wrap-1.2.5.tgz",
+      "integrity": "sha512-BN22B5eaMMI9UMtjrGd5g5eCYPpCPDUy0FJXbYsaT5zYxjFOckS53SQDE3pWkVoWpHXVb3BrYcEN4Twa55B5cA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
     "node_modules/wordwrap": {
       "version": "1.0.0",
       "resolved": "https://registry.npmjs.org/wordwrap/-/wordwrap-1.0.0.tgz",
@@ -15029,6 +17052,19 @@
         "node": ">=6"
       }
     },
+    "node_modules/yocto-queue": {
+      "version": "0.1.0",
+      "resolved": "https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz",
+      "integrity": "sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/yoctocolors-cjs": {
       "version": "2.1.2",
       "resolved": "https://registry.npmjs.org/yoctocolors-cjs/-/yoctocolors-cjs-2.1.2.tgz",
diff --git a/package.json b/package.json
index 1084567..7e0c2cc 100644
--- a/package.json
+++ b/package.json
@@ -10,7 +10,10 @@
     "dev": "tsx server/index.ts",
     "dev:client": "vite --host localhost --port 5173",
     "dev:full": "echo 'Starting full development environment...' && echo 'Backend: http://localhost:3000' && echo 'Frontend: http://localhost:5173' && concurrently \"npm run dev\" \"npm run dev:client\"",
-    "build": "rm -rf build dist && tsc -p tsconfig.server.json && vite build && npx esbuild ./api/index.ts --platform=node --bundle --format=esm --outfile=api/index.js --external:express --external:dotenv --external:drizzle-orm --external:bcrypt --external:passport --external:express-session --external:connect-pg-simple --external:memorystore --external:btcpay-greenfield-node-client --external:express-rate-limit --external:helmet --external:crypto --external:fs --external:path --external:nanoid --external:vite --external:lightningcss --external:fsevents --external:better-sqlite3 --external:sqlite3 --external:pg --external:postgres '--external:@babel/*'",
+    "build:server": "rm -rf build/server-out && tsc -p tsconfig.server.json && node scripts/clean-build.js",
+    "build:client": "rm -rf dist && vite build",
+    "build": "npm run build:server && npm run build:client",
+    "build:api": "npm run build:server",
     "start": "node api/index.js",
     "check": "tsc && tsc -p tsconfig.server.json --noEmit",
     "db:generate-pg": "drizzle-kit generate --config ./drizzle.config.ts",
@@ -20,7 +23,11 @@
     "test": "vitest run",
     "test:watch": "vitest",
     "test:ui": "vitest --ui",
-    "test:coverage": "vitest run --coverage"
+    "test:coverage": "vitest run --coverage",
+    "lint": "eslint . --ext .js,.ts,.tsx",
+    "lint:fix": "eslint . --ext .js,.ts,.tsx --fix",
+    "lint:imports": "eslint . --ext .js,.ts,.tsx --rule 'import/extensions: [error, ignorePackages, {js: always, ts: never}]' --no-eslintrc",
+    "check:imports": "node scripts/check-esm-imports.js"
   },
   "dependencies": {
     "@hookform/resolvers": "^3.9.1",
@@ -83,6 +90,8 @@
     "nodemailer": "^7.0.2",
     "passport": "^0.7.0",
     "passport-local": "^1.0.0",
+    "pino": "^9.7.0",
+    "pino-http": "^10.5.0",
     "postgres": "^3.4.5",
     "react": "^18.3.1",
     "react-day-picker": "^8.10.1",
@@ -133,8 +142,11 @@
     "dotenv": "^16.4.5",
     "drizzle-kit": "^0.20.14",
     "esbuild": "^0.25.4",
+    "eslint": "^9.28.0",
+    "eslint-plugin-import": "^2.31.0",
     "jsdom": "^24.0.0",
     "msw": "^2.2.1",
+    "pino-pretty": "^13.0.0",
     "postcss": "^8.4.47",
     "sqlite3": "^5.1.7",
     "supertest": "^6.3.4",
diff --git a/server/app.ts b/server/app.ts
index cf1eb20..5f061b7 100644
--- a/server/app.ts
+++ b/server/app.ts
@@ -3,11 +3,14 @@ import dotenv from "dotenv";
 dotenv.config();
 
 import express from "express";
-import mung from "express-mung"; // Added import for express-mung
 import cookieParser from 'cookie-parser';
+import * as pino from 'pino';
+import * as pinoHttp from 'pino-http';
 import { registerRoutes } from "./routes.js";
 import { storage } from "./storage.js";
 import type { IStorage } from "./storage.js";
+import { validateEnv } from "./utils/validateEnv.js";
+import { performanceMiddleware } from "./utils/performanceMiddleware.js";
 
 // Prevent unhandled exceptions (especially from HMR WebSocket) from crashing the process
 process.on('uncaughtException', (err) => {
@@ -19,39 +22,95 @@ process.on('unhandledRejection', (reason) => {
 
 const app = express();
 
+// Initialize pino-http logger
+const pinoLogger = pinoHttp.pinoHttp({
+  logger: pino.pino({
+    level: process.env.LOG_LEVEL || 'info', // Default to 'info', can be configured via env
+  }),
+  // Use pino-pretty for local development for human-readable logs
+  ...(process.env.NODE_ENV !== 'production' && {
+    transport: {
+      target: 'pino-pretty',
+      options: {
+        colorize: true,
+        translateTime: 'SYS:standard',
+        ignore: 'pid,hostname', // Vercel adds these, so we can ignore them locally
+      },
+    },
+  }),
+  // Define custom serializers to control what is logged
+  serializers: {
+    req(req: any) {
+      // Remove potentially sensitive headers from logs
+      const headers = { ...req.headers };
+      delete headers.authorization;
+      delete headers.cookie;
+      delete headers['x-csrf-token']; // if you use this header for CSRF
+      delete headers['x-forwarded-for'];
+      delete headers['x-real-ip'];
+
+      return {
+        method: req.method,
+        url: req.url, // Includes query string
+        // query: req.query, // Redundant if url includes query string
+        // params: req.params, // Typically logged by router or controller if needed
+        headers: headers, // Log filtered headers
+        remoteAddress: req.remoteAddress,
+      };
+    },
+    res(res: any) {
+      // Remove potentially sensitive headers from logs
+      const headers = { ...res.headers };
+      delete headers['set-cookie'];
+      return {
+        statusCode: res.statusCode,
+        headers: headers, // Log filtered headers
+      };
+    },
+    err(err: any) {
+      return {
+        type: err.type,
+        message: err.message,
+        stack: err.stack,
+        // any other err properties you want to log
+      };
+    }
+  },
+  // Customize log message format
+  customSuccessMessage: function (req: any, res: any) {
+    if (res.statusCode === 404) {
+      return `${req.method} ${req.url} - ${res.statusCode} not found`;
+    }
+    return `${req.method} ${req.url} - ${res.statusCode} completed in ${(res as any).responseTime}ms`;
+  },
+  customErrorMessage: function (req: any, res: any, err: any) {
+    return `${req.method} ${req.url} - ${res.statusCode} error in ${(res as any).responseTime}ms: ${err.message}`;
+  },
+  // Add a custom attribute to all logs
+  customProps: function (req: any, res: any) {
+    return {
+      // Add any custom properties you want to log with every request
+      // example: reqId: req.id (if you're using request IDs)
+    };
+  }
+});
+
 // Global middleware
+app.use(pinoLogger); // Add pino-http logger as one of the first middleware
+app.use(performanceMiddleware()); // Track API request performance
 app.use(cookieParser());
 app.use(express.json());
 app.use(express.urlencoded({ extended: false }));
 
-// Request logging middleware for API routes
-// Request logging middleware for API routes
-// Uses express-mung to safely capture the JSON response body
-app.use(
-  mung.json(function (body, req, res) {
-    // Note: 'finish' event is used here as mung.json executes before the response is fully sent.
-    // For logging purposes, we want to log after the response is completed.
-    const start = Date.now();
-    const path = req.path;
-
-    res.on("finish", () => {
-      const duration = Date.now() - start;
-      if (path.startsWith("/api")) {
-        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
-        if (body) {
-          // body is the captured JSON response
-          logLine += ` :: ${JSON.stringify(body)}`;
-        }
-
-        if (logLine.length > 80) {
-          logLine = logLine.slice(0, 79) + "…";
-        }
-        console.log(logLine);
-      }
-    });
-    return body; // Important: return the body to pass it through
-  })
-);
+// Add health check endpoint
+app.get('/api/health', (req, res) => {
+  res.status(200).json({
+    status: 'healthy',
+    timestamp: new Date().toISOString(),
+    environment: process.env.NODE_ENV || 'development',
+    version: process.env.npm_package_version || 'unknown'
+  });
+});
 
 // Initialize app asynchronously
 let isAppInitialized = false;
@@ -63,6 +122,20 @@ async function initializeApp() {
   }
 
   console.log("🚀 Starting Express app initialization...");
+  
+  // Validate environment variables
+  try {
+    const env = validateEnv();
+    console.log("✅ Environment variables validated successfully");
+  } catch (error) {
+    console.error("❌ Environment validation failed:", error);
+    if (process.env.NODE_ENV === 'production') {
+      console.error("Exiting process due to invalid environment configuration in production.");
+      process.exit(1);
+    } else {
+      console.warn("⚠️ Continuing with invalid environment in development mode - some features may not work.");
+    }
+  }
 
   try {
     // Initialize database with sample data (commented out to prevent seeding)
@@ -81,7 +154,13 @@ async function initializeApp() {
       const status = err.status || err.statusCode || 500;
       const message = err.message || "Internal Server Error";
 
-      console.error(`❌ Global Error Handler: [${status}] ${message}`, err.stack ? { stack: err.stack } : { error: err });
+            // Use _req.log for structured logging if pino-http has attached it
+      if (_req.log) {
+        (_req as any).log.error({ err, status, req_id: (_req as any).id }, `Global Error Handler: ${message}`);
+      } else {
+        // Fallback to console.error if req.log is not available
+        console.error(`❌ Global Error Handler: [${status}] ${message}`, err.stack ? { stack: err.stack } : { error: err });
+      }
 
       res.status(status).json({ message });
     });
diff --git a/server/btcpayService.ts b/server/btcpayService.ts
index 0bb14e4..00f0c8c 100644
--- a/server/btcpayService.ts
+++ b/server/btcpayService.ts
@@ -7,11 +7,25 @@ import {
 import crypto from 'crypto';
 import { log } from './vite.js';
 import { btcpayConfig } from '../config/btcpay.js'; // Import configured storeId and webhookSecret
+import { CircuitBreaker } from './utils/circuitBreaker.js';
 
 // Constants
 const TICKET_PRICE_USD = 1.00; // Assuming $1 per ticket
 const CURRENCY = 'USD';
 
+// Create circuit breakers for BTCPay API calls
+const invoiceCreationBreaker = new CircuitBreaker('btcpay-invoice-creation', {
+  failureThreshold: 3,
+  resetTimeout: 30000, // 30 seconds
+  timeout: 10000 // 10 second timeout
+});
+
+const invoiceFetchBreaker = new CircuitBreaker('btcpay-invoice-fetch', {
+  failureThreshold: 5,  // More tolerant for read operations
+  resetTimeout: 15000,   // 15 seconds
+  timeout: 5000          // 5 second timeout
+});
+
 /**
  * Creates a BTCPay Server invoice for a raffle ticket purchase.
  *
@@ -32,6 +46,29 @@ export async function createRaffleTicketInvoice(
   raffleName: string,
   buyerEmail: string | undefined = undefined
 ): Promise<InvoiceData> {
+  // Add feature flag for bypassing BTCPay in emergency situations
+  if (process.env.BTCPAY_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
+    log('⚠️ BTCPay BYPASS mode active (non-production only) - returning mock invoice');
+    // Create mock invoice with appropriate type conversion
+    const mockInvoice = {
+      id: `mock-${Date.now()}`,
+      checkoutLink: `${process.env.BASE_URL || 'http://localhost:5000'}/mock-checkout/${ticketId}`,
+      status: InvoiceStatus.NEW,
+      amount: rafflePrice.toString(),
+      currency: CURRENCY,
+      createdTime: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
+      expirationTime: Math.floor(Date.now() / 1000) + 900, // 15 minutes from now
+      metadata: {
+        orderId: `raffle-${raffleId}-ticket-${ticketId}`,
+        itemDesc: `${raffleName} Ticket`,
+        buyerId: userId.toString(),
+        ticketId: ticketId.toString(),
+        raffleId: raffleId.toString(),
+      }
+    };
+    
+    return mockInvoice as InvoiceData;
+  }
   const orderId = `raffle-${raffleId}-ticket-${ticketId}`;
   const metadata: { [key: string]: string | number | boolean | object | null } = {
     orderId: orderId,
@@ -55,11 +92,15 @@ export async function createRaffleTicketInvoice(
 
   log(`Creating BTCPay invoice for ticket ${ticketId} (Raffle ${raffleId}) for user ${userId}`);
 
+  // Use circuit breaker for invoice creation
   try {
-    const invoice = await InvoicesService.invoicesCreateInvoice({ 
-      storeId: btcpayConfig.storeId, 
-      requestBody: invoiceRequest 
+    const invoice = await invoiceCreationBreaker.execute(async () => {
+      return await InvoicesService.invoicesCreateInvoice({ 
+        storeId: btcpayConfig.storeId, 
+        requestBody: invoiceRequest 
+      });
     });
+    
     log(`BTCPay invoice created: ${invoice.id} - Checkout: ${invoice.checkoutLink}`);
     return invoice;
   } catch (error) {
@@ -123,9 +164,11 @@ export function verifyWebhookSignature(
  */
 export async function getInvoice(invoiceId: string): Promise<InvoiceData | null> {
   try {
-    const invoice = await InvoicesService.invoicesGetInvoice({ 
-      storeId: btcpayConfig.storeId, 
-      invoiceId: invoiceId 
+    const invoice = await invoiceFetchBreaker.execute(async () => {
+      return await InvoicesService.invoicesGetInvoice({ 
+        storeId: btcpayConfig.storeId, 
+        invoiceId: invoiceId 
+      });
     });
     return invoice;
   } catch (error) {
@@ -184,4 +227,29 @@ export async function getInvoiceStatus(invoiceId: string): Promise<InvoiceStatus
 // - registerWebhook
 // - StoresService, ServerInfoService usage
 
-// TODO: Consider adding functions to handle refunds if needed later.
\ No newline at end of file
+// TODO: Consider adding functions to handle refunds if needed later.
+
+/**
+ * Get the health status of the BTCPay integration
+ * @returns Object containing health information and circuit status
+ */
+/**
+ * Get the health status of the BTCPay integration
+ * @returns Object containing health information and circuit status
+ */
+export function getBTCPayHealth(): any {
+  // Get BTCPay URL from environment variable directly since it's not in the config
+  const btcpayUrl = process.env.BTCPAY_URL || null;
+  
+  return {
+    serviceName: 'BTCPay Server',
+    endpoint: btcpayUrl ? new URL(btcpayUrl).origin : 'Not configured',
+    status: btcpayConfig.storeId ? 'Configured' : 'Not configured',
+    circuits: {
+      invoiceCreation: invoiceCreationBreaker.getState(),
+      invoiceFetch: invoiceFetchBreaker.getState()
+    },
+    storeId: btcpayConfig.storeId ? `${btcpayConfig.storeId.substring(0, 5)}...` : 'Missing',
+    webhook: btcpayConfig.webhookSecret ? 'Configured' : 'Not configured'
+  };
+}
\ No newline at end of file
diff --git a/server/routes.ts b/server/routes.ts
index 1bd836b..4d58545 100644
--- a/server/routes.ts
+++ b/server/routes.ts
@@ -106,6 +106,32 @@ export async function registerRoutes(app: Express, storageInstance: IStorage): P
   
   console.log('Registering routes for serverless deployment (WebSocket disabled)');
 
+  // --- Health Check Route ---
+  // This route should be accessible without authentication or CSRF for monitoring purposes.
+  app.get('/api/health', (req: Request, res: Response) => {
+    try {
+      // Optional: Add more checks here (e.g., database connectivity)
+      // For now, a simple 200 OK is sufficient.
+      res.status(200).json({
+        status: "ok",
+        timestamp: new Date().toISOString(),
+        // You can add more info like current git commit, version, etc.
+        // VERCEL_GIT_COMMIT_SHA is available in Vercel build environment
+        commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
+      });
+    } catch (error) {
+      // req.log might not be available if pino-http is added after this route
+      // or if this route is hit before pino-http initializes fully.
+      const log = (req as any).log || console;
+      log.error({ err: error }, 'Health check endpoint failed');
+      res.status(503).json({
+        status: "error",
+        message: "Health check failed",
+        error: error instanceof Error ? error.message : String(error),
+      });
+    }
+  });
+
   // Session middleware
   const usePgSession = false; // As per existing logic, but ensure SESSION_SECRET is strong
   const Store = usePgSession
diff --git a/tsconfig.server.json b/tsconfig.server.json
index 283eb75..65245c8 100644
--- a/tsconfig.server.json
+++ b/tsconfig.server.json
@@ -24,6 +24,12 @@
     "node_modules",
     "client",
     "dist",
-    "**/*.test.ts"
+    "**/*.test.ts",
+    "server/vite.ts",
+    "vite.config.ts",
+    "tailwind.config.ts",
+    "postcss.config.js",
+    "drizzle.config.ts",
+    "vitest.config.ts"
   ]
 } 
\ No newline at end of file
diff --git a/vercel.json b/vercel.json
index 2b77e80..d5121ab 100644
--- a/vercel.json
+++ b/vercel.json
@@ -1,19 +1,25 @@
 {
   "version": 2,
-  "buildCommand": "npm run build",
-  "outputDirectory": "dist",
-  "functions": {
-    "api/index.js": {
-      "runtime": "@vercel/node@3"
+  "builds": [
+    {
+      "src": "api/index.js",
+      "use": "@vercel/node"
+    },
+    {
+      "src": "package.json",
+      "use": "@vercel/static-build",
+      "config": {
+        "distDir": "dist"
+      }
     }
-  },
+  ],
   "rewrites": [
     {
       "source": "/api/(.*)",
       "destination": "/api/index.js"
     },
     {
-      "source": "/((?!api/|assets/|images/|css/|js/|favicon\\.ico|manifest\\.json|robots\\.txt|sw\\.js|index\\.html|_next/|static/).*)",
+      "source": "/(.*)",
       "destination": "/index.html"
     }
   ]
