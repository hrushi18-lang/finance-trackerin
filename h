[1mdiff --git a/index.html b/index.html[m
[1mindex e21104c..c9dc462 100644[m
[1m--- a/index.html[m
[1m+++ b/index.html[m
[36m@@ -64,7 +64,7 @@[m
     <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />[m
     <meta name="format-detection" content="telephone=no">[m
     <meta name="msapplication-tap-highlight" content="no">[m
[31m-    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; style-src 'self' 'unsafe-inline'; style-src-elem 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.exchangerate-api.com https://api.fixer.io; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none'; base-uri 'self'; form-action 'self';">[m
[32m+[m[32m    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; style-src 'self' 'unsafe-inline'; style-src-elem 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.exchangerate-api.com https://api.fixer.io https://www.googletagmanager.com; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com; script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self';">[m
     <title>FinTrack - Smart Financial Management</title>[m
     <meta name="description" content="Comprehensive financial management with multi-account tracking, smart recurring transactions, and AI-powered insights">[m
     <meta name="theme-color" content="#2563eb">[m
