import nextConfig from "eslint-config-next"

// Next.js already ships a flat ESLint config; export it directly to avoid compat issues.
const config = [...nextConfig]

export default config
