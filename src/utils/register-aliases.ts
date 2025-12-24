// // src/utils/register-aliases.ts
// import 'module-alias/register';
// import path from 'path';
// import { fileURLToPath } from 'url';

// // Get __dirname in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Calculate the base path (src folder)
// const basePath = path.resolve(__dirname, '..');

// // Register aliases for runtime
// import moduleAlias from 'module-alias';
// moduleAlias.addAliases({
//   '@': basePath,
//   '@config': path.join(basePath, 'config'),
//   '@lib': path.join(basePath, 'lib'),
//   '@utils': path.join(basePath, 'utils'),
//   '@services': path.join(basePath, 'services'),
//   '@middleware': path.join(basePath, 'middleware'),
//   '@types': path.join(basePath, 'types'),
// });

// // Optional: Log in development
// if (process.env.NODE_ENV === 'development') {
//   console.log('📁 Path aliases registered:');
//   console.log('   @ →', basePath);
// }